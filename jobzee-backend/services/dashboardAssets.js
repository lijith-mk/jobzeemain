const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

class DashboardAssetsService {
  constructor() {
    this.assetsFolder = 'jobzee-dashboard-assets';
  }

  // Upload dashboard background images to Cloudinary
  async uploadDashboardBackgrounds() {
    const dashboardImages = [
      {
        name: 'applications-bg',
        url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
        description: 'Professional workspace for applications'
      },
      {
        name: 'interviews-bg', 
        url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
        description: 'Interview meeting room'
      },
      {
        name: 'profile-views-bg',
        url: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
        description: 'Professional networking'
      },
      {
        name: 'saved-jobs-bg',
        url: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
        description: 'Job search workspace'
      }
    ];

    const uploadedImages = [];

    for (const image of dashboardImages) {
      try {
        const result = await cloudinary.uploader.upload(image.url, {
          folder: this.assetsFolder,
          public_id: image.name,
          transformation: [
            { width: 600, height: 400, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
          tags: ['dashboard', 'background']
        });

        uploadedImages.push({
          name: image.name,
          url: result.secure_url,
          public_id: result.public_id,
          description: image.description
        });

        console.log(`✅ Uploaded ${image.name}: ${result.secure_url}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${image.name}:`, error.message);
      }
    }

    return uploadedImages;
  }

  // Get dashboard background URLs
  getDashboardBackgrounds() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    return {
      applications: `${baseUrl}/f_auto,q_auto,w_600,h_400,c_fill/${this.assetsFolder}/applications-bg`,
      interviews: `${baseUrl}/f_auto,q_auto,w_600,h_400,c_fill/${this.assetsFolder}/interviews-bg`,
      profileViews: `${baseUrl}/f_auto,q_auto,w_600,h_400,c_fill/${this.assetsFolder}/profile-views-bg`,
      savedJobs: `${baseUrl}/f_auto,q_auto,w_600,h_400,c_fill/${this.assetsFolder}/saved-jobs-bg`
    };
  }

  // Create a set of professional gradient backgrounds as fallbacks
  getGradientBackgrounds() {
    return {
      applications: {
        gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
        overlay: 'from-blue-900/85 to-blue-800/90',
        color: 'from-blue-500 to-blue-600'
      },
      interviews: {
        gradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700',
        overlay: 'from-emerald-900/85 to-emerald-800/90',
        color: 'from-emerald-500 to-emerald-600'
      },
      profileViews: {
        gradient: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700',
        overlay: 'from-indigo-900/85 to-indigo-800/90',
        color: 'from-indigo-500 to-indigo-600'
      },
      savedJobs: {
        gradient: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
        overlay: 'from-amber-900/85 to-amber-800/90',
        color: 'from-amber-500 to-amber-600'
      }
    };
  }

  // Delete all dashboard assets
  async deleteDashboardAssets() {
    try {
      const result = await cloudinary.api.delete_resources_by_prefix(this.assetsFolder);
      console.log('Deleted dashboard assets:', result);
      return result;
    } catch (error) {
      console.error('Error deleting dashboard assets:', error);
      throw error;
    }
  }
}

module.exports = new DashboardAssetsService();
