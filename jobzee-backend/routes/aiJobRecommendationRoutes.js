const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAIRecommendedJobs } = require('../services/aiJobRecommendation');

/**
 * GET /api/ai-recommendations
 *
 * Returns AI-powered job recommendations based on the authenticated
 * user's uploaded resume (stored in Cloudinary / MongoDB).
 *
 * Headers: Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "count": 5,
 *   "recommended_jobs": [
 *     { "_id": "...", "title": "MERN Developer", "matchScore": 0.92, ... },
 *     ...
 *   ]
 * }
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendedJobs = await getAIRecommendedJobs(userId);

    return res.status(200).json({
      success: true,
      count: recommendedJobs.length,
      recommended_jobs: recommendedJobs,
    });
  } catch (error) {
    const isClientError =
      error.message.includes('No resume') ||
      error.message.includes('User not found') ||
      error.message.includes('No active jobs');

    const status = isClientError ? 400 : 500;

    console.error('[AI Recommendation] Error:', error.message);

    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to get AI job recommendations',
    });
  }
});

module.exports = router;
