// Debug script to check employer data
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugEmployer() {
  try {
    const Employer = require('./models/Employer');
    
    // Find the employer with email wipro@company.com
    const employer = await Employer.findOne({ companyEmail: 'wipro@company.com' });
    
    if (!employer) {
      console.log('Employer not found');
      return;
    }
    
    console.log('Employer data:');
    console.log('- Company Name:', employer.companyName);
    console.log('- Company Email:', employer.companyEmail);
    console.log('- Contact Person Name:', employer.contactPersonName);
    console.log('- Company Phone:', employer.companyPhone);
    console.log('- Contact Person Phone:', employer.contactPersonPhone);
    
    // Check if required fields are present
    console.log('\nValidation:');
    console.log('- Company Email exists:', !!employer.companyEmail);
    console.log('- Company Email length:', employer.companyEmail ? employer.companyEmail.length : 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugEmployer();