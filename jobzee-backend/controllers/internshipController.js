const Internship = require('../models/Internship');
const { validationResult } = require('express-validator');

// GET /api/internships - Get all active internships (public)
const getAllInternships = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      category,
      location,
      locationType,
      minStipend,
      maxStipend,
      duration,
      search,
      sort
    } = req.query;

    let query = {
      status: 'active',
      isActive: true,
      applicationDeadline: { $gte: new Date() }
    };

    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (locationType) {
      query.locationType = locationType;
    }

    if (duration) {
      query.duration = parseInt(duration);
    }

    // Stipend filtering
    if (minStipend || maxStipend) {
      query['stipend.amount'] = {};
      if (minStipend) query['stipend.amount'].$gte = parseInt(minStipend);
      if (maxStipend) query['stipend.amount'].$lte = parseInt(maxStipend);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'stipend_high') sortOption = { 'stipend.amount': -1 };
    if (sort === 'stipend_low') sortOption = { 'stipend.amount': 1 };
    if (sort === 'deadline') sortOption = { applicationDeadline: 1 };
    if (sort === 'duration') sortOption = { duration: 1 };

    const internships = await Internship.find(query)
      .populate('employer', 'companyName companyLogo')
      .select('-__v')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Internship.countDocuments(query);

    res.json({
      success: true,
      internships,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internships'
    });
  }
};

// GET /api/internships/:id - Get internship details
const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('employer', 'companyName companyLogo companyDescription')
      .select('-__v');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    // Increment view count
    internship.incrementViews();

    res.json({
      success: true,
      internship
    });
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internship details'
    });
  }
};

// POST /api/internships - Create new internship (employer only)
const createInternship = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const employer = req.employer || req.user;
    const employerId = employer.id;

    const internshipData = {
      ...req.body,
      employer: employerId,
      companyName: employer.companyName || employer.name
    };

    const internship = new Internship(internshipData);
    await internship.save();

    res.status(201).json({
      success: true,
      message: 'Internship created successfully',
      internship: internship.toJSON()
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create internship'
    });
  }
};

// GET /api/internships/employer - Get employer's internships
const getEmployerInternships = async (req, res) => {
  try {
    const employer = req.employer || req.user;
    const employerId = employer.id;

    const internships = await Internship.findByEmployer(employerId, true)
      .select('-__v')
      .lean();

    res.json({
      success: true,
      internships
    });
  } catch (error) {
    console.error('Error fetching employer internships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internships'
    });
  }
};

// PATCH /api/internships/:id/status - Update internship status
const updateInternshipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const employer = req.employer || req.user;
    const employerId = employer.id;

    const internship = await Internship.findOne({
      _id: req.params.id,
      employer: employerId
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    internship.status = status;
    if (status === 'closed') {
      internship.closedAt = new Date();
    }

    await internship.save();

    res.json({
      success: true,
      message: 'Internship status updated successfully',
      internship
    });
  } catch (error) {
    console.error('Error updating internship status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update internship status'
    });
  }
};

// PUT /api/internships/:id - Update internship
const updateInternship = async (req, res) => {
  try {
    const employer = req.employer || req.user;
    const employerId = employer.id;

    const internship = await Internship.findOne({
      _id: req.params.id,
      employer: employerId
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        internship[key] = req.body[key];
      }
    });

    await internship.save();

    res.json({
      success: true,
      message: 'Internship updated successfully',
      internship
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update internship'
    });
  }
};

// DELETE /api/internships/:id - Delete internship
const deleteInternship = async (req, res) => {
  try {
    const employer = req.employer || req.user;
    const employerId = employer.id;

    const internship = await Internship.findOne({
      _id: req.params.id,
      employer: employerId
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    // Soft delete - mark as deleted instead of removing
    internship.deletedAt = new Date();
    internship.isActive = false;
    internship.status = 'closed';
    await internship.save();

    // Or hard delete if preferred
    // await Internship.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Internship deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete internship'
    });
  }
};

// GET /api/internships/categories - Get available categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'technology', label: 'Technology & IT', count: 0 },
      { value: 'marketing', label: 'Marketing & Sales', count: 0 },
      { value: 'finance', label: 'Finance & Accounting', count: 0 },
      { value: 'hr', label: 'Human Resources', count: 0 },
      { value: 'design', label: 'Design & Creative', count: 0 },
      { value: 'content', label: 'Content & Writing', count: 0 },
      { value: 'operations', label: 'Operations', count: 0 },
      { value: 'consulting', label: 'Consulting', count: 0 },
      { value: 'research', label: 'Research & Development', count: 0 },
      { value: 'other', label: 'Other', count: 0 }
    ];

    // Get count for each category
    const categoryCounts = await Internship.aggregate([
      {
        $match: {
          status: 'active',
          isActive: true,
          applicationDeadline: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Update counts
    categoryCounts.forEach(cat => {
      const category = categories.find(c => c.value === cat._id);
      if (category) {
        category.count = cat.count;
      }
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// GET /api/internships/search - Advanced search
const searchInternships = async (req, res) => {
  try {
    const {
      q,
      category,
      location,
      locationType,
      minStipend,
      maxStipend,
      skills,
      page = 1,
      limit = 20
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let filters = {};
    if (category) filters.category = category;
    if (location) filters.location = { $regex: location, $options: 'i' };
    if (locationType) filters.locationType = locationType;
    if (minStipend || maxStipend) {
      filters['stipend.amount'] = {};
      if (minStipend) filters['stipend.amount'].$gte = parseInt(minStipend);
      if (maxStipend) filters['stipend.amount'].$lte = parseInt(maxStipend);
    }
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filters.skills = { $in: skillsArray };
    }

    const internships = await Internship.searchInternships(q, filters)
      .populate('employer', 'companyName companyLogo')
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments({
      $text: { $search: q },
      status: 'active',
      isActive: true,
      applicationDeadline: { $gte: new Date() },
      ...filters
    });

    res.json({
      success: true,
      internships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching internships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search internships'
    });
  }
};

module.exports = {
  getAllInternships,
  getInternshipById,
  createInternship,
  getEmployerInternships,
  updateInternshipStatus,
  updateInternship,
  deleteInternship,
  getCategories,
  searchInternships
};