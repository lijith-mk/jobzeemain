const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema({
  // Reference to auth record
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true,
    unique: true
  },
  
  // Company Basic Information
  companyName: { type: String, required: true },
  companyPhone: { type: String },
  
  // Contact Person Details
  contactPersonName: { type: String, required: true },
  contactPersonTitle: { type: String },
  contactPersonEmail: { type: String },
  contactPersonPhone: { type: String },
  
  // Company Details
  companyDescription: { type: String, maxlength: 2000 },
  industry: { type: String },
  companySize: { 
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
  
  // Location Information
  headquarters: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Additional Locations
  locations: [{
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String },
    isHeadquarters: { type: Boolean, default: false }
  }],
  
  // Online Presence
  website: { type: String },
  socialMedia: {
    linkedIn: { type: String },
    twitter: { type: String },
    facebook: { type: String },
    instagram: { type: String }
  },
  
  // Company Verification
  isVerified: { type: Boolean, default: false },
  verificationDocument: { type: String }, // URL to uploaded document
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'in-review', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verificationNotes: { type: String },
  verificationSubmittedAt: { type: Date },
  verifiedAt: { type: Date },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth' // Reference to admin who verified
  },
  
  // Company Culture & Benefits
  companyValues: [{ type: String }],
  benefits: [{ type: String }],
  workCulture: { type: String },
  perks: [{ type: String }],
  
  // Images and Media
  companyLogo: { type: String }, // Cloudinary URL
  companyImages: [{ type: String }], // Array of image URLs
  companyVideos: [{ type: String }], // Array of video URLs
  profilePhoto: { type: String }, // Cloudinary URL for contact person photo
  
  // Subscription & Plan
  subscriptionPlan: { 
    type: String, 
    enum: ['free', 'basic', 'premium', 'enterprise'], 
    default: 'free' 
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  jobPostingLimit: { type: Number, default: 3 }, // null means unlimited
  jobPostingsUsed: { type: Number, default: 0 },
  featuredJobsLimit: { type: Number, default: 0 },
  
  // Settings & Preferences
  settings: {
    autoApproveApplications: { type: Boolean, default: false },
    requireCoverLetter: { type: Boolean, default: false },
    allowAnonymousApplications: { type: Boolean, default: false },
    showSalaryRange: { type: Boolean, default: true }
  },
  
  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    newApplications: { type: Boolean, default: true },
    jobExpiring: { type: Boolean, default: true },
    subscriptionReminders: { type: Boolean, default: true }
  },
  
  // Analytics & Stats
  analytics: {
    profileViews: { type: Number, default: 0 },
    totalJobPosts: { type: Number, default: 0 },
    activeJobPosts: { type: Number, default: 0 },
    totalApplicationsReceived: { type: Number, default: 0 },
    averageApplicationsPerJob: { type: Number, default: 0 },
    topSkillsRequested: [{ type: String }]
  },
  
  // Team Members (if company has multiple recruiters)
  teamMembers: [{
    name: { type: String },
    email: { type: String },
    role: { type: String },
    permissions: [{
      type: String,
      enum: ['post-jobs', 'review-applications', 'manage-team', 'view-analytics']
    }],
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Company Rating & Reviews (from job seekers)
  ratings: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    workLifeBalance: { type: Number, default: 0, min: 0, max: 5 },
    culture: { type: Number, default: 0, min: 0, max: 5 },
    careerGrowth: { type: Number, default: 0, min: 0, max: 5 },
    compensation: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  
  // Status & Activity
  isActive: { type: Boolean, default: true },
  profileCompleteness: { type: Number, default: 0 }, // Percentage
  lastActiveAt: { type: Date, default: Date.now },
  
  // Compliance & Legal
  taxId: { type: String }, // For verified companies
  registrationNumber: { type: String },
  complianceStatus: {
    type: String,
    enum: ['compliant', 'pending', 'non-compliant'],
    default: 'pending'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for company age
employerProfileSchema.virtual('companyAge').get(function() {
  if (this.foundedYear) {
    return new Date().getFullYear() - this.foundedYear;
  }
  return null;
});

// Virtual for remaining job posts
employerProfileSchema.virtual('remainingJobPosts').get(function() {
  return Math.max(0, this.jobPostingLimit - this.jobPostingsUsed);
});

// Virtual for subscription status
employerProfileSchema.virtual('subscriptionActive').get(function() {
  if (this.subscriptionPlan === 'free') return true;
  if (!this.subscriptionEndDate) return false;
  return new Date() <= this.subscriptionEndDate;
});

// Indexes for search functionality
employerProfileSchema.index({ 
  companyName: 'text', 
  industry: 'text', 
  'headquarters.city': 'text',
  companyDescription: 'text'
});

// Index for location-based queries
employerProfileSchema.index({ 'headquarters.coordinates': '2dsphere' });

// Index for verification status
employerProfileSchema.index({ verificationStatus: 1, isVerified: 1 });

// Pre-save middleware to calculate profile completeness
employerProfileSchema.pre('save', function(next) {
  const requiredFields = [
    'companyName', 'contactPersonName', 'companyDescription', 'industry',
    'headquarters.city', 'website', 'companyLogo', 'companySize'
  ];
  
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const fieldPath = field.split('.');
    let value = this;
    
    for (const path of fieldPath) {
      value = value?.[path];
      if (value === undefined || value === null || value === '') {
        break;
      }
    }
    
    if (Array.isArray(value) ? value.length > 0 : value) {
      completedFields++;
    }
  });
  
  this.profileCompleteness = Math.round((completedFields / requiredFields.length) * 100);
  next();
});

// Instance method to check if subscription is active
employerProfileSchema.methods.hasActiveSubscription = function() {
  if (this.subscriptionPlan === 'free') return true;
  if (!this.subscriptionEndDate) return false;
  return new Date() <= this.subscriptionEndDate;
};

// Instance method to check if can post more jobs
employerProfileSchema.methods.canPostMoreJobs = function() {
  return this.jobPostingsUsed < this.jobPostingLimit;
};

// Instance method to increment job posting count
employerProfileSchema.methods.incrementJobPosting = function() {
  this.jobPostingsUsed += 1;
  this.analytics.totalJobPosts += 1;
  this.analytics.activeJobPosts += 1;
  return this.save();
};

// Instance method to decrement active job count (when job expires/closes)
employerProfileSchema.methods.decrementActiveJobs = function() {
  this.analytics.activeJobPosts = Math.max(0, this.analytics.activeJobPosts - 1);
  return this.save();
};

// Method to increment profile views
employerProfileSchema.methods.incrementViews = function() {
  this.analytics.profileViews += 1;
  return this.save();
};

// Method to update last active timestamp
employerProfileSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Method to add team member
employerProfileSchema.methods.addTeamMember = function(memberData) {
  this.teamMembers.push({
    ...memberData,
    addedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
