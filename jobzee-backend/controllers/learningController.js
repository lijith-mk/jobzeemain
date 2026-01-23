const Course = require('../models/Course');
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
      .populate('relatedMentors', 'name photo role company rating')
      .populate('relatedTests', 'title description duration');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // If user is logged in, get their progress
    let progress = null;
    if (req.user) {
      progress = await CourseProgress.findOne({
        userId: req.user.id,
        courseId: req.params.id
      });
    }
    
    res.json({ course, progress });
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
    const { courseId, moduleIndex, lessonIndex, timeSpent } = req.body;
    
    let progress = await CourseProgress.findOne({ userId, courseId });
    
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    // Check if lesson already completed
    const alreadyCompleted = progress.completedLessons.some(
      l => l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex
    );
    
    if (!alreadyCompleted) {
      progress.completedLessons.push({ moduleIndex, lessonIndex });
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
    const course = await Course.findById(courseId);
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    progress.progressPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
    
    // Check if completed
    if (progress.progressPercentage === 100 && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();
    }
    
    progress.currentModule = moduleIndex;
    progress.currentLesson = lessonIndex;
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
    
    const progress = new LearningPathProgress({
      userId,
      pathId,
      status: 'enrolled'
    });
    
    await progress.save();
    await LearningPath.findByIdAndUpdate(pathId, { $inc: { enrollmentCount: 1 } });
    
    res.json({ message: 'Successfully enrolled in learning path', progress });
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
