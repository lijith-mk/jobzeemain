// Debug script to simulate the checkout process
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugCheckout() {
  try {
    const Employer = require('./models/Employer');
    
    // Find the employer with email wipro@company.com
    const employer = await Employer.findOne({ companyEmail: 'wipro@company.com' });
    
    if (!employer) {
      console.log('Employer not found');
      return;
    }
    
    console.log('Employer data:');
    console.log('- ID:', employer._id);
    console.log('- Company Name:', employer.companyName);
    console.log('- Company Email:', employer.companyEmail);
    console.log('- Contact Person Name:', employer.contactPersonName);
    console.log('- Company Phone:', employer.companyPhone);
    console.log('- Contact Person Phone:', employer.contactPersonPhone);
    
    // Simulate the customerInfo extraction
    const customerInfo = { 
      name: employer?.contactPersonName || employer?.companyName || 'Unknown Employer', 
      email: employer?.companyEmail || '', 
      phone: employer?.companyPhone || employer?.contactPersonPhone || '' 
    };
    
    console.log('\nExtracted customer info:');
    console.log('- Name:', customerInfo.name);
    console.log('- Email:', customerInfo.email);
    console.log('- Phone:', customerInfo.phone);
    
    // Check if email is valid
    console.log('\nEmail validation:');
    console.log('- Email exists:', !!customerInfo.email);
    console.log('- Email length:', customerInfo.email.length);
    console.log('- Email is empty string:', customerInfo.email === '');
    
    // Test if this would pass Order validation
    const Order = require('./models/Order');
    const testOrder = new Order({
      employer: employer._id,
      userType: 'employer',
      customerInfo: customerInfo,
      items: [],
      subtotal: 0,
      total: 0,
      paymentInfo: { method: 'razorpay' },
      billingAddress: { 
        name: customerInfo.name, 
        email: customerInfo.email, 
        address: { street: 'NA', city: 'NA', state: 'NA', country: 'NA', zipCode: '000000' } 
      },
      shippingAddress: { 
        name: customerInfo.name, 
        phone: customerInfo.phone, 
        address: { street: 'NA', city: 'NA', state: 'NA', country: 'NA', zipCode: '000000' } 
      }
    });
    
    try {
      await testOrder.validate();
      console.log('\n✓ Order validation passed');
    } catch (validationError) {
      console.log('\n✗ Order validation failed:');
      console.log(validationError.message);
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach(key => {
          console.log(`  - ${key}: ${validationError.errors[key].message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugCheckout();