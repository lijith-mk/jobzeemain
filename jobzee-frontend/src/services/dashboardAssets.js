import API_BASE_URL from '../config/api';
/**
 * Enhanced service for handling dashboard assets with MongoDB and Cloudinary
 */
const API_URL = `${API_BASE_URL}/api`;

// Cache for dashboard assets
let assetsCache = null;
let lastFetched = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch dashboard assets from the server (MongoDB + Cloudinary)
 * @returns {Promise<Object>} Dashboard assets with backgrounds, metadata, and fallbacks
 */
export const getDashboardAssets = async () => {
  try {
    // Return cached data if still valid
    if (assetsCache && lastFetched && (Date.now() - lastFetched) < CACHE_DURATION) {
      return assetsCache;
    }

    const response = await fetch(`${API_URL}/dashboard/assets`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard assets');
    }
    
    const result = await response.json();
    const assets = result.data;
    
    // Cache the results
    assetsCache = assets;
    lastFetched = Date.now();
    
    return assets;
  } catch (error) {
    console.error('Error fetching dashboard assets:', error);
    // Return fallback assets if fetch fails
    return getFallbackAssets();
  }
};

/**
 * Legacy function for backward compatibility
 * @returns {Promise<Object>} Dashboard backgrounds in old format
 */
export const getDashboardBackgrounds = async () => {
  try {
    const assets = await getDashboardAssets();
    
    // Convert new format to old format for backward compatibility
    const backgrounds = {};
    const gradients = {};
    
    Object.keys(assets.backgrounds || {}).forEach(category => {
      backgrounds[category] = assets.backgrounds[category].url;
      gradients[category] = {
        gradient: assets.fallbacks[category]?.gradient || getFallbackGradient(category),
        overlay: `from-${getColorForCategory(category)}-900/85 to-${getColorForCategory(category)}-800/90`,
        color: `from-${getColorForCategory(category)}-500 to-${getColorForCategory(category)}-600`
      };
    });
    
    return { backgrounds, gradients };
  } catch (error) {
    console.error('Error in getDashboardBackgrounds:', error);
    return getFallbackBackgrounds();
  }
};

/**
 * Get fallback assets when server/database is unavailable
 * @returns {Object} Fallback dashboard assets
 */
const getFallbackAssets = () => {
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
};

/**
 * Legacy fallback backgrounds for backward compatibility
 * @returns {Object} Old format fallback backgrounds
 */
const getFallbackBackgrounds = () => {
  return {
    backgrounds: null,
    gradients: {
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
    }
  };
};

/**
 * Get fallback gradient for a category
 * @param {string} category - Asset category
 * @returns {string} CSS gradient
 */
const getFallbackGradient = (category) => {
  const gradients = {
    applications: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    interviews: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    profileViews: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    savedJobs: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };
  return gradients[category] || gradients.applications;
};

/**
 * Get color for category
 * @param {string} category - Asset category
 * @returns {string} Color name for Tailwind
 */
const getColorForCategory = (category) => {
  const colors = {
    applications: 'blue',
    interviews: 'emerald', 
    profileViews: 'indigo',
    savedJobs: 'amber'
  };
  return colors[category] || 'blue';
};

/**
 * Handle image loading errors by applying fallback styles
 * @param {Event} event - The error event
 * @param {string} fallbackGradient - Fallback gradient CSS class
 */
export const handleImageError = (event, fallbackGradient) => {
  const element = event.target;
  // Set display to none for the image
  element.style.display = 'none';
  
  // Add fallback gradient to parent
  if (element.parentElement) {
    element.parentElement.classList.add(...fallbackGradient.split(' '));
  }
};

/**
 * Initialize default dashboard assets (admin only)
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Initialization result
 */
export const initializeDashboardAssets = async (token) => {
  try {
    const response = await fetch(`${API_URL}/dashboard/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize dashboard assets');
    }
    
    const data = await response.json();
    
    // Clear cache to force reload of new assets
    assetsCache = null;
    lastFetched = null;
    
    return data;
  } catch (error) {
    console.error('Error initializing dashboard assets:', error);
    throw error;
  }
};

/**
 * Upload single dashboard asset (admin only)
 * @param {File} file - Image file to upload
 * @param {Object} metadata - Asset metadata
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Upload result
 */
export const uploadDashboardAsset = async (file, metadata, token) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', metadata.name);
    formData.append('category', metadata.category);
    formData.append('type', metadata.type || 'background');
    
    if (metadata.fallbackGradient) {
      formData.append('fallbackGradient', metadata.fallbackGradient);
    }
    
    if (metadata.metadata) {
      formData.append('metadata', JSON.stringify(metadata.metadata));
    }
    
    const response = await fetch(`${API_URL}/dashboard/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload dashboard asset');
    }
    
    const data = await response.json();
    
    // Clear cache to force reload
    assetsCache = null;
    lastFetched = null;
    
    return data;
  } catch (error) {
    console.error('Error uploading dashboard asset:', error);
    throw error;
  }
};

/**
 * Upload dashboard assets (admin only) - Legacy function
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Upload result
 */
export const uploadDashboardAssets = async (token) => {
  return initializeDashboardAssets(token);
};

/**
 * Delete dashboard asset (admin only)
 * @param {string} assetId - Asset ID to delete
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Delete result
 */
export const deleteDashboardAsset = async (assetId, token) => {
  try {
    const response = await fetch(`${API_URL}/dashboard/assets/${assetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete dashboard asset');
    }
    
    const data = await response.json();
    
    // Clear cache to force reload
    assetsCache = null;
    lastFetched = null;
    
    return data;
  } catch (error) {
    console.error('Error deleting dashboard asset:', error);
    throw error;
  }
};

/**
 * Enhanced image error handler with modern fallback
 * @param {Event} event - Error event
 * @param {Object} fallbackData - Fallback styling data
 */
export const handleImageErrorEnhanced = (event, fallbackData) => {
  const element = event.target;
  const parent = element.parentElement;
  
  if (parent) {
    // Hide the image
    element.style.display = 'none';
    
    // Apply gradient background
    if (fallbackData.gradient) {
      parent.style.background = fallbackData.gradient;
    }
    
    // Add shimmer animation class
    parent.classList.add('animate-pulse');
    
    // Remove animation after 2 seconds
    setTimeout(() => {
      parent.classList.remove('animate-pulse');
    }, 2000);
  }
};

/**
 * Clear assets cache (useful for forced refreshes)
 */
export const clearAssetsCache = () => {
  assetsCache = null;
  lastFetched = null;
};

/**
 * Get asset by category
 * @param {string} category - Asset category
 * @returns {Promise<Object>} Category assets
 */
export const getAssetsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_URL}/dashboard/assets/category/${category}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch assets for category: ${category}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching assets for category ${category}:`, error);
    return [];
  }
};

export default {
  getDashboardAssets,
  getDashboardBackgrounds,
  initializeDashboardAssets,
  uploadDashboardAsset,
  uploadDashboardAssets,
  deleteDashboardAsset,
  handleImageError,
  handleImageErrorEnhanced,
  clearAssetsCache,
  getAssetsByCategory
};
