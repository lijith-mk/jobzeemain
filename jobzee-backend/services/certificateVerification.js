const Certificate = require('../models/Certificate');
const { verifyCertificateHash } = require('../utils/certificateHash');

/**
 * Certificate Verification Service
 * Handles certificate verification logic and business rules
 */

/**
 * Verify certificate by certificate ID
 * Performs complete verification including existence, integrity, and revocation checks
 * 
 * @param {string} certificateId - Unique certificate identifier
 * @returns {Promise<Object>} - Verification result with status and certificate data
 * 
 * @example
 * const result = await verifyCertificateById('CERT-2026-ABC123');
 * // Returns:
 * // {
 * //   valid: true,
 * //   verificationStatus: 'verified',
 * //   message: 'Certificate is valid',
 * //   certificateId: 'CERT-2026-ABC123',
 * //   courseName: 'JavaScript Fundamentals',
 * //   issuedTo: 'John Doe',
 * //   issuedAt: '2026-02-05T10:30:00.000Z',
 * //   certificate: { ... }
 * // }
 */
async function verifyCertificateById(certificateId) {
  try {
    // Step 1: Check if certificate exists
    const certificate = await Certificate.findOne({ certificateId })
      .select('-userAgent -ipAddress -userEmail') // Exclude sensitive data
      .lean();

    if (!certificate) {
      return {
        valid: false,
        verificationStatus: 'not_found',
        message: 'Certificate not found',
        certificateId
      };
    }

    // Step 2: Check if certificate is revoked
    if (certificate.isRevoked) {
      return {
        valid: false,
        verificationStatus: 'revoked',
        message: 'This certificate has been revoked',
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
      return {
        valid: false,
        verificationStatus: 'integrity_failed',
        message: 'Certificate integrity check failed - possible tampering detected',
        certificateId: certificate.certificateId
      };
    }

    // Step 4: Record verification attempt
    await Certificate.findOneAndUpdate(
      { certificateId },
      {
        $inc: { verificationCount: 1 },
        $set: { lastVerifiedAt: new Date() }
      }
    );

    // Step 5: Return successful verification
    return {
      valid: true,
      verificationStatus: certificate.verificationStatus,
      message: 'Certificate is valid and verified',
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
      honors: certificate.honors,
      grade: certificate.grade
    };

  } catch (error) {
    console.error('Certificate verification error:', error);
    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Verify certificate by hash
 * Alternative verification method using certificate hash
 * 
 * @param {string} certificateHash - SHA-256 hash of certificate
 * @returns {Promise<Object>} - Verification result
 */
async function verifyCertificateByHash(certificateHash) {
  try {
    const certificate = await Certificate.findOne({ certificateHash })
      .select('-userAgent -ipAddress -userEmail')
      .lean();

    if (!certificate) {
      return {
        valid: false,
        verificationStatus: 'not_found',
        message: 'Certificate not found'
      };
    }

    // Check revocation
    if (certificate.isRevoked) {
      return {
        valid: false,
        verificationStatus: 'revoked',
        message: 'This certificate has been revoked',
        revokedAt: certificate.revokedAt
      };
    }

    // Verify integrity
    const integrityValid = verifyCertificateHash(certificate);

    if (!integrityValid) {
      return {
        valid: false,
        verificationStatus: 'integrity_failed',
        message: 'Certificate integrity check failed'
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

    return {
      valid: true,
      verificationStatus: certificate.verificationStatus,
      message: 'Certificate is valid',
      certificateId: certificate.certificateId,
      courseName: certificate.courseName,
      issuedTo: certificate.userName,
      issuedAt: certificate.issuedAt,
      certificateHash: certificate.certificateHash
    };

  } catch (error) {
    console.error('Certificate hash verification error:', error);
    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Batch verify multiple certificates
 * Useful for employer verification of multiple candidate certificates
 * 
 * @param {Array<string>} certificateIds - Array of certificate IDs to verify
 * @returns {Promise<Array>} - Array of verification results
 */
async function batchVerifyCertificates(certificateIds) {
  const results = await Promise.all(
    certificateIds.map(id => verifyCertificateById(id).catch(err => ({
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
