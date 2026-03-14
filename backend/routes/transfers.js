const express = require('express');
const { Transfer, Product, Warehouse, Stock, StockHistory } = require('../models');

const router = express.Router();

// GET /api/transfers
router.get('/', async (req, res) => {
  try {
    const transfers = await Transfer.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ message: 'Failed to fetch transfers.' });
  }
});

// POST /api/transfers
router.post('/', async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ message: 'Source and destination warehouses must differ.' });
    }

    const transfer = await Transfer.create({ productId, fromWarehouseId, toWarehouseId, quantity });

    const fullTransfer = await Transfer.findByPk(transfer.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' },
      ],
    });

    res.status(201).json(fullTransfer);
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ message: 'Failed to create transfer.' });
  }
});

// PUT /api/transfers/:id/validate
router.put('/:id/validate', async (req, res) => {
  try {
    const transfer = await Transfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found.' });
    if (transfer.status !== 'draft') return res.status(400).json({ message: 'Transfer already processed.' });

    // Check source stock
    const fromStock = await Stock.findOne({
      where: { productId: transfer.productId, warehouseId: transfer.fromWarehouseId },
    });

    if (!fromStock || fromStock.quantity < transfer.quantity) {
      return res.status(400).json({ message: 'Insufficient stock at source warehouse.' });
    }

    // Decrease from source
    fromStock.quantity -= transfer.quantity;
    await fromStock.save();

    // Increase at destination
    let toStock = await Stock.findOne({
      where: { productId: transfer.productId, warehouseId: transfer.toWarehouseId },
    });
    if (!toStock) {
      toStock = await Stock.create({
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
        quantity: 0,
      });
    }
    toStock.quantity += transfer.quantity;
    await toStock.save();

    // Log history — two entries
    await StockHistory.create({
      productId: transfer.productId,
      warehouseId: transfer.fromWarehouseId,
      changeType: 'transfer_out',
      quantityChange: -transfer.quantity,
      referenceId: transfer.id,
      notes: `Transfer out`,
    });

    await StockHistory.create({
      productId: transfer.productId,
      warehouseId: transfer.toWarehouseId,
      changeType: 'transfer_in',
      quantityChange: transfer.quantity,
      referenceId: transfer.id,
      notes: `Transfer in`,
    });

    transfer.status = 'validated';
    await transfer.save();

    res.json({ message: 'Transfer validated successfully.', transfer });
  } catch (error) {
    console.error('Validate transfer error:', error);
    res.status(500).json({ message: 'Failed to validate transfer.' });
  }
});

// PUT /api/transfers/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const transfer = await Transfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found.' });
    if (transfer.status !== 'draft') return res.status(400).json({ message: 'Only draft transfers can be cancelled.' });

    transfer.status = 'cancelled';
    await transfer.save();

    res.json({ message: 'Transfer cancelled.', transfer });
  } catch (error) {
    console.error('Cancel transfer error:', error);
    res.status(500).json({ message: 'Failed to cancel transfer.' });
  }
});

module.exports = router;
