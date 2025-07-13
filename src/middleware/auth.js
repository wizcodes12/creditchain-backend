const jwt = require("jsonwebtoken")
const User = require("../models/User")
const logger = require("../utils/logger")
const CONSTANTS = require("../utils/constants")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: CONSTANTS.ERROR_CODES.TOKEN_INVALID,
          message: "Access denied. No token provided.",
          details: "Authorization header with Bearer token is required",
          timestamp: new Date().toISOString(),
        },
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.USER_NOT_FOUND,
            message: "User not found",
            details: "The user associated with this token no longer exists",
            timestamp: new Date().toISOString(),
          },
        })
      }

      req.user = user
      next()
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError)

      let errorCode = CONSTANTS.ERROR_CODES.TOKEN_INVALID
      let message = "Invalid token"

      if (jwtError.name === "TokenExpiredError") {
        errorCode = CONSTANTS.ERROR_CODES.TOKEN_EXPIRED
        message = "Token has expired"
      }

      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: errorCode,
          message,
          details: "Please login again to get a new token",
          timestamp: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    logger.error("Authentication middleware error:", error)
    return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Authentication failed",
        details: "An error occurred during authentication",
        timestamp: new Date().toISOString(),
      },
    })
  }
}

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      req.user = null
      return next()
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select("-password")
      req.user = user
    } catch (jwtError) {
      req.user = null
    }

    next()
  } catch (error) {
    logger.error("Optional authentication middleware error:", error)
    req.user = null
    next()
  }
}

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      // Check if user has admin privileges
      // This is a simplified check - in production you'd have proper role management
      if (req.user.email !== "admin@creditchain.ai") {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.ACCESS_DENIED,
            message: "Access denied",
            details: "Admin privileges required",
            timestamp: new Date().toISOString(),
          },
        })
      }
      next()
    })
  } catch (error) {
    logger.error("Admin authentication middleware error:", error)
    return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "ADMIN_AUTHENTICATION_ERROR",
        message: "Admin authentication failed",
        details: "An error occurred during admin authentication",
        timestamp: new Date().toISOString(),
      },
    })
  }
}

module.exports = { auth, optionalAuth, adminAuth }
