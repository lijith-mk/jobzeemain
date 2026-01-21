const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');

// Apply for a job (User only)
router.post('/apply', auth, applicationController.createApplication);

// Get user's applications (User only)
router.get('/my-applications', auth, applicationController.getUserApplications);

// Get specific application (User or Employer who owns the job)
router.get('/:applicationId', auth, applicationController.getApplication);

// Withdraw application (User only)
router.put('/:applicationId/withdraw', auth, applicationController.withdrawApplication);

// Add message to application (User or Employer)
router.post('/:applicationId/message', auth, applicationController.addMessage);

// Employer routes (require employer authentication)
router.use(employerAuth);

// Get all applications for a specific job (Employer only)
router.get('/job/:jobId', applicationController.getJobApplications);

// Update application status (Employer only)
router.put('/:applicationId/status', applicationController.updateApplicationStatus);

// Get application statistics for a job (Employer only)
router.get('/job/:jobId/stats', applicationController.getApplicationStats);

module.exports = router;
