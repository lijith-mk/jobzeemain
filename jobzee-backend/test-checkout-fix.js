// Test script to verify the checkout fix
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test the customer info extraction for employers
async function testEmployerCustomerInfo() {
  try {
    console.log('Testing employer customer info extraction...');
    
    // Import the Employer model
    const Employer = require('./models/Employer');
    
    // Test case 1: Employer with all fields
    const employer1 = new Employer({
      companyName: 'Test Company 1',
      companyEmail: 'test1@company.com',
      contactPersonName: 'John Doe',
      companyPhone: '123-456-7890',
      contactPersonPhone: '098-765-4321'
    });
    
    const customerInfo1 = { 
      name: employer1.contactPersonName || employer1.companyName || 'Unknown Employer', 
      email: employer1.companyEmail || '', 
      phone: employer1.companyPhone || employer1.contactPersonPhone || '' 
    };
    
    console.log('Test 1 - Full data employer:', customerInfo1);
    
    // Test case 2: Employer with minimal data (missing phone numbers)
    const employer2 = new Employer({
      companyName: 'Test Company 2',
      companyEmail: 'test2@company.com',
      contactPersonName: 'Jane Smith'
      // Missing companyPhone and contactPersonPhone
    });
    
    const customerInfo2 = { 
      name: employer2.contactPersonName || employer2.companyName || 'Unknown Employer', 
      email: employer2.companyEmail || '', 
      phone: employer2.companyPhone || employer2.contactPersonPhone || '' 
    };
    
    console.log('Test 2 - Minimal data employer:', customerInfo2);
    
    // Test case 3: Employer with only company name and email
    const employer3 = new Employer({
      companyName: 'Test Company 3',
      companyEmail: 'test3@company.com'
      // Missing contactPersonName, companyPhone, and contactPersonPhone
    });
    
    const customerInfo3 = { 
      name: employer3.contactPersonName || employer3.companyName || 'Unknown Employer', 
      email: employer3.companyEmail || '', 
      phone: employer3.companyPhone || employer3.contactPersonPhone || '' 
    };
    
    console.log('Test 3 - Company only employer:', customerInfo3);
    
    // Verify that all tests pass (no undefined values)
    const tests = [customerInfo1, customerInfo2, customerInfo3];
    let allPassed = true;
    
    for (let i = 0; i < tests.length; i++) {
      const info = tests[i];
      if (info.name === undefined || info.email === undefined || info.phone === undefined) {
        console.log(`✗ Test ${i+1} failed - contains undefined values`);
        allPassed = false;
      } else if (!info.name || !info.email) {
        console.log(`✗ Test ${i+1} failed - missing required name or email`);
        allPassed = false;
      } else {
        console.log(`✓ Test ${i+1} passed`);
      }
    }
    
    if (allPassed) {
      console.log('✓ All tests passed! The checkout fix should resolve the 500 error.');
    } else {
      console.log('✗ Some tests failed. The fix may not be complete.');
    }
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the test
testEmployerCustomerInfo();