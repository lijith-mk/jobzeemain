const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const securityMiddleware = require('./middleware/security');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// Middleware
// ====================

// Request logging middleware
app.use(securityMiddleware.requestLogger);

// CORS middleware with enhanced configuration
app.use(cors(securityMiddleware.corsOptions));

// Apply security middlewares
securityMiddleware.apply(app);

// Body parsing middleware with enhanced error handling
app.use(express.json({ 
  limit: '10mb'
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  // Set a 30-second timeout for all requests
  req.setTimeout(30000, () => {
    console.error(`Request timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(408).json({ 
        success: false, 
        message: 'Request timeout',
        errorType: 'timeout'
      });
    }
  });
  
  // Set response timeout
  res.setTimeout(30000, () => {
    console.error(`Response timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(408).json({ 
        success: false, 
        message: 'Response timeout',
        errorType: 'timeout'
      });
    }
  });
  
  next();
});

// ====================
// Routes
// ====================
const authRoutes = require('./routes/authRoutes');
// const employerRoutes = require('./routes/employerRoutes');
// const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
// app.use('/api/employers', employerRoutes);
// app.use('/api/admin', adminRoutes);

// Cloudinary routes
// const uploadRoutes = require('./routes/uploadRoutes');
// app.use('/api/upload', uploadRoutes);

// Dashboard assets routes
// const dashboardAssetsRoutes = require('./routes/dashboardAssets');
// app.use('/api/dashboard', dashboardAssetsRoutes);

// Auto-logout endpoint
app.post('/api/auth/logout', (req, res) => {
  // This endpoint will be called when page is closed
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Simple database query test
    const testQuery = await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbState],
        connected: dbState === 1,
        ping: testQuery ? 'OK' : 'Failed'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'error',
        connected: false
      }
    });
  }
});

// Global error handler middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      errorType: 'parse_error'
    });
  }
  
  if (err.message.includes('Invalid JSON payload')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      errorType: 'json_error'
    });
  }
  
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorType: 'server_error'
    });
  }
});

// Handle 404 for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errorType: 'not_found'
  });
});

// ====================
// MongoDB Connection
// ====================
const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
  ? process.env.MONGODB_URI 
  : process.env.MONGO_URI;

// Enhanced MongoDB connection with better error handling
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second socket timeout
  maxPoolSize: 10 // Maintain up to 10 socket connections
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database URI:', mongoUri.replace(/:([^:@]{8})[^:@]*@/, ':***@')); // Hide password
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

// ====================
// Start Server
// ====================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
});

// Set server timeout
server.timeout = 30000; // 30 seconds
