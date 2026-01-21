import React, { useState, useEffect } from 'react';
import { getSalaryForExistingJob, formatSalary } from '../services/salaryPredictionService';
import { FaDollarSign, FaSpinner, FaInfoCircle, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const SalaryInsights = ({ jobId, jobTitle, currentSalary }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobId) {
      fetchSalaryInsights();
    }
  }, [jobId]);

  const fetchSalaryInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalaryForExistingJob(jobId);
      if (data.success) {
        setInsights(data);
      } else {
        setError(data.message || 'Failed to load salary insights');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitivenessStatus = () => {
    if (!insights || !insights.comparison) return null;

    const { comparison } = insights;
    if (comparison.status === 'competitive') {
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✓',
        label: 'Competitive',
        message: 'Your salary range is competitive with the market'
      };
    } else if (comparison.status === 'above') {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '↑',
        label: 'Above Market',
        message: 'Your salary is above market average - great for attracting talent!'
      };
    } else {
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '↓',
        label: 'Below Market',
        message: 'Consider increasing salary to stay competitive'
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin text-blue-600 text-xl mr-2" />
          <span className="text-gray-600 text-sm">Loading salary insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
        <div className="flex items-center text-red-600 mb-2">
          <FaInfoCircle className="mr-2" />
          <span className="font-semibold text-sm">Unable to load insights</span>
        </div>
        <p className="text-gray-600 text-xs">{error}</p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const status = getCompetitivenessStatus();

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaDollarSign className="text-indigo-600 text-lg mr-2" />
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">Salary Analysis</h4>
            <p className="text-xs text-gray-500">{jobTitle}</p>
          </div>
        </div>
        {status && (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
            {status.icon} {status.label}
          </span>
        )}
      </div>

      {/* Current vs Predicted Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Your Salary</p>
          <p className="text-lg font-bold text-gray-800">
            {formatSalary(currentSalary?.min)} - {formatSalary(currentSalary?.max)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Market Recommended</p>
          <p className="text-lg font-bold text-indigo-600">
            {formatSalary(insights.prediction?.predictedSalary)}
          </p>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`${status.color} rounded-lg p-3 mb-4 text-xs`}>
          {status.message}
        </div>
      )}

      {/* Market Comparison Details */}
      {insights.comparison && (
        <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
          <div className="flex items-center mb-2">
            <FaChartLine className="text-blue-600 mr-2 text-sm" />
            <h5 className="font-semibold text-gray-800 text-xs">Market Benchmarks</h5>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Market Average:</span>
              <span className="font-semibold text-gray-800">
                {formatSalary(insights.comparison.marketAverage)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Your Difference:</span>
              <span className={`font-semibold ${
                insights.comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {insights.comparison.difference >= 0 ? '+' : ''}
                {formatSalary(Math.abs(insights.comparison.difference))}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Percentile:</span>
              <span className="font-semibold text-blue-600">
                {insights.comparison.percentile}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center mb-2">
            <FaExclamationTriangle className="text-yellow-600 mr-2 text-sm" />
            <h5 className="font-semibold text-gray-800 text-xs">Recommendations</h5>
          </div>
          <ul className="space-y-1">
            {insights.recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchSalaryInsights}
        className="w-full mt-3 py-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        Refresh Analysis
      </button>
    </div>
  );
};

export default SalaryInsights;
