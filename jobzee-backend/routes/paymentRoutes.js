const express = require('express');
const router = express.Router();
const { 
	createOrder, 
	verifyPayment, 
	getPaymentHistory, 
	getPaymentStats, 
	getPaymentDetails 
} = require('../controllers/paymentController');
const { employerAuth } = require('../middleware/employerAuth');

// Create Razorpay order
router.post('/create-order', employerAuth, createOrder);

// Verify Razorpay payment
router.post('/verify', employerAuth, verifyPayment);

// Get payment history
router.get('/history', employerAuth, getPaymentHistory);

// Get payment statistics
router.get('/stats', employerAuth, getPaymentStats);

// Get specific payment details
router.get('/:paymentId', employerAuth, getPaymentDetails);

module.exports = router;
