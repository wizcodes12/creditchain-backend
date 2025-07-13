const User = require("../models/User")
const FinancialProfile = require("../models/FinancialProfile")
const Transaction = require("../models/Transaction")
const CreditScoreResult = require("../models/CreditScoreResult")
const aiModelService = require("../services/aiModelService")
const blockchainService = require("../services/blockchainService")
const ipfsService = require("../services/ipfsService")
const dummyDataService = require("../services/dummyDataService")
const logger = require("../utils/logger")
const CryptoUtils = require("../utils/crypto")
const CONSTANTS = require("../utils/constants")

class CreditScoreController {
  // POST /api/credit-score/calculate/:userId
  async calculateCreditScore(req, res) {
    try {
      const { userId } = req.params

      // Check if user is calculating their own credit score
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only calculate your own credit score",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Starting credit score calculation", { userId })

      // Get user and financial profile
      const user = await User.findById(userId)
      const financialProfile = await FinancialProfile.findOne({ userId })

      if (!user || !financialProfile) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
            message: "User or financial profile not found",
            details: "Please complete profile generation first",
            timestamp: new Date().toISOString(),
          },
        })
      }

      if (!user.isVerified) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_VERIFIED,
            message: "User not verified",
            details: "Please complete profile verification first",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Get transactions
      const transactions = await Transaction.find({ userId }).sort({ date: -1 })

      if (transactions.length < 10) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.INSUFFICIENT_TRANSACTION_DATA,
            message: "Insufficient transaction data",
            details: "At least 10 transactions are required for credit score calculation",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Calculate transaction metrics
      const transactionMetrics = dummyDataService.calculateTransactionMetrics(transactions)

      // Call credit scoring model
      const creditScoreResult = await aiModelService.calculateCreditScore(financialProfile, transactionMetrics)

      // Process anomaly detection for each transaction
      const anomalyResults = await this.processAnomalyDetection(transactions, financialProfile)

      // Calculate overall anomaly metrics
      const overallAnomalyMetrics = this.calculateOverallAnomalyMetrics(anomalyResults)

      // Prepare complete credit score result
      const completeResult = {
        userId,
        creditScore: creditScoreResult.creditScore,
        confidenceScore: creditScoreResult.confidenceScore,
        riskLevel: creditScoreResult.riskLevel,
        riskCategory: creditScoreResult.riskCategory,
        scoreBreakdown: creditScoreResult.scoreBreakdown,
        recommendations: creditScoreResult.recommendations,
        improvementTips: creditScoreResult.improvementTips,
        transactionAnomalies: anomalyResults,
        overallAnomalyMetrics,
      }

      // Store result in database
      const creditScoreDoc = new CreditScoreResult(completeResult)
      await creditScoreDoc.save()

      // Prepare data for IPFS storage
      const ipfsData = {
        userId,
        creditScoreResult: completeResult,
        metadata: {
          generatedAt: new Date(),
          modelVersion: "1.0.0",
          dataIntegrityHash: CryptoUtils.generateDataIntegrityHash(completeResult),
        },
      }

      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadData(ipfsData)
      const dataHash = CryptoUtils.generateDataIntegrityHash(completeResult)

      // Update blockchain
      let blockchainResult = null
      try {
        blockchainResult = await blockchainService.updateCreditScore(
          user.walletAddress,
          creditScoreResult.creditScore,
          dataHash,
          ipfsResult.ipfsHash,
        )

        // Update database with blockchain and IPFS hashes
        creditScoreDoc.blockchainHash = blockchainResult.transactionHash
        creditScoreDoc.ipfsHash = ipfsResult.ipfsHash
        await creditScoreDoc.save()
      } catch (blockchainError) {
        logger.error("Blockchain update failed:", blockchainError)
        // Continue without blockchain update
      }

      // Generate verification links
      const verificationLinks = {
        etherscanUrl: blockchainResult
          ? `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${blockchainResult.transactionHash}`
          : null,
        ipfsReportUrl: ipfsResult.gatewayUrl,
        dataIntegrityHash: dataHash,
      }

      logger.info("Credit score calculation completed", {
        userId,
        creditScore: creditScoreResult.creditScore,
        anomalyCount: anomalyResults.length,
        blockchainTx: blockchainResult?.transactionHash,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.CREDIT_SCORE_CALCULATED,
        creditScoreResult: completeResult,
        blockchainVerification: blockchainResult,
        verificationLinks,
      })
    } catch (error) {
      logger.error("Credit score calculation error:", error)
      throw error
    }
  }

  // GET /api/credit-score/history/:userId
  async getCreditScoreHistory(req, res) {
    try {
      const { userId } = req.params
      const { page = 1, limit = 10 } = req.query

      // Check if user is accessing their own history
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own credit score history",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const skip = (page - 1) * limit
      const creditHistory = await CreditScoreResult.find({ userId })
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(Number.parseInt(limit))
        .select("creditScore riskLevel riskCategory generatedAt blockchainHash ipfsHash")

      const totalCount = await CreditScoreResult.countDocuments({ userId })

      logger.info("Credit score history retrieved", { userId, count: creditHistory.length })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        creditHistory: creditHistory.map((record) => ({
          creditScore: record.creditScore,
          riskLevel: record.riskLevel,
          riskCategory: record.riskCategory,
          generatedAt: record.generatedAt,
          blockchainHash: record.blockchainHash,
          ipfsHash: record.ipfsHash,
          etherscanUrl: record.blockchainHash
            ? `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${record.blockchainHash}`
            : null,
          ipfsUrl: record.ipfsHash ? `https://ipfs.io/ipfs/${record.ipfsHash}` : null,
        })),
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      })
    } catch (error) {
      logger.error("Get credit score history error:", error)
      throw error
    }
  }

  // GET /api/credit-score/latest/:userId
  async getLatestCreditScore(req, res) {
    try {
      const { userId } = req.params

      // Check if user is accessing their own score
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own credit score",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const latestScore = await CreditScoreResult.findOne({ userId }).sort({ generatedAt: -1 })

      if (!latestScore) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: "CREDIT_SCORE_NOT_FOUND",
            message: "No credit score found",
            details: "Please calculate your credit score first",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Latest credit score retrieved", { userId, creditScore: latestScore.creditScore })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        creditScoreResult: latestScore,
        verificationLinks: {
          etherscanUrl: latestScore.blockchainHash
            ? `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${latestScore.blockchainHash}`
            : null,
          ipfsReportUrl: latestScore.ipfsHash ? `https://ipfs.io/ipfs/${latestScore.ipfsHash}` : null,
        },
      })
    } catch (error) {
      logger.error("Get latest credit score error:", error)
      throw error
    }
  }

  // Helper method to process anomaly detection
  async processAnomalyDetection(transactions, financialProfile) {
    try {
      const anomalyResults = []

      // Process transactions in batches to avoid overwhelming the ML service
      const batchSize = 10
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)

        for (const transaction of batch) {
          try {
            // Prepare contextual features
            const contextualFeatures = this.prepareContextualFeatures(transaction, transactions, financialProfile)

            // Prepare user behavioral context
            const userBehavioralContext = this.prepareUserBehavioralContext(transactions, financialProfile)

            // Call anomaly detection model
            const anomalyResult = await aiModelService.detectAnomalies(
              {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                subcategory: transaction.subcategory,
                date: transaction.date.toISOString(),
                hourOfDay: transaction.hourOfDay,
                dayOfWeek: transaction.dayOfWeek,
                isWeekend: transaction.isWeekend,
                isLateNight: transaction.isLateNight,
                merchant: transaction.merchant,
                location: transaction.location,
                paymentMethod: transaction.paymentMethod,
                balanceAfterTransaction: transaction.balanceAfterTransaction,
              },
              contextualFeatures,
              userBehavioralContext,
            )

            // Update transaction with anomaly data
            await Transaction.findByIdAndUpdate(transaction._id, {
              isAnomaly: anomalyResult.isAnomaly,
              anomalyScore: anomalyResult.anomalyScore,
            })

            anomalyResults.push({
              transactionId: transaction.transactionId,
              isAnomaly: anomalyResult.isAnomaly,
              anomalyScore: anomalyResult.anomalyScore,
              fraudRisk: anomalyResult.fraudRisk,
              detectedPatterns: anomalyResult.detectedPatterns,
              riskFactors: anomalyResult.riskFactors,
            })
          } catch (anomalyError) {
            logger.error("Anomaly detection failed for transaction:", {
              transactionId: transaction.transactionId,
              error: anomalyError.message,
            })
            // Continue with next transaction
          }
        }

        // Add small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      return anomalyResults
    } catch (error) {
      logger.error("Process anomaly detection error:", error)
      return []
    }
  }

  // Helper method to prepare contextual features
  prepareContextualFeatures(transaction, allTransactions, financialProfile) {
    // Calculate time since last transaction
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))
    const currentIndex = sortedTransactions.findIndex((t) => t._id.toString() === transaction._id.toString())
    const timeSinceLastTransaction =
      currentIndex > 0
        ? (new Date(transaction.date) - new Date(sortedTransactions[currentIndex - 1].date)) / (1000 * 60)
        : 0

    // Calculate category averages
    const categoryTransactions = allTransactions.filter((t) => t.category === transaction.category)
    const avgAmountForCategoryLast7Days =
      categoryTransactions.length > 0
        ? categoryTransactions.reduce((sum, t) => sum + t.amount, 0) / categoryTransactions.length
        : 0

    // Calculate user averages
    const userAvgTransactionAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0) / allTransactions.length
    const amounts = allTransactions.map((t) => t.amount)
    const mean = amounts.reduce((a, b) => a + b) / amounts.length
    const userStdDevTransactionAmount = Math.sqrt(
      amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length,
    )

    return {
      timeSinceLastTransaction,
      avgAmountForCategoryLast7Days,
      stdDevAmountForCategoryLast30Days: userStdDevTransactionAmount,
      userAvgTransactionAmount,
      userStdDevTransactionAmount,
      locationDeviationFromUsualPatterns: Math.random() * 100, // Simplified
      merchantFrequencyForUser: allTransactions.filter((t) => t.merchant === transaction.merchant).length,
      consecutiveTransactionsSameMerchant: 1, // Simplified
      velocityOfTransactionsInShortPeriod: 2, // Simplified
      unusualTimePattern: transaction.isLateNight,
      geographicalOutlier: false, // Simplified
      amountOutlierForCategory: transaction.amount > avgAmountForCategoryLast7Days * 2,
      merchantOutlier: allTransactions.filter((t) => t.merchant === transaction.merchant).length < 2,
    }
  }

  // Helper method to prepare user behavioral context
  prepareUserBehavioralContext(transactions, financialProfile) {
    const totalSpending = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)
    const avgMonthlySpending = totalSpending / 6 // Assuming 6 months of data

    const categories = [...new Set(transactions.map((t) => t.category))]
    const merchants = [...new Set(transactions.map((t) => t.merchant))]
    const hours = [...new Set(transactions.map((t) => t.hourOfDay))]

    return {
      avgMonthlySpending,
      typicalTransactionCountPerDay: Math.round(transactions.length / 180), // 6 months = ~180 days
      historicalAnomalyRateForUser: 5, // Simplified
      averageTransactionAmountLast30Days: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
      mostCommonCategories: categories.slice(0, 5),
      mostCommonMerchants: merchants.slice(0, 5),
      usualTransactionHours: hours.slice(0, 5),
      typicalGeographicalArea: {
        centerLatitude: 12.9716,
        centerLongitude: 77.5946,
        radiusKm: 50,
      },
    }
  }

  // Helper method to calculate overall anomaly metrics
  calculateOverallAnomalyMetrics(anomalyResults) {
    const totalTransactionsAnalyzed = anomalyResults.length
    const anomalousTransactions = anomalyResults.filter((r) => r.isAnomaly)
    const anomalousTransactionsCount = anomalousTransactions.length
    const anomalyRate =
      totalTransactionsAnalyzed > 0 ? (anomalousTransactionsCount / totalTransactionsAnalyzed) * 100 : 0

    const anomalyScores = anomalyResults.map((r) => r.anomalyScore)
    const avgAnomalyScore =
      anomalyScores.length > 0 ? anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length : 0
    const highestAnomalyScore = anomalyScores.length > 0 ? Math.max(...anomalyScores) : 0

    return {
      totalTransactionsAnalyzed,
      anomalousTransactionsCount,
      anomalyRate,
      avgAnomalyScore,
      highestAnomalyScore,
    }
  }
}

module.exports = new CreditScoreController()
