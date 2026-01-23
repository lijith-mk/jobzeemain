const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  category: { 
    type: String, 
    enum: ['programming', 'data-science', 'design', 'business', 'marketing', 'soft-skills', 'other'],
    required: true 
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true 
  },
  skills: [{ type: String }], // Skills covered in this course
  duration: { type: Number }, // Duration in hours
  modules: [{
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    lessons: [{
      title: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['video', 'article', 'quiz', 'assignment', 'resource'],
        required: true 
      },
      content: { type: String }, // URL or content
      duration: { type: Number }, // Duration in minutes
      order: { type: Number, required: true },
      isRequired: { type: Boolean, default: true }
    }]
  }],
  prerequisites: [{ type: String }],
  instructor: {
    name: { type: String },
    bio: { type: String },
    photo: { type: String }
  },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  enrollmentCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  // Integration fields
  relatedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MentorApplication' }],
  relatedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmployerTest' }],
  certificateTemplate: { type: String }, // URL to certificate template
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for search and filtering
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ skills: 1 });

module.exports = mongoose.model('Course', courseSchema);
