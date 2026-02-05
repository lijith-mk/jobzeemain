const crypto = require('crypto');

/**
 * Certificate Hash Utility
 * Provides reusable functions for generating and verifying certificate hashes
 * Used for blockchain-ready cryptographic verification
 */

/**
 * Generate SHA-256 hash for certificate
 * Uses core immutable identifiers: certificateId, userId, courseId, issuedAt
 * 
 * @param {Object} data - Certificate data
 * @param {string} data.certificateId - Unique certificate identifier
 * @param {string} data.userId - User ObjectId as string
 * @param {string} data.courseId - Course ObjectId as string
 * @param {Date|string} data.issuedAt - Certificate issue date
 * @returns {string} - 64-character SHA-256 hash (hex)
 * 
 * @example
 * const hash = generateCertificateHash({
 *   certificateId: 'CERT-2026-ABC123',
 *   userId: '507f1f77bcf86cd799439011',
 *   courseId: '507f191e810c19729de860ea',
 *   issuedAt: new Date('2026-02-05T10:30:00.000Z')
 * });
 * // Returns: 'c707919a7c83ee25b296d1b964653cf49b6a2849c4b6c3d607f1b82a4deb98b5'
 */
function generateCertificateHash({ certificateId, userId, courseId, issuedAt }) {
  // Validate required fields
  if (!certificateId || !userId || !courseId || !issuedAt) {
    throw new Error('Missing required fields for hash generation: certificateId, userId, courseId, issuedAt');
  }

  // Convert date to ISO string if it's a Date object
  const issuedAtStr = issuedAt instanceof Date ? issuedAt.toISOString() : issuedAt;

  // Create data string from core immutable identifiers
  // Format: certificateId-userId-courseId-issuedAt
  const data = `${certificateId}-${userId}-${courseId}-${issuedAtStr}`;

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  return hash;
}

/**
 * Verify certificate hash integrity
 * Regenerates hash from certificate data and compares with stored hash
 * 
 * @param {Object} certificate - Certificate object with data and hash
 * @param {string} certificate.certificateId - Certificate identifier
 * @param {string} certificate.userId - User ID
 * @param {string} certificate.courseId - Course ID
 * @param {Date|string} certificate.issuedAt - Issue date
 * @param {string} certificate.certificateHash - Stored hash to verify against
 * @returns {boolean} - True if hash matches, false otherwise
 * 
 * @example
 * const isValid = verifyCertificateHash({
 *   certificateId: 'CERT-2026-ABC123',
 *   userId: '507f1f77bcf86cd799439011',
 *   courseId: '507f191e810c19729de860ea',
 *   issuedAt: new Date('2026-02-05T10:30:00.000Z'),
 *   certificateHash: 'c707919a7c83ee25b296d1b964653cf49b6a2849c4b6c3d607f1b82a4deb98b5'
 * });
 * // Returns: true
 */
function verifyCertificateHash(certificate) {
  try {
    // Generate expected hash from certificate data
    const expectedHash = generateCertificateHash({
      certificateId: certificate.certificateId,
      userId: certificate.userId.toString(),
      courseId: certificate.courseId.toString(),
      issuedAt: certificate.issuedAt
    });

    // Compare with stored hash
    return expectedHash === certificate.certificateHash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

/**
 * Get hash input data string (for debugging/logging)
 * 
 * @param {Object} data - Certificate data
 * @returns {string} - The data string used for hashing
 */
function getHashInputString({ certificateId, userId, courseId, issuedAt }) {
  const issuedAtStr = issuedAt instanceof Date ? issuedAt.toISOString() : issuedAt;
  return `${certificateId}-${userId}-${courseId}-${issuedAtStr}`;
}

module.exports = {
  generateCertificateHash,
  verifyCertificateHash,
  getHashInputString
};
