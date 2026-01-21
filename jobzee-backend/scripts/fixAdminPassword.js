const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin and create new one
    console.log('🗑️ Deleting existing admin accounts...');
    await Admin.deleteMany({});
    
    console.log('🆕 Creating new admin account...');
    
    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@123', salt);
    
    console.log('🔐 Password hashed manually');
    console.log(`Original: admin@123`);
    console.log(`Hashed: ${hashedPassword}`);
    
    // Create admin without using the schema (to bypass pre-save hook issues)
    const adminData = {
      userId: 'admin123',
      password: hashedPassword, // Use pre-hashed password
      name: 'System Administrator',
      email: 'admin@jobzee.com',
      role: 'super_admin',
      permissions: {
        userManagement: true,
        employerManagement: true,
        jobManagement: true,
        analytics: true,
        systemSettings: true
      },
      isActive: true,
      createdAt: new Date()
    };
    
    const admin = await Admin.create(adminData);
    console.log('✅ Admin created successfully with manual hash');
    
    // Test password comparison
    console.log('🧪 Testing password comparison...');
    const isMatch = await bcrypt.compare('admin@123', admin.password);
    console.log(`Password 'admin@123' matches: ${isMatch}`);
    
    if (isMatch) {
      console.log('🎉 SUCCESS! Admin login should now work!');
      console.log('');
      console.log('Admin credentials:');
      console.log('User ID: admin123');
      console.log('Password: admin@123');
    } else {
      console.log('❌ Still not working...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAdminPassword();
