/**
 * Quick Test: Register a Certificate on Blockchain
 * Run: node test-register-certificate.js
 */

require('dotenv').config();
const {
  registerCertificateOnBlockchain,
  verifyCertificateOnBlockchain
} = require('./services/blockchainService');

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 QUICK CERTIFICATE REGISTRATION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test certificate data
  const testCertificateId = `TEST-CERT-${Date.now()}`;
  const testHash = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
  
  console.log('📋 Test Certificate Details:');
  console.log('   Certificate ID:', testCertificateId);
  console.log('   Certificate Hash:', testHash);
  console.log('');

  // Step 1: Register on blockchain
  console.log('📝 Step 1: Registering certificate on blockchain...');
  console.log('-'.repeat(60));
  
  try {
    const registerResult = await registerCertificateOnBlockchain(
      testCertificateId,
      testHash
    );
    
    if (registerResult.success) {
      console.log('✅ REGISTRATION SUCCESSFUL!');
      console.log('');
      console.log('📊 Transaction Details:');
      console.log('   Transaction Hash:', registerResult.transactionHash);
      console.log('   Block Number:', registerResult.blockNumber);
      console.log('   Gas Used:', registerResult.gasUsed);
      console.log('   Network:', registerResult.network);
      console.log('');
      console.log('🔗 View Transaction on Etherscan:');
      console.log('   ', registerResult.explorer);
      console.log('');

      // Wait a moment for transaction to be confirmed
      console.log('⏳ Waiting 3 seconds for blockchain confirmation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('');

      // Step 2: Verify the certificate
      console.log('🔍 Step 2: Verifying certificate on blockchain...');
      console.log('-'.repeat(60));
      
      const verifyResult = await verifyCertificateOnBlockchain(
        testCertificateId,
        testHash
      );
      
      if (verifyResult.verified) {
        console.log('✅ VERIFICATION SUCCESSFUL!');
        console.log('');
        console.log('📊 Certificate Details:');
        console.log('   Exists:', verifyResult.exists);
        console.log('   Verified:', verifyResult.verified);
        console.log('   Issued At:', verifyResult.issuedAtDate);
        console.log('');
      } else {
        console.log('❌ Verification failed:', verifyResult.reason);
        console.log('');
      }

      // Step 3: How to verify on Etherscan
      console.log('='.repeat(60));
      console.log('🎯 NOW TEST ON ETHERSCAN:');
      console.log('='.repeat(60));
      console.log('');
      console.log('1. Go to Read Contract tab:');
      console.log('   https://sepolia.etherscan.io/address/0xB86a68e802c30CF6B193ef580D2D857dC81BFF97#readContract');
      console.log('');
      console.log('2. Use function "4. certificateExists"');
      console.log('   Enter this certificate ID:');
      console.log('   ' + testCertificateId);
      console.log('');
      console.log('3. Click "Query" - should return: true');
      console.log('');
      console.log('4. Try function "2. getCertificate"');
      console.log('   Enter same certificate ID');
      console.log('   Should show hash and timestamp');
      console.log('');
      console.log('5. Try function "5. verifyCertificate"');
      console.log('   certificateId (string):', testCertificateId);
      console.log('   certificateHash (bytes32): 0x' + testHash);
      console.log('   Should return: true');
      console.log('');
      
    } else {
      console.log('❌ REGISTRATION FAILED!');
      console.log('Error:', registerResult.error);
      console.log('');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✅ TEST COMPLETED');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
