const express = require('express');
const { Op } = require('sequelize');
const { Product, Stock, Warehouse, StockAdjustment, StockHistory } = require('../models');

const router = express.Router();

// GET /api/products — list all products with total stock
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Stock, as: 'stocks', include: [{ model: Warehouse, as: 'warehouse' }] }],
      order: [['createdAt', 'DESC']],
    });

    const result = products.map(p => {
      const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...p.toJSON(),
        totalStock,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id — get product with stock per location
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Stock, as: 'stocks', include: [{ model: Warehouse, as: 'warehouse' }] }],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

    res.json({ ...product.toJSON(), totalStock });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
});

// POST /api/products — create a product
router.post('/', async (req, res) => {
  try {
    const { name, sku, category, unit, description, minStock, initialStock, initialWarehouseId } = req.body;

    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists.' });
    }

    const product = await Product.create({ name, sku, category, unit, description, minStock: minStock || 10 });

    // Create stock entries for all existing warehouses
    const warehouses = await Warehouse.findAll();
    let seeded = false;
    for (const warehouse of warehouses) {
      let qty = 0;
      if (initialStock > 0 && String(warehouse.id) === String(initialWarehouseId)) {
        qty = parseInt(initialStock);
        seeded = true;
      }
      const stock = await Stock.create({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: qty,
      });

      if (qty > 0) {
        const adj = await StockAdjustment.create({
          productId: product.id,
          warehouseId: warehouse.id,
          oldQuantity: 0,
          newQuantity: qty,
          reason: 'Initial stock on creation',
        });
        await StockHistory.create({
          productId: product.id,
          warehouseId: warehouse.id,
          changeType: 'adjustment',
          quantityChange: qty,
          referenceId: adj.id,
          notes: 'Initial stock on creation',
        });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

// PUT /api/products/:id — update a product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const { name, sku, category, unit, description, minStock } = req.body;
    await product.update({ name, sku, category, unit, description, minStock });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id — delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await Stock.destroy({ where: { productId: product.id } });
    await product.destroy();

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

module.exports = router;
