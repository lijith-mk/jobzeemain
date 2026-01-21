const { sendPasswordResetEmail } = require('./utils/emailService');
require('dotenv').config();

async function testEmailProviders() {
  console.log('🧪 Testing email deliverability across different providers...\n');
  
  const testEmails = [
    // Get email from user input or use defaults
    process.argv[2] || 'test@gmail.com',
    'test@yahoo.com',
    'test@outlook.com',
    'test@hotmail.com'
  ];
  
  console.log('📧 Testing with the following email addresses:');
  testEmails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });
  console.log('');
  
  for (const email of testEmails) {
    console.log(`📤 Sending test email to: ${email}`);
    
    try {
      const result = await sendPasswordResetEmail(email, 'test-token-123', 'user');
      console.log(`✅ Success: ${email} - Message ID: ${result.messageId}`);
    } catch (error) {
      console.log(`❌ Failed: ${email} - Error: ${error.message}`);
    }
    
    // Wait 2 seconds between sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📋 Email Deliverability Tips:');
  console.log('1. 📬 Check INBOX first');
  console.log('2. 🗃️ Check SPAM/JUNK folder');
  console.log('3. 🔍 Search for "JobZee" or "Password Reset"');
  console.log('4. ⏰ Emails may take 1-5 minutes to arrive');
  console.log('5. 📱 Check on both desktop and mobile');
  console.log('');
  
  console.log('🛠️ If emails are not arriving:');
  console.log('• Gmail: Check "All Mail" folder and search');
  console.log('• Outlook: Check "Junk Email" folder');
  console.log('• Yahoo: Check "Spam" folder');
  console.log('• Consider using a different email service for production');
}

// Usage: node test-email-providers.js your-email@example.com
testEmailProviders().catch(console.error);
