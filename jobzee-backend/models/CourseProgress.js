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
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  timeSpent: { type: Number, default: 0 }, // Total time spent in minutes
  lastAccessedAt: { type: Date, default: Date.now },
  currentModule: { type: Number, default: 0 },
  currentLesson: { type: Number, default: 0 },
  quizScores: [{
    lessonId: { type: String },
    score: { type: Number },
    totalQuestions: { type: Number },
    attemptedAt: { type: Date, default: Date.now }
  }],
  notes: [{ type: String }],
  bookmarks: [{
    moduleIndex: { type: Number },
    lessonIndex: { type: Number },
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
