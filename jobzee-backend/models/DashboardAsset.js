const mongoose = require('mongoose');

const DashboardAssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['background', 'icon', 'animation'],
    default: 'background'
  },
  category: {
    type: String,
    required: true,
    enum: ['applications', 'interviews', 'profileViews', 'savedJobs', 'general'],
    default: 'general'
  },
  cloudinaryData: {
    publicId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    secureUrl: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      default: 'image'
    },
    width: Number,
    height: Number,
    size: Number
  },
  transformations: {
    optimized: {
      url: String,
      transformation: String
    },
    thumbnail: {
      url: String,
      transformation: String
    },
    mobile: {
      url: String,
      transformation: String
    }
  },
  fallbackGradient: {
    type: String,
    required: false
  },
  metadata: {
    title: String,
    description: String,
    tags: [String],
    color: String,
    style: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
DashboardAssetSchema.index({ type: 1, category: 1, isActive: 1 });
DashboardAssetSchema.index({ order: 1 });

// Virtual for getting optimized URL
DashboardAssetSchema.virtual('optimizedUrl').get(function() {
  return this.transformations?.optimized?.url || this.cloudinaryData.secureUrl;
});

// Virtual for getting thumbnail URL
DashboardAssetSchema.virtual('thumbnailUrl').get(function() {
  return this.transformations?.thumbnail?.url || this.cloudinaryData.secureUrl;
});

// Method to generate transformation URLs
DashboardAssetSchema.methods.generateTransformations = function() {
  const baseUrl = this.cloudinaryData.secureUrl;
  const publicId = this.cloudinaryData.publicId;
  
  // Generate optimized version for dashboard cards
  this.transformations.optimized = {
    url: baseUrl.replace('/upload/', '/upload/w_400,h_250,c_fill,q_auto,f_auto/'),
    transformation: 'w_400,h_250,c_fill,q_auto,f_auto'
  };
  
  // Generate thumbnail version
  this.transformations.thumbnail = {
    url: baseUrl.replace('/upload/', '/upload/w_150,h_100,c_fill,q_auto,f_auto/'),
    transformation: 'w_150,h_100,c_fill,q_auto,f_auto'
  };
  
  // Generate mobile version
  this.transformations.mobile = {
    url: baseUrl.replace('/upload/', '/upload/w_300,h_200,c_fill,q_auto,f_auto/'),
    transformation: 'w_300,h_200,c_fill,q_auto,f_auto'
  };
  
  return this.save();
};

module.exports = mongoose.model('DashboardAsset', DashboardAssetSchema);
