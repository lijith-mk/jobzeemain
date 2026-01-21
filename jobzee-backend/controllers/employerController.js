const Employer = require('../models/Employer');
const Job = require('../models/Job');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const EmployerSignIn = require('../models/EmployerSignIn');
const EmployerNotification = require('../models/EmployerNotification');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateToken = (employerId, role = 'employer') => {
  return jwt.sign(
    { id: employerId, role },
    process.env.JWT_SECRET || 'fallback_jwt_secret_key',
    { expiresIn: '7d' }
  );
};

// Employer Registration
exports.registerEmployer = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      password,
      contactPersonName,
      contactPersonTitle,
      contactPersonEmail,
      contactPersonPhone,
      industry,
      companySize,
      foundedYear,
      headquarters,
      website
    } = req.body;

    console.log('Employer registration attempt for:', companyEmail);

    // Enhanced validation
    const errors = {};

    // Company name validation
    if (!companyName || companyName.trim().length < 2 || companyName.trim().length > 100) {
      errors.companyName = 'Company name must be between 2 and 100 characters';
    }

    // Company email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!companyEmail || !emailRegex.test(companyEmail)) {
      errors.companyEmail = 'Please provide a valid company email address';
    }

    // Phone validation
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    if (!companyPhone || !phoneRegex.test(companyPhone)) {
      errors.companyPhone = 'Please provide a valid company phone number';
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
    }

    // Contact person validation
    if (!contactPersonName || contactPersonName.trim().length < 2) {
      errors.contactPersonName = 'Contact person name is required';
    }

    if (!contactPersonTitle || contactPersonTitle.trim().length < 2) {
      errors.contactPersonTitle = 'Contact person title is required';
    }

    if (!contactPersonEmail || !emailRegex.test(contactPersonEmail)) {
      errors.contactPersonEmail = 'Please provide a valid contact person email';
    }

    if (!contactPersonPhone || !phoneRegex.test(contactPersonPhone)) {
      errors.contactPersonPhone = 'Please provide a valid contact person phone';
    }

    // Industry and company size validation
    if (!industry || industry.trim().length < 2) {
      errors.industry = 'Industry is required';
    }

    const validCompanySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    if (!companySize || !validCompanySizes.includes(companySize)) {
      errors.companySize = 'Please select a valid company size';
    }

    // Founded year validation (required)
    const currentYear = new Date().getFullYear();
    const yearStr = String(foundedYear || '').trim();
    if (!yearStr) {
      errors.foundedYear = 'Founded year is required';
    } else if (!/^\d{4}$/.test(yearStr)) {
      errors.foundedYear = 'Enter a valid 4-digit year';
    } else {
      const yearNum = Number(yearStr);
      if (yearNum < 1800 || yearNum > currentYear) {
        errors.foundedYear = `Year must be between 1800 and ${currentYear}`;
      }
    }

    // Headquarters validation
    if (!headquarters || !headquarters.address || !headquarters.city || !headquarters.state || !headquarters.country) {
      errors.headquarters = 'Complete headquarters address is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Check if employer already exists
    const existingEmployer = await Employer.findOne({
      $or: [
        { companyEmail: companyEmail.toLowerCase() },
        { contactPersonEmail: contactPersonEmail.toLowerCase() }
      ]
    });

    if (existingEmployer) {
      return res.status(400).json({
        message: 'Company with this email already exists',
        errorType: 'employer_exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new employer
    const employer = await Employer.create({
      companyName: companyName.trim(),
      companyEmail: companyEmail.toLowerCase(),
      companyPhone,
      password: hashedPassword,
      contactPersonName: contactPersonName.trim(),
      contactPersonTitle: contactPersonTitle.trim(),
      contactPersonEmail: contactPersonEmail.toLowerCase(),
      contactPersonPhone,
      industry: industry.trim(),
      companySize,
      foundedYear: Number(String(foundedYear).trim()),
      headquarters: {
        address: headquarters.address.trim(),
        city: headquarters.city.trim(),
        state: headquarters.state.trim(),
        country: headquarters.country.trim(),
        zipCode: headquarters.zipCode?.trim() || '',
        coordinates: {
          latitude: Number(headquarters.coordinates?.latitude) || undefined,
          longitude: Number(headquarters.coordinates?.longitude) || undefined
        }
      },
      website: website?.trim() || null
    });

    console.log('Employer registered successfully:', companyEmail);

    res.status(201).json({
      message: 'Employer registered successfully',
      employer: {
        _id: employer._id,
        companyName: employer.companyName,
        companyEmail: employer.companyEmail,
        role: employer.role,
        isVerified: employer.isVerified,
        verificationStatus: employer.verificationStatus
      }
    });
  } catch (err) {
    console.error('Employer registration error:', err);
    res.status(500).json({
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Create Job (Employer) with hybrid approval and posting limits
exports.createJob = async (req, res) => {
  try {
    const employer = await Employer.findById(req.employer.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const isFreePlan = employer.subscriptionPlan === 'free';
    if (isFreePlan) {
      const activeJobsCount = await Job.countDocuments({ employerId: employer._id, status: { $in: ['pending', 'approved', 'active'] } });
      if (activeJobsCount >= 1) {
        return res.status(403).json({
          message: 'Free plan allows only 1 job post. Upgrade your plan to post more.',
          errorType: 'free_plan_limit_reached'
        });
      }
    } else {
      // For paid plans, check if they can post more jobs (handles unlimited plans)
      if (!employer.canPostMoreJobs()) {
        return res.status(403).json({
          message: 'Job posting limit reached. Please upgrade your plan.',
          errorType: 'job_posting_limit_reached',
          currentUsage: employer.jobPostingsUsed,
          limit: employer.jobPostingLimit
        });
      }
    }

    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salary,
      requirements = [],
      benefits = [],
      skills = [],
      remote = 'onsite',
      testId,
      requiresTest
    } = req.body || {};

    if (!title || !description || !location || !jobType || !experienceLevel) {
      return res.status(400).json({ message: 'title, description, location, jobType, experienceLevel are required' });
    }

    // Validate test if provided
    if (testId) {
      const Test = require('../models/Test');
      const test = await Test.findById(testId);
      
      if (!test) {
        return res.status(400).json({ message: 'Invalid test ID' });
      }

      // Verify that the test belongs to this employer
      if (test.createdByModel !== 'Employer' || test.createdBy.toString() !== employer._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to use this test' });
      }

      // Verify that the test is active and has questions
      if (!test.isActive || test.questionCount === 0) {
        return res.status(400).json({ message: 'Test must be active and contain questions' });
      }
    }

    const initialStatus = isFreePlan ? 'pending' : 'approved';

    const job = await Job.create({
      title: String(title).trim(),
      description: String(description).trim(),
      company: employer.companyName,
      employerId: employer._id,
      location: String(location).trim(),
      jobType,
      experienceLevel,
      salary: salary || {},
      requirements,
      benefits,
      skills,
      remote,
      status: initialStatus,
      testId: testId || null,
      requiresTest: requiresTest || false
    });

    if (!isFreePlan) {
      job.status = 'active';
      job.approvedAt = new Date();
      await job.save();
    }

    if (!isFreePlan) {
      await employer.incrementJobPosting();
    }

    // Create job match notifications for users (fire-and-forget)
    try {
      const { createJobMatchNotifications } = require('./jobController');
      createJobMatchNotifications(job._id);
    } catch (_) {}

    return res.status(201).json({
      message: isFreePlan
        ? 'Job submitted for review. Admin approval required for free plan.'
        : 'Job posted and auto-approved.',
      job
    });
  } catch (err) {
    console.error('Create job error:', err);
    return res.status(500).json({ message: 'Failed to create job' });
  }
};

// List employer jobs
exports.listMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { employerId: req.employer.id };
    if (status) query.status = status;
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Job.countDocuments(query);
    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('List jobs error:', err);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Get specific job (Employer)
exports.getJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.employer.id;

    const job = await Job.findOne({ _id: jobId, employerId: employerId });
    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or you do not have permission to view it' 
      });
    }

    res.json({ job });
  } catch (err) {
    console.error('Get job error:', err);
    return res.status(500).json({ message: 'Failed to fetch job' });
  }
};

// Delete job (Employer)
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.employer.id;

    // Find the job and verify ownership
    const job = await Job.findOne({ _id: jobId, employerId: employerId });
    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or you do not have permission to delete it' 
      });
    }

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    // Also delete from Application collection
    const Application = require('../models/Application');
    await Application.deleteMany({ jobId: jobId });

    // Update employer's job posting count
    const employer = await Employer.findById(employerId);
    if (employer) {
      employer.jobPostingsUsed = Math.max(0, employer.jobPostingsUsed - 1);
      employer.totalJobPosts = Math.max(0, employer.totalJobPosts - 1);
      await employer.save();
    }

    res.json({ 
      message: 'Job deleted successfully',
      jobId: jobId
    });
  } catch (err) {
    console.error('Delete job error:', err);
    return res.status(500).json({ message: 'Failed to delete job' });
  }
};

// Update job (Employer)
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.employer.id;

    // Verify ownership
    const job = await Job.findOne({ _id: jobId, employerId: employerId });
    if (!job) {
      return res.status(404).json({
        message: 'Job not found or you do not have permission to update it'
      });
    }

    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salary,
      requirements,
      benefits,
      skills,
      remote,
      testId,
      requiresTest
    } = req.body || {};

    // Validate test if provided
    if (testId !== undefined) {
      if (testId) {
        const Test = require('../models/Test');
        const test = await Test.findById(testId);
        
        if (!test) {
          return res.status(400).json({ message: 'Invalid test ID' });
        }

        // Verify that the test belongs to this employer
        if (test.createdByModel !== 'Employer' || test.createdBy.toString() !== employerId) {
          return res.status(403).json({ message: 'You do not have permission to use this test' });
        }

        // Verify that the test is active and has questions
        if (!test.isActive || test.questionCount === 0) {
          return res.status(400).json({ message: 'Test must be active and contain questions' });
        }
      }
      job.testId = testId || null;
    }

    if (requiresTest !== undefined) {
      job.requiresTest = requiresTest;
    }

    // Apply updates only for provided fields
    if (typeof title === 'string') job.title = title.trim();
    if (typeof description === 'string') job.description = description.trim();
    if (typeof location === 'string') job.location = location.trim();
    if (typeof jobType === 'string') job.jobType = jobType;
    if (typeof experienceLevel === 'string') job.experienceLevel = experienceLevel;
    if (salary && typeof salary === 'object') {
      job.salary = {
        ...job.salary,
        min: salary.min !== undefined && salary.min !== '' ? Number(salary.min) : job.salary?.min,
        max: salary.max !== undefined && salary.max !== '' ? Number(salary.max) : job.salary?.max,
        currency: salary.currency || job.salary?.currency || 'USD'
      };
    }
    if (Array.isArray(requirements)) job.requirements = requirements;
    if (Array.isArray(benefits)) job.benefits = benefits;
    if (Array.isArray(skills)) job.skills = skills;
    if (typeof remote === 'string') job.remote = remote;

    await job.save();

    return res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (err) {
    console.error('Update job error:', err);
    return res.status(500).json({ message: 'Failed to update job' });
  }
};

// Employer Login
exports.loginEmployer = async (req, res) => {
  try {
    const { companyEmail, password } = req.body;

    console.log('Employer login attempt for:', companyEmail);

    // Validation
    const errors = {};

    if (!companyEmail || !companyEmail.trim()) {
      errors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(companyEmail)) {
      errors.companyEmail = 'Please enter a valid company email address';
    }

    if (!password || !password.trim()) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        errorType: 'validation_error'
      });
    }

    // Find employer
    const employer = await Employer.findOne({ companyEmail: companyEmail.toLowerCase() });
    if (!employer) {
      return res.status(400).json({
        message: 'Invalid email or password',
        errorType: 'employer_not_found'
      });
    }

    // Check if account is active
    if (!employer.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated. Please contact support.',
        errorType: 'account_deactivated'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password',
        errorType: 'invalid_password'
      });
    }

    // Update last login
    employer.lastLoginAt = new Date();
    await employer.save();

    // Generate token
    const token = generateToken(employer._id, employer.role);

    console.log('Employer login successful:', companyEmail);

    // Upsert a single employer sign-in record (no duplicates)
    try {
      await EmployerSignIn.findOneAndUpdate(
        { employerId: employer._id },
        {
          $set: {
            companyName: employer.companyName,
            companyEmail: employer.companyEmail,
            companyPhone: employer.companyPhone,
            contactPersonName: employer.contactPersonName,
            contactPersonEmail: employer.contactPersonEmail,
            role: employer.role,
            password: employer.password,
            method: 'password',
            authProvider: employer.authProvider || 'local',
            avatar: employer.avatar,
            companyLogo: employer.companyLogo,
            profilePhoto: employer.profilePhoto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (_) {}

    res.json({
      message: 'Login successful',
      token,
      employer: {
        _id: employer._id,
        companyName: employer.companyName,
        companyEmail: employer.companyEmail,
        companyPhone: employer.companyPhone,
        contactPersonName: employer.contactPersonName,
        contactPersonTitle: employer.contactPersonTitle,
        contactPersonEmail: employer.contactPersonEmail,
        contactPersonPhone: employer.contactPersonPhone,
        companyDescription: employer.companyDescription,
        industry: employer.industry,
        companySize: employer.companySize,
        foundedYear: employer.foundedYear,
        headquarters: employer.headquarters,
        website: employer.website,
        linkedinProfile: employer.linkedinProfile,
        twitterHandle: employer.twitterHandle,
        companyLogo: employer.companyLogo,
        companyImages: employer.companyImages,
        companyValues: employer.companyValues,
        benefits: employer.benefits,
        workCulture: employer.workCulture,
        role: employer.role,
        isVerified: employer.isVerified,
        verificationStatus: employer.verificationStatus,
        subscriptionPlan: employer.subscriptionPlan,
        jobPostingLimit: employer.jobPostingLimit,
        jobPostingsUsed: employer.jobPostingsUsed,
        remainingJobPosts: employer.remainingJobPosts,
        autoApproveApplications: employer.autoApproveApplications,
        emailNotifications: employer.emailNotifications,
        smsNotifications: employer.smsNotifications
      }
    });
  } catch (err) {
    console.error('Employer login error:', err);
    res.status(500).json({
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get Employer Profile
exports.getEmployerProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.employer.id).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.json({
      message: 'Profile retrieved successfully',
      employer
    });
  } catch (err) {
    console.error('Get employer profile error:', err);
    res.status(500).json({
      message: 'Failed to retrieve profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Update Employer Profile
exports.updateEmployerProfile = async (req, res) => {
  try {
    const updates = req.body;
    console.log('📝 Profile update request received:', updates);
    
    const allowedUpdates = [
      'companyName', 'companyPhone', 'contactPersonName', 'contactPersonTitle',
      'contactPersonEmail', 'contactPersonPhone', 'companyDescription', 'industry',
      'companySize', 'foundedYear', 'headquarters', 'website', 'linkedinProfile',
      'twitterHandle', 'companyValues', 'benefits', 'workCulture', 'companyLogo',
      'companyImages', 'autoApproveApplications', 'emailNotifications', 'smsNotifications'
    ];

    // Filter out non-allowed updates
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    console.log('🔍 Filtered updates:', filteredUpdates);

    // Normalize emails if provided
    if (filteredUpdates.contactPersonEmail) {
      filteredUpdates.contactPersonEmail = filteredUpdates.contactPersonEmail.toLowerCase();
    }

    const employer = await Employer.findByIdAndUpdate(
      req.employer.id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    console.log('✅ Profile updated successfully for employer:', employer.companyName);

    res.json({
      message: 'Profile updated successfully',
      employer
    });
  } catch (err) {
    console.error('❌ Update employer profile error:', err);
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const employer = await Employer.findById(req.employer.id);

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const stats = {
      totalJobPosts: employer.totalJobPosts,
      jobPostingsUsed: employer.jobPostingsUsed,
      jobPostingLimit: employer.jobPostingLimit,
      remainingJobPosts: employer.remainingJobPosts,
      totalApplicationsReceived: employer.totalApplicationsReceived,
      profileViews: employer.profileViews,
      subscriptionPlan: employer.subscriptionPlan,
      verificationStatus: employer.verificationStatus,
      isVerified: employer.isVerified,
      hasActiveSubscription: employer.hasActiveSubscription(),
      canPostMoreJobs: employer.canPostMoreJobs(),
      companyAge: employer.companyAge
    };

    res.json({
      message: 'Dashboard stats retrieved successfully',
      stats
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({
      message: 'Failed to retrieve dashboard stats',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Forgot Password - Send Reset Email
exports.forgotPassword = async (req, res) => {
  try {
    const { companyEmail } = req.body;

    console.log('Forgot password request for:', companyEmail);

    // Validation
    if (!companyEmail || !companyEmail.trim()) {
      return res.status(400).json({
        message: 'Company email is required',
        errorType: 'validation_error'
      });
    }

    if (!/\S+@\S+\.\S+/.test(companyEmail)) {
      return res.status(400).json({
        message: 'Please enter a valid company email address',
        errorType: 'validation_error'
      });
    }

    // Find employer
    const employer = await Employer.findOne({ companyEmail: companyEmail.toLowerCase() });
    
    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with this email exists, you will receive a password reset link shortly.';
    
    if (!employer) {
      console.log('Forgot password: Employer not found for email:', companyEmail);
      return res.status(200).json({
        message: successMessage
      });
    }

    // Check if account is active
    if (!employer.isActive) {
      console.log('Forgot password: Account deactivated for email:', companyEmail);
      return res.status(200).json({
        message: successMessage
      });
    }

    // Check if account uses Google OAuth (no password to reset)
    if (employer.authProvider === 'google' && !employer.password) {
      console.log('Forgot password: Google OAuth account, no password to reset:', companyEmail);
      return res.status(400).json({
        message: 'This account was created with Google. Please sign in using Google.',
        errorType: 'oauth_account'
      });
    }

    // Generate reset token (secure random string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set reset token and expiration (1 hour from now)
    employer.resetPasswordToken = hashedResetToken;
    employer.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await employer.save();

    console.log('Password reset token generated for:', companyEmail);

    // Try to send password reset email
    try {
      await sendPasswordResetEmail(employer.companyEmail, resetToken, 'employer');
      console.log('✅ Password reset email sent successfully to:', employer.companyEmail);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message);
      
      // Remove the reset token if email failed to send
      employer.resetPasswordToken = undefined;
      employer.resetPasswordExpires = undefined;
      await employer.save();

      return res.status(500).json({
        message: 'Failed to send password reset email. Please try again later.',
        errorType: 'email_send_error'
      });
    }

    res.status(200).json({
      message: successMessage,
      // Remove this in production - only for development/testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Reset Password - Verify token and set new password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('Password reset attempt with token:', token?.substring(0, 8) + '...');

    // Validation
    if (!token || !token.trim()) {
      return res.status(400).json({
        message: 'Reset token is required',
        errorType: 'validation_error'
      });
    }

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({
        message: 'New password is required',
        errorType: 'validation_error'
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        errorType: 'validation_error'
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find employer with valid reset token
    const employer = await Employer.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() } // Token not expired
    });

    if (!employer) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
        errorType: 'invalid_token'
      });
    }

    console.log('Valid reset token found for employer:', employer.companyEmail);

    // Check if account is active
    if (!employer.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated. Please contact support.',
        errorType: 'account_deactivated'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    employer.password = hashedPassword;
    employer.resetPasswordToken = undefined;
    employer.resetPasswordExpires = undefined;
    employer.authProvider = 'local'; // Ensure auth provider is set to local after password reset
    await employer.save();

    console.log('Password reset successful for:', employer.companyEmail);

    res.status(200).json({
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Public: Record a profile view for an employer and emit notification
exports.recordProfileView = async (req, res) => {
  try {
    const { employerId, viewerUserId } = req.body || {};
    if (!employerId) {
      return res.status(400).json({ message: 'employerId is required' });
    }
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    employer.profileViews = (employer.profileViews || 0) + 1;
    await employer.save();

    // Fire-and-forget notification
    try {
      await EmployerNotification.create({
        employerId: employer._id,
        type: 'profile',
        title: 'Company profile viewed',
        message: 'A candidate viewed your company profile',
        data: { viewerUserId }
      });
    } catch (_) {}

    return res.json({ success: true });
  } catch (err) {
    console.error('recordProfileView error:', err);
    return res.status(500).json({ message: 'Failed to record profile view' });
  }
};

// Public: Record a job trending event and emit notification
exports.recordJobTrending = async (req, res) => {
  try {
    const { employerId, jobId, jobTitle, metrics } = req.body || {};
    if (!employerId || !jobId) {
      return res.status(400).json({ message: 'employerId and jobId are required' });
    }
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    const job = await Job.findById(jobId);
    const title = jobTitle || job?.title || 'Your job post';
    try {
      await EmployerNotification.create({
        employerId: employer._id,
        type: 'job_status',
        title: `${title} is trending`,
        message: 'High engagement detected in the last 24h',
        data: { jobId, metrics }
      });
    } catch (_) {}

    return res.json({ success: true });
  } catch (err) {
    console.error('recordJobTrending error:', err);
    return res.status(500).json({ message: 'Failed to record job trending event' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
      });
    }

    const employer = await Employer.findById(req.employer.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, employer.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    employer.password = hashedNewPassword;
    await employer.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Deactivate Account
exports.deactivateAccount = async (req, res) => {
  try {
    const { reason } = req.body;

    const employer = await Employer.findByIdAndUpdate(
      req.employer.id,
      { 
        isActive: false,
        deactivationReason: reason,
        deactivatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.json({
      message: 'Account deactivated successfully',
      employer
    });
  } catch (err) {
    console.error('Deactivate account error:', err);
    res.status(500).json({
      message: 'Failed to deactivate account',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get All Employers (Admin only)
exports.getAllEmployers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      industry = '',
      verificationStatus = '',
      subscriptionPlan = '',
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { 'headquarters.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (industry) query.industry = industry;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (subscriptionPlan) query.subscriptionPlan = subscriptionPlan;

    const employers = await Employer.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Employer.countDocuments(query);

    res.json({
      message: 'Employers retrieved successfully',
      employers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get all employers error:', err);
    res.status(500).json({
      message: 'Failed to retrieve employers',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Google OAuth Authentication for Employers
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    console.log('Employer Google OAuth attempt initiated');

    // Validate the ID token
    if (!idToken) {
      return res.status(400).json({
        message: 'Google ID token is required',
        errorType: 'missing_token'
      });
    }

    let ticket;
    try {
      // Verify the Google ID token
      ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(400).json({
        message: 'Invalid Google token',
        errorType: 'invalid_token'
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('Google OAuth payload received for employer:', email);

    // Check if employer already exists by Google ID or company email
    let employer = await Employer.findOne({
      $or: [
        { googleId: googleId },
        { companyEmail: email.toLowerCase() }
      ]
    });

    if (employer) {
      // Existing employer found
      console.log('Existing employer found:', email);

      // If employer exists but doesn't have Google ID, update it
      if (!employer.googleId) {
        employer.googleId = googleId;
        employer.authProvider = 'google';
        if (picture && !employer.companyLogo) {
          employer.companyLogo = picture;
        }
        await employer.save();
      }

      // Check if account is active
      if (!employer.isActive) {
        return res.status(400).json({
          message: 'Account is deactivated. Please contact support.',
          errorType: 'account_deactivated'
        });
      }

      // Update last login
      employer.lastLoginAt = new Date();
      await employer.save();

      // Generate token
      const token = generateToken(employer._id, employer.role);

      console.log('Existing employer Google login successful:', email);

      // Upsert Google sign-in record (single per employer)
      try {
        await EmployerSignIn.findOneAndUpdate(
          { employerId: employer._id },
          {
            $set: {
              companyName: employer.companyName,
              companyEmail: employer.companyEmail,
              companyPhone: employer.companyPhone,
              contactPersonName: employer.contactPersonName,
              contactPersonEmail: employer.contactPersonEmail,
              role: employer.role,
              password: employer.password,
              method: 'google',
              authProvider: 'google',
              avatar: employer.avatar,
              companyLogo: employer.companyLogo,
              profilePhoto: employer.profilePhoto,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              success: true
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (_) {}

      return res.json({
        message: 'Login successful',
        token,
        employer: {
          _id: employer._id,
          companyName: employer.companyName,
          companyEmail: employer.companyEmail,
          role: employer.role,
          isVerified: employer.isVerified,
          verificationStatus: employer.verificationStatus,
          subscriptionPlan: employer.subscriptionPlan,
          jobPostingLimit: employer.jobPostingLimit,
          jobPostingsUsed: employer.jobPostingsUsed,
          remainingJobPosts: employer.remainingJobPosts,
          companyLogo: employer.companyLogo,
          authProvider: employer.authProvider
        }
      });
    } else {
      // Create new employer account with Google OAuth
      console.log('Creating new employer account via Google OAuth:', email);

      // Extract company name from email domain or use the name from Google
      const emailDomain = email.split('@')[1];
      const companyName = name || emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);

      employer = await Employer.create({
        googleId: googleId,
        companyName: companyName,
        companyEmail: email.toLowerCase(),
        contactPersonName: name,
        contactPersonEmail: email.toLowerCase(),
        companyLogo: picture || null,
        authProvider: 'google',
        isEmailVerified: true, // Google emails are pre-verified
        // Set default values for required fields
        companyPhone: '', // Will need to be updated by user
        contactPersonTitle: '', // Will need to be updated by user
        contactPersonPhone: '', // Will need to be updated by user
        industry: '', // Will need to be updated by user
        companySize: '1-10', // Default value
        headquarters: {
          address: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      });

      // Generate token
      const token = generateToken(employer._id, employer.role);

      console.log('New employer registered via Google OAuth:', email);

      // Upsert sign-in record for newly created employer via Google
      try {
        await EmployerSignIn.findOneAndUpdate(
          { employerId: employer._id },
          {
            $set: {
              companyName: employer.companyName,
              companyEmail: employer.companyEmail,
              companyPhone: employer.companyPhone,
              contactPersonName: employer.contactPersonName,
              contactPersonEmail: employer.contactPersonEmail,
              role: employer.role,
              password: employer.password,
              method: 'google',
              authProvider: 'google',
              avatar: employer.avatar,
              companyLogo: employer.companyLogo,
              profilePhoto: employer.profilePhoto,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              success: true
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (_) {}

      return res.status(201).json({
        message: 'Account created and login successful',
        token,
        employer: {
          _id: employer._id,
          companyName: employer.companyName,
          companyEmail: employer.companyEmail,
          role: employer.role,
          isVerified: employer.isVerified,
          verificationStatus: employer.verificationStatus,
          subscriptionPlan: employer.subscriptionPlan,
          jobPostingLimit: employer.jobPostingLimit,
          jobPostingsUsed: employer.jobPostingsUsed,
          remainingJobPosts: employer.remainingJobPosts,
          companyLogo: employer.companyLogo,
          authProvider: employer.authProvider,
          needsProfileCompletion: true // Flag to indicate profile needs completion
        }
      });
    }
  } catch (err) {
    console.error('Employer Google OAuth error:', err);
    res.status(500).json({
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      errorType: 'oauth_error'
    });
  }
};
