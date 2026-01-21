const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  mentorId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  photo: { type: String }, // URL to photo
  country: { type: String },
  city: { type: String },
  role: { type: String, default: 'mentor' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  availability: [{
    day: { type: String, required: true },
    slots: [{ type: String }]
  }],
  timezone: { type: String, default: 'Asia/Kolkata' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save middleware to handle email normalization
mentorSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Mentor', mentorSchema);
