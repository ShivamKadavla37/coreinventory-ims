const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'pcs',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'min_stock',
  },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
