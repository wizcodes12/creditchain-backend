const rateLimit = require("express-rate-limit")
const logger = require("../utils/logger")
const CONSTANTS = require("../utils/constants")

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT.WINDOW_MS,
  max: CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests",
      details: `Maximum ${CONSTANTS.RATE_LIMIT.MAX_REQUESTS} requests per ${CONSTANTS.RATE_LIMIT.WINDOW_MS / 60000} minutes allowed`,
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    })

    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests",
        details: `Maximum ${CONSTANTS.RATE_LIMIT.MAX_REQUESTS} requests per ${CONSTANTS.RATE_LIMIT.WINDOW_MS / 60000} minutes allowed`,
        timestamp: new Date().toISOString(),
      },
    })
  },
})

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: {
      code: "STRICT_RATE_LIMIT_EXCEEDED",
      message: "Too many sensitive requests",
      details: "Maximum 10 requests per 15 minutes allowed for this operation",
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Strict rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    })

    res.status(429).json({
      success: false,
      error: {
        code: "STRICT_RATE_LIMIT_EXCEEDED",
        message: "Too many sensitive requests",
        details: "Maximum 10 requests per 15 minutes allowed for this operation",
        timestamp: new Date().toISOString(),
      },
    })
  },
})

// Auth rate limiter for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many login attempts",
      details: "Maximum 5 login attempts per 15 minutes allowed",
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      email: req.body.email,
    })

    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many login attempts",
        details: "Maximum 5 login attempts per 15 minutes allowed",
        timestamp: new Date().toISOString(),
      },
    })
  },
})

// Credit score calculation rate limiter
const creditScoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 credit score calculations per hour
  message: {
    success: false,
    error: {
      code: "CREDIT_SCORE_RATE_LIMIT_EXCEEDED",
      message: "Too many credit score calculations",
      details: "Maximum 3 credit score calculations per hour allowed",
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Credit score rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
    })

    res.status(429).json({
      success: false,
      error: {
        code: "CREDIT_SCORE_RATE_LIMIT_EXCEEDED",
        message: "Too many credit score calculations",
        details: "Maximum 3 credit score calculations per hour allowed",
        timestamp: new Date().toISOString(),
      },
    })
  },
})

// Blockchain operation rate limiter
const blockchainLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 blockchain operations per 10 minutes
  message: {
    success: false,
    error: {
      code: "BLOCKCHAIN_RATE_LIMIT_EXCEEDED",
      message: "Too many blockchain operations",
      details: "Maximum 5 blockchain operations per 10 minutes allowed",
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Blockchain rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
    })

    res.status(429).json({
      success: false,
      error: {
        code: "BLOCKCHAIN_RATE_LIMIT_EXCEEDED",
        message: "Too many blockchain operations",
        details: "Maximum 5 blockchain operations per 10 minutes allowed",
        timestamp: new Date().toISOString(),
      },
    })
  },
})

module.exports = {
  generalLimiter,
  strictLimiter,
  authLimiter,
  creditScoreLimiter,
  blockchainLimiter,
}
