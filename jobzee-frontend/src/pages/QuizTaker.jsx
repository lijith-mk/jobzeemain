import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import './QuizTaker.css';

const QuizTaker = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleAutoSubmit();
    }
  }, [timerActive, timeRemaining]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/micro-quiz/lesson/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuiz(data.quiz);
      setAttemptInfo(data.attemptInfo);

      // Show message if already taken
      if (data.attemptInfo?.alreadyTaken) {
        if (data.attemptInfo.passed) {
          toast.info(`You already passed this quiz with ${data.attemptInfo.bestScore}%`);
        } else {
          toast.info(`Retaking quiz. Best score: ${data.attemptInfo.bestScore || 0}%`);
        }
      }

      // Initialize timer if quiz has time limit
      if (data.quiz.timeLimit) {
        setTimeRemaining(data.quiz.timeLimit * 60);
        setTimerActive(true);
      }

      // Initialize empty answers
      const initialAnswers = {};
      data.quiz.questions.forEach((q, index) => {
        if (q.questionType === 'multiple-choice') {
          initialAnswers[index] = [];
        } else {
          initialAnswers[index] = '';
        }
      });
      setUserAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      
      if (error.response?.data?.requiresCompletion) {
        toast.error('Please complete the lesson before taking the quiz');
        navigate(`/lesson/${lessonId}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load quiz');
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer, isMultiple = false) => {
    setUserAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionIndex] || [];
        if (currentAnswers.includes(answer)) {
          return { ...prev, [questionIndex]: currentAnswers.filter(a => a !== answer) };
        } else {
          return { ...prev, [questionIndex]: [...currentAnswers, answer] };
        }
      } else {
        return { ...prev, [questionIndex]: answer };
      }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.values(userAnswers).filter(ans => {
      if (Array.isArray(ans)) return ans.length > 0;
      return ans !== '';
    }).length;
  };

  const handleAutoSubmit = async () => {
    toast.warning('Time is up! Submitting your quiz...');
    await submitQuiz();
  };

  const handleSubmitClick = () => {
    const answered = getAnsweredCount();
    const total = quiz.questions.length;
    
    if (answered < total) {
      setShowConfirmation(true);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setTimerActive(false);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/micro-quiz/${quiz._id}/submit`,
        { 
          answers: userAnswers,
          timeTaken: quiz.timeLimit ? (quiz.timeLimit * 60 - timeRemaining) : Math.floor((Date.now() - startTime) / 1000),
          startedAt: startTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Quiz submitted successfully!');
      navigate(`/quiz/results/${data.attempt._id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
      setTimerActive(quiz.timeLimit ? true : false);
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-taker loading-container">
        <div className="spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-taker error-container">
        <h2>Quiz Not Found</h2>
        <p>This lesson does not have an associated quiz.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="quiz-taker">
      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="quiz-header-content">
          <h1>{quiz.title}</h1>
          <p className="quiz-description">{quiz.description}</p>
          
          <div className="quiz-meta">
            <div className="meta-item">
              <span className="meta-label">Questions:</span>
              <span className="meta-value">{quiz.questions.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Points:</span>
              <span className="meta-value">{quiz.totalPoints}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Passing Score:</span>
              <span className="meta-value">{quiz.passingScore}%</span>
            </div>
            {attemptInfo && (
              <div className="meta-item">
                <span className="meta-label">Attempts Used:</span>
                <span className="meta-value">
                  {attemptInfo.attemptsUsed}/{quiz.maxAttempts === 0 ? '∞' : quiz.maxAttempts}
                </span>
              </div>
            )}
          </div>

          {quiz.instructions && (
            <div className="quiz-instructions">
              <strong>📋 Instructions:</strong>
              <p>{quiz.instructions}</p>
            </div>
          )}
        </div>

        {/* Timer */}
        {quiz.timeLimit && (
          <div className={`quiz-timer ${timeRemaining < 300 ? 'warning' : ''}`}>
            <div className="timer-icon">⏱️</div>
            <div className="timer-value">{formatTime(timeRemaining)}</div>
            <div className="timer-label">Time Remaining</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(getAnsweredCount() / quiz.questions.length) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          {getAnsweredCount()} / {quiz.questions.length} questions answered
        </div>
      </div>

      {/* Questions */}
      <div className="questions-container">
        {quiz.questions.map((question, index) => (
          <div key={index} className="question-card">
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className="question-points">{question.points} point{question.points > 1 ? 's' : ''}</span>
            </div>

            <div className="question-text">{question.questionText}</div>

            {/* Multiple Choice */}
            {question.questionType === 'multiple-choice' && (
              <div className="options-container">
                {question.options.map((option, optIndex) => {
                  const isSelected = Array.isArray(userAnswers[index]) && 
                                   userAnswers[index].includes(option.text);
                  
                  return (
                    <div 
                      key={optIndex} 
                      className={`option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange(index, option.text, true)}
                    >
                      <div className="option-checkbox">
                        {isSelected && '✓'}
                      </div>
                      <span className="option-text">{option.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {question.questionType === 'true-false' && (
              <div className="options-container">
                {question.options.map((option, optIndex) => {
                  const isSelected = userAnswers[index] === option.text;
                  
                  return (
                    <div 
                      key={optIndex} 
                      className={`option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAnswerChange(index, option.text)}
                    >
                      <div className="option-radio">
                        {isSelected && '●'}
                      </div>
                      <span className="option-text">{option.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fill in the Blank */}
            {question.questionType === 'fill-blank' && (
              <div className="fill-blank-container">
                <input
                  type="text"
                  value={userAnswers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Type your answer here..."
                  className="fill-blank-input"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="quiz-footer">
        <button 
          onClick={() => navigate(-1)} 
          className="cancel-btn"
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmitClick}
          className="submit-btn"
          disabled={submitting || getAnsweredCount() === 0}
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Incomplete Quiz</h2>
            <p>
              You have only answered <strong>{getAnsweredCount()}</strong> out of{' '}
              <strong>{quiz.questions.length}</strong> questions.
            </p>
            <p>Are you sure you want to submit?</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmation(false)} className="cancel-btn">
                Continue Quiz
              </button>
              <button onClick={submitQuiz} className="confirm-btn">
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;
