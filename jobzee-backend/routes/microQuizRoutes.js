const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const microQuizController = require('../controllers/microQuizController');

// ============================================
// ADMIN ROUTES - Quiz Management
// ============================================

// Create new micro quiz
router.post(
  '/admin/micro-quiz',
  adminAuth,
  microQuizController.createMicroQuiz
);

// Update micro quiz
router.put(
  '/admin/micro-quiz/:quizId',
  adminAuth,
  microQuizController.updateMicroQuiz
);

// Delete micro quiz
router.delete(
  '/admin/micro-quiz/:quizId',
  adminAuth,
  microQuizController.deleteMicroQuiz
);

// Get quiz by lesson (admin view with answers)
router.get(
  '/admin/micro-quiz/lesson/:lessonId',
  adminAuth,
  microQuizController.getQuizByLesson
);

// Get all quizzes for a course
router.get(
  '/admin/micro-quiz/course/:courseId',
  adminAuth,
  microQuizController.getQuizzesByCourse
);

// Get quiz statistics
router.get(
  '/admin/micro-quiz/:quizId/stats',
  adminAuth,
  microQuizController.getQuizStatistics
);

// Get detailed quiz attempts
router.get(
  '/admin/micro-quiz/:quizId/attempts',
  adminAuth,
  microQuizController.getQuizAttempts
);

// Get quiz by ID (admin view with answers) - MUST BE LAST to avoid conflicts
router.get(
  '/admin/micro-quiz/:quizId',
  adminAuth,
  microQuizController.getQuizById
);

// ============================================
// STUDENT ROUTES - Taking Quizzes
// ============================================

// Get quiz for student (without correct answers)
router.get(
  '/micro-quiz/lesson/:lessonId',
  auth,
  microQuizController.getQuizForStudent
);

// Submit quiz attempt
router.post(
  '/micro-quiz/:quizId/submit',
  auth,
  microQuizController.submitQuizAttempt
);

// Get user's attempts for a quiz
router.get(
  '/micro-quiz/:quizId/attempts',
  auth,
  microQuizController.getUserAttempts
);

// Get specific attempt details
router.get(
  '/micro-quiz/attempt/:attemptId',
  auth,
  microQuizController.getAttemptDetails
);

// Get all quizzes overview for a course
router.get(
  '/micro-quiz/course/:courseId/overview',
  auth,
  microQuizController.getCourseQuizzesOverview
);

module.exports = router;
