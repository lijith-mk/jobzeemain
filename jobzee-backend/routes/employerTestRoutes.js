const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Job = require('../models/Job');
const TestAttempt = require('../models/TestAttempt');
const Answer = require('../models/Answer');
const { employerAuth } = require('../middleware/employerAuth');

// Middleware to check if employer owns the test
const checkTestOwnership = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Check if test was created by this employer
    if (test.createdByModel !== 'Employer' || test.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to access this test' 
      });
    }

    req.test = test;
    next();
  } catch (error) {
    console.error('Check test ownership error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify test ownership' 
    });
  }
};

// Get all tests created by this employer
router.get('/', employerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, type, category } = req.query;

    const query = {
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tests = await Test.find(query)
      .populate('questions')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Test.countDocuments(query);

    res.json({
      success: true,
      tests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get employer tests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tests' 
    });
  }
});

// ==================== PERFORMANCE MONITORING ROUTES ====================
// IMPORTANT: These must be BEFORE /:testId route to avoid route conflicts

// Get tests pending review (need manual grading) - only for employer's tests
router.get('/pending-review', employerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // First find all tests created by this employer
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(test => test._id);

    // Find attempts that need manual grading for employer's tests
    const pendingAttempts = await TestAttempt.find({
      testId: { $in: testIds },
      gradingStatus: 'pending-review',
      status: 'completed'
    })
      .populate('userId', 'name email phone')
      .populate('testId', 'title type totalMarks')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestAttempt.countDocuments({
      testId: { $in: testIds },
      gradingStatus: 'pending-review',
      status: 'completed'
    });

    // Group by test for easier management
    const testGroups = {};
    pendingAttempts.forEach(attempt => {
      const testId = attempt.testId?._id?.toString();
      if (testId) {
        if (!testGroups[testId]) {
          testGroups[testId] = {
            testId,
            testTitle: attempt.testId?.title,
            testType: attempt.testId?.type,
            attempts: []
          };
        }
        testGroups[testId].attempts.push(attempt);
      }
    });

    res.json({
      success: true,
      attempts: pendingAttempts,
      groupedByTest: Object.values(testGroups),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch pending review tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending review tests'
    });
  }
});

// Get test statistics overview for employer's tests
router.get('/statistics', employerAuth, async (req, res) => {
  try {
    const { testId } = req.query;

    // First find all tests created by this employer
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(test => test._id);

    let query = {
      testId: { $in: testIds },
      status: 'completed',
      $or: [
        { gradingStatus: { $in: ['auto-graded', 'graded'] } },
        { gradingStatus: { $exists: false } }, // Include old attempts without gradingStatus
        { gradingStatus: null }
      ]
    };
    
    if (testId) {
      // Verify the test belongs to this employer
      const test = await Test.findOne({ 
        _id: testId, 
        createdBy: req.employer.id,
        createdByModel: 'Employer'
      });
      if (!test) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view statistics for this test'
        });
      }
      query.testId = testId;
    }

    const results = await TestAttempt.find(query);
    const tests = await Test.find({ 
      _id: { $in: testIds },
      isActive: true 
    });

    // Count pending reviews separately
    const pendingQuery = { 
      testId: { $in: testIds },
      status: 'completed', 
      gradingStatus: 'pending-review' 
    };
    if (testId) {
      pendingQuery.testId = testId;
    }
    const pendingReviews = await TestAttempt.countDocuments(pendingQuery);

    if (results.length === 0) {
      return res.json({
        success: true,
        statistics: {
          totalTests: tests.length,
          totalAttempts: 0,
          gradedAttempts: 0,
          pendingReviews,
          averageScore: 0,
          averagePercentage: 0,
          passRate: 0,
          testBreakdown: []
        }
      });
    }

    // Overall statistics
    const totalAttempts = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const passedAttempts = results.filter(r => r.passed).length;

    // Per-test breakdown
    const testBreakdown = {};
    results.forEach(result => {
      const testIdStr = result.testId.toString();
      if (!testBreakdown[testIdStr]) {
        testBreakdown[testIdStr] = {
          testId: result.testId,
          testTitle: result.testTitle,
          attempts: 0,
          totalScore: 0,
          totalPercentage: 0,
          passed: 0
        };
      }

      testBreakdown[testIdStr].attempts++;
      testBreakdown[testIdStr].totalScore += result.score;
      testBreakdown[testIdStr].totalPercentage += result.percentage;
      if (result.passed) {
        testBreakdown[testIdStr].passed++;
      }
    });

    // Calculate averages for each test
    const testStats = Object.values(testBreakdown).map(test => ({
      testId: test.testId,
      testTitle: test.testTitle,
      attempts: test.attempts,
      averageScore: (test.totalScore / test.attempts).toFixed(2),
      averagePercentage: (test.totalPercentage / test.attempts).toFixed(2),
      passRate: ((test.passed / test.attempts) * 100).toFixed(2)
    }));

    res.json({
      success: true,
      statistics: {
        totalTests: tests.length,
        totalAttempts: totalAttempts + pendingReviews,
        gradedAttempts: totalAttempts,
        pendingReviews,
        averageScore: totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0,
        averagePercentage: totalAttempts > 0 ? (totalPercentage / totalAttempts).toFixed(2) : 0,
        passRate: totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(2) : 0,
        testBreakdown: testStats
      }
    });
  } catch (error) {
    console.error('Fetch test statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test statistics'
    });
  }
});

// Get all test attempts for employer's tests
router.get('/attempts', employerAuth, async (req, res) => {
  try {
    const { testId, gradingStatus, page = 1, limit = 20 } = req.query;

    // First find all tests created by this employer
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(test => test._id);

    let query = { 
      testId: { $in: testIds },
      status: { $in: ['completed', 'processing'] } // Include both completed and processing states
    };
    
    if (testId) {
      // Verify the test belongs to this employer
      const test = await Test.findOne({ 
        _id: testId, 
        createdBy: req.employer.id,
        createdByModel: 'Employer'
      });
      if (!test) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view attempts for this test'
        });
      }
      query.testId = testId;
    }

    if (gradingStatus) {
      query.gradingStatus = gradingStatus;
    }

    const skip = (page - 1) * limit;

    const attempts = await TestAttempt.find(query)
      .populate('userId', 'name email phone')
      .populate('testId', 'title type totalMarks')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestAttempt.countDocuments(query);

    // Get grading status counts
    const statusCounts = await TestAttempt.aggregate([
      { $match: { testId: { $in: testIds } } },
      {
        $group: {
          _id: '$gradingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      'auto-graded': 0,
      'pending-review': 0,
      'graded': 0
    };
    statusCounts.forEach(s => {
      stats[s._id] = s.count;
    });

    res.json({
      success: true,
      attempts,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch test attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test attempts'
    });
  }
});

// Get detailed result for specific attempt
router.get('/attempts/:resultId', employerAuth, async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await TestAttempt.findById(resultId)
      .populate('userId', 'name email phone')
      .populate('testId');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found'
      });
    }

    // Verify the test belongs to this employer
    if (result.testId.createdByModel !== 'Employer' || 
        result.testId.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this result'
      });
    }

    // Fetch answers with question details
    const answers = await Answer.find({ attemptId: resultId })
      .populate({
        path: 'questionId',
        select: 'questionText type options correctAnswer codingDetails essayDetails explanation marks'
      })
      .sort({ _id: 1 });

    // Format answers to include question details
    const questionResults = answers.map(answer => {
      const question = answer.questionId;
      return {
        _id: answer._id,
        questionId: answer.questionId?._id,
        questionText: answer.questionText,
        questionType: answer.questionType || question?.type || 'mcq',
        options: question?.options || [],
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        marks: answer.marks,
        marksObtained: answer.marksObtained,
        manuallyGraded: answer.manuallyGraded || false,
        gradingNotes: answer.gradingNotes || '',
        explanation: answer.explanation,
        codingDetails: question?.codingDetails || answer.codingDetails || null,
        essayDetails: question?.essayDetails || answer.essayDetails || null
      };
    });

    res.json({
      success: true,
      result: {
        ...result.toObject(),
        questionResults
      }
    });
  } catch (error) {
    console.error('Fetch test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test result'
    });
  }
});

// Update manual grading for a test attempt
router.put('/attempts/:resultId/grade', employerAuth, async (req, res) => {
  try {
    const { resultId } = req.params;
    const { questionGrades, feedback } = req.body;

    if (!questionGrades || !Array.isArray(questionGrades) || questionGrades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question grades are required'
      });
    }

    const attempt = await TestAttempt.findById(resultId).populate('testId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Verify the test belongs to this employer
    if (attempt.testId.createdByModel !== 'Employer' || 
        attempt.testId.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to grade this attempt'
      });
    }

    // Update individual question grades
    let totalScore = 0;
    for (const grade of questionGrades) {
      const answer = await Answer.findById(grade.answerId);
      if (answer && answer.attemptId.toString() === resultId) {
        answer.marksObtained = grade.marksObtained;
        answer.gradingNotes = grade.gradingNotes || '';
        answer.manuallyGraded = true;
        await answer.save();
        totalScore += grade.marksObtained;
      }
    }

    // Update attempt with new score
    attempt.score = totalScore;
    attempt.percentage = (totalScore / attempt.testId.totalMarks) * 100;
    attempt.passed = attempt.percentage >= ((attempt.testId.passingMarks / attempt.testId.totalMarks) * 100);
    attempt.gradingStatus = 'graded';
    attempt.gradedBy = req.employer.id;
    attempt.gradedAt = new Date();
    if (feedback) {
      attempt.feedback = feedback;
    }

    await attempt.save();

    res.json({
      success: true,
      message: 'Test graded successfully',
      result: attempt
    });
  } catch (error) {
    console.error('Grade test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade test'
    });
  }
});

// ==================== REGULAR TEST ROUTES ====================

// Get a specific test by ID
router.get('/:testId', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .populate({
        path: 'questions',
        options: { sort: { order: 1 } }
      });

    res.json({
      success: true,
      test
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch test' 
    });
  }
});

// Create a new test
router.post('/', employerAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      tags,
      instructions
    } = req.body;

    // Validation
    if (!title || !type) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and type are required' 
      });
    }

    const test = new Test({
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      questionCount: 0,
      isActive: false, // Always start as inactive
      tags: tags || [],
      instructions,
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    });

    await test.save();

    res.status(201).json({
      success: true,
      message: 'Test created successfully. Add questions to activate it.',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create test' 
    });
  }
});

// Update test
router.put('/:testId', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const {
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      isActive,
      tags,
      instructions
    } = req.body;

    const test = req.test;

    // Check if trying to activate test without questions
    if (isActive && !test.canActivate()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot activate test without questions' 
      });
    }

    // Update fields
    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (jobRole !== undefined) test.jobRole = jobRole;
    if (skill !== undefined) test.skill = skill;
    if (type) test.type = type;
    if (category) test.category = category;
    if (difficulty) test.difficulty = difficulty;
    if (duration) test.duration = duration;
    if (totalMarks) test.totalMarks = totalMarks;
    if (passingMarks) test.passingMarks = passingMarks;
    if (isActive !== undefined) test.isActive = isActive;
    if (tags) test.tags = tags;
    if (instructions !== undefined) test.instructions = instructions;

    await test.save();

    const updatedTest = await Test.findById(test._id).populate('questions');

    res.json({
      success: true,
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update test' 
    });
  }
});

// Delete test
router.delete('/:testId', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const test = req.test;

    // Check if test is linked to any jobs
    const linkedJobs = await Job.countDocuments({ testId: test._id });
    
    if (linkedJobs > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete test that is linked to job postings. Please remove the test from all jobs first.' 
      });
    }

    // Delete all questions associated with this test
    await Question.deleteMany({ testId: test._id });

    // Delete the test
    await Test.findByIdAndDelete(test._id);

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete test' 
    });
  }
});

// Add question to test
router.post('/:testId/questions', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const test = req.test;
    const questionData = req.body;

    // Validate question data
    if (!questionData.questionText || !questionData.type) {
      return res.status(400).json({ 
        success: false,
        message: 'Question text and type are required' 
      });
    }

    // Type-specific validation
    if (questionData.type === 'mcq' && (!questionData.options || questionData.options.length < 2)) {
      return res.status(400).json({ 
        success: false,
        message: 'MCQ questions require at least 2 options' 
      });
    }

    if (questionData.type === 'mcq' && !questionData.correctAnswer) {
      return res.status(400).json({ 
        success: false,
        message: 'MCQ questions require a correct answer' 
      });
    }

    // Create question
    const question = new Question({
      ...questionData,
      testId: test._id,
      order: test.questionCount + 1
    });

    await question.save();

    // Update test's question count
    test.questionCount += 1;
    
    // Update total marks based on all questions
    await test.updateTotalMarks();
    await test.save();

    // Populate and return updated test
    const updatedTest = await Test.findById(test._id).populate('questions');

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      test: updatedTest,
      question
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add question' 
    });
  }
});

// Get all questions for a test
router.get('/:testId/questions', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const questions = await Question.find({ testId: req.params.testId })
      .sort({ order: 1 });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch questions' 
    });
  }
});

// Update question in test
router.put('/:testId/questions/:questionId', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const { questionId } = req.params;
    const questionData = req.body;

    const question = await Question.findOne({ 
      _id: questionId, 
      testId: req.test._id 
    });
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Update question
    Object.assign(question, questionData);
    await question.save();

    // Update test's total marks after question update
    const test = req.test;
    await test.updateTotalMarks();
    await test.save();

    // Populate and return updated test
    const updatedTest = await Test.findById(req.test._id).populate('questions');

    res.json({
      success: true,
      message: 'Question updated successfully',
      test: updatedTest,
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update question' 
    });
  }
});

// Delete question from test
router.delete('/:testId/questions/:questionId', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const { questionId } = req.params;
    const test = req.test;

    const question = await Question.findOne({ 
      _id: questionId, 
      testId: test._id 
    });

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Delete the question
    await Question.findByIdAndDelete(questionId);

    // Update test's question count and deactivate if no questions left
    test.questionCount = Math.max(0, test.questionCount - 1);
    if (test.questionCount === 0) {
      test.isActive = false;
    }
    
    // Update total marks after deleting question
    await test.updateTotalMarks();
    await test.save();

    // Reorder remaining questions
    const remainingQuestions = await Question.find({ testId: test._id }).sort({ order: 1 });
    for (let i = 0; i < remainingQuestions.length; i++) {
      remainingQuestions[i].order = i + 1;
      await remainingQuestions[i].save();
    }

    // Populate and return updated test
    const updatedTest = await Test.findById(test._id).populate('questions');

    res.json({
      success: true,
      message: 'Question deleted successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete question' 
    });
  }
});

// Toggle test active status
router.patch('/:testId/toggle-active', employerAuth, checkTestOwnership, async (req, res) => {
  try {
    const test = req.test;

    if (!test.isActive && !test.canActivate()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot activate test without questions' 
      });
    }

    test.isActive = !test.isActive;
    await test.save();

    res.json({
      success: true,
      message: `Test ${test.isActive ? 'activated' : 'deactivated'} successfully`,
      test
    });
  } catch (error) {
    console.error('Toggle test active error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle test status' 
    });
  }
});

module.exports = router;
