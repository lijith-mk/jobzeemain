const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check what admins exist in database
    const admins = await Admin.find({});
    console.log(`\n📊 Found ${admins.length} admin(s) in database:`);
    
    admins.forEach((admin, index) => {
      console.log(`\nAdmin ${index + 1}:`);
      console.log(`- ID: ${admin._id}`);
      console.log(`- User ID: ${admin.userId}`);
      console.log(`- Name: ${admin.name}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.role}`);
      console.log(`- Is Active: ${admin.isActive}`);
      console.log(`- Password Hash: ${admin.password.substring(0, 20)}...`);
    });

    if (admins.length === 0) {
      console.log('\n❌ No admin found in database. Creating one...');
      
      // Create admin manually
      const admin = new Admin({
        userId: 'admin123',
        password: 'admin@123',
        name: 'System Administrator',
        email: 'admin@jobzee.com'
      });

      await admin.save();
      console.log('✅ Admin created successfully!');
    } else {
      // Test password comparison for first admin
      const admin = admins[0];
      console.log(`\n🔐 Testing password for admin: ${admin.userId}`);
      
      const isPasswordValid = await admin.comparePassword('admin@123');
      console.log(`Password 'admin@123' is valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('\n🔄 Resetting password to admin@123...');
        admin.password = 'admin@123'; // This will trigger the pre-save hook to hash it
        await admin.save();
        console.log('✅ Password reset successfully!');
      }
    }

    console.log('\n✅ Debug complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAdmin();
