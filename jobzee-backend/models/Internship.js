const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    maxLength: 5000
  },
  requirements: {
    type: String,
    maxLength: 2000
  },
  responsibilities: {
    type: String,
    maxLength: 2000
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  locationType: {
    type: String,
    enum: ['on-site', 'remote', 'hybrid'],
    default: 'on-site'
  },
  duration: {
    type: Number, // Duration in months
    required: true,
    min: 1,
    max: 12
  },
  stipend: {
    amount: {
      type: Number,
      min: 0,
      default: undefined
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    period: {
      type: String,
      default: 'monthly',
      enum: ['monthly', 'weekly', 'daily', 'one-time']
    }
  },
  isUnpaid: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  eligibility: {
    education: [{
      type: String,
      enum: ['High School', 'Diploma', 'Graduation (Bachelor\'s)', 'Post-graduation (Master\'s)', 'PhD', 'Any']
    }],
    courses: [{
      type: String,
      enum: ['Engineering', 'MBA', 'Computer Science', 'Business Administration', 'Marketing', 'Finance', 'Design', 'Mass Communication', 'Law', 'Medicine', 'Other']
    }],
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year', 'Recent Graduate', 'Any Year'],
      default: undefined
    },
    minCGPA: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  perks: [{
    type: String,
    enum: [
      'Certificate of completion',
      'Letter of recommendation',
      'Pre-placement offer (PPO)',
      'Mentorship',
      'Flexible working hours',
      'Work from home',
      'Free meals',
      'Transportation',
      'Networking opportunities',
      'Skill development programs'
    ]
  }],
  numberOfPositions: {
    type: Number,
    default: 1,
    min: 1
  },
  applicationProcess: {
    type: String,
    enum: ['apply', 'external'],
    default: 'apply'
  },
  externalUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.applicationProcess === 'external') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'External URL is required when application process is external'
    }
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technology', 'marketing', 'finance', 'hr', 'design', 'content', 'operations', 'consulting', 'research', 'other']
  },
  
  // Employer Information
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'closed'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Application Management
  applicationsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  
  // Verification and moderation
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationNotes: String,
  
  // SEO and metadata
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
InternshipSchema.index({ employer: 1, createdAt: -1 });
InternshipSchema.index({ status: 1, isActive: 1 });
InternshipSchema.index({ category: 1, location: 1 });
InternshipSchema.index({ applicationDeadline: 1 });
InternshipSchema.index({ title: 'text', description: 'text', skills: 'text' });
InternshipSchema.index({ slug: 1 });

// Virtual for applications (if you have an InternshipApplication model)
InternshipSchema.virtual('applications', {
  ref: 'InternshipApplication',
  localField: '_id',
  foreignField: 'internship'
});

// Pre-save middleware
InternshipSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  
  // Clean up empty string values for enum fields
  if (this.eligibility) {
    if (this.eligibility.yearOfStudy === '') {
      this.eligibility.yearOfStudy = undefined;
    }
    if (this.eligibility.minCGPA === '') {
      this.eligibility.minCGPA = undefined;
    }
  }
  
  // Handle stipend data for unpaid internships
  if (this.isUnpaid === true) {
    // For unpaid internships, set stipend to null
    this.stipend = null;
  } else if (this.stipend && this.stipend.amount === '') {
    // For paid internships, clean up empty amount
    this.stipend.amount = undefined;
  }
  
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      + '-' + Date.now();
  }
  
  // Auto-expire if deadline has passed
  if (new Date(this.applicationDeadline) < new Date()) {
    this.status = 'expired';
  }
  
  next();
});

// Instance methods
InternshipSchema.methods.incrementViews = function() {
  this.viewsCount += 1;
  return this.save();
};

InternshipSchema.methods.incrementApplications = function() {
  this.applicationsCount += 1;
  return this.save();
};

InternshipSchema.methods.decrementApplications = function() {
  if (this.applicationsCount > 0) {
    this.applicationsCount -= 1;
  }
  return this.save();
};

// Static methods
InternshipSchema.statics.findActiveInternships = function(query = {}) {
  return this.find({
    ...query,
    status: 'active',
    isActive: true,
    applicationDeadline: { $gte: new Date() }
  }).sort({ createdAt: -1 });
};

InternshipSchema.statics.findByEmployer = function(employerId, includeInactive = false) {
  const query = { employer: employerId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

InternshipSchema.statics.searchInternships = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    ...filters
  };
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

module.exports = mongoose.model('Internship', InternshipSchema);