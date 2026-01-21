const express = require('express');
const router = express.Router();
const EmployerNotification = require('../models/EmployerNotification');
const { employerAuth } = require('../middleware/employerAuth');

// GET /api/employers/notifications - Get notifications for employer
router.get('/', employerAuth, async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 20 } = req.query;
    const employerId = req.employer.id;
    
    // Build filter query
    const query = { employerId };
    if (filter === 'unread') {
      query.isRead = false;
    } else if (filter === 'read') {
      query.isRead = true;
    }
    
    const notifications = await EmployerNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await EmployerNotification.countDocuments(query);
    const unreadCount = await EmployerNotification.countDocuments({ 
      employerId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// PUT /api/employers/notifications/:id/read - Mark notification as read
router.put('/:id/read', employerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.employer.id;
    
    const notification = await EmployerNotification.findOneAndUpdate(
      { _id: id, employerId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// PUT /api/employers/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', employerAuth, async (req, res) => {
  try {
    const employerId = req.employer.id;
    
    const result = await EmployerNotification.updateMany(
      { employerId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notifications marked as read` 
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/employers/notifications/:id - Delete notification
router.delete('/:id', employerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.employer.id;
    
    const notification = await EmployerNotification.findOneAndDelete({
      _id: id,
      employerId
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// GET /api/employers/notifications/unread-count - Get unread count
router.get('/unread-count', employerAuth, async (req, res) => {
  try {
    const employerId = req.employer.id;
    const unreadCount = await EmployerNotification.getUnreadCount(employerId);
    
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

module.exports = router;

