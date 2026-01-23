const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  targetRole: { type: String, required: true }, // e.g., "Full Stack Developer", "Data Analyst"
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true 
  },
  estimatedDuration: { type: Number }, // Total duration in hours
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },
    isRequired: { type: Boolean, default: true }
  }],
  skills: [{ type: String }], // Skills gained from completing this path
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }], // What learners will achieve
  isActive: { type: Boolean, default: true },
  enrollmentCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for search
learningPathSchema.index({ title: 'text', description: 'text' });
learningPathSchema.index({ targetRole: 1, level: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
