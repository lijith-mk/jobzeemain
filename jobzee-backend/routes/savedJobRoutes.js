const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkSavedStatus
} = require('../controllers/savedJobController');

// Save a job for later
router.post('/:id/save', auth, saveJob);

// Remove a job from saved jobs
router.delete('/:id/save', auth, unsaveJob);

// Get user's saved jobs
router.get('/my-jobs', auth, getSavedJobs);

// Check if a job is saved by the user
router.get('/:id/saved-status', auth, checkSavedStatus);

module.exports = router;
