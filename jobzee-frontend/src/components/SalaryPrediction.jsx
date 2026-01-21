import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getMyProfileSalaryPrediction, formatSalary } from '../services/salaryPredictionService';
import { FaDollarSign, FaChartLine, FaInfoCircle, FaTimes, FaSpinner } from 'react-icons/fa';

const SalaryPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSalaryPrediction();
  }, []);

  const fetchSalaryPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfileSalaryPrediction();
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.message || 'Failed to load salary prediction');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load salary prediction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    const badges = {
      high: { color: 'bg-green-100 text-green-800 border-green-300', label: 'High Confidence' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium Confidence' },
      low: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Low Confidence' }
    };
    return badges[confidence] || badges.medium;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-600 text-3xl mr-3" />
          <span className="text-gray-600">Loading salary prediction...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center text-red-600 mb-4">
          <FaInfoCircle className="mr-2" />
          <span className="font-semibold">Unable to load salary prediction</span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchSalaryPrediction}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const confidenceBadge = getConfidenceBadge(prediction.confidence);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaDollarSign className="text-blue-600 text-2xl mr-3" />
          <h3 className="text-xl font-bold text-gray-800">AI Salary Prediction</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceBadge.color}`}>
          {confidenceBadge.label}
        </span>
      </div>

      {/* Main Salary Display */}
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">Estimated Annual Salary</p>
          <p className="text-4xl font-bold text-blue-600">
            {formatSalary(prediction.predictedSalary)}
          </p>
        </div>

        {/* Salary Range */}
        <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Min Range</p>
            <p className="text-lg font-semibold text-gray-700">
              {formatSalary(prediction.range.min)}
            </p>
          </div>
          <div className="text-gray-400">—</div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Max Range</p>
            <p className="text-lg font-semibold text-gray-700">
              {formatSalary(prediction.range.max)}
            </p>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      {prediction.marketInsights && (
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center mb-3">
            <FaChartLine className="text-green-600 mr-2" />
            <h4 className="font-semibold text-gray-800">Market Comparison</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {prediction.marketInsights.aboveMarket || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Above Market</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {prediction.marketInsights.competitive || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Competitive</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {prediction.marketInsights.belowMarket || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Below Market</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Details Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center justify-center"
      >
        <FaInfoCircle className="mr-2" />
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Additional Details */}
      {showDetails && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="flex items-start">
              <span className="font-semibold mr-2">💡</span>
              This prediction is based on your skills, experience, education, and location using our AI neural network model.
            </p>
            <p className="flex items-start">
              <span className="font-semibold mr-2">📊</span>
              Keep your profile updated with new skills and certifications to improve accuracy.
            </p>
            <p className="flex items-start">
              <span className="font-semibold mr-2">🎯</span>
              Use this as a reference when negotiating salaries with potential employers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPrediction;
