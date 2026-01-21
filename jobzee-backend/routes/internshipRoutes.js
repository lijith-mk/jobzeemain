const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Middleware imports
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');

// Controller imports
const {
  getAllInternships,
  getInternshipById,
  createInternship,
  getEmployerInternships,
  updateInternshipStatus,
  updateInternship,
  deleteInternship,
  getCategories,
  searchInternships
} = require('../controllers/internshipController');

const {
  applyForInternship,
  getInternshipApplications
} = require('../controllers/internshipApplicationController');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
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

// Validation middleware
const createInternshipValidation = [
  body('title')
    .notEmpty()
    .withMessage('Internship title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
    
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
    
  body('location')
    .notEmpty()
    .withMessage('Location is required'),
    
  body('duration')
    .isInt({ min: 1, max: 12 })
    .withMessage('Duration must be between 1 and 12 months'),
    
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
    
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Valid application deadline is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      if (new Date(value) >= new Date(req.body.startDate)) {
        throw new Error('Application deadline must be before start date');
      }
      return true;
    }),
    
  body('category')
    .isIn(['technology', 'marketing', 'finance', 'hr', 'design', 'content', 'operations', 'consulting', 'research', 'other'])
    .withMessage('Valid category is required'),
    
  body('numberOfPositions')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of positions must be at least 1'),
    
  body('locationType')
    .optional()
    .isIn(['on-site', 'remote', 'hybrid'])
    .withMessage('Location type must be on-site, remote, or hybrid'),
    
  body('applicationProcess')
    .optional()
    .isIn(['apply', 'external'])
    .withMessage('Application process must be apply or external'),
    
  // If external process chosen, ensure externalUrl exists and is a full URL
  body('externalUrl')
    .customSanitizer((value, { req }) => {
      if (!value) return value;
      // Auto-prefix protocol if missing
      if (/^https?:\/\//i.test(value)) return value;
      return `https://${value}`;
    })
    .custom((value, { req }) => {
      if (req.body.applicationProcess === 'external') {
        if (!value) {
          throw new Error('External URL is required when application process is external');
        }
        try {
          // Validate URL format after sanitization
          // eslint-disable-next-line no-new
          new URL(value);
        } catch (_) {
          throw new Error('External URL must be a valid URL');
        }
      }
      return true;
    }),
    
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Contact email must be valid'),
    
  body('stipend.amount')
    .optional()
    .custom((value, { req }) => {
      // If isUnpaid is true, stipend.amount should be null or undefined
      if (req.body.isUnpaid === true) {
        return true; // Skip validation for unpaid internships
      }
      // For paid internships, amount should be numeric if provided
      if (value !== undefined && value !== null && value !== '') {
        if (isNaN(value)) {
          throw new Error('Stipend amount must be a number');
        }
      }
      return true;
    }),
    
  body('eligibility.minCGPA')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Minimum CGPA must be between 0 and 10')
];

const updateStatusValidation = [
  body('status')
    .isIn(['draft', 'active', 'paused', 'expired', 'closed'])
    .withMessage('Valid status is required')
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

// Public routes (no authentication required)

// GET /api/internships - Get all active internships
router.get('/', getAllInternships);

// GET /api/internships/categories - Get available categories
router.get('/categories', getCategories);

// GET /api/internships/search - Search internships
router.get('/search', searchInternships);

// GET /api/internships/employer - Get employer's internships (employer only)
router.get('/employer', employerAuth, getEmployerInternships);

// GET /api/internships/:id - Get specific internship details
router.get('/:id', getInternshipById);

// GET /api/internships/:id/application-status - Check if user has applied
router.get('/:id/application-status', auth, async (req, res) => {
  try {
    const InternshipApplication = require('../models/InternshipApplication');
    const application = await InternshipApplication.findOne({
      internship: req.params.id,
      user: req.user.id,
      isDeleted: false
    });
    
    res.json({
      hasApplied: !!application,
      application: application ? {
        status: application.status,
        appliedAt: application.appliedAt
      } : null
    });
  } catch (error) {
    console.error('Check application status error:', error);
    res.status(500).json({ message: 'Failed to check application status' });
  }
});

// POST /api/internships/:id/apply - Apply for internship (user only)
router.post('/:internshipId/apply', auth, applyForInternship);

// GET /api/internships/:internshipId/applications - Get applications for an internship (employer only)
router.get('/:internshipId/applications', employerAuth, getInternshipApplications);

// Protected routes (authentication required)

// POST /api/internships - Create new internship (employer only)
router.post('/', employerAuth, createInternshipValidation, createInternship);

// PATCH /api/internships/:id/status - Update internship status (employer only)
router.patch('/:id/status', employerAuth, updateStatusValidation, updateInternshipStatus);

// PUT /api/internships/:id - Update internship (employer only)
router.put('/:id', employerAuth, createInternshipValidation, updateInternship);

// DELETE /api/internships/:id - Delete internship (employer only)
router.delete('/:id', employerAuth, deleteInternship);

module.exports = router;