const express = require('express');
const multer = require('multer');
const router = express.Router();
const dashboardAssetsService = require('../services/dashboardAssetsService');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route   GET /api/dashboard/assets
// @desc    Get all dashboard assets (formatted for frontend)
// @access  Public
router.get('/assets', async (req, res) => {
  try {
    const assets = await dashboardAssetsService.getFormattedDashboardAssets();
    
    res.json({
      success: true,
      data: assets,
      message: 'Dashboard assets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard assets:', error);
    
    // Return fallback assets if database fails
    const fallbackAssets = dashboardAssetsService.getFallbackAssets();
    res.json({
      success: true,
      data: fallbackAssets,
      message: 'Dashboard assets retrieved (fallback mode)',
      fallback: true
    });
  }
});

// @route   GET /api/dashboard/assets/category/:category
// @desc    Get assets by specific category
// @access  Public
router.get('/assets/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const assets = await dashboardAssetsService.getAssetsByCategory(category);
    
    res.json({
      success: true,
      data: assets,
      count: assets.length,
      message: `Assets for ${category} retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching assets by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
});

// @route   POST /api/dashboard/initialize
// @desc    Initialize default dashboard assets
// @access  Admin only
router.post('/initialize', [auth, isAdmin], async (req, res) => {
  try {
    console.log('🚀 Starting dashboard assets initialization...');
    
    const assets = await dashboardAssetsService.initializeDefaultAssets();
    
    res.json({
      success: true,
      data: assets,
      count: assets.length,
      message: `Successfully initialized ${assets.length} dashboard assets`
    });
  } catch (error) {
    console.error('Error initializing dashboard assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize dashboard assets',
      error: error.message
    });
  }
});

// @route   POST /api/dashboard/upload
// @desc    Upload new dashboard asset
// @access  Admin only
router.post('/upload', [auth, isAdmin, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { name, category, type, fallbackGradient, metadata } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Convert file buffer to base64
    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const assetInfo = {
      name,
      category,
      type: type || 'background',
      fallbackGradient,
      metadata: metadata ? JSON.parse(metadata) : {}
    };

    const asset = await dashboardAssetsService.uploadAsset(imageData, assetInfo);
    
    res.json({
      success: true,
      data: asset,
      message: 'Asset uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
      error: error.message
    });
  }
});

// @route   PUT /api/dashboard/assets/:id
// @desc    Update asset metadata
// @access  Admin only
router.put('/assets/:id', [auth, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    const allowedUpdates = ['name', 'metadata', 'fallbackGradient', 'isActive', 'order'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const asset = await dashboardAssetsService.updateAssetMetadata(id, filteredUpdates);
    
    res.json({
      success: true,
      data: asset,
      message: 'Asset updated successfully'
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
});

// @route   DELETE /api/dashboard/assets/:id
// @desc    Delete dashboard asset
// @access  Admin only
router.delete('/assets/:id', [auth, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dashboardAssetsService.deleteAsset(id);
    
    res.json({
      success: true,
      data: result,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
});

module.exports = router;
