const nodemailer = require('nodemailer');
require('dotenv').config();

async function detailedEmailTest() {
  console.log('🔧 Testing email configuration with detailed logging...\n');
  
  // Create transporter with debug logging
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Enable debug logging
    logger: true // Enable logger
  });

  console.log('📧 Email Configuration:');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);
  console.log('User:', process.env.EMAIL_USER);
  console.log('From:', process.env.EMAIL_FROM);
  console.log('');

  // Test connection first
  console.log('🔌 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return;
  }

  // Send test email
  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  console.log(`📤 Sending test email to: ${testEmail}`);
  
  const mailOptions = {
    from: `"JobZee Password Reset" <${process.env.EMAIL_FROM}>`,
    to: testEmail,
    subject: 'TEST - JobZee Password Reset',
    html: `
      <h2>Test Email - JobZee Password Reset</h2>
      <p>This is a test email to verify the password reset functionality is working.</p>
      <p><strong>Reset Link:</strong> <a href="http://localhost:3000/reset-password/test-token">Click here to reset password</a></p>
      <p>If you can see this email, the email service is working correctly!</p>
      <p>Time sent: ${new Date().toISOString()}</p>
    `,
    text: `
      Test Email - JobZee Password Reset
      
      This is a test email to verify the password reset functionality is working.
      Reset Link: http://localhost:3000/reset-password/test-token
      
      If you can see this email, the email service is working correctly!
      Time sent: ${new Date().toISOString()}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('\n📋 Next steps:');
    console.log('1. Check your inbox for the test email');
    console.log('2. Check your spam/junk folder if not found');
    console.log('3. If using Gmail, check "All Mail" folder');
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
  }
}

console.log('🚀 Starting detailed email test...\n');
detailedEmailTest();
