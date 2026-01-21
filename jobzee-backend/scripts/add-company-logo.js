const mongoose = require('mongoose');
require('dotenv').config();

async function addCompanyLogo() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const Employer = require('../models/Employer');
    
    // Find the test employer
    const employer = await Employer.findOne({ companyEmail: 'test@company.com' });
    
    if (!employer) {
      console.log('❌ No employer found with email: test@company.com');
      return;
    }
    
    // Add a sample company logo URL
    const sampleLogoUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center';
    
    employer.companyLogo = sampleLogoUrl;
    await employer.save();
    
    console.log('✅ Company logo added successfully!');
    console.log('Logo URL:', sampleLogoUrl);
    
    // Verify the update
    const updatedEmployer = await Employer.findOne({ companyEmail: 'test@company.com' });
    console.log('Updated employer companyLogo:', updatedEmployer.companyLogo);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

addCompanyLogo();
