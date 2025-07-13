const { ethers } = require("ethers")
const logger = require("../utils/logger")

class BlockchainConfig {
  constructor() {
    this.provider = null
    this.wallet = null
    this.creditScoreContract = null
    this.userIdentityContract = null
    this.initialize()
  }

  initialize() {
    try {
      // Initialize Infura provider (ethers v5 syntax)
      const infuraUrl = `https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      this.provider = new ethers.providers.JsonRpcProvider(infuraUrl)

      // Initialize server wallet
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)

      // Contract ABIs (simplified for this implementation)
      const creditScoreABI = [
        "function updateCreditScore(address userAddress, uint256 score, bytes32 dataHash, string memory ipfsHash) external",
        "function getCreditHistory(address userAddress) external view returns (tuple(uint256 score, bytes32 dataHash, uint256 timestamp, string ipfsHash)[])",
        "event CreditScoreUpdated(address indexed userAddress, uint256 creditScore, bytes32 dataHash, uint256 timestamp, string ipfsHash)",
      ]

      const userIdentityABI = [
        "function registerUser(address associatedAddress, bytes32 panHash, bytes32 aadhaarHash) external",
        "function isUserRegistered(address userAddress) external view returns (bool)",
        "event UserRegistered(address indexed associatedAddress, bytes32 indexed panHash, bytes32 indexed aadhaarHash)",
      ]

      // Initialize contracts
      this.creditScoreContract = new ethers.Contract(process.env.CONTRACT_ADDRESS_CREDIT, creditScoreABI, this.wallet)
      
      if (process.env.CONTRACT_ADDRESS_IDENTITY) {
        this.userIdentityContract = new ethers.Contract(
          process.env.CONTRACT_ADDRESS_IDENTITY,
          userIdentityABI,
          this.wallet,
        )
      }

      logger.info("Blockchain configuration initialized successfully")
    } catch (error) {
      logger.error("Blockchain configuration error:", error)
      throw error
    }
  }

  async getGasPrice() {
    try {
      const gasPrice = await this.provider.getGasPrice()
      return gasPrice
    } catch (error) {
      logger.error("Error getting gas price:", error)
      return ethers.utils.parseUnits("20", "gwei") // fallback gas price
    }
  }

  async estimateGas(contract, method, params) {
    try {
      return await contract.estimateGas[method](...params)
    } catch (error) {
      logger.error("Error estimating gas:", error)
      return 300000 // fallback gas limit
    }
  }
}

module.exports = new BlockchainConfig()