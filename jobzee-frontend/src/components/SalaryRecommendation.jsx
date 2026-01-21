import React, { useState } from 'react';
import { getSalaryForNewJob, formatSalary } from '../services/salaryPredictionService';
import { FaDollarSign, FaSpinner, FaLightbulb, FaChartBar } from 'react-icons/fa';

const SalaryRecommendation = ({ jobData, onSalarySelect }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendation = async () => {
    if (!jobData.title || !jobData.skills || jobData.skills.length === 0) {
      setError('Please provide job title and at least one skill to get salary recommendation');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching salary recommendation with data:', jobData);
      const data = await getSalaryForNewJob({
        title: jobData.title,
        skills: jobData.skills,
        location: jobData.location || 'Remote',
        experienceRequired: jobData.experienceRequired || 'Entry Level',
        education: jobData.education || 'Bachelor',
        category: jobData.category || 'technology'
      });

      console.log('Salary recommendation response:', data);

      // Accept both new and legacy backend responses
      if (data.success && (data.prediction || data.salary)) {
        if (data.prediction) {
          setRecommendation(data.prediction);
        } else {
          // Legacy response mapping: { success, salary, marketComparison }
          const legacy = data.salary;
          const mapped = {
            predictedSalary: legacy?.predicted?.average,
            range: {
              min: legacy?.predicted?.min,
              max: legacy?.predicted?.max,
            },
            marketComparison: {
              averageForRole: data.marketComparison?.marketAverage || legacy?.predicted?.average,
              top25Percent: Math.round((legacy?.predicted?.average || 0) * 1.25),
            },
            breakdown: Array.isArray(legacy?.breakdown)
              ? legacy.breakdown
              : [
                  { factor: 'Base', impact: legacy?.breakdown?.base ? `₹${legacy.breakdown.base}` : 'N/A' },
                  { factor: 'Variable', impact: legacy?.breakdown?.variable ? `₹${legacy.breakdown.variable}` : 'N/A' },
                  { factor: 'Bonus', impact: legacy?.breakdown?.bonus ? `₹${legacy.breakdown.bonus}` : 'N/A' },
                ],
          };
          setRecommendation(mapped);
        }
      } else {
        setError(data.message || 'Failed to get salary recommendation');
      }
    } catch (err) {
      console.error('Salary recommendation error:', err);
      setError(err.message || 'Unable to fetch salary recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applySalaryRange = () => {
    if (recommendation && onSalarySelect) {
      onSalarySelect({
        min: recommendation.range.min,
        max: recommendation.range.max,
        recommended: recommendation.predictedSalary
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <FaDollarSign className="text-purple-600 text-xl mr-2" />
          <h4 className="font-semibold text-gray-800">AI Salary Recommendation</h4>
        </div>
        {!recommendation && !loading && (
          <button
            type="button"
            onClick={fetchRecommendation}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaLightbulb className="mr-2" />
            Get Recommendation
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <FaSpinner className="animate-spin text-purple-600 text-2xl mr-3" />
          <span className="text-gray-600">Analyzing market data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {recommendation && !loading && (
        <div className="space-y-4">
          {/* Main Recommendation */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-500 mb-1">Recommended Annual Salary</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatSalary(recommendation.predictedSalary)}
              </p>
            </div>

            {/* Range */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Minimum</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatSalary(recommendation.range.min)}
                </p>
              </div>
              <div className="text-gray-300 mx-3">|</div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Maximum</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatSalary(recommendation.range.max)}
                </p>
              </div>
            </div>
          </div>

          {/* Market Comparison */}
          {recommendation.marketComparison && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-2">
                <FaChartBar className="text-blue-600 mr-2 text-sm" />
                <h5 className="font-semibold text-gray-800 text-sm">Market Analysis</h5>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-gray-600 mb-1">Market Average</p>
                  <p className="font-semibold text-blue-700">
                    {formatSalary(recommendation.marketComparison.averageForRole)}
                  </p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-gray-600 mb-1">Top 25%</p>
                  <p className="font-semibold text-green-700">
                    {formatSalary(recommendation.marketComparison.top25Percent)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Salary Breakdown */}
          {recommendation.breakdown && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="font-semibold text-gray-800 text-sm mb-3">Salary Factors</h5>
              <div className="space-y-2 text-xs">
                {recommendation.breakdown.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{factor.factor}</span>
                    <span className="font-semibold text-gray-800">{factor.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={applySalaryRange}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
            >
              Use This Range
            </button>
            <button
              type="button"
              onClick={fetchRecommendation}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-gray-500 italic text-center">
            💡 This recommendation is based on current market trends and similar job postings
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryRecommendation;
