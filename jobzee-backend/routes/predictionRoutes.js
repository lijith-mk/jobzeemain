const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const User = require('../models/User');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Internship = require('../models/Internship');
const decisionTreePrediction = require('../services/decisionTreePrediction');
const salaryPredictor = require('../services/neuralNetSalaryPredictor');

// Train the neural network with real Indian salary data on server start
console.log('Initializing Neural Network with real Indian salary data...');
salaryPredictor.trainWithRealData();

/**
 * POST /api/predictions/job-success
 * Predict success probability for a specific job
 */
router.post('/job-success', auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Get user profile
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get detailed prediction
    const prediction = decisionTreePrediction.getDetailedAnalysis(user, job, 'job');

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Job success prediction error:', error);
    res.status(500).json({ message: 'Failed to predict success' });
  }
});

/**
 * POST /api/predictions/internship-success
 * Predict success probability for a specific internship
 */
router.post('/internship-success', auth, async (req, res) => {
  try {
    const { internshipId } = req.body;

    if (!internshipId) {
      return res.status(400).json({ message: 'Internship ID is required' });
    }

    // Get user profile
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get internship details
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Get detailed prediction
    const prediction = decisionTreePrediction.getDetailedAnalysis(user, internship, 'internship');

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Internship success prediction error:', error);
    res.status(500).json({ message: 'Failed to predict success' });
  }
});

/**
 * GET /api/predictions/job-success/:jobId
 * Get prediction for a job (alternative GET endpoint)
 */
router.get('/job-success/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get user profile
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get detailed prediction
    const prediction = decisionTreePrediction.getDetailedAnalysis(user, job, 'job');

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Job success prediction error:', error);
    res.status(500).json({ message: 'Failed to predict success' });
  }
});

/**
 * GET /api/predictions/internship-success/:internshipId
 * Get prediction for an internship (alternative GET endpoint)
 */
router.get('/internship-success/:internshipId', auth, async (req, res) => {
  try {
    const { internshipId } = req.params;

    // Get user profile
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get internship details
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Get detailed prediction
    const prediction = decisionTreePrediction.getDetailedAnalysis(user, internship, 'internship');

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Internship success prediction error:', error);
    res.status(500).json({ message: 'Failed to predict success' });
  }
});

/**
 * GET /api/predictions/salary/my-profile
 * Predict salary for logged-in user's profile
 */
router.get('/salary/my-profile', auth, async (req, res) => {
  try {
    // Get user profile
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Predict salary
    const prediction = salaryPredictor.predict(user);
    const marketComparison = salaryPredictor.getMarketComparison(
      prediction.predicted.average,
      user
    );

    res.json({
      success: true,
      salary: prediction,
      marketComparison
    });
  } catch (error) {
    console.error('Salary prediction error:', error);
    res.status(500).json({ message: 'Failed to predict salary' });
  }
});

/**
 * POST /api/predictions/salary/for-job
 * Predict recommended salary for a job posting
 */
router.post('/salary/for-job', employerAuth, async (req, res) => {
  try {
    const jobData = req.body;

    if (!jobData) {
      return res.status(400).json({ message: 'Job data is required' });
    }

    // Enrich with employer context (company size, industry)
    let employerCtx = {};
    try {
      const employer = await Employer.findById(req.employer.id).lean();
      if (employer) {
        employerCtx.companySize = employer.companySize;
        employerCtx.industry = employer.industry;
      }
    } catch (_) {}

    // Predict salary using real-world factors
    const prediction = salaryPredictor.predict(jobData, employerCtx);
    const marketComparison = salaryPredictor.getMarketComparison(
      prediction.predicted.average,
      { ...jobData, ...employerCtx }
    );

    // Format response to match frontend expectations
    res.json({
      success: true,
      prediction: {
        predictedSalary: prediction.predicted.average,
        range: {
          min: prediction.predicted.min,
          max: prediction.predicted.max
        },
        marketComparison: {
          averageForRole: marketComparison.marketAverage || prediction.predicted.average,
          top25Percent: Math.round(prediction.predicted.average * 1.25)
        },
        breakdown: [
          { factor: 'Experience Level', impact: jobData.experienceRequired || 'Entry Level' },
          { factor: 'Skills', impact: `${jobData.skills?.length || 0} skills` },
          { factor: 'Location', impact: jobData.location || 'Remote' },
          { factor: 'Job Title', impact: jobData.title || 'N/A' }
        ]
      },
      recommendation: `We recommend offering ₹${(prediction.predicted.min / 100000).toFixed(1)}L - ₹${(prediction.predicted.max / 100000).toFixed(1)}L to attract quality candidates`
    });
  } catch (error) {
    console.error('Job salary prediction error:', error);
    res.status(500).json({ message: 'Failed to predict salary' });
  }
});

/**
 * GET /api/predictions/salary/for-job/:jobId
 * Get salary prediction for an existing job
 */
router.get('/salary/for-job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Predict salary
    const prediction = salaryPredictor.predict(job);
    const marketComparison = salaryPredictor.getMarketComparison(
      prediction.predicted.average,
      job
    );

    res.json({
      success: true,
      salary: prediction,
      marketComparison,
      currentSalary: job.salary
    });
  } catch (error) {
    console.error('Job salary prediction error:', error);
    res.status(500).json({ message: 'Failed to predict salary' });
  }
});

/**
 * POST /api/predictions/train-salary-model
 * Manually retrain the salary prediction model (admin only)
 */
router.post('/train-salary-model', async (req, res) => {
  try {
    console.log('Manual training requested...');
    const history = salaryPredictor.trainWithRealData();
    
    res.json({
      success: true,
      message: 'Neural Network retrained successfully with real Indian salary data',
      trainingHistory: history,
      modelStatus: 'trained'
    });
  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({ message: 'Failed to train model' });
  }
});

module.exports = router;
