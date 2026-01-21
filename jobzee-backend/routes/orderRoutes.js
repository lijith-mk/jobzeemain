const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware imports
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const { adminAuth } = require('../middleware/adminAuth');

// Controller imports
const {
  checkout,
  verifyPayment,
  getOrders,
  getOrderById,
  cancelOrder,
  getOrderStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminOrderStats,
  getProductPurchases
} = require('../controllers/orderController');

// Validation middleware
const checkoutValidation = [
  // Shipping address validation
  body('shippingAddress.name')
    .notEmpty()
    .withMessage('Shipping address name is required'),
  
  body('shippingAddress.address.street')
    .notEmpty()
    .withMessage('Shipping street address is required'),
  
  body('shippingAddress.address.city')
    .notEmpty()
    .withMessage('Shipping city is required'),
  
  body('shippingAddress.address.state')
    .notEmpty()
    .withMessage('Shipping state is required'),
  
  body('shippingAddress.address.country')
    .notEmpty()
    .withMessage('Shipping country is required'),
  
  body('shippingAddress.address.zipCode')
    .notEmpty()
    .withMessage('Shipping ZIP code is required'),
  
  // Billing address validation
  body('billingAddress.name')
    .notEmpty()
    .withMessage('Billing address name is required'),
  
  body('billingAddress.email')
    .isEmail()
    .withMessage('Valid billing email is required'),
  
  body('billingAddress.address.street')
    .notEmpty()
    .withMessage('Billing street address is required'),
  
  body('billingAddress.address.city')
    .notEmpty()
    .withMessage('Billing city is required'),
  
  body('billingAddress.address.state')
    .notEmpty()
    .withMessage('Billing state is required'),
  
  body('billingAddress.address.country')
    .notEmpty()
    .withMessage('Billing country is required'),
  
  body('billingAddress.address.zipCode')
    .notEmpty()
    .withMessage('Billing ZIP code is required'),
  
  // Payment method validation
  body('paymentMethod')
    .optional()
    .isIn(['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  // Order notes validation
  body('orderNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Order notes cannot exceed 500 characters')
];

const paymentVerificationValidation = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

const cancelOrderValidation = [
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters')
];

// More flexible validation for cart checkout with new address format
const cartCheckoutValidation = [
  // Shipping address validation (flat structure)
  body('shippingAddress.fullName')
    .notEmpty()
    .withMessage('Shipping address full name is required'),
  
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Shipping street address is required'),
  
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('Shipping city is required'),
  
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('Shipping state is required'),
  
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Shipping country is required'),
  
  body('shippingAddress.pincode')
    .notEmpty()
    .withMessage('Shipping pincode is required'),
  
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('Shipping phone is required'),
  
  // Billing address validation (flat structure)
  body('billingAddress.fullName')
    .notEmpty()
    .withMessage('Billing address full name is required'),
  
  body('billingAddress.email')
    .isEmail()
    .withMessage('Valid billing email is required'),
  
  body('billingAddress.street')
    .notEmpty()
    .withMessage('Billing street address is required'),
  
  body('billingAddress.city')
    .notEmpty()
    .withMessage('Billing city is required'),
  
  body('billingAddress.state')
    .notEmpty()
    .withMessage('Billing state is required'),
  
  body('billingAddress.country')
    .notEmpty()
    .withMessage('Billing country is required'),
  
  body('billingAddress.pincode')
    .notEmpty()
    .withMessage('Billing pincode is required'),
  
  body('billingAddress.phone')
    .notEmpty()
    .withMessage('Billing phone is required'),
  
  // Payment method validation
  body('paymentMethod')
    .optional()
    .isIn(['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  // Order notes validation
  body('orderNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Order notes cannot exceed 500 characters')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn([
      'pending', 'confirmed', 'processing', 'shipped', 
      'delivered', 'cancelled', 'refunded', 'partially_refunded'
    ])
    .withMessage('Invalid order status'),
  
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Status message cannot exceed 200 characters'),
  
  body('trackingNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tracking number cannot exceed 50 characters'),
  
  body('carrier')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Carrier name cannot exceed 50 characters')
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

// Customer routes (User or Employer authentication required)

// POST /api/orders/checkout - Create order from cart and initiate payment
router.post('/checkout', allowUserOrEmployer, checkoutValidation, checkout);

// POST /api/orders/checkout-cart - Alias for checkout (for frontend clarity)
router.post('/checkout-cart', allowUserOrEmployer, cartCheckoutValidation, checkout);

// POST /api/orders/verify-payment - Verify Razorpay payment
router.post('/verify-payment', allowUserOrEmployer, paymentVerificationValidation, verifyPayment);

// POST /api/orders/checkout-single - Create order for a single product
router.post('/checkout-single', allowUserOrEmployer, [
  body('productId').notEmpty().withMessage('productId is required'),
  body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('quantity must be between 1 and 100')
], require('../controllers/orderController').checkoutSingle);

// GET /api/orders - Get user's orders
router.get('/', allowUserOrEmployer, getOrders);

// GET /api/orders/stats - Get order statistics for user
router.get('/stats', allowUserOrEmployer, getOrderStats);

// GET /api/orders/:id - Get specific order details
router.get('/:id', allowUserOrEmployer, getOrderById);

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', allowUserOrEmployer, cancelOrderValidation, cancelOrder);

// Admin routes (Admin authentication required)

// GET /api/admin/orders - Get all orders with filtering
router.get('/admin/all', adminAuth, getAdminOrders);

// GET /api/admin/orders/stats - Get comprehensive order statistics
router.get('/admin/stats', adminAuth, getAdminOrderStats);

// PUT /api/admin/orders/:id/status - Update order status
router.put('/admin/:id/status', adminAuth, updateOrderStatusValidation, updateOrderStatus);

// GET /api/admin/products/:productId/purchases - Get purchase details for a specific product
router.get('/admin/products/:productId/purchases', adminAuth, getProductPurchases);

module.exports = router;