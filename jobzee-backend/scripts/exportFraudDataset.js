require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

const Certificate = require('../models/Certificate');
const CertificateVerificationLog = require('../models/CertificateVerificationLog');

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

async function buildFeatureRow(certificate, walletUsageMap) {
  const logs = await CertificateVerificationLog.find({ certificateId: certificate.certificateId }).lean();

  const totalVerifications = logs.length;
  const successfulVerifications = logs.filter(l => l.result === 'success').length;
  const failedVerifications = logs.filter(l => l.result !== 'success').length;
  const suspiciousAttempts = logs.filter(l => l.isSuspicious).length;

  const ipSet = new Set(logs.map(l => l.verifierIp).filter(Boolean));
  const userAgentSet = new Set(logs.map(l => l.verifierUserAgent).filter(Boolean));

  const responseTimes = logs.map(l => l.responseTime).filter(v => typeof v === 'number');
  const avgResponseTime = responseTimes.length
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
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
  const walletReuseCount = walletAddress ? (walletUsageMap.get(walletAddress) || 0) : 0;

  const likelyFraudLabel = (() => {
    // Require multiple signals before labeling as fraud
    // A single failed verification or suspicious attempt is NOT enough
    let fraudSignals = 0;

    // Strong signals (each worth 2 points)
    if (certificate.isRevoked) fraudSignals += 2;
    if (maxSuspiciousScore >= 70) fraudSignals += 2;
    if (failedVerifications > 0 && successfulVerifications === 0 && totalVerifications >= 3) fraudSignals += 2;

    // Medium signals (each worth 1 point)
    if (suspiciousAttempts >= 3) fraudSignals += 1;
    if (maxSuspiciousScore >= 40 && maxSuspiciousScore < 70) fraudSignals += 1;
    if (totalVerifications > 0 && failedVerifications / totalVerifications > 0.6) fraudSignals += 1;
    if (ipSet.size > 20) fraudSignals += 1;

    // Weak signals (each worth 0.5 points)
    if (suspiciousAttempts >= 1 && suspiciousAttempts < 3) fraudSignals += 0.5;

    // Need at least 2 points to be labeled fraud
    return fraudSignals >= 2 ? 1 : 0;
  })();

  return {
    certificate_id: certificate.certificateId,
    verification_status: certificate.verificationStatus || 'unknown',
    is_revoked: certificate.isRevoked ? 1 : 0,
    has_blockchain_tx: certificate.blockchainTxHash ? 1 : 0,
    has_wallet_address: walletAddress ? 1 : 0,
    wallet_reuse_count: walletReuseCount,
    blockchain_network: certificate.blockchainNetwork || '',
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
    verification_window_hours: Number(verificationWindowHours.toFixed(4)),
    likely_fraud_label: likelyFraudLabel
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('📤 EXPORT FRAUD DATASET (CERTIFICATES + VERIFICATION LOGS)');
  console.log('='.repeat(80));

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in environment variables');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const certificates = await Certificate.find({}).lean();
  console.log(`Found certificates: ${certificates.length}`);

  const walletUsageMap = new Map();
  for (const cert of certificates) {
    if (cert.blockchainWalletAddress) {
      walletUsageMap.set(
        cert.blockchainWalletAddress,
        (walletUsageMap.get(cert.blockchainWalletAddress) || 0) + 1
      );
    }
  }

  if (!certificates.length) {
    console.log('No certificates found. Run synthetic generation first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const rows = [];
  for (let i = 0; i < certificates.length; i++) {
    const row = await buildFeatureRow(certificates[i], walletUsageMap);
    rows.push(row);
    if ((i + 1) % 50 === 0 || i + 1 === certificates.length) {
      console.log(`Processed ${i + 1}/${certificates.length}`);
    }
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => toCsvValue(row[h])).join(','));
  }

  const outputDir = path.join(__dirname, '..', 'data', 'ml');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `fraud_dataset_${Date.now()}.csv`);
  await fs.writeFile(outputPath, lines.join('\n'), 'utf8');

  const fraudCount = rows.filter(r => r.likely_fraud_label === 1).length;
  const normalCount = rows.length - fraudCount;

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DATASET EXPORT COMPLETED');
  console.log('='.repeat(80));
  console.log(`Rows exported: ${rows.length}`);
  console.log(`Likely fraud rows: ${fraudCount}`);
  console.log(`Likely normal rows: ${normalCount}`);
  console.log(`CSV output: ${outputPath}`);
  console.log('');

  // Data quality check — tell user if they have enough to retrain
  const fraudRate = fraudCount / rows.length;
  console.log('='.repeat(80));
  console.log('📊 DATA QUALITY REPORT');
  console.log('='.repeat(80));
  if (rows.length < 200) {
    console.log(`⚠️  Only ${rows.length} rows — need at least 200 to retrain reliably.`);
    console.log('   Keep collecting real data. Run this export again later.');
  } else if (fraudRate < 0.05) {
    console.log(`⚠️  Fraud rate is very low (${(fraudRate * 100).toFixed(1)}%).`);
    console.log('   Model may struggle to learn fraud patterns. Consider generating more synthetic fraud cases.');
  } else if (fraudRate > 0.5) {
    console.log(`⚠️  Fraud rate is very high (${(fraudRate * 100).toFixed(1)}%).`);
    console.log('   Check your labeling logic — real fraud rate should be 5-20%.');
  } else {
    console.log(`✅ Dataset looks good! ${rows.length} rows, ${(fraudRate * 100).toFixed(1)}% fraud rate.`);
    console.log('   Ready to retrain. Run:');
    console.log(`   cd ai-service && python retrain.py --csv ${outputPath}`);
  }
  console.log('');

  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('❌ Fatal error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
