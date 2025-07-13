const express = require("express")
const transactionController = require("../controllers/transactionController")
const { auth } = require("../middleware/auth")
const {
  validateUserId,
  validateTransactionId,
  validatePagination,
  validateTransactionFilters,
} = require("../middleware/validation")

const router = express.Router()

// PUT SPECIFIC ROUTES FIRST (before parameterized routes)
// GET /api/transactions/anomalies/:userId - Get anomalous transactions
router.get(
  "/anomalies/:userId",
  auth,
  validateUserId,
  validatePagination,
  transactionController.getAnomalousTransactions,
)

// GET /api/transactions/analytics/:userId - Get transaction analytics
router.get("/analytics/:userId", auth, validateUserId, transactionController.getTransactionAnalytics)

// GET /api/transactions/details/:transactionId - Get transaction details
router.get("/details/:transactionId", auth, validateTransactionId, transactionController.getTransactionDetails)

// PUT PARAMETERIZED ROUTES LAST
// GET /api/transactions/:userId - Get user transactions
router.get(
  "/:userId",
  auth,
  validateUserId,
  validatePagination,
  validateTransactionFilters,
  transactionController.getTransactions,
)

module.exports = router