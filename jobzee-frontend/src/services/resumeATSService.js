import { API_ENDPOINTS } from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyzeResumeATS = async (resumeFile, jobDescription) => {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jobDescription', jobDescription);

  const response = await fetch(`${API_ENDPOINTS.RESUME_ATS}/analyze`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to analyze resume');
  }

  return data;
};

export const getResumeATSHistory = async () => {
  const response = await fetch(`${API_ENDPOINTS.RESUME_ATS}/my-analyses`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch ATS history');
  }

  return data;
};

export const getResumeATSAnalysis = async (analysisId) => {
  const response = await fetch(`${API_ENDPOINTS.RESUME_ATS}/${analysisId}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch ATS analysis');
  }

  return data;
};