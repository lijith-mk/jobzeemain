const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Answer = require('../models/Answer');
const auth = require('../middleware/auth');

// Get all active tests (for employees/users)
// Only returns tests that are active AND have at least one question
router.get('/', auth, async (req, res) => {
  try {
    const {
      jobRole,
      skill,
      difficulty,
      category,
      type,
      search
    } = req.query;

    // Build query - only active tests with questions
    let query = {
      isActive: true,
      questionCount: { $gt: 0 } // At least one question exists
    };

    // Apply filters
    if (jobRole) {
      query.jobRole = jobRole;
    }

    if (skill) {
      query.skill = skill;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tests = await Test.find(query)
      .populate({
        path: 'questions',
        select: '-correctAnswer -explanation' // Hide correct answers from users
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tests,
      count: tests.length
    });
  } catch (error) {
    console.error('Fetch tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tests'
    });
  }
});

// Get user's test history - MUST be before /:testId route
router.get('/history', auth, async (req, res) => {
  try {
    console.log('🔍 History request - req.user:', req.user);
    
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      console.error('❌ No userId found in request');
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('📊 Fetching test history for user:', userId);

    const results = await TestAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await TestAttempt.countDocuments({ userId });

    console.log('✅ Test history results:', results.length, 'Total:', total);

    res.json({
      success: true,
      results,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Fetch test history error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test history',
      error: error.message
    });
  }
});

// Get single test details (without correct answers)
router.get('/:testId', auth, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findOne({
      _id: testId,
      isActive: true,
      questionCount: { $gt: 0 }
    }).populate({
      path: 'questions',
      select: '-correctAnswer -explanation'
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not available'
      });
    }

    res.json({
      success: true,
      test
    });
  } catch (error) {
    console.error('Fetch test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test'
    });
  }
});

// Get test statistics (aggregated data for filters)
router.get('/stats/filters', auth, async (req, res) => {
  try {
    const stats = await Test.aggregate([
      {
        $match: {
          isActive: true,
          questionCount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          jobRoles: { $addToSet: '$jobRole' },
          skills: { $addToSet: '$skill' },
          categories: { $addToSet: '$category' },
          difficulties: { $addToSet: '$difficulty' },
          types: { $addToSet: '$type' }
        }
      }
    ]);

    const filterOptions = stats.length > 0 ? {
      jobRoles: stats[0].jobRoles.filter(Boolean),
      skills: stats[0].skills.filter(Boolean),
      categories: stats[0].categories.filter(Boolean),
      difficulties: stats[0].difficulties.filter(Boolean),
      types: stats[0].types.filter(Boolean)
    } : {
      jobRoles: [],
      skills: [],
      categories: [],
      difficulties: [],
      types: []
    };

    res.json({
      success: true,
      filterOptions
    });
  } catch (error) {
    console.error('Fetch test stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test statistics'
    });
  }
});

// Start test and initialize anti-cheat tracking
router.post('/:testId/start', auth, async (req, res) => {
  console.log('🎯 START TEST ROUTE CALLED - testId:', req.params.testId);
  console.log('🎯 User from auth:', req.user);
  
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    console.log('🎯 Processing start request:', { testId, userId });

    // Fetch test to verify it exists and is active
    const test = await Test.findOne({
      _id: testId,
      isActive: true,
      questionCount: { $gt: 0 }
    });

    console.log('🎯 Test found:', test ? 'YES' : 'NO');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not available'
      });
    }

    // Check if user already has an in-progress attempt for this test
    const existingAttempt = await TestAttempt.findOne({
      userId,
      testId,
      status: 'in-progress'
    });

    console.log('🎯 Existing attempt:', existingAttempt ? 'YES' : 'NO');

    if (existingAttempt) {
      console.log('✅ Returning existing attempt:', existingAttempt._id);
      return res.json({
        success: true,
        message: 'Test already in progress',
        attempt: {
          attemptId: existingAttempt._id.toString(),
          testId: existingAttempt.testId.toString(),
          testTitle: existingAttempt.testTitle,
          duration: test.duration,
          totalQuestions: existingAttempt.totalQuestions,
          totalMarks: existingAttempt.totalMarks,
          startedAt: existingAttempt.startedAt,
          status: 'in-progress'
        }
      });
    }

    console.log('🎯 Creating new attempt...');

    // Create new test attempt with anti-cheat tracking
    const attempt = new TestAttempt({
      userId,
      testId: test._id,
      testTitle: test.title,
      score: 0,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      percentage: 0,
      correctAnswers: 0,
      totalQuestions: test.questionCount,
      passed: false,
      timeTaken: 0,
      status: 'in-progress',
      startedAt: new Date(),
      tabSwitchCount: 0,
      tabSwitchTimestamps: [],
      suspiciousActivity: false,
      warningCount: 0,
      lastActivityAt: new Date()
    });

    await attempt.save();

    console.log('✅ Test attempt started with anti-cheat tracking:', {
      attemptId: attempt._id,
      attemptIdString: attempt._id?.toString(),
      userId,
      testId,
      startedAt: attempt.startedAt
    });

    const responseData = {
      success: true,
      message: 'Test started successfully',
      attempt: {
        attemptId: attempt._id?.toString() || attempt._id,
        testId: test._id.toString(),
        testTitle: test.title,
        duration: test.duration,
        totalQuestions: test.questionCount,
        totalMarks: test.totalMarks,
        startedAt: attempt.startedAt,
        status: 'in-progress'
      }
    };

    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));

    res.json(responseData);
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start test'
    });
  }
});

// Track tab switch event during test
router.post('/:testId/tab-switch', auth, async (req, res) => {
  try {
    const { attemptId, timestamp } = req.body;
    const userId = req.user.id;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID is required'
      });
    }

    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({
      _id: attemptId,
      userId,
      status: 'in-progress'
    });

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Active test attempt not found'
      });
    }

    // Increment tab switch count and add timestamp
    testAttempt.tabSwitchCount = (testAttempt.tabSwitchCount || 0) + 1;
    testAttempt.tabSwitchTimestamps.push(timestamp || new Date());
    testAttempt.lastActivityAt = new Date();

    // Flag as suspicious if more than 2 tab switches
    if (testAttempt.tabSwitchCount >= 3) {
      testAttempt.suspiciousActivity = true;
    }

    // Update warning count (1st and 2nd switch get warnings)
    if (testAttempt.tabSwitchCount <= 2) {
      testAttempt.warningCount = testAttempt.tabSwitchCount;
    }

    await testAttempt.save();

    console.log('⚠️ Tab switch recorded:', {
      attemptId: testAttempt._id,
      userId,
      count: testAttempt.tabSwitchCount,
      suspicious: testAttempt.suspiciousActivity
    });

    res.json({
      success: true,
      tabSwitchCount: testAttempt.tabSwitchCount,
      warningCount: testAttempt.warningCount,
      suspiciousActivity: testAttempt.suspiciousActivity
    });
  } catch (error) {
    console.error('Tab switch tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record tab switch'
    });
  }
});

// Submit test answers and calculate results
router.post('/:testId/submit', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers, timeTaken, autoSubmit, attemptId, tabSwitchCount, tabSwitchTimestamps, fraudDetected, fraudReason } = req.body;
    const userId = req.user.id;

    // Fetch test with questions
    const test = await Test.findOne({
      _id: testId,
      isActive: true,
      questionCount: { $gt: 0 }
    }).populate('questions');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not available'
      });
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    const answerDocuments = [];

    // Try to find and lock the attempt atomically
    let testAttempt;
    if (attemptId) {
      // Use findOneAndUpdate with atomic operation to prevent race conditions
      testAttempt = await TestAttempt.findOneAndUpdate(
        {
          _id: attemptId,
          userId,
          testId: test._id,
          status: 'in-progress' // Only update if still in progress
        },
        {
          $set: { status: 'processing' } // Lock it immediately
        },
        {
          new: false // Return the document before update
        }
      );

      // If attempt not found or already processing/completed
      if (!testAttempt) {
        // Check if it already exists in completed state
        const completedAttempt = await TestAttempt.findOne({
          _id: attemptId,
          userId,
          testId: test._id
        });

        if (completedAttempt && (completedAttempt.status === 'completed' || completedAttempt.status === 'processing')) {
          console.log('⚠️ Test already submitted or being processed, returning existing result');
          return res.json({
            success: true,
            message: 'Test already submitted',
            resultId: completedAttempt._id
          });
        }

        // If not found at all, something went wrong
        return res.status(404).json({
          success: false,
          message: 'Test attempt not found or already processed'
        });
      }
    }

    if (!testAttempt) {
      // Create new test attempt if none exists
      testAttempt = new TestAttempt({
        userId,
        testId: test._id,
        testTitle: test.title,
        score: 0,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        percentage: 0,
        correctAnswers: 0,
        totalQuestions: test.questions.length,
        passed: false,
        timeTaken,
        autoSubmit,
        status: 'processing',
        completedAt: new Date()
      });

      await testAttempt.save();
      console.log('Test attempt created:', testAttempt._id);
    }

    // Delete any existing answers for this attempt (in case of previous failed submission)
    const deleteResult = await Answer.deleteMany({ attemptId: testAttempt._id });
    console.log(`Cleared ${deleteResult.deletedCount} existing answers for attempt:`, testAttempt._id);

    // Process each question and create answer documents
    let hasCodingOrEssay = false;
    for (const question of test.questions) {
      const answerData = answers[question._id.toString()];
      
      // Handle both old format (string) and new format (object with metadata)
      let userAnswer;
      let usedEmbeddedEditor = false;
      
      if (typeof answerData === 'object' && answerData !== null) {
        // New format: { answer: "...", usedEmbeddedEditor: true/false }
        userAnswer = answerData.answer;
        usedEmbeddedEditor = answerData.usedEmbeddedEditor || false;
      } else {
        // Old format: just the answer string
        userAnswer = answerData;
      }
      
      let isCorrect = false;
      let marksObtained = 0;
      
      // Scoring logic based on question type
      if (question.type === 'mcq' || question.type === 'true-false') {
        // MCQ and True-False: auto-grade by comparing answers
        isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) {
          marksObtained = question.marks;
          score += question.marks;
          correctAnswers++;
        }
      } else if (question.type === 'coding' || question.type === 'essay') {
        // Coding and Essay: require manual grading, award 0 for now
        isCorrect = false;
        marksObtained = 0;
        hasCodingOrEssay = true;
        // Note: Admin will need to manually grade these later
      }

      answerDocuments.push({
        attemptId: testAttempt._id,
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.type,
        userAnswer: userAnswer || 'Not Attempted',
        correctAnswer: question.correctAnswer || 'Manual Grading Required',
        isCorrect,
        marks: question.marks,
        marksObtained,
        explanation: question.explanation || '',
        // Include coding/essay details for display
        codingDetails: question.codingDetails || null,
        essayDetails: question.essayDetails || null,
        usedEmbeddedEditor: usedEmbeddedEditor
      });
    }

    // Save all answers
    await Answer.insertMany(answerDocuments);

    // Update test attempt with calculated results
    const percentage = test.totalMarks > 0 ? (score / test.totalMarks) * 100 : 0;
    const passed = score >= test.passingMarks;

    testAttempt.score = score;
    testAttempt.percentage = parseFloat(percentage.toFixed(2));
    testAttempt.correctAnswers = correctAnswers;
    testAttempt.passed = passed;
    testAttempt.status = 'completed';
    testAttempt.completedAt = new Date();
    testAttempt.timeTaken = timeTaken;
    testAttempt.autoSubmit = autoSubmit || false;
    
    // Set grading status based on question types
    if (hasCodingOrEssay) {
      testAttempt.gradingStatus = 'pending-review';
    } else {
      testAttempt.gradingStatus = 'auto-graded';
    }
    
    // Update tab switch data if provided
    if (tabSwitchCount !== undefined) {
      testAttempt.tabSwitchCount = tabSwitchCount;
      if (tabSwitchCount >= 3) {
        testAttempt.suspiciousActivity = true;
      }
    }
    if (tabSwitchTimestamps && Array.isArray(tabSwitchTimestamps)) {
      testAttempt.tabSwitchTimestamps = tabSwitchTimestamps;
    }
    
    // Handle fraud detection
    if (fraudDetected) {
      testAttempt.fraudDetected = true;
      testAttempt.fraudReason = fraudReason || 'Fraudulent activity detected';
      testAttempt.suspiciousActivity = true;
      console.log('🚨 FRAUD DETECTED:', fraudReason);
    }
    
    await testAttempt.save();

    console.log('✅ Test submitted:', {
      attemptId: testAttempt._id,
      score,
      passed,
      gradingStatus: testAttempt.gradingStatus,
      tabSwitches: testAttempt.tabSwitchCount,
      suspicious: testAttempt.suspiciousActivity,
      fraud: testAttempt.fraudDetected
    });

    // Determine message based on grading status
    let message;
    if (fraudDetected) {
      message = 'Test terminated due to fraudulent activity';
    } else if (testAttempt.gradingStatus === 'pending-review') {
      message = 'Test submitted successfully! Your answers are under review. You will be notified once grading is complete.';
    } else if (passed) {
      message = 'Congratulations! You passed the test!';
    } else {
      message = 'Test completed. Keep practicing!';
    }

    res.json({
      success: true,
      message,
      resultId: testAttempt._id,
      result: {
        resultId: testAttempt._id,
        userId,
        testId: test._id,
        testTitle: test.title,
        score,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        correctAnswers,
        totalQuestions: test.questions.length,
        passed,
        timeTaken,
        autoSubmit,
        gradingStatus: testAttempt.gradingStatus,
        fraudDetected: testAttempt.fraudDetected || false,
        fraudReason: testAttempt.fraudReason || '',
        tabSwitchCount: testAttempt.tabSwitchCount || 0,
        suspiciousActivity: testAttempt.suspiciousActivity || false,
        completedAt: testAttempt.completedAt,
        questionResults: answerDocuments // Include detailed answers
      }
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit test'
    });
  }
});

// Get detailed result for a specific attempt
router.get('/results/:resultId', auth, async (req, res) => {
  try {
    const { resultId } = req.params;
    const userId = req.user.id;

    const result = await TestAttempt.findOne({
      _id: resultId,
      userId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Fetch answers with question details populated
    const answers = await Answer.find({ attemptId: resultId })
      .populate({
        path: 'questionId',
        select: 'questionText type codingDetails essayDetails explanation options'
      })
      .sort({ _id: 1 }); // Maintain order

    // Format answers to include question details and grading information
    const questionResults = answers.map(answer => {
      const question = answer.questionId;
      return {
        questionId: answer.questionId?._id,
        questionText: answer.questionText,
        questionType: question?.type || 'mcq',
        options: question?.options || [],
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        marks: answer.marks,
        marksObtained: answer.marksObtained,
        manuallyGraded: answer.manuallyGraded || false,
        gradingNotes: answer.gradingNotes || '',
        explanation: answer.explanation,
        // Include coding/essay details with expected solutions
        codingDetails: question?.codingDetails || null,
        essayDetails: question?.essayDetails || null
      };
    });

    // Format the result to match frontend expectations with grading info
    const formattedResult = {
      _id: result._id,
      userId: result.userId,
      testId: result.testId,
      testTitle: result.testTitle,
      score: result.score,
      totalMarks: result.totalMarks,
      passingMarks: result.passingMarks,
      percentage: result.percentage,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      passed: result.passed,
      timeTaken: result.timeTaken,
      autoSubmit: result.autoSubmit,
      gradingStatus: result.gradingStatus || 'auto-graded',
      gradedAt: result.gradedAt,
      adminFeedback: result.adminFeedback || '',
      tabSwitchCount: result.tabSwitchCount || 0,
      suspiciousActivity: result.suspiciousActivity || false,
      fraudDetected: result.fraudDetected || false,
      fraudReason: result.fraudReason || '',
      completedAt: result.completedAt,
      questionResults: questionResults
    };

    res.json({
      success: true,
      result: formattedResult
    });
  } catch (error) {
    console.error('Fetch result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result'
    });
  }
});

// Get user's performance summary
router.get('/performance/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await TestAttempt.find({ userId });

    if (results.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalAttempts: 0,
          averageScore: 0,
          averagePercentage: 0,
          passedTests: 0,
          failedTests: 0,
          passRate: 0
        }
      });
    }

    const totalAttempts = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalAttempts - passedTests;

    res.json({
      success: true,
      summary: {
        totalAttempts,
        averageScore: (totalScore / totalAttempts).toFixed(2),
        averagePercentage: (totalPercentage / totalAttempts).toFixed(2),
        passedTests,
        failedTests,
        passRate: ((passedTests / totalAttempts) * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Fetch performance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance summary'
    });
  }
});

module.exports = router;
