const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

/**
 * Blockchain Service for Certificate Registry
 * 
 * Handles all interactions with the CertificateRegistry smart contract on Ethereum Sepolia.
 * Provides functions to register and verify certificates on the blockchain.
 */

// Load environment variables
const ETH_RPC_URL = process.env.ETH_RPC_URL;
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Load contract ABI from compiled artifacts
let contractABI;
try {
  const artifactPath = path.join(__dirname, '../../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    contractABI = artifact.abi;
  } else {
    // Fallback: Define minimal ABI if artifact not found
    contractABI = [
      "function registerCertificate(string certificateId, bytes32 certificateHash) public",
      "function verifyCertificate(string certificateId, bytes32 certificateHash) public view returns (bool)",
      "function getCertificate(string certificateId) public view returns (bytes32 certificateHash, uint256 issuedAt, bool exists)",
      "function certificateExists(string certificateId) public view returns (bool)",
      "event CertificateRegistered(string indexed certificateId, bytes32 indexed certificateHash, uint256 issuedAt)"
    ];
  }
} catch (error) {
  console.error('⚠️  Warning: Could not load contract ABI:', error.message);
  // Use minimal ABI as fallback
  contractABI = [
    "function registerCertificate(string certificateId, bytes32 certificateHash) public",
    "function verifyCertificate(string certificateId, bytes32 certificateHash) public view returns (bool)",
    "function getCertificate(string certificateId) public view returns (bytes32 certificateHash, uint256 issuedAt, bool exists)",
    "function certificateExists(string certificateId) public view returns (bool)",
    "event CertificateRegistered(string indexed certificateId, bytes32 indexed certificateHash, uint256 issuedAt)"
  ];
}

/**
 * Initialize blockchain provider and signer
 * @returns {Object} - Provider, signer, and contract instance
 */
function initializeBlockchain() {
  if (!ETH_RPC_URL) {
    throw new Error('ETH_RPC_URL not configured in environment variables');
  }
  if (!BLOCKCHAIN_PRIVATE_KEY) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY not configured in environment variables');
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not configured in environment variables');
  }

  // Create provider
  const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
  
  // Create wallet/signer
  const wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
  
  return { provider, wallet, contract };
}

/**
 * Convert SHA-256 hash string to bytes32 format for Solidity
 * @param {string} hashString - Hash string (with or without 0x prefix)
 * @returns {string} - Properly formatted bytes32 hash
 */
function hashToBytes32(hashString) {
  // Remove 0x prefix if present
  let hash = hashString.startsWith('0x') ? hashString.slice(2) : hashString;
  
  // Ensure 64 hex characters (32 bytes)
  if (hash.length !== 64) {
    throw new Error(`Invalid hash length: expected 64 hex characters, got ${hash.length}`);
  }
  
  return '0x' + hash;
}

/**
 * Register a certificate on the blockchain
 * @param {string} certificateId - Unique certificate identifier
 * @param {string} certificateHash - SHA-256 hash of certificate data
 * @returns {Promise<Object>} - Transaction result with hash and details
 */
async function registerCertificateOnBlockchain(certificateId, certificateHash) {
  try {
    console.log(`📝 Registering certificate ${certificateId} on blockchain...`);
    
    const { contract, wallet } = initializeBlockchain();
    
    // Convert hash to bytes32 format
    const bytes32Hash = hashToBytes32(certificateHash);
    
    // Call smart contract function
    const tx = await contract.registerCertificate(certificateId, bytes32Hash);
    
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`✅ Certificate registered on blockchain!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    
    // Extract event data
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'CertificateRegistered';
      } catch {
        return false;
      }
    });
    
    let blockchainTimestamp = null;
    if (event) {
      const parsedEvent = contract.interface.parseLog(event);
      blockchainTimestamp = Number(parsedEvent.args.issuedAt);
    }
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      blockchainTimestamp,
      network: 'sepolia',
      explorer: `https://sepolia.etherscan.io/tx/${tx.hash}`
    };
    
  } catch (error) {
    console.error('❌ Blockchain registration failed:', error);
    
    // Provide detailed error info
    let errorMessage = error.message;
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.code || 'BLOCKCHAIN_ERROR'
    };
  }
}

/**
 * Verify a certificate on the blockchain
 * @param {string} certificateId - Certificate identifier to verify
 * @param {string} certificateHash - Expected certificate hash
 * @returns {Promise<Object>} - Verification result
 */
async function verifyCertificateOnBlockchain(certificateId, certificateHash) {
  try {
    console.log(`🔍 Verifying certificate ${certificateId} on blockchain...`);
    
    const { contract } = initializeBlockchain();
    
    // Convert hash to bytes32 format
    const bytes32Hash = hashToBytes32(certificateHash);
    
    // Call smart contract verification function
    const isValid = await contract.verifyCertificate(certificateId, bytes32Hash);
    
    if (isValid) {
      // Get full certificate details
      const [storedHash, issuedAt, exists] = await contract.getCertificate(certificateId);
      
      console.log(`✅ Certificate verified on blockchain!`);
      
      return {
        success: true,
        verified: true,
        exists: exists,
        blockchainHash: storedHash,
        issuedAt: Number(issuedAt),
        issuedAtDate: new Date(Number(issuedAt) * 1000).toISOString()
      };
    } else {
      console.log(`❌ Certificate verification failed - hash mismatch or not found`);
      
      // Check if certificate exists but hash doesn't match
      const exists = await contract.certificateExists(certificateId);
      
      return {
        success: true,
        verified: false,
        exists: exists,
        reason: exists ? 'Hash mismatch - certificate may be tampered' : 'Certificate not found on blockchain'
      };
    }
    
  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    
    return {
      success: false,
      verified: false,
      error: error.message,
      details: error.code || 'BLOCKCHAIN_ERROR'
    };
  }
}

/**
 * Check if blockchain is properly configured
 * @returns {boolean} - True if all required env vars are set
 */
function isBlockchainConfigured() {
  return !!(ETH_RPC_URL && BLOCKCHAIN_PRIVATE_KEY && CONTRACT_ADDRESS);
}

/**
 * Get blockchain configuration status
 * @returns {Object} - Configuration status details
 */
function getBlockchainStatus() {
  return {
    configured: isBlockchainConfigured(),
    hasRpcUrl: !!ETH_RPC_URL,
    hasPrivateKey: !!BLOCKCHAIN_PRIVATE_KEY,
    hasContractAddress: !!CONTRACT_ADDRESS,
    network: CONTRACT_ADDRESS ? 'sepolia' : null,
    explorer: CONTRACT_ADDRESS ? `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}` : null
  };
}

/**
 * Test blockchain connection
 * @returns {Promise<Object>} - Connection test result
 */
async function testBlockchainConnection() {
  try {
    const { provider, wallet, contract } = initializeBlockchain();
    
    // Test provider connection
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    // Test wallet balance
    const balance = await provider.getBalance(wallet.address);
    
    // Test contract connectivity
    const owner = await contract.owner();
    
    return {
      success: true,
      connected: true,
      network: {
        name: network.name,
        chainId: Number(network.chainId)
      },
      blockNumber: blockNumber,
      wallet: {
        address: wallet.address,
        balance: ethers.formatEther(balance),
        hasBalance: balance > 0n
      },
      contract: {
        address: CONTRACT_ADDRESS,
        owner: owner
      }
    };
    
  } catch (error) {
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  registerCertificateOnBlockchain,
  verifyCertificateOnBlockchain,
  isBlockchainConfigured,
  getBlockchainStatus,
  testBlockchainConnection,
  hashToBytes32
};
