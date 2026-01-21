const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
const Job = require('../models/Job');

// Get user notifications (latest first)
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const query = { userId: req.user.id };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await UserNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await UserNotification.countDocuments(query);
    const unreadCount = await UserNotification.countDocuments({ userId: req.user.id, read: false });

    res.json({
      success: true,
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Get latest notifications (for dropdown)
exports.getLatestNotifications = async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const unreadCount = await UserNotification.countDocuments({ userId: req.user.id, read: false });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get latest notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await UserNotification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Create job match notifications (called when new jobs are posted)
exports.createJobMatchNotification = async (userId, jobId, matchReason) => {
  try {
    const job = await Job.findById(jobId);
    if (!job) return;

    await UserNotification.create({
      userId,
      type: 'job_match',
      title: 'New job match found!',
      message: `${job.title} at ${job.company} matches your profile`,
      data: { jobId, matchReason },
      priority: 'medium'
    });
  } catch (error) {
    console.error('Create job match notification error:', error);
  }
};

// Create interview reminder notification
exports.createInterviewReminder = async (userId, jobTitle, companyName, interviewTime) => {
  try {
    await UserNotification.create({
      userId,
      type: 'interview_reminder',
      title: 'Interview reminder',
      message: `${jobTitle} interview at ${companyName} tomorrow at ${interviewTime}`,
      data: { interviewTime, jobTitle, companyName },
      priority: 'high'
    });
  } catch (error) {
    console.error('Create interview reminder error:', error);
  }
};

// Create profile view notification
exports.createProfileViewNotification = async (userId, viewerName, viewerCompany) => {
  try {
    await UserNotification.create({
      userId,
      type: 'profile_view',
      title: 'Profile viewed',
      message: `${viewerName} from ${viewerCompany} viewed your profile`,
      data: { viewerName, viewerCompany },
      priority: 'low'
    });
  } catch (error) {
    console.error('Create profile view notification error:', error);
  }
};
