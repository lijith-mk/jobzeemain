const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const CourseProgress = require('../models/CourseProgress');
const LearningPath = require('../models/LearningPath');
const LearningPathProgress = require('../models/LearningPathProgress');

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
    
    res.json({
      courses,
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
    const { courseId } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
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
      status: 'enrolled'
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
    const { courseId, lessonId, timeSpent } = req.body;
    
    let progress = await CourseProgress.findOne({ userId, courseId });
    
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    // Check if lesson already completed
    const alreadyCompleted = progress.completedLessons.some(
      l => l.lessonId?.toString() === lessonId
    );
    
    if (!alreadyCompleted) {
      progress.completedLessons.push({ 
        lessonId, 
        completedAt: new Date(),
        timeSpent: timeSpent || 0
      });
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
    
    res.json({ message: 'Progress updated', progress });
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
    
    res.json({ courses: recommendedCourses });
  } catch (error) {
    console.error('Get recommended courses error:', error);
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
