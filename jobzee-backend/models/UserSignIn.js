const mongoose = require('mongoose');

const userSignInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  role: { type: String },
  password: { type: String },
  method: { type: String, enum: ['password', 'google'] },
  authProvider: { type: String, enum: ['local', 'google'] },
  avatar: { type: String },
  profilePhoto: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true }
}, { timestamps: true, collection: 'usersignin' });

// Ensure a single sign-in summary per user
userSignInSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserSignIn', userSignInSchema);


