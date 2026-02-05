const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Certificate Model
 * Stores issued certificates for course completion
 * Certificates are immutable after creation for verification integrity
 */

const certificateSchema = new mongoose.Schema({
  // Unique certificate identifier
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: function() {
      // Generate unique certificate ID: CERT-YEAR-RANDOM
      const year = new Date().getFullYear();
      const random = crypto.randomBytes(6).toString('hex').toUpperCase();
      return `CERT-${year}-${random}`;
    }
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    immutable: true // Cannot be changed after creation
  },
  
  // Course reference
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
    immutable: true // Cannot be changed after creation
  },
  
  // User details (cached for quick access and immutability)
  userName: {
    type: String,
    required: true,
    immutable: true
  },
  
  userEmail: {
    type: String,
    required: true,
    immutable: true
  },
  
  // Course details (cached for quick access and immutability)
  courseName: {
    type: String,
    required: true,
    immutable: true
  },
  
  courseCategory: {
    type: String,
    immutable: true
  },
  
  courseLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    immutable: true
  },
  
  // Issuance details
  issuedAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  },
  
  // Certificate hash for verification
  certificateHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
    immutable: true
  },
  
  // Blockchain integration (optional)
  blockchainTxHash: {
    type: String,
    default: null,
    index: true,
    sparse: true // Allows multiple null values
  },
  
  blockchainNetwork: {
    type: String,
    enum: ['ethereum', 'polygon', 'binance', null],
    default: null
  },
  
  blockchainTimestamp: {
    type: Date,
    default: null
  },
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'blockchain-verified', 'revoked'],
    default: 'verified',
    required: true
  },
  
  // Completion metrics (for display on certificate)
  completionMetrics: {
    totalLessons: {
      type: Number,
      required: true,
      immutable: true
    },
    completedLessons: {
      type: Number,
      required: true,
      immutable: true
    },
    totalQuizzes: {
      type: Number,
      default: 0,
      immutable: true
    },
    passedQuizzes: {
      type: Number,
      default: 0,
      immutable: true
    },
    averageQuizScore: {
      type: Number,
      default: 0,
      immutable: true
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0,
      immutable: true
    },
    completionPercentage: {
      type: Number,
      default: 100,
      immutable: true
    }
  },
  
  // Certificate template and file
  certificateUrl: {
    type: String, // URL to generated certificate PDF/image
    default: null
  },
  
  certificateTemplate: {
    type: String,
    default: 'default',
    enum: ['default', 'premium', 'professional', 'honors']
  },
  
  // Skills achieved (from course)
  skillsAchieved: [{
    type: String
  }],
  
  // Grade/Performance (optional)
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'Pass', null],
    default: null
  },
  
  // Honors/Distinction
  honors: {
    type: Boolean,
    default: false,
    immutable: true
  },
  
  // Revocation (for exceptional cases like fraud)
  isRevoked: {
    type: Boolean,
    default: false
  },
  
  revokedAt: {
    type: Date,
    default: null
  },
  
  revokedReason: {
    type: String,
    default: null
  },
  
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Verification tracking
  verificationCount: {
    type: Number,
    default: 0
  },
  
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  ipAddress: {
    type: String,
    immutable: true
  },
  
  userAgent: {
    type: String,
    immutable: true
  }
}, { 
  timestamps: true,
  // Disable version key since certificates should be immutable
  versionKey: false
});

// Compound indexes
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true }); // One certificate per user per course
certificateSchema.index({ userId: 1, issuedAt: -1 }); // User's certificates sorted by date
certificateSchema.index({ courseId: 1, issuedAt: -1 }); // Course certificates
certificateSchema.index({ verificationStatus: 1, issuedAt: -1 });
certificateSchema.index({ isRevoked: 1 });

// Pre-save hook to generate certificate hash
certificateSchema.pre('save', function(next) {
  console.log('=== Certificate pre-save hook ===');
  console.log('isNew:', this.isNew);
  console.log('certificateId:', this.certificateId);
  console.log('issuedAt:', this.issuedAt);
  
  // Only generate hash on creation (when document is new)
  if (this.isNew) {
    // Create hash from critical certificate data
    const data = `${this.certificateId}-${this.userId}-${this.courseId}-${this.issuedAt.toISOString()}-${this.userName}-${this.courseName}`;
    console.log('Generating hash from:', data);
    this.certificateHash = crypto.createHash('sha256').update(data).digest('hex');
    console.log('Generated hash:', this.certificateHash);
  }
  next();
});

// Method to verify certificate integrity
certificateSchema.methods.verifyIntegrity = function() {
  const data = `${this.certificateId}-${this.userId}-${this.courseId}-${this.issuedAt.toISOString()}-${this.userName}-${this.courseName}`;
  const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
  return this.certificateHash === expectedHash;
};

// Method to revoke certificate (admin only)
certificateSchema.methods.revoke = function(reason, adminId) {
  if (this.isRevoked) {
    throw new Error('Certificate is already revoked');
  }
  
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  this.revokedBy = adminId;
  this.verificationStatus = 'revoked';
  
  return this.save();
};

// Method to record verification
certificateSchema.methods.recordVerification = function() {
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  return this.save();
};

// Method to get certificate public data (for verification)
certificateSchema.methods.getPublicData = function() {
  return {
    certificateId: this.certificateId,
    userName: this.userName,
    courseName: this.courseName,
    courseCategory: this.courseCategory,
    courseLevel: this.courseLevel,
    issuedAt: this.issuedAt,
    certificateHash: this.certificateHash,
    verificationStatus: this.verificationStatus,
    isRevoked: this.isRevoked,
    blockchainTxHash: this.blockchainTxHash,
    blockchainNetwork: this.blockchainNetwork,
    completionMetrics: this.completionMetrics,
    skillsAchieved: this.skillsAchieved,
    grade: this.grade,
    honors: this.honors
  };
};

// Static method to verify certificate by ID
certificateSchema.statics.verifyCertificate = async function(certificateId) {
  const certificate = await this.findOne({ certificateId }).select('-userAgent -ipAddress');
  
  if (!certificate) {
    return {
      valid: false,
      message: 'Certificate not found'
    };
  }
  
  if (certificate.isRevoked) {
    return {
      valid: false,
      message: 'Certificate has been revoked',
      revokedAt: certificate.revokedAt,
      revokedReason: certificate.revokedReason
    };
  }
  
  // Verify integrity
  const integrityValid = certificate.verifyIntegrity();
  
  if (!integrityValid) {
    return {
      valid: false,
      message: 'Certificate integrity check failed'
    };
  }
  
  // Record verification
  await certificate.recordVerification();
  
  return {
    valid: true,
    message: 'Certificate is valid',
    certificate: certificate.getPublicData()
  };
};

// Prevent updates to immutable certificates (extra safety)
certificateSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // List of immutable fields
  const immutableFields = [
    'certificateId', 'userId', 'courseId', 'userName', 'userEmail',
    'courseName', 'courseCategory', 'courseLevel', 'issuedAt',
    'certificateHash', 'completionMetrics', 'ipAddress', 'userAgent', 'honors'
  ];
  
  // Check if any immutable field is being updated
  const updateKeys = Object.keys(update.$set || update);
  const hasImmutableUpdate = updateKeys.some(key => immutableFields.includes(key));
  
  if (hasImmutableUpdate) {
    return next(new Error('Cannot modify immutable certificate fields'));
  }
  
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
