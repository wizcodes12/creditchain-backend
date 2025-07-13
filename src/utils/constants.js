const CONSTANTS = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Error Codes
  ERROR_CODES: {
    // Validation Errors
    INVALID_EMAIL: "INVALID_EMAIL",
    INVALID_PHONE: "INVALID_PHONE",
    INVALID_PAN: "INVALID_PAN",
    INVALID_AADHAAR: "INVALID_AADHAAR",
    INVALID_CREDIT_CARD: "INVALID_CREDIT_CARD",
    DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
    DUPLICATE_PAN: "DUPLICATE_PAN",
    DUPLICATE_AADHAAR: "DUPLICATE_AADHAAR",
    MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
    INVALID_DATA_TYPE: "INVALID_DATA_TYPE",
    VALUE_OUT_OF_RANGE: "VALUE_OUT_OF_RANGE",

    // Business Logic Errors
    USER_NOT_FOUND: "USER_NOT_FOUND",
    USER_NOT_VERIFIED: "USER_NOT_VERIFIED",
    INSUFFICIENT_TRANSACTION_DATA: "INSUFFICIENT_TRANSACTION_DATA",
    CREDIT_SCORE_CALCULATION_FAILED: "CREDIT_SCORE_CALCULATION_FAILED",
    ANOMALY_DETECTION_FAILED: "ANOMALY_DETECTION_FAILED",
    BLOCKCHAIN_TRANSACTION_FAILED: "BLOCKCHAIN_TRANSACTION_FAILED",
    IPFS_UPLOAD_FAILED: "IPFS_UPLOAD_FAILED",
    INFURA_RATE_LIMIT_EXCEEDED: "INFURA_RATE_LIMIT_EXCEEDED",
    INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
    SMART_CONTRACT_ERROR: "SMART_CONTRACT_ERROR",

    // Authentication Errors
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",
    ACCESS_DENIED: "ACCESS_DENIED",
  },

  // Transaction Categories
  TRANSACTION_CATEGORIES: [
    "groceries",
    "dining",
    "entertainment",
    "transportation",
    "utilities",
    "healthcare",
    "education",
    "shopping",
    "travel",
    "fuel",
    "insurance",
    "loan_payment",
    "salary",
    "investment",
    "business",
    "other",
  ],

  // Transaction Types
  TRANSACTION_TYPES: ["debit", "credit"],

  // Payment Methods
  PAYMENT_METHODS: ["card", "upi", "netbanking", "cash", "wallet"],

  // Employment Types
  EMPLOYMENT_TYPES: ["salaried", "self_employed", "business_owner", "freelancer"],

  // Account Types
  ACCOUNT_TYPES: ["savings", "current", "salary"],

  // Loan Types
  LOAN_TYPES: ["personal", "home", "car", "education", "business", "gold"],

  // Risk Levels
  RISK_LEVELS: ["low", "medium", "high"],

  // Risk Categories
  RISK_CATEGORIES: ["excellent", "good", "fair", "poor", "very_poor"],

  // Fraud Risk Levels
  FRAUD_RISK_LEVELS: ["low", "medium", "high", "critical"],

  // Impact Levels
  IMPACT_LEVELS: ["low", "medium", "high"],

  // Credit Score Ranges
  CREDIT_SCORE: {
    MIN: 300,
    MAX: 850,
    EXCELLENT: 750,
    GOOD: 650,
    FAIR: 550,
    POOR: 450,
  },

  // Confidence Score Ranges
  CONFIDENCE_SCORE: {
    MIN: 0,
    MAX: 100,
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40,
  },

  // Anomaly Score Ranges
  ANOMALY_SCORE: {
    MIN: 0,
    MAX: 100,
    HIGH_RISK: 80,
    MEDIUM_RISK: 60,
    LOW_RISK: 40,
  },

  // Score Breakdown Weights
  SCORE_WEIGHTS: {
    PAYMENT_HISTORY: 35,
    CREDIT_UTILIZATION: 30,
    LENGTH_OF_HISTORY: 15,
    NEW_CREDIT: 10,
    CREDIT_MIX: 10,
    ALTERNATIVE_FACTORS: 10,
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false,
  },

  // File Upload Limits
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
  },

  // Blockchain Networks
  BLOCKCHAIN_NETWORKS: {
    MAINNET: "mainnet",
    SEPOLIA: "sepolia",
    GOERLI: "goerli",
  },

  // IPFS Configuration
  IPFS: {
    GATEWAY_URL: "https://ipfs.io/ipfs/",
    PIN_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  },

  // Data Generation Limits
  DATA_GENERATION: {
    MIN_TRANSACTIONS: 50,
    MAX_TRANSACTIONS: 100,
    TRANSACTION_DATE_RANGE_MONTHS: 6,
    MIN_MONTHLY_INCOME: 15000,
    MAX_MONTHLY_INCOME: 500000,
    MIN_AGE: 18,
    MAX_AGE: 80,
  },

  // API Response Messages
  MESSAGES: {
    SUCCESS: {
      USER_CREATED: "User registered successfully",
      USER_UPDATED: "User updated successfully",
      LOGIN_SUCCESS: "Login successful",
      PROFILE_GENERATED: "Financial profile generated successfully",
      CREDIT_SCORE_CALCULATED: "Credit score calculated successfully",
      TRANSACTIONS_RETRIEVED: "Transactions retrieved successfully",
      BLOCKCHAIN_UPDATED: "Blockchain updated successfully",
      DATA_UPLOADED_IPFS: "Data uploaded to IPFS successfully",
    },
    ERROR: {
      USER_NOT_FOUND: "User not found",
      INVALID_CREDENTIALS: "Invalid email or password",
      PROFILE_NOT_FOUND: "Financial profile not found",
      INSUFFICIENT_DATA: "Insufficient data for calculation",
      BLOCKCHAIN_ERROR: "Blockchain operation failed",
      IPFS_ERROR: "IPFS operation failed",
      ML_SERVICE_ERROR: "ML service unavailable",
    },
  },

  // Regex Patterns
  REGEX: {
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    AADHAAR: /^[0-9]{4}-[0-9]{4}-[0-9]{4}$/,
    CREDIT_CARD: /^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/,
    PHONE: /^[0-9]{10}$/,
    WALLET_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
    IPFS_HASH: /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/,
  },
}

module.exports = CONSTANTS
