const express = require("express")
const creditScoreController = require("../controllers/creditScoreController")
const { auth } = require("../middleware/auth")
const { creditScoreLimiter } = require("../middleware/rateLimiter")
const { validateUserId, validatePagination } = require("../middleware/validation")

const router = express.Router()

// POST /api/credit-score/calculate/:userId - Calculate credit score
router.post("/calculate/:userId", auth, creditScoreLimiter, validateUserId, creditScoreController.calculateCreditScore)

// GET /api/credit-score/history/:userId - Get credit score history
router.get("/history/:userId", auth, validateUserId, validatePagination, creditScoreController.getCreditScoreHistory)

// GET /api/credit-score/latest/:userId - Get latest credit score
router.get("/latest/:userId", auth, validateUserId, creditScoreController.getLatestCreditScore)

module.exports = router
