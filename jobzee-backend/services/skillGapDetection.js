/**
 * Skill Gap Detection Service
 * Analyzes test results and learning progress to identify skill gaps
 * and recommend personalized learning paths
 */

const TestResult = require('../models/TestResult');
const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Course = require('../models/Course');
const LearningPath = require('../models/LearningPath');
const CourseProgress = require('../models/CourseProgress');
const User = require('../models/User');

/**
 * Analyze user's test results to identify skill gaps
 * @param {String} userId - User's MongoDB ID
 * @param {Object} options - Analysis options (limit, threshold, etc.)
 * @returns {Object} Detailed skill gap analysis
 */
exports.analyzeSkillGaps = async (userId, options = {}) => {
  try {
    const {
      limit = 10, // Number of recent tests to analyze
      weakThreshold = 70, // Below this percentage is considered weak
      minAttempts = 1 // Minimum test attempts required
    } = options;

    // Fetch user's recent test results
    const testResults = await TestResult.find({ userId })
      .populate('testId', 'title skills requiredSkills category jobRole difficulty')
      .sort({ completedAt: -1 })
      .limit(limit);

    if (testResults.length === 0) {
      return {
        hasData: false,
        message: 'No test results found for analysis',
        skillGaps: [],
        recommendations: []
      };
    }

    // Aggregate skill-wise performance
    const skillMap = new Map();
    const categoryPerformance = new Map();
    const jobRolePerformance = new Map();

    testResults.forEach(result => {
      const { testId, percentage, score, totalMarks, correctAnswers, totalQuestions } = result;
      
      if (!testId) return;

      // Extract skills from test
      const testSkills = [
        ...(testId.skills || []),
        ...(testId.requiredSkills || []),
        testId.jobRole ? [testId.jobRole] : []
      ].filter(Boolean);

      // Analyze each skill
      testSkills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, {
            skill,
            totalAttempts: 0,
            totalTests: 0,
            totalScore: 0,
            totalMarks: 0,
            averagePercentage: 0,
            lowestScore: 100,
            highestScore: 0,
            testDetails: [],
            isWeakArea: false
          });
        }

        const skillData = skillMap.get(skill);
        skillData.totalAttempts += 1;
        skillData.totalTests += 1;
        skillData.totalScore += score;
        skillData.totalMarks += totalMarks;
        skillData.lowestScore = Math.min(skillData.lowestScore, percentage);
        skillData.highestScore = Math.max(skillData.highestScore, percentage);
        skillData.testDetails.push({
          testTitle: testId.title,
          percentage,
          completedAt: result.completedAt,
          passed: result.passed
        });
      });

      // Category-wise performance
      if (testId.category) {
        if (!categoryPerformance.has(testId.category)) {
          categoryPerformance.set(testId.category, {
            category: testId.category,
            totalTests: 0,
            totalScore: 0,
            totalMarks: 0,
            averagePercentage: 0
          });
        }
        const catData = categoryPerformance.get(testId.category);
        catData.totalTests += 1;
        catData.totalScore += score;
        catData.totalMarks += totalMarks;
      }

      // Job role performance
      if (testId.jobRole) {
        if (!jobRolePerformance.has(testId.jobRole)) {
          jobRolePerformance.set(testId.jobRole, {
            jobRole: testId.jobRole,
            totalTests: 0,
            totalScore: 0,
            totalMarks: 0,
            averagePercentage: 0
          });
        }
        const roleData = jobRolePerformance.get(testId.jobRole);
        roleData.totalTests += 1;
        roleData.totalScore += score;
        roleData.totalMarks += totalMarks;
      }
    });

    // Calculate averages and identify weak areas
    const skillGaps = [];
    const strongSkills = [];

    skillMap.forEach((data, skill) => {
      data.averagePercentage = (data.totalScore / data.totalMarks) * 100;
      data.isWeakArea = data.averagePercentage < weakThreshold;

      if (data.isWeakArea) {
        skillGaps.push({
          ...data,
          gapSeverity: data.averagePercentage < 40 ? 'critical' : 
                       data.averagePercentage < 55 ? 'high' : 'moderate',
          improvementNeeded: weakThreshold - data.averagePercentage
        });
      } else {
        strongSkills.push(data);
      }
    });

    // Calculate category averages
    categoryPerformance.forEach((data, category) => {
      data.averagePercentage = (data.totalScore / data.totalMarks) * 100;
    });

    // Calculate job role averages
    jobRolePerformance.forEach((data, jobRole) => {
      data.averagePercentage = (data.totalScore / data.totalMarks) * 100;
    });

    // Sort skill gaps by severity
    skillGaps.sort((a, b) => a.averagePercentage - b.averagePercentage);

    // Get learning recommendations
    const recommendations = await this.getRecommendationsForGaps(
      userId,
      skillGaps,
      strongSkills
    );

    return {
      hasData: true,
      summary: {
        totalTestsTaken: testResults.length,
        totalSkillsAnalyzed: skillMap.size,
        weakSkillsCount: skillGaps.length,
        strongSkillsCount: strongSkills.length,
        overallPerformance: {
          averageScore: testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length,
          passRate: (testResults.filter(r => r.passed).length / testResults.length) * 100
        }
      },
      skillGaps: skillGaps.slice(0, 10), // Top 10 gaps
      strongSkills: strongSkills.slice(0, 5), // Top 5 strengths
      categoryPerformance: Array.from(categoryPerformance.values()),
      jobRolePerformance: Array.from(jobRolePerformance.values()),
      recommendations,
      analyzedAt: new Date()
    };

  } catch (error) {
    console.error('Skill gap analysis error:', error);
    throw error;
  }
};

/**
 * Get personalized learning recommendations based on skill gaps
 * @param {String} userId - User's MongoDB ID
 * @param {Array} skillGaps - Identified skill gaps
 * @param {Array} strongSkills - User's strong skills
 * @returns {Object} Learning recommendations
 */
exports.getRecommendationsForGaps = async (userId, skillGaps, strongSkills = []) => {
  try {
    if (!skillGaps || skillGaps.length === 0) {
      return {
        courses: [],
        learningPaths: [],
        message: 'No skill gaps identified'
      };
    }

    // Extract weak skill names
    const weakSkillNames = skillGaps.map(gap => gap.skill);
    const strongSkillNames = strongSkills.map(s => s.skill);

    // Find courses that address these skill gaps
    const recommendedCourses = await Course.find({
      isActive: true,
      $or: [
        { skills: { $in: weakSkillNames } },
        { targetJobRoles: { $in: weakSkillNames } },
        { category: { $in: weakSkillNames.map(s => s.toLowerCase().replace(/\s+/g, '-')) } }
      ]
    })
      .limit(10)
      .select('title description skills level duration thumbnail averageRating')
      .lean();

    // Check which courses user is already enrolled in
    const enrolledCourses = await CourseProgress.find({
      userId,
      courseId: { $in: recommendedCourses.map(c => c._id) }
    }).select('courseId status progressPercentage');

    const enrolledCourseIds = enrolledCourses.map(ec => ec.courseId.toString());

    // Add match score and enrollment status
    const coursesWithScore = recommendedCourses.map(course => {
      const matchingGaps = course.skills.filter(skill => 
        weakSkillNames.some(weak => 
          weak.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(weak.toLowerCase())
        )
      );

      const enrolled = enrolledCourses.find(ec => 
        ec.courseId.toString() === course._id.toString()
      );

      return {
        ...course,
        matchScore: matchingGaps.length,
        addressesGaps: matchingGaps,
        isEnrolled: !!enrolled,
        enrollmentStatus: enrolled ? {
          status: enrolled.status,
          progress: enrolled.progressPercentage
        } : null
      };
    });

    // Sort by match score
    coursesWithScore.sort((a, b) => b.matchScore - a.matchScore);

    // Find learning paths that address these skill gaps
    const recommendedPaths = await LearningPath.find({
      isActive: true,
      status: 'published',
      $or: [
        { skills: { $in: weakSkillNames } },
        { targetJobRole: { $in: weakSkillNames } },
        { category: { $in: weakSkillNames } }
      ]
    })
      .limit(5)
      .select('title description skills targetJobRole level estimatedDuration thumbnail')
      .lean();

    // Add match score to paths
    const pathsWithScore = recommendedPaths.map(path => {
      const matchingGaps = (path.skills || []).filter(skill => 
        weakSkillNames.some(weak => 
          weak.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(weak.toLowerCase())
        )
      );

      return {
        ...path,
        matchScore: matchingGaps.length,
        addressesGaps: matchingGaps
      };
    });

    pathsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    return {
      courses: coursesWithScore,
      learningPaths: pathsWithScore,
      totalRecommendations: coursesWithScore.length + pathsWithScore.length
    };

  } catch (error) {
    console.error('Get recommendations error:', error);
    throw error;
  }
};

/**
 * Get detailed question-level analysis for skill gaps
 * @param {String} userId - User's MongoDB ID
 * @param {String} testId - Specific test ID to analyze
 * @returns {Object} Question-level skill analysis
 */
exports.analyzeQuestionLevelSkills = async (userId, testId) => {
  try {
    const testResult = await TestResult.findOne({ userId, testId })
      .populate('testId', 'title skills');

    if (!testResult) {
      return {
        message: 'Test result not found',
        analysis: null
      };
    }

    // Get all questions from the test
    const questions = await Question.find({ testId }).select('questionText type difficulty marks');

    // Analyze each question result
    const questionAnalysis = testResult.questionResults.map((qr, index) => {
      const question = questions.find(q => q._id.toString() === qr.questionId.toString());
      
      return {
        questionNumber: index + 1,
        questionText: qr.questionText,
        type: question?.type,
        difficulty: question?.difficulty,
        isCorrect: qr.isCorrect,
        marksObtained: qr.marksObtained,
        totalMarks: qr.marks,
        efficiency: (qr.marksObtained / qr.marks) * 100
      };
    });

    // Group by difficulty
    const difficultyAnalysis = {
      easy: { total: 0, correct: 0, accuracy: 0 },
      medium: { total: 0, correct: 0, accuracy: 0 },
      hard: { total: 0, correct: 0, accuracy: 0 }
    };

    questionAnalysis.forEach(qa => {
      if (qa.difficulty && difficultyAnalysis[qa.difficulty]) {
        difficultyAnalysis[qa.difficulty].total += 1;
        if (qa.isCorrect) {
          difficultyAnalysis[qa.difficulty].correct += 1;
        }
      }
    });

    // Calculate accuracy percentages
    Object.keys(difficultyAnalysis).forEach(level => {
      const data = difficultyAnalysis[level];
      data.accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    });

    return {
      testTitle: testResult.testTitle,
      overallScore: testResult.percentage,
      questionAnalysis,
      difficultyAnalysis,
      weakDifficulties: Object.entries(difficultyAnalysis)
        .filter(([_, data]) => data.accuracy < 70)
        .map(([level, data]) => ({ level, ...data }))
    };

  } catch (error) {
    console.error('Question-level analysis error:', error);
    throw error;
  }
};

/**
 * Generate comprehensive skill gap report for user
 * @param {String} userId - User's MongoDB ID
 * @returns {Object} Complete skill gap report with visualizations data
 */
exports.generateSkillGapReport = async (userId) => {
  try {
    const user = await User.findById(userId).select('name email skills desiredJobRole');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get comprehensive skill gap analysis
    const skillAnalysis = await this.analyzeSkillGaps(userId, {
      limit: 20,
      weakThreshold: 70
    });

    // Get course progress
    const courseProgress = await CourseProgress.find({ userId })
      .populate('courseId', 'title skills category')
      .select('status progressPercentage completedLessons timeSpent');

    // Calculate learning velocity
    const completedCourses = courseProgress.filter(cp => cp.status === 'completed').length;
    const inProgressCourses = courseProgress.filter(cp => cp.status === 'in-progress').length;
    const totalTimeSpent = courseProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0);

    // Map skill gaps to learning progress
    const gapToProgressMap = skillAnalysis.skillGaps.map(gap => {
      const relevantCourses = courseProgress.filter(cp => 
        cp.courseId?.skills?.some(skill => 
          skill.toLowerCase().includes(gap.skill.toLowerCase())
        )
      );

      return {
        skill: gap.skill,
        gapSeverity: gap.gapSeverity,
        averagePerformance: gap.averagePercentage,
        relevantCoursesEnrolled: relevantCourses.length,
        averageProgressInRelevantCourses: relevantCourses.length > 0
          ? relevantCourses.reduce((sum, c) => sum + c.progressPercentage, 0) / relevantCourses.length
          : 0,
        recommendedAction: gap.gapSeverity === 'critical' 
          ? 'Start with beginner courses immediately'
          : gap.gapSeverity === 'high'
          ? 'Enroll in targeted courses'
          : 'Practice and take more tests'
      };
    });

    return {
      userProfile: {
        name: user.name,
        email: user.email,
        currentSkills: user.skills || [],
        desiredJobRole: user.desiredJobRole
      },
      skillAnalysis,
      learningProgress: {
        completedCourses,
        inProgressCourses,
        totalTimeSpent,
        averageTimePerCourse: courseProgress.length > 0 
          ? totalTimeSpent / courseProgress.length 
          : 0
      },
      skillGapMapping: gapToProgressMap,
      actionPlan: this.generateActionPlan(skillAnalysis.skillGaps),
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Generate skill gap report error:', error);
    throw error;
  }
};

/**
 * Generate actionable plan based on skill gaps
 * @param {Array} skillGaps - List of identified skill gaps
 * @returns {Array} Action plan items
 */
exports.generateActionPlan = (skillGaps) => {
  const actionPlan = [];

  // Prioritize critical gaps
  const criticalGaps = skillGaps.filter(gap => gap.gapSeverity === 'critical');
  const highGaps = skillGaps.filter(gap => gap.gapSeverity === 'high');
  const moderateGaps = skillGaps.filter(gap => gap.gapSeverity === 'moderate');

  if (criticalGaps.length > 0) {
    actionPlan.push({
      priority: 1,
      phase: 'Immediate Action Required',
      duration: '1-2 weeks',
      skills: criticalGaps.map(g => g.skill),
      actions: [
        'Enroll in beginner-level courses for these critical skills',
        'Take practice tests to understand fundamentals',
        'Dedicate at least 2 hours daily to these topics',
        'Seek mentor guidance for these weak areas'
      ]
    });
  }

  if (highGaps.length > 0) {
    actionPlan.push({
      priority: 2,
      phase: 'Short-term Focus',
      duration: '2-4 weeks',
      skills: highGaps.map(g => g.skill),
      actions: [
        'Take intermediate-level courses',
        'Practice with real-world projects',
        'Retake assessments after learning',
        'Join study groups or communities'
      ]
    });
  }

  if (moderateGaps.length > 0) {
    actionPlan.push({
      priority: 3,
      phase: 'Continuous Improvement',
      duration: '1-2 months',
      skills: moderateGaps.map(g => g.skill),
      actions: [
        'Take advanced courses to master these skills',
        'Work on portfolio projects',
        'Participate in coding challenges',
        'Teach others to solidify knowledge'
      ]
    });
  }

  return actionPlan;
};

module.exports = exports;
