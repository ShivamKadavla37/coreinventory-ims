const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transfer = sequelize.define('Transfer', {
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
  fromWarehouseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'from_warehouse_id',
  },
  toWarehouseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'to_warehouse_id',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'validated', 'cancelled'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'transfers',
  timestamps: true,
});

module.exports = Transfer;
