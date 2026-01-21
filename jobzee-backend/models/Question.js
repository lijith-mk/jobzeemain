const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'coding', 'essay', 'true-false'],
    default: 'mcq',
    required: true
  },
  // For MCQ and True-False
  options: [{
    type: String,
  }],
  correctAnswer: {
    type: String,
  },
  // For Coding questions
  codingDetails: {
    problemStatement: String,
    inputFormat: String,
    outputFormat: String,
    constraints: String,
    sampleInput: String,
    sampleOutput: String,
    expectedSolution: String, // Admin's correct solution/answer
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: { type: Boolean, default: false }
    }],
    starterCode: {
      javascript: String,
      python: String,
      java: String,
      cpp: String
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp'],
      default: 'javascript'
    },
    timeLimit: { type: Number, default: 2000 }, // in milliseconds
    memoryLimit: { type: Number, default: 256 } // in MB
  },
  // For Essay questions
  essayDetails: {
    wordLimit: Number,
    minWords: Number,
    gradingCriteria: String,
    expectedAnswer: String // Admin's model answer/reference solution
  },
  marks: {
    type: Number,
    default: 1,
    required: true
  },
  explanation: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ testId: 1, order: 1 });
questionSchema.index({ testId: 1, isActive: 1 });
questionSchema.index({ type: 1 });

module.exports = mongoose.model('Question', questionSchema);
