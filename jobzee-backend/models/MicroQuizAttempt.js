const mongoose = require('mongoose');

/**
 * MicroQuizAttempt Model
 * Tracks user attempts at lesson micro quizzes
 */

const microQuizAttemptSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Quiz reference
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MicroQuiz',
    required: true,
    index: true
  },
  
  // Lesson and Course for quick access
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Attempt metadata
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Answers submitted
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: {
      type: String, // Can be optionId or text answer
      default: 'Not Attempted'
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    pointsEarned: {
      type: Number,
      default: 0
    }
  }],
  
  // Scoring
  score: {
    type: Number,
    required: true,
    default: 0
  },
  
  totalPoints: {
    type: Number,
    required: true
  },
  
  percentage: {
    type: Number,
    required: true
  },
  
  passed: {
    type: Boolean,
    required: true
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date,
    default: Date.now
  },
  
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'completed'
  },
  
  // Detailed results (from grading)
  detailedResults: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes
microQuizAttemptSchema.index({ userId: 1, quizId: 1 });
microQuizAttemptSchema.index({ userId: 1, lessonId: 1 });
microQuizAttemptSchema.index({ userId: 1, courseId: 1 });
microQuizAttemptSchema.index({ completedAt: -1 });

// Static method to get user's best attempt for a quiz
microQuizAttemptSchema.statics.getBestAttempt = async function(userId, quizId) {
  return await this.findOne({ userId, quizId, status: 'completed' })
    .sort({ percentage: -1, completedAt: 1 })
    .limit(1);
};

// Static method to get user's attempt count for a quiz
microQuizAttemptSchema.statics.getAttemptCount = async function(userId, quizId) {
  return await this.countDocuments({ userId, quizId, status: 'completed' });
};

// Static method to check if user can attempt quiz
microQuizAttemptSchema.statics.canAttempt = async function(userId, quizId, maxAttempts) {
  if (!maxAttempts || maxAttempts === 0) return true; // Unlimited
  
  const attemptCount = await this.getAttemptCount(userId, quizId);
  return attemptCount < maxAttempts;
};

// Static method to get user's quiz statistics
microQuizAttemptSchema.statics.getUserStats = async function(userId, quizId) {
  const attempts = await this.find({ 
    userId, 
    quizId, 
    status: 'completed' 
  }).sort({ completedAt: -1 });
  
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      averageScore: 0,
      passed: false
    };
  }
  
  const bestAttempt = attempts.reduce((best, current) => 
    current.percentage > best.percentage ? current : best
  );
  
  const averageScore = attempts.reduce((sum, attempt) => 
    sum + attempt.percentage, 0
  ) / attempts.length;
  
  return {
    totalAttempts: attempts.length,
    bestScore: bestAttempt.percentage,
    averageScore: Math.round(averageScore * 100) / 100,
    passed: bestAttempt.passed,
    lastAttemptAt: attempts[0].completedAt
  };
};

module.exports = mongoose.model('MicroQuizAttempt', microQuizAttemptSchema);
