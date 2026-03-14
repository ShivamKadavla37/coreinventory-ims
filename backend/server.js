const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const auth = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const warehouseRoutes = require('./routes/warehouses');
const receiptRoutes = require('./routes/receipts');
const deliveryRoutes = require('./routes/deliveries');
const transferRoutes = require('./routes/transfers');
const adjustmentRoutes = require('./routes/adjustments');
const stockHistoryRoutes = require('./routes/stockHistory');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/products', auth, productRoutes);
app.use('/api/warehouses', auth, warehouseRoutes);
app.use('/api/receipts', auth, receiptRoutes);
app.use('/api/deliveries', auth, deliveryRoutes);
app.use('/api/transfers', auth, transferRoutes);
app.use('/api/adjustments', auth, adjustmentRoutes);
app.use('/api/stock-history', auth, stockHistoryRoutes);
app.use('/api/notifications', auth, notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
