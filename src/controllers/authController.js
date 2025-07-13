const jwt = require("jsonwebtoken")
const User = require("../models/User")
const logger = require("../utils/logger")
const CryptoUtils = require("../utils/crypto")
const CONSTANTS = require("../utils/constants")

class AuthController {
  // POST /api/auth/signup
  async signup(req, res) {
    try {
      const { name, email, phone, panNumber, aadhaarNumber, creditCardNumber } = req.body

      logger.info("User signup attempt", { email, panNumber })

      // Generate hashes for PII data
      const panHash = CryptoUtils.hashPII(panNumber)
      const aadhaarHash = CryptoUtils.hashPII(aadhaarNumber)
      const creditCardHash = CryptoUtils.hashPII(creditCardNumber)

      // Create user
      const user = new User({
        name,
        email,
        phone,
        panNumber,
        aadhaarNumber,
        creditCardNumber,
        panHash,
        aadhaarHash,
        creditCardHash,
        isVerified: false,
      })

      await user.save()

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      })

      logger.info("User registered successfully", {
        userId: user._id,
        email: user.email,
      })

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.USER_CREATED,
        userId: user._id,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      logger.error("Signup error:", error)
      throw error
    }
  }

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body

      logger.info("User login attempt", { email })

      // Find user by email
      const user = await User.findOne({ email })

      if (!user) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS,
            message: "Invalid email or password",
            details: "No user found with this email address",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // For first-time login, set password
      if (!user.password && password) {
        user.password = password
        await user.save()
        logger.info("Password set for first-time login", { userId: user._id })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password)

      if (!isPasswordValid) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS,
            message: "Invalid email or password",
            details: "The provided password is incorrect",
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      })

      logger.info("User logged in successfully", { userId: user._id })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.LOGIN_SUCCESS,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      logger.error("Login error:", error)
      throw error
    }
  }

  // GET /api/auth/me
  async getProfile(req, res) {
    try {
      const user = req.user

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
      })
    } catch (error) {
      logger.error("Get profile error:", error)
      throw error
    }
  }

  // POST /api/auth/refresh
  async refreshToken(req, res) {
    try {
      const user = req.user

      // Generate new JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      })

      logger.info("Token refreshed", { userId: user._id })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: "Token refreshed successfully",
        token,
      })
    } catch (error) {
      logger.error("Refresh token error:", error)
      throw error
    }
  }

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Here we just log the action
      logger.info("User logged out", { userId: req.user._id })

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: "Logged out successfully",
      })
    } catch (error) {
      logger.error("Logout error:", error)
      throw error
    }
  }
}

module.exports = new AuthController()
