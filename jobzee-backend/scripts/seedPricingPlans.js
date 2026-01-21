const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
require('dotenv').config();

const pricingPlansData = [
  {
    planId: 'free',
    name: 'Free',
    description: 'Perfect for small businesses getting started',
    price: {
      amount: 0,
      currency: 'INR',
      period: 'forever',
      displayPrice: '₹0',
      isPopular: false
    },
    features: [
      { name: 'Job Postings', description: 'Post job openings', included: true, limit: 1, unit: 'jobs' },
      { name: 'Basic Candidate Search', description: 'Search through candidate profiles', included: true, limit: null, unit: 'searches' },
      { name: 'Email Support', description: 'Get help via email', included: true, limit: null, unit: 'tickets' },
      { name: 'Company Profile', description: 'Basic company profile page', included: true, limit: null, unit: 'profiles' },
      { name: 'Basic Analytics', description: 'View basic job posting statistics', included: true, limit: null, unit: 'reports' }
    ],
    jobPostingLimit: 1,
    featuredJobsLimit: 0,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    apiAccess: false,
    whiteLabel: false,
    dedicatedSupport: false,
    isActive: true,
    isAvailable: true,
    sortOrder: 1,
    trialDays: 0,
    trialAvailable: false,
    billingCycle: 'forever',
    autoRenew: false,
    tags: ['starter', 'free', 'basic'],
    category: 'starter',
    comparisonData: {
      jobPostings: '1',
      candidateSearch: 'Basic',
      support: 'Email',
      analytics: 'Basic',
      teamSize: '1',
      storage: '1GB'
    }
  },
  {
    planId: 'basic',
    name: 'Basic',
    description: 'Great for growing companies',
    price: {
      amount: 2499,
      currency: 'INR',
      period: 'monthly',
      displayPrice: '₹2,499',
      isPopular: false
    },
    features: [
      { name: 'Job Postings', description: 'Post job openings', included: true, limit: 5, unit: 'jobs' },
      { name: 'Advanced Candidate Search', description: 'Advanced search with filters', included: true, limit: null, unit: 'searches' },
      { name: 'Priority Email Support', description: 'Faster email support response', included: true, limit: null, unit: 'tickets' },
      { name: 'Enhanced Company Profile', description: 'Detailed company profile with media', included: true, limit: null, unit: 'profiles' },
      { name: 'Advanced Analytics', description: 'Detailed analytics and reporting', included: true, limit: null, unit: 'reports' },
      { name: 'Resume Database Access', description: 'Access to candidate resume database', included: true, limit: null, unit: 'downloads' },
      { name: 'Application Tracking', description: 'Track and manage applications', included: true, limit: null, unit: 'applications' }
    ],
    jobPostingLimit: 5,
    featuredJobsLimit: 1,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: false,
    apiAccess: false,
    whiteLabel: false,
    dedicatedSupport: false,
    isActive: true,
    isAvailable: true,
    sortOrder: 2,
    trialDays: 14,
    trialAvailable: true,
    billingCycle: 'monthly',
    autoRenew: true,
    tags: ['professional', 'growing', 'small-business'],
    category: 'professional',
    comparisonData: {
      jobPostings: '5',
      candidateSearch: 'Advanced',
      support: 'Priority Email',
      analytics: 'Advanced',
      teamSize: '5',
      storage: '10GB'
    }
  },
  {
    planId: 'premium',
    name: 'Premium',
    description: 'For established companies with high hiring needs',
    price: {
      amount: 6999,
      currency: 'INR',
      period: 'monthly',
      displayPrice: '₹6,999',
      isPopular: true
    },
    features: [
      { name: 'Unlimited Job Postings', description: 'Post unlimited job openings', included: true, limit: null, unit: 'jobs' },
      { name: 'Advanced Candidate Matching', description: 'AI-powered candidate matching', included: true, limit: null, unit: 'matches' },
      { name: 'Priority Phone Support', description: 'Phone support with faster response', included: true, limit: null, unit: 'calls' },
      { name: 'Premium Company Profile', description: 'Enhanced profile with videos and media', included: true, limit: null, unit: 'profiles' },
      { name: 'Advanced Analytics & Reporting', description: 'Comprehensive analytics dashboard', included: true, limit: null, unit: 'reports' },
      { name: 'Full Resume Database Access', description: 'Complete access to candidate database', included: true, limit: null, unit: 'downloads' },
      { name: 'Advanced Application Tracking', description: 'Sophisticated application management', included: true, limit: null, unit: 'applications' },
      { name: 'Custom Job Templates', description: 'Create and save job posting templates', included: true, limit: null, unit: 'templates' },
      { name: 'Team Collaboration Tools', description: 'Collaborate with team members', included: true, limit: 10, unit: 'users' }
    ],
    jobPostingLimit: null, // Unlimited
    featuredJobsLimit: 5,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: false,
    whiteLabel: false,
    dedicatedSupport: false,
    isActive: true,
    isAvailable: true,
    sortOrder: 3,
    trialDays: 14,
    trialAvailable: true,
    billingCycle: 'monthly',
    autoRenew: true,
    tags: ['business', 'established', 'high-volume'],
    category: 'business',
    comparisonData: {
      jobPostings: 'Unlimited',
      candidateSearch: 'Advanced',
      support: 'Priority Phone',
      analytics: 'Advanced',
      teamSize: '10',
      storage: '50GB'
    }
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored solutions for large organizations',
    price: {
      amount: 0,
      currency: 'INR',
      period: 'monthly',
      displayPrice: 'Custom',
      isPopular: false
    },
    features: [
      { name: 'Unlimited Everything', description: 'No limits on any feature', included: true, limit: null, unit: 'unlimited' },
      { name: 'Dedicated Account Manager', description: 'Personal account manager', included: true, limit: 1, unit: 'managers' },
      { name: '24/7 Priority Support', description: 'Round-the-clock support', included: true, limit: null, unit: 'support' },
      { name: 'Custom Integrations', description: 'Integrate with your existing systems', included: true, limit: null, unit: 'integrations' },
      { name: 'Advanced Security Features', description: 'Enterprise-grade security', included: true, limit: null, unit: 'features' },
      { name: 'White-label Options', description: 'Customize branding and appearance', included: true, limit: null, unit: 'customizations' },
      { name: 'Custom Reporting', description: 'Tailored reports and analytics', included: true, limit: null, unit: 'reports' },
      { name: 'API Access', description: 'Full API access for custom development', included: true, limit: null, unit: 'api' },
      { name: 'Onboarding Assistance', description: 'Dedicated onboarding support', included: true, limit: null, unit: 'sessions' }
    ],
    jobPostingLimit: null, // Unlimited
    featuredJobsLimit: null, // Unlimited
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: true,
    whiteLabel: true,
    dedicatedSupport: true,
    isActive: true,
    isAvailable: true,
    sortOrder: 4,
    trialDays: 30,
    trialAvailable: true,
    billingCycle: 'monthly',
    autoRenew: true,
    tags: ['enterprise', 'large', 'custom'],
    category: 'enterprise',
    comparisonData: {
      jobPostings: 'Unlimited',
      candidateSearch: 'Advanced',
      support: '24/7 Dedicated',
      analytics: 'Custom',
      teamSize: 'Unlimited',
      storage: 'Unlimited'
    }
  }
];

const seedPricingPlans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobzee', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing pricing plans
    await PricingPlan.deleteMany({});
    console.log('Cleared existing pricing plans');

    // Insert new pricing plans
    const createdPlans = await PricingPlan.insertMany(pricingPlansData);
    console.log(`Created ${createdPlans.length} pricing plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.price.displayPrice}/${plan.price.period}`);
    });

    console.log('Pricing plans seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pricing plans:', error);
    process.exit(1);
  }
};

// Run the seed function
seedPricingPlans();
