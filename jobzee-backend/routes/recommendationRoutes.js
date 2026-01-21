const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const InternshipApplication = require('../models/InternshipApplication');
const knnRecommendation = require('../services/knnRecommendation');
const naiveBayesRecommendation = require('../services/naiveBayesRecommendation');

/**
 * GET /api/recommendations/jobs/:id/similar
 * Get similar jobs based on a specific job
 */
router.get('/jobs/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the target job
    const targetJob = await Job.findById(id);
    if (!targetJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get all active jobs
    const allJobs = await Job.find({ 
      status: 'active',
      _id: { $ne: id } 
    }).limit(100); // Limit for performance

    // Get recommendations
    const recommendations = await knnRecommendation.getRecommendations(
      targetJob,
      allJobs,
      'job',
      limit
    );

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get similar jobs error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/internships/:id/similar
 * Get similar internships based on a specific internship
 */
router.get('/internships/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the target internship
    const targetInternship = await Internship.findById(id);
    if (!targetInternship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Get all active internships
    const allInternships = await Internship.find({ 
      status: 'active',
      _id: { $ne: id } 
    }).limit(100);

    // Get recommendations
    const recommendations = await knnRecommendation.getRecommendations(
      targetInternship,
      allInternships,
      'internship',
      limit
    );

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get similar internships error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/jobs/personalized
 * Get personalized job recommendations based on user's application history
 */
router.get('/jobs/personalized', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get user's job applications
    const userApplications = await Application.find({ 
      userId: req.user.id 
    }).populate('jobId');

    // Get all available jobs (active or approved, not expired)
    const allJobs = await Job.find({ 
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    }).limit(200);

    // Get personalized recommendations
    const recommendations = await knnRecommendation.getPersonalizedRecommendations(
      userApplications,
      allJobs,
      'job',
      limit
    );

    res.json({
      success: true,
      recommendations,
      basedOn: userApplications.length > 0 ? 'application_history' : 'popular'
    });
  } catch (error) {
    console.error('Get personalized job recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/internships/personalized
 * Get personalized internship recommendations based on user's application history
 */
router.get('/internships/personalized', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get user's internship applications
    const userApplications = await InternshipApplication.find({ 
      user: req.user.id 
    }).populate('internship');

    // Get all active internships
    const allInternships = await Internship.find({ status: 'active' }).limit(200);

    // Get personalized recommendations
    const recommendations = await knnRecommendation.getPersonalizedRecommendations(
      userApplications,
      allInternships,
      'internship',
      limit
    );

    res.json({
      success: true,
      recommendations,
      basedOn: userApplications.length > 0 ? 'application_history' : 'popular'
    });
  } catch (error) {
    console.error('Get personalized internship recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/jobs/personalized-nb
 * Get personalized job recommendations using Naive Bayes algorithm
 */
router.get('/jobs/personalized-nb', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get user's job applications
    const userApplications = await Application.find({ 
      userId: req.user.id 
    }).populate('jobId');

    // Get all available jobs (active or approved, not expired)
    const allJobs = await Job.find({ 
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    }).limit(200);

    // Get personalized recommendations using Naive Bayes
    const recommendations = await naiveBayesRecommendation.getPersonalizedRecommendations(
      userApplications,
      allJobs,
      'job',
      limit
    );

    res.json({
      success: true,
      recommendations,
      algorithm: 'naive_bayes',
      basedOn: userApplications.length > 0 ? 'application_history' : 'popular'
    });
  } catch (error) {
    console.error('Get Naive Bayes job recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/internships/personalized-nb
 * Get personalized internship recommendations using Naive Bayes algorithm
 */
router.get('/internships/personalized-nb', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get user's internship applications
    const userApplications = await InternshipApplication.find({ 
      user: req.user.id 
    }).populate('internship');

    // Get all active internships
    const allInternships = await Internship.find({ status: 'active' }).limit(200);

    // Get personalized recommendations using Naive Bayes
    const recommendations = await naiveBayesRecommendation.getPersonalizedRecommendations(
      userApplications,
      allInternships,
      'internship',
      limit
    );

    res.json({
      success: true,
      recommendations,
      algorithm: 'naive_bayes',
      basedOn: userApplications.length > 0 ? 'application_history' : 'popular'
    });
  } catch (error) {
    console.error('Get Naive Bayes internship recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/jobs/:id/similar-nb
 * Get similar jobs using Naive Bayes feature similarity
 */
router.get('/jobs/:id/similar-nb', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the target job
    const targetJob = await Job.findById(id);
    if (!targetJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get all active jobs
    const allJobs = await Job.find({ 
      status: 'active',
      _id: { $ne: id } 
    }).limit(100);

    // Get recommendations using Naive Bayes
    const recommendations = await naiveBayesRecommendation.getSimilarItems(
      targetJob,
      allJobs,
      'job',
      limit
    );

    res.json({
      success: true,
      recommendations,
      algorithm: 'naive_bayes'
    });
  } catch (error) {
    console.error('Get similar jobs (Naive Bayes) error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/internships/:id/similar-nb
 * Get similar internships using Naive Bayes feature similarity
 */
router.get('/internships/:id/similar-nb', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the target internship
    const targetInternship = await Internship.findById(id);
    if (!targetInternship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Get all active internships
    const allInternships = await Internship.find({ 
      status: 'active',
      _id: { $ne: id } 
    }).limit(100);

    // Get recommendations using Naive Bayes
    const recommendations = await naiveBayesRecommendation.getSimilarItems(
      targetInternship,
      allInternships,
      'internship',
      limit
    );

    res.json({
      success: true,
      recommendations,
      algorithm: 'naive_bayes'
    });
  } catch (error) {
    console.error('Get similar internships (Naive Bayes) error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

module.exports = router;
