const MicroQuiz = require('../models/MicroQuiz');
const MicroQuizAttempt = require('../models/MicroQuizAttempt');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');

// ============================================
// ADMIN CONTROLLERS - Quiz Management
// ============================================

/**
 * Create a new micro quiz for a lesson
 * POST /api/admin/micro-quiz
 */
exports.createMicroQuiz = async (req, res) => {
  try {
    const {
      lessonId,
      courseId,
      title,
      description,
      passingScore,
      timeLimit,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showCorrectAnswers,
      requirePassingToProgress,
      questions,
      instructions
    } = req.body;

    // Validate lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if quiz already exists for this lesson
    const existingQuiz = await MicroQuiz.findOne({ lessonId });
    if (existingQuiz) {
      return res.status(400).json({ 
        message: 'A quiz already exists for this lesson. Please update the existing quiz.' 
      });
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Create quiz
    const microQuiz = new MicroQuiz({
      lessonId,
      courseId: courseId || lesson.courseId,
      title: title || `${lesson.title} - Quiz`,
      description,
      passingScore: passingScore || 70,
      timeLimit,
      maxAttempts: maxAttempts !== undefined ? maxAttempts : 3,
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      showCorrectAnswers: showCorrectAnswers !== undefined ? showCorrectAnswers : true,
      requirePassingToProgress: requirePassingToProgress || false,
      questions,
      instructions,
      createdBy: req.admin?._id || req.user._id,
      createdByModel: req.admin ? 'Admin' : 'User'
    });

    await microQuiz.save();

    // Update lesson to indicate it has a quiz and store the quiz ID
    lesson.hasQuiz = true;
    lesson.microQuizId = microQuiz._id;
    await lesson.save();

    res.status(201).json({
      success: true,
      message: 'Micro quiz created successfully',
      quiz: microQuiz
    });
  } catch (error) {
    console.error('Create micro quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating micro quiz', 
      error: error.message 
    });
  }
};

/**
 * Update an existing micro quiz
 * PUT /api/admin/micro-quiz/:quizId
 */
exports.updateMicroQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updateData = req.body;

    const quiz = await MicroQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== 'lessonId') {
        quiz[key] = updateData[key];
      }
    });

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Update micro quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating quiz', 
      error: error.message 
    });
  }
};

/**
 * Delete a micro quiz
 * DELETE /api/admin/micro-quiz/:quizId
 */
exports.deleteMicroQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await MicroQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Update lesson to remove quiz flag and clear microQuizId
    await Lesson.findByIdAndUpdate(quiz.lessonId, { 
      hasQuiz: false,
      microQuizId: null 
    });

    // Delete quiz
    await MicroQuiz.findByIdAndDelete(quizId);

    // Optionally delete all attempts (or keep for history)
    // await MicroQuizAttempt.deleteMany({ quizId });

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete micro quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting quiz', 
      error: error.message 
    });
  }
};

/**
 * Get quiz by lesson ID (admin view with answers)
 * GET /api/admin/micro-quiz/lesson/:lessonId
 */
exports.getQuizByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const quiz = await MicroQuiz.findOne({ lessonId })
      .populate('lessonId', 'title courseId')
      .populate('courseId', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'No quiz found for this lesson' });
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get quiz by lesson error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching quiz', 
      error: error.message 
    });
  }
};

/**
 * Get quiz by quiz ID (admin view with answers)
 * GET /api/admin/micro-quiz/:quizId
 */
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await MicroQuiz.findById(quizId)
      .populate('lessonId', 'title courseId')
      .populate('courseId', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching quiz', 
      error: error.message 
    });
  }
};

/**
 * Get all quizzes for a course
 * GET /api/admin/micro-quiz/course/:courseId
 */
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await MicroQuiz.find({ courseId, isActive: true })
      .populate('lessonId', 'title lessonOrder')
      .sort({ 'lessonId.lessonOrder': 1 });

    // Add attempt counts for each quiz
    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await MicroQuizAttempt.countDocuments({ 
          quizId: quiz._id,
          status: 'completed'
        });
        
        return {
          ...quiz.toObject(),
          attemptCount
        };
      })
    );

    res.json({
      success: true,
      quizzes: quizzesWithCounts,
      total: quizzesWithCounts.length
    });
  } catch (error) {
    console.error('Get quizzes by course error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching quizzes', 
      error: error.message 
    });
  }
};

/**
 * Get quiz statistics
 * GET /api/admin/micro-quiz/:quizId/stats
 */
exports.getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await MicroQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const attempts = await MicroQuizAttempt.find({ 
      quizId, 
      status: 'completed' 
    });

    const stats = {
      totalAttempts: attempts.length,
      uniqueUsers: new Set(attempts.map(a => a.userId.toString())).size,
      averageScore: quiz.averageScore,
      passRate: quiz.passRate,
      scoreDistribution: {
        '0-25': attempts.filter(a => a.percentage < 25).length,
        '25-50': attempts.filter(a => a.percentage >= 25 && a.percentage < 50).length,
        '50-75': attempts.filter(a => a.percentage >= 50 && a.percentage < 75).length,
        '75-100': attempts.filter(a => a.percentage >= 75).length
      },
      recentAttempts: attempts
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10)
        .map(a => ({
          userId: a.userId,
          percentage: a.percentage,
          passed: a.passed,
          completedAt: a.completedAt
        }))
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Get quiz statistics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
};

/**
 * Get detailed quiz attempts for admin
 * GET /api/admin/micro-quiz/:quizId/attempts
 */
exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { page = 1, limit = 20, status = 'completed' } = req.query;

    const quiz = await MicroQuiz.findById(quizId)
      .populate('lessonId', 'title')
      .populate('courseId', 'title');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const query = { quizId };
    if (status) {
      query.status = status;
    }

    const attempts = await MicroQuizAttempt.find(query)
      .populate('userId', 'name email photo')
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MicroQuizAttempt.countDocuments(query);

    // Format attempts with detailed info
    const formattedAttempts = attempts.map(attempt => ({
      _id: attempt._id,
      user: {
        _id: attempt.userId._id,
        name: attempt.userId.name,
        email: attempt.userId.email,
        photo: attempt.userId.photo
      },
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      answers: attempt.answers
    }));

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        lessonTitle: quiz.lessonId?.title,
        courseTitle: quiz.courseId?.title,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts
      },
      attempts: formattedAttempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching quiz attempts', 
      error: error.message 
    });
  }
};

// ============================================
// STUDENT CONTROLLERS - Taking Quizzes
// ============================================

/**
 * Get quiz for student (without correct answers)
 * GET /api/learning/micro-quiz/lesson/:lessonId
 */
exports.getQuizForStudent = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Lesson not found' 
      });
    }

    // Check if lesson is completed
    const courseProgress = await CourseProgress.findOne({
      userId,
      courseId: lesson.courseId
    });

    const lessonCompleted = courseProgress?.completedLessons?.some(
      cl => cl.lessonId.toString() === lessonId
    );

    if (!lessonCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Please complete the lesson before taking the quiz',
        requiresCompletion: true
      });
    }

    const quiz = await MicroQuiz.findOne({ lessonId, isActive: true });
    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: 'No quiz available for this lesson' 
      });
    }

    // Check attempt count
    const attemptCount = await MicroQuizAttempt.getAttemptCount(userId, quiz._id);
    const canAttempt = await MicroQuizAttempt.canAttempt(userId, quiz._id, quiz.maxAttempts);

    // Get user's previous attempts
    const userStats = await MicroQuizAttempt.getUserStats(userId, quiz._id);

    // Get student view (without answers)
    const studentQuiz = quiz.getStudentView(false);

    res.json({
      success: true,
      quiz: studentQuiz,
      attemptInfo: {
        attemptCount,
        maxAttempts: quiz.maxAttempts,
        canAttempt,
        userStats,
        alreadyTaken: attemptCount > 0,
        bestScore: userStats?.bestScore || null,
        passed: userStats?.passed || false
      }
    });
  } catch (error) {
    console.error('Get quiz for student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching quiz', 
      error: error.message 
    });
  }
};

/**
 * Submit quiz attempt
 * POST /api/learning/micro-quiz/:quizId/submit
 */
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken, startedAt } = req.body;
    const userId = req.user.id;

    const quiz = await MicroQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user can attempt
    const canAttempt = await MicroQuizAttempt.canAttempt(userId, quizId, quiz.maxAttempts);
    if (!canAttempt) {
      return res.status(403).json({
        success: false,
        message: `Maximum attempts reached for this quiz`
      });
    }

    // Get current attempt number
    const attemptCount = await MicroQuizAttempt.getAttemptCount(userId, quizId);

    // Grade the attempt
    const gradingResult = quiz.gradeAttempt(answers);

    // Create attempt record
    // Calculate valid startedAt
    let validStartedAt;
    if (startedAt) {
      const parsedDate = new Date(startedAt);
      validStartedAt = isNaN(parsedDate.getTime()) 
        ? new Date(Date.now() - ((timeTaken || 0) * 1000))
        : parsedDate;
    } else {
      validStartedAt = new Date(Date.now() - ((timeTaken || 0) * 1000));
    }

    const attempt = new MicroQuizAttempt({
      userId,
      quizId,
      lessonId: quiz.lessonId,
      courseId: quiz.courseId,
      attemptNumber: attemptCount + 1,
      answers: gradingResult.results.map(r => ({
        questionId: r.questionId,
        answer: String(r.userAnswer || 'Not Attempted'),
        isCorrect: r.isCorrect === true,
        pointsEarned: r.points || 0
      })),
      score: gradingResult.score,
      totalPoints: gradingResult.totalPoints,
      percentage: gradingResult.percentage,
      passed: gradingResult.passed,
      startedAt: validStartedAt,
      completedAt: new Date(),
      timeTaken: timeTaken || 0,
      status: 'completed',
      detailedResults: gradingResult
    });

    await attempt.save();

    // Update quiz statistics
    quiz.totalAttempts += 1;
    const allAttempts = await MicroQuizAttempt.find({ 
      quizId, 
      status: 'completed' 
    });
    
    const totalScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0);
    quiz.averageScore = Math.round((totalScore / allAttempts.length) * 100) / 100;
    
    const passedAttempts = allAttempts.filter(a => a.passed).length;
    quiz.passRate = Math.round((passedAttempts / allAttempts.length) * 100 * 100) / 100;
    
    await quiz.save();

    // If passed and quiz requires passing for lesson completion
    if (gradingResult.passed && quiz.requirePassingToProgress) {
      // Update course progress - mark lesson as completed
      const courseProgress = await CourseProgress.findOne({
        userId,
        courseId: quiz.courseId
      });

      if (courseProgress) {
        const lessonCompleted = courseProgress.completedLessons.some(
          l => l.lessonId.toString() === quiz.lessonId.toString()
        );

        if (!lessonCompleted) {
          courseProgress.completedLessons.push({
            lessonId: quiz.lessonId,
            completedAt: new Date()
          });
          await courseProgress.save();
        }
      }
    }

    res.json({
      success: true,
      message: gradingResult.passed ? 
        '🎉 Congratulations! You passed the quiz!' : 
        'Quiz completed. Keep learning!',
      attempt: {
        _id: attempt._id,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        passed: attempt.passed,
        timeTaken: attempt.timeTaken
      },
      results: quiz.showCorrectAnswers ? gradingResult.results : null,
      canRetry: await MicroQuizAttempt.canAttempt(userId, quizId, quiz.maxAttempts)
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting quiz', 
      error: error.message 
    });
  }
};

/**
 * Get user's quiz attempts
 * GET /api/learning/micro-quiz/:quizId/attempts
 */
exports.getUserAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const attempts = await MicroQuizAttempt.find({
      userId,
      quizId,
      status: 'completed'
    }).sort({ completedAt: -1 });

    const stats = await MicroQuizAttempt.getUserStats(userId, quizId);

    res.json({
      success: true,
      attempts,
      statistics: stats
    });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attempts', 
      error: error.message 
    });
  }
};

/**
 * Get specific attempt details
 * GET /api/micro-quiz/attempt/:attemptId
 */
exports.getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const attempt = await MicroQuizAttempt.findOne({
      _id: attemptId,
      userId
    }).populate('quizId');

    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Attempt not found' 
      });
    }

    const quiz = attempt.quizId;
    
    // Check if user can retry
    const canRetry = await MicroQuizAttempt.canAttempt(userId, quiz._id, quiz.maxAttempts);

    res.json({
      success: true,
      attempt,
      quiz,
      canRetry
    });
  } catch (error) {
    console.error('Get attempt details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attempt details', 
      error: error.message 
    });
  }
};

/**
 * Get all quizzes for a course (student view)
 * GET /api/learning/micro-quiz/course/:courseId/overview
 */
exports.getCourseQuizzesOverview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const quizzes = await MicroQuiz.find({ 
      courseId, 
      isActive: true 
    }).populate('lessonId', 'title lessonOrder');

    const overview = await Promise.all(
      quizzes.map(async (quiz) => {
        const stats = await MicroQuizAttempt.getUserStats(userId, quiz._id);
        const canAttempt = await MicroQuizAttempt.canAttempt(userId, quiz._id, quiz.maxAttempts);

        return {
          quizId: quiz._id,
          lessonId: quiz.lessonId._id,
          lessonTitle: quiz.lessonId.title,
          lessonOrder: quiz.lessonId.lessonOrder,
          title: quiz.title,
          totalQuestions: quiz.questions.length,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
          requirePassingToProgress: quiz.requirePassingToProgress,
          userStats: stats,
          canAttempt
        };
      })
    );

    res.json({
      success: true,
      quizzes: overview.sort((a, b) => a.lessonOrder - b.lessonOrder),
      totalQuizzes: overview.length,
      completedQuizzes: overview.filter(q => q.userStats.passed).length
    });
  } catch (error) {
    console.error('Get course quizzes overview error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching course quizzes', 
      error: error.message 
    });
  }
};
