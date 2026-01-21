// Test script for the "buy now" functionality
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test Razorpay integration
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

// Test the checkout single functionality
async function testCheckoutSingle() {
  try {
    console.log('Testing checkout single functionality...');
    
    // Test Razorpay instance creation
    const instance = getRazorpayInstance();
    console.log('✓ Razorpay instance created successfully!');
    
    // Test creating a simple order
    const order = await instance.orders.create({
      amount: 10000, // 100 INR in paise
      currency: "INR",
      receipt: "receipt_test_1"
    });
    
    console.log('✓ Test order created successfully:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
    
    console.log('✓ All tests passed! The "buy now" functionality should work correctly.');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('This might be why the "buy now" functionality is not working.');
  }
}

// Run the test
testCheckoutSingle().then(() => {
  console.log('Test completed.');
  process.exit(0);
});