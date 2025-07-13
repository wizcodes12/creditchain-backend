const User = require("../models/User")
const FinancialProfile = require("../models/FinancialProfile")
const Transaction = require("../models/Transaction")
const dummyDataService = require("../services/dummyDataService")
const blockchainService = require("../services/blockchainService")
const logger = require("../utils/logger")
const CONSTANTS = require("../utils/constants")

class UserController {
  // POST /api/user/fetch-details
  async fetchDetails(req, res) {
    try {
      const userId = req.user._id
      const user = req.user

      logger.info("Fetching user details", { userId })

      // Check if financial profile already exists
      let financialProfile = await FinancialProfile.findOne({ userId })

      if (financialProfile) {
        return res.status(CONSTANTS.HTTP_STATUS.OK).json({
          success: true,
          message: "Financial profile already exists",
          financialProfile,
          transactionCount: await Transaction.countDocuments({ userId }),
          generatedAt: financialProfile.generatedAt,
        })
      }

      // Generate financial profile
      const profileData = dummyDataService.generateFinancialProfile(user)
      financialProfile = new FinancialProfile(profileData)
      await financialProfile.save()

      // Generate transactions
      const transactionData = dummyDataService.generateTransactions(user, profileData, 75)
      const transactions = await Transaction.insertMany(transactionData)

      // Generate wallet address for blockchain integration
      const walletAddress = blockchainService.generateWalletAddress()
      user.walletAddress = walletAddress
      user.isVerified = true
      await user.save()

      logger.info("User details generated successfully", {
        userId,
        transactionCount: transactions.length,
        monthlyIncome: profileData.personalInfo.monthlyIncome,
      })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.PROFILE_GENERATED,
        financialProfile: {
          personalInfo: financialProfile.personalInfo,
          existingLoans: financialProfile.existingLoans,
          creditCards: financialProfile.creditCards,
          bankAccounts: financialProfile.bankAccounts,
          alternativeFactors: financialProfile.alternativeFactors,
          behavioralPatterns: financialProfile.behavioralPatterns,
          calculatedRatios: financialProfile.calculatedRatios,
        },
        transactionCount: transactions.length,
        walletAddress,
        generatedAt: financialProfile.generatedAt,
      })
    } catch (error) {
      logger.error("Fetch details error:", error)
      throw error
    }
  }

  // GET /api/user/profile/:userId
  async getProfile(req, res) {
    try {
      const { userId } = req.params

      // Check if user is accessing their own profile or is admin
      if (req.user._id.toString() !== userId && req.user.email !== "admin@creditchain.ai") {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own profile",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const user = await User.findById(userId).select("-password")
      if (!user) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
            message: "User not found",
            details: "No user found with the provided ID",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const financialProfile = await FinancialProfile.findOne({ userId })

      // Get transaction summary
      const transactionSummary = await this.getTransactionSummary(userId)

      logger.info("User profile retrieved", { userId })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        financialProfile,
        transactionSummary,
      })
    } catch (error) {
      logger.error("Get profile error:", error)
      throw error
    }
  }

  // PUT /api/user/profile/:userId
  async updateProfile(req, res) {
    try {
      const { userId } = req.params
      const { name, phone } = req.body

      // Check if user is updating their own profile
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only update your own profile",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const user = await User.findById(userId)
      if (!user) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
            message: "User not found",
            details: "No user found with the provided ID",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Update allowed fields
      if (name) user.name = name
      if (phone) user.phone = phone

      await user.save()

      logger.info("User profile updated", { userId })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.USER_UPDATED,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress,
          updatedAt: user.updatedAt,
        },
      })
    } catch (error) {
      logger.error("Update profile error:", error)
      throw error
    }
  }

  // GET /api/user/dashboard/:userId
  async getDashboard(req, res) {
    try {
      const { userId } = req.params

      // Check if user is accessing their own dashboard
      if (req.user._id.toString() !== userId) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "You can only access your own dashboard",
            timestamp: new Date().toISOString(),
          },
        })
      }

      const user = await User.findById(userId).select("-password")
      const financialProfile = await FinancialProfile.findOne({ userId })

      if (!user.isVerified || !financialProfile) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_VERIFIED,
            message: "User not verified",
            details: "Please complete profile generation first",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Get transaction summary
      const transactionSummary = await this.getTransactionSummary(userId)

      // Get recent transactions
      const recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(10)
        .select("transactionId amount type category date merchant isAnomaly anomalyScore")

      // Get spending by category
      const spendingByCategory = await Transaction.aggregate([
        { $match: { userId: user._id, type: "debit" } },
        { $group: { _id: "$category", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
      ])

      logger.info("Dashboard data retrieved", { userId })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress,
        },
        financialProfile: {
          monthlyIncome: financialProfile.personalInfo.monthlyIncome,
          monthlyExpenses: financialProfile.personalInfo.monthlyExpenses,
          creditUtilization: financialProfile.creditCards.currentUtilization,
          totalLoans: financialProfile.existingLoans.totalAmount,
        },
        transactionSummary,
        recentTransactions,
        spendingByCategory,
      })
    } catch (error) {
      logger.error("Get dashboard error:", error)
      throw error
    }
  }

  // Helper method to get transaction summary
  async getTransactionSummary(userId) {
    try {
      const totalCount = await Transaction.countDocuments({ userId })

      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)
      const last30DaysCount = await Transaction.countDocuments({
        userId,
        date: { $gte: last30Days },
      })

      const totalAmountResult = await Transaction.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ])

      const avgAmountResult = await Transaction.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: null, avgAmount: { $avg: "$amount" } } },
      ])

      return {
        totalCount,
        last30Days: last30DaysCount,
        totalAmount: totalAmountResult[0]?.totalAmount || 0,
        avgAmount: Math.round(avgAmountResult[0]?.avgAmount || 0),
      }
    } catch (error) {
      logger.error("Error getting transaction summary:", error)
      return {
        totalCount: 0,
        last30Days: 0,
        totalAmount: 0,
        avgAmount: 0,
      }
    }
  }
}

const userController = new UserController();
module.exports = userController;
