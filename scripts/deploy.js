const hre = require("hardhat");

/**
 * Deployment script for CertificateRegistry smart contract
 * 
 * This script deploys the CertificateRegistry contract to the configured network.
 * 
 * Usage:
 * - Local: npx hardhat run scripts/deploy.js
 * - Sepolia: npx hardhat run scripts/deploy.js --network sepolia
 */

async function main() {
  const { ethers } = hre;
  console.log("🚀 Starting CertificateRegistry deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get the contract factory
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  
  console.log("⏳ Deploying CertificateRegistry contract...");

  // Deploy the contract
  const certificate = await CertificateRegistry.deploy();
  
  // Wait for deployment to complete
  await certificate.waitForDeployment();
  
  const contractAddress = await certificate.getAddress();

  console.log("\n✅ CertificateRegistry deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Owner address:", deployer.address);

  // Verify deployment by getting contract owner
  const owner = await certificate.owner();
  console.log("✓ Verified: Contract owner is:", owner);

  console.log("\n📋 IMPORTANT - Save these details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address: ", contractAddress);
  console.log("Network:          ", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:         ", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:         ", deployer.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n📝 Next Steps:");
  console.log("1. Add CONTRACT_ADDRESS to your backend .env file:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. Verify contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("\n3. Test the contract:");
  console.log("   - Register a certificate");
  console.log("   - Verify a certificate");
  console.log("   - Check on Sepolia Etherscan\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
