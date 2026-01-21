const rateLimit = require('express-rate-limit');

// General rate limiter for API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorType: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints (login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
    errorType: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again in 1 hour.',
    errorType: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin rate limiter - configurable via env
// Defaults: 10 attempts per 5 minutes
const ADMIN_WINDOW_MINUTES = parseInt(process.env.ADMIN_RATE_WINDOW_MINUTES || '5', 10);
const ADMIN_MAX_ATTEMPTS = parseInt(process.env.ADMIN_RATE_MAX_ATTEMPTS || '10', 10);

const adminLimiter = rateLimit({
  windowMs: ADMIN_WINDOW_MINUTES * 60 * 1000,
  max: ADMIN_MAX_ATTEMPTS,
  message: {
    success: false,
    message: `Too many admin login attempts from this IP, please try again in ${ADMIN_WINDOW_MINUTES} minutes.`,
    errorType: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts from this IP, please try again later.',
    errorType: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  adminLimiter,
  uploadLimiter
};
