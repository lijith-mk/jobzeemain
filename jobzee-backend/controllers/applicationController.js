const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const EmployerNotification = require('../models/EmployerNotification');
const UserNotification = require('../models/UserNotification');

// Create a new application
exports.createApplication = async (req, res) => {
  try {
    const {
      jobId,
      resumeLink,
      coverLetter = '',
      skills = [],
      experience = '',
      education = '',
      expectedSalary = {},
      availability = '',
      noticePeriod = '30-days'
    } = req.body;

    // Validate required fields
    if (!jobId || !resumeLink) {
      return res.status(400).json({ 
        message: 'Job ID and resume link are required' 
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied for this job
    const existingApplication = await Application.findOne({
      userId: req.user.id,
      jobId: jobId
    });

    if (existingApplication) {
      return res.status(409).json({ 
        message: 'You have already applied for this job' 
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new application
    const application = new Application({
      applicantName: user.name,
      applicantEmail: user.email,
      userId: req.user.id,
      jobId: jobId,
      jobTitle: job.title,
      companyName: job.company,
      resumeLink: resumeLink,
      coverLetter: coverLetter,
      skills: skills,
      experience: experience,
      education: education,
      expectedSalary: expectedSalary,
      availability: availability,
      noticePeriod: noticePeriod,
      applicationStatus: 'applied'
    });

    await application.save();

    // Add application to job's applicants array
    job.applicants.push({
      userId: req.user.id,
      appliedAt: new Date(),
      status: 'applied',
      resume: resumeLink,
      coverLetter: coverLetter
    });

    await job.save();

    // Notify employer about new application (fire-and-forget)
    try {
      EmployerNotification.create({
        employerId: job.employerId,
        type: 'application',
        title: 'New application received',
        message: `${user.name} applied for ${job.title}`,
        data: { jobId: job._id, applicantId: req.user.id }
      }).catch(() => {});
    } catch (_) {}

    // Notify user about successful application (fire-and-forget)
    try {
      UserNotification.create({
        userId: req.user.id,
        type: 'application_status',
        title: 'Application submitted',
        message: `Your application for ${job.title} at ${job.company} has been submitted successfully`,
        data: { jobId: job._id, applicationId: application._id },
        priority: 'medium'
      }).catch(() => {});
    } catch (_) {}

    res.status(201).json({
      message: 'Application submitted successfully',
      application: application
    });

  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Failed to submit application' });
  }
};

// Get all applications for a user
exports.getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title company location jobType')
      .sort({ appliedAt: -1 });

    res.json({
      applications: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

// Get all applications for a specific job (for employers)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Verify the job belongs to the employer
    const job = await Job.findOne({ 
      _id: jobId, 
      employerId: req.employer.id 
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    const applications = await Application.find({ jobId: jobId })
      .populate('userId', 'name email phone profilePhoto resume')
      .sort({ appliedAt: -1 });

    res.json({
      applications: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

// Get a specific application
exports.getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('userId', 'name email phone profilePhoto')
      .populate('jobId', 'title company location jobType description');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to this application
    const userId = req.user?.id || req.employer?.id;
    const userRole = req.user?.role || (req.employer ? 'employer' : null);
    
    if (application.userId._id.toString() !== userId && userRole !== 'admin') {
      // Check if user is the employer of the job
      const job = await Job.findById(application.jobId._id);
      if (!job || job.employerId.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// Update application status (for employers)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { applicationStatus, notes } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the employer owns the job
    const job = await Job.findOne({ 
      _id: application.jobId, 
      employerId: req.employer.id 
    });

    if (!job) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update application status
    application.applicationStatus = applicationStatus;
    application.lastStatusUpdate = new Date();
    application.reviewedBy = req.employer.id;

    // Add notes if provided
    if (notes) {
      application.interviewNotes.push({
        note: notes,
        interviewer: req.user.name || 'Employer',
        date: new Date()
      });
    }

    await application.save();

    // Update the status in job's applicants array
    const jobApplicant = job.applicants.find(
      applicant => applicant.userId.toString() === application.userId.toString()
    );
    if (jobApplicant) {
      jobApplicant.status = applicationStatus;
      await job.save();
    }

    // Notify user about application status update (fire-and-forget)
    try {
      const statusMessages = {
        'applied': 'Your application has been received',
        'under-review': 'Your application is being reviewed',
        'shortlisted': 'Congratulations! You have been shortlisted',
        'interview-scheduled': 'Great news! You have been selected for an interview',
        'interviewed': 'Thank you for completing the interview',
        'rejected': 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates',
        'hired': 'Congratulations! You have been selected for this position',
        'withdrawn': 'Your application has been withdrawn'
      };

      UserNotification.create({
        userId: application.userId,
        type: 'application_status',
        title: 'Application status updated',
        message: statusMessages[applicationStatus] || `Your application status has been updated to ${applicationStatus}`,
        data: { jobId: job._id, applicationId: application._id, status: applicationStatus },
        priority: applicationStatus === 'hired' ? 'high' : 'medium'
      }).catch(() => {});
    } catch (_) {}

    res.json({
      message: 'Application status updated successfully',
      application: application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
};

// Add message to application
exports.addMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Determine sender type
    let sender = 'applicant';
    const userId = req.user?.id || req.employer?.id;
    const userRole = req.user?.role || (req.employer ? 'employer' : null);
    
    if (userRole === 'employer') {
      // Verify the employer owns the job
      const job = await Job.findOne({ 
        _id: application.jobId, 
        employerId: userId 
      });
      if (!job) {
        return res.status(403).json({ message: 'Access denied' });
      }
      sender = 'employer';
    } else if (application.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add message
    application.messages.push({
      sender: sender,
      message: message
    });

    await application.save();

    res.json({
      message: 'Message added successfully',
      application: application
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Failed to add message' });
  }
};

// Withdraw application
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update status to withdrawn
    application.applicationStatus = 'withdrawn';
    application.lastStatusUpdate = new Date();

    await application.save();

    // Update the status in job's applicants array
    const job = await Job.findById(application.jobId);
    if (job) {
      const jobApplicant = job.applicants.find(
        applicant => applicant.userId.toString() === application.userId.toString()
      );
      if (jobApplicant) {
        jobApplicant.status = 'withdrawn';
        await job.save();
      }
    }

    res.json({
      message: 'Application withdrawn successfully',
      application: application
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: 'Failed to withdraw application' });
  }
};

// Get application statistics (for employers)
exports.getApplicationStats = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the job belongs to the employer
    const job = await Job.findOne({ 
      _id: jobId, 
      employerId: req.user.id 
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    const stats = await Application.aggregate([
      { $match: { jobId: job._id } },
      {
        $group: {
          _id: '$applicationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments({ jobId: job._id });

    res.json({
      totalApplications,
      statusBreakdown: stats,
      job: {
        title: job.title,
        company: job.company
      }
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Failed to fetch application statistics' });
  }
};
