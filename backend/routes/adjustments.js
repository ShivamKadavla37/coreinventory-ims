const express = require('express');
const { StockAdjustment, Product, Warehouse, Stock, StockHistory } = require('../models');

const router = express.Router();

// GET /api/adjustments
router.get('/', async (req, res) => {
  try {
    const adjustments = await StockAdjustment.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(adjustments);
  } catch (error) {
    console.error('Get adjustments error:', error);
    res.status(500).json({ message: 'Failed to fetch adjustments.' });
  }
});

// POST /api/adjustments — create and apply adjustment
router.post('/', async (req, res) => {
  try {
    const { productId, warehouseId, newQuantity, reason } = req.body;

    let stock = await Stock.findOne({ where: { productId, warehouseId } });
    if (!stock) {
      stock = await Stock.create({ productId, warehouseId, quantity: 0 });
    }

    const oldQuantity = stock.quantity;
    const quantityChange = newQuantity - oldQuantity;

    // Create adjustment record
    const adjustment = await StockAdjustment.create({
      productId,
      warehouseId,
      oldQuantity,
      newQuantity,
      reason,
    });

    // Update stock
    stock.quantity = newQuantity;
    await stock.save();

    // Log history
    await StockHistory.create({
      productId,
      warehouseId,
      changeType: 'adjustment',
      quantityChange,
      referenceId: adjustment.id,
      notes: reason || 'Stock adjustment',
    });

    const fullAdjustment = await StockAdjustment.findByPk(adjustment.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
    });

    res.status(201).json(fullAdjustment);
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ message: 'Failed to create adjustment.' });
  }
});

module.exports = router;
