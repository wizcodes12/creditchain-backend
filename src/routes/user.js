const express = require("express")
const userController = require("../controllers/userController")
const { auth } = require("../middleware/auth")
const { strictLimiter } = require("../middleware/rateLimiter")
const { validateUserId } = require("../middleware/validation")

const router = express.Router()

// POST /api/user/fetch-details - Generate financial profile and transactions
router.post("/fetch-details", auth, strictLimiter, userController.fetchDetails)

// GET /api/user/profile/:userId - Get user profile
router.get("/profile/:userId", auth, validateUserId, userController.getProfile)

// PUT /api/user/profile/:userId - Update user profile
router.put("/profile/:userId", auth, validateUserId, userController.updateProfile)

// GET /api/user/dashboard/:userId - Get user dashboard
router.get("/dashboard/:userId", auth, validateUserId, userController.getDashboard)

module.exports = router
