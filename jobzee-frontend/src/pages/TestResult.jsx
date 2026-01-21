import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const TestResult = () => {
  const { testId, resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);

  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    // If result not passed via state, fetch it from API
    if (!result && resultId) {
      fetchResult();
    }
  }, [resultId, result]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tests/results/${resultId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      } else {
        toast.error('Failed to load result');
        navigate('/tests/history');
      }
    } catch (error) {
      console.error('Fetch result error:', error);
      toast.error('Network error occurred');
      navigate('/tests/history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No result data found</p>
          <button
            onClick={() => navigate('/tests')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Practice Arena
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pending Grading Banner */}
        {result.gradingStatus === 'pending-review' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-1">Grading in Progress</h3>
                <p className="text-sm text-yellow-700">
                  Your test contains coding or essay questions that require manual evaluation. 
                  The current score shown reflects only the auto-graded portions. 
                  You will receive an updated result once the instructor completes the grading.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Graded Banner */}
        {result.gradingStatus === 'graded' && result.gradedAt && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">Grading Complete</h3>
                <p className="text-sm text-blue-700">
                  Manual grading has been completed. The scores shown below include all manually graded questions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header with pass/fail status */}
          <div className={`p-8 text-center ${result.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'} text-white`}>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              {result.passed ? (
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {result.passed ? 'Congratulations!' : 'Test Completed'}
            </h1>
            <p className="text-xl opacity-90">
              {result.passed ? 'You have passed the test!' : 'Keep practicing to improve your score'}
            </p>
          </div>

          {/* Score details */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{result.testTitle}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{result.score}</div>
                <div className="text-sm text-gray-600 mt-1">Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{result.percentage}%</div>
                <div className="text-sm text-gray-600 mt-1">Percentage</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
                <div className="text-sm text-gray-600 mt-1">Correct</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{formatTime(result.timeTaken)}</div>
                <div className="text-sm text-gray-600 mt-1">Time Taken</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Total Questions:</span>
                <span className="font-semibold text-gray-900">{result.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Total Marks:</span>
                <span className="font-semibold text-gray-900">{result.totalMarks}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Passing Marks:</span>
                <span className="font-semibold text-gray-900">{result.passingMarks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Your Score:</span>
                <span className={`font-bold text-lg ${result.passed ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.score} / {result.totalMarks}
                </span>
              </div>
            </div>

            {/* Auto-Submit Notice (if applicable) */}
            {result.autoSubmit && !result.fraudDetected && (
              <div className="rounded-lg p-4 mb-6 border bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-blue-800">
                      ⏰ Auto-Submitted Due to Timeout
                    </h3>
                    <p className="text-sm text-blue-700">
                      This test was automatically submitted when the time limit expired. All your answered questions were captured and evaluated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fraud Detection Warning (highest priority) */}
            {result.fraudDetected && (
              <div className="rounded-lg p-4 mb-6 border bg-red-600 border-red-700 text-white">
                <div className="flex items-start space-x-3">
                  <svg className="w-7 h-7 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold mb-2 text-xl">
                      🚨 FRAUD DETECTED - Test Terminated
                    </h3>
                    <p className="text-sm mb-2 font-semibold">
                      {result.fraudReason || 'Fraudulent activity detected during test'}
                    </p>
                    <p className="text-sm opacity-90">
                      This test was automatically terminated due to suspicious activity. Your attempt has been flagged and reported to administrators for review.
                    </p>
                    <div className="mt-3 p-3 bg-red-700 rounded">
                      <p className="text-xs font-medium">
                        ⚠️ Important: Repeated fraudulent attempts may result in account suspension or termination of testing privileges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Switch Warning (if applicable and not fraud) */}
            {result.tabSwitchCount > 0 && !result.fraudDetected && (
              <div className={`rounded-lg p-4 mb-6 border ${
                result.suspiciousActivity 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <svg className={`w-6 h-6 flex-shrink-0 ${
                    result.suspiciousActivity ? 'text-red-600' : 'text-yellow-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      result.suspiciousActivity ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {result.suspiciousActivity ? 'Suspicious Activity Detected' : 'Tab Switches Detected'}
                    </h3>
                    <p className={`text-sm ${
                      result.suspiciousActivity ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      You switched tabs or minimized the browser <strong>{result.tabSwitchCount}</strong> time{result.tabSwitchCount !== 1 ? 's' : ''} during this test.
                      {result.suspiciousActivity && ' This test has been flagged for review.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Performance</span>
                <span className="text-sm font-medium text-gray-900">{result.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    result.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'
                  }`}
                  style={{ width: `${Math.min(result.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                {showAnswers ? 'Hide' : 'View'} Detailed Answers
              </button>
              <button
                onClick={() => navigate('/tests/history')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                View History
              </button>
              <button
                onClick={() => navigate('/tests')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Practice Arena
              </button>
            </div>
          </div>
        </div>

        {/* Detailed answers section */}
        {showAnswers && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Answer Review</h3>
            {result.questionResults && result.questionResults.length > 0 ? (
              <div className="space-y-6">
                {result.questionResults.map((qResult, index) => (
                  <div
                    key={qResult.questionId}
                    className={`border-2 rounded-lg p-6 ${
                      qResult.questionType === 'coding' || qResult.questionType === 'essay' 
                        ? qResult.manuallyGraded
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-yellow-200 bg-yellow-50'
                        : qResult.isCorrect 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-700">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-gray-900 font-medium mb-2">{qResult.questionText}</p>
                          <div className="flex items-center gap-2 text-sm">
                            {qResult.questionType === 'mcq' || qResult.questionType === 'true-false' ? (
                              <>
                                <span className={`px-2 py-1 rounded-full font-semibold ${
                                  qResult.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                }`}>
                                  {qResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                                <span className="text-gray-600">
                                  {qResult.marksObtained} / {qResult.marks} marks
                                </span>
                              </>
                            ) : (qResult.questionType === 'coding' || qResult.questionType === 'essay') ? (
                              qResult.manuallyGraded ? (
                                <>
                                  <span className="px-2 py-1 rounded-full font-semibold bg-blue-200 text-blue-800">
                                    ✓ Manually Graded
                                  </span>
                                  <span className="text-gray-600">
                                    {qResult.marksObtained} / {qResult.marks} marks
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="px-2 py-1 rounded-full font-semibold bg-yellow-200 text-yellow-800">
                                    ⏳ Pending Manual Review
                                  </span>
                                  <span className="text-gray-600">
                                    Pending (0 / {qResult.marks} marks)
                                  </span>
                                </>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-11 space-y-2">
                      {/* MCQ and True-False Questions */}
                      {(qResult.questionType === 'mcq' || qResult.questionType === 'true-false' || !qResult.questionType) && (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-gray-700 min-w-[120px]">Your Answer:</span>
                            <span className={qResult.userAnswer === 'Not Attempted' ? 'text-gray-500 italic' : qResult.isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                              {qResult.userAnswer}
                            </span>
                          </div>
                          {!qResult.isCorrect && (
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-gray-700 min-w-[120px]">Correct Answer:</span>
                              <span className="text-green-700 font-medium">{qResult.correctAnswer}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Coding Questions */}
                      {qResult.questionType === 'coding' && qResult.codingDetails && (
                        <div className="space-y-4">
                          {/* Manual Grading Notice */}
                          {!qResult.manuallyGraded && qResult.marksObtained === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm text-yellow-800">
                                <strong>⏳ Pending Manual Review:</strong> This coding question requires instructor evaluation. 
                                Marks will be assigned after review is complete.
                              </p>
                            </div>
                          )}
                          {qResult.manuallyGraded && qResult.gradingNotes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm font-semibold text-blue-900 mb-1">Instructor Feedback:</p>
                              <p className="text-sm text-blue-800">{qResult.gradingNotes}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-700 block mb-2">Your Solution:</span>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                              {qResult.userAnswer === 'Not Attempted' ? (
                                <span className="text-gray-500 italic">Not Attempted</span>
                              ) : (
                                qResult.userAnswer
                              )}
                            </pre>
                          </div>
                          {qResult.codingDetails.expectedSolution && qResult.manuallyGraded && (
                            <div>
                              <span className="font-semibold text-gray-700 block mb-2">Expected Solution:</span>
                              <pre className="bg-blue-900 text-blue-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                                {qResult.codingDetails.expectedSolution}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Essay Questions */}
                      {qResult.questionType === 'essay' && qResult.essayDetails && (
                        <div className="space-y-4">
                          <div>
                            <span className="font-semibold text-gray-700 block mb-2">Your Answer:</span>
                            <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg text-sm whitespace-pre-wrap">
                              {qResult.userAnswer === 'Not Attempted' ? (
                                <span className="text-gray-500 italic">Not Attempted</span>
                              ) : (
                                qResult.userAnswer
                              )}
                            </div>
                            {qResult.userAnswer !== 'Not Attempted' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Word count: {qResult.userAnswer.split(' ').filter(w => w).length} words
                              </p>
                            )}
                          </div>
                          {qResult.essayDetails.expectedAnswer && (
                            <div>
                              <span className="font-semibold text-gray-700 block mb-2">Model Answer / Key Points:</span>
                              <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                {qResult.essayDetails.expectedAnswer}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No detailed answers available for this test.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResult;
