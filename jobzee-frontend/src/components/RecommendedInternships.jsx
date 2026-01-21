import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import JobDetailsModal from './JobDetailsModal';

const RecommendedInternships = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('internships');
  const [algorithm, setAlgorithm] = useState('knn'); // 'knn' or 'naive_bayes'
  const [internshipRecommendations, setInternshipRecommendations] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [basedOn, setBasedOn] = useState('popular');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    fetchInternshipRecommendations();
    fetchJobRecommendations();
  }, [algorithm]);

  const fetchInternshipRecommendations = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      if (!token) return;

      const endpoint = algorithm === 'naive_bayes' 
        ? `${API_BASE_URL}/api/recommendations/internships/personalized-nb?limit=6`
        : `${API_BASE_URL}/api/recommendations/internships/personalized?limit=6`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInternshipRecommendations(data.recommendations || []);
        setBasedOn(data.basedOn || 'popular');
      }
    } catch (error) {
      console.error('Error fetching internship recommendations:', error);
    }
  };

  const fetchJobRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const endpoint = algorithm === 'naive_bayes'
        ? `${API_BASE_URL}/api/recommendations/jobs/personalized-nb?limit=6`
        : `${API_BASE_URL}/api/recommendations/jobs/personalized?limit=6`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStipend = (stipend, isUnpaid) => {
    if (isUnpaid) return 'Unpaid';
    if (!stipend || !stipend.amount) return 'Not specified';
    
    const symbol = stipend.currency === 'USD' ? '$' : stipend.currency === 'EUR' ? '€' : '₹';
    return `${symbol}${stipend.amount.toLocaleString()}/${stipend.period || 'month'}`;
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    if (typeof salary === 'string') return salary;
    if (salary.min && salary.max) {
      return `₹${salary.min.toLocaleString()} - ₹${salary.max.toLocaleString()}`;
    }
    return salary.min ? `₹${salary.min.toLocaleString()}+` : 'Not specified';
  };

  const handleJobClick = async (jobId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data.job);
        setShowJobModal(true);
      } else {
        console.error('Failed to fetch job details');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    }
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  const recommendations = activeTab === 'internships' ? internshipRecommendations : jobRecommendations;
  const emptyMessage = activeTab === 'internships' 
    ? 'Apply to internships to unlock AI-powered recommendations'
    : 'Apply to jobs to unlock AI-powered recommendations';
  const browseLink = activeTab === 'internships' ? '/internships' : '/jobs';
  const browseText = activeTab === 'internships' ? 'Browse Internships' : 'Browse Jobs';

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h3>
                <p className="text-sm text-gray-600">Choose algorithm and see personalized results</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Algorithm:</span>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              >
                <option value="knn">KNN</option>
                <option value="naive_bayes">Naive Bayes</option>
              </select>
            </div>
          </div>

          {/* Tabs (still visible when empty) */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'internships'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Internships (0)
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Jobs (0)
            </button>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h6m-6 0H6m0 0v6m0 0v6m0-6h6m-6 0H0" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 mb-6">{emptyMessage}</p>
          <button
            onClick={() => navigate(browseLink)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {browseText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h3>
              <p className="text-sm text-gray-600">
                {basedOn === 'application_history' 
                  ? `Personalized using ${algorithm === 'knn' ? 'KNN' : 'Naive Bayes'} Algorithm`
                  : 'Curated opportunities selected for you'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(browseLink)}
            className="hidden md:block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            View All
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'internships'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Internships ({internshipRecommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Jobs ({jobRecommendations.length})
            </button>
          </div>
          
          {/* Algorithm Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Algorithm:</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              <option value="knn">KNN</option>
              <option value="naive_bayes">Naive Bayes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item, index) => {
            const isInternship = activeTab === 'internships';
            
            const handleClick = () => {
              if (isInternship) {
                navigate(`/internships/${item._id}`);
              } else {
                handleJobClick(item._id);
              }
            };
            
            return (
              <div
                key={item._id}
                onClick={handleClick}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-blue-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors flex-1 line-clamp-2">
                    {item.title}
                  </h4>
                  {item.recommendationScore && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex-shrink-0">
                      {item.recommendationScore}%
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 font-medium mb-4">
                  {item.companyName || item.company || item.employer?.companyName}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{item.location}</span>
                  </div>
                  
                  {isInternship ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{item.duration} months</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h6m-6 0H6m0 0v6m0 0v6m0-6h6m-6 0H0" />
                      </svg>
                      <span className="capitalize">{item.type || 'Full-time'}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-700 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>{isInternship ? formatStipend(item.stipend, item.isUnpaid) : formatSalary(item.salary)}</span>
                  </div>
                </div>

                {item.skills && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {item.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        +{item.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {item.applicationsCount || 0} applicants
                  </span>
                  <span className="text-blue-600 font-medium text-sm group-hover:text-blue-700">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="text-center">
          <button
            onClick={() => navigate(browseLink)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {activeTab === 'internships' ? 'Explore All Internships' : 'Explore All Jobs'}
          </button>
        </div>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal 
        job={selectedJob}
        isOpen={showJobModal}
        onClose={closeJobModal}
      />
    </div>
  );
};

export default RecommendedInternships;
