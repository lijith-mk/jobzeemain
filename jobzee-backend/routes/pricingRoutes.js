const express = require('express');
const router = express.Router();
const {
  getPricingPlans,
  getPricingPlanById,
  getPricingComparison,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  togglePlanAvailability,
  getPlanFeatures,
  getPublicPricingPlans
} = require('../controllers/pricingController');
const { adminAuth } = require('../middleware/adminAuth');
const { body, param } = require('express-validator');

// Public routes (no authentication required)
router.get('/public', getPublicPricingPlans);
router.get('/comparison', getPricingComparison);
router.get('/:planId', getPricingPlanById);
router.get('/:planId/features', getPlanFeatures);

// Admin routes (require admin authentication)
router.use(adminAuth); // Apply admin auth middleware to all routes below

// Get all pricing plans (admin)
router.get('/', getPricingPlans);

// Create new pricing plan
router.post('/', [
  body('planId').isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid plan ID'),
  body('name').notEmpty().withMessage('Plan name is required'),
  body('description').notEmpty().withMessage('Plan description is required'),
  body('price.amount').isNumeric().withMessage('Price amount must be numeric'),
  body('price.currency').isIn(['INR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('price.period').isIn(['monthly', 'yearly', 'forever']).withMessage('Invalid period'),
  body('price.displayPrice').notEmpty().withMessage('Display price is required'),
  body('jobPostingLimit').isNumeric().withMessage('Job posting limit must be numeric'),
  body('features').isArray().withMessage('Features must be an array')
], createPricingPlan);

// Update pricing plan
router.put('/:planId', [
  param('planId').isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid plan ID'),
  body('name').optional().notEmpty().withMessage('Plan name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Plan description cannot be empty'),
  body('price.amount').optional().isNumeric().withMessage('Price amount must be numeric'),
  body('price.currency').optional().isIn(['INR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('price.period').optional().isIn(['monthly', 'yearly', 'forever']).withMessage('Invalid period'),
  body('jobPostingLimit').optional().isNumeric().withMessage('Job posting limit must be numeric')
], updatePricingPlan);

// Delete pricing plan
router.delete('/:planId', [
  param('planId').isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid plan ID')
], deletePricingPlan);

// Toggle plan availability
router.patch('/:planId/toggle', [
  param('planId').isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid plan ID'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be boolean')
], togglePlanAvailability);

module.exports = router;
