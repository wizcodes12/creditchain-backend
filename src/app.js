const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const connectDB = require("./config/database")
const logger = require("./utils/logger")

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const creditScoreRoutes = require("./routes/creditScore")
const transactionRoutes = require("./routes/transaction")
const blockchainRoutes = require("./routes/blockchain")

// Import middleware
const errorHandler = require("./middleware/errorHandler")

const app = express()

// Connect to MongoDB
connectDB()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
)
// Add this near the top of your app.js, before rate limiting
app.set('trust proxy', 1);

// If you're using Railway specifically, you might also want:
app.set('trust proxy', true);
// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CreditChain Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// API routes
try {
  app.use("/api/auth", authRoutes);
} catch (err) {
  console.error("authRoutes error:", err);
}

try {
  app.use("/api/user", userRoutes);
} catch (err) {
  console.error("userRoutes error:", err);
}

try {
  app.use("/api/credit-score", creditScoreRoutes);
} catch (err) {
  console.error("creditScoreRoutes error:", err);
}

try {
  app.use("/api/transactions", transactionRoutes);
} catch (err) {
  console.error("transactionRoutes error:", err);
}

try {
  app.use("/api/blockchain", blockchainRoutes);
} catch (err) {
  console.error("blockchainRoutes error:", err);
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
    },
  })
})

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  logger.info(`CreditChain Backend server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

module.exports = app
