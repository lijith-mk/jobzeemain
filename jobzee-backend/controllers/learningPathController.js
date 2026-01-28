const LearningPath = require('../models/LearningPath');
const LearningPathCourse = require('../models/LearningPathCourse');
const Course = require('../models/Course');
const LearningPathProgress = require('../models/LearningPathProgress');

// ==================== LEARNING PATH CRUD ====================

// Create a new learning path
exports.createLearningPath = async (req, res) => {
  try {
    const {
      name,
      title,
      description,
      thumbnail,
      targetJobRole,
      level,
      estimatedDuration,
      skills,
      prerequisites,
      outcomes,
      careerOutlook,
      salaryRange,
      tags,
      category
    } = req.body;

    const learningPath = new LearningPath({
      name: name || title,
      title,
      description,
      thumbnail,
      targetJobRole,
      targetRole: targetJobRole, // Sync both fields
      level,
      estimatedDuration,
      skills,
      prerequisites,
      outcomes,
      careerOutlook,
      salaryRange,
      tags,
      category,
      status: 'draft', // Start as draft
      createdBy: req.admin?._id || req.user?._id
    });

    await learningPath.save();

    res.status(201).json({
      success: true,
      message: 'Learning path created successfully',
      data: learningPath
    });
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create learning path',
      error: error.message
    });
  }
};

// Get all learning paths (with filters)
exports.getAllLearningPaths = async (req, res) => {
  try {
    const { 
      targetJobRole, 
      level, 
      category, 
      isActive, 
      status,
      search 
    } = req.query;

    const query = {};

    if (targetJobRole) query.targetJobRole = targetJobRole;
    if (level) query.level = level;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (status) query.status = status;
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const learningPaths = await LearningPath.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get course counts for each path
    const pathsWithCounts = await Promise.all(
      learningPaths.map(async (path) => {
        const courseCount = await LearningPathCourse.countDocuments({
          learningPathId: path._id,
          isActive: true
        });

        return {
          ...path.toObject(),
          totalCourses: courseCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: pathsWithCounts.length,
      data: pathsWithCounts
    });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths',
      error: error.message
    });
  }
};

// Get single learning path by ID (with courses)
exports.getLearningPathById = async (req, res) => {
  try {
    const { id } = req.params;

    const learningPath = await LearningPath.findById(id)
      .populate('createdBy', 'name email');

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    // Get all courses in this path (ordered)
    const pathCourses = await LearningPathCourse.getPathCourses(id);

    // If user is logged in, get their progress
    let userProgress = null;
    if (req.user) {
      userProgress = await LearningPathProgress.findOne({
        userId: req.user._id,
        learningPathId: id
      }).populate('completedCourses.courseId', 'title');
    }

    res.status(200).json({
      success: true,
      data: {
        ...learningPath.toObject(),
        courses: pathCourses,
        userProgress
      }
    });
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning path',
      error: error.message
    });
  }
};

// Update learning path
exports.updateLearningPath = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Sync targetJobRole and targetRole
    if (updateData.targetJobRole) {
      updateData.targetRole = updateData.targetJobRole;
    }

    const learningPath = await LearningPath.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Learning path updated successfully',
      data: learningPath
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update learning path',
      error: error.message
    });
  }
};

// Delete learning path
exports.deleteLearningPath = async (req, res) => {
  try {
    const { id } = req.params;

    const learningPath = await LearningPath.findByIdAndDelete(id);

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    // Optionally delete all associated LearningPathCourse mappings
    await LearningPathCourse.deleteMany({ learningPathId: id });

    res.status(200).json({
      success: true,
      message: 'Learning path deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete learning path',
      error: error.message
    });
  }
};

// Publish/Unpublish learning path
exports.togglePathStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'draft', 'published', 'archived'

    const learningPath = await LearningPath.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Learning path ${status} successfully`,
      data: learningPath
    });
  } catch (error) {
    console.error('Error toggling path status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update path status',
      error: error.message
    });
  }
};

// ==================== COURSE MAPPING ====================

// Add course to learning path
exports.addCourseToPath = async (req, res) => {
  try {
    const { pathId } = req.params;
    const {
      courseId,
      order,
      isRequired,
      estimatedDuration,
      prerequisiteCourses,
      description,
      learningObjectives
    } = req.body;

    // Validate learning path exists
    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course already exists in this path
    const existingMapping = await LearningPathCourse.findOne({
      learningPathId: pathId,
      courseId
    });

    if (existingMapping) {
      return res.status(400).json({
        success: false,
        message: 'Course already exists in this learning path'
      });
    }

    // Create mapping
    const pathCourse = new LearningPathCourse({
      learningPathId: pathId,
      courseId,
      order,
      isRequired: isRequired !== undefined ? isRequired : true,
      estimatedDuration,
      prerequisiteCourses,
      description,
      learningObjectives,
      addedBy: req.admin?._id || req.user?._id
    });

    await pathCourse.save();

    // Update course's relatedLearningPaths
    if (!course.relatedLearningPaths.includes(pathId)) {
      course.relatedLearningPaths.push(pathId);
      await course.save();
    }

    // Update path's totalLessons count
    const totalCourses = await LearningPathCourse.countDocuments({
      learningPathId: pathId,
      isActive: true
    });
    learningPath.totalLessons = totalCourses;
    await learningPath.save();

    res.status(201).json({
      success: true,
      message: 'Course added to learning path successfully',
      data: await pathCourse.populate('courseId')
    });
  } catch (error) {
    console.error('Error adding course to path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to learning path',
      error: error.message
    });
  }
};

// Remove course from learning path
exports.removeCourseFromPath = async (req, res) => {
  try {
    const { pathId, courseId } = req.params;

    const mapping = await LearningPathCourse.findOneAndDelete({
      learningPathId: pathId,
      courseId
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Course mapping not found'
      });
    }

    // Update course's relatedLearningPaths
    await Course.findByIdAndUpdate(courseId, {
      $pull: { relatedLearningPaths: pathId }
    });

    // Update path's totalLessons count
    const totalCourses = await LearningPathCourse.countDocuments({
      learningPathId: pathId,
      isActive: true
    });
    await LearningPath.findByIdAndUpdate(pathId, { totalLessons: totalCourses });

    res.status(200).json({
      success: true,
      message: 'Course removed from learning path successfully'
    });
  } catch (error) {
    console.error('Error removing course from path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from learning path',
      error: error.message
    });
  }
};

// Update course order in learning path
exports.updateCourseOrder = async (req, res) => {
  try {
    const { pathId, courseId } = req.params;
    const { newOrder } = req.body;

    const mapping = await LearningPathCourse.findOne({
      learningPathId: pathId,
      courseId
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Course mapping not found'
      });
    }

    mapping.order = newOrder;
    await mapping.save();

    res.status(200).json({
      success: true,
      message: 'Course order updated successfully',
      data: mapping
    });
  } catch (error) {
    console.error('Error updating course order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course order',
      error: error.message
    });
  }
};

// Bulk reorder courses in learning path
exports.reorderPathCourses = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { courseOrders } = req.body; // Array of { courseId, order }

    // Validate all courses belong to this path
    const courseIds = courseOrders.map(co => co.courseId);
    const existingMappings = await LearningPathCourse.find({
      learningPathId: pathId,
      courseId: { $in: courseIds }
    });

    if (existingMappings.length !== courseIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some courses do not belong to this learning path'
      });
    }

    // Update orders
    const bulkOps = courseOrders.map(({ courseId, order }) => ({
      updateOne: {
        filter: { learningPathId: pathId, courseId },
        update: { $set: { order } }
      }
    }));

    await LearningPathCourse.bulkWrite(bulkOps);

    // Get updated course list
    const updatedCourses = await LearningPathCourse.getPathCourses(pathId);

    res.status(200).json({
      success: true,
      message: 'Courses reordered successfully',
      data: updatedCourses
    });
  } catch (error) {
    console.error('Error reordering courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder courses',
      error: error.message
    });
  }
};

// Get all courses in a learning path (ordered)
exports.getPathCourses = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { includeOptional } = req.query;

    const courses = await LearningPathCourse.getPathCourses(
      pathId, 
      includeOptional !== 'false'
    );

    // If user is logged in, add their progress for each course
    if (req.user) {
      const CourseProgress = require('../models/CourseProgress');
      const userProgress = await CourseProgress.find({
        userId: req.user._id,
        courseId: { $in: courses.map(c => c.courseId._id) }
      });

      const progressMap = {};
      userProgress.forEach(p => {
        progressMap[p.courseId.toString()] = p;
      });

      courses.forEach(course => {
        course._doc.userProgress = progressMap[course.courseId._id.toString()] || null;
      });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching path courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

// Get all learning paths containing a course
exports.getCourseInPaths = async (req, res) => {
  try {
    const { courseId } = req.params;

    const paths = await LearningPathCourse.getCoursePaths(courseId);

    res.status(200).json({
      success: true,
      count: paths.length,
      data: paths
    });
  } catch (error) {
    console.error('Error fetching course paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths for course',
      error: error.message
    });
  }
};

// Get next course in sequence
exports.getNextCourse = async (req, res) => {
  try {
    const { pathId, currentCourseId } = req.params;

    // Get current course mapping
    const currentMapping = await LearningPathCourse.findOne({
      learningPathId: pathId,
      courseId: currentCourseId
    });

    if (!currentMapping) {
      return res.status(404).json({
        success: false,
        message: 'Current course not found in this learning path'
      });
    }

    const nextCourse = await LearningPathCourse.getNextCourse(
      pathId, 
      currentMapping.order
    );

    if (!nextCourse) {
      return res.status(200).json({
        success: true,
        message: 'No more courses in this learning path',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: nextCourse
    });
  } catch (error) {
    console.error('Error fetching next course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch next course',
      error: error.message
    });
  }
};

// Check course prerequisites
exports.checkCoursePrerequisites = async (req, res) => {
  try {
    const { pathId, courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const mapping = await LearningPathCourse.findOne({
      learningPathId: pathId,
      courseId
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in this learning path'
      });
    }

    const result = await mapping.checkPrerequisites(req.user._id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check prerequisites',
      error: error.message
    });
  }
};

module.exports = exports;
