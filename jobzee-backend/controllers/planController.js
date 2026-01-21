const PricingPlan = require('../models/PricingPlan');
const Employer = require('../models/Employer');
const Subscription = require('../models/Subscription');

// Get all plans with pagination and filtering
exports.getAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const category = req.query.category || '';

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { planId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status === 'active') {
        query.isActive = true;
        query.isAvailable = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'unavailable') {
        query.isAvailable = false;
      }
    }

    if (category) {
      query.category = category;
    }

    const [plans, total] = await Promise.all([
      PricingPlan.find(query)
        .sort({ sortOrder: 1, 'price.amount': 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PricingPlan.countDocuments(query)
    ]);

    res.json({
      success: true,
      plans,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    });
  }
};

// Get single plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await PricingPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan'
    });
  }
};

// Create new plan
exports.createPlan = async (req, res) => {
  try {
    const {
      planId,
      name,
      description,
      price,
      features,
      jobPostingLimit,
      featuredJobsLimit,
      prioritySupport,
      advancedAnalytics,
      customBranding,
      apiAccess,
      whiteLabel,
      dedicatedSupport,
      trialDays,
      trialAvailable,
      billingCycle,
      autoRenew,
      tags,
      category,
      seoTitle,
      seoDescription,
      marketingCopy,
      comparisonData
    } = req.body;

    // Check if plan ID already exists
    const existingPlan = await PricingPlan.findOne({ planId });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID already exists'
      });
    }

    // Create new plan
    const plan = new PricingPlan({
      planId,
      name,
      description,
      price: {
        amount: price.amount,
        currency: price.currency || 'INR',
        period: price.period || 'monthly',
        displayPrice: price.displayPrice,
        originalPrice: price.originalPrice,
        discount: price.discount || 0,
        isPopular: price.isPopular || false
      },
      features: features || [],
      jobPostingLimit: jobPostingLimit || 1,
      featuredJobsLimit: featuredJobsLimit || 0,
      prioritySupport: prioritySupport || false,
      advancedAnalytics: advancedAnalytics || false,
      customBranding: customBranding || false,
      apiAccess: apiAccess || false,
      whiteLabel: whiteLabel || false,
      dedicatedSupport: dedicatedSupport || false,
      trialDays: trialDays || 0,
      trialAvailable: trialAvailable || false,
      billingCycle: billingCycle || 'monthly',
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      tags: tags || [],
      category: category || 'starter',
      seoTitle,
      seoDescription,
      marketingCopy,
      comparisonData: comparisonData || {}
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plan'
    });
  }
};

// Update existing plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const plan = await PricingPlan.findOneAndUpdate(
      { planId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan'
    });
  }
};

// Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if any employers are using this plan
    const employersUsingPlan = await Employer.countDocuments({ subscriptionPlan: planId });
    if (employersUsingPlan > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${employersUsingPlan} employers are currently using this plan.`
      });
    }

    // Check if any active subscriptions exist for this plan
    const activeSubscriptions = await Subscription.countDocuments({ 
      planId, 
      status: { $in: ['active', 'created'] } 
    });
    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${activeSubscriptions} active subscriptions exist for this plan.`
      });
    }

    const plan = await PricingPlan.findOneAndDelete({ planId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan'
    });
  }
};

// Toggle plan status (active/inactive)
exports.togglePlanStatus = async (req, res) => {
  try {
    const { planId } = req.params;
    const { isActive, isAvailable } = req.body;

    const plan = await PricingPlan.findOneAndUpdate(
      { planId },
      { 
        $set: { 
          isActive: isActive !== undefined ? isActive : true,
          isAvailable: isAvailable !== undefined ? isAvailable : true
        }
      },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan status updated successfully',
      plan
    });
  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan status'
    });
  }
};

// Get plan usage statistics
exports.getPlanUsageStats = async (req, res) => {
  try {
    const { planId } = req.params;

    // Get plan details
    const plan = await PricingPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Get usage statistics
    const [
      totalEmployers,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue
    ] = await Promise.all([
      Employer.countDocuments({ subscriptionPlan: planId }),
      Subscription.countDocuments({ planId, status: 'active' }),
      Subscription.aggregate([
        { $match: { planId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Subscription.aggregate([
        { 
          $match: { 
            planId, 
            status: 'active',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      plan: {
        ...plan.toObject(),
        usage: {
          totalEmployers,
          activeSubscriptions,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get plan usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan usage statistics'
    });
  }
};

// Get all plan categories
exports.getPlanCategories = async (req, res) => {
  try {
    const categories = await PricingPlan.distinct('category');
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get plan categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan categories'
    });
  }
};

// Duplicate plan
exports.duplicatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { newPlanId, newName } = req.body;

    const originalPlan = await PricingPlan.findOne({ planId });
    if (!originalPlan) {
      return res.status(404).json({
        success: false,
        message: 'Original plan not found'
      });
    }

    // Check if new plan ID already exists
    const existingPlan = await PricingPlan.findOne({ planId: newPlanId });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID already exists'
      });
    }

    // Create duplicate plan
    const duplicatePlan = new PricingPlan({
      ...originalPlan.toObject(),
      _id: undefined,
      planId: newPlanId,
      name: newName || `${originalPlan.name} (Copy)`,
      isActive: false, // Start as inactive
      isAvailable: false,
      createdAt: undefined,
      updatedAt: undefined
    });

    await duplicatePlan.save();

    res.status(201).json({
      success: true,
      message: 'Plan duplicated successfully',
      plan: duplicatePlan
    });
  } catch (error) {
    console.error('Duplicate plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate plan'
    });
  }
};

// Bulk update plan status
exports.bulkUpdatePlanStatus = async (req, res) => {
  try {
    const { planIds, isActive, isAvailable } = req.body;

    if (!Array.isArray(planIds) || planIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan IDs array is required'
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const result = await PricingPlan.updateMany(
      { planId: { $in: planIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} plans updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plans'
    });
  }
};







