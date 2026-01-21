const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'coding', 'essay', 'true-false'],
    default: 'mcq'
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
  manuallyGraded: {
    type: Boolean,
    default: false
  },
  gradingNotes: {
    type: String
  },
  explanation: String,
  // Store coding/essay details for results display
  codingDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  essayDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Flag to indicate if user used embedded editor
  usedEmbeddedEditor: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
answerSchema.index({ attemptId: 1 });
answerSchema.index({ questionId: 1 });
answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Answer', answerSchema);
