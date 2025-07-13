const mongoose = require("mongoose")
const logger = require("../utils/logger")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "creditchain",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    logger.info(`MongoDB Connected: ${conn.connection.host}`)

    // Create indexes for better performance
    await createIndexes()
  } catch (error) {
    logger.error("Database connection error:", error)
    process.exit(1)
  }
}

const createIndexes = async () => {
  try {
    const User = require("../models/User")
    const FinancialProfile = require("../models/FinancialProfile")
    const Transaction = require("../models/Transaction")
    const CreditScoreResult = require("../models/CreditScoreResult")

    // User indexes
    await User.createIndexes()

    // FinancialProfile indexes
    await FinancialProfile.createIndexes()

    // Transaction indexes
    await Transaction.createIndexes()

    // CreditScoreResult indexes
    await CreditScoreResult.createIndexes()

    logger.info("Database indexes created successfully")
  } catch (error) {
    logger.error("Error creating indexes:", error)
  }
}

module.exports = connectDB
