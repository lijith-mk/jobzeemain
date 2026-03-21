require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const Certificate = require('../models/Certificate');
const CertificateVerificationLog = require('../models/CertificateVerificationLog');
const { generateCertificateHash } = require('../utils/certificateHash');
const {
  registerCertificateOnBlockchain,
  isBlockchainConfigured
} = require('../services/blockchainService');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    count: 100,
    onchain: false,
    logsPerCertMin: 2,
    logsPerCertMax: 8
  };

  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      result.count = Math.max(1, parseInt(arg.split('=')[1], 10) || 100);
    } else if (arg === '--onchain=true') {
      result.onchain = true;
    } else if (arg === '--onchain=false') {
      result.onchain = false;
    } else if (arg.startsWith('--logs-min=')) {
      result.logsPerCertMin = Math.max(1, parseInt(arg.split('=')[1], 10) || 2);
    } else if (arg.startsWith('--logs-max=')) {
      result.logsPerCertMax = Math.max(result.logsPerCertMin, parseInt(arg.split('=')[1], 10) || 8);
    }
  });

  return result;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
  return items[randomInt(0, items.length - 1)];
}

function maybe(probability) {
  return Math.random() < probability;
}

function gradeFromScore(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 55) return 'C';
  return 'Pass';
}

function buildSyntheticCertificate(index) {
  const firstNames = ['Akhil', 'Neha', 'Riya', 'Arjun', 'David', 'Sara', 'Liam', 'Meera', 'Vikram', 'Asha'];
  const lastNames = ['Kumar', 'Nair', 'Patel', 'Sharma', 'George', 'Das', 'Singh', 'Reddy', 'Iyer', 'Khan'];
  const categories = ['Web Development', 'AI/ML', 'Data Science', 'Cloud', 'Cyber Security'];
  const levels = ['beginner', 'intermediate', 'advanced'];
  const skillsPool = ['React', 'Node.js', 'MongoDB', 'Python', 'TensorFlow', 'AWS', 'Docker', 'SQL', 'Security', 'REST API'];

  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const userName = `${firstName} ${lastName}`;
  const courseCategory = randomItem(categories);
  const courseLevel = randomItem(levels);
  const averageQuizScore = randomInt(55, 99);
  const honors = averageQuizScore >= 92;
  const totalLessons = randomInt(10, 35);
  const completedLessons = totalLessons;
  const totalQuizzes = randomInt(3, 12);
  const passedQuizzes = randomInt(Math.max(1, totalQuizzes - 2), totalQuizzes);
  const issueDaysAgo = randomInt(1, 180);
  const issuedAt = new Date(Date.now() - issueDaysAgo * 24 * 60 * 60 * 1000);
  const skillCount = randomInt(3, 6);
  const skillsAchieved = Array.from(new Set(Array.from({ length: skillCount }, () => randomItem(skillsPool))));

  return {
    certificateId: `SYN-CERT-${new Date().getFullYear()}-${String(index).padStart(6, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    userId: new mongoose.Types.ObjectId(),
    courseId: new mongoose.Types.ObjectId(),
    userName,
    userEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@synthetic.jobzee.ai`,
    courseName: `${courseCategory} Masterclass ${randomInt(1, 20)}`,
    courseCategory,
    courseLevel,
    issuedAt,
    completionMetrics: {
      totalLessons,
      completedLessons,
      totalQuizzes,
      passedQuizzes,
      averageQuizScore,
      totalTimeSpent: randomInt(180, 3600),
      completionPercentage: 100
    },
    certificateTemplate: honors ? 'honors' : 'default',
    skillsAchieved,
    grade: gradeFromScore(averageQuizScore),
    honors,
    verificationStatus: 'verified',
    ipAddress: `192.168.${randomInt(1, 15)}.${randomInt(2, 254)}`,
    userAgent: randomItem([
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36'
    ])
  };
}

async function createVerificationLogs(certificateId, hasBlockchainData, minLogs, maxLogs) {
  const methods = ['web', 'api', 'mobile_app', 'qr_scan'];
  const normalAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
  ];
  const botAgents = [
    'python-requests/2.31.0 bot',
    'Mozilla/5.0 compatible; data-scrape-bot/1.2',
    'curl/8.4.0 spider'
  ];

  const isLikelyFraud = maybe(0.12);
  const logCount = randomInt(minLogs, maxLogs);

  for (let i = 0; i < logCount; i++) {
    const suspiciousAttempt = isLikelyFraud && maybe(0.55);
    const result = suspiciousAttempt
      ? randomItem(['not_found', 'integrity_failed', 'error'])
      : randomItem(['success', 'success', 'success', 'revoked']);

    await CertificateVerificationLog.logVerification({
      certificateId,
      result,
      resultMessage: result === 'success'
        ? 'Certificate is valid and verified'
        : result === 'revoked'
          ? 'This certificate has been revoked'
          : result === 'not_found'
            ? 'Certificate not found'
            : result === 'integrity_failed'
              ? 'Certificate integrity check failed - possible tampering detected'
              : 'Verification failed due to server error',
      verifierIp: suspiciousAttempt
        ? `10.10.10.${randomInt(2, 254)}`
        : `172.16.${randomInt(1, 12)}.${randomInt(2, 254)}`,
      verifierUserAgent: suspiciousAttempt ? randomItem(botAgents) : randomItem(normalAgents),
      verifierUserType: randomItem(['user', 'employer', 'guest']),
      verificationMethod: randomItem(methods),
      requestUrl: `/api/certificates/verify/${certificateId}`,
      requestReferer: maybe(0.85) ? 'https://jobzee-frontend.onrender.com/verify-certificate' : null,
      responseTime: randomInt(35, 1200),
      blockchainVerified: hasBlockchainData && result === 'success',
      blockchainNetwork: hasBlockchainData ? 'sepolia' : null
    });
  }
}

async function main() {
  const args = parseArgs();

  console.log('='.repeat(80));
  console.log('🧪 SYNTHETIC CERTIFICATE + VERIFICATION DATA GENERATOR');
  console.log('='.repeat(80));
  console.log(`Count: ${args.count}`);
  console.log(`On-chain registration: ${args.onchain ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Verification logs per cert: ${args.logsPerCertMin}-${args.logsPerCertMax}`);
  console.log('');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in environment variables');
  }

  if (args.onchain && !isBlockchainConfigured()) {
    throw new Error('Blockchain not fully configured. Set ETH_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const summary = {
    created: 0,
    onchainSuccess: 0,
    onchainFailed: 0,
    logsCreated: 0,
    failedRecords: 0
  };

  const runTag = `SYNTH-${Date.now()}`;
  const createdIds = [];

  for (let i = 1; i <= args.count; i++) {
    try {
      const data = buildSyntheticCertificate(i);
      data.certificateId = `${runTag}-${String(i).padStart(5, '0')}`;

      // Generate certificate hash manually (same logic as pre-save hook)
      data.certificateHash = generateCertificateHash({
        certificateId: data.certificateId,
        userId: data.userId.toString(),
        courseId: data.courseId.toString(),
        issuedAt: data.issuedAt
      });

      const certificate = new Certificate(data);
      await certificate.save();
      summary.created += 1;

      let hasBlockchainData = false;
      if (args.onchain) {
        const blockchainResult = await registerCertificateOnBlockchain(
          certificate.certificateId,
          certificate.certificateHash
        );

        if (blockchainResult.success) {
          certificate.blockchainTxHash = blockchainResult.transactionHash;
          certificate.blockchainNetwork = blockchainResult.network;
          certificate.blockchainWalletAddress = blockchainResult.walletAddress || null;
          certificate.blockchainTimestamp = blockchainResult.blockchainTimestamp
            ? new Date(blockchainResult.blockchainTimestamp * 1000)
            : new Date();
          certificate.verificationStatus = 'blockchain-verified';
          await certificate.save();
          summary.onchainSuccess += 1;
          hasBlockchainData = true;
        } else {
          summary.onchainFailed += 1;
        }
      }

      const beforeCount = await CertificateVerificationLog.countDocuments({ certificateId: certificate.certificateId });
      await createVerificationLogs(
        certificate.certificateId,
        hasBlockchainData,
        args.logsPerCertMin,
        args.logsPerCertMax
      );
      const afterCount = await CertificateVerificationLog.countDocuments({ certificateId: certificate.certificateId });
      summary.logsCreated += (afterCount - beforeCount);

      createdIds.push(certificate.certificateId);

      if (i % 10 === 0 || i === args.count) {
        console.log(`Progress: ${i}/${args.count} certificates processed`);
      }
    } catch (error) {
      summary.failedRecords += 1;
      console.error(`❌ Failed at record ${i}:`, error.message);
    }
  }

  const outputDir = path.join(__dirname, '..', 'data', 'ml');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `synthetic_run_${Date.now()}.json`);
  await fs.writeFile(
    outputPath,
    JSON.stringify({ runTag, args, summary, createdIds }, null, 2),
    'utf8'
  );

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ SYNTHETIC DATA GENERATION COMPLETED');
  console.log('='.repeat(80));
  console.log(`Certificates created: ${summary.created}`);
  console.log(`On-chain success: ${summary.onchainSuccess}`);
  console.log(`On-chain failed: ${summary.onchainFailed}`);
  console.log(`Verification logs created: ${summary.logsCreated}`);
  console.log(`Failed records: ${summary.failedRecords}`);
  console.log(`Run report: ${outputPath}`);
  console.log('');
  console.log('Next step: npm run ml:export-dataset');

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
