const express = require('express');
const { Warehouse, Stock, Product } = require('../models');

const router = express.Router();

// GET /api/warehouses
router.get('/', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const warehouses = await Warehouse.findAll({
      where: {
        name: { [Op.ne]: '' },
      },
      include: [{ model: Stock, as: 'stocks', include: [{ model: Product, as: 'product' }] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ message: 'Failed to fetch warehouses.' });
  }
});

// POST /api/warehouses
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;
    
    if (!name || !name.trim() || !location || !location.trim()) {
      return res.status(400).json({ message: 'Warehouse name and location are required.' });
    }

    const warehouse = await Warehouse.create({ name, location });

    // Create stock entries for all existing products
    const products = await Product.findAll();
    for (const product of products) {
      await Stock.create({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 0,
      });
    }

    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ message: 'Failed to create warehouse.' });
  }
});

module.exports = router;
