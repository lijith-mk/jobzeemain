import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './SkillGapAnalysis.css';

const SkillGapAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSkillGapData();
  }, []);

  const fetchSkillGapData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard data first
      const dashboardRes = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning/skill-gaps/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!dashboardRes.data.hasData) {
        setAnalysis({ hasData: false });
        setLoading(false);
        return;
      }

      // Fetch detailed analysis
      const analysisRes = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning/skill-gaps/analysis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch recommendations
      const recommendRes = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning/skill-gaps/recommendations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnalysis(analysisRes.data);
      setRecommendations(recommendRes.data);
    } catch (error) {
      console.error('Error fetching skill gap data:', error);
      toast.error('Failed to load skill gap analysis');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning/skill-gaps/report`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create downloadable JSON
      const dataStr = JSON.stringify(response.data.report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `skill-gap-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'moderate': return '#eab308';
      default: return '#6b7280';
    }
  };

  const getSeverityBadge = (severity) => {
    return (
      <span 
        className="severity-badge" 
        style={{ backgroundColor: getSeverityColor(severity) }}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="skill-gap-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing your skills...</p>
        </div>
      </div>
    );
  }

  if (!analysis || !analysis.hasData) {
    return (
      <div className="skill-gap-container">
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <h2>No Test Data Available</h2>
          <p>Take some tests to get personalized skill gap insights and recommendations!</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/tests')}
          >
            Browse Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-gap-container">
      {/* Header */}
      <div className="skill-gap-header">
        <div className="header-content">
          <h1>🎯 Skill Gap Analysis</h1>
          <p>Data-driven insights from your test performance</p>
        </div>
        <button className="download-btn" onClick={downloadReport}>
          📥 Download Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gaps' ? 'active' : ''}`}
          onClick={() => setActiveTab('gaps')}
        >
          Skill Gaps ({analysis.skillGaps?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'strengths' ? 'active' : ''}`}
          onClick={() => setActiveTab('strengths')}
        >
          Strengths ({analysis.strongSkills?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{analysis.summary?.totalTestsTaken || 0}</div>
              <div className="stat-label">Tests Analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{analysis.summary?.totalSkillsAnalyzed || 0}</div>
              <div className="stat-label">Skills Analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{analysis.summary?.weakSkillsCount || 0}</div>
              <div className="stat-label">Weak Areas</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-value">{analysis.summary?.strongSkillsCount || 0}</div>
              <div className="stat-label">Strong Skills</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">
                {analysis.summary?.overallPerformance?.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="stat-label">Avg Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">
                {analysis.summary?.overallPerformance?.passRate?.toFixed(1) || 0}%
              </div>
              <div className="stat-label">Pass Rate</div>
            </div>
          </div>

          {/* Category Performance */}
          {analysis.categoryPerformance && analysis.categoryPerformance.length > 0 && (
            <div className="performance-section">
              <h3>📚 Category Performance</h3>
              <div className="category-list">
                {analysis.categoryPerformance.map((cat, index) => (
                  <div key={index} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{cat.category}</span>
                      <span className="category-score">{cat.averagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${cat.averagePercentage}%`,
                          backgroundColor: cat.averagePercentage >= 70 ? '#10b981' : 
                                         cat.averagePercentage >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    <div className="category-meta">
                      {cat.totalTests} test{cat.totalTests !== 1 ? 's' : ''} taken
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skill Gaps Tab */}
      {activeTab === 'gaps' && (
        <div className="tab-content">
          {analysis.skillGaps && analysis.skillGaps.length > 0 ? (
            <div className="skill-gaps-list">
              {analysis.skillGaps.map((gap, index) => (
                <div key={index} className="skill-gap-card">
                  <div className="gap-header">
                    <h4>{gap.skill}</h4>
                    {getSeverityBadge(gap.gapSeverity)}
                  </div>
                  <div className="gap-stats">
                    <div className="gap-stat">
                      <span className="stat-label">Performance</span>
                      <span className="stat-value bad">{gap.averagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="gap-stat">
                      <span className="stat-label">Tests Taken</span>
                      <span className="stat-value">{gap.totalTests}</span>
                    </div>
                    <div className="gap-stat">
                      <span className="stat-label">Improvement Needed</span>
                      <span className="stat-value">{gap.improvementNeeded.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="performance-range">
                    <span className="range-label">Range:</span>
                    <span className="range-values">
                      {gap.lowestScore.toFixed(0)}% - {gap.highestScore.toFixed(0)}%
                    </span>
                  </div>
                  {gap.testDetails && gap.testDetails.length > 0 && (
                    <details className="test-details">
                      <summary>View Test History ({gap.testDetails.length})</summary>
                      <div className="test-history">
                        {gap.testDetails.map((test, idx) => (
                          <div key={idx} className="test-history-item">
                            <span className="test-title">{test.testTitle}</span>
                            <span className={`test-score ${test.passed ? 'passed' : 'failed'}`}>
                              {test.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>🎉 Great job! No significant skill gaps detected.</p>
            </div>
          )}
        </div>
      )}

      {/* Strengths Tab */}
      {activeTab === 'strengths' && (
        <div className="tab-content">
          {analysis.strongSkills && analysis.strongSkills.length > 0 ? (
            <div className="strengths-list">
              {analysis.strongSkills.map((strength, index) => (
                <div key={index} className="strength-card">
                  <div className="strength-icon">⭐</div>
                  <div className="strength-content">
                    <h4>{strength.skill}</h4>
                    <div className="strength-score">{strength.averagePercentage.toFixed(1)}%</div>
                    <div className="strength-meta">
                      Based on {strength.totalTests} test{strength.totalTests !== 1 ? 's' : ''}
                    </div>
                    <div className="performance-range">
                      Range: {strength.lowestScore.toFixed(0)}% - {strength.highestScore.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Take more tests to identify your strengths</p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="tab-content">
          {recommendations && recommendations.courses && recommendations.courses.length > 0 ? (
            <>
              <div className="recommendations-header">
                <h3>📚 Recommended Courses</h3>
                <p>Courses tailored to address your skill gaps</p>
              </div>
              <div className="recommendations-grid">
                {recommendations.courses.slice(0, 6).map((course) => (
                  <div key={course._id} className="recommendation-card">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📖</div>
                      )}
                    </div>
                    <div className="course-details">
                      <h4>{course.title}</h4>
                      <p className="course-description">{course.description?.substring(0, 100)}...</p>
                      <div className="course-meta">
                        <span className="level-badge">{course.level}</span>
                        <span className="duration">{course.duration}h</span>
                        {course.matchScore > 0 && (
                          <span className="match-badge">{course.matchScore} gaps addressed</span>
                        )}
                      </div>
                      {course.addressesGaps && course.addressesGaps.length > 0 && (
                        <div className="addresses-gaps">
                          <strong>Addresses:</strong> {course.addressesGaps.join(', ')}
                        </div>
                      )}
                      {course.isEnrolled ? (
                        <button className="enrolled-btn" disabled>
                          ✓ Enrolled ({course.enrollmentStatus?.progress || 0}%)
                        </button>
                      ) : (
                        <button 
                          className="enroll-btn"
                          onClick={() => navigate(`/courses/${course._id}`)}
                        >
                          View Course
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {recommendations.learningPaths && recommendations.learningPaths.length > 0 && (
                <>
                  <div className="recommendations-header" style={{ marginTop: '2rem' }}>
                    <h3>🎯 Recommended Learning Paths</h3>
                    <p>Structured learning journeys for comprehensive skill development</p>
                  </div>
                  <div className="paths-list">
                    {recommendations.learningPaths.map((path) => (
                      <div key={path._id} className="path-card">
                        <h4>{path.title}</h4>
                        <p>{path.description}</p>
                        <div className="path-meta">
                          <span>{path.level}</span>
                          <span>{path.estimatedDuration}h total</span>
                          <span>{path.matchScore} gaps addressed</span>
                        </div>
                        <button 
                          className="view-path-btn"
                          onClick={() => navigate('/learning-hub')}
                        >
                          Explore Path →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No recommendations available yet. Take some tests to get personalized suggestions!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
