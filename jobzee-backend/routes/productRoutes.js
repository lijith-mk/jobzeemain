const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware imports
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const { adminAuth } = require('../middleware/adminAuth');

// Controller imports
const {
  getProducts,
  getFeaturedProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductReviews,
  getAdminProducts,
  getProductStats
} = require('../controllers/productController');

// Validation middleware
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .isIn([
      'Books', 'Courses', 'Templates', 'Tools', 'Certificates', 
      'Consultation', 'Resume Services', 'Interview Prep', 
      'Career Coaching', 'Skills Assessment', 'Other'
    ])
    .withMessage('Invalid category'),
  
  body('productType')
    .isIn(['physical', 'digital', 'service'])
    .withMessage('Product type must be physical, digital, or service'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'INR', 'EUR', 'GBP'])
    .withMessage('Invalid currency')
];

const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
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

// Public routes - no authentication required

// GET /api/products - Get all products with filtering
router.get('/', getProducts);

// GET /api/products/featured - Get featured products
router.get('/featured', getFeaturedProducts);

// GET /api/products/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/products/:id - Get single product by ID or slug
router.get('/:id', getProductById);

// GET /api/products/:id/reviews - Get product reviews
router.get('/:id/reviews', getProductReviews);

// Protected routes - require authentication

// POST /api/products/:id/reviews - Add product review (User or Employer)
router.post('/:id/reviews', allowUserOrEmployer, reviewValidation, addProductReview);

// Admin-only routes - require admin authentication

// POST /api/products - Create new product (Admin only)
router.post('/', adminAuth, productValidation, createProduct);

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', adminAuth, productValidation, updateProduct);

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', adminAuth, deleteProduct);

// Admin management routes (separate from public API)

// GET /api/admin/products - Get all products for admin
router.get('/admin/all', adminAuth, getAdminProducts);

// GET /api/admin/products/stats - Get product statistics
router.get('/admin/stats', adminAuth, getProductStats);

module.exports = router;