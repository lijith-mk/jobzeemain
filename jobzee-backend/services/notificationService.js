const EmployerNotification = require('../models/EmployerNotification');

class NotificationService {
  // Create notification for event approval
  static async notifyEventApproved(employerId, eventId, eventTitle) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'event_approved',
        title: 'Event Approved! 🎉',
        message: `Your event "${eventTitle}" has been approved and is now live.`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error creating event approved notification:', error);
    }
  }

  // Create notification for event rejection
  static async notifyEventRejected(employerId, eventId, eventTitle, reason = '') {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'event_rejected',
        title: 'Event Rejected',
        message: `Your event "${eventTitle}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}/edit`,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error creating event rejected notification:', error);
    }
  }

  // Create notification for new registration
  static async notifyNewRegistration(employerId, eventId, eventTitle, attendeeName) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'new_registration',
        title: 'New Registration! 👤',
        message: `${attendeeName} registered for your event "${eventTitle}".`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating new registration notification:', error);
    }
  }

  // Create notification for payment received
  static async notifyPaymentReceived(employerId, eventId, eventTitle, amount, attendeeName) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'payment_received',
        title: 'Payment Received! 💰',
        message: `Payment of ₹${amount} received from ${attendeeName} for "${eventTitle}".`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'high',
        metadata: { amount, attendeeName }
      });
    } catch (error) {
      console.error('Error creating payment received notification:', error);
    }
  }

  // Create notification for event reminder
  static async notifyEventReminder(employerId, eventId, eventTitle, hoursUntilEvent) {
    try {
      const timeText = hoursUntilEvent < 24 
        ? `${hoursUntilEvent} hours` 
        : `${Math.floor(hoursUntilEvent / 24)} days`;
      
      await EmployerNotification.createNotification({
        employerId,
        type: 'event_reminder',
        title: 'Event Reminder ⏰',
        message: `Your event "${eventTitle}" starts in ${timeText}.`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating event reminder notification:', error);
    }
  }

  // Create notification for event update
  static async notifyEventUpdated(employerId, eventId, eventTitle, updateType) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'event_updated',
        title: 'Event Updated 📝',
        message: `Your event "${eventTitle}" has been updated: ${updateType}.`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'low'
      });
    } catch (error) {
      console.error('Error creating event updated notification:', error);
    }
  }

  // Create notification for event cancellation
  static async notifyEventCancelled(employerId, eventId, eventTitle) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'event_cancelled',
        title: 'Event Cancelled',
        message: `Your event "${eventTitle}" has been cancelled.`,
        eventId,
        eventTitle,
        actionUrl: `/employer/events/${eventId}`,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error creating event cancelled notification:', error);
    }
  }

  // Create system announcement
  static async notifySystemAnnouncement(employerId, title, message, actionUrl = null) {
    try {
      await EmployerNotification.createNotification({
        employerId,
        type: 'system_announcement',
        title,
        message,
        actionUrl,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating system announcement notification:', error);
    }
  }

  // Bulk create notifications for multiple employers
  static async notifyMultipleEmployers(employerIds, notificationData) {
    try {
      const notifications = employerIds.map(employerId => ({
        ...notificationData,
        employerId
      }));
      
      await EmployerNotification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
    }
  }

  // User notifications for internship applications
  static async notifyInternshipApplicationStatus(userId, status, internshipTitle, applicationId, internshipId) {
    try {
      const UserNotification = require('../models/UserNotification');
      
      const statusMessages = {
        'reviewed': {
          title: 'Application Under Review 📋',
          message: `Your application for "${internshipTitle}" is now under review.`
        },
        'shortlisted': {
          title: 'Application Shortlisted! 🎉',
          message: `Congratulations! You have been shortlisted for "${internshipTitle}".`
        },
        'interview': {
          title: 'Interview Scheduled! 📅',
          message: `You have been selected for an interview for "${internshipTitle}". The employer may contact you soon.`
        },
        'selected': {
          title: 'Congratulations! 🎊',
          message: `You have been selected for the internship "${internshipTitle}". Congratulations!`
        },
        'rejected': {
          title: 'Application Update',
          message: `Unfortunately, your application for "${internshipTitle}" was not selected this time. Keep applying!`
        }
      };

      const notificationData = statusMessages[status] || {
        title: 'Application Status Updated',
        message: `Your application status for "${internshipTitle}" has been updated.`
      };

      await UserNotification.create({
        userId,
        type: 'application_status',
        title: notificationData.title,
        message: notificationData.message,
        data: {
          applicationId,
          internshipId,
          internshipTitle,
          status
        },
        priority: status === 'selected' ? 'high' : status === 'rejected' ? 'medium' : 'medium'
      });
    } catch (error) {
      console.error('Error creating internship application notification:', error);
    }
  }
}

module.exports = NotificationService;

