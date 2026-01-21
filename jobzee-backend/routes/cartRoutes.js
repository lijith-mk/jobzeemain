const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware imports
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');

// Controller imports
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');

// Validation middleware
const addToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

const updateCartValidation = [
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
];

const couponValidation = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
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

// Cart routes - All require authentication

// GET /api/cart - Get user's cart
router.get('/', allowUserOrEmployer, getCart);

// GET /api/cart/summary - Get cart summary (count and total)
router.get('/summary', allowUserOrEmployer, getCartSummary);

// POST /api/cart/add - Add item to cart
router.post('/add', allowUserOrEmployer, addToCartValidation, addToCart);

// PUT /api/cart/update/:productId - Update cart item quantity
router.put('/update/:productId', allowUserOrEmployer, updateCartValidation, updateCartItem);

// DELETE /api/cart/remove/:productId - Remove item from cart
router.delete('/remove/:productId', allowUserOrEmployer, removeFromCart);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', allowUserOrEmployer, clearCart);

// POST /api/cart/coupon - Apply coupon to cart
router.post('/coupon', allowUserOrEmployer, couponValidation, applyCoupon);

// DELETE /api/cart/coupon/:code - Remove coupon from cart
router.delete('/coupon/:code', allowUserOrEmployer, removeCoupon);

module.exports = router;