import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const TestPerformanceMonitor = ({ tests }) => {
  const [statistics, setStatistics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [selectedTestFilter, setSelectedTestFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [gradingMode, setGradingMode] = useState(false);
  const [questionGrades, setQuestionGrades] = useState({});
  const [savingGrades, setSavingGrades] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchAttempts();
  }, [selectedTestFilter, page]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = selectedTestFilter
        ? `${API_BASE_URL}/api/admin/tests/statistics?testId=${selectedTestFilter}`
        : `${API_BASE_URL}/api/admin/tests/statistics`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStatistics(data.statistics);
      } else {
        toast.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
      toast.error('Network error');
    }
  };

  const fetchAttempts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = selectedTestFilter
        ? `${API_BASE_URL}/api/admin/tests/attempts?testId=${selectedTestFilter}&page=${page}&limit=20`
        : `${API_BASE_URL}/api/admin/tests/attempts?page=${page}&limit=20`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch attempts');
      }
    } catch (error) {
      console.error('Fetch attempts error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const viewAttemptDetails = async (attempt) => {
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setGradingMode(false);
    setQuestionGrades({});

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/attempts/${attempt._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAttemptDetails(data.result);
        
        // Initialize grades for coding/essay questions
        const initialGrades = {};
        data.result.questionResults?.forEach(q => {
          if (q.questionType === 'coding' || q.questionType === 'essay') {
            initialGrades[q.questionId] = {
              marksObtained: q.marksObtained || 0,
              gradingNotes: q.gradingNotes || ''
            };
          }
        });
        setQuestionGrades(initialGrades);
      } else {
        toast.error('Failed to fetch attempt details');
      }
    } catch (error) {
      console.error('Fetch attempt details error:', error);
      toast.error('Network error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const saveGrades = async () => {
    if (!attemptDetails) return;

    setSavingGrades(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare grades array
      const gradesToSubmit = Object.entries(questionGrades).map(([questionId, grade]) => ({
        questionId,
        marksObtained: parseFloat(grade.marksObtained) || 0,
        gradingNotes: grade.gradingNotes || ''
      }));

      const res = await fetch(`${API_BASE_URL}/api/admin/tests/attempts/${attemptDetails._id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionGrades: gradesToSubmit }),
      });

      if (res.ok) {
        toast.success('Grades updated successfully!');
        setGradingMode(false);
        // Refresh attempt details
        viewAttemptDetails(selectedAttempt);
        // Refresh attempts list
        fetchAttempts();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update grades');
      }
    } catch (error) {
      console.error('Save grades error:', error);
      toast.error('Network error');
    } finally {
      setSavingGrades(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Test
        </label>
        <select
          value={selectedTestFilter}
          onChange={(e) => {
            setSelectedTestFilter(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Tests</option>
          {tests.map((test) => (
            <option key={test._id} value={test._id}>
              {test.title}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{statistics.totalTests}</div>
              <div className="text-sm text-gray-600 mt-1">Total Tests</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{statistics.totalAttempts}</div>
              <div className="text-sm text-gray-600 mt-1">Total Attempts</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{statistics.averagePercentage}%</div>
              <div className="text-sm text-gray-600 mt-1">Avg Score</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{statistics.passRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Pass Rate</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{statistics.failedAttempts}</div>
              <div className="text-sm text-gray-600 mt-1">Failed</div>
            </div>
          </div>

          {/* Per-Test Breakdown */}
          {statistics.testBreakdown && statistics.testBreakdown.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Test-wise Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Test
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attempts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pass Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Passed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Failed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statistics.testBreakdown.map((stat) => (
                      <tr key={stat.testId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {stat.testTitle}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{stat.attempts}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{stat.averageScore}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            parseFloat(stat.passRate) >= 70
                              ? 'bg-green-100 text-green-800'
                              : parseFloat(stat.passRate) >= 50
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stat.passRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                          {stat.passed}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {stat.failed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Attempts */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recent Attempts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tab Switches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No attempts found
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.userId?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {attempt.userId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attempt.testTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(attempt.completedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {attempt.score} / {attempt.totalMarks}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        attempt.percentage >= 75
                          ? 'text-green-600'
                          : attempt.percentage >= 50
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {attempt.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTime(attempt.timeTaken)}
                      {attempt.autoSubmit && (
                        <span className="ml-1 text-xs text-orange-600">(auto)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {attempt.fraudDetected ? (
                        <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white border border-red-700">
                          🚨 FRAUD
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          attempt.passed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${
                          attempt.fraudDetected
                            ? 'text-red-600'
                            : (attempt.tabSwitchCount || 0) === 0
                            ? 'text-green-600'
                            : (attempt.tabSwitchCount || 0) < 3
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {attempt.tabSwitchCount || 0}
                        </span>
                        {attempt.fraudDetected && (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24" title="FRAUD DETECTED">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          </svg>
                        )}
                        {attempt.suspiciousActivity && !attempt.fraudDetected && (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Flagged as suspicious">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewAttemptDetails(attempt)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page === pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attempt Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-white flex-1">
                  <h2 className="text-2xl font-bold">Test Attempt Details</h2>
                  {selectedAttempt && (
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedAttempt.userId?.name} - {selectedAttempt.testTitle}
                    </p>
                  )}
                </div>
                
                {/* Grading Status & Controls */}
                {attemptDetails && (attemptDetails.gradingStatus === 'pending-review' || attemptDetails.gradingStatus === 'graded') && (
                  <div className="flex items-center gap-3 mr-4">
                    {!gradingMode ? (
                      <>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          attemptDetails.gradingStatus === 'graded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {attemptDetails.gradingStatus === 'graded' ? 'Graded' : 'Pending Review'}
                        </span>
                        {attemptDetails.gradingStatus === 'pending-review' && (
                          <button
                            onClick={() => setGradingMode(true)}
                            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                          >
                            Grade Now
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={saveGrades}
                          disabled={savingGrades}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {savingGrades ? 'Saving...' : 'Save Grades'}
                        </button>
                        <button
                          onClick={() => setGradingMode(false)}
                          disabled={savingGrades}
                          className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setAttemptDetails(null);
                    setSelectedAttempt(null);
                    setGradingMode(false);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading details...</p>
                </div>
              ) : attemptDetails ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Score</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {attemptDetails.score}/{attemptDetails.totalMarks}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Percentage</p>
                      <p className="text-2xl font-bold text-green-900">{attemptDetails.percentage}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">Correct</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {attemptDetails.correctAnswers}/{attemptDetails.totalQuestions}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-600 font-medium">Time Taken</p>
                      <p className="text-2xl font-bold text-orange-900">{formatTime(attemptDetails.timeTaken)}</p>
                    </div>
                  </div>

                  {/* Questions and Answers */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Question-wise Analysis</h3>
                    <div className="space-y-4">
                      {attemptDetails.questionResults?.map((qResult, index) => (
                        <div
                          key={qResult.questionId || index}
                          className={`border-2 rounded-lg p-5 ${
                            qResult.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-700 border-2 border-gray-300">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium mb-2">{qResult.questionText}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full font-semibold text-sm ${
                                    qResult.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                  }`}>
                                    {qResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                  </span>
                                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                                    {qResult.questionType?.toUpperCase() || 'MCQ'}
                                  </span>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {qResult.marksObtained}/{qResult.marks} marks
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Answer Details based on Question Type */}
                          <div className="ml-11 space-y-3">
                            {/* MCQ and True-False */}
                            {(qResult.questionType === 'mcq' || qResult.questionType === 'true-false' || !qResult.questionType) && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[140px]">User's Answer:</span>
                                  <span className={`font-medium ${
                                    qResult.userAnswer === 'Not Attempted'
                                      ? 'text-gray-500 italic'
                                      : qResult.isCorrect
                                      ? 'text-green-700'
                                      : 'text-red-700'
                                  }`}>
                                    {qResult.userAnswer}
                                  </span>
                                </div>
                                {!qResult.isCorrect && qResult.correctAnswer !== 'Manual Grading Required' && (
                                  <div className="flex items-start gap-2">
                                    <span className="font-semibold text-gray-700 min-w-[140px]">Correct Answer:</span>
                                    <span className="text-green-700 font-medium">{qResult.correctAnswer}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Coding Questions */}
                            {qResult.questionType === 'coding' && (
                              <div className="space-y-3">
                                <div>
                                  <span className="font-semibold text-gray-700 block mb-2">User's Solution:</span>
                                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-60">
                                    {qResult.userAnswer === 'Not Attempted' ? (
                                      <span className="text-gray-500 italic">Not Attempted</span>
                                    ) : (
                                      qResult.userAnswer
                                    )}
                                  </pre>
                                </div>
                                {qResult.codingDetails?.expectedSolution && (
                                  <div>
                                    <span className="font-semibold text-gray-700 block mb-2">Expected Solution:</span>
                                    <pre className="bg-blue-900 text-blue-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-60">
                                      {qResult.codingDetails.expectedSolution}
                                    </pre>
                                  </div>
                                )}

                                {/* Grading Interface for Coding */}
                                {gradingMode && (
                                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-3">Grade This Answer</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Marks Obtained (out of {qResult.marks})
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max={qResult.marks}
                                          step="0.5"
                                          value={questionGrades[qResult.questionId]?.marksObtained || 0}
                                          onChange={(e) => setQuestionGrades({
                                            ...questionGrades,
                                            [qResult.questionId]: {
                                              ...questionGrades[qResult.questionId],
                                              marksObtained: e.target.value
                                            }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Grading Notes (Optional)
                                        </label>
                                        <textarea
                                          value={questionGrades[qResult.questionId]?.gradingNotes || ''}
                                          onChange={(e) => setQuestionGrades({
                                            ...questionGrades,
                                            [qResult.questionId]: {
                                              ...questionGrades[qResult.questionId],
                                              gradingNotes: e.target.value
                                            }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                          rows="2"
                                          placeholder="Add feedback for the student..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Essay Questions */}
                            {qResult.questionType === 'essay' && (
                              <div className="space-y-3">
                                <div>
                                  <span className="font-semibold text-gray-700 block mb-2">User's Answer:</span>
                                  <div className="bg-white border-2 border-gray-300 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {qResult.userAnswer === 'Not Attempted' ? (
                                      <span className="text-gray-500 italic">Not Attempted</span>
                                    ) : (
                                      qResult.userAnswer
                                    )}
                                  </div>
                                  {qResult.userAnswer !== 'Not Attempted' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Word count: {qResult.userAnswer.split(' ').filter(w => w).length} words
                                      {qResult.essayDetails?.wordLimit && ` / ${qResult.essayDetails.wordLimit} max`}
                                    </p>
                                  )}
                                </div>
                                {qResult.essayDetails?.expectedAnswer && (
                                  <div>
                                    <span className="font-semibold text-gray-700 block mb-2">Model Answer:</span>
                                    <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                                      {qResult.essayDetails.expectedAnswer}
                                    </div>
                                  </div>
                                )}

                                {/* Grading Interface for Essay */}
                                {gradingMode && (
                                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-3">Grade This Answer</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Marks Obtained (out of {qResult.marks})
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max={qResult.marks}
                                          step="0.5"
                                          value={questionGrades[qResult.questionId]?.marksObtained || 0}
                                          onChange={(e) => setQuestionGrades({
                                            ...questionGrades,
                                            [qResult.questionId]: {
                                              ...questionGrades[qResult.questionId],
                                              marksObtained: e.target.value
                                            }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Grading Notes (Optional)
                                        </label>
                                        <textarea
                                          value={questionGrades[qResult.questionId]?.gradingNotes || ''}
                                          onChange={(e) => setQuestionGrades({
                                            ...questionGrades,
                                            [qResult.questionId]: {
                                              ...questionGrades[qResult.questionId],
                                              gradingNotes: e.target.value
                                            }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                          rows="2"
                                          placeholder="Add feedback for the student..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Explanation */}
                            {qResult.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                                <p className="text-sm text-blue-800">{qResult.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No details available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPerformanceMonitor;
