const express = require("express")
const authController = require("../controllers/authController")
const { auth } = require("../middleware/auth")
const { authLimiter } = require("../middleware/rateLimiter")
const { validateUserRegistration, validateUserLogin, validateUniqueFields } = require("../middleware/validation")

const router = express.Router()

// POST /api/auth/signup - User registration
router.post("/signup", authLimiter, validateUserRegistration, validateUniqueFields, authController.signup)

// POST /api/auth/login - User login
router.post("/login", authLimiter, validateUserLogin, authController.login)

// GET /api/auth/me - Get current user profile
router.get("/me", auth, authController.getProfile)

// POST /api/auth/refresh - Refresh JWT token
router.post("/refresh", auth, authController.refreshToken)

// POST /api/auth/logout - User logout
router.post("/logout", auth, authController.logout)

module.exports = router
