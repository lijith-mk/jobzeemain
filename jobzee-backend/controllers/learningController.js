const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const CourseProgress = require('../models/CourseProgress');
const LearningPath = require('../models/LearningPath');
const LearningPathProgress = require('../models/LearningPathProgress');
const Invoice = require('../models/Invoice');
const CourseInvoice = require('../models/CourseInvoice');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  
  if (!keyId || !keySecret) {
    console.error('Razorpay configuration missing:', {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret
    });
    throw new Error('Razorpay keys are not configured');
  }
  
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Get all courses with filters
exports.getCourses = async (req, res) => {
  try {
    const { category, level, skills, search, page = 1, limit = 12 } = req.query;
    
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (level) query.level = level;
    if (skills) query.skills = { $in: skills.split(',') };
    if (search) query.$text = { $search: search };
    
    const courses = await Course.find(query)
      .select('-modules') // Exclude detailed modules for list view
      .sort({ enrollmentCount: -1, averageRating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Course.countDocuments(query);
    
    // If user is logged in, check enrollment status for each course
    let coursesWithEnrollment = courses;
    if (req.user) {
      const userId = req.user.id;
      const courseIds = courses.map(c => c._id);
      
      // Get all enrollments for this user for these courses
      const enrollments = await CourseProgress.find({
        userId,
        courseId: { $in: courseIds }
      }).select('courseId status progressPercentage');
      
      // Create a map for quick lookup
      const enrollmentMap = {};
      enrollments.forEach(e => {
        enrollmentMap[e.courseId.toString()] = {
          isEnrolled: true,
          status: e.status,
          progress: e.progressPercentage
        };
      });
      
      // Add enrollment info to each course
      coursesWithEnrollment = courses.map(course => ({
        ...course.toObject(),
        isEnrolled: enrollmentMap[course._id.toString()]?.isEnrolled || false,
        enrollmentStatus: enrollmentMap[course._id.toString()]?.status,
        enrollmentProgress: enrollmentMap[course._id.toString()]?.progress
      }));
    }
    
    res.json({
      courses: coursesWithEnrollment,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

// Get single course details
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('relatedMentors', 'name photo role company rating')
      .populate('relatedTests', 'title description duration');
    
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get lessons for this course
    const lessons = await Lesson.find({ 
      courseId: req.params.id,
      isActive: true 
    }).sort({ lessonOrder: 1 }).select('-textContent'); // Exclude full content in list
    
    // If user is logged in, get their progress
    let progress = null;
    let completedLessonIds = [];
    let isLocked = false;
    let pathInfo = null;

    if (req.user) {
      progress = await CourseProgress.findOne({
        userId: req.user.id,
        courseId: req.params.id
      });
      
      if (progress) {
        completedLessonIds = progress.completedLessons.map(l => l.lessonId?.toString());
      }

      // Check if course is part of a learning path and if it's locked
      const LearningPathCourse = require('../models/LearningPathCourse');
      const pathCourse = await LearningPathCourse.findOne({
        courseId: req.params.id,
        isActive: true
      }).populate('learningPathId', 'title');

      if (pathCourse) {
        const pathProgress = await LearningPathProgress.findOne({
          userId: req.user.id,
          pathId: pathCourse.learningPathId
        });

        if (pathProgress) {
          isLocked = !pathProgress.isCourseUnlocked(req.params.id);
          pathInfo = {
            pathId: pathCourse.learningPathId._id,
            pathTitle: pathCourse.learningPathId.title,
            order: pathCourse.order,
            isRequired: pathCourse.isRequired
          };
        }
      }
    }
    
    // Add completion status to lessons
    const lessonsWithProgress = lessons.map(lesson => ({
      ...lesson.toObject(),
      isCompleted: completedLessonIds.includes(lesson._id.toString())
    }));
    
    res.json({ 
      course, 
      lessons: lessonsWithProgress, 
      progress,
      isLocked,
      pathInfo
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
};

// Enroll in a course
exports.enrollCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, paymentId } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if it's a paid course
    if (course.isPaid && !paymentId) {
      return res.status(402).json({ 
        message: 'This is a paid course. Payment is required.',
        requiresPayment: true,
        price: course.discountPrice || course.price,
        originalPrice: course.price,
        currency: course.currency
      });
    }

    // Check if course is part of a learning path and if it's locked
    const LearningPathCourse = require('../models/LearningPathCourse');
    const pathCourse = await LearningPathCourse.findOne({
      courseId,
      isActive: true
    }).populate('learningPathId', 'title');

    if (pathCourse) {
      const pathProgress = await LearningPathProgress.findOne({
        userId,
        pathId: pathCourse.learningPathId
      });

      if (pathProgress) {
        const isLocked = !pathProgress.isCourseUnlocked(courseId);
        
        if (isLocked) {
          // Find which courses need to be completed first
          const previousCourse = await LearningPathCourse.findOne({
            learningPathId: pathCourse.learningPathId,
            order: pathCourse.order - 1,
            isActive: true
          }).populate('courseId', 'title');

          return res.status(403).json({ 
            message: 'This course is locked. Complete the previous courses in the learning path first.',
            isLocked: true,
            pathTitle: pathCourse.learningPathId.title,
            prerequisite: previousCourse?.courseId?.title,
            orderInPath: pathCourse.order
          });
        }
      }
    }
    
    // Check if already enrolled
    const existingProgress = await CourseProgress.findOne({ userId, courseId });
    if (existingProgress) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create progress record
    const progress = new CourseProgress({
      userId,
      courseId,
      status: 'enrolled',
      isPaid: course.isPaid,
      paymentAmount: course.isPaid ? (course.discountPrice || course.price) : 0,
      paymentCurrency: course.currency,
      paymentId: paymentId || null,
      paymentStatus: course.isPaid ? 'completed' : 'completed',
      paidAt: course.isPaid ? new Date() : null
    });
    
    await progress.save();
    
    // Update enrollment count
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
    
    res.json({ message: 'Successfully enrolled in course', progress });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
};

// Update course progress
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, lessonId, timeSpent, forceComplete } = req.body;
    
    let progress = await CourseProgress.findOne({ userId, courseId });
    
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Get lesson details to check for quiz
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // ADVANCED LESSON COMPLETION LOGIC
    const alreadyCompleted = progress.completedLessons.some(
      l => l.lessonId?.toString() === lessonId
    );

    let canComplete = false;
    let completionBlocked = false;
    let blockReason = '';

    if (!alreadyCompleted) {
      // Check if lesson has a quiz
      const MicroQuiz = require('../models/MicroQuiz');
      const quiz = await MicroQuiz.findOne({ lessonId, isActive: true });

      if (quiz && quiz.requirePassingToProgress) {
        // RULE 2: Quiz exists and is mandatory → must pass quiz to complete lesson
        const MicroQuizAttempt = require('../models/MicroQuizAttempt');
        const passingAttempt = await MicroQuizAttempt.findOne({
          userId,
          quizId: quiz._id,
          passed: true
        }).sort({ attemptedAt: -1 });

        if (passingAttempt) {
          canComplete = true;
        } else {
          completionBlocked = true;
          blockReason = 'You must pass the lesson quiz to mark this lesson as complete';
        }
      } else {
        // RULE 1: No quiz OR quiz is optional → can complete after engagement
        // RULE 3: Quiz exists but is optional → completion independent of quiz
        
        // Check minimum engagement time (at least 30% of lesson duration or user force complete)
        const minEngagementTime = lesson.duration * 0.3; // 30% of duration in minutes
        const totalTimeSpent = (progress.timeSpent || 0) + (timeSpent || 0);
        
        // Allow completion if: sufficient time spent OR user explicitly marks complete (forceComplete)
        if (totalTimeSpent >= minEngagementTime || forceComplete) {
          canComplete = true;
        } else {
          completionBlocked = true;
          blockReason = `Please spend at least ${Math.ceil(minEngagementTime)} minutes on this lesson or click "Mark as Complete" to override`;
        }
      }

      // Mark lesson as completed if allowed
      if (canComplete) {
        progress.completedLessons.push({ 
          lessonId, 
          completedAt: new Date(),
          timeSpent: timeSpent || 0
        });
      }
    } else if (timeSpent) {
      // Update time spent for already completed lesson
      const lessonProgress = progress.completedLessons.find(
        l => l.lessonId?.toString() === lessonId
      );
      if (lessonProgress) {
        lessonProgress.timeSpent = (lessonProgress.timeSpent || 0) + timeSpent;
      }
    }
    
    // Update status
    if (progress.status === 'enrolled') {
      progress.status = 'in-progress';
      progress.startedAt = new Date();
    }
    
    // Update time spent
    if (timeSpent) {
      progress.timeSpent += timeSpent;
    }
    
    // Calculate progress percentage
    const totalLessons = await Lesson.countDocuments({ courseId, isActive: true });
    progress.progressPercentage = totalLessons > 0 
      ? Math.round((progress.completedLessons.length / totalLessons) * 100) 
      : 0;
    
    // Check if completed
    if (progress.progressPercentage === 100 && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();

      // Check if this course is part of any learning path and unlock next course
      const LearningPathCourse = require('../models/LearningPathCourse');
      const pathCourse = await LearningPathCourse.findOne({
        courseId,
        isActive: true
      });

      if (pathCourse) {
        // Update learning path progress
        const pathProgress = await LearningPathProgress.findOne({
          userId,
          pathId: pathCourse.learningPathId
        });

        if (pathProgress) {
          // Mark course as completed in path progress
          const alreadyCompletedInPath = pathProgress.completedCourses.some(
            cc => cc.courseId.toString() === courseId
          );

          if (!alreadyCompletedInPath) {
            pathProgress.completedCourses.push({
              courseId,
              completedAt: new Date()
            });
          }

          // Get next course in sequence
          const nextCourse = await LearningPathCourse.findOne({
            learningPathId: pathCourse.learningPathId,
            order: pathCourse.order + 1,
            isActive: true
          });

          // Unlock next course if exists
          if (nextCourse) {
            await pathProgress.unlockNextCourse(nextCourse.courseId);
            pathProgress.currentCourseIndex = nextCourse.order - 1;
          }

          // Update path progress percentage
          const totalPathCourses = await LearningPathCourse.countDocuments({
            learningPathId: pathCourse.learningPathId,
            isActive: true
          });
          
          pathProgress.progressPercentage = totalPathCourses > 0
            ? Math.round((pathProgress.completedCourses.length / totalPathCourses) * 100)
            : 0;

          // Check if path is completed
          if (pathProgress.progressPercentage === 100) {
            pathProgress.status = 'completed';
            pathProgress.completedAt = new Date();
          } else if (pathProgress.status === 'enrolled') {
            pathProgress.status = 'in-progress';
            pathProgress.startedAt = new Date();
          }

          await pathProgress.save();
        }
      }
    }
    
    progress.currentLessonId = lessonId;
    progress.lastAccessedAt = new Date();
    
    await progress.save();
    
    res.json({ 
      message: canComplete && !alreadyCompleted 
        ? 'Progress updated and lesson marked complete' 
        : 'Progress updated',
      progress,
      lessonCompleted: canComplete && !alreadyCompleted,
      completionBlocked,
      blockReason: completionBlocked ? blockReason : undefined
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
};

// Get user's enrolled courses
exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    const progress = await CourseProgress.find(query)
      .populate('courseId')
      .sort({ lastAccessedAt: -1 });
    
    res.json({ progress });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses', error: error.message });
  }
};

// Get learning paths
exports.getLearningPaths = async (req, res) => {
  try {
    const { targetRole, level, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (targetRole) query.targetRole = new RegExp(targetRole, 'i');
    if (level) query.level = level;
    
    const paths = await LearningPath.find(query)
      .populate('courses.courseId', 'title thumbnail duration level')
      .sort({ enrollmentCount: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await LearningPath.countDocuments(query);
    
    res.json({
      paths,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({ message: 'Error fetching learning paths', error: error.message });
  }
};

// Enroll in learning path
exports.enrollLearningPath = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.body;
    
    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    
    const existingProgress = await LearningPathProgress.findOne({ userId, pathId });
    if (existingProgress) {
      return res.status(400).json({ message: 'Already enrolled in this learning path' });
    }

    // Get the first course in the learning path
    const LearningPathCourse = require('../models/LearningPathCourse');
    const firstCourse = await LearningPathCourse.findOne({
      learningPathId: pathId,
      isActive: true
    }).sort({ order: 1 });

    // Create progress with first course unlocked
    const progress = new LearningPathProgress({
      userId,
      pathId,
      status: 'enrolled',
      unlockedCourses: firstCourse ? [{
        courseId: firstCourse.courseId,
        unlockedAt: new Date()
      }] : []
    });
    
    await progress.save();
    await LearningPath.findByIdAndUpdate(pathId, { $inc: { enrollmentCount: 1 } });
    
    res.json({ 
      message: 'Successfully enrolled in learning path', 
      progress,
      unlockedCourseId: firstCourse?.courseId
    });
  } catch (error) {
    console.error('Enroll path error:', error);
    res.status(500).json({ message: 'Error enrolling in learning path', error: error.message });
  }
};

// Get recommended courses based on user profile
exports.getRecommendedCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get courses matching user's skills or preferred fields
    const userSkills = user.skills || [];
    const preferredFields = user.preferredFields || [];
    
    const recommendedCourses = await Course.find({
      isActive: true,
      $or: [
        { skills: { $in: userSkills } },
        { category: { $in: preferredFields } }
      ]
    })
    .limit(6)
    .select('-modules');
    
    // Check enrollment status for each course
    const courseIds = recommendedCourses.map(c => c._id);
    const enrollments = await CourseProgress.find({
      userId,
      courseId: { $in: courseIds }
    }).select('courseId status progressPercentage');
    
    // Create a map for quick lookup
    const enrollmentMap = {};
    enrollments.forEach(e => {
      enrollmentMap[e.courseId.toString()] = {
        isEnrolled: true,
        status: e.status,
        progress: e.progressPercentage
      };
    });
    
    // Add enrollment info to each course
    const coursesWithEnrollment = recommendedCourses.map(course => ({
      ...course.toObject(),
      isEnrolled: enrollmentMap[course._id.toString()]?.isEnrolled || false,
      enrollmentStatus: enrollmentMap[course._id.toString()]?.status,
      enrollmentProgress: enrollmentMap[course._id.toString()]?.progress
    }));
    
    res.json({ courses: coursesWithEnrollment });
  } catch (error) {
    console.error('Get recommended courses error:', error);
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
};

// Auto-recommend learning paths based on job role, assessments, and skill gaps
exports.getRecommendedLearningPaths = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const Test = require('../models/Test');
    const TestResult = require('../models/TestResult');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's job role
    const targetJobRole = user.desiredJobRole || user.currentJobRole || req.query.jobRole;
    
    // Get user's current skills
    const userSkills = user.skills || [];
    
    // Get user's test results to identify skill gaps
    const testResults = await TestResult.find({ userId })
      .populate('testId', 'title skills requiredSkills')
      .sort({ completedAt: -1 })
      .limit(5);

    // Identify skill gaps from test results
    const skillGaps = [];
    const weakAreas = [];
    
    testResults.forEach(result => {
      if (result.percentage < 70) { // Below 70% indicates skill gap
        if (result.testId.skills) {
          skillGaps.push(...result.testId.skills);
        }
        if (result.testId.requiredSkills) {
          skillGaps.push(...result.testId.requiredSkills);
        }
        weakAreas.push({
          testTitle: result.testId.title,
          score: result.percentage,
          skills: result.testId.skills || []
        });
      }
    });

    // Remove duplicates
    const uniqueSkillGaps = [...new Set(skillGaps)];

    // Build recommendation query
    const query = {
      isActive: true,
      status: 'published'
    };

    // Priority 1: Match job role
    const jobRoleQuery = { ...query };
    if (targetJobRole) {
      jobRoleQuery.targetJobRole = new RegExp(targetJobRole, 'i');
    }

    const jobRoleMatches = await LearningPath.find(jobRoleQuery)
      .limit(3)
      .sort({ enrollmentCount: -1 });

    // Priority 2: Match skill gaps
    const skillGapQuery = { 
      ...query,
      skills: { $in: uniqueSkillGaps }
    };

    const skillGapMatches = await LearningPath.find(skillGapQuery)
      .limit(3)
      .sort({ enrollmentCount: -1 });

    // Priority 3: Match user's existing skills (for advancement)
    const skillAdvancementQuery = {
      ...query,
      skills: { $in: userSkills }
    };

    const skillAdvancementMatches = await LearningPath.find(skillAdvancementQuery)
      .limit(2)
      .sort({ level: -1, enrollmentCount: -1 });

    // Combine and deduplicate
    const allRecommendations = [
      ...jobRoleMatches,
      ...skillGapMatches,
      ...skillAdvancementMatches
    ];

    const uniqueRecommendations = Array.from(
      new Map(allRecommendations.map(path => [path._id.toString(), path])).values()
    ).slice(0, 6);

    // Check which paths user is already enrolled in
    const enrolledPaths = await LearningPathProgress.find({
      userId,
      pathId: { $in: uniqueRecommendations.map(p => p._id) }
    });

    const enrolledPathIds = enrolledPaths.map(ep => ep.pathId.toString());

    // Add recommendation reasons and enrollment status
    const recommendationsWithReason = uniqueRecommendations.map(path => {
      const reasons = [];
      
      if (targetJobRole && path.targetJobRole && 
          path.targetJobRole.toLowerCase().includes(targetJobRole.toLowerCase())) {
        reasons.push(`Matches your target role: ${targetJobRole}`);
      }
      
      const pathSkillGaps = path.skills.filter(skill => 
        uniqueSkillGaps.includes(skill)
      );
      if (pathSkillGaps.length > 0) {
        reasons.push(`Addresses skill gaps: ${pathSkillGaps.slice(0, 3).join(', ')}`);
      }
      
      const pathUserSkills = path.skills.filter(skill => 
        userSkills.includes(skill)
      );
      if (pathUserSkills.length > 0) {
        reasons.push(`Builds on your skills: ${pathUserSkills.slice(0, 3).join(', ')}`);
      }

      return {
        ...path.toObject(),
        recommendationReasons: reasons,
        isEnrolled: enrolledPathIds.includes(path._id.toString()),
        matchScore: reasons.length
      };
    });

    // Sort by match score
    recommendationsWithReason.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      recommendations: recommendationsWithReason,
      userProfile: {
        targetJobRole,
        skills: userSkills,
        skillGaps: uniqueSkillGaps,
        weakAreas
      },
      total: recommendationsWithReason.length
    });
  } catch (error) {
    console.error('Get recommended learning paths error:', error);
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
};

// Submit course rating
exports.rateCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, rating, review } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    progress.rating = rating;
    progress.review = review;
    await progress.save();
    
    // Update course average rating
    const allRatings = await CourseProgress.find({ courseId, rating: { $exists: true } });
    const avgRating = allRatings.reduce((sum, p) => sum + p.rating, 0) / allRatings.length;
    
    await Course.findByIdAndUpdate(courseId, {
      averageRating: avgRating,
      totalReviews: allRatings.length
    });
    
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate course error:', error);
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
};

// Get individual lesson details
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('createdBy', 'name');
    
    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user has access (enrolled in course)
    if (req.user) {
      const progress = await CourseProgress.findOne({
        userId: req.user.id,
        courseId: lesson.courseId
      });
      
      if (!progress) {
        // Check if course is locked in a learning path
        const LearningPathCourse = require('../models/LearningPathCourse');
        const pathCourse = await LearningPathCourse.findOne({
          courseId: lesson.courseId,
          isActive: true
        }).populate('learningPathId', 'title');

        if (pathCourse) {
          const pathProgress = await LearningPathProgress.findOne({
            userId: req.user.id,
            pathId: pathCourse.learningPathId
          });

          if (pathProgress && !pathProgress.isCourseUnlocked(lesson.courseId)) {
            return res.status(403).json({ 
              message: 'This course is locked. Complete previous courses in the learning path first.',
              isLocked: true,
              pathTitle: pathCourse.learningPathId.title
            });
          }
        }

        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
      
      // Check if lesson is completed
      const isCompleted = progress.completedLessons.some(
        l => l.lessonId?.toString() === lesson._id.toString()
      );
      
      res.json({ lesson, isCompleted });
    } else {
      res.json({ lesson, isCompleted: false });
    }
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Error fetching lesson', error: error.message });
  }
};

// Get learning paths by job role (with user's selected job role)
exports.getLearningPathsByJobRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use job role from query param or user's selected role
    const targetJobRole = req.query.jobRole || user.desiredJobRole || user.currentJobRole;
    
    if (!targetJobRole) {
      return res.status(400).json({ 
        message: 'No job role specified. Please provide a job role or update your profile.' 
      });
    }

    const paths = await LearningPath.find({
      isActive: true,
      targetJobRole: new RegExp(targetJobRole, 'i')
    }).populate('courses.courseId', 'title thumbnail duration level');

    // Check which paths user is already enrolled in
    const enrolledPaths = await LearningPathProgress.find({ 
      userId,
      pathId: { $in: paths.map(p => p._id) }
    });

    const enrolledPathIds = enrolledPaths.map(ep => ep.pathId.toString());
    
    const pathsWithEnrollment = paths.map(path => ({
      ...path.toObject(),
      isEnrolled: enrolledPathIds.includes(path._id.toString())
    }));

    res.json({ 
      paths: pathsWithEnrollment,
      jobRole: targetJobRole,
      total: pathsWithEnrollment.length
    });
  } catch (error) {
    console.error('Get learning paths by job role error:', error);
    res.status(500).json({ message: 'Error fetching learning paths', error: error.message });
  }
};

// Check if a course is unlocked in a learning path
exports.checkCourseAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pathId, courseId } = req.params;

    const progress = await LearningPathProgress.findOne({ userId, pathId });
    
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'Not enrolled in this learning path',
        isUnlocked: false
      });
    }

    const isUnlocked = progress.isCourseUnlocked(courseId);

    res.json({
      success: true,
      isUnlocked,
      unlockedCourses: progress.unlockedCourses.map(uc => uc.courseId),
      currentCourseIndex: progress.currentCourseIndex
    });
  } catch (error) {
    console.error('Check course access error:', error);
    res.status(500).json({ message: 'Error checking course access', error: error.message });
  }
};

// Unlock next course when current course is completed
exports.unlockNextCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pathId, courseId } = req.body;

    const LearningPathCourse = require('../models/LearningPathCourse');

    // Get user's progress
    const progress = await LearningPathProgress.findOne({ userId, pathId });
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this learning path' });
    }

    // Check if course is completed
    const isCourseCompleted = progress.completedCourses.some(
      cc => cc.courseId.toString() === courseId
    );

    if (!isCourseCompleted) {
      return res.status(400).json({ 
        message: 'Course must be completed before unlocking the next one' 
      });
    }

    // Get current course mapping
    const currentCourse = await LearningPathCourse.findOne({
      learningPathId: pathId,
      courseId,
      isActive: true
    });

    if (!currentCourse) {
      return res.status(404).json({ message: 'Course not found in learning path' });
    }

    // Get next course
    const nextCourse = await LearningPathCourse.findOne({
      learningPathId: pathId,
      order: currentCourse.order + 1,
      isActive: true
    });

    if (!nextCourse) {
      return res.json({ 
        message: 'No more courses to unlock. Learning path completed!',
        hasNextCourse: false
      });
    }

    // Unlock next course
    await progress.unlockNextCourse(nextCourse.courseId);
    progress.currentCourseIndex = nextCourse.order - 1;
    await progress.save();

    res.json({
      success: true,
      message: 'Next course unlocked successfully',
      nextCourseId: nextCourse.courseId,
      hasNextCourse: true
    });
  } catch (error) {
    console.error('Unlock next course error:', error);
    res.status(500).json({ message: 'Error unlocking next course', error: error.message });
  }
};

// Get user's learning path progress with locked/unlocked courses
exports.getMyLearningPathProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const LearningPathCourse = require('../models/LearningPathCourse');

    const progress = await LearningPathProgress.findOne({ userId, pathId })
      .populate('pathId', 'title description targetJobRole')
      .populate('unlockedCourses.courseId', 'title thumbnail duration level')
      .populate('completedCourses.courseId', 'title thumbnail duration level');

    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this learning path' });
    }

    // Get all courses in the path
    const allCourses = await LearningPathCourse.find({
      learningPathId: pathId,
      isActive: true
    })
      .sort({ order: 1 })
      .populate('courseId', 'title thumbnail duration level');

    // Mark each course as locked/unlocked/completed
    const coursesWithStatus = allCourses.map(pathCourse => {
      const courseId = pathCourse.courseId._id.toString();
      const isUnlocked = progress.isCourseUnlocked(courseId);
      const isCompleted = progress.completedCourses.some(
        cc => cc.courseId.toString() === courseId
      );

      return {
        ...pathCourse.toObject(),
        isUnlocked,
        isCompleted,
        status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'
      };
    });

    res.json({
      progress: progress.toObject(),
      courses: coursesWithStatus,
      totalCourses: allCourses.length,
      completedCount: progress.completedCourses.length,
      unlockedCount: progress.unlockedCourses.length
    });
  } catch (error) {
    console.error('Get learning path progress error:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// ============================================
// SKILL GAP DETECTION ENDPOINTS (PROMPT 7)
// ============================================

const skillGapService = require('../services/skillGapDetection');

/**
 * Get comprehensive skill gap analysis for the authenticated user
 * Analyzes test results and identifies weak areas
 */
exports.getSkillGapAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 10, 
      weakThreshold = 70,
      includeRecommendations = true 
    } = req.query;

    const analysis = await skillGapService.analyzeSkillGaps(userId, {
      limit: parseInt(limit),
      weakThreshold: parseInt(weakThreshold)
    });

    if (!analysis.hasData) {
      return res.status(200).json({
        message: 'No test data available for skill gap analysis. Take some tests to get personalized insights!',
        skillGaps: [],
        recommendations: []
      });
    }

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error analyzing skill gaps', 
      error: error.message 
    });
  }
};

/**
 * Get learning recommendations based on identified skill gaps
 */
exports.getSkillGapRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // First get skill gaps
    const analysis = await skillGapService.analyzeSkillGaps(userId, {
      limit: 15,
      weakThreshold: 70
    });

    if (!analysis.hasData || analysis.skillGaps.length === 0) {
      return res.status(200).json({
        message: 'No skill gaps identified. Keep up the great work!',
        courses: [],
        learningPaths: []
      });
    }

    // Get recommendations
    const recommendations = await skillGapService.getRecommendationsForGaps(
      userId,
      analysis.skillGaps,
      analysis.strongSkills
    );

    res.json({
      success: true,
      skillGaps: analysis.skillGaps.slice(0, 5), // Top 5 gaps
      ...recommendations,
      message: `Found ${recommendations.totalRecommendations} learning resources to address your skill gaps`
    });
  } catch (error) {
    console.error('Skill gap recommendations error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching recommendations', 
      error: error.message 
    });
  }
};

/**
 * Generate comprehensive skill gap report
 * Includes analysis, recommendations, and action plan
 */
exports.generateSkillGapReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const report = await skillGapService.generateSkillGapReport(userId);

    res.json({
      success: true,
      report,
      message: 'Skill gap report generated successfully'
    });
  } catch (error) {
    console.error('Generate skill gap report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating skill gap report', 
      error: error.message 
    });
  }
};

/**
 * Get question-level analysis for a specific test
 * Helps identify exactly which questions/topics are weak
 */
exports.getQuestionLevelAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ 
        success: false,
        message: 'Test ID is required' 
      });
    }

    const analysis = await skillGapService.analyzeQuestionLevelSkills(userId, testId);

    if (!analysis.analysis && analysis.message) {
      return res.status(404).json({
        success: false,
        message: analysis.message
      });
    }

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('Question-level analysis error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error analyzing question-level performance', 
      error: error.message 
    });
  }
};

/**
 * Get skill gap dashboard data
 * Summary view for displaying on user dashboard
 */
exports.getSkillGapDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get quick analysis
    const analysis = await skillGapService.analyzeSkillGaps(userId, {
      limit: 10,
      weakThreshold: 70
    });

    if (!analysis.hasData) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Take tests to unlock skill gap insights',
        dashboard: {
          totalTests: 0,
          criticalGaps: 0,
          recommendations: 0
        }
      });
    }

    // Get top recommendations
    const recommendations = await skillGapService.getRecommendationsForGaps(
      userId,
      analysis.skillGaps.slice(0, 5),
      analysis.strongSkills
    );

    // Build dashboard summary
    const dashboard = {
      summary: analysis.summary,
      topWeakSkills: analysis.skillGaps.slice(0, 5),
      topStrengths: analysis.strongSkills.slice(0, 3),
      criticalGapsCount: analysis.skillGaps.filter(g => g.gapSeverity === 'critical').length,
      highGapsCount: analysis.skillGaps.filter(g => g.gapSeverity === 'high').length,
      recommendationsCount: recommendations.totalRecommendations,
      quickActions: [
        {
          action: 'View Full Analysis',
          endpoint: '/api/learning/skill-gaps/analysis',
          description: 'See detailed breakdown of all skill gaps'
        },
        {
          action: 'Get Recommendations',
          endpoint: '/api/learning/skill-gaps/recommendations',
          description: 'Find courses to address your weak areas'
        },
        {
          action: 'Generate Report',
          endpoint: '/api/learning/skill-gaps/report',
          description: 'Download comprehensive skill gap report'
        }
      ]
    };

    res.json({
      success: true,
      hasData: true,
      dashboard
    });
  } catch (error) {
    console.error('Skill gap dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error loading skill gap dashboard', 
      error: error.message 
    });
  }
};

// Create Razorpay order for course payment
exports.createCoursePaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Validate course exists and is paid
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPaid) {
      return res.status(400).json({ message: 'This course is free' });
    }

    // Check if already enrolled
    const existingProgress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });

    if (existingProgress) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Calculate amount (use discount price if available and valid)
    let amount = course.price;
    if (course.discountPrice && course.discountEndDate && new Date() <= course.discountEndDate) {
      amount = course.discountPrice;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid course price' });
    }

    // Create Razorpay order
    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (error) {
      console.error('Razorpay initialization error:', error.message);
      return res.status(500).json({ 
        message: 'Payment gateway configuration error. Please contact support.',
        error: error.message 
      });
    }

    // Generate short receipt (max 40 chars for Razorpay)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const courseIdShort = courseId.toString().slice(-8); // Last 8 chars
    const receipt = `CRS${courseIdShort}${timestamp}`; // e.g., CRS9fb6806412345678 (max 19 chars)

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise and round
      currency: course.currency || 'INR',
      receipt: receipt,
      notes: {
        courseId: String(courseId),
        courseName: course.title,
        userId: String(userId)
      }
    });

    res.status(200).json({
      orderId: order.id,
      amount: amount,
      currency: course.currency || 'INR',
      courseName: course.title,
      razorpayKey: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating course payment order:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error creating payment order';
    if (error.message?.includes('Razorpay')) {
      errorMessage = 'Payment gateway configuration error';
    } else if (error.statusCode === 400) {
      errorMessage = error.error?.description || 'Invalid payment request';
    }
    
    res.status(500).json({
      message: errorMessage,
      error: error.message,
      details: error.error?.description
    });
  }
};

// Verify course payment and enroll
exports.verifyCoursePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      courseId
    } = req.body;

    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Calculate amount paid
    let amount = course.price;
    let discountAmount = 0;
    if (course.discountPrice && course.discountEndDate && new Date() <= course.discountEndDate) {
      discountAmount = course.price - course.discountPrice;
      amount = course.discountPrice;
    }

    // Get user details for invoice
    const user = await User.findById(userId).select('name email phone');

    // Create enrollment with payment details
    const courseProgress = new CourseProgress({
      userId: userId,
      courseId: courseId,
      isPaid: true,
      paymentAmount: amount,
      paymentCurrency: course.currency || 'INR',
      paymentId: razorpayPaymentId,
      paymentStatus: 'completed',
      paidAt: new Date()
    });

    await courseProgress.save();

    // Increment enrollment count
    course.enrolledUsers += 1;
    await course.save();

    // Generate invoice
    const invoice = new CourseInvoice({
      userId: userId,
      courseId: courseId,
      courseName: course.title,
      paymentId: razorpayPaymentId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      originalPrice: course.price,
      discountAmount: discountAmount,
      subtotal: amount,
      taxPercentage: 18,
      currency: course.currency || 'INR',
      billingDetails: {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      },
      paymentStatus: 'paid',
      status: 'issued'
    });

    await invoice.save();

    res.status(200).json({
      message: 'Payment verified and enrolled successfully',
      courseProgress,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        totalAmount: invoice.totalAmount
      }
    });

  } catch (error) {
    console.error('Error verifying course payment:', error);
    res.status(500).json({
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Get user's course invoices
exports.getMyCourseInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const invoices = await CourseInvoice.find({ userId })
      .populate('courseId', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await CourseInvoice.countDocuments({ userId });

    res.status(200).json({
      invoices,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// Get specific invoice by ID
exports.getCourseInvoiceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;

    const invoice = await CourseInvoice.findOne({
      _id: invoiceId,
      userId: userId
    })
      .populate('courseId', 'title thumbnail instructor')
      .populate('userId', 'name email phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// Get invoice by invoice number
exports.getCourseInvoiceByNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceNumber } = req.params;

    const invoice = await CourseInvoice.findOne({
      invoiceNumber: invoiceNumber,
      userId: userId
    })
      .populate('courseId', 'title thumbnail instructor')
      .populate('userId', 'name email phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

