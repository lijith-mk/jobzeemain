const mongoose = require('mongoose');

const mentorApplicationSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true,
    unique: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  currentRole: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0
  },
  skills: {
    type: [String],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one skill is required'
    }
  },
  linkedinUrl: {
    type: String,
    trim: true,
    default: ''
  },
  whyMentor: {
    type: String,
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 1000
  },
  proofDocument: {
    type: String, // URL to uploaded document
    default: ''
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  },
  submittedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save middleware to update updatedAt
mentorApplicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.isNew && this.isCompleted) {
    this.submittedAt = Date.now();
  }
  next();
});

// Method to mark application as completed
mentorApplicationSchema.methods.markAsCompleted = function () {
  this.isCompleted = true;
  this.submittedAt = Date.now();
  return this.save();
};

module.exports = mongoose.model('MentorApplication', mentorApplicationSchema);

