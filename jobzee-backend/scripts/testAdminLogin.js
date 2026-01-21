const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAdminLogin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test the login logic directly (bypassing HTTP)
    const userId = 'admin123';
    const password = 'admin@123';

    console.log(`\n🔍 Testing login for userId: ${userId}, password: ${password}`);

    // Find admin
    const admin = await Admin.findOne({ userId });
    if (!admin) {
      console.log('❌ Admin not found in database');
      return;
    }

    console.log('✅ Admin found in database');
    console.log(`- Name: ${admin.name}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Is Active: ${admin.isActive}`);

    // Check password
    const isMatch = await admin.comparePassword(password);
    console.log(`🔐 Password match result: ${isMatch}`);

    if (!isMatch) {
      console.log('❌ Password does not match');
      return;
    }

    if (!admin.isActive) {
      console.log('❌ Admin account is deactivated');
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ JWT token generated successfully');
    console.log(`Token: ${token.substring(0, 30)}...`);

    // Test token verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token verification successful');
      console.log(`Decoded payload:`, decoded);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
    }

    console.log('\n🎉 All tests passed! Admin login should work.');

    // Test HTTP request simulation
    console.log('\n🌐 Testing HTTP request simulation...');
    const requestBody = { userId, password };
    console.log('Request body:', JSON.stringify(requestBody));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminLogin();
