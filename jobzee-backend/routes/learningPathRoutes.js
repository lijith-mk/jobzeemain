const express = require('express');
const router = express.Router();
const learningPathController = require('../controllers/learningPathController');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// Optional auth middleware - allows both authenticated and guest users
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    return auth(req, res, next);
  }
  next();
};

// ==================== PUBLIC ROUTES ====================

// Get all learning paths (public, with optional filters)
router.get('/', optionalAuth, learningPathController.getAllLearningPaths);

// Get single learning path by ID (public)
router.get('/:id', optionalAuth, learningPathController.getLearningPathById);

// Get all courses in a learning path (public)
router.get('/:pathId/courses', optionalAuth, learningPathController.getPathCourses);

// Get all learning paths containing a specific course
router.get('/course/:courseId/paths', learningPathController.getCourseInPaths);

// ==================== ADMIN ROUTES ====================

// Create new learning path (admin only)
router.post('/', adminAuth, learningPathController.createLearningPath);

// Update learning path (admin only)
router.put('/:id', adminAuth, learningPathController.updateLearningPath);

// Delete learning path (admin only)
router.delete('/:id', adminAuth, learningPathController.deleteLearningPath);

// Toggle path status (admin only)
router.patch('/:id/status', adminAuth, learningPathController.togglePathStatus);

// Add course to learning path (admin only)
router.post('/:pathId/courses', adminAuth, learningPathController.addCourseToPath);

// Remove course from learning path (admin only)
router.delete('/:pathId/courses/:courseId', adminAuth, learningPathController.removeCourseFromPath);

// Update course order in learning path (admin only)
router.patch('/:pathId/courses/:courseId/order', adminAuth, learningPathController.updateCourseOrder);

// Bulk reorder courses (admin only)
router.post('/:pathId/courses/reorder', adminAuth, learningPathController.reorderPathCourses);

// ==================== USER ROUTES (AUTHENTICATED) ====================

// Get next course in sequence
router.get('/:pathId/next/:currentCourseId', auth, learningPathController.getNextCourse);

// Check course prerequisites
router.get('/:pathId/courses/:courseId/prerequisites', auth, learningPathController.checkCoursePrerequisites);

module.exports = router;
