const cloudinary = require('../config/cloudinary');
require('dotenv').config();

async function testCloudinaryConnection() {
  try {
    console.log('🧪 Testing Cloudinary connection...');
    console.log('Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
    });

    // Test connection by getting account details
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('Response:', result);

  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testCloudinaryConnection();
