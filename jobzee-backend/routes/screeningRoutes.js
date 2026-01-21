const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const Job = require('../models/Job');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const InternshipApplication = require('../models/InternshipApplication');
const User = require('../models/User');
const svmScreening = require('../services/svmCandidateScreening');

/**
 * GET /api/screening/job/:jobId/candidates
 * Screen all candidates who applied to a job
 */
router.get('/job/:jobId/candidates', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this job' });
    }

    // Get all applications for this job
    const applications = await Application.find({ jobId: jobId })
      .populate('userId', 'name email skills experience education location bio profilePicture')
      .lean();

    if (applications.length === 0) {
      return res.json({
        success: true,
        message: 'No applications yet',
        candidates: [],
        stats: {
          total: 0,
          excellent: 0,
          good: 0,
          average: 0,
          belowAverage: 0,
          poor: 0,
          averageScore: 0
        }
      });
    }

    // Extract candidate profiles
    const candidates = applications.map(app => ({
      ...app.userId,
      applicationId: app._id,
      appliedAt: app.appliedAt,
      status: app.status,
      resume: app.resume,
      coverLetter: app.coverLetter
    }));

    // Screen candidates using SVM
    const result = await svmScreening.screenCandidates(candidates, job, 'job');

    res.json({
      success: true,
      ...result,
      jobTitle: job.title
    });
  } catch (error) {
    console.error('Screen job candidates error:', error);
    res.status(500).json({ message: 'Failed to screen candidates' });
  }
});

/**
 * GET /api/screening/internship/:internshipId/candidates
 * Screen all candidates who applied to an internship
 */
router.get('/internship/:internshipId/candidates', employerAuth, async (req, res) => {
  try {
    const { internshipId } = req.params;

    // Verify internship belongs to employer
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (internship.employer.toString() !== req.employer.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this internship' });
    }

    // Get all applications for this internship
    const applications = await InternshipApplication.find({ internship: internshipId })
      .populate('user', 'name email skills experience education location bio profilePicture')
      .lean();

    if (applications.length === 0) {
      return res.json({
        success: true,
        message: 'No applications yet',
        candidates: [],
        stats: {
          total: 0,
          excellent: 0,
          good: 0,
          average: 0,
          belowAverage: 0,
          poor: 0,
          averageScore: 0
        }
      });
    }

    // Extract candidate profiles
    const candidates = applications.map(app => ({
      ...app.user,
      applicationId: app._id,
      appliedAt: app.appliedAt,
      status: app.status
    }));

    // Screen candidates using SVM
    const result = await svmScreening.screenCandidates(candidates, internship, 'internship');

    res.json({
      success: true,
      ...result,
      internshipTitle: internship.title
    });
  } catch (error) {
    console.error('Screen internship candidates error:', error);
    res.status(500).json({ message: 'Failed to screen candidates' });
  }
});

/**
 * POST /api/screening/single-candidate
 * Screen a single candidate against a job (for testing/preview)
 */
router.post('/single-candidate', auth, async (req, res) => {
  try {
    const { jobId, internshipId, type = 'job' } = req.body;

    // Get user profile
    const candidate = await User.findById(req.user.id).lean();
    if (!candidate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get job or internship
    let position;
    if (type === 'job') {
      position = await Job.findById(jobId);
      if (!position) {
        return res.status(404).json({ message: 'Job not found' });
      }
    } else {
      position = await Internship.findById(internshipId);
      if (!position) {
        return res.status(404).json({ message: 'Internship not found' });
      }
    }

    // Screen single candidate
    const screening = svmScreening.classifyCandidate(candidate, position, type);

    res.json({
      success: true,
      screening
    });
  } catch (error) {
    console.error('Single candidate screening error:', error);
    res.status(500).json({ message: 'Failed to screen candidate' });
  }
});

module.exports = router;
