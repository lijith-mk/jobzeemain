import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Certificates.css';

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view certificates');
        navigate('/login');
        return;
      }

      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/my-certificates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCertificates(data.certificates);
      calculateStats(data.certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error(error.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (certs) => {
    const now = new Date();
    const thisMonth = certs.filter(cert => {
      const certDate = new Date(cert.issuedAt);
      return certDate.getMonth() === now.getMonth() && 
             certDate.getFullYear() === now.getFullYear();
    }).length;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonth = certs.filter(cert => {
      const certDate = new Date(cert.issuedAt);
      return certDate.getMonth() === lastMonthDate.getMonth() && 
             certDate.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    setStats({
      total: certs.length,
      thisMonth,
      lastMonth
    });
  };

  const handleDownload = async (certificateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/${certificateId}/download`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const getGradeBadgeClass = (grade) => {
    const gradeMap = {
      'A+': 'grade-aplus',
      'A': 'grade-a',
      'B+': 'grade-bplus',
      'B': 'grade-b',
      'C+': 'grade-cplus',
      'C': 'grade-c',
      'Pass': 'grade-pass'
    };
    return gradeMap[grade] || 'grade-default';
  };

  const filteredCertificates = certificates.filter(cert => {
    if (filter === 'all') return true;
    if (filter === 'honors') return cert.honors;
    if (filter === 'recent') {
      const certDate = new Date(cert.issuedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return certDate >= thirtyDaysAgo;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="certificates-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-container">
      <div className="certificates-header">
        <div className="header-content">
          <h1>🎓 My Certificates</h1>
          <p>View and download your earned certificates</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="cert-stats-grid">
        <div className="cert-stat-card">
          <div className="stat-icon">📜</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Certificates</p>
          </div>
        </div>
        <div className="cert-stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-info">
            <h3>{stats.thisMonth}</h3>
            <p>This Month</p>
          </div>
        </div>
        <div className="cert-stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <h3>{certificates.filter(c => c.honors).length}</h3>
            <p>With Honors</p>
          </div>
        </div>
        <div className="cert-stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>{stats.thisMonth - stats.lastMonth >= 0 ? '+' : ''}{stats.thisMonth - stats.lastMonth}</h3>
            <p>vs Last Month</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cert-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({certificates.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
          onClick={() => setFilter('recent')}
        >
          Recent
        </button>
        <button 
          className={`filter-btn ${filter === 'honors' ? 'active' : ''}`}
          onClick={() => setFilter('honors')}
        >
          Honors ({certificates.filter(c => c.honors).length})
        </button>
      </div>

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <div className="no-certificates">
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h2>No certificates yet</h2>
            <p>Complete courses to earn certificates</p>
            <button 
              className="explore-btn"
              onClick={() => navigate('/learning-hub')}
            >
              Explore Courses
            </button>
          </div>
        </div>
      ) : (
        <div className="certificates-grid">
          {filteredCertificates.map((cert) => (
            <div key={cert._id} className="certificate-card">
              <div className="cert-card-header">
                <div className="cert-id">
                  <span className="id-label">ID:</span>
                  <span className="id-value">{cert.certificateId}</span>
                </div>
                {cert.honors && (
                  <div className="honors-badge">
                    <span>🏆 Honors</span>
                  </div>
                )}
              </div>

              <div className="cert-card-body">
                <div className="cert-icon">🎓</div>
                <h3 className="cert-course-name">{cert.courseName}</h3>
                
                <div className="cert-details">
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{cert.courseCategory}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Level:</span>
                    <span className="detail-value">{cert.courseLevel}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Grade:</span>
                    <span className={`grade-badge ${getGradeBadgeClass(cert.grade)}`}>
                      {cert.grade}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Issued:</span>
                    <span className="detail-value">
                      {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                {cert.skillsAchieved && cert.skillsAchieved.length > 0 && (
                  <div className="cert-skills">
                    <p className="skills-label">Skills Achieved:</p>
                    <div className="skills-list">
                      {cert.skillsAchieved.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                      {cert.skillsAchieved.length > 3 && (
                        <span className="skill-tag more">+{cert.skillsAchieved.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion Metrics */}
                <div className="cert-metrics">
                  <div className="metric-item">
                    <span className="metric-value">{cert.completionMetrics?.completedLessons || 0}</span>
                    <span className="metric-label">Lessons</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">{cert.completionMetrics?.passedQuizzes || 0}</span>
                    <span className="metric-label">Quizzes</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">{cert.completionMetrics?.averageQuizScore?.toFixed(0) || 0}%</span>
                    <span className="metric-label">Avg Score</span>
                  </div>
                </div>
              </div>

              <div className="cert-card-footer">
                <button 
                  className="view-btn"
                  onClick={() => navigate(`/certificates/${cert.certificateId}`)}
                >
                  View Details
                </button>
                <button 
                  className="download-btn"
                  onClick={() => handleDownload(cert.certificateId)}
                >
                  <span>⬇️</span> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
