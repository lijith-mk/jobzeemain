const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled' 
  },
  progressPercentage: { type: Number, default: 0 },
  completedLessons: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    completedAt: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 } // Time spent on this lesson in minutes
  }],
  timeSpent: { type: Number, default: 0 }, // Total time spent in minutes
  lastAccessedAt: { type: Date, default: Date.now },
  currentLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  quizScores: [{
    lessonId: { type: String },
    score: { type: Number },
    totalQuestions: { type: Number },
    attemptedAt: { type: Date, default: Date.now }
  }],
  notes: [{ type: String }],
  bookmarks: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
}, { timestamps: true });

// Compound index for user-course lookup
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
