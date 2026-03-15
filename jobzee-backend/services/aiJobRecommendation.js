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

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/recommend-jobs`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000,
      }
    );

    return response.data.recommended_jobs; // [{ title, score }, ...]
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    throw new Error(`AI recommendation service failed: ${message}`);
  }
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

  // Step 4 – send to Python AI service → get scored job titles
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
