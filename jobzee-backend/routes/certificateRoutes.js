const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const certificateController = require('../controllers/certificateController');

// ============================================
// USER ROUTES - Certificate Operations
// ============================================

/**
 * Generate certificate for completed course
 * POST /api/certificates/generate
 * Protected: User must be authenticated
 */
router.post(
  '/generate',
  auth,
  certificateController.generateCertificate
);

/**
 * Check certificate eligibility for a course
 * GET /api/certificates/eligibility/:courseId
 * Protected: User must be authenticated
 */
router.get(
  '/eligibility/:courseId',
  auth,
  certificateController.checkEligibility
);

/**
 * Get all certificates for authenticated user
 * GET /api/certificates/my-certificates
 * Protected: User must be authenticated
 */
router.get(
  '/my-certificates',
  auth,
  certificateController.getMyCertificates
);

/**
 * Get specific certificate by certificate ID
 * GET /api/certificates/:certificateId
 * Protected: User must be authenticated
 */
router.get(
  '/:certificateId',
  auth,
  certificateController.getCertificate
);

/**
 * Download certificate (PDF/Image)
 * GET /api/certificates/:certificateId/download
 * Protected: User must be authenticated
 */
router.get(
  '/:certificateId/download',
  auth,
  certificateController.downloadCertificate
);

// ============================================
// PUBLIC ROUTES - Certificate Verification
// ============================================

/**
 * Verify certificate by certificate ID (Public)
 * GET /api/certificates/verify/:certificateId
 * Public: No authentication required
 */
router.get(
  '/verify/:certificateId',
  certificateController.verifyCertificate
);

/**
 * Verify certificate by hash (Public)
 * POST /api/certificates/verify-hash
 * Public: No authentication required
 */
router.post(
  '/verify-hash',
  certificateController.verifyCertificateByHash
);

/**
 * Batch verify multiple certificates (Public)
 * POST /api/certificates/verify-batch
 * Public: No authentication required
 * Useful for employers verifying candidate certificates
 */
router.post(
  '/verify-batch',
  certificateController.batchVerifyCertificates
);

// ============================================
// ADMIN ROUTES - Certificate Management
// ============================================

/**
 * Get all certificates with filtering
 * GET /api/certificates/admin/all
 * Protected: Admin only
 */
router.get(
  '/admin/all',
  adminAuth,
  certificateController.getAllCertificates
);

/**
 * Get certificate statistics
 * GET /api/certificates/admin/statistics
 * Protected: Admin only
 */
router.get(
  '/admin/statistics',
  adminAuth,
  certificateController.getCertificateStatistics
);

/**
 * Revoke a certificate
 * POST /api/certificates/admin/:certificateId/revoke
 * Protected: Admin only
 */
router.post(
  '/admin/:certificateId/revoke',
  adminAuth,
  certificateController.revokeCertificate
);

/**
 * Bulk generate certificates for a course
 * POST /api/certificates/admin/bulk-generate
 * Protected: Admin only
 */
router.post(
  '/admin/bulk-generate',
  adminAuth,
  certificateController.bulkGenerateCertificates
);

module.exports = router;
