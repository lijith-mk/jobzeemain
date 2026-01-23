const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const learningController = require('../controllers/learningController');

// Course routes
router.get('/courses', learningController.getCourses);
router.get('/courses/:id', learningController.getCourseById);
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
