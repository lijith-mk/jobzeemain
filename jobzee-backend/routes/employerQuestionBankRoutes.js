const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Test = require('../models/Test');
const { employerAuth } = require('../middleware/employerAuth');

// Middleware to check if question belongs to employer (through test ownership)
const checkQuestionOwnership = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId).populate('testId');
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Check if the test was created by this employer
    if (!question.testId || 
        question.testId.createdByModel !== 'Employer' || 
        question.testId.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to access this question' 
      });
    }

    req.question = question;
    next();
  } catch (error) {
    console.error('Check question ownership error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify question ownership' 
    });
  }
};

// Get all questions created by this employer (from all their tests)
router.get('/', employerAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      difficulty,
      testId,
      search 
    } = req.query;

    // First find all tests created by this employer
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(test => test._id);

    // Build query for questions
    const query = { testId: { $in: testIds } };

    if (type) {
      query.type = type;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (testId) {
      query.testId = testId;
    }

    if (search) {
      query.questionText = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await Question.find(query)
      .populate('testId', 'title type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Question.countDocuments(query);

    // Group questions by type for easy filtering
    const questionsByType = await Question.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      questions,
      statistics: {
        total,
        byType: questionsByType,
        totalTests: testIds.length
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch questions' 
    });
  }
});

// Get a specific question by ID
router.get('/:questionId', employerAuth, checkQuestionOwnership, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId)
      .populate('testId', 'title type category difficulty');

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch question' 
    });
  }
});

// Create a standalone question (will be added to a specific test)
router.post('/', employerAuth, async (req, res) => {
  try {
    const { testId, ...questionData } = req.body;

    // Validate required fields
    if (!questionData.questionText || !questionData.type) {
      return res.status(400).json({ 
        success: false,
        message: 'Question text and type are required' 
      });
    }

    // Validate testId and ownership
    if (!testId) {
      return res.status(400).json({ 
        success: false,
        message: 'Test ID is required to create a question' 
      });
    }

    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Check if employer owns the test
    if (test.createdByModel !== 'Employer' || test.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to add questions to this test' 
      });
    }

    // Type-specific validation
    if (questionData.type === 'mcq') {
      if (!questionData.options || questionData.options.length < 2) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require at least 2 options' 
        });
      }
      if (!questionData.correctAnswer) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require a correct answer' 
        });
      }
    }

    if (questionData.type === 'true-false') {
      if (!questionData.correctAnswer) {
        return res.status(400).json({ 
          success: false,
          message: 'True/False questions require a correct answer' 
        });
      }
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
    await test.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a question
router.put('/:questionId', employerAuth, checkQuestionOwnership, async (req, res) => {
  try {
    const question = req.question;
    const updateData = req.body;

    // Don't allow changing testId through this route
    delete updateData.testId;

    // Type-specific validation if type is being changed or it's an MCQ
    if (updateData.type === 'mcq' || (question.type === 'mcq' && !updateData.type)) {
      const options = updateData.options || question.options;
      const correctAnswer = updateData.correctAnswer || question.correctAnswer;
      
      if (!options || options.length < 2) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require at least 2 options' 
        });
      }
      if (!correctAnswer) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require a correct answer' 
        });
      }
    }

    // Update question
    Object.assign(question, updateData);
    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
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

// Delete a question
router.delete('/:questionId', employerAuth, checkQuestionOwnership, async (req, res) => {
  try {
    const question = req.question;
    const test = await Test.findById(question.testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Associated test not found' 
      });
    }

    // Delete the question
    await Question.findByIdAndDelete(question._id);

    // Update test's question count and deactivate if no questions left
    test.questionCount = Math.max(0, test.questionCount - 1);
    if (test.questionCount === 0) {
      test.isActive = false;
    }
    await test.save();

    // Reorder remaining questions
    const remainingQuestions = await Question.find({ testId: test._id }).sort({ order: 1 });
    for (let i = 0; i < remainingQuestions.length; i++) {
      remainingQuestions[i].order = i + 1;
      await remainingQuestions[i].save();
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete question' 
    });
  }
});

// Duplicate a question (create a copy)
router.post('/:questionId/duplicate', employerAuth, checkQuestionOwnership, async (req, res) => {
  try {
    const originalQuestion = req.question;
    const { targetTestId } = req.body;

    // Determine target test
    let targetTest;
    if (targetTestId) {
      targetTest = await Test.findById(targetTestId);
      if (!targetTest || 
          targetTest.createdByModel !== 'Employer' || 
          targetTest.createdBy.toString() !== req.employer.id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Invalid target test or you do not have permission' 
        });
      }
    } else {
      // Duplicate to same test
      targetTest = await Test.findById(originalQuestion.testId);
    }

    // Create duplicate question
    const duplicateQuestion = new Question({
      testId: targetTest._id,
      questionText: originalQuestion.questionText + ' (Copy)',
      type: originalQuestion.type,
      options: originalQuestion.options,
      correctAnswer: originalQuestion.correctAnswer,
      codingDetails: originalQuestion.codingDetails,
      essayDetails: originalQuestion.essayDetails,
      marks: originalQuestion.marks,
      explanation: originalQuestion.explanation,
      difficulty: originalQuestion.difficulty,
      order: targetTest.questionCount + 1,
      isActive: true
    });

    await duplicateQuestion.save();

    // Update target test's question count
    targetTest.questionCount += 1;
    await targetTest.save();

    res.status(201).json({
      success: true,
      message: 'Question duplicated successfully',
      question: duplicateQuestion
    });
  } catch (error) {
    console.error('Duplicate question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to duplicate question' 
    });
  }
});

// Move question to another test
router.post('/:questionId/move', employerAuth, checkQuestionOwnership, async (req, res) => {
  try {
    const question = req.question;
    const { targetTestId } = req.body;

    if (!targetTestId) {
      return res.status(400).json({ 
        success: false,
        message: 'Target test ID is required' 
      });
    }

    // Validate target test
    const targetTest = await Test.findById(targetTestId);
    if (!targetTest || 
        targetTest.createdByModel !== 'Employer' || 
        targetTest.createdBy.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid target test or you do not have permission' 
      });
    }

    const sourceTest = await Test.findById(question.testId);

    // Move question
    question.testId = targetTest._id;
    question.order = targetTest.questionCount + 1;
    await question.save();

    // Update source test
    if (sourceTest) {
      sourceTest.questionCount = Math.max(0, sourceTest.questionCount - 1);
      if (sourceTest.questionCount === 0) {
        sourceTest.isActive = false;
      }
      await sourceTest.save();

      // Reorder remaining questions in source test
      const remainingQuestions = await Question.find({ testId: sourceTest._id }).sort({ order: 1 });
      for (let i = 0; i < remainingQuestions.length; i++) {
        remainingQuestions[i].order = i + 1;
        await remainingQuestions[i].save();
      }
    }

    // Update target test
    targetTest.questionCount += 1;
    await targetTest.save();

    res.json({
      success: true,
      message: 'Question moved successfully',
      question
    });
  } catch (error) {
    console.error('Move question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to move question' 
    });
  }
});

// Bulk operations
router.post('/bulk/delete', employerAuth, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Question IDs array is required' 
      });
    }

    // Verify all questions belong to employer
    const questions = await Question.find({ _id: { $in: questionIds } }).populate('testId');
    
    for (const question of questions) {
      if (!question.testId || 
          question.testId.createdByModel !== 'Employer' || 
          question.testId.createdBy.toString() !== req.employer.id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have permission to delete one or more questions' 
        });
      }
    }

    // Group by test for efficient updates
    const testUpdates = {};
    questions.forEach(question => {
      const testId = question.testId._id.toString();
      if (!testUpdates[testId]) {
        testUpdates[testId] = 0;
      }
      testUpdates[testId]++;
    });

    // Delete questions
    await Question.deleteMany({ _id: { $in: questionIds } });

    // Update test question counts
    for (const [testId, count] of Object.entries(testUpdates)) {
      const test = await Test.findById(testId);
      if (test) {
        test.questionCount = Math.max(0, test.questionCount - count);
        if (test.questionCount === 0) {
          test.isActive = false;
        }
        await test.save();

        // Reorder remaining questions
        const remainingQuestions = await Question.find({ testId }).sort({ order: 1 });
        for (let i = 0; i < remainingQuestions.length; i++) {
          remainingQuestions[i].order = i + 1;
          await remainingQuestions[i].save();
        }
      }
    }

    res.json({
      success: true,
      message: `${questionIds.length} questions deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete questions' 
    });
  }
});

// Get question statistics
router.get('/statistics/overview', employerAuth, async (req, res) => {
  try {
    // Find all tests created by this employer
    const employerTests = await Test.find({ 
      createdBy: req.employer.id,
      createdByModel: 'Employer'
    }).select('_id');

    const testIds = employerTests.map(test => test._id);

    // Aggregate statistics
    const stats = await Question.aggregate([
      { $match: { testId: { $in: testIds } } },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byDifficulty: [
            { $group: { _id: '$difficulty', count: { $sum: 1 } } }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        total: stats[0].total[0]?.count || 0,
        byType: stats[0].byType,
        byDifficulty: stats[0].byDifficulty,
        totalTests: testIds.length
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics' 
    });
  }
});

module.exports = router;
