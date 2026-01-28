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
  unlockedCourses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    unlockedAt: { type: Date, default: Date.now }
  }],
  currentCourseIndex: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for user-path lookup
learningPathProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });

// Instance method: Check if a course is unlocked
learningPathProgressSchema.methods.isCourseUnlocked = function(courseId) {
  return this.unlockedCourses.some(
    uc => uc.courseId.toString() === courseId.toString()
  );
};

// Instance method: Unlock the next course in sequence
learningPathProgressSchema.methods.unlockNextCourse = async function(nextCourseId) {
  if (!this.isCourseUnlocked(nextCourseId)) {
    this.unlockedCourses.push({
      courseId: nextCourseId,
      unlockedAt: new Date()
    });
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('LearningPathProgress', learningPathProgressSchema);
