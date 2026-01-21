import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const SuccessPrediction = ({ jobId, internshipId, type = 'job' }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrediction();
  }, [jobId, internshipId]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to see match prediction');
        setLoading(false);
        return;
      }

      const id = type === 'job' ? jobId : internshipId;
      const endpoint = type === 'job' 
        ? `${API_BASE_URL}/api/predictions/job-success/${id}`
        : `${API_BASE_URL}/api/predictions/internship-success/${id}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
      } else {
        setError('Unable to calculate match score');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating match score...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center text-gray-500">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  // Get color based on category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'excellent':
        return {
          bg: 'from-green-500 to-emerald-600',
          light: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: '🎯'
        };
      case 'good':
        return {
          bg: 'from-blue-500 to-blue-600',
          light: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: '👍'
        };
      case 'moderate':
        return {
          bg: 'from-yellow-500 to-amber-600',
          light: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: '⚡'
        };
      case 'low':
        return {
          bg: 'from-orange-500 to-orange-600',
          light: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          icon: '⚠️'
        };
      default:
        return {
          bg: 'from-red-500 to-red-600',
          light: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: '❌'
        };
    }
  };

  const colors = getCategoryColor(prediction.category);

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.light} p-6 shadow-sm`}>
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-r ${colors.bg} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
            {prediction.successProbability}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Match Score</h3>
            <p className="text-sm text-gray-600">AI-Powered Prediction</p>
          </div>
        </div>
        <span className="text-3xl">{colors.icon}</span>
      </div>

      {/* Recommendation */}
      <div className={`p-3 rounded-lg ${colors.light} border ${colors.border} mb-4`}>
        <p className={`text-sm font-medium ${colors.text}`}>{prediction.recommendation}</p>
      </div>

      {/* Factors Breakdown */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Match Breakdown:</h4>
        
        {Object.entries(prediction.factors).map(([key, value]) => {
          const label = key.replace('Match', '');
          const labelText = label.charAt(0).toUpperCase() + label.slice(1);
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{labelText}</span>
                <span className={`font-semibold ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {value}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    value >= 80 ? 'bg-green-500' : 
                    value >= 60 ? 'bg-blue-500' : 
                    'bg-orange-500'
                  }`}
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths */}
      {prediction.strengths && prediction.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">💪 Your Strengths:</h4>
          <div className="flex flex-wrap gap-2">
            {prediction.strengths.map((strength, index) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {prediction.improvements && prediction.improvements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">📈 Areas to Improve:</h4>
          <div className="flex flex-wrap gap-2">
            {prediction.improvements.map((improvement, index) => (
              <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {improvement.charAt(0).toUpperCase() + improvement.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Feedback */}
      {prediction.feedback && prediction.feedback.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Suggestions:</h4>
          <div className="space-y-2">
            {prediction.feedback.map((item, index) => (
              <div key={index} className={`p-2 rounded-lg text-sm ${
                item.status === 'strong' ? 'bg-green-50 text-green-700' :
                item.status === 'needs_improvement' ? 'bg-orange-50 text-orange-700' :
                'bg-yellow-50 text-yellow-700'
              }`}>
                <span className="font-medium">{item.area}:</span> {item.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by Decision Tree Algorithm • {prediction.confidence} confidence
        </p>
      </div>
    </div>
  );
};

export default SuccessPrediction;
