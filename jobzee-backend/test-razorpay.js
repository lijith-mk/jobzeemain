const Razorpay = require('razorpay');

// Load environment variables
require('dotenv').config();

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log('Razorpay Key ID:', keyId);
  console.log('Razorpay Key Secret:', keySecret ? '[SET]' : '[NOT SET]');
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Please check your environment variables.');
  }
  
  // Validate key format (basic validation)
  if (keyId.length < 10 || keySecret.length < 10) {
    throw new Error('Invalid Razorpay keys format. Please check your environment variables.');
  }
  
  try {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  } catch (error) {
    throw new Error('Failed to initialize Razorpay instance: ' + error.message);
  }
}

try {
  const instance = getRazorpayInstance();
  console.log('Razorpay instance created successfully!');
  
  // Test creating a simple order
  instance.orders.create({
    amount: 100, // 1 INR in paise
    currency: "INR",
    receipt: "receipt#1"
  }).then(order => {
    console.log('Test order created:', order);
  }).catch(err => {
    console.error('Error creating test order:', err);
  });
} catch (error) {
  console.error('Error:', error.message);
}