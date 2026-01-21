/**
 * Manual script to initialize dashboard assets
 * Run this script to populate your MongoDB with curated dashboard images
 */

require('dotenv').config(); // Load environment variables first
const mongoose = require('mongoose');
const dashboardAssetsService = require('../services/dashboardAssetsService');

async function initializeAssets() {
  try {
    console.log('🚀 Starting dashboard assets initialization...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log('✅ Connected to MongoDB successfully!');

    // Initialize dashboard assets
    const assets = await dashboardAssetsService.initializeDefaultAssets();
    
    console.log(`\n🎉 Successfully initialized ${assets.length} dashboard assets!`);
    console.log('\n📋 Initialized assets:');
    
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name} (${asset.category})`);
      console.log(`   📷 Original: ${asset.cloudinaryData.secureUrl}`);
      console.log(`   🔧 Optimized: ${asset.optimizedUrl}`);
      console.log('');
    });

    console.log('✨ Dashboard assets are ready to use!');
    console.log('💡 Your frontend will now load these beautiful images automatically.');

  } catch (error) {
    console.error('❌ Error initializing dashboard assets:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Check your Cloudinary credentials in .env file');
    console.error('   • Ensure MongoDB is running and accessible');
    console.error('   • Verify your internet connection for image downloads');
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔐 MongoDB connection closed.');
    }
  }
}

// Run the initialization
if (require.main === module) {
  initializeAssets()
    .then(() => {
      console.log('\n🎯 Initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = initializeAssets;
