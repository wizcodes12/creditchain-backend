  const logger = require("../utils/logger")
  const CONSTANTS = require("../utils/constants")

  const errorHandler = (err, req, res, next) => {
    let error = { ...err }
    error.message = err.message

    // Log error
    logger.error("Error Handler:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
    })

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      const message = "Resource not found"
      error = {
        code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
        message,
        details: "Invalid ID format provided",
      }
      return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          ...error,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]
      const value = err.keyValue[field]

      let code = "DUPLICATE_FIELD"
      let message = "Duplicate field value"

      switch (field) {
        case "email":
          code = CONSTANTS.ERROR_CODES.DUPLICATE_EMAIL
          message = "Email already exists"
          break
        case "panNumber":
          code = CONSTANTS.ERROR_CODES.DUPLICATE_PAN
          message = "PAN number already exists"
          break
        case "aadhaarNumber":
          code = CONSTANTS.ERROR_CODES.DUPLICATE_AADHAAR
          message = "Aadhaar number already exists"
          break
        case "creditCardNumber":
          code = "DUPLICATE_CREDIT_CARD"
          message = "Credit card number already exists"
          break
      }

      return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code,
          message,
          details: `${field} '${value}' is already registered`,
          timestamp: new Date().toISOString(),
        },
        validation: [
          {
            field,
            message: `${field} already exists`,
            value,
          },
        ],
      })
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((val) => ({
        field: val.path,
        message: val.message,
        value: val.value,
      }))

      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: "Please check the provided data",
          timestamp: new Date().toISOString(),
        },
        validation: errors,
      })
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.TOKEN_INVALID,
          message: "Invalid token",
          details: "Please login again to get a new token",
          timestamp: new Date().toISOString(),
        },
      })
    }

    if (err.name === "TokenExpiredError") {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.TOKEN_EXPIRED,
          message: "Token expired",
          details: "Please login again to get a new token",
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Axios errors (API calls)
    if (err.isAxiosError) {
      let code = "EXTERNAL_API_ERROR"
      let message = "External service error"
      let details = "An error occurred while calling external service"

      if (err.response) {
        // The request was made and the server responded with a status code
        if (err.config.url.includes(process.env.ML_SERVICE_URL)) {
          code = "ML_SERVICE_ERROR"
          message = "ML service error"
          details = "Credit scoring or anomaly detection service is unavailable"
        }
      } else if (err.request) {
        // The request was made but no response was received
        code = "SERVICE_UNAVAILABLE"
        message = "Service unavailable"
        details = "External service is not responding"
      }

      return res.status(CONSTANTS.HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code,
          message,
          details,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Blockchain/Ethereum errors
    if (err.message && err.message.includes("insufficient funds")) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.INSUFFICIENT_FUNDS,
          message: "Insufficient funds",
          details: "Not enough ETH to complete the blockchain transaction",
          timestamp: new Date().toISOString(),
        },
      })
    }

    if (err.message && (err.message.includes("revert") || err.message.includes("execution reverted"))) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.SMART_CONTRACT_ERROR,
          message: "Smart contract error",
          details: "The blockchain transaction was reverted",
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Rate limit errors
    if (err.message && err.message.includes("rate limit")) {
      return res.status(429).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.INFURA_RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded",
          details: "Too many blockchain requests. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Default error
    const statusCode = error.statusCode || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
    })
  }

  module.exports = errorHandler
