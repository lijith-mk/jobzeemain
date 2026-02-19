/**
 * Check for certificates that need blockchain registration
 * Run: node check-unregistered-certificates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('🔍 CHECKING FOR UNREGISTERED CERTIFICATES');
    console.log('='.repeat(60));
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Count total certificates
    const totalCerts = await Certificate.countDocuments();
    console.log('📊 Total Certificates:', totalCerts);

    // Count certificates WITH blockchain registration
    const registeredCerts = await Certificate.countDocuments({
      blockchainTxHash: { $ne: null }
    });
    console.log('✅ Registered on Blockchain:', registeredCerts);

    // Count certificates WITHOUT blockchain registration
    const unregisteredCerts = await Certificate.countDocuments({
      blockchainTxHash: null
    });
    console.log('❌ NOT Registered on Blockchain:', unregisteredCerts);
    console.log('');

    if (unregisteredCerts > 0) {
      console.log('📋 Unregistered Certificate Details:');
      console.log('-'.repeat(60));
      
      const unregistered = await Certificate.find({
        blockchainTxHash: null
      })
        .select('certificateId userName courseName issuedAt certificateHash')
        .limit(10)
        .sort({ issuedAt: -1 });

      unregistered.forEach((cert, index) => {
        console.log(`\n${index + 1}. Certificate ID: ${cert.certificateId}`);
        console.log(`   User: ${cert.userName}`);
        console.log(`   Course: ${cert.courseName}`);
        console.log(`   Issued: ${cert.issuedAt.toISOString()}`);
        console.log(`   Has Hash: ${cert.certificateHash ? '✅ Yes' : '❌ No'}`);
      });

      if (unregisteredCerts > 10) {
        console.log(`\n... and ${unregisteredCerts - 10} more`);
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('💡 RECOMMENDATION:');
      console.log('='.repeat(60));
      console.log('');
      console.log('You have', unregisteredCerts, 'certificates that need blockchain registration.');
      console.log('');
      console.log('Options:');
      console.log('  1. Run the bulk registration script (recommended)');
      console.log('     node register-old-certificates.js');
      console.log('');
      console.log('  2. Leave old certificates as-is');
      console.log('     All NEW certificates will be auto-registered');
      console.log('');
    } else {
      console.log('='.repeat(60));
      console.log('✅ ALL CERTIFICATES ARE REGISTERED!');
      console.log('='.repeat(60));
      console.log('');
      console.log('All new certificates will be automatically registered on blockchain.');
    }

    await mongoose.disconnect();
    console.log('');
    console.log('✅ Done');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
