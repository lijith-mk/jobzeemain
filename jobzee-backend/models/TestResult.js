const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String,
    default: 'Not Attempted'
  },
  correctAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  marks: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  explanation: String
});

const testResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  testTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
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
    required: true
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
  questionResults: [questionResultSchema],
  completedAt: {
    type: Date,
    default: Date.now
  },
  // Skill-wise performance analysis
  skillAnalysis: [{
    skill: { type: String },
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // Percentage
    isWeakArea: { type: Boolean, default: false } // Below 70% accuracy
  }]
}, {
  timestamps: true
});

// Index for faster queries
testResultSchema.index({ userId: 1, completedAt: -1 });
testResultSchema.index({ testId: 1 });
testResultSchema.index({ userId: 1, testId: 1 });

module.exports = mongoose.model('TestResult', testResultSchema);
