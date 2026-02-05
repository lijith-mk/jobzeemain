const mongoose = require('mongoose');

/**
 * Certificate Verification Log Model
 * Tracks all certificate verification attempts for audit trail, fraud detection, and analytics
 * Helps identify suspicious patterns and provides compliance documentation
 */

const certificateVerificationLogSchema = new mongoose.Schema({
  // Certificate reference
  certificateId: {
    type: String,
    required: true,
    index: true
  },

  // Verification attempt number (for this certificate)
  verificationAttempt: {
    type: Number,
    required: true,
    default: 1
  },

  // Verification result
  result: {
    type: String,
    required: true,
    enum: ['success', 'not_found', 'revoked', 'integrity_failed', 'error'],
    index: true
  },

  resultMessage: {
    type: String,
    required: true
  },

  // Verifier information
  verifierIp: {
    type: String,
    required: true,
    index: true
  },

  verifierUserAgent: {
    type: String,
    required: true
  },

  verifierCountry: {
    type: String,
    default: null,
    index: true
  },

  verifierCity: {
    type: String,
    default: null
  },

  // Optional: If verifier is a logged-in user
  verifierUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
    sparse: true
  },

  verifierUserType: {
    type: String,
    enum: ['user', 'employer', 'guest', null],
    default: 'guest'
  },

  // Verification method/channel
  verificationMethod: {
    type: String,
    required: true,
    enum: ['web', 'api', 'qr_scan', 'mobile_app'],
    default: 'web',
    index: true
  },

  // Request details
  requestUrl: {
    type: String,
    default: null
  },

  requestReferer: {
    type: String,
    default: null
  },

  // Performance metrics
  responseTime: {
    type: Number, // milliseconds
    default: null
  },

  // Fraud detection flags
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },

  suspiciousReason: {
    type: String,
    default: null
  },

  suspiciousScore: {
    type: Number, // 0-100, higher = more suspicious
    default: 0,
    index: true
  },

  // Rate limiting tracking
  ipAttemptCount: {
    type: Number, // How many times this IP has verified in last hour
    default: 1
  },

  certificateAttemptCount: {
    type: Number, // How many times this certificate was verified today
    default: 1
  },

  // Blockchain verification (if applicable)
  blockchainVerified: {
    type: Boolean,
    default: false
  },

  blockchainNetwork: {
    type: String,
    default: null
  },

  // Metadata
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // Using custom timestamp field
  versionKey: false
});

// Compound indexes for common queries
certificateVerificationLogSchema.index({ certificateId: 1, timestamp: -1 }); // Certificate verification history
certificateVerificationLogSchema.index({ verifierIp: 1, timestamp: -1 }); // IP activity tracking
certificateVerificationLogSchema.index({ result: 1, timestamp: -1 }); // Failed verification tracking
certificateVerificationLogSchema.index({ isSuspicious: 1, timestamp: -1 }); // Suspicious activity
certificateVerificationLogSchema.index({ timestamp: -1 }); // Recent verifications
certificateVerificationLogSchema.index({ certificateId: 1, verifierIp: 1, timestamp: -1 }); // Duplicate detection

// Static method to log verification attempt
certificateVerificationLogSchema.statics.logVerification = async function({
  certificateId,
  result,
  resultMessage,
  verifierIp,
  verifierUserAgent,
  verifierUserId = null,
  verifierUserType = 'guest',
  verificationMethod = 'web',
  requestUrl = null,
  requestReferer = null,
  responseTime = null,
  blockchainVerified = false,
  blockchainNetwork = null
}) {
  try {
    // Get attempt count for this certificate
    const certificateAttemptCount = await this.countDocuments({
      certificateId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    // Get attempt count for this IP in last hour
    const ipAttemptCount = await this.countDocuments({
      verifierIp,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    // Calculate suspicious score
    let suspiciousScore = 0;
    let suspiciousReasons = [];

    // Check for excessive IP attempts (potential scraping)
    if (ipAttemptCount > 50) {
      suspiciousScore += 40;
      suspiciousReasons.push('Excessive IP attempts');
    } else if (ipAttemptCount > 20) {
      suspiciousScore += 20;
      suspiciousReasons.push('High IP activity');
    }

    // Check for excessive certificate verifications (potential fraud)
    if (certificateAttemptCount > 100) {
      suspiciousScore += 30;
      suspiciousReasons.push('Certificate verified excessively');
    } else if (certificateAttemptCount > 50) {
      suspiciousScore += 15;
      suspiciousReasons.push('High certificate verification count');
    }

    // Check for suspicious user agents (bots)
    const botPatterns = ['bot', 'crawl', 'spider', 'scrape'];
    const isBotUserAgent = botPatterns.some(pattern => 
      verifierUserAgent.toLowerCase().includes(pattern)
    );
    if (isBotUserAgent) {
      suspiciousScore += 20;
      suspiciousReasons.push('Bot user agent detected');
    }

    // Check for missing referer (direct access, potential API abuse)
    if (!requestReferer && verificationMethod === 'web') {
      suspiciousScore += 10;
      suspiciousReasons.push('Missing referer');
    }

    const isSuspicious = suspiciousScore > 30;
    const suspiciousReason = suspiciousReasons.length > 0 
      ? suspiciousReasons.join('; ') 
      : null;

    // Create log entry
    const log = await this.create({
      certificateId,
      verificationAttempt: certificateAttemptCount + 1,
      result,
      resultMessage,
      verifierIp,
      verifierUserAgent,
      verifierUserId,
      verifierUserType,
      verificationMethod,
      requestUrl,
      requestReferer,
      responseTime,
      blockchainVerified,
      blockchainNetwork,
      isSuspicious,
      suspiciousReason,
      suspiciousScore,
      ipAttemptCount: ipAttemptCount + 1,
      certificateAttemptCount: certificateAttemptCount + 1,
      timestamp: new Date()
    });

    return log;
  } catch (error) {
    console.error('Error logging verification:', error);
    // Don't throw error - logging failure shouldn't break verification
    return null;
  }
};

// Static method to get verification statistics
certificateVerificationLogSchema.statics.getStatistics = async function(certificateId) {
  try {
    const stats = await this.aggregate([
      { $match: { certificateId } },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 },
          lastVerified: { $max: '$timestamp' }
        }
      }
    ]);

    const totalVerifications = await this.countDocuments({ certificateId });
    const suspiciousAttempts = await this.countDocuments({ 
      certificateId, 
      isSuspicious: true 
    });

    return {
      totalVerifications,
      suspiciousAttempts,
      resultBreakdown: stats,
      lastVerified: stats.length > 0 
        ? stats.reduce((latest, curr) => 
            curr.lastVerified > latest ? curr.lastVerified : latest, 
            stats[0].lastVerified
          ) 
        : null
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
};

// Static method to detect fraud patterns
certificateVerificationLogSchema.statics.detectFraudPatterns = async function() {
  try {
    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);

    // Find IPs with excessive attempts
    const suspiciousIPs = await this.aggregate([
      { $match: { timestamp: { $gte: hourAgo } } },
      {
        $group: {
          _id: '$verifierIp',
          attemptCount: { $sum: 1 },
          uniqueCertificates: { $addToSet: '$certificateId' }
        }
      },
      { $match: { attemptCount: { $gt: 50 } } },
      { $sort: { attemptCount: -1 } },
      { $limit: 10 }
    ]);

    // Find certificates verified excessively
    const dayCertificates = await this.aggregate([
      { $match: { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: '$certificateId',
          attemptCount: { $sum: 1 },
          uniqueIPs: { $addToSet: '$verifierIp' }
        }
      },
      { $match: { attemptCount: { $gt: 100 } } },
      { $sort: { attemptCount: -1 } },
      { $limit: 10 }
    ]);

    return {
      suspiciousIPs: suspiciousIPs.map(ip => ({
        ip: ip._id,
        attemptCount: ip.attemptCount,
        uniqueCertificates: ip.uniqueCertificates.length
      })),
      excessivelyVerifiedCertificates: dayCertificates.map(cert => ({
        certificateId: cert._id,
        attemptCount: cert.attemptCount,
        uniqueIPs: cert.uniqueIPs.length
      }))
    };
  } catch (error) {
    console.error('Error detecting fraud patterns:', error);
    return null;
  }
};

// Auto-cleanup: Remove logs older than 1 year (optional, can be configured)
certificateVerificationLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 365) {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await this.deleteMany({ timestamp: { $lt: cutoffDate } });
    console.log(`Cleaned up ${result.deletedCount} old verification logs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return 0;
  }
};

module.exports = mongoose.model('CertificateVerificationLog', certificateVerificationLogSchema);
