const express = require('express');
const router = express.Router();
const { employerAuth } = require('../middleware/employerAuth');
const userAuth = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');

// Candidate routes (user auth)
// GET /api/interviews/my
router.get('/my', userAuth, interviewController.listCandidateInterviews);
// PATCH /api/interviews/:id/respond
router.patch('/:id/respond', userAuth, interviewController.respondToInterview);

// Employer routes below require employer auth
router.use(employerAuth);
// POST /api/interviews/:applicationId/schedule
router.post('/:applicationId/schedule', interviewController.scheduleInterview);

// POST /api/interviews
router.post('/', interviewController.createInterview);

// GET /api/interviews (list for employer)
router.get('/', interviewController.listEmployerInterviews);

// GET /api/interviews/employer/:employerId
router.get('/employer/:employerId', interviewController.listByEmployerId);

module.exports = router;


