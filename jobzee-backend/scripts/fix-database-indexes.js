const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabaseIndexes() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check current indexes on employers collection
    console.log('📊 Checking current indexes on employers collection...');
    const indexes = await db.collection('employers').indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Remove the conflicting 'email_1' index if it exists
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    if (emailIndex) {
      console.log('🗑️  Removing conflicting email_1 index...');
      await db.collection('employers').dropIndex('email_1');
      console.log('✅ Removed email_1 index');
    } else {
      console.log('ℹ️  No conflicting email_1 index found');
    }
    
    // Check if there are any documents with null email fields that might be causing issues
    console.log('🔍 Checking for documents with null email fields...');
    const nullEmailDocs = await db.collection('employers').find({ email: null }).toArray();
    if (nullEmailDocs.length > 0) {
      console.log(`⚠️  Found ${nullEmailDocs.length} documents with null email field`);
      console.log('These documents might be causing index conflicts');
      
      // Optionally clean up these documents
      console.log('🧹 Cleaning up documents with null email fields...');
      await db.collection('employers').deleteMany({ email: null });
      console.log('✅ Cleaned up null email documents');
    }
    
    // Ensure the correct indexes exist
    console.log('🔧 Ensuring correct indexes exist...');
    
    // Drop all existing indexes first
    await db.collection('employers').dropIndexes();
    console.log('✅ Dropped all existing indexes');
    
    // Create the correct indexes
    await db.collection('employers').createIndex({ companyEmail: 1 }, { unique: true });
    await db.collection('employers').createIndex({ companyName: 'text', industry: 'text', 'headquarters.city': 'text' });
    
    console.log('✅ Created correct indexes');
    
    // Verify the new indexes
    const newIndexes = await db.collection('employers').indexes();
    console.log('New indexes:', newIndexes.map(idx => idx.name));
    
    console.log('🎉 Database index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
}

// Run the fix if called directly
if (require.main === module) {
  fixDatabaseIndexes();
}

module.exports = { fixDatabaseIndexes };
