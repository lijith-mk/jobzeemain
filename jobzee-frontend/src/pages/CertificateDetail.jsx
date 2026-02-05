import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CertificateDetail.css';

const CertificateDetail = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationInfo, setVerificationInfo] = useState(null);

  useEffect(() => {
    fetchCertificateDetail();
  }, [certificateId]);

  const fetchCertificateDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view certificate');
        navigate('/login');
        return;
      }

      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/${certificateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCertificate(data.certificate);
      fetchVerificationInfo(certificateId);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to load certificate');
      navigate('/certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationInfo = async (certId) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/verify/${certId}`
      );
      setVerificationInfo(data);
    } catch (error) {
      console.error('Error fetching verification:', error);
    }
  };

  const handleDownload = async () => {
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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

  if (loading) {
    return (
      <div className="cert-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificateId}`;

  return (
    <div className="cert-detail-container">
      <div className="cert-detail-header">
        <button className="back-btn" onClick={() => navigate('/certificates')}>
          ← Back to Certificates
        </button>
        <h1>Certificate Details</h1>
      </div>

      <div className="cert-detail-content">
        {/* Certificate Preview */}
        <div className="cert-preview-section">
          <div className="cert-preview-card">
            <div className="cert-preview-header">
              <div className="cert-logo">🎓 JOBZEE</div>
              {certificate.honors && (
                <div className="honors-badge-large">
                  🏆 Honors
                </div>
              )}
            </div>
            
            <div className="cert-preview-body">
              <p className="cert-label">Certificate of Completion</p>
              <h2 className="cert-recipient">{certificate.userName}</h2>
              <p className="cert-text">has successfully completed</p>
              <h3 className="cert-course">{certificate.courseName}</h3>
              
              <div className="cert-info-grid">
                <div className="cert-info-item">
                  <span className="info-label">Certificate ID</span>
                  <span className="info-value">{certificate.certificateId}</span>
                </div>
                <div className="cert-info-item">
                  <span className="info-label">Grade</span>
                  <span className={`grade-badge ${getGradeBadgeClass(certificate.grade)}`}>
                    {certificate.grade}
                  </span>
                </div>
                <div className="cert-info-item">
                  <span className="info-label">Issue Date</span>
                  <span className="info-value">
                    {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="cert-info-item">
                  <span className="info-label">Level</span>
                  <span className="info-value">{certificate.courseLevel}</span>
                </div>
              </div>

              <div className="cert-seal">
                <div className="seal-inner">
                  <span className="seal-text">VERIFIED</span>
                  <span className="seal-year">{new Date(certificate.issuedAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="download-btn-large" onClick={handleDownload}>
            ⬇️ Download Certificate PDF
          </button>
        </div>

        {/* Certificate Information */}
        <div className="cert-info-section">
          {/* Basic Info */}
          <div className="info-card">
            <h3>📋 Basic Information</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="row-label">Certificate ID:</span>
                <div className="row-value-copy">
                  <span>{certificate.certificateId}</span>
                  <button onClick={() => copyToClipboard(certificate.certificateId)}>📋</button>
                </div>
              </div>
              <div className="info-row">
                <span className="row-label">Student Name:</span>
                <span className="row-value">{certificate.userName}</span>
              </div>
              <div className="info-row">
                <span className="row-label">Email:</span>
                <span className="row-value">{certificate.userEmail}</span>
              </div>
              <div className="info-row">
                <span className="row-label">Course:</span>
                <span className="row-value">{certificate.courseName}</span>
              </div>
              <div className="info-row">
                <span className="row-label">Category:</span>
                <span className="row-value">{certificate.courseCategory}</span>
              </div>
              <div className="info-row">
                <span className="row-label">Level:</span>
                <span className="row-value">{certificate.courseLevel}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="info-card">
            <h3>📊 Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-icon">📚</div>
                <div className="metric-value">{certificate.completionMetrics?.completedLessons || 0}/{certificate.completionMetrics?.totalLessons || 0}</div>
                <div className="metric-label">Lessons Completed</div>
              </div>
              <div className="metric-box">
                <div className="metric-icon">✅</div>
                <div className="metric-value">{certificate.completionMetrics?.passedQuizzes || 0}/{certificate.completionMetrics?.totalQuizzes || 0}</div>
                <div className="metric-label">Quizzes Passed</div>
              </div>
              <div className="metric-box">
                <div className="metric-icon">🎯</div>
                <div className="metric-value">{certificate.completionMetrics?.averageQuizScore?.toFixed(1) || 0}%</div>
                <div className="metric-label">Average Score</div>
              </div>
              <div className="metric-box">
                <div className="metric-icon">⏱️</div>
                <div className="metric-value">{Math.round((certificate.completionMetrics?.totalTimeSpent || 0) / 60)}h</div>
                <div className="metric-label">Time Spent</div>
              </div>
            </div>
          </div>

          {/* Skills Achieved */}
          {certificate.skillsAchieved && certificate.skillsAchieved.length > 0 && (
            <div className="info-card">
              <h3>🎯 Skills Achieved</h3>
              <div className="skills-grid">
                {certificate.skillsAchieved.map((skill, idx) => (
                  <div key={idx} className="skill-badge">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Status */}
          {verificationInfo && (
            <div className="info-card verification-card">
              <h3>✅ Verification Status</h3>
              <div className="verification-status">
                <div className="status-badge verified">
                  ✓ Verified
                </div>
                <p>This certificate has been verified and is authentic</p>
              </div>
              <div className="verification-details">
                <div className="verification-row">
                  <span>Verification Hash:</span>
                  <div className="hash-value">
                    <code>{certificate.certificateHash?.substring(0, 32)}...</code>
                    <button onClick={() => copyToClipboard(certificate.certificateHash)}>📋</button>
                  </div>
                </div>
                <div className="verification-row">
                  <span>Verified {verificationInfo.verificationCount || 0} times</span>
                </div>
                {certificate.lastVerifiedAt && (
                  <div className="verification-row">
                    <span>Last verified: {new Date(certificate.lastVerifiedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="verification-url">
                <label>Public Verification URL:</label>
                <div className="url-copy">
                  <input type="text" value={verificationUrl} readOnly />
                  <button onClick={() => copyToClipboard(verificationUrl)}>📋 Copy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateDetail;
