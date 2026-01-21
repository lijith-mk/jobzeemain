const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  requirements: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['technology', 'marketing', 'finance', 'hr', 'design', 'sales', 'operations', 'consulting', 'customer-service', 'other'],
    default: 'other'
  },
  industry: {
    type: String,
    trim: true
  },
  applicationDeadline: {
    type: Date
  },
  remote: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
    default: 'onsite'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'expired', 'filled'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  applicants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'hired', 'withdrawn'],
      default: 'applied'
    },
    resume: String,
    coverLetter: String
  }],
  views: {
    type: Number,
    default: 0
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionEndsAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  // Reporting / Flagging
  reports: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, enum: ['spam', 'scam', 'duplicate', 'misleading', 'other'], default: 'other' },
    details: { type: String },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'reviewed', 'dismissed', 'action_taken'], default: 'open' }
  }],
  reportCount: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  // Test/Assessment for this job
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  },
  requiresTest: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
jobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  skills: 'text'
});

// Indexes to aid moderation/reporting queries
jobSchema.index({ status: 1, isFlagged: 1, reportCount: -1 });

module.exports = mongoose.model('Job', jobSchema);
