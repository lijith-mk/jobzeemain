import React, { useState, useEffect } from 'react';
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

      if (data.valid) {
        setVerificationResult(data);
        toast.success('✅ Certificate verified successfully!');
      } else {
        setError(data.message || 'Certificate verification failed');
        setVerificationResult(data);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMsg = err.response?.data?.message || 'Unable to verify certificate. Please check the ID and try again.';
      setError(errorMsg);
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if certificateId is in URL
  useEffect(() => {
    if (urlCertificateId && urlCertificateId.trim()) {
      handleVerify();
    }
    // eslint-disable-next-line
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
                <p>{verificationResult.message || 'This certificate is authentic and valid'}</p>
              </div>
            </div>

            <div className="result-body">
              <div className="result-card">
                <h3>📋 Certificate Information</h3>
                <div className="result-info">
                  <div className="info-row">
                    <span className="info-label">Certificate ID:</span>
                    <span className="info-value cert-id">{verificationResult.certificateId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Recipient:</span>
                    <span className="info-value">{verificationResult.issuedTo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Course:</span>
                    <span className="info-value">{verificationResult.courseName}</span>
                  </div>
                  {verificationResult.courseCategory && (
                    <div className="info-row">
                      <span className="info-label">Category:</span>
                      <span className="info-value category-badge">{verificationResult.courseCategory}</span>
                    </div>
                  )}
                  {verificationResult.courseLevel && (
                    <div className="info-row">
                      <span className="info-label">Level:</span>
                      <span className="info-value level-badge">
                        {verificationResult.courseLevel.charAt(0).toUpperCase() + verificationResult.courseLevel.slice(1)}
                      </span>
                    </div>
                  )}
                  {verificationResult.grade && (
                    <div className="info-row">
                      <span className="info-label">Grade:</span>
                      <span className={`grade-badge ${getGradeBadgeClass(verificationResult.grade)}`}>
                        {verificationResult.grade}
                      </span>
                    </div>
                  )}
                  {verificationResult.honors && (
                    <div className="info-row">
                      <span className="info-label">Achievement:</span>
                      <span className="honors-badge">🏆 With Honors</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Issued On:</span>
                    <span className="info-value">
                      {new Date(verificationResult.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Verification Status:</span>
                    <span className="status-badge verified">
                      ✓ {verificationResult.verificationStatus || 'Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {verificationResult.skillsAchieved && verificationResult.skillsAchieved.length > 0 && (
                <div className="result-card">
                  <h3>🎯 Skills Achieved</h3>
                  <div className="skills-list">
                    {verificationResult.skillsAchieved.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {verificationResult.completionMetrics && (
                <div className="result-card">
                  <h3>📊 Performance Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-value">
                        {verificationResult.completionMetrics.completedLessons || 0}/
                        {verificationResult.completionMetrics.totalLessons || 0}
                      </div>
                      <div className="metric-label">Lessons Completed</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">
                        {verificationResult.completionMetrics.passedQuizzes || 0}/
                        {verificationResult.completionMetrics.totalQuizzes || 0}
                      </div>
                      <div className="metric-label">Quizzes Passed</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">
                        {verificationResult.completionMetrics.averageQuizScore?.toFixed(0) || 0}%
                      </div>
                      <div className="metric-label">Average Score</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">
                        {verificationResult.completionMetrics.completionPercentage || 100}%
                      </div>
                      <div className="metric-label">Completion Rate</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="result-card security-info">
                <h3>🔐 Security & Verification</h3>
                <div className="security-details">
                  <div className="security-item">
                    <span className="label">Certificate Hash (SHA-256):</span>
                    <code className="hash-code">
                      {verificationResult.certificateHash?.substring(0, 40)}...
                    </code>
                  </div>
                  {verificationResult.blockchainTxHash && (
                    <div className="security-item">
                      <span className="label">Blockchain Transaction:</span>
                      <code className="hash-code">
                        {verificationResult.blockchainTxHash.substring(0, 40)}...
                      </code>
                      {verificationResult.blockchainNetwork && (
                        <span className="blockchain-badge">
                          {verificationResult.blockchainNetwork.toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="security-note">
                  ✓ This certificate has been cryptographically verified using blockchain-ready SHA-256 hashing.
                  All certificate data is immutable and tamper-proof.
                </p>
              </div>
            </div>
          </div>
        )}

        {verificationResult && !verificationResult.valid && (
          <div className="verification-result">
            <div className="result-header invalid">
              <div className="result-icon">❌</div>
              <div>
                <h2>Verification Failed</h2>
                <p>{verificationResult.message || 'This certificate could not be verified'}</p>
              </div>
            </div>

            <div className="result-body">
              <div className="result-card invalid-info">
                <h3>⚠️ Verification Details</h3>
                <div className="result-info">
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="status-badge invalid">
                      {verificationResult.verificationStatus || 'Invalid'}
                    </span>
                  </div>
                  {verificationResult.certificateId && (
                    <div className="info-row">
                      <span className="info-label">Certificate ID:</span>
                      <span className="info-value">{verificationResult.certificateId}</span>
                    </div>
                  )}
                  {verificationResult.revokedAt && (
                    <div className="info-row">
                      <span className="info-label">Revoked On:</span>
                      <span className="info-value">
                        {new Date(verificationResult.revokedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {verificationResult.revokedReason && (
                    <div className="info-row">
                      <span className="info-label">Reason:</span>
                      <span className="info-value revoked-reason">{verificationResult.revokedReason}</span>
                    </div>
                  )}
                </div>
                <p className="invalid-note">
                  This certificate may have been revoked, tampered with, or does not exist in our records.
                  Please contact the certificate issuer for more information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="verify-info">
        <h3>📖 How to Verify a Certificate</h3>
        <ol>
          <li>Obtain the <strong>Certificate ID</strong> from the certificate holder (format: CERT-YEAR-XXXXXX)</li>
          <li>Enter the certificate ID in the verification form above</li>
          <li>Click <strong>"Verify Certificate"</strong> to initiate the verification process</li>
          <li>Review the verification results including certificate details, recipient information, and security data</li>
        </ol>
        <div className="trust-indicators">
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>Blockchain-Ready Hashing</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <span>Cryptographically Verified</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🛡️</span>
            <span>Tamper-Proof Records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
