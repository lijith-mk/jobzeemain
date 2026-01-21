const { sendPasswordResetEmail } = require('./utils/emailService');
require('dotenv').config();

async function testSendEmail() {
  console.log('Testing actual email sending...');
  
  const testEmail = process.argv[2] || 'testuser@example.com';
  const testToken = 'test-token-123456789';
  
  console.log(`Attempting to send reset email to: ${testEmail}`);
  
  try {
    const result = await sendPasswordResetEmail(testEmail, testToken, 'user');
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
  }
}

// Allow email to be passed as command line argument
// Usage: node test-send-email.js your-email@example.com
testSendEmail();
