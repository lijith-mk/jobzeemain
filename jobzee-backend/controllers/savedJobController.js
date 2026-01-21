const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const User = require('../models/User');

// Save a job for later
exports.saveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the job
    const job = await Job.findOne({
      _id: id,
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer available'
      });
    }

    // Check if job is already saved
    const existingSavedJob = await SavedJob.findOne({
      userId: userId,
      jobId: id
    });

    if (existingSavedJob) {
      return res.status(409).json({
        success: false,
        message: 'Job already saved'
      });
    }

    // Create new saved job entry
    const savedJob = new SavedJob({
      userId: userId,
      jobId: id
    });

    await savedJob.save();

    res.json({
      success: true,
      message: 'Job saved successfully!'
    });

  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Remove a job from saved jobs
exports.unsaveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savedJob = await SavedJob.findOneAndDelete({
      userId: userId,
      jobId: id
    });

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job removed from saved jobs'
    });

  } catch (error) {
    console.error('Unsave job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsave job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's saved jobs
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get saved job IDs for the user
    const savedJobs = await SavedJob.find({ userId: userId })
      .sort({ savedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate({
        path: 'jobId',
        populate: {
          path: 'employerId',
          select: 'companyName companyLogo industry headquarters'
        }
      });

    // Filter out jobs that are no longer active or expired
    const activeSavedJobs = savedJobs.filter(savedJob => 
      savedJob.jobId && 
      ['active', 'approved'].includes(savedJob.jobId.status) &&
      savedJob.jobId.expiresAt > new Date()
    );

    // Format response
    const formattedJobs = activeSavedJobs.map(savedJob => ({
      _id: savedJob.jobId._id,
      title: savedJob.jobId.title,
      description: savedJob.jobId.description,
      company: savedJob.jobId.company,
      location: savedJob.jobId.location,
      jobType: savedJob.jobId.jobType,
      experienceLevel: savedJob.jobId.experienceLevel,
      salary: savedJob.jobId.salary,
      requirements: savedJob.jobId.requirements,
      benefits: savedJob.jobId.benefits,
      skills: savedJob.jobId.skills,
      remote: savedJob.jobId.remote,
      views: savedJob.jobId.views,
      isPromoted: savedJob.jobId.isPromoted,
      createdAt: savedJob.jobId.createdAt,
      expiresAt: savedJob.jobId.expiresAt,
      savedAt: savedJob.savedAt,
      employer: {
        _id: savedJob.jobId.employerId?._id,
        companyName: savedJob.jobId.employerId?.companyName,
        companyLogo: savedJob.jobId.employerId?.companyLogo,
        industry: savedJob.jobId.employerId?.industry,
        headquarters: savedJob.jobId.employerId?.headquarters
      }
    }));

    // Get total count for pagination
    const total = await SavedJob.countDocuments({ userId: userId });

    res.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Check if a job is saved by the user
exports.checkSavedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savedJob = await SavedJob.findOne({
      userId: userId,
      jobId: id
    });

    res.json({
      success: true,
      isSaved: !!savedJob,
      savedAt: savedJob?.savedAt || null
    });

  } catch (error) {
    console.error('Check saved status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check saved status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
