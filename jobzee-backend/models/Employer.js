const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  // Company Basic Information
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true, unique: true },
  companyPhone: { type: String },
  password: { type: String },
  
  // Google OAuth fields
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String }, // For Google profile picture
  
  // Contact Person Details
  contactPersonName: { type: String, required: true },
  contactPersonTitle: { type: String },
  contactPersonEmail: { type: String },
  contactPersonPhone: { type: String },
  
  // Company Details
  companyDescription: { type: String, maxlength: 1000 },
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
  
  // Online Presence
  website: { type: String },
  linkedinProfile: { type: String },
  twitterHandle: { type: String },
  
  // Company Verification
  isVerified: { type: Boolean, default: false },
  verificationDocument: { type: String }, // URL to uploaded document
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verificationNotes: { type: String },
  
  // Company Culture & Benefits
  companyValues: [{ type: String }],
  benefits: [{ type: String }],
  workCulture: { type: String },
  
  // Logo and Images
  companyLogo: { type: String }, // URL to logo image
  companyImages: [{ type: String }], // Array of image URLs
  profilePhoto: { type: String }, // Cloudinary URL for contact person photo
  
  // Subscription & Plan
  subscriptionPlan: { 
    type: String, 
    enum: ['free', 'basic', 'premium', 'enterprise'], 
    default: 'free' 
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  // Free plan is limited to 1 job posting; paid plans may override this
  // null means unlimited job postings
  jobPostingLimit: { type: Number, default: 1 },
  jobPostingsUsed: { type: Number, default: 0 },
  
  // Settings
  autoApproveApplications: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  
  // Analytics
  profileViews: { type: Number, default: 0 },
  totalJobPosts: { type: Number, default: 0 },
  totalApplicationsReceived: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  // Soft delete timestamp
  deletedAt: { type: Date },
  lastLoginAt: { type: Date },
  
  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Role and Permissions
  role: { type: String, default: 'employer', enum: ['employer', 'admin'] }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for company age
employerSchema.virtual('companyAge').get(function() {
  if (this.foundedYear) {
    return new Date().getFullYear() - this.foundedYear;
  }
  return null;
});

// Virtual for remaining job posts
employerSchema.virtual('remainingJobPosts').get(function() {
  return this.jobPostingLimit - this.jobPostingsUsed;
});

// Index for search functionality
employerSchema.index({ 
  companyName: 'text', 
  industry: 'text', 
  'headquarters.city': 'text' 
});

// Pre-save middleware to handle email normalization
employerSchema.pre('save', function(next) {
  if (this.isModified('companyEmail')) {
    this.companyEmail = this.companyEmail.toLowerCase();
  }
  if (this.isModified('contactPersonEmail')) {
    this.contactPersonEmail = this.contactPersonEmail.toLowerCase();
  }
  next();
});

// Instance method to check if subscription is active
employerSchema.methods.hasActiveSubscription = function() {
  if (this.subscriptionPlan === 'free') return true;
  if (!this.subscriptionEndDate) return false;
  return new Date() <= this.subscriptionEndDate;
};

// Instance method to check if can post more jobs
employerSchema.methods.canPostMoreJobs = function() {
  // If jobPostingLimit is null, it means unlimited
  if (this.jobPostingLimit === null) {
    return true;
  }
  return this.jobPostingsUsed < this.jobPostingLimit;
};

// Instance method to increment job posting count
employerSchema.methods.incrementJobPosting = function() {
  this.jobPostingsUsed += 1;
  this.totalJobPosts += 1;
  return this.save();
};

module.exports = mongoose.model('Employer', employerSchema);
