const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  jobRole: {
    type: String,
    trim: true,
  },
  skill: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'coding', 'mixed', 'essay'],
    default: 'mcq',
    required: true,
  },
  category: {
    type: String,
    enum: ['technical', 'aptitude', 'reasoning', 'language', 'general'],
    default: 'technical',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  duration: {
    type: Number, // in minutes
    default: 30,
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
  passingMarks: {
    type: Number,
    default: 40,
  },
  questionCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
  },
  createdByModel: {
    type: String,
    enum: ['Admin', 'Employer'],
    default: 'Admin',
  },
  tags: [{
    type: String,
  }],
  skills: [{ // Skills tested by this test - for skill gap detection
    type: String,
  }],
  requiredSkills: [{ // Alternative field name for compatibility
    type: String,
  }],
  instructions: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
testSchema.index({ title: 1 });
testSchema.index({ category: 1 });
testSchema.index({ type: 1 });
testSchema.index({ isActive: 1 });
testSchema.index({ jobRole: 1 });
testSchema.index({ skill: 1 });

// Virtual to populate questions
testSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'testId'
});

// Virtual to check if test is publishable (has questions)
testSchema.virtual('isPublishable').get(function() {
  return this.questionCount > 0;
});

// Method to validate before activation
testSchema.methods.canActivate = function() {
  return this.questionCount > 0;
};

// Method to calculate total marks from all questions
testSchema.methods.calculateTotalMarks = async function() {
  const Question = mongoose.model('Question');
  const questions = await Question.find({ testId: this._id });
  const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0);
  return totalMarks;
};

// Method to update total marks from questions
testSchema.methods.updateTotalMarks = async function() {
  const totalMarks = await this.calculateTotalMarks();
  this.totalMarks = totalMarks;
  return totalMarks;
};

// Ensure virtuals are included in JSON
testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Test', testSchema);
