import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const SavedJobs = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingJobs, setApplyingJobs] = useState(new Set());
  const [removingJobs, setRemovingJobs] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSavedJobs();
  }, [navigate]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/saved-jobs/my-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSavedJobs(data.jobs);
        // Check application status for each job
        checkApplicationStatuses(data.jobs);
      } else {
        setError(data.message || 'Failed to fetch saved jobs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatuses = async (jobsList) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const appliedSet = new Set();

    // Check application status for each job
    for (const job of jobsList) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs/${job._id}/application-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasApplied) {
            appliedSet.add(job._id);
          }
        }
      } catch (error) {
        console.error(`Error checking application status for job ${job._id}:`, error);
      }
    }

    setAppliedJobs(appliedSet);
  };

  const handleQuickApply = async (jobId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to apply for jobs');
      return;
    }

    setApplyingJobs(prev => new Set([...prev, jobId]));

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/quick-apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Application submitted successfully! 🎉');
        setAppliedJobs(prev => new Set([...prev, jobId]));
      } else {
        if (data.requiresResume) {
          toast.error('Please upload your resume before applying to jobs');
        } else {
          toast.error(data.message || 'Failed to apply for job');
        }
      }
    } catch (error) {
      console.error('Quick apply error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setApplyingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const handleRemoveFromSaved = async (jobId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to manage saved jobs');
      return;
    }

    setRemovingJobs(prev => new Set([...prev, jobId]));

    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-jobs/${jobId}/save`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Job removed from saved jobs');
        setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      } else {
        toast.error(data.message || 'Failed to remove job');
      }
    } catch (error) {
      console.error('Remove job error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setRemovingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return 'Salary not specified';
    if (salary.min && salary.max) {
      return `${salary.currency || 'USD'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${salary.currency || 'USD'} ${salary.min.toLocaleString()}+`;
    if (salary.max) return `Up to ${salary.currency || 'USD'} ${salary.max.toLocaleString()}`;
    return 'Salary not specified';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
            Your Saved Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Jobs you've saved for later review and application
          </p>
        </div>

        {/* Back to Jobs Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to All Jobs</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading saved jobs...</h3>
            <p className="text-gray-600">Please wait while we fetch your saved jobs</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading saved jobs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchSavedJobs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && savedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-gray-600 mb-4">Start exploring jobs and save the ones you're interested in</p>
            <button
              onClick={() => navigate('/jobs')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        )}

        {/* Saved Jobs List */}
        {!loading && !error && savedJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {savedJobs.map((job, index) => (
              <div
                key={job._id}
                className="bg-white rounded-xl shadow-lg p-6 hover-lift transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                      {job.employer?.companyLogo ? (
                        <img 
                          src={job.employer.companyLogo} 
                          alt={job.company}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold">
                          {job.company.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                    </div>
                  </div>
                  {job.isPromoted && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {job.description.length > 150 
                    ? `${job.description.substring(0, 150)}...` 
                    : job.description
                  }
                </p>

                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {formatSalary(job.salary)}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                  </span>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 4).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Posted {formatDate(job.createdAt)}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Details</span>
                    </button>
                    
                    <button 
                      onClick={() => handleRemoveFromSaved(job._id)}
                      disabled={removingJobs.has(job._id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        removingJobs.has(job._id) 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {removingJobs.has(job._id) ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </>
                      )}
                    </button>
                    
                    {appliedJobs.has(job._id) ? (
                      <button 
                        disabled
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Applied</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleQuickApply(job._id)}
                        disabled={applyingJobs.has(job._id)}
                        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-lift flex items-center space-x-1 ${
                          applyingJobs.has(job._id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {applyingJobs.has(job._id) ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Quick Apply</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;

