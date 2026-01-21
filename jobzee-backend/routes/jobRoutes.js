const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Public route to get all active jobs for users
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      location = '',
      jobType = '',
      experienceLevel = '',
      remote = '',
      sort = '-createdAt',
      skills = '',
      category = ''
    } = req.query;

    // Build query for active jobs only
    const query = { 
      status: { $in: ['active', 'approved'] }, // Only show active/approved jobs
      expiresAt: { $gt: new Date() } // Only show non-expired jobs
    };

    // Add search filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (jobType || category) {
      // Support either explicit jobType or a category alias coming from frontend
      query.jobType = jobType || category;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (remote) {
      query.remote = remote;
    }

    // Filter by one or more skills (comma-separated or repeated param)
    if (skills) {
      const skillList = Array.isArray(skills)
        ? skills
        : String(skills)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
      if (skillList.length > 0) {
        // Match jobs that contain ALL requested skills (change to $in for ANY)
        query.skills = { $all: skillList.map(s => new RegExp(`^${s}$`, 'i')) };
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get jobs with employer info
    const jobs = await Job.find(query)
      .populate('employerId', 'companyName companyLogo industry headquarters')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-applicants -reports -adminNotes'); // Exclude sensitive data

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    // Format response
    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salary: job.salary,
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      remote: job.remote,
      views: job.views,
      isPromoted: job.isPromoted,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      employer: {
        _id: job.employerId?._id,
        companyName: job.employerId?.companyName,
        companyLogo: job.employerId?.companyLogo,
        industry: job.employerId?.industry,
        headquarters: job.employerId?.headquarters
      }
    }));

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
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Public route to get a single job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      _id: id,
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    })
      .populate('employerId', 'companyName companyLogo industry headquarters companyDescription website')
      .select('-applicants -reports -adminNotes');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer available'
      });
    }

    // Increment view count
    job.views = (job.views || 0) + 1;
    await job.save();

    const formattedJob = {
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salary: job.salary,
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      remote: job.remote,
      views: job.views,
      isPromoted: job.isPromoted,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      employer: {
        _id: job.employerId?._id,
        companyName: job.employerId?.companyName,
        companyLogo: job.employerId?.companyLogo,
        industry: job.employerId?.industry,
        headquarters: job.employerId?.headquarters,
        companyDescription: job.employerId?.companyDescription,
        website: job.employerId?.website
      }
    };

    res.json({
      success: true,
      job: formattedJob
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Public route to get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalJobs,
      activeJobs,
      jobsByType,
      jobsByLocation,
      recentJobs
    ] = await Promise.all([
      Job.countDocuments({ status: { $in: ['active', 'approved'] } }),
      Job.countDocuments({ 
        status: { $in: ['active', 'approved'] },
        expiresAt: { $gt: new Date() }
      }),
      Job.aggregate([
        { $match: { status: { $in: ['active', 'approved'] } } },
        { $group: { _id: '$jobType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Job.aggregate([
        { $match: { status: { $in: ['active', 'approved'] } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Job.find({ 
        status: { $in: ['active', 'approved'] },
        expiresAt: { $gt: new Date() }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title company location jobType createdAt')
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        jobsByType,
        topLocations: jobsByLocation,
        recentJobs
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Quick Apply to Job (One-Click Apply)
router.post('/:id/quick-apply', auth, async (req, res) => {
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

    // Check if user already applied
    const alreadyApplied = job.applicants.some(applicant => 
      String(applicant.userId) === String(userId)
    );

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Get user profile for resume
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Check if user has a resume
    if (!user.resume) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume before applying to jobs',
        requiresResume: true
      });
    }

    // Add user to applicants array
    job.applicants.push({
      userId: userId,
      appliedAt: new Date(),
      status: 'applied',
      resume: user.resume,
      coverLetter: '' // Quick apply doesn't require cover letter
    });

    await job.save();

    // Also create an entry in the new Application collection
    try {
      const Application = require('../models/Application');
      
      // Check if application already exists in Application collection
      const existingApplication = await Application.findOne({
        userId: userId,
        jobId: id
      });

      if (!existingApplication) {
        const newApplication = new Application({
          applicantName: user.name,
          applicantEmail: user.email,
          userId: userId,
          jobId: id,
          jobTitle: job.title,
          companyName: job.company,
          resumeLink: user.resume,
          coverLetter: '',
          skills: user.skills || [],
          experience: user.yearsOfExperience ? `${user.yearsOfExperience} years` : '',
          education: user.education || '',
          applicationStatus: 'applied'
        });

        await newApplication.save();
        console.log('✅ Application created in Application collection:', newApplication._id);
      }
    } catch (appError) {
      console.error('Error creating Application collection entry:', appError);
      // Don't fail the request if Application collection creation fails
    }

    res.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: job.applicants[job.applicants.length - 1]._id
    });

  } catch (error) {
    console.error('Quick apply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Save Job for Later
router.post('/:id/save', auth, async (req, res) => {
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

    // Get user and add job to saved jobs
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Initialize savedJobs array if it doesn't exist
    if (!user.savedJobs) {
      user.savedJobs = [];
    }

    // Check if job is already saved
    const alreadySaved = user.savedJobs.some(savedJob => 
      String(savedJob.jobId) === String(id)
    );

    if (alreadySaved) {
      return res.status(409).json({
        success: false,
        message: 'Job already saved'
      });
    }

    // Add job to saved jobs
    user.savedJobs.push({
      jobId: id,
      savedAt: new Date()
    });

    await user.save();

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
});

// Unsave Job
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Remove job from saved jobs
    if (user.savedJobs) {
      user.savedJobs = user.savedJobs.filter(savedJob => 
        String(savedJob.jobId) !== String(id)
      );
      await user.save();
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
});

// Get User's Saved Jobs
router.get('/saved/my-jobs', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId).select('savedJobs');
    if (!user || !user.savedJobs) {
      return res.json({
        success: true,
        jobs: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Get job IDs from saved jobs
    const jobIds = user.savedJobs.map(savedJob => savedJob.jobId);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get jobs with employer info
    const jobs = await Job.find({
      _id: { $in: jobIds },
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    })
      .populate('employerId', 'companyName companyLogo industry headquarters')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-applicants -reports -adminNotes');

    // Format response
    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salary: job.salary,
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      remote: job.remote,
      views: job.views,
      isPromoted: job.isPromoted,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      employer: {
        _id: job.employerId?._id,
        companyName: job.employerId?.companyName,
        companyLogo: job.employerId?.companyLogo,
        industry: job.employerId?.industry,
        headquarters: job.employerId?.headquarters
      }
    }));

    // Get total count for pagination
    const total = await Job.countDocuments({
      _id: { $in: jobIds },
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    });

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
});

// Check if user has applied to a job
router.get('/:id/application-status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findOne({
      _id: id,
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    }).select('applicants');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const application = job.applicants.find(applicant => 
      String(applicant.userId) === String(userId)
    );

    res.json({
      success: true,
      hasApplied: !!application,
      application: application || null
    });

  } catch (error) {
    console.error('Check application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check application status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get User's Job Applications
router.get('/my-applications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Try multiple approaches to find user applications
    let jobs = [];

    // Approach 1: Direct query with ObjectId
    try {
      const mongoose = require('mongoose');
      const objectIdUserId = new mongoose.Types.ObjectId(userId);
      
      jobs = await Job.find({
        'applicants.userId': objectIdUserId,
        status: { $in: ['pending', 'active', 'approved', 'rejected'] }
      })
        .populate('employerId', 'companyName companyLogo industry headquarters')
        .sort({ 'applicants.appliedAt': -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-reports -adminNotes');
    } catch (error) {
      // Fallback to string comparison
      jobs = await Job.find({
        'applicants.userId': userId,
        status: { $in: ['pending', 'active', 'approved', 'rejected'] }
      })
        .populate('employerId', 'companyName companyLogo industry headquarters')
        .sort({ 'applicants.appliedAt': -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-reports -adminNotes');
    }

    // If still no results, try manual filtering
    if (jobs.length === 0) {
      const allJobs = await Job.find({
        status: { $in: ['pending', 'active', 'approved', 'rejected'] }
      })
        .populate('employerId', 'companyName companyLogo industry headquarters')
        .select('-reports -adminNotes');

      jobs = allJobs.filter(job => 
        job.applicants.some(applicant => 
          String(applicant.userId) === String(userId)
        )
      ).sort((a, b) => {
        const aApp = a.applicants.find(app => String(app.userId) === String(userId));
        const bApp = b.applicants.find(app => String(app.userId) === String(userId));
        return new Date(bApp.appliedAt) - new Date(aApp.appliedAt);
      }).slice(skip, skip + parseInt(limit));
    }

    // Format response with application details
    const formattedJobs = jobs.map(job => {
      const userApplication = job.applicants.find(applicant => 
        String(applicant.userId) === String(userId)
      );

      return {
        _id: job._id,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salary: job.salary,
        requirements: job.requirements,
        benefits: job.benefits,
        skills: job.skills,
        remote: job.remote,
        views: job.views,
        isPromoted: job.isPromoted,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
        application: {
          appliedAt: userApplication.appliedAt,
          status: userApplication.status,
          resume: userApplication.resume,
          coverLetter: userApplication.coverLetter
        },
        employer: {
          _id: job.employerId?._id,
          companyName: job.employerId?.companyName,
          companyLogo: job.employerId?.companyLogo,
          industry: job.employerId?.industry,
          headquarters: job.employerId?.headquarters
        }
      };
    });

    // Get total count for pagination
    const total = await Job.countDocuments({
      'applicants.userId': userId,
      status: { $in: ['pending', 'active', 'approved'] }
    });

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
    console.error('Get user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
