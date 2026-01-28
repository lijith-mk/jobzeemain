const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true }, // Path name
  title: { type: String, required: true, trim: true }, // Display title
  description: { type: String, required: true },
  thumbnail: { type: String },
  
  // Role-based targeting
  targetJobRole: { type: String, required: true, trim: true }, // e.g., "Full Stack Developer", "Data Analyst"
  targetRole: { type: String, required: true, trim: true }, // Alias for backward compatibility
  
  // Difficulty level
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true 
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: function() { return this.level; }
  },
  
  // Duration and structure
  estimatedDuration: { type: Number }, // Total duration in hours
  totalLessons: { type: Number, default: 0 },
  
  // Courses in this learning path
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },
    isRequired: { type: Boolean, default: true },
    estimatedDuration: { type: Number } // Duration for this specific course
  }],
  
  // Skills and outcomes
  skills: [{ type: String }], // Skills gained from completing this path
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }], // What learners will achieve
  
  // Career information
  careerOutlook: { type: String }, // Career prospects after completion
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  
  // Status and visibility
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  
  // Metrics
  enrollmentCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Metadata
  tags: [{ type: String }],
  category: { type: String }, // e.g., "Technology", "Business", "Design"
  
  // Creator reference
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save hook to sync targetRole and targetJobRole
learningPathSchema.pre('save', function(next) {
  if (this.isModified('targetJobRole') && !this.isModified('targetRole')) {
    this.targetRole = this.targetJobRole;
  }
  if (this.isModified('targetRole') && !this.isModified('targetJobRole')) {
    this.targetJobRole = this.targetRole;
  }
  next();
});

// Indexes for search and filtering
learningPathSchema.index({ title: 'text', description: 'text', tags: 'text' });
learningPathSchema.index({ targetJobRole: 1, level: 1 });
learningPathSchema.index({ targetRole: 1, level: 1 });
learningPathSchema.index({ isActive: 1, status: 1 });
learningPathSchema.index({ category: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
