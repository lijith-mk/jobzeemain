const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const setupAdmin = async () => {
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
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin();
    await admin.save();
    
    console.log('✅ Admin user created successfully');
    console.log('📋 Default Admin Credentials:');
    console.log('   User ID: admin123');
    console.log('   Password: admin@123');
    console.log('🌐 Access admin panel at: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Database connection closed');
  }
};

setupAdmin();
