import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './QuizStatistics.css';

const QuizStatistics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [quizId]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/${quizId}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(data.statistics);
      setQuiz(data.quiz);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load quiz statistics');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= quiz?.passingScore) return '#4caf50';
    if (percentage >= (quiz?.passingScore * 0.7)) return '#ff9800';
    return '#f44336';
  };

  const getScoreDistributionChart = () => {
    if (!stats?.scoreDistribution) return null;

    const maxCount = Math.max(...Object.values(stats.scoreDistribution));
    
    return Object.entries(stats.scoreDistribution).map(([range, count]) => {
      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
      return { range, count, percentage };
    });
  };

  if (loading) {
    return (
      <div className="quiz-statistics loading-container">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (!stats || !quiz) {
    return (
      <div className="quiz-statistics error-container">
        <h2>Statistics Not Available</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const distributionData = getScoreDistributionChart();

  return (
    <div className="quiz-statistics">
      {/* Header */}
      <div className="stats-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>{quiz.title}</h1>
        <p className="quiz-subtitle">Quiz Statistics & Performance Analysis</p>
        <div className="header-actions">
          <Link to={`/admin/quiz/edit/${quizId}`} className="edit-btn">
            ✏️ Edit Quiz
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="stat-card primary">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-label">Total Attempts</div>
            <div className="card-value">{stats.totalAttempts}</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-label">Unique Students</div>
            <div className="card-value">{stats.uniqueStudents}</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Average Score</div>
            <div className="card-value">{stats.averageScore}%</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <div className="card-label">Highest Score</div>
            <div className="card-value">{stats.highestScore}%</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-label">Lowest Score</div>
            <div className="card-value">{stats.lowestScore}%</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-label">Pass Rate</div>
            <div className="card-value">{stats.passRate}%</div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      {distributionData && distributionData.length > 0 && (
        <div className="score-distribution card">
          <h2>📊 Score Distribution</h2>
          <div className="distribution-chart">
            {distributionData.map((item, index) => (
              <div key={index} className="distribution-bar-container">
                <div className="distribution-label">{item.range}</div>
                <div className="distribution-bar-wrapper">
                  <div 
                    className="distribution-bar"
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="bar-count">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {stats.recentAttempts && stats.recentAttempts.length > 0 && (
        <div className="recent-attempts card">
          <h2>🕒 Recent Attempts</h2>
          <div className="attempts-table-container">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Attempt #</th>
                  <th>Date</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts.map((attempt, index) => {
                  const percentage = ((attempt.score / attempt.totalPoints) * 100).toFixed(1);
                  const isPassed = percentage >= quiz.passingScore;
                  
                  return (
                    <tr key={index}>
                      <td className="student-cell">
                        <div className="student-avatar">
                          {attempt.userId?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{attempt.userId?.name || 'Unknown Student'}</span>
                      </td>
                      <td>
                        <div className="score-badge" style={{ backgroundColor: getScoreColor(percentage) + '20', color: getScoreColor(percentage) }}>
                          {percentage}%
                        </div>
                      </td>
                      <td>
                        <span className={`result-badge ${isPassed ? 'pass' : 'fail'}`}>
                          {isPassed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </td>
                      <td className="attempt-number">#{attempt.attemptNumber}</td>
                      <td className="date-cell">{formatDate(attempt.completedAt)}</td>
                      <td className="time-cell">
                        {attempt.timeTaken ? `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {stats.totalAttempts === 0 && (
        <div className="no-data card">
          <div className="no-data-icon">📭</div>
          <h3>No Attempts Yet</h3>
          <p>Students haven't taken this quiz yet. Statistics will appear once students start submitting attempts.</p>
        </div>
      )}
    </div>
  );
};

export default QuizStatistics;
