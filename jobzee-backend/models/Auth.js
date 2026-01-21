const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String,
    required: function() {
      return this.authProvider === 'local';
    }
  },
  role: { 
    type: String, 
    required: true,
    enum: ['user', 'employer', 'admin'],
    default: 'user'
  },
  
  // OAuth fields
  googleId: { type: String, sparse: true, unique: true },
  authProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  // Password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Security
  lastLoginAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // Reference to profile
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel'
  },
  profileModel: {
    type: String,
    enum: ['UserProfile', 'EmployerProfile', 'AdminProfile']
  }
}, { 
  timestamps: true 
});

// Indexes
authSchema.index({ email: 1 });
authSchema.index({ googleId: 1 });
authSchema.index({ resetPasswordToken: 1 });

// Virtual for checking if account is locked
authSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
authSchema.pre('save', async function(next) {
  // Only hash password if it's being modified and it's a local auth
  if (!this.isModified('password') || this.authProvider !== 'local') {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
authSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
authSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
authSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('Auth', authSchema);
