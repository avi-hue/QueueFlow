const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const customerRoutes = require('./routes/customerRoutes');
const queueRoutes = require('./routes/queueRoutes');

const app = express();

// Simple CORS and JSON parsing for prototype
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      message: 'QueueFlow API (Prototype) is healthy and operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0-prototype'
    }
  });
});

// Mount module routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/businesses', customerRoutes);
app.use('/api/v1/queue', queueRoutes);


// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
