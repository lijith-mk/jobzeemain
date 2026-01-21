const InternshipApplication = require('../models/InternshipApplication');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Employer = require('../models/Employer');
const NotificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// @desc    Apply for an internship
// @route   POST /api/internships/:internshipId/apply
// @access  Private (User)
const applyForInternship = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const userId = req.user.id;
    const { coverLetter, resumeUrl, portfolioUrl, expectedStartDate, additionalInfo, relevantSkills, yearsOfExperience } = req.body;

    // Check if internship exists and is active
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    if (internship.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This internship is not currently accepting applications'
      });
    }

    // Check if application deadline has passed
    if (new Date() > new Date(internship.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = await InternshipApplication.findOne({
      internship: internshipId,
      user: userId,
      isDeleted: false
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this internship'
      });
    }

    // Get user's IP and User Agent for tracking
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Create application
    const application = new InternshipApplication({
      internship: internshipId,
      user: userId,
      employer: internship.employer,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      expectedStartDate,
      additionalInfo,
      relevantSkills: Array.isArray(relevantSkills) ? relevantSkills : [],
      yearsOfExperience,
      deviceInfo
    });

    await application.save();

    // Increment internship applications count
    try {
      await Internship.findByIdAndUpdate(internshipId, { $inc: { applicationsCount: 1 } });
    } catch (e) {
      console.warn('Warning: failed to increment applicationsCount for internship', internshipId);
    }

    // Populate the application for response
    await application.populate([
      { path: 'user', select: 'name email' },
      { path: 'internship', select: 'title company' },
      { path: 'employer', select: 'name companyName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying for internship:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application'
    });
  }
};

// @desc    Get applications for a specific internship (Employer only)
// @route   GET /api/internships/:internshipId/applications
// @access  Private (Employer)
const getInternshipApplications = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const employerId = (req.employer && req.employer.id) || (req.user && req.user.id);
    const { status, page = 1, limit = 10, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    // Verify the internship belongs to the employer
    const internship = await Internship.findOne({
      _id: internshipId,
      employer: employerId
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found or not authorized'
      });
    }

    // Build query
    const query = {
      internship: internshipId,
      isDeleted: false
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get applications with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const applications = await InternshipApplication.find(query)
      .populate('user', 'name email phone profilePhoto location skills experience education')
      .populate('internship', 'title location duration stipend')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await InternshipApplication.countDocuments(query);

    // Get application statistics
    const stats = await InternshipApplication.aggregate([
      { $match: { internship: new mongoose.Types.ObjectId(internshipId), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalApplications,
        pages: Math.ceil(totalApplications / parseInt(limit))
      },
      stats: statusStats
    });
  } catch (error) {
    console.error('Error fetching internship applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// @desc    Get all applications for employer
// @route   GET /api/internship-applications/employer
// @access  Private (Employer)
const getEmployerApplications = async (req, res) => {
  try {
    const employerId = req.user.id;
    const { status, internship, page = 1, limit = 20, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    const query = {
      employer: employerId,
      isDeleted: false
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (internship && internship !== 'all') {
      query.internship = internship;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const applications = await InternshipApplication.find(query)
      .populate('user', 'name email phone profilePhoto location skills experience education')
      .populate('internship', 'title location duration stipend')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await InternshipApplication.countDocuments(query);

    // Get overall statistics
    const stats = await InternshipApplication.aggregate([
      { $match: { employer: new mongoose.Types.ObjectId(employerId), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalApplications,
        pages: Math.ceil(totalApplications / parseInt(limit))
      },
      stats: statusStats
    });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// @desc    Get user's internship applications
// @route   GET /api/internship-applications/user
// @access  Private (User)
const getUserApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    const query = {
      user: userId,
      isDeleted: false
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const applications = await InternshipApplication.find(query)
      .populate('internship', 'title location duration stipend status applicationDeadline')
      .populate('employer', 'name companyName companyLogo')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await InternshipApplication.countDocuments(query);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalApplications,
        pages: Math.ceil(totalApplications / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your applications'
    });
  }
};

// @desc    Update application status (Employer only)
// @route   PATCH /api/internship-applications/:applicationId/status
// @access  Private (Employer)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const employerId = (req.employer && req.employer.id) || (req.user && req.user.id);

    const validStatuses = ['reviewed', 'shortlisted', 'interview', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Find application and verify employer ownership
    const application = await InternshipApplication.findOne({
      _id: applicationId,
      employer: employerId,
      isDeleted: false
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or not authorized'
      });
    }

    // Update status using the model method
    await application.updateStatus(status, employerId, 'Employer', notes);

    // Populate internship details for notification
    await application.populate('internship', 'title');

    // Send notification to user about status change
    try {
      await NotificationService.notifyInternshipApplicationStatus(
        application.user,
        status,
        application.internship?.title || 'Internship',
        applicationId,
        application.internship?._id
      );
    } catch (notifError) {
      console.warn('Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Populate for response
    await application.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'internship', select: 'title' }
    ]);

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
};

// @desc    Get single application details
// @route   GET /api/internship-applications/:applicationId
// @access  Private (User/Employer)
const getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || 'user';

    // Build query based on user role
    let query = {
      _id: applicationId,
      isDeleted: false
    };

    if (userRole === 'user') {
      query.user = userId;
    } else if (userRole === 'employer') {
      query.employer = userId;
    }

    const application = await InternshipApplication.findOne(query)
      .populate('user', 'name email phone profilePhoto location skills experience education')
      .populate('internship', 'title description location duration stipend skills requirements')
      .populate('employer', 'name companyName companyLogo');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or not authorized'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application details'
    });
  }
};

// @desc    Withdraw application (User only)
// @route   DELETE /api/internship-applications/:applicationId/withdraw
// @access  Private (User)
const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const application = await InternshipApplication.findOne({
      _id: applicationId,
      user: userId,
      isDeleted: false
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (['selected', 'rejected', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw this application'
      });
    }

    await application.withdraw();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application'
    });
  }
};

// @desc    Get application statistics for employer dashboard
// @route   GET /api/internship-applications/stats
// @access  Private (Employer)
const getApplicationStatistics = async (req, res) => {
  try {
    const employerId = req.user.id;

    // Get overall stats
    const overallStats = await InternshipApplication.aggregate([
      { $match: { employer: new mongoose.Types.ObjectId(employerId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          statusBreakdown: {
            $push: '$status'
          }
        }
      }
    ]);

    // Get status distribution
    const statusStats = await InternshipApplication.aggregate([
      { $match: { employer: new mongoose.Types.ObjectId(employerId), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await InternshipApplication.aggregate([
      {
        $match: {
          employer: new mongoose.Types.ObjectId(employerId),
          isDeleted: false,
          appliedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusDistribution = {};
    statusStats.forEach(stat => {
      statusDistribution[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        totalApplications: overallStats[0]?.totalApplications || 0,
        statusDistribution,
        recentTrends: recentStats
      }
    });
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics'
    });
  }
};

module.exports = {
  applyForInternship,
  getInternshipApplications,
  getEmployerApplications,
  getUserApplications,
  updateApplicationStatus,
  getApplicationDetails,
  withdrawApplication,
  getApplicationStatistics
};