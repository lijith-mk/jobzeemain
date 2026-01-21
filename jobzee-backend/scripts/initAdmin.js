const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ userId: 'admin123' });
    if (existingAdmin) {
      console.log('ℹ️ Admin already exists');
      console.log('Admin credentials:');
      console.log('User ID: admin123');
      console.log('Password: admin@123');
      return;
    }

    // Create admin
    const admin = new Admin({
      userId: 'admin123',
      password: 'admin@123', // This will be hashed automatically
      name: 'System Administrator',
      email: 'admin@jobzee.com'
    });

    await admin.save();
    console.log('🎉 Admin initialized successfully!');
    console.log('Admin credentials:');
    console.log('User ID: admin123');
    console.log('Password: admin@123');
    console.log('');
    console.log('You can now login to the admin panel at:');
    console.log('POST http://localhost:5000/api/admin/login');

  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the initialization
initializeAdmin();
