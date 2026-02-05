import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './VerifyCertificate.css';

const VerifyCertificate = () => {
  const { certificateId: urlCertificateId } = useParams();
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState(urlCertificateId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/verify/${certificateId.trim()}`
      );

      setVerificationResult(data);
      toast.success('Certificate verified successfully!');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Certificate not found or invalid');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if certificateId is in URL
  React.useEffect(() => {
    if (urlCertificateId) {
      handleVerify();
    }
  }, []);

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

  return (
    <div className="verify-container">
      <div className="verify-header">
        <h1>🔍 Verify Certificate</h1>
        <p>Enter a certificate ID to verify its authenticity</p>
      </div>

      <div className="verify-content">
        <div className="verify-form-section">
          <form className="verify-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="certificateId">Certificate ID</label>
              <input
                type="text"
                id="certificateId"
                placeholder="e.g., CERT-2026-ABC123"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="verify-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Verify Certificate
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <div>
                <h4>Verification Failed</h4>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {verificationResult && verificationResult.valid && (
          <div className="verification-result">
            <div className="result-header success">
              <div className="result-icon">✅</div>
              <div>
                <h2>Certificate Verified</h2>
                <p>This certificate is authentic and valid</p>
              </div>
            </div>

            <div className="result-body">
              <div className="result-card">
                <h3>📋 Certificate Information</h3>
                <div className="result-info">
                  <div className="info-row">
                    <span className="info-label">Certificate ID:</span>
                    <span className="info-value">{verificationResult.certificate.certificateId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Recipient:</span>
                    <span className="info-value">{verificationResult.certificate.userName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{verificationResult.certificate.userEmail}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Course:</span>
                    <span className="info-value">{verificationResult.certificate.courseName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{verificationResult.certificate.courseCategory}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Level:</span>
                    <span className="info-value">{verificationResult.certificate.courseLevel}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Grade:</span>
                    <span className={`grade-badge ${getGradeBadgeClass(verificationResult.certificate.grade)}`}>
                      {verificationResult.certificate.grade}
                    </span>
                  </div>
                  {verificationResult.certificate.honors && (
                    <div className="info-row">
                      <span className="info-label">Achievement:</span>
                      <span className="honors-badge">🏆 With Honors</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Issued On:</span>
                    <span className="info-value">
                      {new Date(verificationResult.certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Verification Status:</span>
                    <span className="status-badge verified">
                      ✓ {verificationResult.certificate.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {verificationResult.certificate.skillsAchieved && verificationResult.certificate.skillsAchieved.length > 0 && (
                <div className="result-card">
                  <h3>🎯 Skills Achieved</h3>
                  <div className="skills-list">
                    {verificationResult.certificate.skillsAchieved.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-card">
                <h3>📊 Performance Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <div className="metric-value">
                      {verificationResult.certificate.completionMetrics?.completedLessons || 0}/
                      {verificationResult.certificate.completionMetrics?.totalLessons || 0}
                    </div>
                    <div className="metric-label">Lessons</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {verificationResult.certificate.completionMetrics?.passedQuizzes || 0}/
                      {verificationResult.certificate.completionMetrics?.totalQuizzes || 0}
                    </div>
                    <div className="metric-label">Quizzes</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {verificationResult.certificate.completionMetrics?.averageQuizScore?.toFixed(0) || 0}%
                    </div>
                    <div className="metric-label">Average Score</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">
                      {verificationResult.certificate.completionMetrics?.completionPercentage || 100}%
                    </div>
                    <div className="metric-label">Completion</div>
                  </div>
                </div>
              </div>

              <div className="result-card security-info">
                <h3>🔐 Security Information</h3>
                <div className="security-details">
                  <div className="security-item">
                    <span className="label">Certificate Hash:</span>
                    <code className="hash-code">
                      {verificationResult.certificate.certificateHash?.substring(0, 32)}...
                    </code>
                  </div>
                  <div className="security-item">
                    <span className="label">Verification Count:</span>
                    <span className="value">{verificationResult.verificationCount || 0} times</span>
                  </div>
                  {verificationResult.certificate.lastVerifiedAt && (
                    <div className="security-item">
                      <span className="label">Last Verified:</span>
                      <span className="value">
                        {new Date(verificationResult.certificate.lastVerifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="security-note">
                  ✓ This certificate has been cryptographically verified and is immutable.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="verify-info">
        <h3>How to Verify a Certificate</h3>
        <ol>
          <li>Obtain the certificate ID from the certificate holder</li>
          <li>Enter the certificate ID in the form above</li>
          <li>Click "Verify Certificate" to check authenticity</li>
          <li>View the complete certificate details if valid</li>
        </ol>
      </div>
    </div>
  );
};

export default VerifyCertificate;
