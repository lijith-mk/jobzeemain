import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './QuizResults.css';

const QuizResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/micro-quiz/attempt/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAttempt(data.attempt);
      setQuiz(data.quiz);
      setCanRetry(data.canRetry);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load quiz results');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getScorePercentage = () => {
    return attempt.percentage.toFixed(1);
  };

  const isPassing = () => {
    return attempt.percentage >= quiz.passingScore;
  };

  const getScoreColor = () => {
    const percentage = attempt.percentage;
    if (percentage >= quiz.passingScore) return '#4caf50';
    if (percentage >= quiz.passingScore * 0.7) return '#ff9800';
    return '#f44336';
  };

  const getPerformanceMessage = () => {
    const percentage = attempt.percentage;
    if (percentage >= 90) return '🎉 Excellent work!';
    if (percentage >= quiz.passingScore) return '✅ Good job! You passed!';
    if (percentage >= quiz.passingScore * 0.7) return '📚 Keep practicing!';
    return '💪 Don\'t give up! Try again!';
  };

  const getCorrectAnswersCount = () => {
    return attempt.answers.filter(a => a.isCorrect).length;
  };

  const retryQuiz = () => {
    navigate(`/lesson/${quiz.lessonId}/quiz`);
  };

  if (loading) {
    return (
      <div className="quiz-results loading-container">
        <div className="spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <div className="quiz-results error-container">
        <h2>Results Not Found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="quiz-results">
      {/* Results Header */}
      <div className="results-header">
        <div className={`score-circle ${isPassing() ? 'passing' : 'failing'}`}>
          <div className="score-percentage" style={{ color: getScoreColor() }}>
            {getScorePercentage()}%
          </div>
          <div className="score-fraction">
            {attempt.score} / {attempt.totalPoints} points
          </div>
        </div>

        <h1>{quiz.title}</h1>
        <p className="performance-message">{getPerformanceMessage()}</p>

        <div className="results-meta">
          <div className="meta-card">
            <div className="meta-icon">
              {isPassing() ? '✅' : '❌'}
            </div>
            <div className="meta-label">Status</div>
            <div className={`meta-value ${isPassing() ? 'pass' : 'fail'}`}>
              {isPassing() ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-icon">📊</div>
            <div className="meta-label">Score Required</div>
            <div className="meta-value">{quiz.passingScore}%</div>
          </div>

          <div className="meta-card">
            <div className="meta-icon">📝</div>
            <div className="meta-label">Questions Correct</div>
            <div className="meta-value">
              {getCorrectAnswersCount()} / {quiz.questions.length}
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-icon">🔄</div>
            <div className="meta-label">Attempt</div>
            <div className="meta-value">
              {attempt.attemptNumber} / {quiz.maxAttempts === 0 ? '∞' : quiz.maxAttempts}
            </div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="questions-review">
        <h2>📋 Question Review</h2>

        {attempt.detailedResults && attempt.detailedResults.results ? (
          attempt.detailedResults.results.map((result, index) => {
            const question = quiz.questions.find(q => q._id.toString() === result.questionId.toString());
            if (!question) return null;

            return (
              <div key={index} className={`review-card ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="review-header">
                  <div className="review-number">
                    <span className="question-num">Question {index + 1}</span>
                    <span className={`result-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <div className="review-points">
                    {result.points} / {result.maxPoints} points
                  </div>
                </div>

                <div className="review-question">{result.questionText}</div>

                {/* Multiple Choice & True/False */}
                {(question.questionType === 'multiple-choice' || question.questionType === 'true-false') && (
                  <div className="review-options">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = result.userAnswer === option._id?.toString();
                      const isCorrectOption = option.isCorrect;

                      let optionClass = 'review-option';
                      if (isCorrectOption) optionClass += ' correct-option';
                      if (isUserAnswer && !isCorrectOption) optionClass += ' wrong-option';
                      if (isUserAnswer && isCorrectOption) optionClass += ' user-correct-option';

                      return (
                        <div key={optIndex} className={optionClass}>
                          <div className="option-indicator">
                            {isUserAnswer && (isCorrectOption ? '✓' : '✗')}
                            {!isUserAnswer && isCorrectOption && quiz.showCorrectAnswers && '→'}
                          </div>
                          <span className="option-text">{option.text}</span>
                          {isCorrectOption && quiz.showCorrectAnswers && (
                            <span className="correct-label">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the Blank */}
                {question.questionType === 'fill-blank' && (
                  <div className="review-answers">
                    <div className="answer-row">
                      <span className="answer-label">Your Answer:</span>
                      <span className={`answer-value ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                        {result.userAnswer || '(No answer)'}
                      </span>
                    </div>
                    {quiz.showCorrectAnswers && !result.isCorrect && (
                      <div className="answer-row">
                        <span className="answer-label">Correct Answer:</span>
                        <span className="answer-value correct">
                          {result.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {quiz.showCorrectAnswers && result.explanation && (
                  <div className="review-explanation">
                    <strong>💡 Explanation:</strong>
                    <p>{result.explanation}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p>No detailed results available</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="results-actions">
        <button 
          onClick={() => navigate(`/lesson/${quiz.lessonId}`)} 
          className="back-btn"
        >
          ← Back to Lesson
        </button>
        
        <button 
          onClick={() => navigate(`/course/${quiz.courseId}`)} 
          className="course-btn"
        >
          📚 View Course
        </button>
        
        {canRetry && (
          <button onClick={retryQuiz} className="retry-btn">
            🔄 Retry Quiz
          </button>
        )}

        {isPassing() && (
          <button 
            onClick={() => navigate('/learning-hub')} 
            className="continue-btn"
          >
            Continue Learning →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizResults;
