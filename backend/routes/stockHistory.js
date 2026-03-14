const express = require('express');
const { StockHistory, Product, Warehouse } = require('../models');

const router = express.Router();

// GET /api/stock-history
router.get('/', async (req, res) => {
  try {
    const { productId, warehouseId, changeType } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (changeType) where.changeType = changeType;

    const history = await StockHistory.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    res.json(history);
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ message: 'Failed to fetch stock history.' });
  }
});

module.exports = router;
