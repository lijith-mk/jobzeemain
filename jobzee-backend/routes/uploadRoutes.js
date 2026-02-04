const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/upload');
const Event = require('../models/Event');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinaryUpload');
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const { adminAuth } = require('../middleware/adminAuth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const Employer = require('../models/Employer');

// Upload user profile photo
router.post('/user/profile-photo', uploadLimiter, auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/users');

    // Update user profile with new photo URL
    const user = await User.findById(req.user.id);
    
    // Delete old photo if exists
    if (user.profilePhoto) {
      const oldPublicId = getPublicIdFromUrl(user.profilePhoto);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old photo:', error);
        }
      }
    }

    // Update user with new photo URL
    user.profilePhoto = result.secure_url;
    await user.save();

    res.json({
      message: 'Profile photo uploaded successfully',
      photoUrl: result.secure_url
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile photo' });
  }
});

// Upload employer profile photo
router.post('/employer/profile-photo', uploadLimiter, employerAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/employers');

    // Update employer profile with new photo URL
    const employer = await Employer.findById(req.employer.id);
    
    // Delete old photo if exists
    if (employer.profilePhoto) {
      const oldPublicId = getPublicIdFromUrl(employer.profilePhoto);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old photo:', error);
        }
      }
    }

    // Update employer with new photo URL
    employer.profilePhoto = result.secure_url;
    await employer.save();

    res.json({
      message: 'Profile photo uploaded successfully',
      photoUrl: result.secure_url
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile photo' });
  }
});

// Upload company logo
router.post('/employer/company-logo', uploadLimiter, employerAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/companies');

    // Update employer profile with new logo URL
    const employer = await Employer.findById(req.employer.id);
    
    // Delete old logo if exists
    if (employer.companyLogo) {
      const oldPublicId = getPublicIdFromUrl(employer.companyLogo);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
    }

    // Update employer with new logo URL
    employer.companyLogo = result.secure_url;
    await employer.save();

    res.json({
      message: 'Company logo uploaded successfully',
      logoUrl: result.secure_url
    });
  } catch (error) {
    console.error('Company logo upload error:', error);
    res.status(500).json({ message: 'Failed to upload company logo' });
  }
});

// Upload product image (Admin)
router.post('/admin/product-image', uploadLimiter, adminAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file, 'jobzee/products');
    res.json({
      message: 'Product image uploaded successfully',
      photoUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ message: 'Failed to upload product image' });
  }
});

// Upload event banner
router.post('/employer/event-banner', uploadLimiter, employerAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/events');

    res.json({
      message: 'Event banner uploaded successfully',
      bannerUrl: result.secure_url
    });
  } catch (error) {
    console.error('Event banner upload error:', error);
    res.status(500).json({ message: 'Failed to upload event banner' });
  }
});

// Delete profile photo
router.delete('/user/profile-photo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profilePhoto) {
      const publicId = getPublicIdFromUrl(user.profilePhoto);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
      
      user.profilePhoto = null;
      await user.save();
    }

    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ message: 'Failed to delete profile photo' });
  }
});

// Delete employer profile photo
router.delete('/employer/profile-photo', employerAuth, async (req, res) => {
  try {
    const employer = await Employer.findById(req.employer.id);
    
    if (employer.profilePhoto) {
      const publicId = getPublicIdFromUrl(employer.profilePhoto);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
      
      employer.profilePhoto = null;
      await employer.save();
    }

    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ message: 'Failed to delete profile photo' });
  }
});

// Resume upload middleware
const multer = require('multer');
const path = require('path');

const resumeStorage = multer.memoryStorage();
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
  }
};

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: resumeFileFilter,
}).single('resume');

// Upload resume (PDF files)
router.post('/user/resume', uploadLimiter, auth, uploadResume, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/resumes');
    
    // Update user with resume URL
    const user = await User.findById(req.user.id);
    
    // Delete old resume if exists
    if (user.resume) {
      const oldPublicId = getPublicIdFromUrl(user.resume);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old resume:', error);
        }
      }
    }
    
    user.resume = result.secure_url;
    await user.save();
    
    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: result.secure_url
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Failed to upload resume' });
  }
});

// Upload course thumbnail (Admin only)
router.post('/admin/course-thumbnail', uploadLimiter, adminAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/courses');

    res.json({
      message: 'Course thumbnail uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Course thumbnail upload error:', error);
    res.status(500).json({ message: 'Failed to upload course thumbnail' });
  }
});

// Upload instructor photo (Admin only)
router.post('/admin/instructor-photo', uploadLimiter, adminAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'jobzee/instructors');

    res.json({
      message: 'Instructor photo uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Instructor photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload instructor photo' });
  }
});

module.exports = router;
