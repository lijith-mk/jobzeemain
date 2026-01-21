const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware imports
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');

// Controller imports
const {
  getUserAddresses,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');

// Validation middleware
const addressValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim(),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please enter a valid phone number')
    .trim(),
  
  body('street')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters')
    .trim(),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City name must be between 2 and 50 characters')
    .trim(),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State name must be between 2 and 50 characters')
    .trim(),
  
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Please enter a valid pincode (5-10 digits)')
    .trim(),
  
  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country name must be between 2 and 50 characters')
    .trim(),
  
  body('landmark')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Landmark cannot exceed 100 characters')
    .trim(),
  
  body('addressType')
    .optional()
    .isIn(['home', 'office', 'other'])
    .withMessage('Address type must be home, office, or other'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

// Middleware to allow both user and employer authentication
const allowUserOrEmployer = (req, res, next) => {
  // Try user auth first
  auth(req, res, (userErr) => {
    if (!userErr) {
      return next(); // User authenticated successfully
    }
    
    // Try employer auth if user auth failed
    employerAuth(req, res, (employerErr) => {
      if (!employerErr) {
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

// All address routes require authentication
router.use(allowUserOrEmployer);

// GET /api/addresses - Get user's addresses
router.get('/', getUserAddresses);

// GET /api/addresses/default - Get user's default address
router.get('/default', getDefaultAddress);

// POST /api/addresses - Create new address
router.post('/', addressValidation, createAddress);

// PUT /api/addresses/:id - Update address
router.put('/:id', addressValidation, updateAddress);

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', deleteAddress);

// PUT /api/addresses/:id/set-default - Set address as default
router.put('/:id/set-default', setDefaultAddress);

module.exports = router;
