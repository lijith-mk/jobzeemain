const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Create compound index to ensure unique user-job combinations
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for efficient queries
savedJobSchema.index({ userId: 1, savedAt: -1 });

module.exports = mongoose.model('SavedJob', savedJobSchema);
