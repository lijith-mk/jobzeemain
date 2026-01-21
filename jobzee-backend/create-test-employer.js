const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Employer model
const Employer = require('./models/Employer');

async function createTestEmployer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if test employer already exists
    const existingEmployer = await Employer.findOne({ 
      companyEmail: 'test@company.com' 
    });

    if (existingEmployer) {
      console.log('✅ Test employer already exists!');
      console.log('Email: test@company.com');
      console.log('Password: Test123!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    // Create test employer
    const testEmployer = await Employer.create({
      companyName: 'Test Company Inc',
      companyEmail: 'test@company.com',
      companyPhone: '+1234567890',
      password: hashedPassword,
      contactPersonName: 'John Test',
      contactPersonTitle: 'HR Manager',
      contactPersonEmail: 'john@company.com',
      contactPersonPhone: '+1234567891',
      industry: 'Technology',
      companySize: '11-50',
      headquarters: {
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345'
      },
      website: 'https://testcompany.com',
      isActive: true,
      isVerified: true
    });

    console.log('🎉 Test employer created successfully!');
    console.log('Email: test@company.com');
    console.log('Password: Test123!');
    console.log('Company: Test Company Inc');
    
  } catch (error) {
    console.error('❌ Error creating test employer:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Run the function
createTestEmployer();
