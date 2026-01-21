const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Enforce JWT_SECRET environment variable
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET environment variable is not set!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        errorType: 'server_config_error'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Invalid token. Admin not found.' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Admin account is deactivated.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check specific permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.permissions[permission]) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Alias for adminAuth for backward compatibility
const isAdmin = adminAuth;

module.exports = {
  adminAuth,
  checkPermission,
  isAdmin
};
