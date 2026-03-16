/**
 * AI Job Recommendation Service
 *
 * Bridges the MERN backend to the Python FastAPI AI microservice.
 * Flow:
 *   1. Fetch user's resume URL from MongoDB
 *   2. Download resume PDF from Cloudinary
 *   3. Fetch all active jobs from MongoDB
 *   4. Send resume + job descriptions to the Python AI service
 *   5. Return top recommended jobs with similarity scores
 */

const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const Job = require('../models/Job');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const TOP_K = 10;
const AI_REQUEST_TIMEOUT_MS = 180000;
const AI_MAX_RETRIES = 3;

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _isRetryableError(error) {
  const status = error.response?.status;
  if (!status) return true;
  return status >= 500 || status === 429;
}

/**
 * Wake up the Render free-tier AI service before sending the heavy inference request.
 * Render spins down idle free services; the first request after idle can take 1-3 minutes.
 * This polls /health until the service responds, absorbing the cold-start wait.
 */
async function _wakeUpAIService() {
  const MAX_ATTEMPTS = 18;   // 18 × 10 s = 3 min max
  const POLL_MS = 10000;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 8000 });
      // If we had to wait (service was asleep), give the model a moment to finish loading
      if (i > 1) await _sleep(4000);
      return; // service is alive
    } catch {
      if (i < MAX_ATTEMPTS) await _sleep(POLL_MS);
    }
  }
  throw new Error('AI service did not become available in time. Please try again in a minute.');
}

/**
 * Download a remote file and return it as a Buffer.
 * Using responseType: 'arraybuffer' avoids buffering issues with streams.
 */
async function _downloadResume(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error('Failed to download resume from the stored URL');
  }
}

/**
 * Call the Python AI microservice with the resume PDF and job list.
 *
 * @param {Buffer}  resumeBuffer  - Raw bytes of the PDF file
 * @param {Array}   jobs          - Array of { _id, title, description }
 * @returns {Array} recommended_jobs from the AI service
 */
async function _callAIService(resumeBuffer, jobs) {
  const jobList = jobs.map((job) => ({
    title: job.title,
    description: job.description || job.title,  // fallback if description is empty
  }));

  const form = new FormData();
  form.append('resume', resumeBuffer, {
    filename: 'resume.pdf',
    contentType: 'application/pdf',
  });
  form.append('job_list', JSON.stringify(jobList));
  form.append('top_k', String(TOP_K));

  let lastError;
  for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/recommend-jobs`,
        form,
        {
          headers: form.getHeaders(),
          timeout: AI_REQUEST_TIMEOUT_MS,
        }
      );

      return response.data.recommended_jobs; // [{ title, score }, ...]
    } catch (error) {
      lastError = error;
      if (attempt < AI_MAX_RETRIES && _isRetryableError(error)) {
        await _sleep(1200 * attempt);
        continue;
      }
      break;
    }
  }

  const message = lastError?.response?.data?.detail || lastError?.message || 'Unknown error';
  throw new Error(`AI recommendation service failed: ${message}`);
}

/**
 * Main exported function — used by the route controller.
 *
 * @param {string} userId - Authenticated user's MongoDB _id
 * @returns {Array} Top recommended jobs, each enriched with full job data + score
 */
async function getAIRecommendedJobs(userId) {
  // Step 1 – fetch user and their resume URL
  const user = await User.findById(userId).select('resume name');
  if (!user) {
    throw new Error('User not found');
  }
  if (!user.resume) {
    throw new Error('No resume found. Please upload your resume first.');
  }

  // Step 2 – download resume PDF from Cloudinary
  const resumeBuffer = await _downloadResume(user.resume);

  // Step 3 – fetch all live jobs from the database
  const jobs = await Job.find({
    status: { $in: ['active', 'approved'] },
    expiresAt: { $gt: new Date() },
  })
    .select('_id title description skills location jobType experienceLevel salary company')
    .lean();

  if (!jobs || jobs.length === 0) {
    throw new Error('No live jobs found in the database');
  }

  // Step 4 – wake up AI service (handles Render free-tier cold starts), then call
  await _wakeUpAIService();
  const aiResults = await _callAIService(resumeBuffer, jobs);

  // Step 5 – enrich AI results with full job data from the DB
  // Build a title → job map for quick lookup (last win if duplicate titles)
  const titleToJob = {};
  for (const job of jobs) {
    titleToJob[job.title] = job;
  }

  const recommended = aiResults
    .map((result) => {
      const jobData = titleToJob[result.title];
      if (!jobData) return null;
      return {
        ...jobData,
        matchScore: result.score,
      };
    })
    .filter(Boolean);

  return recommended;
}

module.exports = { getAIRecommendedJobs };
