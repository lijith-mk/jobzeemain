const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Security middleware collection for JobZee application
 */
const securityMiddleware = {
  
  /**
   * Apply all security middlewares
   */
  apply: (app) => {
    // Security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5000"]
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // Prevent HTTP Parameter Pollution
    app.use(hpp());
    
    // Sanitize user input to prevent NoSQL injection attacks
    app.use(mongoSanitize());
    
    console.log('✅ Security middlewares applied');
  },

  /**
   * CORS configuration for production
   */
  corsOptions: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Add your production domains here:
        // 'https://yourdomain.com',
        // 'https://www.yourdomain.com'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
  },

  /**
   * Enhanced logging middleware
   */
  requestLogger: (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - UA: ${userAgent}`);
    
    // Log sensitive operations
    if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/reset-password')) {
      console.log(`🔐 Security-sensitive operation: ${req.method} ${req.url} from ${ip}`);
    }
    
    next();
  }
};

module.exports = securityMiddleware;
