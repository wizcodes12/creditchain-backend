const blockchainService = require("../services/blockchainService")
const ipfsService = require("../services/ipfsService")
const CreditScoreResult = require("../models/CreditScoreResult")
const User = require("../models/User")
const logger = require("../utils/logger")
const CONSTANTS = require("../utils/constants")

class BlockchainController {
  // POST /api/blockchain/verify
  async verifyTransaction(req, res) {
    try {
      const { userId, transactionHash } = req.body

      // Check if user is verifying their own transaction
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only verify your own transactions",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Verifying blockchain transaction", {
        userId,
        transactionHash: transactionHash.substring(0, 10) + "...",
      })

      // Verify transaction on blockchain
      const verification = await blockchainService.verifyTransaction(transactionHash)

      // Find associated credit score result
      const creditRecord = await CreditScoreResult.findOne({
        userId,
        blockchainHash: transactionHash,
      })

      let ipfsData = null
      if (creditRecord && creditRecord.ipfsHash) {
        try {
          ipfsData = await ipfsService.retrieveData(creditRecord.ipfsHash)
        } catch (ipfsError) {
          logger.warn("Failed to retrieve IPFS data:", ipfsError)
        }
      }

      logger.info("Blockchain transaction verified", {
        userId,
        isValid: verification.isValid,
        blockNumber: verification.blockNumber,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        verification: {
          isValid: verification.isValid,
          blockNumber: verification.blockNumber,
          timestamp: verification.timestamp,
          gasUsed: verification.gasUsed,
          etherscanUrl: verification.etherscanUrl,
        },
        creditRecord: creditRecord
          ? {
              creditScore: creditRecord.creditScore,
              riskLevel: creditRecord.riskLevel,
              generatedAt: creditRecord.generatedAt,
              ipfsHash: creditRecord.ipfsHash,
              ipfsUrl: creditRecord.ipfsHash ? `https://ipfs.io/ipfs/${creditRecord.ipfsHash}` : null,
            }
          : null,
        ipfsData: ipfsData ? ipfsData.metadata : null,
      })
    } catch (error) {
      logger.error("Verify transaction error:", error)
      throw error
    }
  }

  // GET /api/blockchain/history/:walletAddress
  async getBlockchainHistory(req, res) {
    try {
      const { walletAddress } = req.params

      // Find user by wallet address
      const user = await User.findOne({ walletAddress })

      if (!user) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
            message: "User not found",
            details: "No user found with the provided wallet address",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Check if user is accessing their own history
      if (req.user._id.toString() !== user._id.toString()) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own blockchain history",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Fetching blockchain history", { walletAddress, userId: user._id })

      // Get credit history from blockchain
      const creditHistory = await blockchainService.getCreditHistory(walletAddress)

      // Enrich with database information
      const enrichedHistory = await Promise.all(
        creditHistory.map(async (record) => {
          const creditResult = await CreditScoreResult.findOne({
            userId: user._id,
            blockchainHash: record.transactionHash,
          })

          return {
            score: record.score,
            timestamp: record.timestamp,
            date: new Date(record.timestamp * 1000),
            dataHash: record.dataHash,
            ipfsHash: record.ipfsHash,
            blockNumber: record.blockNumber,
            transactionHash: record.transactionHash,
            etherscanUrl: record.etherscanUrl,
            ipfsUrl: record.ipfsHash ? `https://ipfs.io/ipfs/${record.ipfsHash}` : null,
            riskLevel: creditResult?.riskLevel || null,
            riskCategory: creditResult?.riskCategory || null,
          }
        }),
      )

      logger.info("Blockchain history retrieved", {
        walletAddress,
        recordCount: enrichedHistory.length,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        walletAddress,
        creditHistory: enrichedHistory,
        count: enrichedHistory.length,
      })
    } catch (error) {
      logger.error("Get blockchain history error:", error)
      throw error
    }
  }

  // GET /api/blockchain/status
  async getBlockchainStatus(req, res) {
    try {
      logger.info("Checking blockchain status")

      // Get current block number
      const blockNumber = await blockchainService.config.provider.getBlockNumber()

      // Get network information
      const network = await blockchainService.config.provider.getNetwork()

      // Get gas price
      const gasPrice = await blockchainService.config.getGasPrice()

      // Check wallet balance
      const balance = await blockchainService.config.provider.getBalance(blockchainService.config.wallet.address)

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        blockchain: {
          network: network.name,
          chainId: Number(network.chainId),
          currentBlock: blockNumber,
          gasPrice: gasPrice.toString(),
          walletAddress: blockchainService.config.wallet.address,
          walletBalance: balance.toString(),
          contractAddresses: {
            creditScore: process.env.CONTRACT_ADDRESS_CREDIT,
            userIdentity: process.env.CONTRACT_ADDRESS_IDENTITY,
          },
        },
        status: "connected",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("Get blockchain status error:", error)

      res.status(CONSTANTS.HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: "BLOCKCHAIN_UNAVAILABLE",
          message: "Blockchain service unavailable",
          details: "Unable to connect to blockchain network",
          timestamp: new Date().toISOString(),
        },
        blockchain: {
          status: "disconnected",
          error: error.message,
        },
      })
    }
  }

  // POST /api/blockchain/register-user
  async registerUser(req, res) {
    try {
      const userId = req.user._id
      const user = req.user

      if (!user.walletAddress) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: "WALLET_ADDRESS_MISSING",
            message: "Wallet address not found",
            details: "Please complete profile generation first",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Registering user on blockchain", {
        userId,
        walletAddress: user.walletAddress,
      })

      // Register user on blockchain
      const registrationResult = await blockchainService.registerUser(
        user.walletAddress,
        user.panHash,
        user.aadhaarHash,
      )

      if (registrationResult) {
        logger.info("User registered on blockchain", {
          userId,
          transactionHash: registrationResult.transactionHash,
        })

        res.status(CONSTANTS.HTTP_STATUS.OK).json({
          success: true,
          message: "User registered on blockchain successfully",
          registration: {
            transactionHash: registrationResult.transactionHash,
            blockNumber: registrationResult.blockNumber,
            etherscanUrl: registrationResult.etherscanUrl,
            walletAddress: user.walletAddress,
          },
        })
      } else {
        res.status(CONSTANTS.HTTP_STATUS.OK).json({
          success: true,
          message: "User identity contract not available",
          registration: null,
        })
      }
    } catch (error) {
      logger.error("Register user error:", error)
      throw error
    }
  }

  // GET /api/blockchain/ipfs/:ipfsHash
  async getIpfsData(req, res) {
    try {
      const { ipfsHash } = req.params

      logger.info("Retrieving IPFS data", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
      })

      // Verify that the requesting user has access to this IPFS data
      const creditResult = await CreditScoreResult.findOne({
        ipfsHash,
        userId: req.user._id,
      })

      if (!creditResult) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You don't have access to this IPFS data",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Retrieve data from IPFS
      const ipfsData = await ipfsService.retrieveData(ipfsHash)

      logger.info("IPFS data retrieved", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
        userId: req.user._id,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        ipfsHash,
        gatewayUrl: ipfsService.generateGatewayUrl(ipfsHash),
        data: ipfsData,
        retrievedAt: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("Get IPFS data error:", error)
      throw error
    }
  }
}

module.exports = new BlockchainController()
