const Razorpay = require('razorpay');
const crypto = require('crypto');
const PricingPlan = require('../models/PricingPlan');
const Employer = require('../models/Employer');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const invoiceService = require('../services/invoiceService');

// Initialize Razorpay instance
function getRazorpayInstance() {
	const keyId = process.env.RAZORPAY_KEY_ID;
	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keyId || !keySecret) {
		throw new Error('Razorpay keys are not configured');
	}
	return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function calculateSubscriptionDates(period) {
	const start = new Date();
	let end = null;
	switch (period) {
		case 'monthly': {
			end = new Date(start);
			end.setMonth(end.getMonth() + 1);
			break;
		}
		case 'yearly': {
			end = new Date(start);
			end.setFullYear(end.getFullYear() + 1);
			break;
		}
		case 'one-time':
		case 'forever': {
			end = null;
			break;
		}
		default: {
			end = null;
		}
	}
	return { start, end };
}

// POST /api/payments/create-order
// body: { planId }
// auth: employerAuth
const createOrder = async (req, res) => {
	try {
		const { planId } = req.body || {};

		if (!planId) {
			return res.status(400).json({ success: false, message: 'planId is required' });
		}

		const plan = await PricingPlan.getPlanById(planId);
		if (!plan) {
			return res.status(404).json({ success: false, message: 'Invalid plan selected' });
		}

		// Prevent creating order for current plan
		if (req.employer?.subscriptionPlan === plan.planId) {
			return res.status(400).json({ success: false, message: 'You are already on this plan' });
		}

		const instance = getRazorpayInstance();
		const amountPaise = Math.round((plan.price?.amount || 0) * 100);

		if (!amountPaise || amountPaise <= 0) {
			return res.status(400).json({ success: false, message: 'Selected plan has invalid amount' });
		}

		const receipt = `plan_${plan.planId}_${Date.now()}`;
		const order = await instance.orders.create({
			amount: amountPaise,
			currency: plan.price?.currency || 'INR',
			receipt,
			notes: {
				planId: plan.planId,
				employerId: String(req.employer?.id || ''),
				period: plan.price?.period || 'monthly'
			}
		});

		// Record payment transaction
		const payment = await Payment.create({
			employerId: req.employer.id,
			planId: plan.planId,
			amount: plan.price?.amount,
			currency: plan.price?.currency || 'INR',
			razorpayOrderId: order.id,
			razorpayReceipt: receipt,
			status: 'initiated',
			userAgent: req.get('User-Agent'),
			ipAddress: req.ip || req.connection.remoteAddress,
			notes: order.notes || {}
		});

		// Record subscription intent
		await Subscription.create({
			employerId: req.employer.id,
			planId: plan.planId,
			period: plan.price?.period || 'monthly',
			amount: plan.price?.amount,
			currency: plan.price?.currency || 'INR',
			orderId: order.id,
			receipt,
			status: 'created',
			notes: order.notes || {}
		});

		return res.status(200).json({
			success: true,
			order,
			key: process.env.RAZORPAY_KEY_ID,
			plan: {
				planId: plan.planId,
				name: plan.name,
				amount: plan.price?.amount,
				currency: plan.price?.currency || 'INR',
				period: plan.price?.period || 'monthly',
				jobPostingLimit: plan.jobPostingLimit,
				featuredJobsLimit: plan.featuredJobsLimit
			}
		});
	} catch (error) {
		console.error('Error creating Razorpay order:', error);
		return res.status(500).json({ success: false, message: 'Failed to create order' });
	}
};

// POST /api/payments/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
// auth: employerAuth
const verifyPayment = async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body || {};

		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
			return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
		}

		const plan = await PricingPlan.getPlanById(planId);
		if (!plan) {
			return res.status(404).json({ success: false, message: 'Invalid plan selected' });
		}

		// Verify signature
		const body = `${razorpay_order_id}|${razorpay_payment_id}`;
		const expectedSignature = crypto
			.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
			.update(body.toString())
			.digest('hex');

		if (expectedSignature !== razorpay_signature) {
			// Mark payment as failed
			await Payment.findOneAndUpdate(
				{ razorpayOrderId: razorpay_order_id, employerId: req.employer.id },
				{ $set: { status: 'failed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, failedAt: new Date(), failureReason: 'Signature verification failed' } }
			);
			
			// Mark subscription failed
			await Subscription.findOneAndUpdate(
				{ orderId: razorpay_order_id, employerId: req.employer.id },
				{ $set: { status: 'failed', paymentId: razorpay_payment_id, signature: razorpay_signature } }
			);
			return res.status(400).json({ success: false, message: 'Payment verification failed' });
		}

		// Update employer subscription
		const { start, end } = calculateSubscriptionDates(plan.price?.period || 'monthly');

		const updates = {
			subscriptionPlan: plan.planId,
			subscriptionStartDate: start,
			subscriptionEndDate: end,
			jobPostingLimit: plan.jobPostingLimit, // This can be null for unlimited plans
			featuredJobsLimit: plan.featuredJobsLimit ?? 0
		};

		const employer = await Employer.findByIdAndUpdate(
			req.employer.id,
			{ $set: updates, $setOnInsert: {} },
			{ new: true }
		).lean();

		// Mark payment as successful
		await Payment.findOneAndUpdate(
			{ razorpayOrderId: razorpay_order_id, employerId: req.employer.id },
			{ 
				$set: {
					status: 'success',
					razorpayPaymentId: razorpay_payment_id,
					razorpaySignature: razorpay_signature,
					completedAt: new Date()
				}
			}
		);

		// Activate subscription record
		const subscription = await Subscription.findOneAndUpdate(
			{ orderId: razorpay_order_id, employerId: req.employer.id },
			{ 
				$set: {
					status: 'active',
					paymentId: razorpay_payment_id,
					signature: razorpay_signature,
					startDate: start,
					endDate: end
				}
			},
			{ new: true }
		);

		// Create and send invoice
		try {
			const paymentRecord = await Payment.findOne({ razorpayOrderId: razorpay_order_id, employerId: req.employer.id }).lean();
			await invoiceService.createAndSendInvoice({
				employerId: req.employer.id,
				payment: paymentRecord,
				subscription,
				plan
			});
		} catch (e) {
			console.warn('Invoice generation failed:', e?.message || e);
		}

		return res.status(200).json({
			success: true,
			message: 'Payment verified and subscription updated',
			employer,
			plan: {
				planId: plan.planId,
				name: plan.name,
				period: plan.price?.period || 'monthly'
			}
		});
	} catch (error) {
		console.error('Error verifying Razorpay payment:', error);
		return res.status(500).json({ success: false, message: 'Failed to verify payment' });
	}
};

// GET /api/payments/history
// auth: employerAuth
const getPaymentHistory = async (req, res) => {
	try {
		const { page = 1, limit = 10, status, startDate, endDate } = req.query;
		const skip = (page - 1) * limit;

		const match = { employerId: req.employer.id };
		
		if (status) match.status = status;
		if (startDate || endDate) {
			match.initiatedAt = {};
			if (startDate) match.initiatedAt.$gte = new Date(startDate);
			if (endDate) match.initiatedAt.$lte = new Date(endDate);
		}

		const payments = await Payment.find(match)
			.sort({ initiatedAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.lean();

		const total = await Payment.countDocuments(match);

		return res.status(200).json({
			success: true,
			payments,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total
			}
		});
	} catch (error) {
		console.error('Error fetching payment history:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
	}
};

// GET /api/payments/stats
// auth: employerAuth
const getPaymentStats = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const stats = await Payment.getPaymentStats(req.employer.id, startDate, endDate);
		
		return res.status(200).json({
			success: true,
			stats: stats[0] || {
				totalPayments: 0,
				successfulPayments: 0,
				failedPayments: 0,
				totalAmount: 0,
				successfulAmount: 0,
				refundedAmount: 0
			}
		});
	} catch (error) {
		console.error('Error fetching payment stats:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch payment statistics' });
	}
};

// GET /api/payments/:paymentId
// auth: employerAuth
const getPaymentDetails = async (req, res) => {
	try {
		const { paymentId } = req.params;
		
		const payment = await Payment.findOne({
			_id: paymentId,
			employerId: req.employer.id
		}).lean();

		if (!payment) {
			return res.status(404).json({ success: false, message: 'Payment not found' });
		}

		return res.status(200).json({
			success: true,
			payment
		});
	} catch (error) {
		console.error('Error fetching payment details:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
	}
};

module.exports = { 
	createOrder, 
	verifyPayment, 
	getPaymentHistory, 
	getPaymentStats, 
	getPaymentDetails 
};
