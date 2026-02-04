const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const learningController = require('../controllers/learningController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    // If token exists, use auth middleware
    return auth(req, res, next);
  }
  // No token, continue without user
  next();
};

// Course routes
router.get('/courses', optionalAuth, learningController.getCourses);
router.get('/courses/:id', optionalAuth, learningController.getCourseById);
router.get('/lessons/:id', auth, learningController.getLessonById);

// Course enrollment and payment
router.post('/courses/enroll', auth, learningController.enrollCourse);
router.post('/courses/create-payment-order', auth, learningController.createCoursePaymentOrder);
router.post('/courses/verify-payment', auth, learningController.verifyCoursePayment);

// Invoice routes
router.get('/invoices', auth, learningController.getMyCourseInvoices);
router.get('/invoices/:invoiceId', auth, learningController.getCourseInvoiceById);
router.get('/invoices/number/:invoiceNumber', auth, learningController.getCourseInvoiceByNumber);

router.put('/courses/progress', auth, learningController.updateProgress);
router.get('/my-courses', auth, learningController.getMyCourses);
router.post('/courses/rate', auth, learningController.rateCourse);

// Learning path routes
router.get('/learning-paths', learningController.getLearningPaths);
router.get('/learning-paths/by-job-role', auth, learningController.getLearningPathsByJobRole);
router.get('/learning-paths/recommendations', auth, learningController.getRecommendedLearningPaths);
router.post('/learning-paths/enroll', auth, learningController.enrollLearningPath);
router.get('/learning-paths/:pathId/progress', auth, learningController.getMyLearningPathProgress);
router.get('/learning-paths/:pathId/course/:courseId/access', auth, learningController.checkCourseAccess);
router.post('/learning-paths/unlock-next', auth, learningController.unlockNextCourse);

// Recommendations
router.get('/recommended', auth, learningController.getRecommendedCourses);

// Skill Gap Detection (PROMPT 7) - Advanced Analytics
router.get('/skill-gaps/analysis', auth, learningController.getSkillGapAnalysis);
router.get('/skill-gaps/recommendations', auth, learningController.getSkillGapRecommendations);
router.get('/skill-gaps/report', auth, learningController.generateSkillGapReport);
router.get('/skill-gaps/dashboard', auth, learningController.getSkillGapDashboard);
router.get('/skill-gaps/test/:testId/analysis', auth, learningController.getQuestionLevelAnalysis);

// Admin Analytics Routes (aggregated course analytics)
router.get('/admin/courses/:courseId/analytics', auth, adminAnalyticsController.getCourseAnalytics);
router.get('/admin/courses/:courseId/enrollments', auth, adminAnalyticsController.getCourseEnrollments);
router.get('/admin/courses/:courseId/payments', auth, adminAnalyticsController.getCoursePayments);

module.exports = router;
