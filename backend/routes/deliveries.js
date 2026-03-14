const express = require('express');
const { Delivery, Product, Warehouse, Stock, StockHistory } = require('../models');
const { notifyAllUsers } = require('../utils/notifier');

const router = express.Router();

// GET /api/deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(deliveries);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries.' });
  }
});

// POST /api/deliveries
router.post('/', async (req, res) => {
  try {
    const { customer, productId, warehouseId, quantity } = req.body;
    const delivery = await Delivery.create({ customer, productId, warehouseId, quantity });

    const fullDelivery = await Delivery.findByPk(delivery.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
    });

    res.status(201).json(fullDelivery);
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ message: 'Failed to create delivery.' });
  }
});

// PUT /api/deliveries/:id/validate — validate delivery (decrease stock)
router.put('/:id/validate', async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });
    if (delivery.status !== 'draft') return res.status(400).json({ message: 'Delivery already processed.' });

    const stock = await Stock.findOne({
      where: { productId: delivery.productId, warehouseId: delivery.warehouseId },
    });

    if (!stock || stock.quantity < delivery.quantity) {
      return res.status(400).json({ message: 'Insufficient stock for delivery.' });
    }

    // Decrease stock
    stock.quantity -= delivery.quantity;
    await stock.save();

    // Log history
    await StockHistory.create({
      productId: delivery.productId,
      warehouseId: delivery.warehouseId,
      changeType: 'delivery',
      quantityChange: -delivery.quantity,
      referenceId: delivery.id,
      notes: `Delivery to ${delivery.customer}`,
    });

    delivery.status = 'validated';
    await delivery.save();

    const p = await Product.findByPk(delivery.productId);
    await notifyAllUsers(
      'Products Delivered',
      `Delivery #WH/OUT/${String(delivery.id).padStart(4, '0')} validated. Shipped ${delivery.quantity} units of ${p ? p.name : 'Item'} to ${delivery.customer}.`,
      'info'
    );

    res.json({ message: 'Delivery validated. Stock decreased.', delivery });
  } catch (error) {
    console.error('Validate delivery error:', error);
    res.status(500).json({ message: 'Failed to validate delivery.' });
  }
});

// PUT /api/deliveries/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });
    if (delivery.status !== 'draft') return res.status(400).json({ message: 'Only draft deliveries can be cancelled.' });

    delivery.status = 'cancelled';
    await delivery.save();

    res.json({ message: 'Delivery cancelled.', delivery });
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(500).json({ message: 'Failed to cancel delivery.' });
  }
});

module.exports = router;
