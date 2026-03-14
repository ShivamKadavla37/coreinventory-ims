const sequelize = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Warehouse = require('./Warehouse');
const Stock = require('./Stock');
const Receipt = require('./Receipt');
const Delivery = require('./Delivery');
const Transfer = require('./Transfer');
const StockAdjustment = require('./StockAdjustment');
const StockHistory = require('./StockHistory');
const Notification = require('./Notification');

// Stock belongs to Product and Warehouse
Product.hasMany(Stock, { foreignKey: 'product_id', as: 'stocks' });
Stock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(Stock, { foreignKey: 'warehouse_id', as: 'stocks' });
Stock.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// Receipt associations
Product.hasMany(Receipt, { foreignKey: 'product_id' });
Receipt.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(Receipt, { foreignKey: 'warehouse_id' });
Receipt.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// Delivery associations
Product.hasMany(Delivery, { foreignKey: 'product_id' });
Delivery.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(Delivery, { foreignKey: 'warehouse_id' });
Delivery.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// Transfer associations
Product.hasMany(Transfer, { foreignKey: 'product_id' });
Transfer.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(Transfer, { foreignKey: 'from_warehouse_id', as: 'outgoingTransfers' });
Transfer.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });

Warehouse.hasMany(Transfer, { foreignKey: 'to_warehouse_id', as: 'incomingTransfers' });
Transfer.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });

// StockAdjustment associations
Product.hasMany(StockAdjustment, { foreignKey: 'product_id' });
StockAdjustment.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(StockAdjustment, { foreignKey: 'warehouse_id' });
StockAdjustment.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// StockHistory associations
Product.hasMany(StockHistory, { foreignKey: 'product_id' });
StockHistory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(StockHistory, { foreignKey: 'warehouse_id' });
StockHistory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

module.exports = {
  sequelize,
  User,
  Product,
  Warehouse,
  Stock,
  Receipt,
  Delivery,
  Transfer,
  StockAdjustment,
  StockHistory,
  Notification,
};
