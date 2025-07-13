const { ethers } = require("ethers")
const crypto = require("crypto")
const blockchainConfig = require("../config/blockchain")
const logger = require("../utils/logger")

class BlockchainService {
  constructor() {
    this.config = blockchainConfig
  }

  generateDataHash(data) {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex")
  }

  async updateCreditScore(userAddress, creditScore, dataHash, ipfsHash) {
    try {
      logger.info("Updating credit score on blockchain", {
        userAddress,
        creditScore,
        dataHash: dataHash.substring(0, 10) + "...",
      })

      const gasPrice = await this.config.getGasPrice()
      const gasLimit = await this.config.estimateGas(this.config.creditScoreContract, "updateCreditScore", [
        userAddress,
        creditScore,
        `0x${dataHash}`,
        ipfsHash,
      ])

      const tx = await this.config.creditScoreContract.updateCreditScore(
        userAddress,
        creditScore,
        `0x${dataHash}`,
        ipfsHash,
        {
          gasPrice,
          gasLimit,
        },
      )

      logger.info("Credit score transaction sent", {
        txHash: tx.hash,
        userAddress,
        creditScore,
      })

      const receipt = await tx.wait()

      logger.info("Credit score transaction confirmed", {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      })

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        etherscanUrl: `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${receipt.hash}`,
      }
    } catch (error) {
      logger.error("Blockchain update error:", error)
      throw new Error(`Blockchain update failed: ${error.message}`)
    }
  }

  async getCreditHistory(userAddress) {
    try {
      logger.info("Fetching credit history from blockchain", { userAddress })

      const history = await this.config.creditScoreContract.getCreditHistory(userAddress)

      const formattedHistory = history.map((record) => ({
        score: Number.parseInt(record.score.toString()),
        dataHash: record.dataHash,
        timestamp: Number.parseInt(record.timestamp.toString()),
        ipfsHash: record.ipfsHash,
        etherscanUrl: `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${record.transactionHash}`,
      }))

      logger.info("Credit history retrieved", {
        userAddress,
        recordCount: formattedHistory.length,
      })

      return formattedHistory
    } catch (error) {
      logger.error("Error fetching credit history:", error)
      throw new Error(`Failed to fetch credit history: ${error.message}`)
    }
  }

  async registerUser(userAddress, panHash, aadhaarHash) {
    try {
      if (!this.config.userIdentityContract) {
        logger.warn("User identity contract not configured")
        return null
      }

      logger.info("Registering user on blockchain", { userAddress })

      const gasPrice = await this.config.getGasPrice()
      const gasLimit = await this.config.estimateGas(this.config.userIdentityContract, "registerUser", [
        userAddress,
        `0x${panHash}`,
        `0x${aadhaarHash}`,
      ])

      const tx = await this.config.userIdentityContract.registerUser(userAddress, `0x${panHash}`, `0x${aadhaarHash}`, {
        gasPrice,
        gasLimit,
      })

      const receipt = await tx.wait()

      logger.info("User registration transaction confirmed", {
        txHash: receipt.hash,
        userAddress,
      })

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        etherscanUrl: `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${receipt.hash}`,
      }
    } catch (error) {
      logger.error("User registration error:", error)
      throw new Error(`User registration failed: ${error.message}`)
    }
  }

  async isUserRegistered(userAddress) {
    try {
      if (!this.config.userIdentityContract) {
        return false
      }

      const isRegistered = await this.config.userIdentityContract.isUserRegistered(userAddress)
      return isRegistered
    } catch (error) {
      logger.error("Error checking user registration:", error)
      return false
    }
  }

  async verifyTransaction(transactionHash) {
    try {
      logger.info("Verifying blockchain transaction", { transactionHash })

      const receipt = await this.config.provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        throw new Error("Transaction not found")
      }

      const block = await this.config.provider.getBlock(receipt.blockNumber)

      return {
        isValid: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp,
        gasUsed: receipt.gasUsed.toString(),
        etherscanUrl: `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${transactionHash}`,
      }
    } catch (error) {
      logger.error("Transaction verification error:", error)
      throw new Error(`Transaction verification failed: ${error.message}`)
    }
  }

  generateWalletAddress() {
    // Generate a deterministic wallet address based on user data
    // In production, you might want to use a more sophisticated approach
    const wallet = ethers.Wallet.createRandom()
    return wallet.address
  }
}

module.exports = new BlockchainService()
