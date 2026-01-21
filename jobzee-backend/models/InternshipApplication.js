const mongoose = require('mongoose');

const internshipApplicationSchema = new mongoose.Schema({
  // References
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: [true, 'Internship reference is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: [true, 'Employer reference is required'],
    index: true
  },

  // Application Details
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true
  },
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Application Data
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  resumeUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Resume URL must be a valid URL'
    }
  },
  portfolioUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Portfolio URL must be a valid URL'
    }
  },

  // Additional Information
  expectedStartDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v >= new Date();
      },
      message: 'Expected start date must be in the future'
    }
  },
  additionalInfo: {
    type: String,
    maxlength: [1000, 'Additional information cannot exceed 1000 characters']
  },

  // Skills and Experience
  relevantSkills: [{
    type: String,
    trim: true
  }],
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50']
  },

  // Status Management
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.changedByModel'
    },
    changedByModel: {
      type: String,
      enum: ['User', 'Employer']
    },
    notes: String
  }],

  // Communication
  lastContactedAt: Date,
  interviewScheduled: {
    type: Boolean,
    default: false
  },
  interviewDate: Date,
  interviewNotes: String,

  // Metadata
  applicationSource: {
    type: String,
    enum: ['direct', 'external', 'referral'],
    default: 'direct'
  },
  deviceInfo: {
    userAgent: String,
    ip: String
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'deletedByModel'
  },
  deletedByModel: {
    type: String,
    enum: ['User', 'Employer']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes for efficient queries
internshipApplicationSchema.index({ internship: 1, user: 1 }, { unique: true });
internshipApplicationSchema.index({ employer: 1, status: 1 });
internshipApplicationSchema.index({ user: 1, appliedAt: -1 });
internshipApplicationSchema.index({ internship: 1, appliedAt: -1 });
internshipApplicationSchema.index({ status: 1, appliedAt: -1 });

// Virtual for application age
internshipApplicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const applied = new Date(this.appliedAt);
  const diffTime = Math.abs(now - applied);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for status display
internshipApplicationSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'applied': 'Applied',
    'reviewed': 'Under Review',
    'shortlisted': 'Shortlisted',
    'interview': 'Interview Scheduled',
    'selected': 'Selected',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn'
  };
  return statusMap[this.status] || this.status;
});

// Instance Methods
internshipApplicationSchema.methods.updateStatus = function(newStatus, changedBy, changedByModel, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    changedByModel,
    notes
  });
  
  if (newStatus === 'reviewed') {
    this.reviewedAt = new Date();
    this.reviewedBy = changedBy;
  }
  
  return this.save();
};

internshipApplicationSchema.methods.withdraw = function() {
  this.status = 'withdrawn';
  this.statusHistory.push({
    status: 'withdrawn',
    changedAt: new Date(),
    changedBy: this.user,
    changedByModel: 'User',
    notes: 'Application withdrawn by user'
  });
  return this.save();
};

internshipApplicationSchema.methods.softDelete = function(deletedBy, deletedByModel) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletedByModel = deletedByModel;
  return this.save();
};

// Static Methods
internshipApplicationSchema.statics.getApplicationsByInternship = function(internshipId, options = {}) {
  const query = { 
    internship: internshipId, 
    isDeleted: false 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('user', 'name email phone profilePhoto location skills experience')
    .populate('internship', 'title company location duration stipend')
    .sort({ appliedAt: -1 });
};

internshipApplicationSchema.statics.getApplicationsByUser = function(userId, options = {}) {
  const query = { 
    user: userId, 
    isDeleted: false 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('internship', 'title company location duration stipend status applicationDeadline')
    .populate('employer', 'name companyName companyLogo')
    .sort({ appliedAt: -1 });
};

internshipApplicationSchema.statics.getApplicationsByEmployer = function(employerId, options = {}) {
  const query = { 
    employer: employerId, 
    isDeleted: false 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.internship) {
    query.internship = options.internship;
  }
  
  return this.find(query)
    .populate('user', 'name email phone profilePhoto location skills experience education')
    .populate('internship', 'title location duration stipend')
    .sort({ appliedAt: -1 });
};

internshipApplicationSchema.statics.getApplicationStats = function(employerId) {
  return this.aggregate([
    { $match: { employer: mongoose.Types.ObjectId(employerId), isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        stats: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
internshipApplicationSchema.pre('save', function(next) {
  // Add initial status to history if new document
  if (this.isNew) {
    this.statusHistory.push({
      status: 'applied',
      changedAt: new Date(),
      changedBy: this.user,
      changedByModel: 'User',
      notes: 'Initial application submitted'
    });
  }
  next();
});

// Post-save middleware to update internship application count
internshipApplicationSchema.post('save', async function() {
  try {
    const Internship = mongoose.model('Internship');
    const count = await this.constructor.countDocuments({
      internship: this.internship,
      isDeleted: false
    });
    await Internship.findByIdAndUpdate(this.internship, { applicationCount: count });
  } catch (error) {
    console.error('Error updating internship application count:', error);
  }
});

// Post-remove middleware to update internship application count
internshipApplicationSchema.post('remove', async function() {
  try {
    const Internship = mongoose.model('Internship');
    const count = await this.constructor.countDocuments({
      internship: this.internship,
      isDeleted: false
    });
    await Internship.findByIdAndUpdate(this.internship, { applicationCount: count });
  } catch (error) {
    console.error('Error updating internship application count:', error);
  }
});

module.exports = mongoose.model('InternshipApplication', internshipApplicationSchema);