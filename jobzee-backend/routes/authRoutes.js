const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  updateOnboarding, 
  getProfile, 
  updateProfile, 
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const { reportJob } = require('../controllers/jobController');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Authentication routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);

// Password reset routes - temporarily disable rate limiting for debugging
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Profile and onboarding routes
router.put('/onboarding/:userId', updateOnboarding);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;

// Job reporting (authenticated users)
router.post('/jobs/:jobId/report', auth, reportJob);
