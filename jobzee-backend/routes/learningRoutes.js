const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const learningController = require('../controllers/learningController');

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
router.get('/courses', learningController.getCourses);
router.get('/courses/:id', optionalAuth, learningController.getCourseById);
router.get('/lessons/:id', auth, learningController.getLessonById);
router.post('/courses/enroll', auth, learningController.enrollCourse);
router.put('/courses/progress', auth, learningController.updateProgress);
router.get('/my-courses', auth, learningController.getMyCourses);
router.post('/courses/rate', auth, learningController.rateCourse);

// Learning path routes
router.get('/learning-paths', learningController.getLearningPaths);
router.post('/learning-paths/enroll', auth, learningController.enrollLearningPath);

// Recommendations
router.get('/recommended', auth, learningController.getRecommendedCourses);

module.exports = router;
