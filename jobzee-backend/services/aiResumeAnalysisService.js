const axios = require('axios');
const FormData = require('form-data');

const LOCAL_AI_SERVICE_URL = 'http://localhost:8001';
const AI_SERVICE_URL =
  process.env.ATS_AI_SERVICE_URL ||
  (process.env.NODE_ENV === 'production'
    ? (process.env.AI_SERVICE_URL || LOCAL_AI_SERVICE_URL)
    : LOCAL_AI_SERVICE_URL);
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 180000);
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 3);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const status = error.response?.status;
  if (!status) return true;
  return status >= 500 || status === 429;
}

async function wakeUpAIService() {
  const maxAttempts = 12;
  const pollMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await axios.get(`${AI_SERVICE_URL}/`, { timeout: 8000 });
      if (attempt > 1) await sleep(2500);
      return;
    } catch (error) {
      if (attempt < maxAttempts) {
        await sleep(pollMs);
        continue;
      }
      throw new Error('AI service is not available right now. Please try again shortly.');
    }
  }
}

async function analyzeResumeWithATS({ fileBuffer, filename, mimeType, jobDescription }) {
  if (!fileBuffer || !filename || !jobDescription) {
    throw new Error('fileBuffer, filename, and jobDescription are required');
  }

  await wakeUpAIService();

  let lastError;
  for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt += 1) {
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename,
      contentType: mimeType || 'application/octet-stream',
    });
    form.append('job_description', jobDescription);

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ats-score`, form, {
        headers: form.getHeaders(),
        timeout: AI_REQUEST_TIMEOUT_MS,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < AI_MAX_RETRIES && isRetryableError(error)) {
        await sleep(1000 * attempt);
        continue;
      }
      break;
    }
  }

  const message =
    lastError?.response?.data?.detail ||
    lastError?.response?.data?.message ||
    lastError?.message ||
    'Unknown AI service error';

  throw new Error(`AI ATS analysis failed: ${message}`);
}

module.exports = {
  analyzeResumeWithATS,
};