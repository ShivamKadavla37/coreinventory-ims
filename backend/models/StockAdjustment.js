const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StockAdjustment = sequelize.define('StockAdjustment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
  },
  warehouseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'warehouse_id',
  },
  oldQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'old_quantity',
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'new_quantity',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'stock_adjustments',
  timestamps: true,
});

module.exports = StockAdjustment;
