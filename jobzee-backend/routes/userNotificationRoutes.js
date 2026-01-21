const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getLatestNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/userNotificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get user notifications (paginated)
router.get('/', getUserNotifications);

// Get latest notifications (for dropdown)
router.get('/latest', getLatestNotifications);

// Mark specific notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

module.exports = router;
