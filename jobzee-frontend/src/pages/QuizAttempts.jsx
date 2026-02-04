import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './QuizAttempts.css';

const QuizAttempts = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchQuizAttempts();
  }, [quizId, pagination.page]);

  const fetchQuizAttempts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/${quizId}/attempts?page=${pagination.page}&limit=${pagination.limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setQuiz(data.quiz);
      setAttempts(data.attempts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      toast.error('Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const viewAttemptDetails = (attempt) => {
    setSelectedAttempt(attempt);
    setShowDetailModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="quiz-attempts-page">
        <div className="loading-spinner">Loading quiz attempts...</div>
      </div>
    );
  }

  return (
    <div className="quiz-attempts-page">
      <div className="attempts-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <div className="header-content">
          <h1>📝 Quiz Attempts</h1>
          {quiz && (
            <div className="quiz-info">
              <h2>{quiz.title}</h2>
              <div className="quiz-meta">
                <span>📚 {quiz.lessonTitle}</span>
                <span>📖 {quiz.courseTitle}</span>
                <span>🎯 Pass: {quiz.passingScore}%</span>
                <span>🔄 Max Attempts: {quiz.maxAttempts || '∞'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="attempts-stats">
        <div className="stat-card">
          <div className="stat-value">{pagination.total}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {attempts.filter(a => a.passed).length}
          </div>
          <div className="stat-label">Passed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {attempts.filter(a => !a.passed).length}
          </div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {attempts.length > 0 
              ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
              : 0}%
          </div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="no-attempts">
          <div className="empty-icon">📋</div>
          <h3>No Attempts Yet</h3>
          <p>Students haven't taken this quiz yet.</p>
        </div>
      ) : (
        <>
          <div className="attempts-table-container">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Attempt #</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Time Spent</th>
                  <th>Completed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt._id}>
                    <td>
                      <div className="student-info">
                        {attempt.user.photo ? (
                          <img src={attempt.user.photo} alt={attempt.user.name} className="student-avatar" />
                        ) : (
                          <div className="student-avatar-placeholder">
                            {attempt.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="student-details">
                          <div className="student-name">{attempt.user.name}</div>
                          <div className="student-email">{attempt.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="attempt-number">#{attempt.attemptNumber}</span>
                    </td>
                    <td>
                      <span className="score-display">
                        {attempt.score} / {attempt.totalPoints}
                      </span>
                    </td>
                    <td>
                      <span className={`percentage ${attempt.passed ? 'passed' : 'failed'}`}>
                        {attempt.percentage}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${attempt.passed ? 'passed' : 'failed'}`}>
                        {attempt.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </td>
                    <td>{formatTime(attempt.timeSpent)}</td>
                    <td>{formatDate(attempt.completedAt)}</td>
                    <td>
                      <button
                        onClick={() => viewAttemptDetails(attempt)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="page-btn"
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAttempt && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Attempt Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="attempt-summary">
                <div className="summary-row">
                  <span className="label">Student:</span>
                  <span className="value">{selectedAttempt.user.name}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedAttempt.user.email}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Attempt:</span>
                  <span className="value">#{selectedAttempt.attemptNumber}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Score:</span>
                  <span className="value">{selectedAttempt.score} / {selectedAttempt.totalPoints}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Percentage:</span>
                  <span className={`value ${selectedAttempt.passed ? 'passed' : 'failed'}`}>
                    {selectedAttempt.percentage}%
                  </span>
                </div>
                <div className="summary-row">
                  <span className="label">Status:</span>
                  <span className={`value ${selectedAttempt.passed ? 'passed' : 'failed'}`}>
                    {selectedAttempt.passed ? 'Passed ✓' : 'Failed ✗'}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="label">Time Spent:</span>
                  <span className="value">{formatTime(selectedAttempt.timeSpent)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Completed:</span>
                  <span className="value">{formatDate(selectedAttempt.completedAt)}</span>
                </div>
              </div>

              <div className="answers-section">
                <h4>Answers</h4>
                {selectedAttempt.answers && selectedAttempt.answers.length > 0 ? (
                  <div className="answers-list">
                    {selectedAttempt.answers.map((answer, idx) => (
                      <div key={idx} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="answer-header">
                          <span className="question-number">Question {idx + 1}</span>
                          <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                            {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>
                        <div className="answer-points">
                          Points: {answer.pointsEarned} / {answer.pointsAvailable}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-answers">No detailed answer data available.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAttempts;
