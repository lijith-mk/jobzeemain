const express = require('express');
const router = express.Router();
const EmployerNotification = require('../models/EmployerNotification');
const {
  registerEmployer,
  loginEmployer,
  googleAuth,
  getEmployerProfile,
  updateEmployerProfile,
  getDashboardStats,
  changePassword,
  deactivateAccount,
  getAllEmployers,
  forgotPassword,
  resetPassword,
  createJob,
  listMyJobs,
  getJob,
  deleteJob,
  updateJob,
  recordProfileView,
  recordJobTrending
} = require('../controllers/employerController');

const emailService = require('../services/emailService');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { employerAuth, requireVerification, checkSubscriptionLimits } = require('../middleware/employerAuth');
const {
  createEvent,
  listMyEvents,
  getEvent,
  deleteEvent,
  updateEvent,
  getMyEventStats,
  listMyEventRegistrations
} = require('../controllers/employerEventController');

// Cart controller import disabled
// const employerCartRoutes = require('./employerCartRoutes');

// Public routes (no authentication required)
router.post('/register', authLimiter, registerEmployer);
router.post('/login', authLimiter, loginEmployer);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
// Public analytics hooks (throttling should be applied at CDN/Edge or middleware)
router.post('/activity/profile-view', recordProfileView);
router.post('/activity/job-trending', recordJobTrending);

// Email test route (DEVELOPMENT ONLY - REMOVE IN PRODUCTION)
router.post('/test-email', async (req, res) => {
  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ 
      success: false,
      message: 'Route not found',
      errorType: 'ROUTE_NOT_FOUND'
    });
  }
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false,
      message: 'Email address is required',
      errorType: 'MISSING_EMAIL'
    });
  }
  
  try {
    const result = await emailService.sendTestEmail(email);
    res.json({
      success: true,
      message: 'Test email request processed',
      details: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Protected routes (authentication required)
router.use(employerAuth); // Apply authentication middleware to all routes below

// Cart routes disabled
// router.use('/cart', employerCartRoutes);

// Profile management
router.get('/profile', getEmployerProfile);
router.put('/profile', updateEmployerProfile);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Account management
router.put('/change-password', changePassword);
router.put('/deactivate', deactivateAccount);

// SECURITY: This route is now moved to admin routes only
// router.get('/all', getAllEmployers); // REMOVED: This is now admin-only in /api/admin/employers

// Test Management (Quick access endpoints - full CRUD at /api/employer-tests)
router.get('/tests', employerAuth, async (req, res) => {
  try {
    const Test = require('../models/Test');
    const tests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    })
    .populate('questions')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      tests,
      message: 'For full test management, use /api/employer-tests endpoints'
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tests' 
    });
  }
});

router.get('/tests/summary', employerAuth, async (req, res) => {
  try {
    const Test = require('../models/Test');
    const Question = require('../models/Question');
    
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(t => t._id);

    const totalTests = testIds.length;
    const activeTests = await Test.countDocuments({ 
      _id: { $in: testIds },
      isActive: true 
    });
    const totalQuestions = await Question.countDocuments({ 
      testId: { $in: testIds } 
    });

    res.json({
      success: true,
      summary: {
        totalTests,
        activeTests,
        inactiveTests: totalTests - activeTests,
        totalQuestions
      },
      endpoints: {
        tests: '/api/employer-tests',
        questions: '/api/employer-questions'
      }
    });
  } catch (error) {
    console.error('Get test summary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch test summary' 
    });
  }
});

// Jobs
router.post('/jobs', requireVerification, createJob);
router.get('/jobs', requireVerification, listMyJobs);
router.get('/jobs/:jobId', requireVerification, getJob);
router.put('/jobs/:jobId', requireVerification, updateJob);
router.delete('/jobs/:jobId', requireVerification, deleteJob);

// Events
router.post('/events', requireVerification, createEvent);
router.get('/events', requireVerification, listMyEvents);
router.get('/events/analytics', requireVerification, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const employerId = req.employer.id;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get events created by this employer in the period
    const Event = require('../models/Event');
    const EventRegistration = require('../models/EventRegistration');
    
    const events = await Event.find({
      employerId: employerId,
      createdAt: { $gte: startDate }
    }).lean();
    
    // Get all registrations for these events
    const eventIds = events.map(e => e._id);
    const registrations = await EventRegistration.find({
      eventId: { $in: eventIds }
    }).lean();
    
    // Calculate analytics
    const totalEvents = events.length;
    const totalRegistrations = registrations.length;
    const totalRevenue = registrations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    
    const averageAttendance = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;
    
    // Event types distribution
    const eventTypes = {
      free: events.filter(e => e.type === 'free' || e.price === 0).length,
      paid: events.filter(e => e.type === 'paid' && e.price > 0).length
    };
    
    // Most popular events (by registration count)
    const eventRegistrationCounts = {};
    registrations.forEach(reg => {
      eventRegistrationCounts[reg.eventId] = (eventRegistrationCounts[reg.eventId] || 0) + 1;
    });
    
    const popularEvents = events
      .map(event => ({
        ...event,
        registrationCount: eventRegistrationCounts[event._id] || 0
      }))
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, 5);
    
    // RSVPs over time (simplified - by day)
    const rsvpsOverTime = {};
    registrations.forEach(reg => {
      const date = new Date(reg.createdAt).toISOString().split('T')[0];
      rsvpsOverTime[date] = (rsvpsOverTime[date] || 0) + 1;
    });
    
    // Revenue over time
    const revenueOverTime = {};
    registrations
      .filter(r => r.paymentStatus === 'paid')
      .forEach(reg => {
        const date = new Date(reg.createdAt).toISOString().split('T')[0];
        revenueOverTime[date] = (revenueOverTime[date] || 0) + (reg.amountPaid || 0);
      });
    
    const analytics = {
      totalEvents,
      totalRegistrations,
      totalRevenue,
      averageAttendance,
      eventTypes,
      popularEvents,
      rsvpsOverTime: Object.entries(rsvpsOverTime).map(([date, count]) => ({ date, count })),
      revenueOverTime: Object.entries(revenueOverTime).map(([date, revenue]) => ({ date, revenue })),
      period,
      startDate,
      endDate: now
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});
router.get('/events/:eventId', requireVerification, getEvent);
router.delete('/events/:eventId', requireVerification, deleteEvent);
router.put('/events/:eventId', requireVerification, updateEvent);
router.get('/events-stats', requireVerification, getMyEventStats);
router.get('/events/:eventId/registrations', requireVerification, listMyEventRegistrations);

// Notifications: latest 3
router.get('/notifications/latest', async (req, res) => {
  try {
    const items = await EmployerNotification.find({ employerId: req.employer.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    res.json({ success: true, notifications: items });
  } catch (error) {
    console.error('Get latest employer notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Notifications: all (paginated)
router.get('/notifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      EmployerNotification.find({ employerId: req.employer.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      EmployerNotification.countDocuments({ employerId: req.employer.id })
    ]);

    res.json({ success: true, notifications: items, pagination: { current: page, pages: Math.ceil(total / limit), total } });
  } catch (error) {
    console.error('Get employer notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await EmployerNotification.findOneAndUpdate(
      { _id: notificationId, employerId: req.employer.id },
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
    console.error('Mark employer notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

module.exports = router;
