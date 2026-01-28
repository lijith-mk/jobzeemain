const mongoose = require('mongoose');

const learningPathCourseSchema = new mongoose.Schema({
  // Learning path reference
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true,
    index: true
  },
  
  // Course reference
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  // Order in the learning path (sequence matters)
  order: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Whether this course is mandatory or optional
  isRequired: {
    type: Boolean,
    default: true
  },
  
  // Estimated duration for this course within the path
  estimatedDuration: {
    type: Number, // in hours
    min: 0
  },
  
  // Prerequisites - other courses in the path that must be completed first
  prerequisiteCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  description: { type: String }, // Why this course is in this path
  learningObjectives: [{ type: String }], // Specific objectives for this course in the context of the path
  
  // Stats
  completionCount: {
    type: Number,
    default: 0
  },
  
  // Creator reference
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Compound index to ensure unique course-path combination
learningPathCourseSchema.index({ learningPathId: 1, courseId: 1 }, { unique: true });

// Index for ordering courses within a path
learningPathCourseSchema.index({ learningPathId: 1, order: 1 });

// Index for finding all paths a course belongs to
learningPathCourseSchema.index({ courseId: 1, isActive: 1 });

// Validation: Ensure order is unique within a learning path
learningPathCourseSchema.pre('save', async function(next) {
  if (this.isModified('order') || this.isNew) {
    const existingWithSameOrder = await this.constructor.findOne({
      learningPathId: this.learningPathId,
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingWithSameOrder) {
      const error = new Error(`Order ${this.order} is already taken in this learning path. Please use a unique order number.`);
      return next(error);
    }
  }
  next();
});

// Static method: Get all courses in a learning path (ordered)
learningPathCourseSchema.statics.getPathCourses = async function(learningPathId, includeOptional = true) {
  const query = { learningPathId, isActive: true };
  if (!includeOptional) {
    query.isRequired = true;
  }
  
  return this.find(query)
    .populate('courseId')
    .sort({ order: 1 })
    .exec();
};

// Static method: Get all learning paths containing a course
learningPathCourseSchema.statics.getCoursePaths = async function(courseId) {
  return this.find({ courseId, isActive: true })
    .populate('learningPathId')
    .sort({ 'learningPathId.title': 1 })
    .exec();
};

// Static method: Reorder courses in a learning path
learningPathCourseSchema.statics.reorderCourses = async function(learningPathId, courseOrderMap) {
  // courseOrderMap: { courseId: newOrder }
  const bulkOps = Object.entries(courseOrderMap).map(([courseId, newOrder]) => ({
    updateOne: {
      filter: { learningPathId, courseId },
      update: { $set: { order: newOrder } }
    }
  }));
  
  if (bulkOps.length > 0) {
    return this.bulkWrite(bulkOps);
  }
};

// Static method: Get next course in sequence
learningPathCourseSchema.statics.getNextCourse = async function(learningPathId, currentOrder) {
  return this.findOne({
    learningPathId,
    order: { $gt: currentOrder },
    isActive: true
  })
    .sort({ order: 1 })
    .populate('courseId')
    .exec();
};

// Static method: Get previous course in sequence
learningPathCourseSchema.statics.getPreviousCourse = async function(learningPathId, currentOrder) {
  return this.findOne({
    learningPathId,
    order: { $lt: currentOrder },
    isActive: true
  })
    .sort({ order: -1 })
    .populate('courseId')
    .exec();
};

// Instance method: Check if prerequisites are met for a user
learningPathCourseSchema.methods.checkPrerequisites = async function(userId) {
  if (!this.prerequisiteCourses || this.prerequisiteCourses.length === 0) {
    return { met: true, missing: [] };
  }
  
  const CourseProgress = mongoose.model('CourseProgress');
  
  const completedCourses = await CourseProgress.find({
    userId,
    courseId: { $in: this.prerequisiteCourses },
    status: 'completed'
  }).select('courseId');
  
  const completedCourseIds = completedCourses.map(cp => cp.courseId.toString());
  const missingPrerequisites = this.prerequisiteCourses.filter(
    prereqId => !completedCourseIds.includes(prereqId.toString())
  );
  
  return {
    met: missingPrerequisites.length === 0,
    missing: missingPrerequisites
  };
};

module.exports = mongoose.model('LearningPathCourse', learningPathCourseSchema);
