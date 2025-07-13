const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "ML_SERVICE_URL",
  "INFURA_PROJECT_ID",
  "PRIVATE_KEY",
  "CONTRACT_ADDRESS_CREDIT",
]

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

const getConfig = () => {
  validateEnvironment()

  return {
    // Database
    mongodb: {
      uri: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB_NAME || "creditchain",
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    },

    // AI/ML Service
    mlService: {
      url: process.env.ML_SERVICE_URL,
      creditEndpoint: "/predict-credit-score",
      anomalyEndpoint: "/predict-anomaly",
      healthEndpoint: "/health",
    },

    // Blockchain
    blockchain: {
      network: process.env.ETHEREUM_NETWORK || "sepolia",
      infuraProjectId: process.env.INFURA_PROJECT_ID,
      infuraProjectSecret: process.env.INFURA_PROJECT_SECRET,
      privateKey: process.env.PRIVATE_KEY,
      contractAddresses: {
        creditScore: process.env.CONTRACT_ADDRESS_CREDIT,
        userIdentity: process.env.CONTRACT_ADDRESS_IDENTITY,
      },
    },

    // IPFS
    ipfs: {
      projectId: process.env.IPFS_PROJECT_ID,
      projectSecret: process.env.IPFS_PROJECT_SECRET,
      gatewayUrl: "https://ipfs.io/ipfs/",
    },

    // Application
    app: {
      port: process.env.PORT || 5000,
      nodeEnv: process.env.NODE_ENV || "development",
      corsOrigin: process.env.CORS_ORIGIN || "*",
    },

    // Security
    security: {
      saltRounds: Number.parseInt(process.env.SALT_ROUNDS) || 12,
      rateLimitRequests: Number.parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
      rateLimitWindow: Number.parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    },
  }
}

module.exports = { getConfig, validateEnvironment }
