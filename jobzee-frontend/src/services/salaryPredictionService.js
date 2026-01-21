import { API_ENDPOINTS } from '../config/api';

/**
 * Get salary prediction for the logged-in user's profile
 * @returns {Promise<Object>} Salary prediction data
 */
export const getMyProfileSalaryPrediction = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_ENDPOINTS.PREDICTIONS}/salary/my-profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salary prediction');
    }

    return data;
  } catch (error) {
    console.error('Salary prediction error:', error);
    throw error;
  }
};

/**
 * Get salary recommendation for a new job posting
 * @param {Object} jobData - Job details (title, skills, location, etc.)
 * @returns {Promise<Object>} Salary recommendation data
 */
export const getSalaryForNewJob = async (jobData) => {
  try {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      throw new Error('No employer authentication token found');
    }

    const response = await fetch(`${API_ENDPOINTS.PREDICTIONS}/salary/for-job`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salary recommendation');
    }

    return data;
  } catch (error) {
    console.error('Salary recommendation error:', error);
    throw error;
  }
};

/**
 * Get salary prediction for an existing job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Salary prediction and comparison data
 */
export const getSalaryForExistingJob = async (jobId) => {
  try {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      throw new Error('No employer authentication token found');
    }

    const response = await fetch(`${API_ENDPOINTS.PREDICTIONS}/salary/for-job/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch job salary data');
    }

    return data;
  } catch (error) {
    console.error('Job salary data error:', error);
    throw error;
  }
};

/**
 * Format salary for display in Indian Rupees
 * @param {number} salary 
 * @returns {string} Formatted salary string with ₹ symbol
 */
export const formatSalary = (salary) => {
  if (!salary) return 'N/A';
  
  // Format in Indian Rupee (INR) with ₹ symbol
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(salary);
};
