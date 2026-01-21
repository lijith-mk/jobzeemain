const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  type: { 
    type: String, 
    enum: ['job_match', 'application_status', 'interview_reminder', 'job_alert', 'profile_view', 'system'], 
    default: 'system' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object, default: {} }, // Additional data like jobId, applicationId, etc.
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { 
  timestamps: true, 
  collection: 'user_notifications' 
});

// Index for efficient queries
userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
