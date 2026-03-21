const axios = require('axios');
const Certificate = require('../models/Certificate');
const CertificateVerificationLog = require('../models/CertificateVerificationLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// ─────────────────────────────────────────────
// Circuit Breaker — in-memory AI service health
// ─────────────────────────────────────────────
const circuitBreaker = {
  isUp: null,          // null = unknown, true = up, false = down
  lastChecked: 0,
  checkInterval: 60 * 1000,   // re-probe every 60 seconds
  failureCount: 0,
  failureThreshold: 2,         // mark down after 2 consecutive failures

  // Returns true if we should attempt the AI call
  shouldAttempt() {
    const now = Date.now();
    // Unknown state — try it
    if (this.isUp === null) return true;
    // Known up — try it
    if (this.isUp === true) return true;
    // Known down — only retry after checkInterval
    if (this.isUp === false && (now - this.lastChecked) > this.checkInterval) {
      console.log('[FraudCircuitBreaker] Retrying AI service after cooldown...');
      return true;
    }
    return false;
  },

  recordSuccess() {
    this.isUp = true;
    this.failureCount = 0;
    this.lastChecked = Date.now();
  },

  recordFailure() {
    this.failureCount += 1;
    this.lastChecked = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      if (this.isUp !== false) {
        console.warn('[FraudCircuitBreaker] AI service is DOWN — switching to fallback scoring');
      }
      this.isUp = false;
    }
  },

  status() {
    return {
      isUp: this.isUp,
      failureCount: this.failureCount,
      lastChecked: this.lastChecked ? new Date(this.lastChecked).toISOString() : null,
    };
  }
};

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
  // ── Step 1: Get current log count ──────────────────────────────
  const currentLogCount = await CertificateVerificationLog.countDocuments({ certificateId });

  // ── Step 2: Check cache on Certificate document ────────────────
  const cert = await Certificate.findOne({ certificateId })
    .select('fraudScore riskLevel fraudScoreCachedAt fraudScoreLogCount fraudAnalysisResult')
    .lean();

  const hasCachedScore = cert &&
    cert.fraudScore !== undefined &&
    cert.fraudScore !== null &&
    cert.fraudScoreLogCount === currentLogCount;

  if (hasCachedScore) {
    // Return cached result — no AI call needed
    return {
      certificateId,
      features: null,
      aiResponse: {
        fraud_score: cert.fraudScore,
        risk_level: cert.riskLevel,
        model_loaded: true,
        used_fallback: false,
        top_signals: cert.fraudAnalysisResult?.topSignals || [],
        from_cache: true,
      }
    };
  }

  // ── Step 3: Build features ─────────────────────────────────────
  const features = await buildFraudFeatures(certificateId);

  // ── Step 4: Circuit breaker check ─────────────────────────────
  if (!circuitBreaker.shouldAttempt()) {
    console.warn(`[FraudCircuitBreaker] AI service is down — using fallback for ${certificateId}`);
    return {
      certificateId,
      features,
      aiResponse: {
        fraud_score: null,
        risk_level: 'unknown',
        model_loaded: false,
        used_fallback: true,
        top_signals: [],
        ai_service_down: true,
      }
    };
  }

  // ── Step 5: Call AI service ────────────────────────────────────
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/fraud-score`,
      { certificate_id: certificateId, features },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
    );

    circuitBreaker.recordSuccess();

    const aiResponse = response.data;

    // ── Step 6: Persist score to Certificate (cache) ───────────
    await Certificate.findOneAndUpdate(
      { certificateId },
      {
        $set: {
          fraudScore: aiResponse.fraud_score,
          riskLevel: aiResponse.risk_level,
          fraudScoreCachedAt: new Date(),
          fraudScoreLogCount: currentLogCount,
          'fraudAnalysisResult.topSignals': aiResponse.top_signals,
          'fraudAnalysisResult.modelLoaded': aiResponse.model_loaded,
          'fraudAnalysisResult.usedFallback': aiResponse.used_fallback,
          'fraudAnalysisResult.timestamp': new Date(),
        }
      }
    );

    return { certificateId, features, aiResponse };

  } catch (err) {
    circuitBreaker.recordFailure();
    console.error(`[FraudScoring] AI service call failed for ${certificateId}:`, err.message);

    // Return fallback — don't throw, fraud scoring is non-blocking
    return {
      certificateId,
      features,
      aiResponse: {
        fraud_score: null,
        risk_level: 'unknown',
        model_loaded: false,
        used_fallback: true,
        top_signals: [],
        ai_service_down: true,
      }
    };
  }
}

// Export circuit breaker status for health check endpoint
function getCircuitBreakerStatus() {
  return circuitBreaker.status();
}

module.exports = {
  buildFraudFeatures,
  scoreCertificateFraud,
  getCircuitBreakerStatus,
};
