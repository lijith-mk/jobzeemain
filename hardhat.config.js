require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Hardhat Configuration for Jobzee Certificate Registry
 * 
 * This configuration enables deployment of the CertificateRegistry smart contract
 * to Ethereum Sepolia testnet.
 */

/**
 * Load environment variables
 * Required variables in .env:
 * - ETH_RPC_URL: Sepolia RPC endpoint (e.g., from Infura or Alchemy)
 * - BLOCKCHAIN_PRIVATE_KEY: Private key of the deployer wallet (without 0x prefix)
 */
const ETH_RPC_URL = process.env.ETH_RPC_URL || "";
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";

// Validate that required environment variables are set
if (!ETH_RPC_URL) {
  console.warn("⚠️  Warning: ETH_RPC_URL is not set in .env file");
}
if (!BLOCKCHAIN_PRIVATE_KEY) {
  console.warn("⚠️  Warning: BLOCKCHAIN_PRIVATE_KEY is not set in .env file");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  /**
   * Solidity Compiler Configuration
   * Using version 0.8.20 to match CertificateRegistry.sol requirements
   */
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for how many times the code will be executed
      },
    },
  },

  /**
   * Network Configuration
   * Defines the networks where contracts can be deployed
   */
  networks: {
    /**
     * Hardhat local network (default)
     * Used for testing and development
     */
    hardhat: {
      chainId: 31337,
    },

    /**
     * Ethereum Sepolia Testnet
     * Public testnet for Ethereum - use for staging/production testing
     * Get testnet ETH from: https://sepoliafaucet.com/
     */
    sepolia: {
      url: ETH_RPC_URL,
      accounts: BLOCKCHAIN_PRIVATE_KEY ? [BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 11155111, // Sepolia chain ID
      gasPrice: "auto", // Automatically calculate gas price
      gas: "auto", // Automatically estimate gas limit
    },
  },

  /**
   * Path Configuration
   * Defines where Hardhat looks for contracts, artifacts, etc.
   */
  paths: {
    sources: "./contracts", // Solidity source files
    tests: "./test", // Test files
    cache: "./cache", // Hardhat cache
    artifacts: "./artifacts", // Compiled contract artifacts
  },

  /**
   * Etherscan Configuration (Optional)
   * Uncomment and add ETHERSCAN_API_KEY to .env for contract verification
   */
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY || "",
  // },

  /**
   * Gas Reporter Configuration (Optional)
   * Uncomment to see gas usage reports during testing
   */
  // gasReporter: {
  //   enabled: true,
  //   currency: "USD",
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  // },
};
