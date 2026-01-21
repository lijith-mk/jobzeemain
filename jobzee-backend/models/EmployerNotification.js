const mongoose = require('mongoose');

const employerNotificationSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'event_approved',
      'event_rejected', 
      'new_registration',
      'event_reminder',
      'payment_received',
      'event_updated',
      'event_cancelled',
      'system_announcement'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  eventTitle: {
    type: String,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
employerNotificationSchema.index({ employerId: 1, isRead: 1 });
employerNotificationSchema.index({ employerId: 1, createdAt: -1 });
employerNotificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notification
employerNotificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Instance method to mark as read
employerNotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
employerNotificationSchema.statics.getUnreadCount = function(employerId) {
  return this.countDocuments({ employerId, isRead: false });
};

module.exports = mongoose.model('EmployerNotification', employerNotificationSchema);