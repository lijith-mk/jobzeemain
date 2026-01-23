const mongoose = require('mongoose');

const learningPathProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  enrolledAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled' 
  },
  progressPercentage: { type: Number, default: 0 },
  completedCourses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedAt: { type: Date, default: Date.now }
  }],
  currentCourseIndex: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for user-path lookup
learningPathProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });

module.exports = mongoose.model('LearningPathProgress', learningPathProgressSchema);
