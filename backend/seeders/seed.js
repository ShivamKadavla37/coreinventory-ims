const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sequelize, User, Product, Warehouse, Stock, Receipt, Delivery, Transfer, StockHistory } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated).');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await User.create({ name: 'Admin User', email: 'admin@coreinventory.com', password: hashedPassword, role: 'admin' });
    await User.create({ name: 'John Manager', email: 'john@coreinventory.com', password: hashedPassword, role: 'manager' });
    await User.create({ name: 'Jane Staff', email: 'jane@coreinventory.com', password: hashedPassword, role: 'staff' });
    console.log('✅ Users seeded.');

    // Create warehouses
    const wh1 = await Warehouse.create({ name: 'Main Warehouse', location: 'Mumbai, India' });
    const wh2 = await Warehouse.create({ name: 'North Hub', location: 'Delhi, India' });
    const wh3 = await Warehouse.create({ name: 'South Hub', location: 'Bangalore, India' });
    console.log('✅ Warehouses seeded.');

    // Create products
    const products = await Product.bulkCreate([
      { name: 'Laptop Dell XPS 15', sku: 'ELEC-001', category: 'Electronics', unit: 'pcs' },
      { name: 'Wireless Mouse', sku: 'ELEC-002', category: 'Electronics', unit: 'pcs' },
      { name: 'USB-C Hub', sku: 'ELEC-003', category: 'Electronics', unit: 'pcs' },
      { name: 'Monitor 27"', sku: 'ELEC-004', category: 'Electronics', unit: 'pcs' },
      { name: 'Mechanical Keyboard', sku: 'ELEC-005', category: 'Electronics', unit: 'pcs' },
      { name: 'Office Chair', sku: 'FURN-001', category: 'Furniture', unit: 'pcs' },
      { name: 'Standing Desk', sku: 'FURN-002', category: 'Furniture', unit: 'pcs' },
      { name: 'Filing Cabinet', sku: 'FURN-003', category: 'Furniture', unit: 'pcs' },
      { name: 'A4 Paper (Ream)', sku: 'SUPP-001', category: 'Supplies', unit: 'ream' },
      { name: 'Ink Cartridge', sku: 'SUPP-002', category: 'Supplies', unit: 'pcs' },
      { name: 'Whiteboard Marker', sku: 'SUPP-003', category: 'Supplies', unit: 'box' },
      { name: 'Hand Sanitizer', sku: 'HYGI-001', category: 'Hygiene', unit: 'bottle' },
    ]);
    console.log('✅ Products seeded.');

    // Create stock entries
    const stockData = [
      // Main Warehouse - good stock
      { productId: products[0].id, warehouseId: wh1.id, quantity: 45 },
      { productId: products[1].id, warehouseId: wh1.id, quantity: 120 },
      { productId: products[2].id, warehouseId: wh1.id, quantity: 75 },
      { productId: products[3].id, warehouseId: wh1.id, quantity: 30 },
      { productId: products[4].id, warehouseId: wh1.id, quantity: 50 },
      { productId: products[5].id, warehouseId: wh1.id, quantity: 20 },
      { productId: products[6].id, warehouseId: wh1.id, quantity: 15 },
      { productId: products[7].id, warehouseId: wh1.id, quantity: 8 },  // Low stock!
      { productId: products[8].id, warehouseId: wh1.id, quantity: 200 },
      { productId: products[9].id, warehouseId: wh1.id, quantity: 5 },  // Low stock!
      { productId: products[10].id, warehouseId: wh1.id, quantity: 35 },
      { productId: products[11].id, warehouseId: wh1.id, quantity: 60 },
      // North Hub
      { productId: products[0].id, warehouseId: wh2.id, quantity: 20 },
      { productId: products[1].id, warehouseId: wh2.id, quantity: 50 },
      { productId: products[2].id, warehouseId: wh2.id, quantity: 3 },  // Low stock!
      { productId: products[3].id, warehouseId: wh2.id, quantity: 12 },
      { productId: products[5].id, warehouseId: wh2.id, quantity: 7 },  // Low stock!
      { productId: products[8].id, warehouseId: wh2.id, quantity: 80 },
      // South Hub
      { productId: products[0].id, warehouseId: wh3.id, quantity: 10 },
      { productId: products[1].id, warehouseId: wh3.id, quantity: 30 },
      { productId: products[4].id, warehouseId: wh3.id, quantity: 25 },
      { productId: products[6].id, warehouseId: wh3.id, quantity: 2 },  // Low stock!
      { productId: products[9].id, warehouseId: wh3.id, quantity: 40 },
      { productId: products[11].id, warehouseId: wh3.id, quantity: 100 },
    ];

    await Stock.bulkCreate(stockData);
    console.log('✅ Stock seeded.');

    // Create sample receipts
    await Receipt.bulkCreate([
      { supplier: 'Dell India', productId: products[0].id, warehouseId: wh1.id, quantity: 20, status: 'validated' },
      { supplier: 'Logitech', productId: products[1].id, warehouseId: wh2.id, quantity: 50, status: 'validated' },
      { supplier: 'Dell India', productId: products[3].id, warehouseId: wh1.id, quantity: 10, status: 'draft' },
      { supplier: 'Office Mart', productId: products[5].id, warehouseId: wh3.id, quantity: 15, status: 'draft' },
      { supplier: 'Paper World', productId: products[8].id, warehouseId: wh1.id, quantity: 100, status: 'draft' },
    ]);
    console.log('✅ Receipts seeded.');

    // Create sample deliveries
    await Delivery.bulkCreate([
      { customer: 'TechCorp', productId: products[0].id, warehouseId: wh1.id, quantity: 5, status: 'validated' },
      { customer: 'StartupXYZ', productId: products[1].id, warehouseId: wh1.id, quantity: 20, status: 'draft' },
      { customer: 'BigRetail', productId: products[4].id, warehouseId: wh3.id, quantity: 10, status: 'draft' },
    ]);
    console.log('✅ Deliveries seeded.');

    // Create sample transfers
    await Transfer.bulkCreate([
      { productId: products[0].id, fromWarehouseId: wh1.id, toWarehouseId: wh2.id, quantity: 5, status: 'draft' },
      { productId: products[1].id, fromWarehouseId: wh2.id, toWarehouseId: wh3.id, quantity: 10, status: 'draft' },
    ]);
    console.log('✅ Transfers seeded.');

    // Create stock history
    await StockHistory.bulkCreate([
      { productId: products[0].id, warehouseId: wh1.id, changeType: 'receipt', quantityChange: 20, referenceId: 1, notes: 'Initial stock from Dell India' },
      { productId: products[1].id, warehouseId: wh2.id, changeType: 'receipt', quantityChange: 50, referenceId: 2, notes: 'Bulk order from Logitech' },
      { productId: products[0].id, warehouseId: wh1.id, changeType: 'delivery', quantityChange: -5, referenceId: 1, notes: 'Delivered to TechCorp' },
    ]);
    console.log('✅ Stock history seeded.');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@coreinventory.com / password123');
    console.log('  Manager: john@coreinventory.com / password123');
    console.log('  Staff: jane@coreinventory.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
