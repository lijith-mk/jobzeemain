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
      toast.info('Generating certificate PDF...')
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/${certificateId}/download`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
          timeout: 60000 // 60 second timeout for PDF generation
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to download certificate';
      
      // Handle blob error responses (convert to JSON)
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          console.error('Error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Download timeout. The server is taking too long. Please try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error generating certificate. Please try again or contact support.';
      }
      
      toast.error(errorMessage);
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
              {verificationInfo.fraudAnalysis && (
                <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>🧠 AI Fraud Risk Analysis</strong>
                    <span className="network-badge" style={{ 
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: verificationInfo.fraudAnalysis.riskLevel === 'high' ? '#fee2e2' : 
                                       verificationInfo.fraudAnalysis.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                      color: verificationInfo.fraudAnalysis.riskLevel === 'high' ? '#991b1b' : 
                             verificationInfo.fraudAnalysis.riskLevel === 'medium' ? '#92400e' : '#166534'
                    }}>
                      {verificationInfo.fraudAnalysis.riskLevel}
                    </span>
                  </div>
                  
                  {/* Fraud Score */}
                  <div style={{ fontSize: '13px', color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Score: <strong>{(verificationInfo.fraudAnalysis.fraudScore * 100).toFixed(2)}%</strong></span>
                    <div style={{
                      width: '120px',
                      height: '6px',
                      background: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${verificationInfo.fraudAnalysis.fraudScore * 100}%`,
                        height: '100%',
                        backgroundColor: verificationInfo.fraudAnalysis.fraudScore >= 0.75 ? '#dc2626' :
                                        verificationInfo.fraudAnalysis.fraudScore >= 0.45 ? '#f59e0b' : '#10b981',
                        transition: 'all 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Fallback Warning */}
                  {verificationInfo.fraudAnalysis.usedFallback && (
                    <div style={{ fontSize: '11px', color: '#ea580c', marginBottom: '8px', padding: '4px 6px', backgroundColor: '#fed7aa', borderRadius: '3px' }}>
                      ⚠️ Using fallback scoring system
                    </div>
                  )}

                  {/* Top Signals */}
                  {verificationInfo.fraudAnalysis.topSignals && verificationInfo.fraudAnalysis.topSignals.length > 0 && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '6px' }}>
                        🔍 Top Contributing Factors:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                        {verificationInfo.fraudAnalysis.topSignals.slice(0, 5).map((signal, idx) => (
                          <div key={idx} style={{
                            padding: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                                  {signal.feature?.replace(/_/g, ' ') || 'unknown'}
                                </span>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                  Value: {typeof signal.raw_value === 'number' ? signal.raw_value.toFixed(2) : signal.raw_value}
                                </div>
                              </div>
                              <div style={{
                                textAlign: 'right',
                                padding: '4px 8px',
                                backgroundColor: signal.direction === 'increases_fraud' ? '#fee2e2' : '#dcfce7',
                                color: signal.direction === 'increases_fraud' ? '#991b1b' : '#166534',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                {signal.direction === 'increases_fraud' ? '⬆️ Fraud' : '⬇️ Legit'}
                              </div>
                            </div>
                            {signal.shap_value !== undefined && (
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
                                Impact: {(signal.shap_value * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Info */}
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    Model: {verificationInfo.fraudAnalysis.modelLoaded ? '✅ Loaded' : '⚠️ Using fallback'} • Updated: {verificationInfo.fraudAnalysis.timestamp ? new Date(verificationInfo.fraudAnalysis.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              )}
              <div className="verification-details">
                <div className="verification-row">
                  <span>Verification Hash:</span>
                  <div className="hash-value">
                    <code>{certificate.certificateHash?.substring(0, 32)}...</code>
                    <button onClick={() => copyToClipboard(certificate.certificateHash)}>📋</button>
                  </div>
                </div>
                {certificate.blockchainTxHash && (
                  <>
                    <div className="verification-row blockchain-row">
                      <span>⛓️ Blockchain Transaction:</span>
                      <div className="hash-value">
                        <code>{certificate.blockchainTxHash.substring(0, 32)}...</code>
                        <button onClick={() => copyToClipboard(certificate.blockchainTxHash)}>📋</button>
                      </div>
                    </div>
                    <div className="verification-row">
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${certificate.blockchainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="etherscan-button"
                      >
                        🔗 View on Etherscan
                      </a>
                    </div>
                    {certificate.blockchainNetwork && (
                      <div className="verification-row">
                        <span>Network: </span>
                        <span className="network-badge">{certificate.blockchainNetwork.toUpperCase()}</span>
                      </div>
                    )}
                  </>
                )}
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
