const mongoose = require('mongoose');

/**
 * MicroQuiz Model
 * Optional quiz attached to individual lessons
 * Admin-controlled for validating learner engagement
 */

const microQuizQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    default: 'multiple-choice',
    required: true
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  correctAnswer: {
    type: String, // For fill-blank type
  },
  points: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  explanation: {
    type: String, // Shown after answer submission
    trim: true
  },
  order: {
    type: Number,
    required: true
  }
});

const microQuizSchema = new mongoose.Schema({
  // Lesson reference
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    unique: true // One quiz per lesson
  },
  
  // Course reference for easier querying
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Quiz metadata
  title: {
    type: String,
    required: true,
    trim: true,
    default: function() {
      return 'Lesson Quiz';
    }
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Quiz configuration
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  
  timeLimit: {
    type: Number, // in minutes
    default: null // null means no time limit
  },
  
  maxAttempts: {
    type: Number,
    default: 3, // null or 0 means unlimited
    min: 0
  },
  
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  
  showCorrectAnswers: {
    type: Boolean,
    default: true // Show correct answers after submission
  },
  
  requirePassingToProgress: {
    type: Boolean,
    default: false // Must pass quiz to mark lesson complete
  },
  
  // Questions
  questions: [microQuizQuestionSchema],
  
  totalPoints: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Instructions
  instructions: {
    type: String,
    default: 'Answer all questions to test your understanding of this lesson.'
  },
  
  // Statistics
  totalAttempts: {
    type: Number,
    default: 0
  },
  
  averageScore: {
    type: Number,
    default: 0
  },
  
  passRate: {
    type: Number,
    default: 0
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  
  createdByModel: {
    type: String,
    enum: ['Admin', 'User'],
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes
microQuizSchema.index({ lessonId: 1 });
microQuizSchema.index({ courseId: 1 });
microQuizSchema.index({ isActive: 1 });

// Pre-save hook to calculate total points
microQuizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  next();
});

// Method to validate quiz answers
microQuizSchema.methods.gradeAttempt = function(userAnswers) {
  let score = 0;
  const results = [];
  
  // Ensure userAnswers is an object
  const answers = userAnswers || {};
  
  this.questions.forEach((question, index) => {
    const questionIdStr = question._id.toString();
    const userAnswer = answers[questionIdStr] || answers[index] || null;
    let isCorrect = false;
    let correctAnswer = null;
    
    if (question.questionType === 'multiple-choice') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      correctAnswer = correctOption ? correctOption._id.toString() : null;
      isCorrect = userAnswer && userAnswer === correctAnswer;
    } else if (question.questionType === 'true-false') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      correctAnswer = correctOption ? correctOption.text : null;
      isCorrect = userAnswer && userAnswer === correctAnswer;
    } else if (question.questionType === 'fill-blank') {
      correctAnswer = question.correctAnswer;
      isCorrect = userAnswer && 
                  userAnswer.trim().toLowerCase() === 
                  correctAnswer.trim().toLowerCase();
    }
    
    if (isCorrect) {
      score += question.points;
    }
    
    results.push({
      questionId: question._id,
      questionText: question.questionText,
      userAnswer: userAnswer || 'Not Attempted',
      correctAnswer,
      isCorrect,
      points: isCorrect ? question.points : 0,
      maxPoints: question.points,
      explanation: this.showCorrectAnswers ? question.explanation : null
    });
  });
  
  const percentage = this.totalPoints > 0 ? (score / this.totalPoints) * 100 : 0;
  const passed = percentage >= this.passingScore;
  
  return {
    score,
    totalPoints: this.totalPoints,
    percentage: Math.round(percentage * 100) / 100,
    passed,
    results
  };
};

// Method to get quiz for student (without correct answers)
microQuizSchema.methods.getStudentView = function(includeAnswers = false) {
  const quizObj = this.toObject();
  
  if (!includeAnswers) {
    quizObj.questions = quizObj.questions.map(q => {
      const question = { ...q };
      
      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        question.options = question.options.map(opt => ({
          _id: opt._id,
          text: opt.text
          // isCorrect hidden
        }));
      } else if (question.questionType === 'fill-blank') {
        delete question.correctAnswer;
      }
      
      delete question.explanation; // Hide until submission
      return question;
    });
  }
  
  return quizObj;
};

module.exports = mongoose.model('MicroQuiz', microQuizSchema);
