const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Product, Stock, Warehouse, Receipt, Delivery, Transfer, StockHistory } = require('../models');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const { docType, status, warehouseId, category } = req.query;

    const productWhere = {};
    if (category) productWhere.category = category;
    
    const products = await Product.findAll({
      where: productWhere,
      include: [
        {
          model: Stock,
          as: 'stocks',
          where: warehouseId ? { warehouseId } : undefined,
          required: false // We need all products even if they have no stock record
        }
      ]
    });

    const totalProducts = products.length;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalStock = 0;

    products.forEach(p => {
      let qty = 0;
      if (p.stocks && p.stocks.length > 0) {
        qty = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      }
      totalStock += qty;

      const minStock = p.minStock || 10;
      if (qty <= 0) {
        outOfStockItems++;
      } else if (qty > 0 && qty < minStock) {
        lowStockItems++;
      }
    });

    const productIds = products.map(p => p.id);

    const opWhere = {};
    if (status) {
      opWhere.status = status;
    }

    const reqDocType = docType || '';

    let pendingReceipts = 0;
    let pendingReceiptsQty = 0;
    if (reqDocType === '' || reqDocType === 'receipt') {
      const rcptWhere = { ...opWhere };
      if (warehouseId) rcptWhere.warehouseId = warehouseId;
      if (productIds.length > 0) rcptWhere.productId = { [Op.in]: productIds };
      if (productIds.length > 0 || !category) {
         pendingReceipts = await Receipt.count({ where: rcptWhere });
         pendingReceiptsQty = await Receipt.sum('quantity', { where: rcptWhere }) || 0;
      }
    }

    let pendingDeliveries = 0;
    let pendingDeliveriesQty = 0;
    if (reqDocType === '' || reqDocType === 'delivery') {
      const dlvWhere = { ...opWhere };
      if (warehouseId) dlvWhere.warehouseId = warehouseId;
      if (productIds.length > 0) dlvWhere.productId = { [Op.in]: productIds };
      if (productIds.length > 0 || !category) {
         pendingDeliveries = await Delivery.count({ where: dlvWhere });
         pendingDeliveriesQty = await Delivery.sum('quantity', { where: dlvWhere }) || 0;
      }
    }

    let pendingTransfers = 0;
    let pendingTransfersQty = 0;
    if (reqDocType === '' || reqDocType === 'transfer') {
      const trnWhere = { ...opWhere };
      if (warehouseId) {
        trnWhere[Op.or] = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
      }
      if (productIds.length > 0) trnWhere.productId = { [Op.in]: productIds };
      if (productIds.length > 0 || !category) {
        pendingTransfers = await Transfer.count({ where: trnWhere });
        pendingTransfersQty = await Transfer.sum('quantity', { where: trnWhere }) || 0;
      }
    }

    const historyWhere = {};
    if (warehouseId) historyWhere.warehouseId = warehouseId;
    if (productIds.length > 0) historyWhere.productId = { [Op.in]: productIds };

    let kpis = { receipt: 0, delivery: 0, transfer_in: 0, transfer_out: 0, adjustment: 0 };
    if (productIds.length > 0 || !category) {
      const historySummary = await StockHistory.findAll({
        where: historyWhere,
        attributes: [
          'changeType',
          [sequelize.fn('SUM', sequelize.col('quantity_change')), 'total'],
        ],
        group: ['changeType'],
      });

      historySummary.forEach(h => {
        kpis[h.changeType] = Math.abs(parseInt(h.dataValues.total || 0));
      });
    }

    const warehouseCount = await Warehouse.count({ where: { name: { [Op.ne]: '' } } });

    res.json({
      totalProducts,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingReceiptsQty,
      pendingDeliveries,
      pendingDeliveriesQty,
      pendingTransfers,
      pendingTransfersQty,
      totalStock,
      kpis,
      warehouseCount,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
});

// GET /api/dashboard/chart — stock distribution by warehouse
router.get('/chart', async (req, res) => {
  try {
    const { category, warehouseId } = req.query;

    const warehouses = await Warehouse.findAll({
      where: warehouseId ? { id: warehouseId, name: { [Op.ne]: '' } } : { name: { [Op.ne]: '' } },
      include: [{ 
        model: Stock, 
        as: 'stocks',
        include: category ? [{ model: Product, as: 'product', where: { category } }] : []
      }],
      order: [['id', 'ASC']]
    });

    const labels = warehouses.map(w => w.name || 'Unknown');
    const data = warehouses.map(w => {
      return w.stocks.reduce((sum, s) => {
        if (category && s.product && s.product.category !== category) return sum;
        return sum + s.quantity;
      }, 0);
    });

    // Recent stock movements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const historyWhere = { createdAt: { [Op.gte]: sevenDaysAgo } };
    if (warehouseId) historyWhere.warehouseId = warehouseId;

    const recentHistory = await StockHistory.findAll({
      where: historyWhere,
      attributes: [
        'changeType',
        [sequelize.fn('SUM', sequelize.col('quantity_change')), 'total'],
      ],
      group: ['changeType'],
    });

    const movementLabels = [];
    const movementData = [];
    recentHistory.forEach(h => {
      movementLabels.push(h.changeType);
      movementData.push(Math.abs(parseInt(h.dataValues.total || 0)));
    });

    res.json({
      stockByWarehouse: { labels, data },
      recentMovements: { labels: movementLabels, data: movementData },
    });
  } catch (error) {
    console.error('Dashboard chart error:', error);
    res.status(500).json({ message: 'Failed to fetch chart data.' });
  }
});

// GET /api/dashboard/low-stock — low stock alerts
router.get('/low-stock', async (req, res) => {
  try {
    const { category, warehouseId } = req.query;
    const productWhere = category ? { category } : {};
    const stockWhere = warehouseId ? { warehouseId } : {};

    const lowStockItems = await Stock.findAll({
      where: stockWhere,
      include: [
        { model: Product, as: 'product', where: productWhere, required: true },
        { model: Warehouse, as: 'warehouse', where: { name: { [Op.ne]: '' } }, required: true },
      ],
    });

    // filter items where quantity < product.minStock (or 10 as fallback)
    const actualLowStock = lowStockItems.filter(item => item.quantity < (item.product.minStock || 10));

    // sort ascending by quantity
    actualLowStock.sort((a, b) => a.quantity - b.quantity);

    res.json(actualLowStock);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ message: 'Failed to fetch low stock alerts.' });
  }
});

module.exports = router;
