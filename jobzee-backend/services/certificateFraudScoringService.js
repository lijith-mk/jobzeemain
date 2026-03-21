const axios = require('axios');
const Certificate = require('../models/Certificate');
const CertificateVerificationLog = require('../models/CertificateVerificationLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

function gradeToNumeric(grade) {
  const map = {
    'A+': 7,
    'A': 6,
    'B+': 5,
    'B': 4,
    'C+': 3,
    'C': 2,
    'Pass': 1
  };
  return map[grade] || 0;
}

async function buildFraudFeatures(certificateId) {
  const certificate = await Certificate.findOne({ certificateId }).lean();
  if (!certificate) {
    throw new Error('Certificate not found');
  }

  const logs = await CertificateVerificationLog.find({ certificateId }).lean();

  const totalVerifications = logs.length;
  const successfulVerifications = logs.filter(l => l.result === 'success').length;
  const failedVerifications = logs.filter(l => l.result !== 'success').length;
  const suspiciousAttempts = logs.filter(l => l.isSuspicious).length;
  const ipSet = new Set(logs.map(l => l.verifierIp).filter(Boolean));
  const userAgentSet = new Set(logs.map(l => l.verifierUserAgent).filter(Boolean));
  const responseTimes = logs.map(l => l.responseTime).filter(v => typeof v === 'number');
  const avgResponseTime = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const suspiciousScores = logs.map(l => l.suspiciousScore || 0);
  const maxSuspiciousScore = suspiciousScores.length ? Math.max(...suspiciousScores) : 0;

  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const firstVerificationAt = sortedLogs[0]?.timestamp ? new Date(sortedLogs[0].timestamp) : null;
  const lastVerificationAt = sortedLogs[sortedLogs.length - 1]?.timestamp ? new Date(sortedLogs[sortedLogs.length - 1].timestamp) : null;
  const verificationWindowHours = firstVerificationAt && lastVerificationAt
    ? (lastVerificationAt - firstVerificationAt) / (1000 * 60 * 60)
    : 0;

  const issuedAt = new Date(certificate.issuedAt);
  const certificateAgeHours = (Date.now() - issuedAt.getTime()) / (1000 * 60 * 60);
  const blockchainDelayMinutes = certificate.blockchainTimestamp
    ? (new Date(certificate.blockchainTimestamp).getTime() - issuedAt.getTime()) / (1000 * 60)
    : -1;

  const completion = certificate.completionMetrics || {};
  const walletAddress = certificate.blockchainWalletAddress || null;
  const walletReuseCount = walletAddress
    ? await Certificate.countDocuments({ blockchainWalletAddress: walletAddress })
    : 0;

  return {
    is_revoked: certificate.isRevoked ? 1 : 0,
    has_blockchain_tx: certificate.blockchainTxHash ? 1 : 0,
    has_wallet_address: walletAddress ? 1 : 0,
    wallet_reuse_count: walletReuseCount,
    honors: certificate.honors ? 1 : 0,
    grade_numeric: gradeToNumeric(certificate.grade),
    completion_percentage: completion.completionPercentage || 0,
    total_lessons: completion.totalLessons || 0,
    completed_lessons: completion.completedLessons || 0,
    total_quizzes: completion.totalQuizzes || 0,
    passed_quizzes: completion.passedQuizzes || 0,
    average_quiz_score: completion.averageQuizScore || 0,
    total_time_spent_min: completion.totalTimeSpent || 0,
    certificate_age_hours: Number(certificateAgeHours.toFixed(4)),
    blockchain_delay_minutes: Number(blockchainDelayMinutes.toFixed(4)),
    total_verifications: totalVerifications,
    successful_verifications: successfulVerifications,
    failed_verifications: failedVerifications,
    suspicious_attempts: suspiciousAttempts,
    unique_verifier_ips: ipSet.size,
    unique_user_agents: userAgentSet.size,
    avg_response_time_ms: Number(avgResponseTime.toFixed(4)),
    max_suspicious_score: maxSuspiciousScore,
    verification_window_hours: Number(verificationWindowHours.toFixed(4))
  };
}

async function scoreCertificateFraud(certificateId) {
  const features = await buildFraudFeatures(certificateId);

  const response = await axios.post(
    `${AI_SERVICE_URL}/fraud-score`,
    {
      certificate_id: certificateId,
      features
    },
    {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    certificateId,
    features,
    aiResponse: response.data
  };
}

module.exports = {
  buildFraudFeatures,
  scoreCertificateFraud
};
