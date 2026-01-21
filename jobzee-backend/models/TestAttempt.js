const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  testTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number,
    required: true
  },
  autoSubmit: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in-progress', 'processing', 'completed', 'abandoned'],
    default: 'completed'
  },
  gradingStatus: {
    type: String,
    enum: ['auto-graded', 'pending-review', 'graded'],
    default: 'auto-graded'
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  gradedAt: {
    type: Date
  },
  adminFeedback: {
    type: String,
    default: ''
  },
  // Anti-cheat tracking fields
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  tabSwitchTimestamps: [{
    type: Date
  }],
  suspiciousActivity: {
    type: Boolean,
    default: false
  },
  fraudDetected: {
    type: Boolean,
    default: false
  },
  fraudReason: {
    type: String,
    default: ''
  },
  warningCount: {
    type: Number,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for faster queries
testAttemptSchema.index({ userId: 1, completedAt: -1 });
testAttemptSchema.index({ testId: 1, completedAt: -1 });
testAttemptSchema.index({ userId: 1, testId: 1 });
testAttemptSchema.index({ status: 1 });

// Virtual to populate answers
testAttemptSchema.virtual('answers', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'attemptId'
});

// Ensure virtuals are included in JSON
testAttemptSchema.set('toJSON', { virtuals: true });
testAttemptSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
