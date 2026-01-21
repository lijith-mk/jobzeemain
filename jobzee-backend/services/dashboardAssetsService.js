const cloudinary = require('cloudinary').v2;
const DashboardAsset = require('../models/DashboardAsset');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Curated modern & interesting professional dashboard images
const PROFESSIONAL_IMAGES = [
  {
    name: 'futuristic-workspace-applications',
    category: 'applications',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Futuristic Workspace',
      description: 'Modern AI and tech workspace with holographic interfaces',
      tags: ['AI', 'hologram', 'futuristic', 'blue', 'modern'],
      color: '#3B82F6',
      style: 'futuristic'
    },
    fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'creative-team-interviews',
    category: 'interviews',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Creative Team Meeting',
      description: 'Diverse creative professionals collaborating in modern space',
      tags: ['teamwork', 'diversity', 'creative', 'collaboration', 'green'],
      color: '#10B981',
      style: 'creative'
    },
    fallbackGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    name: 'data-visualization-profile',
    category: 'profileViews',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Data Visualization Hub',
      description: 'Interactive data dashboards and business intelligence',
      tags: ['data-viz', 'charts', 'analytics', 'purple', 'insights'],
      color: '#8B5CF6',
      style: 'data'
    },
    fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'startup-success-saved',
    category: 'savedJobs',
    url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Startup Success Story',
      description: 'Celebrating achievements and milestones in tech startup',
      tags: ['startup', 'success', 'celebration', 'orange', 'achievement'],
      color: '#F59E0B',
      style: 'success'
    },
    fallbackGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  // Additional interesting options
  {
    name: 'remote-work-applications-alt',
    category: 'applications',
    url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Remote Work Paradise',
      description: 'Beautiful remote workspace with city skyline view',
      tags: ['remote', 'workspace', 'productivity', 'blue', 'modern'],
      color: '#3B82F6',
      style: 'remote'
    },
    fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'virtual-interview-setup',
    category: 'interviews',
    url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Virtual Interview Setup',
      description: 'Professional home office setup for video interviews',
      tags: ['virtual', 'interview', 'home-office', 'green', 'professional'],
      color: '#10B981',
      style: 'virtual'
    },
    fallbackGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    name: 'ai-analytics-dashboard',
    category: 'profileViews',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'AI Analytics Dashboard',
      description: 'Artificial intelligence and machine learning analytics',
      tags: ['AI', 'machine-learning', 'analytics', 'purple', 'future'],
      color: '#8B5CF6',
      style: 'ai'
    },
    fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'innovation-lab-saved',
    category: 'savedJobs',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&crop=entropy',
    metadata: {
      title: 'Innovation Laboratory',
      description: 'Cutting-edge tech innovation and research facility',
      tags: ['innovation', 'research', 'technology', 'orange', 'lab'],
      color: '#F59E0B',
      style: 'innovation'
    },
    fallbackGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
];

class DashboardAssetsService {
  
  // Upload a single image to Cloudinary and save to MongoDB
  async uploadAsset(imageData, assetInfo) {
    try {
      let uploadResult;
      
      if (imageData.startsWith('http')) {
        // Upload from URL
        uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: 'jobzee/dashboard',
          public_id: `dashboard_${assetInfo.category}_${Date.now()}`,
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto:best' },
            { format: 'webp' }
          ]
        });
      } else {
        // Upload from file buffer/base64
        uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: 'jobzee/dashboard',
          public_id: `dashboard_${assetInfo.category}_${Date.now()}`,
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto:best' },
            { format: 'webp' }
          ]
        });
      }

      // Create database entry
      const dashboardAsset = new DashboardAsset({
        name: assetInfo.name,
        type: assetInfo.type || 'background',
        category: assetInfo.category,
        cloudinaryData: {
          publicId: uploadResult.public_id,
          url: uploadResult.url,
          secureUrl: uploadResult.secure_url,
          format: uploadResult.format,
          resourceType: uploadResult.resource_type,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.bytes
        },
        fallbackGradient: assetInfo.fallbackGradient,
        metadata: assetInfo.metadata || {},
        isActive: true,
        order: assetInfo.order || 0
      });

      // Generate transformations
      await dashboardAsset.generateTransformations();
      
      return dashboardAsset;
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }

  // Initialize default dashboard assets
  async initializeDefaultAssets() {
    try {
      console.log('🎨 Initializing dashboard assets...');
      
      const uploadPromises = PROFESSIONAL_IMAGES.map(async (imageData, index) => {
        try {
          // Check if asset already exists
          const existingAsset = await DashboardAsset.findOne({ 
            name: imageData.name,
            category: imageData.category 
          });
          
          if (existingAsset) {
            console.log(`⚡ Asset already exists: ${imageData.name}`);
            return existingAsset;
          }

          console.log(`📤 Uploading: ${imageData.name}...`);
          const asset = await this.uploadAsset(imageData.url, {
            ...imageData,
            type: 'background',
            order: index
          });
          
          console.log(`✅ Uploaded: ${imageData.name}`);
          return asset;
        } catch (error) {
          console.error(`❌ Failed to upload ${imageData.name}:`, error.message);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(result => result !== null);
      
      console.log(`🎉 Successfully initialized ${successful.length}/${PROFESSIONAL_IMAGES.length} dashboard assets!`);
      return successful;
    } catch (error) {
      console.error('Error initializing default assets:', error);
      throw error;
    }
  }

  // Get all dashboard assets by category
  async getAssetsByCategory(category = null) {
    try {
      const query = { isActive: true };
      if (category) {
        query.category = category;
      }

      const assets = await DashboardAsset.find(query)
        .sort({ category: 1, order: 1 })
        .select('-__v');

      return assets;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }

  // Get formatted dashboard backgrounds for frontend
  async getFormattedDashboardAssets() {
    try {
      const assets = await this.getAssetsByCategory();
      
      const formattedAssets = {
        backgrounds: {},
        metadata: {},
        fallbacks: {}
      };

      assets.forEach(asset => {
        if (asset.type === 'background') {
          formattedAssets.backgrounds[asset.category] = {
            url: asset.optimizedUrl,
            originalUrl: asset.cloudinaryData.secureUrl,
            thumbnailUrl: asset.thumbnailUrl,
            mobileUrl: asset.transformations?.mobile?.url
          };

          formattedAssets.metadata[asset.category] = {
            title: asset.metadata.title,
            description: asset.metadata.description,
            color: asset.metadata.color,
            style: asset.metadata.style,
            tags: asset.metadata.tags
          };

          formattedAssets.fallbacks[asset.category] = {
            gradient: asset.fallbackGradient,
            color: asset.metadata.color
          };
        }
      });

      return formattedAssets;
    } catch (error) {
      console.error('Error formatting dashboard assets:', error);
      return this.getFallbackAssets();
    }
  }

  // Get fallback assets when database/cloudinary fails
  getFallbackAssets() {
    return {
      backgrounds: {},
      metadata: {},
      fallbacks: {
        applications: {
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#3B82F6'
        },
        interviews: {
          gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: '#10B981'
        },
        profileViews: {
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#8B5CF6'
        },
        savedJobs: {
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#F59E0B'
        }
      }
    };
  }

  // Delete an asset
  async deleteAsset(assetId) {
    try {
      const asset = await DashboardAsset.findById(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(asset.cloudinaryData.publicId);

      // Delete from database
      await DashboardAsset.findByIdAndDelete(assetId);

      return { success: true, message: 'Asset deleted successfully' };
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  // Update asset metadata
  async updateAssetMetadata(assetId, updates) {
    try {
      const asset = await DashboardAsset.findByIdAndUpdate(
        assetId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!asset) {
        throw new Error('Asset not found');
      }

      return asset;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  }

  // Toggle asset active status
  async toggleAssetStatus(assetId) {
    try {
      const asset = await DashboardAsset.findById(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      asset.isActive = !asset.isActive;
      await asset.save();

      return asset;
    } catch (error) {
      console.error('Error toggling asset status:', error);
      throw error;
    }
  }
}

module.exports = new DashboardAssetsService();
