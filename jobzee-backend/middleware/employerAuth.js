const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');

const employerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        errorType: 'no_token' 
      });
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
    
    // Check if the token is for an employer
    if (decoded.role !== 'employer') {
      return res.status(403).json({ 
        message: 'Access denied. Employer access required.',
        errorType: 'invalid_role' 
      });
    }

    const employer = await Employer.findById(decoded.id);
    
    if (!employer) {
      return res.status(401).json({ 
        message: 'Employer not found',
        errorType: 'employer_not_found' 
      });
    }

    if (!employer.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        errorType: 'account_deactivated' 
      });
    }

    req.employer = { 
      id: employer._id,
      companyName: employer.companyName,
      companyEmail: employer.companyEmail,
      role: employer.role,
      isVerified: employer.isVerified,
      subscriptionPlan: employer.subscriptionPlan
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        errorType: 'invalid_token' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        errorType: 'token_expired' 
      });
    }

    console.error('Employer auth middleware error:', err);
    res.status(500).json({ 
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Middleware to check if employer is verified
const requireVerification = (req, res, next) => {
  if (!req.employer.isVerified) {
    return res.status(403).json({
      message: 'Company verification required to access this feature',
      errorType: 'verification_required'
    });
  }
  next();
};

// Middleware to check subscription limits
const checkSubscriptionLimits = (feature) => {
  return async (req, res, next) => {
    try {
      const employer = await Employer.findById(req.employer.id);
      
      if (!employer) {
        return res.status(404).json({ message: 'Employer not found' });
      }

      // Check if subscription is active
      if (!employer.hasActiveSubscription()) {
        return res.status(403).json({
          message: 'Active subscription required',
          errorType: 'subscription_expired'
        });
      }

      // Feature-specific checks
      switch (feature) {
        case 'job_posting':
          if (!employer.canPostMoreJobs()) {
            return res.status(403).json({
              message: 'Job posting limit reached. Please upgrade your plan.',
              errorType: 'job_posting_limit_reached',
              currentUsage: employer.jobPostingsUsed,
              limit: employer.jobPostingLimit
            });
          }
          break;
        
        case 'premium_features':
          if (employer.subscriptionPlan === 'free') {
            return res.status(403).json({
              message: 'Premium subscription required for this feature',
              errorType: 'premium_required'
            });
          }
          break;
      }

      next();
    } catch (err) {
      console.error('Subscription check error:', err);
      res.status(500).json({
        message: 'Failed to verify subscription',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  };
};

module.exports = {
  employerAuth,
  requireVerification,
  checkSubscriptionLimits
};
