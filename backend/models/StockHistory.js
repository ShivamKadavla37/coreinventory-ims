const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StockHistory = sequelize.define('StockHistory', {
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
  changeType: {
    type: DataTypes.ENUM('receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment'),
    allowNull: false,
    field: 'change_type',
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quantity_change',
  },
  referenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reference_id',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'stock_history',
  timestamps: true,
});

module.exports = StockHistory;
