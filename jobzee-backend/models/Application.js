const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Applicant information
  applicantName: {
    type: String,
    required: true,
    trim: true
  },
  applicantEmail: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Job information
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  
  // Application details
  resumeLink: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  
  // Application status
  applicationStatus: {
    type: String,
    enum: ['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'hired', 'withdrawn'],
    default: 'applied'
  },
  
  // Additional information
  experience: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  expectedSalary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  availability: {
    type: String,
    default: ''
  },
  noticePeriod: {
    type: String,
    enum: ['immediate', '15-days', '30-days', '60-days', '90-days', 'other'],
    default: '30-days'
  },
  
  // Interview and communication
  interviewNotes: [{
    note: { type: String },
    interviewer: { type: String },
    date: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Interviews (references to Interview documents)
  interviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }],
  
  // Status tracking
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  
  // Communication
  messages: [{
    sender: { type: String, enum: ['applicant', 'employer'] },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ jobId: 1, applicationStatus: 1 });
applicationSchema.index({ userId: 1, applicationStatus: 1 });
applicationSchema.index({ appliedAt: -1 });

// Text search index
applicationSchema.index({
  applicantName: 'text',
  skills: 'text',
  experience: 'text',
  education: 'text'
});

module.exports = mongoose.model('Application', applicationSchema);
