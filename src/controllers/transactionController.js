const Transaction = require("../models/Transaction")
const User = require("../models/User")
const logger = require("../utils/logger")
const CONSTANTS = require("../utils/constants")

class TransactionController {
  // GET /api/transactions/:userId
  async getTransactions(req, res) {
    try {
      const { userId } = req.params
      const {
        page = 1,
        limit = 20,
        category,
        type,
        startDate,
        endDate,
        anomaliesOnly,
        sortBy = "date",
        sortOrder = "desc",
      } = req.query

      // Check if user is accessing their own transactions
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own transactions",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Build query
      const query = { userId }

      if (category) query.category = category
      if (type) query.type = type
      if (anomaliesOnly === "true") query.isAnomaly = true

      if (startDate || endDate) {
        query.date = {}
        if (startDate) query.date.$gte = new Date(startDate)
        if (endDate) query.date.$lte = new Date(endDate)
      }

      // Build sort object
      const sort = {}
      sort[sortBy] = sortOrder === "asc" ? 1 : -1

      // Execute query with pagination
      const skip = (page - 1) * limit
      const transactions = await Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number.parseInt(limit))
        .select(
          "transactionId amount type category subcategory date description merchant location paymentMethod isAnomaly anomalyScore",
        )

      const totalCount = await Transaction.countDocuments(query)

      logger.info("Transactions retrieved", {
        userId,
        count: transactions.length,
        filters: { category, type, anomaliesOnly },
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        transactions,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + transactions.length < totalCount,
        },
        filters: {
          category,
          type,
          startDate,
          endDate,
          anomaliesOnly: anomaliesOnly === "true",
        },
      })
    } catch (error) {
      logger.error("Get transactions error:", error)
      throw error
    }
  }

  // GET /api/transactions/anomalies/:userId
  async getAnomalousTransactions(req, res) {
    try {
      const { userId } = req.params
      const { page = 1, limit = 20, riskLevel } = req.query

      // Check if user is accessing their own transactions
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own transactions",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Build query for anomalous transactions
      const query = { userId, isAnomaly: true }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const anomalies = await Transaction.find(query)
        .sort({ anomalyScore: -1, date: -1 })
        .skip(skip)
        .limit(Number.parseInt(limit))
        .select("transactionId amount type category date merchant anomalyScore location paymentMethod description")

      const totalCount = await Transaction.countDocuments(query)

      // Calculate summary statistics
      const summary = await this.calculateAnomalySummary(userId)

      logger.info("Anomalous transactions retrieved", {
        userId,
        count: anomalies.length,
        totalAnomalies: totalCount,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        anomalies: anomalies.map((transaction) => ({
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: transaction.date,
          merchant: transaction.merchant,
          anomalyScore: transaction.anomalyScore,
          fraudRisk: this.calculateFraudRisk(transaction.anomalyScore),
          location: transaction.location,
          paymentMethod: transaction.paymentMethod,
          description: transaction.description,
        })),
        summary,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      })
    } catch (error) {
      logger.error("Get anomalous transactions error:", error)
      throw error
    }
  }

  // GET /api/transactions/analytics/:userId
  async getTransactionAnalytics(req, res) {
    try {
      const { userId } = req.params
      const { period = "6months" } = req.query

      // Check if user is accessing their own analytics
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own analytics",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Calculate date range based on period
      const endDate = new Date()
      const startDate = new Date()
      switch (period) {
        case "1month":
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case "3months":
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6)
          break
        case "1year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate.setMonth(startDate.getMonth() - 6)
      }

      // Spending by category
      const spendingByCategory = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: "debit",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ])

      // Monthly spending trend
      const monthlySpending = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: "debit",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])

      // Payment method distribution
      const paymentMethodDistribution = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { count: -1 } },
      ])

      // Transaction patterns
      const hourlyPattern = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$hourOfDay",
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])

      // Anomaly trends
      const anomalyTrends = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            totalTransactions: { $sum: 1 },
            anomalousTransactions: {
              $sum: { $cond: [{ $eq: ["$isAnomaly", true] }, 1, 0] },
            },
            avgAnomalyScore: {
              $avg: { $cond: [{ $eq: ["$isAnomaly", true] }, "$anomalyScore", null] },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])

      logger.info("Transaction analytics retrieved", {
        userId,
        period,
        categoriesCount: spendingByCategory.length,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        analytics: {
          period,
          dateRange: { startDate, endDate },
          spendingByCategory,
          monthlySpending,
          paymentMethodDistribution,
          hourlyPattern,
          anomalyTrends,
        },
      })
    } catch (error) {
      logger.error("Get transaction analytics error:", error)
      throw error
    }
  }

  // GET /api/transactions/details/:transactionId
  async getTransactionDetails(req, res) {
    try {
      const { transactionId } = req.params

      const transaction = await Transaction.findOne({ transactionId })

      if (!transaction) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction not found",
            details: "No transaction found with the provided ID",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Check if user owns this transaction
      if (req.user._id.toString() !== transaction.userId.toString()) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own transactions",
            timestamp: new Date().toISOString(),
          },
        })
      }

      logger.info("Transaction details retrieved", {
        transactionId,
        userId: transaction.userId,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        transaction: {
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          subcategory: transaction.subcategory,
          date: transaction.date,
          description: transaction.description,
          merchant: transaction.merchant,
          location: transaction.location,
          paymentMethod: transaction.paymentMethod,
          balanceAfterTransaction: transaction.balanceAfterTransaction,
          isAnomaly: transaction.isAnomaly,
          anomalyScore: transaction.anomalyScore,
          fraudRisk: this.calculateFraudRisk(transaction.anomalyScore),
          isWeekend: transaction.isWeekend,
          isLateNight: transaction.isLateNight,
          hourOfDay: transaction.hourOfDay,
          dayOfWeek: transaction.dayOfWeek,
          createdAt: transaction.createdAt,
        },
      })
    } catch (error) {
      logger.error("Get transaction details error:", error)
      throw error
    }
  }

  // Helper method to calculate anomaly summary
  async calculateAnomalySummary(userId) {
    try {
      const totalAnomalies = await Transaction.countDocuments({
        userId,
        isAnomaly: true,
      })

      const anomalyStats = await Transaction.aggregate([
        { $match: { userId: userId, isAnomaly: true } },
        {
          $group: {
            _id: null,
            avgAnomalyScore: { $avg: "$anomalyScore" },
            maxAnomalyScore: { $max: "$anomalyScore" },
            minAnomalyScore: { $min: "$anomalyScore" },
          },
        },
      ])

      // Calculate risk level distribution
      const riskDistribution = await Transaction.aggregate([
        { $match: { userId: userId, isAnomaly: true } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ["$anomalyScore", 80] }, then: "critical" },
                  { case: { $gte: ["$anomalyScore", 60] }, then: "high" },
                  { case: { $gte: ["$anomalyScore", 40] }, then: "medium" },
                ],
                default: "low",
              },
            },
            count: { $sum: 1 },
          },
        },
      ])

      const riskCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }

      riskDistribution.forEach((item) => {
        riskCounts[item._id] = item.count
      })

      return {
        totalAnomalies,
        highRiskCount: riskCounts.critical + riskCounts.high,
        mediumRiskCount: riskCounts.medium,
        lowRiskCount: riskCounts.low,
        avgAnomalyScore: anomalyStats[0]?.avgAnomalyScore || 0,
        maxAnomalyScore: anomalyStats[0]?.maxAnomalyScore || 0,
      }
    } catch (error) {
      logger.error("Error calculating anomaly summary:", error)
      return {
        totalAnomalies: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        avgAnomalyScore: 0,
        maxAnomalyScore: 0,
      }
    }
  }

  // Helper method to calculate fraud risk level
  calculateFraudRisk(anomalyScore) {
    if (anomalyScore >= 80) return "critical"
    if (anomalyScore >= 60) return "high"
    if (anomalyScore >= 40) return "medium"
    return "low"
  }
}

module.exports = new TransactionController()
