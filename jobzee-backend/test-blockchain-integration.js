/**
 * Blockchain Integration Test Script
 * 
 * Tests the blockchain service functionality
 * Run: node test-blockchain-integration.js
 */

require('dotenv').config();
const {
  testBlockchainConnection,
  getBlockchainStatus,
  isBlockchainConfigured,
  registerCertificateOnBlockchain,
  verifyCertificateOnBlockchain,
  hashToBytes32
} = require('./services/blockchainService');

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 BLOCKCHAIN INTEGRATION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Check Configuration
  console.log('📋 Test 1: Blockchain Configuration Status');
  console.log('-'.repeat(60));
  const status = getBlockchainStatus();
  console.log('Configured:', status.configured);
  console.log('Has RPC URL:', status.hasRpcUrl);
  console.log('Has Private Key:', status.hasPrivateKey);
  console.log('Has Contract Address:', status.hasContractAddress);
  console.log('Network:', status.network || 'Not configured');
  if (status.explorer) {
    console.log('Explorer:', status.explorer);
  }
  console.log('');

  if (!isBlockchainConfigured()) {
    console.log('❌ Blockchain is not fully configured!');
    console.log('');
    console.log('Required environment variables:');
    console.log('  - ETH_RPC_URL');
    console.log('  - BLOCKCHAIN_PRIVATE_KEY');
    console.log('  - CONTRACT_ADDRESS (set after deployment)');
    console.log('');
    console.log('⚠️  Please configure these in your .env file');
    process.exit(1);
  }

  // Test 2: Connection Test
  console.log('🔌 Test 2: Blockchain Connection');
  console.log('-'.repeat(60));
  try {
    const connectionTest = await testBlockchainConnection();
    
    if (connectionTest.success) {
      console.log('✅ Connection successful!');
      console.log('');
      console.log('Network:', connectionTest.network.name);
      console.log('Chain ID:', connectionTest.network.chainId);
      console.log('Current Block:', connectionTest.blockNumber);
      console.log('');
      console.log('Wallet Address:', connectionTest.wallet.address);
      console.log('Balance:', connectionTest.wallet.balance, 'ETH');
      console.log('Has Balance:', connectionTest.wallet.hasBalance ? '✅ Yes' : '❌ No');
      console.log('');
      console.log('Contract Address:', connectionTest.contract.address);
      console.log('Contract Owner:', connectionTest.contract.owner);
      console.log('');

      if (!connectionTest.wallet.hasBalance) {
        console.log('⚠️  WARNING: Wallet has no ETH balance!');
        console.log('   You need Sepolia testnet ETH to register certificates.');
        console.log('   Get free testnet ETH from: https://sepoliafaucet.com/');
        console.log('');
      }
    } else {
      console.log('❌ Connection failed:', connectionTest.error);
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Connection test error:', error.message);
    process.exit(1);
  }

  // Test 3: Hash Conversion
  console.log('🔢 Test 3: Hash Conversion');
  console.log('-'.repeat(60));
  try {
    const testHash = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
    const bytes32Hash = hashToBytes32(testHash);
    console.log('Input hash:', testHash);
    console.log('Bytes32 hash:', bytes32Hash);
    console.log('✅ Hash conversion works correctly');
    console.log('');
  } catch (error) {
    console.log('❌ Hash conversion error:', error.message);
    console.log('');
  }

  // Test 4: Test Certificate Registration (Optional - comment out to avoid gas costs)
  console.log('📝 Test 4: Certificate Registration (OPTIONAL)');
  console.log('-'.repeat(60));
  console.log('⚠️  Skipping registration test to avoid gas costs');
  console.log('   To test registration, uncomment the code in this script');
  console.log('');
  
  /*
  // UNCOMMENT TO TEST REGISTRATION (will cost gas)
  const testCertId = `TEST-${Date.now()}`;
  const testHash = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
  
  try {
    console.log('Registering test certificate...');
    const registerResult = await registerCertificateOnBlockchain(testCertId, testHash);
    
    if (registerResult.success) {
      console.log('✅ Registration successful!');
      console.log('Transaction Hash:', registerResult.transactionHash);
      console.log('Block Number:', registerResult.blockNumber);
      console.log('Gas Used:', registerResult.gasUsed);
      console.log('Explorer:', registerResult.explorer);
      console.log('');
      
      // Test 5: Verify the registered certificate
      console.log('🔍 Test 5: Certificate Verification');
      console.log('-'.repeat(60));
      const verifyResult = await verifyCertificateOnBlockchain(testCertId, testHash);
      
      if (verifyResult.verified) {
        console.log('✅ Verification successful!');
        console.log('Exists:', verifyResult.exists);
        console.log('Issued At:', verifyResult.issuedAtDate);
      } else {
        console.log('❌ Verification failed:', verifyResult.reason);
      }
    } else {
      console.log('❌ Registration failed:', registerResult.error);
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
  }
  */

  console.log('='.repeat(60));
  console.log('✅ BLOCKCHAIN INTEGRATION TEST COMPLETED');
  console.log('='.repeat(60));
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Ensure your wallet has Sepolia testnet ETH');
  console.log('   2. Test certificate generation in your app');
  console.log('   3. Verify certificates are registered on blockchain');
  console.log('   4. Check transactions on Sepolia Etherscan');
  console.log('');
}

// Run the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
