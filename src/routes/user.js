const express = require("express")
const UserController = require("../controllers/userController")
const { auth } = require("../middleware/auth")
const { strictLimiter } = require("../middleware/rateLimiter")
const { validateUserId } = require("../middleware/validation")

const router = express.Router()

// Create an instance of the UserController
const userController = new UserController()

// POST /api/user/fetch-details - Generate financial profile and transactions
router.post("/fetch-details", auth, strictLimiter, userController.fetchDetails.bind(userController))

// GET /api/user/profile/:userId - Get user profile
router.get("/profile/:userId", auth, validateUserId, userController.getProfile.bind(userController))

// PUT /api/user/profile/:userId - Update user profile
router.put("/profile/:userId", auth, validateUserId, userController.updateProfile.bind(userController))

// GET /api/user/dashboard/:userId - Get user dashboard
router.get("/dashboard/:userId", auth, validateUserId, userController.getDashboard.bind(userController))

module.exports = router
