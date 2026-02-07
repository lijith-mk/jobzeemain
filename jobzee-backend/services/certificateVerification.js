const Certificate = require('../models/Certificate');
const CertificateVerificationLog = require('../models/CertificateVerificationLog');
const { verifyCertificateHash } = require('../utils/certificateHash');
const { verifyCertificateOnBlockchain, isBlockchainConfigured } = require('./blockchainService');

/**
 * Certificate Verification Service
 * Handles certificate verification logic and business rules
 * All verification attempts are logged for audit trail and fraud detection
 */

/**
 * Verify certificate by certificate ID
 * Performs complete verification including existence, integrity, and revocation checks
 * 
 * @param {string} certificateId - Unique certificate identifier
 * @param {Object} requestContext - Request information for logging
 * @param {string} requestContext.ip - Verifier IP address
 * @param {string} requestContext.userAgent - Verifier user agent
 * @param {string} requestContext.userId - Optional logged-in user ID
 * @param {string} requestContext.userType - Optional user type ('user', 'employer', 'guest')
 * @param {string} requestContext.method - Verification method ('web', 'api', 'qr_scan')
 * @param {string} requestContext.url - Request URL
 * @param {string} requestContext.referer - Request referer
 * @returns {Promise<Object>} - Verification result with status and certificate data
 */
async function verifyCertificateById(certificateId, requestContext = {}) {
  const startTime = Date.now();
  let result, resultMessage;

  try {
    // Step 1: Check if certificate exists
    const certificate = await Certificate.findOne({ certificateId })
      .select('-userAgent -ipAddress -userEmail') // Exclude sensitive data
      .lean();

    if (!certificate) {
      result = 'not_found';
      resultMessage = 'Certificate not found';
      
      // Log failed verification attempt
      await CertificateVerificationLog.logVerification({
        certificateId,
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'not_found',
        message: resultMessage,
        certificateId
      };
    }

    // Step 2: Check if certificate is revoked
    if (certificate.isRevoked) {
      result = 'revoked';
      resultMessage = 'This certificate has been revoked';
      
      // Log revoked certificate verification
      await CertificateVerificationLog.logVerification({
        certificateId,
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'revoked',
        message: resultMessage,
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        issuedTo: certificate.userName,
        issuedAt: certificate.issuedAt,
        revokedAt: certificate.revokedAt,
        revokedReason: certificate.revokedReason
      };
    }

    // Step 3: Verify hash integrity (detect tampering)
    const integrityValid = verifyCertificateHash(certificate);

    if (!integrityValid) {
      result = 'integrity_failed';
      resultMessage = 'Certificate integrity check failed - possible tampering detected';
      
      // Log integrity failure (high priority for fraud detection)
      await CertificateVerificationLog.logVerification({
        certificateId,
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'integrity_failed',
        message: resultMessage,
        certificateId: certificate.certificateId
      };
    }

    // Step 4: Record verification attempt in Certificate model
    await Certificate.findOneAndUpdate(
      { certificateId },
      {
        $inc: { verificationCount: 1 },
        $set: { lastVerifiedAt: new Date() }
      }
    );

    // Step 5: Blockchain verification (if configured and certificate has blockchain data)
    let blockchainVerification = null;
    if (isBlockchainConfigured() && certificate.blockchainTxHash) {
      try {
        console.log(`🔗 Verifying certificate ${certificateId} on blockchain...`);
        blockchainVerification = await verifyCertificateOnBlockchain(
          certificate.certificateId,
          certificate.certificateHash
        );
        
        if (blockchainVerification.verified) {
          console.log('✅ Certificate verified on blockchain');
        } else {
          console.warn('⚠️  Blockchain verification failed:', blockchainVerification.reason);
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain verification error:', blockchainError);
        // Don't fail verification if blockchain check fails
        blockchainVerification = {
          error: blockchainError.message,
          verified: false
        };
      }
    }

    // Step 6: Log successful verification
    result = 'success';
    resultMessage = 'Certificate is valid and verified';
    
    await CertificateVerificationLog.logVerification({
      certificateId,
      result,
      resultMessage,
      verifierIp: requestContext.ip || 'unknown',
      verifierUserAgent: requestContext.userAgent || 'unknown',
      verifierUserId: requestContext.userId || null,
      verifierUserType: requestContext.userType || 'guest',
      verificationMethod: requestContext.method || 'web',
      requestUrl: requestContext.url || null,
      requestReferer: requestContext.referer || null,
      responseTime: Date.now() - startTime,
      blockchainVerified: !!certificate.blockchainTxHash,
      blockchainNetwork: certificate.blockchainNetwork || null
    });

    // Step 6: Return successful verification
    return {
      valid: true,
      verificationStatus: certificate.verificationStatus,
      message: resultMessage,
      certificateId: certificate.certificateId,
      courseName: certificate.courseName,
      issuedTo: certificate.userName,
      issuedAt: certificate.issuedAt,
      courseCategory: certificate.courseCategory,
      courseLevel: certificate.courseLevel,
      skillsAchieved: certificate.skillsAchieved,
      completionMetrics: certificate.completionMetrics,
      certificateHash: certificate.certificateHash,
      blockchainTxHash: certificate.blockchainTxHash,
      blockchainNetwork: certificate.blockchainNetwork,
      blockchainVerification: blockchainVerification,
      honors: certificate.honors,
      grade: certificate.grade
    };

  } catch (error) {
    console.error('Certificate verification error:', error);
    
    // Log error
    await CertificateVerificationLog.logVerification({
      certificateId,
      result: 'error',
      resultMessage: error.message,
      verifierIp: requestContext.ip || 'unknown',
      verifierUserAgent: requestContext.userAgent || 'unknown',
      verifierUserId: requestContext.userId || null,
      verifierUserType: requestContext.userType || 'guest',
      verificationMethod: requestContext.method || 'web',
      requestUrl: requestContext.url || null,
      requestReferer: requestContext.referer || null,
      responseTime: Date.now() - startTime
    }).catch(err => console.error('Failed to log error:', err));

    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Verify certificate by hash
 * Alternative verification method using certificate hash
 * 
 * @param {string} certificateHash - SHA-256 hash of certificate
 * @param {Object} requestContext - Request information for logging
 * @returns {Promise<Object>} - Verification result
 */
async function verifyCertificateByHash(certificateHash, requestContext = {}) {
  const startTime = Date.now();
  let result, resultMessage, certificateId = 'unknown';

  try {
    const certificate = await Certificate.findOne({ certificateHash })
      .select('-userAgent -ipAddress -userEmail')
      .lean();

    if (!certificate) {
      result = 'not_found';
      resultMessage = 'Certificate not found';
      
      await CertificateVerificationLog.logVerification({
        certificateId: certificateHash.substring(0, 16) + '...', // Log partial hash
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'not_found',
        message: resultMessage
      };
    }

    certificateId = certificate.certificateId;

    // Check revocation
    if (certificate.isRevoked) {
      result = 'revoked';
      resultMessage = 'This certificate has been revoked';
      
      await CertificateVerificationLog.logVerification({
        certificateId,
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'revoked',
        message: resultMessage,
        revokedAt: certificate.revokedAt
      };
    }

    // Verify integrity
    const integrityValid = verifyCertificateHash(certificate);

    if (!integrityValid) {
      result = 'integrity_failed';
      resultMessage = 'Certificate integrity check failed';
      
      await CertificateVerificationLog.logVerification({
        certificateId,
        result,
        resultMessage,
        verifierIp: requestContext.ip || 'unknown',
        verifierUserAgent: requestContext.userAgent || 'unknown',
        verifierUserId: requestContext.userId || null,
        verifierUserType: requestContext.userType || 'guest',
        verificationMethod: requestContext.method || 'web',
        requestUrl: requestContext.url || null,
        requestReferer: requestContext.referer || null,
        responseTime: Date.now() - startTime
      });

      return {
        valid: false,
        verificationStatus: 'integrity_failed',
        message: resultMessage
      };
    }

    // Record verification
    await Certificate.findOneAndUpdate(
      { certificateHash },
      {
        $inc: { verificationCount: 1 },
        $set: { lastVerifiedAt: new Date() }
      }
    );

    // Log success
    result = 'success';
    resultMessage = 'Certificate is valid';
    
    await CertificateVerificationLog.logVerification({
      certificateId,
      result,
      resultMessage,
      verifierIp: requestContext.ip || 'unknown',
      verifierUserAgent: requestContext.userAgent || 'unknown',
      verifierUserId: requestContext.userId || null,
      verifierUserType: requestContext.userType || 'guest',
      verificationMethod: requestContext.method || 'web',
      requestUrl: requestContext.url || null,
      requestReferer: requestContext.referer || null,
      responseTime: Date.now() - startTime,
      blockchainVerified: !!certificate.blockchainTxHash,
      blockchainNetwork: certificate.blockchainNetwork || null
    });

    return {
      valid: true,
      verificationStatus: certificate.verificationStatus,
      message: resultMessage,
      certificateId: certificate.certificateId,
      courseName: certificate.courseName,
      issuedTo: certificate.userName,
      issuedAt: certificate.issuedAt,
      certificateHash: certificate.certificateHash
    };

  } catch (error) {
    console.error('Certificate hash verification error:', error);
    
    await CertificateVerificationLog.logVerification({
      certificateId: certificateId || certificateHash.substring(0, 16) + '...',
      result: 'error',
      resultMessage: error.message,
      verifierIp: requestContext.ip || 'unknown',
      verifierUserAgent: requestContext.userAgent || 'unknown',
      verifierUserId: requestContext.userId || null,
      verifierUserType: requestContext.userType || 'guest',
      verificationMethod: requestContext.method || 'web',
      requestUrl: requestContext.url || null,
      requestReferer: requestContext.referer || null,
      responseTime: Date.now() - startTime
    }).catch(err => console.error('Failed to log error:', err));

    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Batch verify multiple certificates
 * Useful for employer verification of multiple candidate certificates
 * 
 * @param {Array<string>} certificateIds - Array of certificate IDs to verify
 * @param {Object} requestContext - Request information for logging
 * @returns {Promise<Array>} - Array of verification results
 */
async function batchVerifyCertificates(certificateIds, requestContext = {}) {
  const results = await Promise.all(
    certificateIds.map(id => verifyCertificateById(id, requestContext).catch(err => ({
      valid: false,
      certificateId: id,
      message: err.message
    })))
  );

  return {
    total: certificateIds.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    results
  };
}

module.exports = {
  verifyCertificateById,
  verifyCertificateByHash,
  batchVerifyCertificates
};
