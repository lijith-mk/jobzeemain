const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the actual Admin model
const Admin = require('../models/Admin');

async function finalAdminFix() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin
    console.log('🗑️ Deleting existing admin accounts...');
    await Admin.deleteMany({});
    
    console.log('🔐 Creating properly hashed password...');
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    console.log('Hash created:', hashedPassword.substring(0, 20) + '...');
    
    // Create admin using direct insertion (bypass Mongoose middleware)
    console.log('📝 Inserting admin directly into database...');
    const adminData = {
      userId: 'admin123',
      password: hashedPassword,
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
    
    // Insert directly into MongoDB collection
    const result = await mongoose.connection.db.collection('admins').insertOne(adminData);
    console.log('✅ Admin inserted directly into database');
    
    // Now test by retrieving and comparing
    console.log('🧪 Testing retrieval and password comparison...');
    const admin = await Admin.findOne({ userId: 'admin123' });
    
    if (admin) {
      console.log('✅ Admin retrieved successfully');
      console.log('- User ID:', admin.userId);
      console.log('- Name:', admin.name);
      console.log('- Password hash:', admin.password.substring(0, 20) + '...');
      
      // Test password comparison using bcrypt directly
      const isMatch = await bcrypt.compare('admin@123', admin.password);
      console.log('🔐 Direct bcrypt comparison result:', isMatch);
      
      // Test using the model method
      const isMatchMethod = await admin.comparePassword('admin@123');
      console.log('🔐 Model method comparison result:', isMatchMethod);
      
      if (isMatch && isMatchMethod) {
        console.log('🎉 SUCCESS! Admin account is properly configured!');
        console.log('');
        console.log('Admin credentials:');
        console.log('User ID: admin123');
        console.log('Password: admin@123');
        console.log('');
        console.log('The admin login should now work via HTTP API!');
      } else {
        console.log('❌ Password comparison still failing');
      }
    } else {
      console.log('❌ Admin not found after insertion');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

finalAdminFix();
