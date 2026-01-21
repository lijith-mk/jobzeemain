const mongoose = require('mongoose');
require('dotenv').config();

async function debugEmployerData() {
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
    
    console.log('📊 Employer data found:');
    console.log('ID:', employer._id);
    console.log('Company Name:', employer.companyName);
    console.log('Company Email:', employer.companyEmail);
    console.log('Company Phone:', employer.companyPhone);
    console.log('Contact Person Name:', employer.contactPersonName);
    console.log('Company Logo:', employer.companyLogo);
    console.log('Industry:', employer.industry);
    console.log('Company Size:', employer.companySize);
    console.log('Website:', employer.website);
    console.log('LinkedIn:', employer.linkedinProfile);
    console.log('Twitter:', employer.twitterHandle);
    console.log('Company Description:', employer.companyDescription);
    console.log('Headquarters:', employer.headquarters);
    console.log('Benefits:', employer.benefits);
    console.log('Company Values:', employer.companyValues);
    console.log('Work Culture:', employer.workCulture);
    
    console.log('\n🔍 Full employer object:');
    console.log(JSON.stringify(employer.toObject(), null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

debugEmployerData();
