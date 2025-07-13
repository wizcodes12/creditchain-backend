const { body, param, query, validationResult } = require("express-validator")

class ValidationService {
  // User validation rules
  static userRegistrationRules() {
    return [
      body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Name must be 2-100 characters and contain only letters and spaces"),

      body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

      body("phone")
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone number must be exactly 10 digits"),

      body("panNumber")
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
        .withMessage("PAN number must be in format: ABCDE1234F"),

      body("aadhaarNumber")
        .matches(/^[0-9]{4}-[0-9]{4}-[0-9]{4}$/)
        .withMessage("Aadhaar number must be in format: 1234-5678-9012"),

      body("creditCardNumber")
        .matches(/^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/)
        .withMessage("Credit card number must be in format: 1234-5678-9012-3456"),
    ]
  }

  static userLoginRules() {
    return [
      body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    ]
  }

  // Parameter validation rules
  static userIdParamRules() {
    return [param("userId").isMongoId().withMessage("Invalid user ID format")]
  }

  static transactionIdParamRules() {
    return [param("transactionId").isLength({ min: 1 }).withMessage("Transaction ID is required")]
  }

  // Query validation rules
  static paginationRules() {
    return [
      query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    ]
  }

  static transactionFilterRules() {
    return [
      query("category")
        .optional()
        .isIn([
          "groceries",
          "dining",
          "entertainment",
          "transportation",
          "utilities",
          "healthcare",
          "education",
          "shopping",
          "travel",
          "fuel",
          "insurance",
          "loan_payment",
          "salary",
          "investment",
          "business",
          "other",
        ])
        .withMessage("Invalid transaction category"),

      query("type").optional().isIn(["debit", "credit"]).withMessage("Transaction type must be debit or credit"),

      query("startDate").optional().isISO8601().withMessage("Start date must be in ISO 8601 format"),

      query("endDate").optional().isISO8601().withMessage("End date must be in ISO 8601 format"),

      query("anomaliesOnly").optional().isBoolean().withMessage("anomaliesOnly must be a boolean value"),
    ]
  }

  // Blockchain validation rules
  static blockchainVerifyRules() {
    return [
      body("userId").isMongoId().withMessage("Invalid user ID format"),

      body("transactionHash")
        .matches(/^0x[a-fA-F0-9]{64}$/)
        .withMessage("Invalid transaction hash format"),
    ]
  }

  static walletAddressRules() {
    return [
      param("walletAddress")
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage("Invalid wallet address format"),
    ]
  }

  // Validation result handler
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      }))

      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: "Please check the provided data",
          timestamp: new Date().toISOString(),
        },
        validation: formattedErrors,
      })
    }

    next()
  }

  // Custom validation functions
  static async validateUniqueEmail(email, userId = null) {
    const User = require("../models/User")
    const query = { email }
    if (userId) {
      query._id = { $ne: userId }
    }

    const existingUser = await User.findOne(query)
    return !existingUser
  }

  static async validateUniquePAN(panNumber, userId = null) {
    const User = require("../models/User")
    const query = { panNumber }
    if (userId) {
      query._id = { $ne: userId }
    }

    const existingUser = await User.findOne(query)
    return !existingUser
  }

  static async validateUniqueAadhaar(aadhaarNumber, userId = null) {
    const User = require("../models/User")
    const query = { aadhaarNumber }
    if (userId) {
      query._id = { $ne: userId }
    }

    const existingUser = await User.findOne(query)
    return !existingUser
  }

  static async validateUniqueCreditCard(creditCardNumber, userId = null) {
    const User = require("../models/User")
    const query = { creditCardNumber }
    if (userId) {
      query._id = { $ne: userId }
    }

    const existingUser = await User.findOne(query)
    return !existingUser
  }

  // Date range validation
  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      throw new Error("Start date cannot be after end date")
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    if (start < sixMonthsAgo) {
      throw new Error("Start date cannot be more than 6 months ago")
    }

    return true
  }

  // Amount validation
  static validateTransactionAmount(amount, category) {
    const categoryLimits = {
      groceries: { min: 10, max: 10000 },
      dining: { min: 50, max: 5000 },
      entertainment: { min: 100, max: 10000 },
      transportation: { min: 10, max: 2000 },
      utilities: { min: 100, max: 20000 },
      healthcare: { min: 50, max: 50000 },
      education: { min: 500, max: 100000 },
      shopping: { min: 100, max: 50000 },
      travel: { min: 1000, max: 200000 },
      fuel: { min: 100, max: 5000 },
      insurance: { min: 1000, max: 50000 },
      loan_payment: { min: 1000, max: 100000 },
      salary: { min: 15000, max: 500000 },
      investment: { min: 1000, max: 1000000 },
      business: { min: 100, max: 1000000 },
      other: { min: 10, max: 100000 },
    }

    const limits = categoryLimits[category] || categoryLimits.other

    if (amount < limits.min || amount > limits.max) {
      throw new Error(`Amount for ${category} must be between ₹${limits.min} and ₹${limits.max}`)
    }

    return true
  }
}

module.exports = ValidationService
