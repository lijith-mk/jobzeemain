const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  // Plan identification
  planId: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['free', 'basic', 'premium', 'enterprise']
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  
  // Pricing information
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    period: { 
      type: String, 
      enum: ['monthly', 'yearly', 'forever'], 
      default: 'monthly' 
    },
    displayPrice: { type: String, required: true }, // e.g., "₹2,499"
    originalPrice: { type: Number }, // For discounted prices
    discount: { type: Number, default: 0 }, // Percentage discount
    isPopular: { type: Boolean, default: false }
  },
  
  // Plan features and limits
  features: [{
    name: { type: String, required: true },
    description: { type: String },
    included: { type: Boolean, default: true },
    limit: { type: Number }, // null for unlimited
    unit: { type: String } // e.g., "jobs", "applications", "users"
  }],
  
  // Job posting limits
  jobPostingLimit: { type: Number, default: 1 },
  featuredJobsLimit: { type: Number, default: 0 },
  prioritySupport: { type: Boolean, default: false },
  
  // Advanced features
  advancedAnalytics: { type: Boolean, default: false },
  customBranding: { type: Boolean, default: false },
  apiAccess: { type: Boolean, default: false },
  whiteLabel: { type: Boolean, default: false },
  dedicatedSupport: { type: Boolean, default: false },
  
  // Plan status
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  
  // Trial information
  trialDays: { type: Number, default: 0 },
  trialAvailable: { type: Boolean, default: false },
  
  // Billing information
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'yearly', 'one-time', 'forever'], 
    default: 'monthly' 
  },
  autoRenew: { type: Boolean, default: true },
  
  // Metadata
  tags: [{ type: String }],
  category: { 
    type: String, 
    enum: ['starter', 'professional', 'business', 'enterprise'],
    default: 'starter'
  },
  
  // SEO and marketing
  seoTitle: { type: String },
  seoDescription: { type: String },
  marketingCopy: { type: String },
  
  // Plan comparison data
  comparisonData: {
    jobPostings: { type: String }, // "1", "5", "Unlimited"
    candidateSearch: { type: String }, // "Basic", "Advanced"
    support: { type: String }, // "Email", "Priority Email", "Phone"
    analytics: { type: String }, // "Basic", "Advanced", "Custom"
    teamSize: { type: String }, // "1", "5", "Unlimited"
    storage: { type: String } // "1GB", "10GB", "Unlimited"
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pricingPlanSchema.index({ planId: 1 });
pricingPlanSchema.index({ isActive: 1, isAvailable: 1 });
pricingPlanSchema.index({ sortOrder: 1 });

// Virtual for formatted price
pricingPlanSchema.virtual('formattedPrice').get(function() {
  return this.price.displayPrice;
});

// Virtual for annual savings
pricingPlanSchema.virtual('annualSavings').get(function() {
  if (this.price.period === 'yearly' && this.price.originalPrice) {
    const monthlyPrice = this.price.originalPrice / 12;
    const yearlyPrice = this.price.amount;
    return Math.round((monthlyPrice * 12) - yearlyPrice);
  }
  return 0;
});

// Static method to get active plans
pricingPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true, isAvailable: true })
    .sort({ sortOrder: 1, 'price.amount': 1 });
};

// Static method to get plan by ID
pricingPlanSchema.statics.getPlanById = function(planId) {
  return this.findOne({ planId, isActive: true, isAvailable: true });
};

// Instance method to check if plan has feature
pricingPlanSchema.methods.hasFeature = function(featureName) {
  const feature = this.features.find(f => f.name === featureName);
  return feature ? feature.included : false;
};

// Instance method to get feature limit
pricingPlanSchema.methods.getFeatureLimit = function(featureName) {
  const feature = this.features.find(f => f.name === featureName);
  return feature ? feature.limit : null;
};

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
