const express = require("express")
const blockchainController = require("../controllers/blockchainController")
const { auth } = require("../middleware/auth")
const { blockchainLimiter } = require("../middleware/rateLimiter")
const { validateBlockchainVerify, validateWalletAddress } = require("../middleware/validation")

const router = express.Router()

// POST /api/blockchain/verify - Verify blockchain transaction
router.post("/verify", auth, blockchainLimiter, validateBlockchainVerify, blockchainController.verifyTransaction)

// GET /api/blockchain/history/:walletAddress - Get blockchain history
router.get("/history/:walletAddress", auth, validateWalletAddress, blockchainController.getBlockchainHistory)

// GET /api/blockchain/status - Get blockchain status
router.get("/status", auth, blockchainController.getBlockchainStatus)

// POST /api/blockchain/register-user - Register user on blockchain
router.post("/register-user", auth, blockchainLimiter, blockchainController.registerUser)

// GET /api/blockchain/ipfs/:ipfsHash - Get IPFS data
router.get("/ipfs/:ipfsHash", auth, blockchainController.getIpfsData)

module.exports = router
