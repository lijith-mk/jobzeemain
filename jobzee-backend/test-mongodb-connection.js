require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  console.log('Connection String:', process.env.MONGODB_URI);
  
  try {
    console.log('⏳ Connecting...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('✅ CONNECTION SUCCESSFUL!\n');
    
    // Test database access
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    const status = await adminDb.ping();
    
    console.log('Database ping:', status);
    console.log('Connected to:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log('\n✅ All checks passed! Ready to run ML scripts.\n');
    console.log('Next command:');
    console.log('npm run ml:generate-synthetic -- --count=100 --onchain=false --logs-min=3 --logs-max=8');
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect ENOTFOUND')) {
      console.error('\n📋 This means MongoDB Atlas is blocking your IP.');
      console.error('');
      console.error('FIX:');
      console.error('1. Go to: https://cloud.mongodb.com');
      console.error('2. Click "Network Access" (left sidebar)');
      console.error('3. Click "Add IP Address"');
      console.error('4. Choose "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('5. Click "Confirm"');
      console.error('6. Wait 2 minutes');
      console.error('7. Run this test again');
    }
    
    process.exit(1);
  }
}

testConnection();
