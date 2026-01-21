const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token, authorization denied',
      errorType: 'NO_TOKEN'
    });
  }

  // Enforce JWT_SECRET environment variable
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set!');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      errorType: 'SERVER_CONFIG_ERROR'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    let errorType = 'INVALID_TOKEN';
    let message = 'Token is not valid';
    
    if (error.name === 'TokenExpiredError') {
      errorType = 'TOKEN_EXPIRED';
      message = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'MALFORMED_TOKEN';
      message = 'Malformed token';
    }
    
    res.status(401).json({ 
      success: false,
      message,
      errorType
    });
  }
};

module.exports = auth;
