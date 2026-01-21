const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  // Reference to auth record
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true,
    unique: true
  },
  
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  
  // Profile Images
  profilePhoto: { type: String }, // Cloudinary URL
  avatar: { type: String }, // For Google profile picture
  
  // Professional Information
  title: { type: String }, // Professional title
  bio: { type: String, maxlength: 1000 },
  currentRole: { type: String },
  yearsOfExperience: { type: Number, min: 0 },
  experienceLevel: { type: String, enum: ['fresher', 'entry-level', 'mid-level', 'senior-level', 'executive'] },
  
  // Skills and Education
  skills: [{ type: String }],
  education: {
    degree: { type: String },
    field: { type: String },
    institution: { type: String },
    graduationYear: { type: Number },
    gpa: { type: Number }
  },
  certifications: [{
    name: { type: String },
    issuer: { type: String },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String },
    credentialUrl: { type: String }
  }],
  
  // Documents
  resume: { type: String }, // Cloudinary URL
  coverLetter: { type: String }, // Cloudinary URL
  
  // Location and Contact
  location: {
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
  portfolio: { type: String },
  socialMedia: {
    linkedIn: { type: String },
    github: { type: String },
    twitter: { type: String },
    portfolio: { type: String }
  },
  
  // Job Preferences
  preferences: {
    jobTypes: [{ type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'] }],
    industries: [{ type: String }],
    workArrangement: { type: String, enum: ['remote', 'hybrid', 'onsite', 'any'], default: 'any' },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    availability: { type: String, enum: ['immediate', '15-days', '30-days', '60-days', '90-days'] },
    willingToRelocate: { type: Boolean, default: false }
  },
  
  // Work Authorization
  workAuthorization: { 
    type: String, 
    enum: ['citizen', 'permanent-resident', 'work-visa', 'student-visa', 'other'] 
  },
  
  // Languages
  languages: [{
    language: { type: String },
    proficiency: { type: String, enum: ['basic', 'conversational', 'fluent', 'native'] }
  }],
  
  // Achievements and Awards
  achievements: [{
    title: { type: String },
    description: { type: String },
    date: { type: Date },
    issuer: { type: String }
  }],
  
  // Onboarding Status
  isOnboarded: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 1 },
  
  // Privacy Settings
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'private', 'employers-only'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    allowMessages: { type: Boolean, default: true }
  },
  
  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    jobAlerts: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false }
  },
  
  // Activity Tracking
  lastActiveAt: { type: Date, default: Date.now },
  profileViews: { type: Number, default: 0 },
  profileCompleteness: { type: Number, default: 0 }, // Percentage
  
  // Status
  isActive: { type: Boolean, default: true },
  jobSearchStatus: { 
    type: String, 
    enum: ['actively-looking', 'open-to-opportunities', 'not-looking'], 
    default: 'actively-looking' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userProfileSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for age calculation
userProfileSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for search functionality
userProfileSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  title: 'text',
  skills: 'text',
  'location.city': 'text'
});

// Index for location-based queries
userProfileSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to calculate profile completeness
userProfileSchema.pre('save', function(next) {
  const requiredFields = [
    'firstName', 'lastName', 'title', 'bio', 'skills', 'education.degree',
    'location.city', 'preferences.jobTypes', 'resume'
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

// Method to increment profile views
userProfileSchema.methods.incrementViews = function() {
  this.profileViews += 1;
  return this.save();
};

// Method to update last active timestamp
userProfileSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
