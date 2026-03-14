const express = require('express');
const { Receipt, Product, Warehouse, Stock, StockHistory } = require('../models');
const { notifyAllUsers } = require('../utils/notifier');

const router = express.Router();

// GET /api/receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(receipts);
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Failed to fetch receipts.' });
  }
});

// POST /api/receipts — create receipt
router.post('/', async (req, res) => {
  try {
    const { supplier, productId, warehouseId, quantity } = req.body;
    const receipt = await Receipt.create({ supplier, productId, warehouseId, quantity });

    const fullReceipt = await Receipt.findByPk(receipt.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
      ],
    });

    res.status(201).json(fullReceipt);
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ message: 'Failed to create receipt.' });
  }
});

// PUT /api/receipts/:id/validate — validate receipt (increase stock)
router.put('/:id/validate', async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
    if (receipt.status !== 'draft') return res.status(400).json({ message: 'Receipt already processed.' });

    // Find or create stock record
    let stock = await Stock.findOne({
      where: { productId: receipt.productId, warehouseId: receipt.warehouseId },
    });
    if (!stock) {
      stock = await Stock.create({
        productId: receipt.productId,
        warehouseId: receipt.warehouseId,
        quantity: 0,
      });
    }

    // Increase stock
    stock.quantity += receipt.quantity;
    await stock.save();

    // Log history
    await StockHistory.create({
      productId: receipt.productId,
      warehouseId: receipt.warehouseId,
      changeType: 'receipt',
      quantityChange: receipt.quantity,
      referenceId: receipt.id,
      notes: `Receipt from ${receipt.supplier}`,
    });

    // Mark as validated
    receipt.status = 'validated';
    await receipt.save();

    const p = await Product.findByPk(receipt.productId);
    await notifyAllUsers(
      'Stock Received',
      `Receipt #WH/IN/${String(receipt.id).padStart(4, '0')} validated. Added ${receipt.quantity} units of ${p ? p.name : 'Item'}.`,
      'success'
    );

    res.json({ message: 'Receipt validated. Stock increased.', receipt });
  } catch (error) {
    console.error('Validate receipt error:', error);
    res.status(500).json({ message: 'Failed to validate receipt.' });
  }
});

// PUT /api/receipts/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
    if (receipt.status !== 'draft') return res.status(400).json({ message: 'Only draft receipts can be cancelled.' });

    receipt.status = 'cancelled';
    await receipt.save();

    res.json({ message: 'Receipt cancelled.', receipt });
  } catch (error) {
    console.error('Cancel receipt error:', error);
    res.status(500).json({ message: 'Failed to cancel receipt.' });
  }
});

module.exports = router;
