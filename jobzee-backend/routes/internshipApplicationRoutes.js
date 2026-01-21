const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');

// Simple validation middleware
const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
const {
  getEmployerApplications,
  getUserApplications,
  updateApplicationStatus,
  getApplicationDetails,
  withdrawApplication,
  getApplicationStatistics
} = require('../controllers/internshipApplicationController');

// Validation schemas
const statusUpdateValidation = [
  param('applicationId').isMongoId().withMessage('Invalid application ID'),
  body('status')
    .isIn(['reviewed', 'shortlisted', 'interview', 'selected', 'rejected'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validate
];

const applicationIdValidation = [
  param('applicationId').isMongoId().withMessage('Invalid application ID'),
  validate
];

// Middleware to allow both user and employer authentication
const allowUserOrEmployer = (req, res, next) => {
  // Try user auth first
  auth(req, res, (userErr) => {
    if (!userErr) {
      req.userType = 'user';
      req.userId = req.user.id;
      return next(); // User authenticated successfully
    }
    
    // Try employer auth if user auth failed
    employerAuth(req, res, (employerErr) => {
      if (!employerErr) {
        req.userType = 'employer';
        req.userId = req.employer.id;
        return next(); // Employer authenticated successfully
      }
      
      // Both authentications failed
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    });
  });
};

// Common routes (both user and employer)
router.get('/:applicationId', allowUserOrEmployer, applicationIdValidation, getApplicationDetails);

// User routes
router.get('/user/my-applications', auth, getUserApplications);
router.delete('/:applicationId/withdraw', auth, applicationIdValidation, withdrawApplication);

// Employer routes
router.get('/employer/all', employerAuth, getEmployerApplications);
router.patch('/:applicationId/status', employerAuth, statusUpdateValidation, updateApplicationStatus);
router.get('/employer/stats', employerAuth, getApplicationStatistics);

module.exports = router;