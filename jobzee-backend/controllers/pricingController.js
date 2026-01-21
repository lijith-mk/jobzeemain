const PricingPlan = require('../models/PricingPlan');
const { validationResult } = require('express-validator');

// Get all active pricing plans
const getPricingPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.getActivePlans();
    
    res.status(200).json({
      success: true,
      count: plans.length,
      plans: plans
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans',
      error: error.message
    });
  }
};

// Get a specific pricing plan by ID
const getPricingPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await PricingPlan.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plan',
      error: error.message
    });
  }
};

// Get pricing plans for comparison
const getPricingComparison = async (req, res) => {
  try {
    const plans = await PricingPlan.getActivePlans();
    
    // Format plans for comparison table
    const comparisonData = plans.map(plan => ({
      planId: plan.planId,
      name: plan.name,
      price: plan.formattedPrice,
      period: plan.price.period,
      features: plan.comparisonData,
      isPopular: plan.price.isPopular,
      trialAvailable: plan.trialAvailable,
      trialDays: plan.trialDays
    }));
    
    res.status(200).json({
      success: true,
      comparison: comparisonData
    });
  } catch (error) {
    console.error('Error fetching pricing comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing comparison',
      error: error.message
    });
  }
};

// Create a new pricing plan (Admin only)
const createPricingPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const planData = req.body;
    const plan = new PricingPlan(planData);
    await plan.save();
    
    res.status(201).json({
      success: true,
      message: 'Pricing plan created successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing plan',
      error: error.message
    });
  }
};

// Update a pricing plan (Admin only)
const updatePricingPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const { planId } = req.params;
    const updateData = req.body;
    
    const plan = await PricingPlan.findOneAndUpdate(
      { planId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pricing plan updated successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing plan',
      error: error.message
    });
  }
};

// Delete a pricing plan (Admin only)
const deletePricingPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await PricingPlan.findOneAndDelete({ planId });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pricing plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing plan',
      error: error.message
    });
  }
};

// Toggle plan availability (Admin only)
const togglePlanAvailability = async (req, res) => {
  try {
    const { planId } = req.params;
    const { isAvailable } = req.body;
    
    const plan = await PricingPlan.findOneAndUpdate(
      { planId },
      { isAvailable },
      { new: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Pricing plan ${isAvailable ? 'activated' : 'deactivated'} successfully`,
      plan: plan
    });
  } catch (error) {
    console.error('Error toggling plan availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle plan availability',
      error: error.message
    });
  }
};

// Get plan features for a specific plan
const getPlanFeatures = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await PricingPlan.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      features: plan.features,
      limits: {
        jobPostingLimit: plan.jobPostingLimit,
        featuredJobsLimit: plan.featuredJobsLimit,
        prioritySupport: plan.prioritySupport
      }
    });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan features',
      error: error.message
    });
  }
};

// Get pricing plans for public display (no admin data)
const getPublicPricingPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.getActivePlans();
    
    // Filter out sensitive admin data
    const publicPlans = plans.map(plan => ({
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      price: {
        amount: plan.price.amount,
        currency: plan.price.currency,
        period: plan.price.period,
        displayPrice: plan.price.displayPrice,
        originalPrice: plan.price.originalPrice,
        discount: plan.price.discount,
        isPopular: plan.price.isPopular
      },
      features: plan.features,
      jobPostingLimit: plan.jobPostingLimit,
      featuredJobsLimit: plan.featuredJobsLimit,
      prioritySupport: plan.prioritySupport,
      advancedAnalytics: plan.advancedAnalytics,
      customBranding: plan.customBranding,
      apiAccess: plan.apiAccess,
      whiteLabel: plan.whiteLabel,
      dedicatedSupport: plan.dedicatedSupport,
      trialDays: plan.trialDays,
      trialAvailable: plan.trialAvailable,
      billingCycle: plan.billingCycle,
      autoRenew: plan.autoRenew,
      category: plan.category,
      comparisonData: plan.comparisonData
    }));
    
    res.status(200).json({
      success: true,
      count: publicPlans.length,
      plans: publicPlans
    });
  } catch (error) {
    console.error('Error fetching public pricing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans',
      error: error.message
    });
  }
};

module.exports = {
  getPricingPlans,
  getPricingPlanById,
  getPricingComparison,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  togglePlanAvailability,
  getPlanFeatures,
  getPublicPricingPlans
};
