const mongoose = require('mongoose');

const employerSignInSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
  companyName: { type: String },
  companyEmail: { type: String },
  companyPhone: { type: String },
  contactPersonName: { type: String },
  contactPersonEmail: { type: String },
  role: { type: String },
  password: { type: String },
  method: { type: String, enum: ['password', 'google'] },
  authProvider: { type: String, enum: ['local', 'google'] },
  avatar: { type: String },
  companyLogo: { type: String },
  profilePhoto: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true }
}, { timestamps: true, collection: 'employersignin' });

// Ensure only one sign-in record per employer
employerSignInSchema.index({ employerId: 1 }, { unique: true });

module.exports = mongoose.model('EmployerSignIn', employerSignInSchema);


