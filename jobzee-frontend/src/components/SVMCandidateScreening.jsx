import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';

const SVMCandidateScreening = ({ jobId, jobTitle, type = 'job' }) => {
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchScreening = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerToken');
      
      const endpoint = type === 'job' 
        ? `${API_ENDPOINTS.SCREENING}/job/${jobId}/candidates`
        : `${API_ENDPOINTS.SCREENING}/internship/${jobId}/candidates`;

      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setScreening(data);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to fetch screening data');
      }
    } catch (err) {
      console.error('Error fetching screening:', err);
      toast.error('Network error while fetching AI screening');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchScreening();
    }
  }, [jobId]);

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'excellent':
        return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-800';
      case 'good':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 text-blue-800';
      case 'average':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-800';
      case 'below-average':
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 text-orange-800';
      case 'poor':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getFeatureBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Running AI candidate screening...</span>
        </div>
      </div>
    );
  }

  if (!screening || !screening.candidates || screening.candidates.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-gray-600">No candidates to screen yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-2xl font-bold">AI Candidate Screening</h2>
            </div>
            <p className="text-white/80 text-sm">
              Powered by Support Vector Machine (SVM) Algorithm
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/70 text-xs mb-1">Total</div>
            <div className="text-2xl font-bold">{screening.stats?.total || 0}</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/70 text-xs mb-1">Excellent</div>
            <div className="text-2xl font-bold">{screening.stats?.excellent || 0}</div>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/70 text-xs mb-1">Good</div>
            <div className="text-2xl font-bold">{screening.stats?.good || 0}</div>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/70 text-xs mb-1">Average</div>
            <div className="text-2xl font-bold">{screening.stats?.average || 0}</div>
          </div>
          <div className="bg-gray-500/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/70 text-xs mb-1">Avg Score</div>
            <div className="text-2xl font-bold">{screening.stats?.averageScore || 0}%</div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="divide-y divide-gray-100">
        {screening.candidates.slice(0, showDetails ? undefined : 5).map((candidate, index) => (
          <div
            key={candidate._id || candidate.applicationId || index}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  candidate.aiScreening.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg' :
                  candidate.aiScreening.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-md' :
                  candidate.aiScreening.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-md' :
                  'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
                }`}>
                  {candidate.aiScreening.rank}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {candidate.name || 'Unknown'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getClassificationColor(candidate.aiScreening.classification)}`}>
                      {candidate.aiScreening.badge}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{candidate.email || 'No email'}</p>

                  {/* AI Score */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Match Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(candidate.aiScreening.score)}`}>
                        {candidate.aiScreening.score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          candidate.aiScreening.score >= 85 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                          candidate.aiScreening.score >= 70 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                          candidate.aiScreening.score >= 55 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                          candidate.aiScreening.score >= 40 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                          'bg-gradient-to-r from-red-400 to-rose-500'
                        }`}
                        style={{ width: `${candidate.aiScreening.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Feature Breakdown */}
                  {showDetails && candidate.aiScreening.features && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                      {Object.entries(candidate.aiScreening.features).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600 capitalize mb-1">
                            {key === 'title' ? 'Job Title' : key}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${getFeatureBarColor(value)}`}
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strengths & Gaps */}
                  {showDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {candidate.aiScreening.strengths && candidate.aiScreening.strengths.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {candidate.aiScreening.strengths.map((strength, idx) => (
                              <li key={idx} className="text-xs text-emerald-700 flex items-start">
                                <span className="mr-1">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {candidate.aiScreening.gaps && candidate.aiScreening.gaps.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-orange-800 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-1">
                            {candidate.aiScreening.gaps.map((gap, idx) => (
                              <li key={idx} className="text-xs text-orange-700 flex items-start">
                                <span className="mr-1">•</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className={`rounded-lg p-3 text-sm border-l-4 ${
                    candidate.aiScreening.classification === 'excellent' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' :
                    candidate.aiScreening.classification === 'good' ? 'bg-blue-50 border-blue-500 text-blue-800' :
                    candidate.aiScreening.classification === 'average' ? 'bg-amber-50 border-amber-500 text-amber-800' :
                    'bg-gray-50 border-gray-500 text-gray-800'
                  }`}>
                    <div className="font-semibold mb-1">AI Recommendation:</div>
                    <div>{candidate.aiScreening.recommendation}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {!showDetails && screening.candidates.length > 5 && (
        <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
          <button
            onClick={() => setShowDetails(true)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-2 mx-auto"
          >
            <span>Show all {screening.candidates.length} screened candidates</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Algorithm Info */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-start space-x-2 text-xs text-gray-600">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            This AI screening uses Support Vector Machine (SVM) to analyze candidate profiles against job requirements.
            Scores are based on skills match (35%), experience (20%), education (15%), professional title (15%), location (8%), and profile completeness (7%).
          </p>
        </div>
      </div>
    </div>
  );
};

export default SVMCandidateScreening;
