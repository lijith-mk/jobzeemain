const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const { generateCertificateHash } = require('../utils/certificateHash');
const { verifyCertificateById, verifyCertificateByHash, batchVerifyCertificates } = require('../services/certificateVerification');
const path = require('path');
const { 
  validateCertificateGeneration,
  checkCertificateEligibility 
} = require('../utils/certificateEligibility');
const {
  generateAndSaveCertificate,
  generateCertificateBuffer
} = require('../utils/certificateGenerator');
const { registerCertificateOnBlockchain, isBlockchainConfigured } = require('../services/blockchainService');

/**
 * Certificate Controller
 * Handles certificate generation, verification, and management
 */

// ============================================
// USER CONTROLLERS - Certificate Operations
// ============================================

/**
 * Generate certificate for user
 * POST /api/certificates/generate
 */
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?._id || req.user?.id;
    
    console.log('=== generateCertificate Controller ===');
    console.log('User ID:', userId);
    console.log('Course ID:', courseId);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Validate eligibility and get data
    const validation = await validateCertificateGeneration(userId, courseId);
    
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        message: validation.message,
        details: validation.details
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ userId, courseId });
    if (existingCertificate) {
      return res.status(409).json({
        success: false,
        message: 'Certificate already exists for this course',
        certificate: existingCertificate.getPublicData()
      });
    }

    // Get user and course details
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: 'User or course not found'
      });
    }

    // Create certificate
    const certificate = new Certificate({
      userId,
      courseId,
      userName: user.name,
      userEmail: user.email,
      courseName: course.title,
      courseCategory: course.category,
      courseLevel: course.level,
      completionMetrics: validation.data.metrics,
      grade: validation.data.grade,
      honors: validation.data.honors,
      skillsAchieved: course.skills || [],
      certificateTemplate: validation.data.honors ? 'honors' : 'default',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log('Certificate before save:', {
      certificateId: certificate.certificateId,
      issuedAt: certificate.issuedAt,
      userName: certificate.userName,
      courseName: certificate.courseName
    });

    // Manually generate hash (in case pre-save hook doesn't run)
    if (!certificate.certificateHash) {
      certificate.certificateHash = generateCertificateHash({
        certificateId: certificate.certificateId,
        userId: certificate.userId.toString(),
        courseId: certificate.courseId.toString(),
        issuedAt: certificate.issuedAt
      });
      console.log('Manually generated blockchain-ready hash:', certificate.certificateHash);
    }

    await certificate.save();
    
    console.log('Certificate after save:', {
      certificateId: certificate.certificateId,
      certificateHash: certificate.certificateHash
    });

    // Generate PDF certificate
    try {
      const pdfResult = await generateAndSaveCertificate({
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseName: certificate.courseName,
        courseCategory: certificate.courseCategory,
        courseLevel: certificate.courseLevel,
        grade: certificate.grade,
        honors: certificate.honors,
        skillsAchieved: certificate.skillsAchieved,
        issuedAt: certificate.issuedAt
      });

      // Update certificate with PDF URL
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      certificate.certificateUrl = `${baseUrl}/${pdfResult.filePath}`;
      await certificate.save();

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Don't fail the certificate creation, just log the error
    }

    // Update course progress
    await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      { 
        certificateIssued: true,
        certificateUrl: certificate.certificateUrl,
        status: 'completed',
        completedAt: new Date()
      }
    );

    // Register certificate on blockchain (if configured)
    if (isBlockchainConfigured()) {
      try {
        console.log('🔗 Registering certificate on blockchain...');
        const blockchainResult = await registerCertificateOnBlockchain(
          certificate.certificateId,
          certificate.certificateHash
        );

        if (blockchainResult.success) {
          console.log('✅ Certificate registered on blockchain:', blockchainResult.transactionHash);
          
          // Update certificate with blockchain data
          certificate.blockchainTxHash = blockchainResult.transactionHash;
          certificate.blockchainNetwork = blockchainResult.network;
          certificate.blockchainTimestamp = blockchainResult.blockchainTimestamp 
            ? new Date(blockchainResult.blockchainTimestamp * 1000) 
            : null;
          certificate.status = 'blockchain-verified';
          await certificate.save();
          
          console.log('   Explorer:', blockchainResult.explorer);
        } else {
          console.error('❌ Blockchain registration failed:', blockchainResult.error);
          // Don't fail certificate generation, just log the error
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain registration error:', blockchainError);
        // Don't fail certificate generation, blockchain is optional
      }
    } else {
      console.log('⚠️  Blockchain not configured - certificate saved without blockchain verification');
    }

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: certificate.getPublicData()
    });

  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
};

/**
 * Check certificate eligibility
 * GET /api/certificates/eligibility/:courseId
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log('=== checkEligibility Controller ===');
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user?._id);
    console.log('req.user.id:', req.user?.id);
    
    const userId = req.user?._id || req.user?.id;
    console.log('Using userId:', userId);

    const eligibility = await checkCertificateEligibility(userId, courseId);

    res.json({
      success: true,
      ...eligibility
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking eligibility',
      error: error.message
    });
  }
};

/**
 * Get user's certificates
 * GET /api/certificates/my-certificates
 */
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { page = 1, limit = 10, sortBy = '-issuedAt' } = req.query;

    const certificates = await Certificate.find({ userId, isRevoked: false })
      .populate('courseId', 'title thumbnail category level')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments({ userId, isRevoked: false });

    res.json({
      success: true,
      certificates: certificates.map(cert => cert.getPublicData()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
};

/**
 * Get specific certificate
 * GET /api/certificates/:certificateId
 */
exports.getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const certificate = await Certificate.findOne({ 
      certificateId,
      userId 
    }).populate('courseId', 'title thumbnail category level skills');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      certificate: certificate.getPublicData()
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate',
      error: error.message
    });
  }
};

/**
 * Download certificate (generate PDF/image)
 * GET /api/certificates/:certificateId/download
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const certificate = await Certificate.findOne({ 
      certificateId,
      userId 
    }).populate('courseId', 'title thumbnail');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.isRevoked) {
      return res.status(403).json({
        success: false,
        message: 'Certificate has been revoked'
      });
    }

    // Check if certificate file exists on disk
    if (certificate.certificateUrl) {
      const filePath = path.join(__dirname, '..', certificate.certificateUrl);
      
      if (fs.existsSync(filePath)) {
        // Read the file and send it
        const fileBuffer = fs.readFileSync(filePath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificateId}.pdf"`);
        res.setHeader('Content-Length', fileBuffer.length);
        
        return res.send(fileBuffer);
      }
    }

    // Generate PDF if file doesn't exist
    console.log('Generating fresh PDF for certificate:', certificateId);
    try {
      const pdfBuffer = await generateCertificateBuffer({
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseName: certificate.courseName,
        courseCategory: certificate.courseCategory,
        courseLevel: certificate.courseLevel,
        grade: certificate.grade,
        honors: certificate.honors,
        skillsAchieved: certificate.skillsAchieved,
        issuedAt: certificate.issuedAt
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificateId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Error generating certificate PDF',
        error: pdfError.message
      });
    }

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message
    });
  }
};

// ============================================
// PUBLIC CONTROLLERS - Certificate Verification
// ============================================

/**
 * Verify certificate by ID (public)
 * GET /api/certificates/verify/:certificateId
 */
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Input validation
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }

    // Build request context for logging
    const requestContext = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      userId: req.user?._id || req.user?.id || null,
      userType: req.user?.role || 'guest',
      method: 'web',
      url: req.originalUrl,
      referer: req.get('referer') || null
    };

    // Use verification service with logging
    const verification = await verifyCertificateById(certificateId, requestContext);

    res.json({
      success: verification.valid,
      ...verification
    });

  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message
    });
  }
};

/**
 * Verify certificate by hash (public)
 * POST /api/certificates/verify-hash
 */
exports.verifyCertificateByHash = async (req, res) => {
  try {
    const { certificateHash } = req.body;

    if (!certificateHash) {
      return res.status(400).json({
        success: false,
        message: 'Certificate hash is required'
      });
    }

    // Build request context for logging
    const requestContext = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      userId: req.user?._id || req.user?.id || null,
      userType: req.user?.role || 'guest',
      method: 'web',
      url: req.originalUrl,
      referer: req.get('referer') || null
    };

    // Use verification service with logging
    const verification = await verifyCertificateByHash(certificateHash, requestContext);

    res.json({
      success: verification.valid,
      ...verification
    });

  } catch (error) {
    console.error('Verify certificate by hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message
    });
  }
};

/**
 * Batch verify multiple certificates (public)
 * POST /api/certificates/verify-batch
 * Useful for employers verifying multiple candidate certificates
 */
exports.batchVerifyCertificates = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate IDs array is required'
      });
    }

    // Limit to 50 certificates per request
    if (certificateIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 certificates can be verified at once'
      });
    }

    // Build request context for logging
    const requestContext = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      userId: req.user?._id || req.user?.id || null,
      userType: req.user?.role || 'guest',
      method: 'api',
      url: req.originalUrl,
      referer: req.get('referer') || null
    };

    // Use verification service with logging
    const results = await batchVerifyCertificates(certificateIds, requestContext);

    res.json({
      success: true,
      message: `Verified ${results.total} certificates`,
      ...results
    });

  } catch (error) {
    console.error('Batch verify certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificates',
      error: error.message
    });
  }
};

// ============================================
// ADMIN CONTROLLERS - Certificate Management
// ============================================

/**
 * Get all certificates (admin)
 * GET /api/admin/certificates
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = '-issuedAt',
      status,
      courseId,
      search
    } = req.query;

    const query = {};

    if (status) {
      if (status === 'revoked') {
        query.isRevoked = true;
      } else {
        query.verificationStatus = status;
        query.isRevoked = false;
      }
    }

    if (courseId) {
      query.courseId = courseId;
    }

    if (search) {
      query.$or = [
        { certificateId: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title category level')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments(query);

    res.json({
      success: true,
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
};

/**
 * Get certificate statistics (admin)
 * GET /api/admin/certificates/statistics
 */
exports.getCertificateStatistics = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    const query = {};
    if (courseId) query.courseId = courseId;
    if (startDate || endDate) {
      query.issuedAt = {};
      if (startDate) query.issuedAt.$gte = new Date(startDate);
      if (endDate) query.issuedAt.$lte = new Date(endDate);
    }

    const [
      totalCertificates,
      totalRevoked,
      totalVerified,
      certificatesByGrade,
      certificatesByCourse
    ] = await Promise.all([
      Certificate.countDocuments(query),
      Certificate.countDocuments({ ...query, isRevoked: true }),
      Certificate.countDocuments({ ...query, verificationStatus: 'verified' }),
      Certificate.aggregate([
        { $match: query },
        { $group: { _id: '$grade', count: { $sum: 1 } } }
      ]),
      Certificate.aggregate([
        { $match: query },
        { $group: { 
          _id: '$courseId', 
          count: { $sum: 1 },
          avgQuizScore: { $avg: '$completionMetrics.averageQuizScore' }
        }},
        { $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }},
        { $unwind: '$course' },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      statistics: {
        totalCertificates,
        totalRevoked,
        totalVerified,
        activeRate: ((totalCertificates - totalRevoked) / totalCertificates * 100).toFixed(2) + '%',
        certificatesByGrade,
        topCourses: certificatesByCourse
      }
    });

  } catch (error) {
    console.error('Get certificate statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

/**
 * Revoke certificate (admin)
 * POST /api/admin/certificates/:certificateId/revoke
 */
exports.revokeCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for revocation is required'
      });
    }

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.isRevoked) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already revoked'
      });
    }

    await certificate.revoke(reason, adminId);

    // Update course progress
    await CourseProgress.findOneAndUpdate(
      { userId: certificate.userId, courseId: certificate.courseId },
      { certificateIssued: false }
    );

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      certificate: certificate.getPublicData()
    });

  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking certificate',
      error: error.message
    });
  }
};

/**
 * Bulk generate certificates for a course (admin)
 * POST /api/admin/certificates/bulk-generate
 */
exports.bulkGenerateCertificates = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find all eligible users
    const courseProgress = await CourseProgress.find({
      courseId,
      status: 'completed',
      certificateIssued: false
    });

    const results = {
      total: courseProgress.length,
      generated: 0,
      failed: 0,
      errors: []
    };

    for (const progress of courseProgress) {
      try {
        const validation = await validateCertificateGeneration(progress.userId, courseId);
        
        if (validation.valid) {
          const user = await User.findById(progress.userId);
          const course = await Course.findById(courseId);

          const certificate = new Certificate({
            userId: progress.userId,
            courseId,
            userName: user.name,
            userEmail: user.email,
            courseName: course.title,
            courseCategory: course.category,
            courseLevel: course.level,
            completionMetrics: validation.data.metrics,
            grade: validation.data.grade,
            honors: validation.data.honors,
            skillsAchieved: course.skills || [],
            certificateTemplate: validation.data.honors ? 'honors' : 'default'
          });

          await certificate.save();

          // Generate PDF certificate
          try {
            const pdfResult = await generateAndSaveCertificate({
              certificateId: certificate.certificateId,
              userName: certificate.userName,
              courseName: certificate.courseName,
              courseCategory: certificate.courseCategory,
              courseLevel: certificate.courseLevel,
              grade: certificate.grade,
              honors: certificate.honors,
              skillsAchieved: certificate.skillsAchieved,
              issuedAt: certificate.issuedAt
            });

            // Update certificate with PDF URL
            const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            certificate.certificateUrl = `${baseUrl}/${pdfResult.filePath}`;
            await certificate.save();
          } catch (pdfError) {
            console.error('PDF generation error for bulk:', pdfError);
          }

          await CourseProgress.findByIdAndUpdate(progress._id, {
            certificateIssued: true,
            certificateUrl: certificate.certificateUrl
          });

          results.generated++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: progress.userId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk certificate generation completed',
      results
    });

  } catch (error) {
    console.error('Bulk generate certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificates',
      error: error.message
    });
  }
};

module.exports = exports;
