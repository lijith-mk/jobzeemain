const { testEmailConnection } = require('./utils/emailService');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email service configuration...');
  
  try {
    const isWorking = await testEmailConnection();
    if (isWorking) {
      console.log('✅ Email service is working properly!');
    } else {
      console.log('❌ Email service is not working');
    }
  } catch (error) {
    console.error('❌ Email service error:', error.message);
  }
}

testEmail();
