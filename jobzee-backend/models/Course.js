const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  
  // Skill category classification
  skillCategory: { 
    type: String, 
    enum: ['technical', 'business', 'creative', 'communication', 'leadership', 'other'],
    required: true 
  },
  
  // General category
  category: { 
    type: String, 
    enum: ['web-development', 'data-science', 'mobile-development', 'cloud-computing', 'cybersecurity', 'design', 'business', 'marketing', 'soft-skills', 'other'],
    required: true 
  },
  
  // Target job roles this course prepares for
  targetJobRoles: [{ type: String }], // e.g., ['Full Stack Developer', 'Data Analyst', 'UI/UX Designer']
  
  // Difficulty level
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true 
  },
  
  skills: [{ type: String }], // Specific skills covered in this course
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
  
  // Pricing
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR', 'GBP'] },
  discountPrice: { type: Number, min: 0 }, // Optional discount price
  discountEndDate: { type: Date }, // When discount expires
  
  // Integration fields
  relatedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MentorApplication' }],
  relatedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  relatedLearningPaths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' }], // Quick reference to paths this course belongs to
  certificateTemplate: { type: String }, // URL to certificate template
  
  // Creator reference
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for search and filtering
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ skillCategory: 1 });
courseSchema.index({ skills: 1 });
courseSchema.index({ targetJobRoles: 1 });
courseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
