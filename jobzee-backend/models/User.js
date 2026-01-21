const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  country: { type: String },
  password: { type: String },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  // Google OAuth fields
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String }, // For Google profile picture
  profilePhoto: { type: String }, // Cloudinary URL
  resume: { type: String }, // Resume Cloudinary URL
  // Basic profile fields
  bio: { type: String },
  title: { type: String }, // Professional title
  website: { type: String },
  socialMedia: {
    github: { type: String },
    linkedIn: { type: String },
    twitter: { type: String }
  },
  portfolio: { type: String },
  languages: [{ type: String }],
  achievements: [{ type: String }],
  certifications: [{ type: String }],
  preferences: {
    jobType: { type: String },
    salaryRange: { type: String },
    availability: { type: String },
    remotePreference: { type: String },
    industries: [{ type: String }]
  },
  // Onboarding fields
  isOnboarded: { type: Boolean, default: false },
  onboardingSkipped: { type: Boolean, default: false },
  experienceLevel: { type: String, enum: ['fresher', 'experienced', 'not-specified'], default: null },
  experience: { type: String }, // User's experience level (for profile display)
  preferredFields: [{ type: String }],
  expectedSalary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  remotePreference: { type: String, enum: ['remote', 'hybrid', 'onsite', 'any', 'not-specified'], default: null },
  location: { type: String },
  skills: [{ type: String }],
  education: { type: String },
  yearsOfExperience: { type: Number },
  currentRole: { type: String },
  preferredJobTypes: [{ type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] }],
  workAuthorization: { type: String, enum: ['citizen', 'permanent-resident', 'work-visa', 'student-visa', 'other'] },
  willingToRelocate: { type: Boolean, default: false },
  noticePeriod: { type: String, enum: ['immediate', '15-days', '30-days', '60-days', '90-days'] },
  
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
  ,
  // Saved jobs
  savedJobs: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Admin management fields
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  suspensionReason: { type: String },
  suspendedAt: { type: Date },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
