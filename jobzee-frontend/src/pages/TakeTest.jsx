import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [showConfirmStart, setShowConfirmStart] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  
  // Embedded editor state
  const [useEmbeddedEditor, setUseEmbeddedEditor] = useState({});
  const [copiedStarter, setCopiedStarter] = useState({});
  
  // Tab switch detection state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  const timerRef = useRef(null);
  const testStartTimeRef = useRef(null);
  const tabSwitchTimestamps = useRef([]);
  const lastTabSwitchTime = useRef(0);
  const isDetectingSwitch = useRef(false);
  const hasShownFiveMinuteWarning = useRef(false);
  const hasShownOneMinuteWarning = useRef(false);
  const hasShownThirtySecondWarning = useRef(false);

  // Fraud termination function
  const handleFraudTermination = useCallback(async () => {
    // Prevent duplicate submissions
    if (submitting) {
      console.log('⚠️ Fraud termination already in progress, ignoring...');
      return;
    }

    console.log('🚨 FRAUD DETECTED - Test terminated due to excessive tab switching');
    console.log(`📝 Submitting ${Object.keys(answers).length} answered questions before termination`);
    
    // Stop timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const timeTaken = test?.timeLimit ? test.timeLimit - timeRemaining : 0;

      const response = await fetch(`${API_BASE_URL}/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers,
          timeTaken,
          autoSubmit: false,
          attemptId,
          tabSwitchCount,
          tabSwitchTimestamps: tabSwitchTimestamps.current,
          fraudDetected: true,
          fraudReason: 'Excessive tab switching (5+ switches)'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fraud termination successful:', data);
        
        // Show warning-style notification (not error)
        toast.warning('🚨 Test terminated due to fraudulent activity', {
          autoClose: 3000,
          position: 'top-center'
        });
        
        // Navigate to results page
        setTimeout(() => {
          navigate(`/tests/result/${data.resultId}`);
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('Fraud termination failed:', errorData);
        toast.error('Failed to terminate test: ' + (errorData.message || 'Unknown error'));
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Fraud termination error:', error);
      toast.error('Network error during test termination');
      setSubmitting(false);
    }
  }, [answers, attemptId, navigate, submitting, tabSwitchCount, test, testId, timeRemaining]);

  // Handle tab switch detection with debouncing
  const handleTabSwitch = useCallback(async () => {
    // Debounce: Prevent multiple detections within 1 second
    const now = Date.now();
    if (isDetectingSwitch.current || (now - lastTabSwitchTime.current < 1000)) {
      console.log('🚫 Tab switch ignored (debounced)');
      return;
    }
    
    isDetectingSwitch.current = true;
    lastTabSwitchTime.current = now;
    
    const timestamp = new Date();
    
    // Use functional state update to get current count
    setTabSwitchCount(prevCount => {
      const newCount = prevCount + 1;
      
      console.log('⚠️ Tab switch detected:', {
        count: newCount,
        timestamp: timestamp,
        attemptId: attemptId
      });
      
      // Show warning messages for first and second tab switch
      if (newCount === 1) {
        setWarningMessage('⚠️ Warning: Tab switching is being monitored. Please stay on this page.');
        setShowTabSwitchWarning(true);
        setTimeout(() => setShowTabSwitchWarning(false), 5000);
      } else if (newCount === 2) {
        setWarningMessage('⚠️ Second Warning: Excessive tab switching may be flagged as suspicious activity!');
        setShowTabSwitchWarning(true);
        setTimeout(() => setShowTabSwitchWarning(false), 5000);
      } else if (newCount === 3) {
        setWarningMessage('🚨 Third Warning: Multiple tab switches detected! Two more and your test will be terminated.');
        setShowTabSwitchWarning(true);
        setTimeout(() => setShowTabSwitchWarning(false), 5000);
      } else if (newCount === 4) {
        setWarningMessage('🚨 Fourth Warning: One more tab switch and your test will be terminated!');
        setShowTabSwitchWarning(true);
        setTimeout(() => setShowTabSwitchWarning(false), 5000);
      } else if (newCount === 5) {
        setWarningMessage('🚨 FRAUD DETECTED: Test will be terminated in 2 seconds!');
        setShowTabSwitchWarning(true);
        // Auto-terminate after brief delay
        setTimeout(() => {
          handleFraudTermination();
        }, 2000);
      } else if (newCount >= 3) {
        setWarningMessage('🚨 Multiple tab switches detected! This test has been flagged as suspicious.');
        setShowTabSwitchWarning(true);
        setTimeout(() => setShowTabSwitchWarning(false), 5000);
      }
      
      return newCount;
    });
    
    tabSwitchTimestamps.current.push(timestamp);
    
    // Record tab switch to backend
    if (attemptId) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/tests/${testId}/tab-switch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attemptId,
            timestamp,
          }),
        });
      } catch (error) {
        console.error('Failed to record tab switch:', error);
      }
    }
    
    // Reset debounce flag after 1 second
    setTimeout(() => {
      isDetectingSwitch.current = false;
    }, 1000);
  }, [attemptId, testId, handleFraudTermination]);

  useEffect(() => {
    fetchTest();
  }, []);

  useEffect(() => {
    if (!testStarted) return;
    
    // Prevent accidental page close/refresh
    const handleBeforeUnload = (e) => {
      if (!submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    // Tab switch detection - visibilitychange event (most reliable)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitch();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testStarted, submitting, handleTabSwitch]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTest(data.test);
        setTimeRemaining(data.test.duration * 60); // Convert minutes to seconds
      } else {
        toast.error('Failed to load test');
        navigate('/tests');
      }
    } catch (error) {
      console.error('Fetch test error:', error);
      toast.error('Network error occurred');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptId(data.attempt.attemptId);
        setShowConfirmStart(false);
        setTestStarted(true);
        testStartTimeRef.current = Date.now();
        
        console.log('✅ Test started with anti-cheat tracking:', {
          attemptId: data.attempt.attemptId,
          startedAt: data.attempt.startedAt
        });
        
        // Start countdown timer
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              handleAutoSubmit();
              return 0;
            }
            
            // Show time warnings at specific intervals
            if (prev === 300 && !hasShownFiveMinuteWarning.current) {
              hasShownFiveMinuteWarning.current = true;
              toast.info('⏰ 5 minutes remaining!', {
                autoClose: 4000,
                position: 'top-right'
              });
            } else if (prev === 60 && !hasShownOneMinuteWarning.current) {
              hasShownOneMinuteWarning.current = true;
              toast.warning('⚠️ Only 1 minute left!', {
                autoClose: 5000,
                position: 'top-center'
              });
            } else if (prev === 30 && !hasShownThirtySecondWarning.current) {
              hasShownThirtySecondWarning.current = true;
              toast.error('🚨 30 seconds remaining! Hurry!', {
                autoClose: 5000,
                position: 'top-center'
              });
            }
            
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Start test error:', error);
      toast.error('Network error occurred while starting test');
    }
  };

  const handleAutoSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    console.log('⏰ Auto-submit triggered - Time expired');
    console.log('📊 Capturing answers:', {
      answeredCount: Object.keys(answers).length,
      totalQuestions: test?.questions?.length || 0,
      attemptId: attemptId
    });
    
    toast.warning('⏰ Time is up! Auto-submitting your test...', {
      autoClose: 3000,
      position: 'top-center'
    });
    
    setTimeout(() => {
      submitTest(true);
    }, 500);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleCopyStarterCode = (questionId, starterCode) => {
    if (starterCode) {
      navigator.clipboard.writeText(starterCode).then(() => {
        setCopiedStarter({ ...copiedStarter, [questionId]: true });
        toast.success('Starter code copied to clipboard!');
        setTimeout(() => {
          setCopiedStarter({ ...copiedStarter, [questionId]: false });
        }, 2000);
      });
    }
  };

  const getLanguageUrl = (language) => {
    const languageMap = {
      javascript: 'https://onecompiler.com/embed/javascript',
      python: 'https://onecompiler.com/embed/python',
      java: 'https://onecompiler.com/embed/java',
      cpp: 'https://onecompiler.com/embed/cpp'
    };
    return languageMap[language] || languageMap.javascript;
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async (autoSubmit = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const timeTaken = Math.floor((Date.now() - testStartTimeRef.current) / 1000);
      
      // Track which questions used embedded editor
      const answersWithMetadata = {};
      Object.keys(answers).forEach(questionId => {
        answersWithMetadata[questionId] = {
          answer: answers[questionId],
          usedEmbeddedEditor: useEmbeddedEditor[questionId] || false
        };
      });
      
      const response = await fetch(`${API_BASE_URL}/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answersWithMetadata,
          timeTaken,
          autoSubmit,
          attemptId,
          tabSwitchCount,
          tabSwitchTimestamps: tabSwitchTimestamps.current,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Test submitted successfully!');
        navigate(`/tests/${testId}/result`, { state: { result: data.result } });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Submit test error:', error);
      toast.error('Network error occurred while submitting');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  // Confirm start modal
  if (showConfirmStart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
            {test.description && (
              <p className="text-gray-600">{test.description}</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Questions</div>
                <div className="text-2xl font-bold text-blue-600">{test.questions.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Duration</div>
                <div className="text-2xl font-bold text-green-600">{test.duration} min</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Marks</div>
                <div className="text-2xl font-bold text-purple-600">{test.totalMarks}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Passing Marks</div>
                <div className="text-2xl font-bold text-orange-600">{test.passingMarks}</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Instructions:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Once started, the timer cannot be paused</li>
                <li>• Do not refresh or close the browser tab</li>
                <li>• <strong>Do not switch tabs or minimize the window - it is being monitored</strong></li>
                <li>• You can navigate between questions freely</li>
                <li>• Test will auto-submit when time expires</li>
                <li>• Make sure you have stable internet connection</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/tests')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startTest}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Low Time Warning Banner */}
      {timeRemaining > 0 && timeRemaining <= 30 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-lg">
              🚨 {timeRemaining} seconds remaining! Test will auto-submit when time expires!
            </span>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Banner */}
      {showTabSwitchWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">{warningMessage}</span>
            </div>
            <button
              onClick={() => setShowTabSwitchWarning(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header with timer */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </p>
            </div>
            <div className={`text-right ${timeRemaining < 60 ? 'animate-pulse' : ''}`}>
              <div className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : timeRemaining < 300 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-600">Time Remaining</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main question area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    Question {currentQuestionIndex + 1}
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">
                  {currentQuestion.questionText}
                </h2>

                {/* Options based on question type */}
                <div className="space-y-3">
                  {currentQuestion.type === 'mcq' && (
                    <>
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            answers[currentQuestion._id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion._id}`}
                            value={option}
                            checked={answers[currentQuestion._id] === option}
                            onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-3 text-gray-900">{option}</span>
                        </label>
                      ))}
                    </>
                  )}

                  {currentQuestion.type === 'true-false' && (
                    <>
                      <label
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[currentQuestion._id] === 'True'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion._id}`}
                          value="True"
                          checked={answers[currentQuestion._id] === 'True'}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-gray-900">True</span>
                      </label>
                      <label
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[currentQuestion._id] === 'False'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion._id}`}
                          value="False"
                          checked={answers[currentQuestion._id] === 'False'}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-gray-900">False</span>
                      </label>
                    </>
                  )}

                  {/* Coding Question Interface */}
                  {currentQuestion.type === 'coding' && currentQuestion.codingDetails && (
                    <div className="space-y-4">
                      {/* Problem Description */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* Problem Statement */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Problem Statement</h3>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {currentQuestion.codingDetails.problemStatement}
                          </p>
                        </div>

                        {/* Input Format */}
                        {currentQuestion.codingDetails.inputFormat && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Input Format</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                              {currentQuestion.codingDetails.inputFormat}
                            </p>
                          </div>
                        )}

                        {/* Output Format */}
                        {currentQuestion.codingDetails.outputFormat && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Output Format</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                              {currentQuestion.codingDetails.outputFormat}
                            </p>
                          </div>
                        )}

                        {/* Constraints */}
                        {currentQuestion.codingDetails.constraints && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Constraints</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border font-mono">
                              {currentQuestion.codingDetails.constraints}
                            </p>
                          </div>
                        )}

                        {/* Sample Test Case */}
                        {currentQuestion.codingDetails.sampleInput && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sample Test Case</h3>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Input:</p>
                                <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded border font-mono overflow-x-auto">
                                  {currentQuestion.codingDetails.sampleInput}
                                </pre>
                              </div>
                              {currentQuestion.codingDetails.sampleOutput && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Output:</p>
                                  <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded border font-mono overflow-x-auto">
                                    {currentQuestion.codingDetails.sampleOutput}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Starter Code Section */}
                      {currentQuestion.codingDetails.starterCode && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">Starter Code</h3>
                            <button
                              onClick={() => handleCopyStarterCode(
                                currentQuestion._id,
                                currentQuestion.codingDetails.starterCode[currentQuestion.codingDetails.language || 'javascript']
                              )}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              {copiedStarter[currentQuestion._id] ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy Starter Code
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded border font-mono overflow-x-auto">
                            {currentQuestion.codingDetails.starterCode[currentQuestion.codingDetails.language || 'javascript'] || '// No starter code provided'}
                          </pre>
                        </div>
                      )}

                      {/* Editor Selection */}
                      <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-blue-900 mb-1">Choose Your Coding Environment</h3>
                          <p className="text-xs text-blue-700">You can use the embedded online editor or paste your solution in the text area below</p>
                        </div>
                        <button
                          onClick={() => setUseEmbeddedEditor({
                            ...useEmbeddedEditor,
                            [currentQuestion._id]: !useEmbeddedEditor[currentQuestion._id]
                          })}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            useEmbeddedEditor[currentQuestion._id]
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-blue-700 border-2 border-blue-300'
                          }`}
                        >
                          {useEmbeddedEditor[currentQuestion._id] ? '✓ Using Embedded Editor' : 'Use Embedded Editor'}
                        </button>
                      </div>

                      {/* Embedded OneCompiler Editor */}
                      {useEmbeddedEditor[currentQuestion._id] && (
                        <div className="space-y-2">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <strong>Note:</strong> Code written in the embedded editor will not be automatically saved. 
                            Make sure to copy your final solution to the text area below before submitting the test.
                          </div>
                          <div className="border-4 border-blue-300 rounded-lg overflow-hidden">
                            <iframe
                              src={getLanguageUrl(currentQuestion.codingDetails.language || 'javascript')}
                              width="100%"
                              height="500"
                              frameBorder="0"
                              title="Embedded Code Editor"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Text Area for Code Submission */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Your Solution {useEmbeddedEditor[currentQuestion._id] && '(Paste from embedded editor)'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {answers[currentQuestion._id]?.length || 0} characters
                          </span>
                        </div>
                        <textarea
                          value={answers[currentQuestion._id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="w-full min-h-[300px] px-4 py-3 bg-gray-900 text-green-400 font-mono text-sm border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder={useEmbeddedEditor[currentQuestion._id] 
                            ? "// Paste your final solution here from the embedded editor above..." 
                            : "// Write your code here..."}
                          spellCheck="false"
                        />
                        {!answers[currentQuestion._id] && (
                          <p className="text-xs text-red-500">
                            ⚠️ Remember to paste your solution here before submitting!
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Essay Question Interface */}
                  {currentQuestion.type === 'essay' && currentQuestion.essayDetails && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-700">Your Answer</h3>
                          <span className="text-xs text-gray-500">
                            {answers[currentQuestion._id]?.split(' ').filter(w => w).length || 0} / {currentQuestion.essayDetails.wordLimit} words
                          </span>
                        </div>
                        <textarea
                          value={answers[currentQuestion._id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="w-full min-h-[300px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Write your answer here..."
                        />
                        {currentQuestion.essayDetails.minWords && (
                          <p className="text-xs text-gray-500 mt-2">
                            Minimum {currentQuestion.essayDetails.minWords} words required
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Submit Test
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentQuestionIndex === test.questions.length - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Question palette sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>
              
              <div className="mb-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold text-green-600">{getAnsweredCount()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Not Answered:</span>
                  <span className="font-semibold text-gray-600">{test.questions.length - getAnsweredCount()}</span>
                </div>
              </div>

              {/* Tab Switch Counter */}
              {tabSwitchCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium text-yellow-800">Tab Switches</span>
                    </div>
                    <span className={`text-lg font-bold ${tabSwitchCount >= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {tabSwitchCount}
                    </span>
                  </div>
                  {tabSwitchCount >= 3 && (
                    <p className="text-xs text-red-600 mt-1">Flagged as suspicious</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {test.questions.map((question, index) => (
                  <button
                    key={question._id}
                    onClick={() => goToQuestion(index)}
                    className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : answers[question._id]
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Test?</h3>
            <p className="text-gray-600 mb-6">
              You have answered {getAnsweredCount()} out of {test.questions.length} questions.
              {getAnsweredCount() < test.questions.length && ' Are you sure you want to submit?'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Review Answers
              </button>
              <button
                onClick={() => submitTest(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
