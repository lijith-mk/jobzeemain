const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@jobzee.com' });
    if (existingUser) {
      console.log('ℹ️ Test user already exists');
      console.log('Email: test@jobzee.com');
      console.log('Password: TestPassword123!');
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const user = new User({
      name: 'Test User',
      email: 'test@jobzee.com',
      phone: '+1234567890',
      password: hashedPassword,
      authProvider: 'local'
    });

    await user.save();
    console.log('🎉 Test user created successfully!');
    console.log('Login credentials:');
    console.log('Email: test@jobzee.com');
    console.log('Password: TestPassword123!');
    console.log('');
    console.log('You can now test forgot password with this email address.');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
