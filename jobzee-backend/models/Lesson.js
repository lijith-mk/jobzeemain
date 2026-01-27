const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  // Course reference
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  
  // Lesson details
  title: { 
    type: String, 
    required: true 
  },
  
  // Content
  videoUrl: { 
    type: String 
  },
  textContent: { 
    type: String 
  },
  
  // Lesson metadata
  duration: { 
    type: Number, // Duration in minutes
    required: true 
  },
  difficultyLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true 
  },
  lessonOrder: { 
    type: Number, 
    required: true 
  },
  
  // Status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Additional fields
  description: { 
    type: String 
  },
  thumbnail: { 
    type: String 
  },
  resources: [{
    title: { type: String },
    url: { type: String },
    type: { type: String, enum: ['pdf', 'link', 'video', 'article', 'code'] }
  }],
  
  // Quiz/Assessment (optional)
  hasQuiz: { 
    type: Boolean, 
    default: false 
  },
  quizQuestions: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  }],
  
  // Engagement metrics
  viewCount: { 
    type: Number, 
    default: 0 
  },
  completionCount: { 
    type: Number, 
    default: 0 
  },
  averageRating: { 
    type: Number, 
    default: 0 
  },
  
  // Creator reference
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Indexes for efficient querying
lessonSchema.index({ courseId: 1, lessonOrder: 1 });
lessonSchema.index({ courseId: 1, isActive: 1 });
lessonSchema.index({ difficultyLevel: 1 });

// Ensure unique lesson order within a course
lessonSchema.index({ courseId: 1, lessonOrder: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
