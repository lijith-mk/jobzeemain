const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { adminAuth, checkPermission } = require('../middleware/adminAuth');
const { adminLimiter, authLimiter } = require('../middleware/rateLimiter');
const Admin = require('../models/Admin');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Internship = require('../models/Internship');
const InternshipApplication = require('../models/InternshipApplication');
const ContactQuery = require('../models/ContactQuery');
const EmployerNotification = require('../models/EmployerNotification');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Answer = require('../models/Answer');
const planController = require('../controllers/planController');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// Initialize admin account - SECURITY: Restrict this in production
router.post('/init', adminLimiter, async (req, res) => {
  try {
    // SECURITY CHECK: Only allow in development or with special admin key
    const initKey = req.headers['x-admin-init-key'];
    const expectedKey = process.env.ADMIN_INIT_KEY;
    
    if (process.env.NODE_ENV === 'production' && (!initKey || !expectedKey || initKey !== expectedKey)) {
      return res.status(403).json({ 
        success: false,
        message: 'Admin initialization is restricted in production',
        errorType: 'INIT_RESTRICTED' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ userId: 'admin123' });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: 'Admin already initialized',
        errorType: 'ADMIN_EXISTS' 
      });
    }

    // Create default admin
    const admin = new Admin();
    await admin.save();

    res.json({ 
      success: true,
      message: 'Admin initialized successfully' 
    });
  } catch (error) {
    console.error('Admin initialization error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize admin' 
    });
  }
});

// Admin login
router.post('/login', adminLimiter, async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    // Find admin
    const admin = await Admin.findOne({ userId });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Admin account is deactivated' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET environment variable is not set!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        userId: admin.userId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalEmployers,
      totalJobs,
      activeJobs,
      pendingJobs,
      rejectedJobs
    ] = await Promise.all([
      User.countDocuments(),
      Employer.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'rejected' })
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employerId', 'companyName')
      .select('title company status createdAt');

    res.json({
      stats: {
        totalUsers,
        totalEmployers,
        totalJobs,
        activeJobs,
        pendingJobs,
        rejectedJobs
      },
      recentActivity: {
        users: recentUsers,
        jobs: recentJobs
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// User Management Routes
router.get('/users', adminAuth, checkPermission('userManagement'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = { status: { $ne: 'deleted' } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      if (status === 'active') query.status = 'active';
      else if (status === 'suspended') query.status = 'suspended';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create user (admin)
router.post('/users', adminAuth, checkPermission('userManagement'), async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const user = new User({ name, email: normalizedEmail, phone, role: role || 'user' });
    if (password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    const output = user.toObject();
    delete output.password;
    res.status(201).json({ message: 'User created', user: output });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user (admin)
router.put('/users/:id', adminAuth, checkPermission('userManagement'), async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.password;
    delete update.email; // prevent email changes via this endpoint
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Soft delete user (admin)
router.delete('/users/:id', adminAuth, checkPermission('userManagement'), async (req, res) => {
  try {
    const { hard } = req.query;
    if (hard === 'true') {
      const result = await User.deleteOne({ _id: req.params.id });
      if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User permanently deleted' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = 'deleted';
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = req.admin._id;
    await user.save();
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Suspend/Activate user
router.patch('/users/:id/status', adminAuth, checkPermission('userManagement'), async (req, res) => {
  try {
    const { isActive, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    if (!isActive && reason) {
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = req.admin._id;
      user.status = 'suspended';
    } else if (isActive) {
      user.status = 'active';
      user.suspensionReason = undefined;
      user.suspendedAt = undefined;
      user.suspendedBy = undefined;
    }
    await user.save();

    res.json({ message: `User ${isActive ? 'activated' : 'suspended'} successfully` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Employer Management Routes
router.get('/employers', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    // Show all except deleted (keep suspended visible)
    const query = { deletedAt: { $exists: false } };
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { companyEmail: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      if (status === 'active') query.isActive = { $ne: false };
      else if (status === 'suspended') query.isActive = false;
    }

    const employers = await Employer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employer.countDocuments(query);

    res.json({
      employers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalEmployers: total
    });
  } catch (error) {
    console.error('Get employers error:', error);
    res.status(500).json({ message: 'Failed to fetch employers' });
  }
});

// Approve/Reject employer
router.patch('/employers/:id/status', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const { isApproved, reason } = req.body;
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.isApproved = isApproved;
    employer.approvedBy = req.admin._id;
    employer.approvedAt = new Date();
    if (!isApproved && reason) {
      employer.rejectionReason = reason;
    }
    await employer.save();

    res.json({ message: `Employer ${isApproved ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    console.error('Update employer status error:', error);
    res.status(500).json({ message: 'Failed to update employer status' });
  }
});

// Update employer verification (verify/unverify, set status/notes/document)
router.patch('/employers/:id/verification', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const { isVerified, status, notes, document } = req.body;

    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    if (typeof isVerified === 'boolean') {
      employer.isVerified = isVerified;
      // If explicitly verified/unverified but no status provided, sync status
      if (!status) {
        employer.verificationStatus = isVerified ? 'verified' : 'pending';
      }
    }

    if (status) {
      const allowed = ['pending', 'verified', 'rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid verification status' });
      }
      employer.verificationStatus = status;
    }

    if (notes !== undefined) {
      employer.verificationNotes = String(notes || '').trim();
    }

    if (document !== undefined) {
      employer.verificationDocument = String(document || '').trim();
    }

    await employer.save();

    return res.json({
      message: 'Employer verification updated',
      employer: {
        id: employer._id,
        isVerified: employer.isVerified,
        verificationStatus: employer.verificationStatus,
        verificationNotes: employer.verificationNotes,
        verificationDocument: employer.verificationDocument
      }
    });
  } catch (error) {
    console.error('Update employer verification error:', error);
    return res.status(500).json({ message: 'Failed to update employer verification' });
  }
});

// Create employer (admin)
router.post('/employers', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const { companyName, companyEmail, contactPersonName, password } = req.body;
    if (!companyName || !companyEmail || !contactPersonName) {
      return res.status(400).json({ message: 'companyName, companyEmail, contactPersonName are required' });
    }
    const normalizedEmail = String(companyEmail).toLowerCase();
    const exists = await Employer.findOne({ companyEmail: normalizedEmail });
    if (exists) return res.status(400).json({ message: 'Company email already exists' });
    const employer = new Employer({ ...req.body, companyEmail: normalizedEmail });
    if (password) {
      const bcrypt = require('bcryptjs');
      employer.password = await bcrypt.hash(password, 10);
    }
    await employer.save();
    const out = employer.toObject();
    delete out.password;
    res.status(201).json({ message: 'Employer created', employer: out });
  } catch (error) {
    console.error('Create employer error:', error);
    res.status(500).json({ message: 'Failed to create employer' });
  }
});

// Update employer (admin)
router.put('/employers/:id', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.password;
    delete update.companyEmail; // prevent email change here
    const employer = await Employer.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, select: '-password' }
    );
    if (!employer) return res.status(404).json({ message: 'Employer not found' });
    res.json({ message: 'Employer updated', employer });
  } catch (error) {
    console.error('Update employer error:', error);
    res.status(500).json({ message: 'Failed to update employer' });
  }
});

// Soft delete employer (admin)
router.delete('/employers/:id', adminAuth, checkPermission('employerManagement'), async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) return res.status(404).json({ message: 'Employer not found' });
    employer.isActive = false;
    employer.deletedAt = new Date();
    await employer.save();
    res.json({ message: 'Employer deleted' });
  } catch (error) {
    console.error('Delete employer error:', error);
    res.status(500).json({ message: 'Failed to delete employer' });
  }
});

// Job Management Routes
router.get('/jobs', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .populate('employerId', 'companyName contactEmail')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalJobs: total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Create job (admin)
router.post('/jobs', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const {
      employerId,
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salary = {},
      requirements = [],
      benefits = [],
      skills = [],
      remote = 'onsite',
      status = 'approved'
    } = req.body || {};

    if (!employerId || !title || !description || !location || !jobType || !experienceLevel) {
      return res.status(400).json({ message: 'employerId, title, description, location, jobType, experienceLevel are required' });
    }

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const job = await Job.create({
      title: String(title).trim(),
      description: String(description).trim(),
      company: employer.companyName,
      employerId: employer._id,
      location: String(location).trim(),
      jobType: String(jobType),
      experienceLevel: String(experienceLevel),
      salary: {
        min: salary.min !== undefined ? Number(salary.min) : undefined,
        max: salary.max !== undefined ? Number(salary.max) : undefined,
        currency: salary.currency || 'USD'
      },
      requirements,
      benefits,
      skills,
      remote,
      status
    });

    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Create job (admin) error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Delete job (admin) with cascading cleanup
router.delete('/jobs/:id', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete the job
    await Job.deleteOne({ _id: jobId });

    // Cascade delete: applications referencing this job
    try {
      const Application = require('../models/Application');
      await Application.deleteMany({ jobId });
    } catch (err) {
      console.warn('Cascade delete applications failed:', err.message);
    }

    // Cascade delete: SavedJob entries
    try {
      const SavedJob = require('../models/SavedJob');
      await SavedJob.deleteMany({ jobId });
    } catch (err) {
      console.warn('Cascade delete saved jobs collection failed:', err.message);
    }

    // Remove from embedded user.savedJobs arrays
    try {
      await User.updateMany(
        { 'savedJobs.jobId': jobId },
        { $pull: { savedJobs: { jobId } } }
      );
    } catch (err) {
      console.warn('Removing job from user.savedJobs failed:', err.message);
    }

    // Update employer counters defensively
    try {
      const employer = await Employer.findById(job.employerId);
      if (employer) {
        if (typeof employer.jobPostingsUsed === 'number') {
          employer.jobPostingsUsed = Math.max(0, employer.jobPostingsUsed - 1);
        }
        if (typeof employer.totalJobPosts === 'number') {
          employer.totalJobPosts = Math.max(0, employer.totalJobPosts - 1);
        }
        await employer.save();
      }
    } catch (err) {
      console.warn('Employer counter update failed:', err.message);
    }

    res.json({ message: 'Job deleted successfully', jobId });
  } catch (error) {
    console.error('Delete job (admin) error:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

// Approve/Reject job
router.patch('/jobs/:id/status', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = status;
    job.approvedBy = req.admin._id;
    job.approvedAt = new Date();
    if (adminNotes) {
      job.adminNotes = adminNotes;
    }
    await job.save();

    // Notify employer on approval/rejection/activation
    try {
      const title = status === 'approved' ? 'Job post approved' : status === 'active' ? 'Job post is live' : status === 'rejected' ? 'Job post rejected' : `Job status updated to ${status}`;
      const message = status === 'rejected' && adminNotes
        ? `${job.title} was rejected. Reason: ${adminNotes}`
        : `${job.title} status updated to ${status}`;
      EmployerNotification.create({
        employerId: job.employerId,
        type: 'job_status',
        title,
        message,
        data: { jobId: job._id, status }
      }).catch(() => {});
    } catch (_) {}

    res.json({ message: `Job ${status} successfully` });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Failed to update job status' });
  }
});

// Update job (admin)
router.put('/jobs/:id', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'salary',
      'location',
      'jobType',
      'experienceLevel',
      'remote',
      'requirements',
      'benefits',
      'skills'
    ];

    const update = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    // Accept friendly aliases from UI
    if (req.body.jobTitle !== undefined) update.title = req.body.jobTitle;
    if (req.body.employmentType !== undefined) update.jobType = String(req.body.employmentType).toLowerCase();

    // Normalize enums
    if (update.jobType) {
      const allowedJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
      if (!allowedJobTypes.includes(update.jobType)) {
        return res.status(400).json({ message: 'Invalid jobType' });
      }
    }
    if (update.remote) {
      const allowedRemote = ['remote', 'hybrid', 'onsite'];
      if (!allowedRemote.includes(update.remote)) {
        return res.status(400).json({ message: 'Invalid remote mode' });
      }
    }

    // Partial salary updates supported
    if (update.salary) {
      const salary = {};
      if (update.salary.min !== undefined) salary.min = Number(update.salary.min);
      if (update.salary.max !== undefined) salary.max = Number(update.salary.max);
      if (update.salary.currency !== undefined) salary.currency = String(update.salary.currency || 'USD');
      update.salary = salary;
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// ============================================
// INTERNSHIP MANAGEMENT ROUTES
// ============================================

// Get all internships (admin)
router.get('/internships', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.verificationStatus = status;
    }

    const internships = await Internship.find(query)
      .populate('employer', 'companyName companyEmail')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Internship.countDocuments(query);

    // Format response to match frontend expectations
    const formattedInternships = internships.map(internship => ({
      ...internship,
      status: internship.verificationStatus,
      company: internship.companyName,
      duration: typeof internship.duration === 'number' ? `${internship.duration} months` : internship.duration
    }));

    res.json({
      internships: formattedInternships,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get internships (admin) error:', error);
    res.status(500).json({ message: 'Failed to fetch internships' });
  }
});

// Create internship (admin)
router.post('/internships', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const {
      employerId,
      title,
      description,
      location,
      duration,
      experienceLevel,
      remote,
      status,
      stipend,
      requirements,
      skills
    } = req.body;

    // Validation errors object
    const errors = {};

    // Employer validation
    if (!employerId || !employerId.trim()) {
      errors.employerId = 'Employer is required';
    }

    // Title validation
    if (!title || !title.trim()) {
      errors.title = 'Internship title is required';
    } else if (title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!description || !description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (description.trim().length > 5000) {
      errors.description = 'Description must be less than 5000 characters';
    }

    // Location validation
    if (!location || !location.trim()) {
      errors.location = 'Location is required';
    } else if (location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters';
    } else if (location.trim().length > 100) {
      errors.location = 'Location must be less than 100 characters';
    }

    // Duration validation
    if (duration) {
      const durationNum = typeof duration === 'string' ? parseInt(duration) : duration;
      if (isNaN(durationNum) || durationNum < 1) {
        errors.duration = 'Duration must be at least 1 month';
      } else if (durationNum > 12) {
        errors.duration = 'Duration cannot exceed 12 months';
      }
    }

    // Remote/locationType validation
    if (remote && !['onsite', 'on-site', 'remote', 'hybrid'].includes(remote.toLowerCase())) {
      errors.remote = 'Invalid work mode';
    }

    // Stipend validation
    if (stipend) {
      if (stipend.min !== undefined && stipend.min !== '') {
        const minStipend = Number(stipend.min);
        if (isNaN(minStipend) || minStipend < 0) {
          errors.stipendMin = 'Minimum stipend must be a positive number';
        }
      }
      if (stipend.max !== undefined && stipend.max !== '') {
        const maxStipend = Number(stipend.max);
        if (isNaN(maxStipend) || maxStipend < 0) {
          errors.stipendMax = 'Maximum stipend must be a positive number';
        }
        if (stipend.min !== undefined && stipend.min !== '' && maxStipend < Number(stipend.min)) {
          errors.stipendMax = 'Maximum stipend cannot be less than minimum';
        }
      }
      if (stipend.currency && !['INR', 'USD', 'EUR'].includes(stipend.currency)) {
        errors.stipendCurrency = 'Invalid currency';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    // Get employer details
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Set default dates if not provided
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start 1 week from now
    
    const applicationDeadline = new Date();
    applicationDeadline.setDate(applicationDeadline.getDate() + 30); // 30 days to apply

    const internship = new Internship({
      title,
      description,
      location,
      locationType: remote || 'on-site',
      duration: typeof duration === 'string' ? parseInt(duration) || 3 : duration || 3,
      startDate,
      applicationDeadline,
      employer: employerId,
      companyName: employer.companyName,
      category: 'technology', // default
      verificationStatus: status || 'approved',
      requirements: Array.isArray(requirements) ? requirements.join('\n') : (requirements || ''),
      skills: skills || []
    });

    if (stipend) {
      internship.stipend = {
        amount: stipend.min || 0,
        currency: stipend.currency || 'INR',
        period: 'monthly'
      };
      if (stipend.min === 0 && !stipend.max) {
        internship.isUnpaid = true;
      }
    }

    await internship.save();

    res.status(201).json({ 
      message: 'Internship created successfully',
      internship 
    });
  } catch (error) {
    console.error('Create internship (admin) error:', error);
    res.status(500).json({ message: 'Failed to create internship', error: error.message });
  }
});

// Update internship (admin)
router.put('/internships/:id', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    // Validation errors object
    const errors = {};

    // Title validation
    if (req.body.title !== undefined) {
      const title = req.body.title;
      if (!title || !title.trim()) {
        errors.title = 'Internship title is required';
      } else if (title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters';
      } else if (title.trim().length > 200) {
        errors.title = 'Title must be less than 200 characters';
      }
    }

    // Description validation
    if (req.body.description !== undefined) {
      const description = req.body.description;
      if (!description || !description.trim()) {
        errors.description = 'Description is required';
      } else if (description.trim().length < 20) {
        errors.description = 'Description must be at least 20 characters';
      } else if (description.trim().length > 5000) {
        errors.description = 'Description must be less than 5000 characters';
      }
    }

    // Location validation
    if (req.body.location !== undefined) {
      const location = req.body.location;
      if (!location || !location.trim()) {
        errors.location = 'Location is required';
      } else if (location.trim().length < 2) {
        errors.location = 'Location must be at least 2 characters';
      } else if (location.trim().length > 100) {
        errors.location = 'Location must be less than 100 characters';
      }
    }

    // Duration validation
    if (req.body.duration !== undefined) {
      const duration = req.body.duration;
      const durationNum = typeof duration === 'string' ? parseInt(duration) : duration;
      if (isNaN(durationNum) || durationNum < 1) {
        errors.duration = 'Duration must be at least 1 month';
      } else if (durationNum > 12) {
        errors.duration = 'Duration cannot exceed 12 months';
      }
    }

    // Remote/locationType validation
    if (req.body.remote !== undefined) {
      const remote = req.body.remote;
      if (!['onsite', 'on-site', 'remote', 'hybrid'].includes(remote.toLowerCase())) {
        errors.remote = 'Invalid work mode';
      }
    }

    // Stipend validation
    if (req.body.stipend !== undefined) {
      const stipend = req.body.stipend;
      if (stipend.min !== undefined && stipend.min !== '') {
        const minStipend = Number(stipend.min);
        if (isNaN(minStipend) || minStipend < 0) {
          errors.stipendMin = 'Minimum stipend must be a positive number';
        }
      }
      if (stipend.max !== undefined && stipend.max !== '') {
        const maxStipend = Number(stipend.max);
        if (isNaN(maxStipend) || maxStipend < 0) {
          errors.stipendMax = 'Maximum stipend must be a positive number';
        }
        if (stipend.min !== undefined && stipend.min !== '' && maxStipend < Number(stipend.min)) {
          errors.stipendMax = 'Maximum stipend cannot be less than minimum';
        }
      }
      if (stipend.currency && !['INR', 'USD', 'EUR'].includes(stipend.currency)) {
        errors.stipendCurrency = 'Invalid currency';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    const allowedFields = [
      'title',
      'description',
      'location',
      'duration',
      'experienceLevel',
      'remote',
      'stipend',
      'requirements',
      'skills'
    ];

    const update = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    // Handle remote/locationType mapping
    if (req.body.remote) {
      update.locationType = req.body.remote;
    }

    // Handle duration conversion
    if (update.duration && typeof update.duration === 'string') {
      update.duration = parseInt(update.duration) || 3;
    }

    // Handle stipend updates
    if (update.stipend) {
      const stipendUpdate = {};
      if (update.stipend.min !== undefined) stipendUpdate.amount = Number(update.stipend.min);
      if (update.stipend.max !== undefined && update.stipend.max > 0) {
        stipendUpdate.amount = Number(update.stipend.max);
      }
      if (update.stipend.currency !== undefined) stipendUpdate.currency = String(update.stipend.currency || 'INR');
      stipendUpdate.period = 'monthly';
      update.stipend = stipendUpdate;
      
      if (stipendUpdate.amount === 0) {
        update.isUnpaid = true;
      }
    }

    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    res.json({ message: 'Internship updated successfully', internship });
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({ message: 'Failed to update internship' });
  }
});

// Delete internship (admin)
router.delete('/internships/:id', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Delete associated applications
    try {
      await InternshipApplication.deleteMany({ internshipId: req.params.id });
    } catch (err) {
      console.warn('Deleting internship applications failed:', err.message);
    }

    await Internship.findByIdAndDelete(req.params.id);

    res.json({ message: 'Internship deleted successfully', internshipId: req.params.id });
  } catch (error) {
    console.error('Delete internship (admin) error:', error);
    res.status(500).json({ message: 'Failed to delete internship' });
  }
});

// Get internship applications (admin)
router.get('/internships/:id/applications', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = {
      internship: id,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      InternshipApplication.find(query)
        .populate('user', 'name email phone profilePhoto location skills')
        .populate('internship', 'title companyName location duration')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InternshipApplication.countDocuments(query)
    ]);

    // Get status statistics
    const stats = await InternshipApplication.aggregate([
      { $match: { internship: new mongoose.Types.ObjectId(id), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });

    res.json({
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats: statusCounts
    });
  } catch (error) {
    console.error('Get internship applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Update internship status (approve/reject/activate)
router.patch('/internships/:id/status', adminAuth, checkPermission('jobManagement'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    internship.verificationStatus = status;
    if (status === 'approved' || status === 'active') {
      internship.isActive = true;
      internship.status = 'active';
    } else if (status === 'rejected') {
      internship.isActive = false;
      internship.status = 'closed';
    }
    
    if (adminNotes) {
      internship.moderationNotes = adminNotes;
    }
    
    await internship.save();

    // Notify employer
    try {
      const title = status === 'approved' ? 'Internship approved' : 
                    status === 'active' ? 'Internship is live' : 
                    status === 'rejected' ? 'Internship rejected' : 
                    `Internship status updated to ${status}`;
      const message = status === 'rejected' && adminNotes
        ? `${internship.title} was rejected. Reason: ${adminNotes}`
        : `${internship.title} status updated to ${status}`;
      
      EmployerNotification.create({
        employerId: internship.employer,
        type: 'internship_status',
        title,
        message,
        data: { internshipId: internship._id, status }
      }).catch(() => {});
    } catch (_) {}

    res.json({ message: `Internship ${status} successfully` });
  } catch (error) {
    console.error('Update internship status error:', error);
    res.status(500).json({ message: 'Failed to update internship status' });
  }
});

// Analytics
router.get('/analytics', adminAuth, checkPermission('analytics'), async (req, res) => {
  try {
    // Get data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      employerGrowth,
      jobPostings,
      topSkills
    ] = await Promise.all([
      User.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Employer.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Job.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Job.aggregate([
        { $unwind: "$skills" },
        {
          $group: {
            _id: "$skills",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      userGrowth,
      employerGrowth,
      jobPostings,
      topSkills
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// ==================== TEST MANAGEMENT ROUTES ====================

// Get all tests
router.get('/tests', adminAuth, async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('questions')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      tests
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tests' 
    });
  }
});

// ==================== TEST PERFORMANCE MONITORING ROUTES ====================
// IMPORTANT: These must be before /tests/:testId route

// Get tests pending review (need manual grading)
router.get('/tests/pending-review', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find attempts that need manual grading
    const pendingAttempts = await TestAttempt.find({
      gradingStatus: 'pending-review',
      status: 'completed'
    })
      .populate('userId', 'name email phone')
      .populate('testId', 'title type totalMarks')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestAttempt.countDocuments({
      gradingStatus: 'pending-review',
      status: 'completed'
    });

    // Group by test for easier management
    const testGroups = {};
    pendingAttempts.forEach(attempt => {
      const testId = attempt.testId?._id?.toString();
      if (testId) {
        if (!testGroups[testId]) {
          testGroups[testId] = {
            testId,
            testTitle: attempt.testId?.title,
            testType: attempt.testId?.type,
            attempts: []
          };
        }
        testGroups[testId].attempts.push(attempt);
      }
    });

    res.json({
      success: true,
      attempts: pendingAttempts,
      groupedByTest: Object.values(testGroups),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch pending review tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending review tests'
    });
  }
});

// Get test statistics overview
router.get('/tests/statistics', adminAuth, async (req, res) => {
  try {
    const { testId } = req.query;

    let query = {
      status: 'completed',
      // Only include attempts that are either auto-graded or manually graded (not pending review)
      gradingStatus: { $in: ['auto-graded', 'graded'] }
    };
    
    if (testId) {
      query.testId = testId;
    }

    const results = await TestAttempt.find(query);
    const tests = await Test.find({ isActive: true });

    // Count pending reviews separately
    const pendingQuery = { status: 'completed', gradingStatus: 'pending-review' };
    if (testId) {
      pendingQuery.testId = testId;
    }
    const pendingReviews = await TestAttempt.countDocuments(pendingQuery);

    if (results.length === 0) {
      return res.json({
        success: true,
        statistics: {
          totalTests: tests.length,
          totalAttempts: 0,
          gradedAttempts: 0,
          pendingReviews,
          averageScore: 0,
          averagePercentage: 0,
          passRate: 0,
          testBreakdown: []
        }
      });
    }

    // Overall statistics (only for graded attempts)
    const totalAttempts = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const passedAttempts = results.filter(r => r.passed).length;

    // Per-test breakdown
    const testBreakdown = {};
    results.forEach(result => {
      const testIdStr = result.testId.toString();
      if (!testBreakdown[testIdStr]) {
        testBreakdown[testIdStr] = {
          testId: result.testId,
          testTitle: result.testTitle,
          attempts: 0,
          totalScore: 0,
          totalPercentage: 0,
          passed: 0
        };
      }

      testBreakdown[testIdStr].attempts++;
      testBreakdown[testIdStr].totalScore += result.score;
      testBreakdown[testIdStr].totalPercentage += result.percentage;
      if (result.passed) {
        testBreakdown[testIdStr].passed++;
      }
    });

    // Calculate averages for each test
    const testStats = Object.values(testBreakdown).map(test => ({
      testId: test.testId,
      testTitle: test.testTitle,
      attempts: test.attempts,
      averageScore: (test.totalScore / test.attempts).toFixed(2),
      averagePercentage: (test.totalPercentage / test.attempts).toFixed(2),
      passRate: ((test.passed / test.attempts) * 100).toFixed(2)
    }));

    res.json({
      success: true,
      statistics: {
        totalTests: tests.length,
        totalAttempts: totalAttempts + pendingReviews, // Total including pending
        gradedAttempts: totalAttempts, // Only graded
        pendingReviews, // Awaiting manual grading
        averageScore: totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0,
        averagePercentage: totalAttempts > 0 ? (totalPercentage / totalAttempts).toFixed(2) : 0,
        passRate: totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(2) : 0,
        testBreakdown: testStats
      }
    });
  } catch (error) {
    console.error('Fetch test statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test statistics'
    });
  }
});

// Get all test attempts with user details
router.get('/tests/attempts', adminAuth, async (req, res) => {
  try {
    const { testId, gradingStatus, page = 1, limit = 20 } = req.query;

    let query = {};
    if (testId) {
      query.testId = testId;
    }
    // Filter by grading status (auto-graded, pending-review, graded)
    if (gradingStatus) {
      query.gradingStatus = gradingStatus;
    }

    const skip = (page - 1) * limit;

    const attempts = await TestAttempt.find(query)
      .populate('userId', 'name email phone')
      .populate('testId', 'title type totalMarks')
      .populate('gradedBy', 'name email')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestAttempt.countDocuments(query);

    // Get grading status counts for dashboard
    const statusCounts = await TestAttempt.aggregate([
      { $match: testId ? { testId: new mongoose.Types.ObjectId(testId) } : {} },
      {
        $group: {
          _id: '$gradingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      'auto-graded': 0,
      'pending-review': 0,
      'graded': 0
    };
    statusCounts.forEach(s => {
      stats[s._id] = s.count;
    });

    res.json({
      success: true,
      attempts,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch test attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test attempts'
    });
  }
});

// Get detailed result for specific attempt (admin view)
router.get('/tests/attempts/:resultId', adminAuth, async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await TestAttempt.findById(resultId)
      .populate('userId', 'name email phone')
      .populate('testId')
      .populate('gradedBy', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found'
      });
    }

    // Fetch answers with question details populated for all question types
    const answers = await Answer.find({ attemptId: resultId })
      .populate({
        path: 'questionId',
        select: 'questionText type options correctAnswer codingDetails essayDetails explanation marks'
      })
      .sort({ _id: 1 }); // Maintain question order

    // Format answers to include question details for admin view with full information
    const questionResults = answers.map(answer => {
      const question = answer.questionId;
      return {
        _id: answer._id,
        questionId: answer.questionId?._id,
        questionText: answer.questionText,
        questionType: answer.questionType || question?.type || 'mcq',
        options: question?.options || [],
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        marks: answer.marks,
        marksObtained: answer.marksObtained,
        manuallyGraded: answer.manuallyGraded || false,
        gradingNotes: answer.gradingNotes || '',
        explanation: answer.explanation,
        // Include all question details for admin viewing and grading
        codingDetails: question?.codingDetails || answer.codingDetails || null,
        essayDetails: question?.essayDetails || answer.essayDetails || null
      };
    });

    res.json({
      success: true,
      result: {
        ...result.toObject(),
        questionResults
      }
    });
  } catch (error) {
    console.error('Fetch test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test result'
    });
  }
});

// Admin: Update manual grading for a test attempt
router.put('/tests/attempts/:resultId/grade', adminAuth, async (req, res) => {
  try {
    const { resultId } = req.params;
    const { questionGrades, feedback } = req.body; // Array of { questionId, marksObtained, gradingNotes }
    const adminId = req.admin.id;

    if (!questionGrades || !Array.isArray(questionGrades) || questionGrades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question grades are required'
      });
    }

    const attempt = await TestAttempt.findById(resultId).populate('userId', 'name email');
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Update each answer with manual grades
    let updatedCount = 0;
    for (const grade of questionGrades) {
      const answer = await Answer.findOne({
        attemptId: resultId,
        questionId: grade.questionId
      });

      if (answer) {
        // Validate marks (allow any positive value, admin has full control)
        const marksObtained = Math.max(0, parseFloat(grade.marksObtained) || 0);
        
        answer.marksObtained = marksObtained;
        answer.isCorrect = marksObtained >= answer.marks; // Full marks or more
        answer.manuallyGraded = true;
        answer.gradingNotes = grade.gradingNotes || '';
        await answer.save();
        updatedCount++;
      }
    }

    // Recalculate attempt scores based on all answers
    const allAnswers = await Answer.find({ attemptId: resultId });
    const totalScore = allAnswers.reduce((sum, ans) => sum + ans.marksObtained, 0);
    const correctCount = allAnswers.filter(ans => ans.isCorrect).length;

    const percentage = attempt.totalMarks > 0 ? (totalScore / attempt.totalMarks) * 100 : 0;
    const passed = totalScore >= attempt.passingMarks;

    attempt.score = totalScore;
    attempt.percentage = parseFloat(percentage.toFixed(2));
    attempt.correctAnswers = correctCount;
    attempt.passed = passed;
    attempt.gradingStatus = 'graded';
    attempt.gradedBy = adminId;
    attempt.gradedAt = new Date();
    
    // Add admin feedback if provided
    if (feedback) {
      attempt.adminFeedback = feedback;
    }
    
    await attempt.save();

    console.log(`✅ Grading completed for attempt ${resultId}: ${updatedCount} questions graded, Score: ${totalScore}/${attempt.totalMarks}`);

    res.json({
      success: true,
      message: 'Grades updated successfully',
      result: {
        _id: attempt._id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        gradingStatus: attempt.gradingStatus,
        gradedAt: attempt.gradedAt,
        questionsGraded: updatedCount
      }
    });
  } catch (error) {
    console.error('Update grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grades',
      error: error.message
    });
  }
});

// Get single test by ID
router.get('/tests/:testId', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).populate('questions');

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    res.json({
      success: true,
      test
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch test' 
    });
  }
});

// Create new test
router.post('/tests', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      questions,
      isActive,
      tags,
      instructions
    } = req.body;

    // Validation
    if (!title || !type) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and type are required' 
      });
    }

    // Prevent creating active test without questions
    if (isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot create an active test without questions. Create the test as inactive and add questions using the question management endpoints.' 
      });
    }

    const test = new Test({
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      questionCount: 0,
      isActive: false, // Always start as inactive
      tags: tags || [],
      instructions,
      createdBy: req.admin._id
    });

    await test.save();

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create test' 
    });
  }
});

// Update test
router.put('/tests/:testId', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const {
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      questions,
      isActive,
      tags,
      instructions
    } = req.body;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Update fields
    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (jobRole !== undefined) test.jobRole = jobRole;
    if (skill !== undefined) test.skill = skill;
    if (type) test.type = type;
    if (category) test.category = category;
    if (difficulty) test.difficulty = difficulty;
    if (duration) test.duration = duration;
    if (totalMarks) test.totalMarks = totalMarks;
    if (passingMarks) test.passingMarks = passingMarks;
    // Questions are managed separately via question management routes
    if (isActive !== undefined) test.isActive = isActive;
    if (tags) test.tags = tags;
    if (instructions !== undefined) test.instructions = instructions;

    await test.save();

    res.json({
      success: true,
      message: 'Test updated successfully',
      test
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update test' 
    });
  }
});

// Delete test
router.delete('/tests/:testId', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findByIdAndDelete(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete test' 
    });
  }
});

// Toggle test status (active/inactive)
router.patch('/tests/:testId/status', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { isActive } = req.body;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Validate test has questions before activation
    if (isActive && test.questionCount === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot activate test without questions. Please add at least one question first.' 
      });
    }

    test.isActive = isActive;
    await test.save();

    res.json({
      success: true,
      message: `Test ${isActive ? 'activated' : 'deactivated'} successfully`,
      test
    });
  } catch (error) {
    console.error('Toggle test status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update test status' 
    });
  }
});

// Add question to test
router.post('/tests/:testId/questions', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const questionData = req.body;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Create question in separate collection
    const question = new Question({
      ...questionData,
      testId: test._id,
      order: test.questionCount + 1
    });

    await question.save();

    // Update test's question count
    test.questionCount += 1;
    
    // Update total marks based on all questions
    await test.updateTotalMarks();
    await test.save();

    // Populate and return updated test
    const updatedTest = await Test.findById(testId).populate('questions');

    res.json({
      success: true,
      message: 'Question added successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add question' 
    });
  }
});

// Update question in test
router.put('/tests/:testId/questions/:questionId', adminAuth, async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const questionData = req.body;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    const question = await Question.findOne({ _id: questionId, testId });
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Update question
    Object.assign(question, questionData);
    await question.save();

    // Update test's total marks after question update
    const testForUpdate = await Test.findById(testId);
    if (testForUpdate) {
      await testForUpdate.updateTotalMarks();
      await testForUpdate.save();
    }

    // Populate and return updated test
    const updatedTest = await Test.findById(testId).populate('questions');

    res.json({
      success: true,
      message: 'Question updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update question' 
    });
  }
});

// Delete question from test
router.delete('/tests/:testId/questions/:questionId', adminAuth, async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Delete question from separate collection
    const deletedQuestion = await Question.findOneAndDelete({ _id: questionId, testId });

    if (!deletedQuestion) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Update test's question count
    test.questionCount = Math.max(0, test.questionCount - 1);
    
    // Update total marks after deleting question
    await test.updateTotalMarks();
    await test.save();

    // Populate and return updated test
    const updatedTest = await Test.findById(testId).populate('questions');

    res.json({
      success: true,
      message: 'Question deleted successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete question' 
    });
  }
});

// ==================== ADMIN QUESTION BANK ROUTES ====================
// View all questions across all tests (admin can see both admin and employer created)
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      difficulty,
      testId,
      createdByModel,
      search 
    } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (testId) {
      query.testId = testId;
    }

    if (search) {
      query.questionText = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await Question.find(query)
      .populate({
        path: 'testId',
        select: 'title type createdByModel createdBy',
        populate: {
          path: 'createdBy',
          select: 'username companyName'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Question.countDocuments(query);

    // Get statistics
    const questionsByType = await Question.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const questionsByDifficulty = await Question.aggregate([
      { $match: query },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      questions,
      statistics: {
        total,
        byType: questionsByType,
        byDifficulty: questionsByDifficulty
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch questions' 
    });
  }
});

// Get specific question by ID (admin can view any question)
router.get('/questions/:questionId', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId)
      .populate({
        path: 'testId',
        select: 'title type category difficulty createdByModel createdBy',
        populate: {
          path: 'createdBy',
          select: 'username companyName'
        }
      });

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch question' 
    });
  }
});

// Update any question (admin can edit both admin and employer questions)
router.put('/questions/:questionId', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    const updateData = req.body;
    delete updateData.testId; // Don't allow changing testId

    // Type-specific validation
    if (updateData.type === 'mcq' || (question.type === 'mcq' && !updateData.type)) {
      const options = updateData.options || question.options;
      const correctAnswer = updateData.correctAnswer || question.correctAnswer;
      
      if (options && options.length < 2) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require at least 2 options' 
        });
      }
      if (!correctAnswer) {
        return res.status(400).json({ 
          success: false,
          message: 'MCQ questions require a correct answer' 
        });
      }
    }

    Object.assign(question, updateData);
    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update question' 
    });
  }
});

// Delete any question (admin can delete both admin and employer questions)
router.delete('/questions/:questionId', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    const test = await Test.findById(question.testId);

    if (test) {
      // Update test's question count
      test.questionCount = Math.max(0, test.questionCount - 1);
      if (test.questionCount === 0) {
        test.isActive = false;
      }
      
      // Update total marks after deleting question
      await test.updateTotalMarks();
      await test.save();

      // Reorder remaining questions
      const remainingQuestions = await Question.find({ testId: test._id }).sort({ order: 1 });
      for (let i = 0; i < remainingQuestions.length; i++) {
        remainingQuestions[i].order = i + 1;
        await remainingQuestions[i].save();
      }
    }

    await Question.findByIdAndDelete(question._id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete question' 
    });
  }
});

// Bulk delete questions
router.post('/questions/bulk/delete', adminAuth, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Question IDs array is required' 
      });
    }

    const questions = await Question.find({ _id: { $in: questionIds } });

    // Group by test for efficient updates
    const testUpdates = {};
    questions.forEach(question => {
      const testId = question.testId.toString();
      if (!testUpdates[testId]) {
        testUpdates[testId] = 0;
      }
      testUpdates[testId]++;
    });

    // Delete questions
    await Question.deleteMany({ _id: { $in: questionIds } });

    // Update test question counts
    for (const [testId, count] of Object.entries(testUpdates)) {
      const test = await Test.findById(testId);
      if (test) {
        test.questionCount = Math.max(0, test.questionCount - count);
        if (test.questionCount === 0) {
          test.isActive = false;
        }
        
        // Update total marks after bulk delete
        await test.updateTotalMarks();
        await test.save();

        // Reorder remaining questions
        const remainingQuestions = await Question.find({ testId }).sort({ order: 1 });
        for (let i = 0; i < remainingQuestions.length; i++) {
          remainingQuestions[i].order = i + 1;
          await remainingQuestions[i].save();
        }
      }
    }

    res.json({
      success: true,
      message: `${questionIds.length} questions deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete questions' 
    });
  }
});

// Get all tests (admin can see both admin and employer created)
router.get('/all-tests', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category,
      createdByModel,
      isActive,
      search 
    } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (createdByModel) {
      query.createdByModel = createdByModel;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { jobRole: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tests = await Test.find(query)
      .populate({
        path: 'createdBy',
        select: 'username companyName'
      })
      .populate('questions')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Test.countDocuments(query);

    // Get statistics
    const testsByType = await Test.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const testsByCreator = await Test.aggregate([
      { $match: query },
      { $group: { _id: '$createdByModel', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      tests,
      statistics: {
        total,
        byType: testsByType,
        byCreator: testsByCreator,
        active: await Test.countDocuments({ ...query, isActive: true }),
        inactive: await Test.countDocuments({ ...query, isActive: false })
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tests' 
    });
  }
});

// Admin can delete any test (both admin and employer created)
router.delete('/all-tests/:testId', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Check if test is linked to any jobs
    const Job = require('../models/Job');
    const linkedJobs = await Job.countDocuments({ testId: test._id });
    
    if (linkedJobs > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete test that is linked to ${linkedJobs} job posting(s). Please remove the test from all jobs first.`,
        linkedJobsCount: linkedJobs
      });
    }

    // Delete all questions associated with this test
    await Question.deleteMany({ testId: test._id });

    // Delete the test
    await Test.findByIdAndDelete(test._id);

    res.json({
      success: true,
      message: 'Test and all associated questions deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete test' 
    });
  }
});

// Admin can update any test
router.put('/all-tests/:testId', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    const {
      title,
      description,
      jobRole,
      skill,
      type,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      isActive,
      tags,
      instructions
    } = req.body;

    // Check if trying to activate test without questions
    if (isActive && !test.canActivate()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot activate test without questions' 
      });
    }

    // Update fields
    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (jobRole !== undefined) test.jobRole = jobRole;
    if (skill !== undefined) test.skill = skill;
    if (type) test.type = type;
    if (category) test.category = category;
    if (difficulty) test.difficulty = difficulty;
    if (duration) test.duration = duration;
    if (totalMarks) test.totalMarks = totalMarks;
    if (passingMarks) test.passingMarks = passingMarks;
    if (isActive !== undefined) test.isActive = isActive;
    if (tags) test.tags = tags;
    if (instructions !== undefined) test.instructions = instructions;

    await test.save();

    const updatedTest = await Test.findById(test._id)
      .populate('questions')
      .populate('createdBy', 'username companyName');

    res.json({
      success: true,
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update test' 
    });
  }
});

// ==================== END ADMIN QUESTION BANK ROUTES ====================

// Events moderation
router.get('/events', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
    const ids = events.map(e => e._id);
    const counts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: '$eventId', count: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ['$ticketType', 'paid'] }, 1, 0] } }, revenue: { $sum: '$amountPaid' } } }
    ]);
    const byId = new Map(counts.map(c => [String(c._id), c]));
    const commissionRate = parseFloat(process.env.EVENT_COMMISSION_RATE || '0');
    const withCounts = events.map(e => ({
      ...e,
      registrationsCount: byId.get(String(e._id))?.count || 0,
      paidRegistrations: byId.get(String(e._id))?.paid || 0,
      revenue: byId.get(String(e._id))?.revenue || 0,
      commission: commissionRate > 0 ? Math.round(((byId.get(String(e._id))?.revenue || 0) * commissionRate) * 100) / 100 : 0
    }));
    res.json({ success: true, events: withCounts });
  } catch (error) {
    console.error('Admin list events error:', error);
    res.status(500).json({ success: false, message: 'Failed to list events' });
  }
});

// Registrations: list per event (with basic user info)
router.get('/events/:eventId/registrations', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const regs = await EventRegistration.aggregate([
      { $match: { eventId: new (require('mongoose')).Types.ObjectId(eventId) } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, userId: 1, status: 1, ticketType: 1, amountPaid: 1, currency: 1, paymentStatus: 1, ticketCode: 1, createdAt: 1, 'user.name': 1, 'user.email': 1 } },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, registrations: regs });
  } catch (error) {
    console.error('Admin list registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to list registrations' });
  }
});

// Registrations: update status (attended/no_show/cancelled)
router.patch('/events/:eventId/registrations/:regId/status', adminAuth, async (req, res) => {
  try {
    const { regId } = req.params;
    const { status } = req.body;
    const allowed = ['registered', 'cancelled', 'attended', 'no_show'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const doc = await EventRegistration.findByIdAndUpdate(regId, { $set: { status, attendedAt: status === 'attended' ? new Date() : undefined } }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, registration: doc });
  } catch (error) {
    console.error('Admin update registration status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update registration status' });
  }
});

// Registrations: refund (stub - marks paymentStatus refunded)
router.post('/events/:eventId/registrations/:regId/refund', adminAuth, async (req, res) => {
  try {
    const { regId } = req.params;
    const doc = await EventRegistration.findByIdAndUpdate(regId, { $set: { paymentStatus: 'refunded' } }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, registration: doc });
  } catch (error) {
    console.error('Admin refund registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});
router.post('/events/:eventId/approve', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const updated = await Event.findByIdAndUpdate(
      eventId,
      { status: 'approved', approvedBy: req.admin._id, approvedAt: new Date(), rejectionReason: undefined },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event: updated });
  } catch (error) {
    console.error('Admin approve event error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve event' });
  }
});

router.post('/events/:eventId/reject', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body || {};
    const updated = await Event.findByIdAndUpdate(
      eventId,
      { status: 'rejected', approvedBy: undefined, approvedAt: undefined, rejectionReason: reason || 'Not specified' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event: updated });
  } catch (error) {
    console.error('Admin reject event error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject event' });
  }
});

// Edit (update) event by admin
router.put('/events/:eventId', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const update = { ...req.body };
    // Basic normalization similar to employer update
    if (update.type === 'paid' && (!update.price || Number(update.price) <= 0)) {
      return res.status(400).json({ success: false, message: 'Price must be provided for paid events' });
    }
    if (update.type === 'free') update.price = 0;
    if (update.mode === 'online') update.venueAddress = undefined;
    if (update.mode === 'offline') update.meetingLink = undefined;

    const updated = await Event.findByIdAndUpdate(eventId, { $set: update }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event: updated });
  } catch (error) {
    console.error('Admin update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// Delete (cancel/remove) event by admin
router.delete('/events/:eventId', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Event.findByIdAndDelete(eventId);
    if (!result) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event removed' });
  } catch (error) {
    console.error('Admin delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});
// Contact Queries Management
router.get('/queries', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      ContactQuery.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      ContactQuery.countDocuments(query)
    ]);

    res.json({
      queries: items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalQueries: total
    });
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({ message: 'Failed to fetch contact queries' });
  }
});

router.patch('/queries/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const doc = await ContactQuery.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Query not found' });
    res.json({ message: 'Status updated', query: doc });
  } catch (error) {
    console.error('Update query status error:', error);
    res.status(500).json({ message: 'Failed to update query status' });
  }
});

router.patch('/queries/:id/notes', adminAuth, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const doc = await ContactQuery.findByIdAndUpdate(
      req.params.id,
      { $set: { adminNotes: String(adminNotes || '').trim() } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Query not found' });
    res.json({ message: 'Notes updated', query: doc });
  } catch (error) {
    console.error('Update query notes error:', error);
    res.status(500).json({ message: 'Failed to update query notes' });
  }
});

router.delete('/queries/:id', adminAuth, async (req, res) => {
  try {
    const result = await ContactQuery.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Query not found' });
    res.json({ message: 'Query deleted' });
  } catch (error) {
    console.error('Delete query error:', error);
    res.status(500).json({ message: 'Failed to delete query' });
  }
});

// ==================== PAYMENT MANAGEMENT ROUTES ====================

// Get all payments with pagination and filtering
router.get('/payments', adminAuth, checkPermission('paymentManagement'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const planId = req.query.planId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};
    
    // Search by employer company name or email
    if (search) {
      const employers = await Employer.find({
        $or: [
          { companyName: { $regex: search, $options: 'i' } },
          { companyEmail: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const employerIds = employers.map(emp => emp._id);
      query.employerId = { $in: employerIds };
    }
    
    if (status) query.status = status;
    if (planId) query.planId = planId;
    
    if (startDate || endDate) {
      query.initiatedAt = {};
      if (startDate) query.initiatedAt.$gte = new Date(startDate);
      if (endDate) query.initiatedAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('employerId', 'companyName companyEmail')
      .sort({ initiatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPayments: total
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get payment statistics
router.get('/payments/stats', adminAuth, checkPermission('paymentManagement'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const match = {};
    if (startDate || endDate) {
      match.initiatedAt = {};
      if (startDate) match.initiatedAt.$gte = new Date(startDate);
      if (endDate) match.initiatedAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] }
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] }
          }
        }
      }
    ]);

    // Get plan-wise statistics
    const planStats = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      stats: stats[0] || {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0,
        successfulAmount: 0,
        refundedAmount: 0
      },
      planStats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch payment statistics' });
  }
});

// Get specific payment details
router.get('/payments/:paymentId', adminAuth, checkPermission('paymentManagement'), async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId)
      .populate('employerId', 'companyName companyEmail contactPersonName contactPersonEmail');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Get related subscription if exists
    const subscription = await Subscription.findOne({
      orderId: payment.razorpayOrderId
    });

    res.json({
      success: true,
      payment,
      subscription
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
});

// Get payments by employer
router.get('/employers/:employerId/payments', adminAuth, checkPermission('paymentManagement'), async (req, res) => {
  try {
    const { employerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { employerId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ initiatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPayments: total
    });
  } catch (error) {
    console.error('Get employer payments error:', error);
    res.status(500).json({ message: 'Failed to fetch employer payments' });
  }
});

// ==================== PLAN MANAGEMENT ROUTES ====================

// Get all plans with pagination and filtering
router.get('/plans', adminAuth, checkPermission('planManagement'), planController.getAllPlans);

// Get single plan by ID
router.get('/plans/:planId', adminAuth, checkPermission('planManagement'), planController.getPlanById);

// Create new plan
router.post('/plans', adminAuth, checkPermission('planManagement'), planController.createPlan);

// Update existing plan
router.put('/plans/:planId', adminAuth, checkPermission('planManagement'), planController.updatePlan);

// Delete plan
router.delete('/plans/:planId', adminAuth, checkPermission('planManagement'), planController.deletePlan);

// Toggle plan status (active/inactive)
router.patch('/plans/:planId/status', adminAuth, checkPermission('planManagement'), planController.togglePlanStatus);

// Get plan usage statistics
router.get('/plans/:planId/stats', adminAuth, checkPermission('planManagement'), planController.getPlanUsageStats);

// Get all plan categories
router.get('/plans/categories', adminAuth, checkPermission('planManagement'), planController.getPlanCategories);

// Duplicate plan
router.post('/plans/:planId/duplicate', adminAuth, checkPermission('planManagement'), planController.duplicatePlan);

// Bulk update plan status
router.patch('/plans/bulk-status', adminAuth, checkPermission('planManagement'), planController.bulkUpdatePlanStatus);

// ====================================
// COURSE MANAGEMENT ROUTES
// ====================================

// Get all courses (with filters)
router.get('/courses', adminAuth, async (req, res) => {
  try {
    const { skillCategory, category, level, isActive, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (skillCategory) query.skillCategory = skillCategory;
    if (category) query.category = category;
    if (level) query.level = level;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Course.countDocuments(query);
    
    res.json({
      success: true,
      courses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Error fetching courses', error: error.message });
  }
});

// Get single course by ID
router.get('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('relatedMentors', 'name photo role')
      .populate('relatedTests', 'title');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Get lessons for this course
    const lessons = await Lesson.find({ courseId: req.params.id })
      .sort({ lessonOrder: 1 })
      .populate('createdBy', 'name email');
    
    res.json({ success: true, course, lessons });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Error fetching course', error: error.message });
  }
});

// Create new course
router.post('/courses', adminAuth, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.admin._id
    };
    
    const course = new Course(courseData);
    await course.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Course created successfully', 
      course 
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Error creating course', error: error.message });
  }
});

// Update course
router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Course updated successfully', 
      course 
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Error updating course', error: error.message });
  }
});

// Toggle course status
router.patch('/courses/:id/status', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    course.isActive = !course.isActive;
    await course.save();
    
    res.json({ 
      success: true, 
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`, 
      course 
    });
  } catch (error) {
    console.error('Toggle course status error:', error);
    res.status(500).json({ success: false, message: 'Error toggling course status', error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Also delete associated lessons
    await Lesson.deleteMany({ courseId: req.params.id });
    
    res.json({ 
      success: true, 
      message: 'Course and associated lessons deleted successfully' 
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Error deleting course', error: error.message });
  }
});

module.exports = router;
