const Address = require('../models/Address');
const { body, validationResult } = require('express-validator');

// GET /api/addresses - Get user's addresses
const getUserAddresses = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const addresses = await Address.getUserAddresses(userInfo.id, userInfo.type);
    
    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
};

// GET /api/addresses/default - Get user's default address
const getDefaultAddress = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const address = await Address.getDefaultAddress(userInfo.id, userInfo.type);
    
    res.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('Error fetching default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default address'
    });
  }
};

// POST /api/addresses - Create new address
const createAddress = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const address = await Address.createAddress(req.body, userInfo.id, userInfo.type);
    
    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address'
    });
  }
};

// PUT /api/addresses/:id - Update address
const updateAddress = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const address = await Address.updateAddress(id, req.body, userInfo.id, userInfo.type);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

// DELETE /api/addresses/:id - Delete address
const deleteAddress = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const address = await Address.deleteAddress(id, userInfo.id, userInfo.type);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
};

// PUT /api/addresses/:id/set-default - Set address as default
const setDefaultAddress = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const address = await Address.updateAddress(id, { isDefault: true }, userInfo.id, userInfo.type);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address'
    });
  }
};

// Helper function to get user info from request
const getUserInfo = (req) => {
  // Check if it's an employer (either through req.employer or req.user with employer role)
  if (req.employer) {
    return { id: req.employer.id, type: 'employer', data: req.employer };
  }
  if (req.user && req.user.role === 'employer') {
    return { id: req.user.id, type: 'employer', data: req.user };
  }
  if (req.user) {
    return { id: req.user.id, type: 'user', data: req.user };
  }
  return null;
};

module.exports = {
  getUserAddresses,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
