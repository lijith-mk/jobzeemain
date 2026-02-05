const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const MicroQuiz = require('../models/MicroQuiz');
const MicroQuizAttempt = require('../models/MicroQuizAttempt');
const CourseProgress = require('../models/CourseProgress');
const Certificate = require('../models/Certificate');

/**
 * Certificate Eligibility Checker
 * Determines if a user is eligible for a certificate
 */

/**
 * Check if user is eligible for certificate
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Object} - { eligible, message, details }
 */
async function checkCertificateEligibility(userId, courseId) {
  try {
    // 1. Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ userId, courseId });
    if (existingCertificate) {
      return {
        eligible: false,
        message: 'Certificate already issued for this course',
        details: {
          certificateId: existingCertificate.certificateId,
          issuedAt: existingCertificate.issuedAt
        }
      };
    }

    // 2. Get course and its lessons
    const course = await Course.findById(courseId);
    if (!course) {
      return {
        eligible: false,
        message: 'Course not found'
      };
    }

    const lessons = await Lesson.find({ courseId, isActive: true }).sort({ lessonOrder: 1 });
    if (lessons.length === 0) {
      return {
        eligible: false,
        message: 'Course has no active lessons'
      };
    }

    // 3. Get user's course progress
    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      return {
        eligible: false,
        message: 'User not enrolled in this course',
        details: {
          totalLessons: lessons.length,
          completedLessons: 0,
          progressPercentage: 0
        }
      };
    }

    // 4. Check if all lessons are completed
    const completedLessonIds = progress.completedLessons.map(cl => cl.lessonId.toString());
    const totalLessons = lessons.length;
    const completedCount = lessons.filter(lesson => 
      completedLessonIds.includes(lesson._id.toString())
    ).length;

    if (completedCount < totalLessons) {
      return {
        eligible: false,
        message: 'Not all lessons are completed',
        details: {
          totalLessons,
          completedLessons: completedCount,
          progressPercentage: Math.round((completedCount / totalLessons) * 100),
          remainingLessons: totalLessons - completedCount
        }
      };
    }

    // 5. Check mandatory quizzes
    const quizEligibility = await checkQuizEligibility(userId, courseId, lessons);
    if (!quizEligibility.eligible) {
      return quizEligibility;
    }

    // 6. All checks passed
    return {
      eligible: true,
      message: 'User is eligible for certificate',
      details: {
        totalLessons,
        completedLessons: completedCount,
        progressPercentage: 100,
        totalQuizzes: quizEligibility.details.totalMandatoryQuizzes,
        passedQuizzes: quizEligibility.details.passedMandatoryQuizzes,
        averageQuizScore: quizEligibility.details.averageQuizScore,
        timeSpent: progress.timeSpent || 0
      }
    };

  } catch (error) {
    console.error('Certificate eligibility check error:', error);
    return {
      eligible: false,
      message: 'Error checking eligibility',
      error: error.message
    };
  }
}

/**
 * Check if all mandatory quizzes are passed
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {Array} lessons - Course lessons
 * @returns {Object} - { eligible, message, details }
 */
async function checkQuizEligibility(userId, courseId, lessons) {
  try {
    // Find all lessons with mandatory quizzes
    const lessonsWithQuiz = lessons.filter(lesson => lesson.hasQuiz && lesson.microQuizId);
    
    if (lessonsWithQuiz.length === 0) {
      // No mandatory quizzes, user is eligible
      return {
        eligible: true,
        message: 'No mandatory quizzes in this course',
        details: {
          totalMandatoryQuizzes: 0,
          passedMandatoryQuizzes: 0,
          averageQuizScore: 0
        }
      };
    }

    // Get all quizzes for these lessons
    const quizIds = lessonsWithQuiz.map(lesson => lesson.microQuizId);
    const quizzes = await MicroQuiz.find({ _id: { $in: quizIds } });

    // Filter only mandatory quizzes (requirePassingToProgress: true)
    const mandatoryQuizzes = quizzes.filter(quiz => quiz.requirePassingToProgress);

    if (mandatoryQuizzes.length === 0) {
      // No mandatory quizzes, user is eligible
      return {
        eligible: true,
        message: 'No mandatory quizzes in this course',
        details: {
          totalMandatoryQuizzes: 0,
          passedMandatoryQuizzes: 0,
          averageQuizScore: 0,
          allQuizzes: quizzes.length,
          mandatoryQuizzes: 0
        }
      };
    }

    // Check user's quiz attempts for mandatory quizzes
    const mandatoryQuizIds = mandatoryQuizzes.map(q => q._id);
    const quizAttempts = await MicroQuizAttempt.find({
      userId,
      courseId,
      quizId: { $in: mandatoryQuizIds }
    }).sort({ attemptNumber: -1 });

    // Group attempts by quiz ID and get the best score for each
    const quizResults = {};
    for (const attempt of quizAttempts) {
      const quizIdStr = attempt.quizId.toString();
      if (!quizResults[quizIdStr] || attempt.score > quizResults[quizIdStr].score) {
        quizResults[quizIdStr] = {
          passed: attempt.passed,
          score: attempt.score,
          percentage: attempt.percentage
        };
      }
    }

    // Check if all mandatory quizzes are passed
    const failedQuizzes = [];
    const passedQuizzes = [];
    let totalScore = 0;

    for (const quiz of mandatoryQuizzes) {
      const quizIdStr = quiz._id.toString();
      const result = quizResults[quizIdStr];

      if (!result) {
        failedQuizzes.push({
          quizId: quiz._id,
          lessonId: quiz.lessonId,
          title: quiz.title,
          reason: 'Not attempted'
        });
      } else if (!result.passed) {
        failedQuizzes.push({
          quizId: quiz._id,
          lessonId: quiz.lessonId,
          title: quiz.title,
          reason: 'Not passed',
          score: result.percentage,
          passingScore: quiz.passingScore
        });
      } else {
        passedQuizzes.push({
          quizId: quiz._id,
          score: result.percentage
        });
        totalScore += result.percentage;
      }
    }

    if (failedQuizzes.length > 0) {
      return {
        eligible: false,
        message: 'Not all mandatory quizzes are passed',
        details: {
          totalMandatoryQuizzes: mandatoryQuizzes.length,
          passedMandatoryQuizzes: passedQuizzes.length,
          failedQuizzes,
          averageQuizScore: passedQuizzes.length > 0 
            ? Math.round(totalScore / passedQuizzes.length) 
            : 0
        }
      };
    }

    // All mandatory quizzes passed
    const averageScore = totalScore / passedQuizzes.length;

    return {
      eligible: true,
      message: 'All mandatory quizzes passed',
      details: {
        totalMandatoryQuizzes: mandatoryQuizzes.length,
        passedMandatoryQuizzes: passedQuizzes.length,
        averageQuizScore: Math.round(averageScore),
        allQuizzes: quizzes.length,
        mandatoryQuizzes: mandatoryQuizzes.length
      }
    };

  } catch (error) {
    console.error('Quiz eligibility check error:', error);
    return {
      eligible: false,
      message: 'Error checking quiz eligibility',
      error: error.message
    };
  }
}

/**
 * Get certificate completion metrics for a user
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Object} - Completion metrics
 */
async function getCertificateMetrics(userId, courseId) {
  try {
    const eligibility = await checkCertificateEligibility(userId, courseId);
    
    if (!eligibility.eligible || !eligibility.details) {
      return null;
    }

    return {
      totalLessons: eligibility.details.totalLessons,
      completedLessons: eligibility.details.completedLessons,
      totalQuizzes: eligibility.details.totalQuizzes || 0,
      passedQuizzes: eligibility.details.passedQuizzes || 0,
      averageQuizScore: eligibility.details.averageQuizScore || 0,
      totalTimeSpent: eligibility.details.timeSpent || 0,
      completionPercentage: 100
    };

  } catch (error) {
    console.error('Get certificate metrics error:', error);
    return null;
  }
}

/**
 * Calculate certificate grade based on quiz performance
 * @param {Number} averageQuizScore - Average quiz score percentage
 * @param {Number} completionPercentage - Course completion percentage
 * @returns {Object} - { grade, honors }
 */
function calculateCertificateGrade(averageQuizScore, completionPercentage) {
  // Only calculate grade if quizzes were taken
  if (!averageQuizScore || averageQuizScore === 0) {
    return {
      grade: 'Pass',
      honors: false
    };
  }

  let grade = 'Pass';
  let honors = false;

  if (averageQuizScore >= 95 && completionPercentage === 100) {
    grade = 'A+';
    honors = true;
  } else if (averageQuizScore >= 90) {
    grade = 'A';
  } else if (averageQuizScore >= 85) {
    grade = 'B+';
  } else if (averageQuizScore >= 80) {
    grade = 'B';
  } else if (averageQuizScore >= 75) {
    grade = 'C+';
  } else if (averageQuizScore >= 70) {
    grade = 'C';
  } else {
    grade = 'Pass';
  }

  return { grade, honors };
}

/**
 * Validate certificate generation request
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @returns {Object} - { valid, message, data }
 */
async function validateCertificateGeneration(userId, courseId) {
  const eligibility = await checkCertificateEligibility(userId, courseId);

  if (!eligibility.eligible) {
    return {
      valid: false,
      message: eligibility.message,
      details: eligibility.details
    };
  }

  const metrics = await getCertificateMetrics(userId, courseId);
  if (!metrics) {
    return {
      valid: false,
      message: 'Unable to retrieve completion metrics'
    };
  }

  const { grade, honors } = calculateCertificateGrade(
    metrics.averageQuizScore,
    metrics.completionPercentage
  );

  return {
    valid: true,
    message: 'Certificate generation validated',
    data: {
      metrics,
      grade,
      honors
    }
  };
}

module.exports = {
  checkCertificateEligibility,
  checkQuizEligibility,
  getCertificateMetrics,
  calculateCertificateGrade,
  validateCertificateGeneration
};
