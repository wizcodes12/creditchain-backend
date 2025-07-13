const ValidationService = require("../services/validationService")
const logger = require("../utils/logger") // Declare the logger variable

// Export validation middleware functions
module.exports = {
  // User validation middleware
  validateUserRegistration: [...ValidationService.userRegistrationRules(), ValidationService.handleValidationErrors],

  validateUserLogin: [...ValidationService.userLoginRules(), ValidationService.handleValidationErrors],

  // Parameter validation middleware
  validateUserId: [...ValidationService.userIdParamRules(), ValidationService.handleValidationErrors],

  validateTransactionId: [...ValidationService.transactionIdParamRules(), ValidationService.handleValidationErrors],

  // Query validation middleware
  validatePagination: [...ValidationService.paginationRules(), ValidationService.handleValidationErrors],

  validateTransactionFilters: [...ValidationService.transactionFilterRules(), ValidationService.handleValidationErrors],

  // Blockchain validation middleware
  validateBlockchainVerify: [...ValidationService.blockchainVerifyRules(), ValidationService.handleValidationErrors],

  validateWalletAddress: [...ValidationService.walletAddressRules(), ValidationService.handleValidationErrors],

  // Custom validation middleware
  validateUniqueFields: async (req, res, next) => {
    try {
      const { email, panNumber, aadhaarNumber, creditCardNumber } = req.body
      const userId = req.params.userId || null

      // Check email uniqueness
      if (email && !(await ValidationService.validateUniqueEmail(email, userId))) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DUPLICATE_EMAIL",
            message: "Email already exists",
            details: "This email address is already registered",
            timestamp: new Date().toISOString(),
          },
          validation: [
            {
              field: "email",
              message: "Email already exists",
              value: email,
            },
          ],
        })
      }

      // Check PAN uniqueness
      if (panNumber && !(await ValidationService.validateUniquePAN(panNumber, userId))) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DUPLICATE_PAN",
            message: "PAN number already exists",
            details: "This PAN number is already registered",
            timestamp: new Date().toISOString(),
          },
          validation: [
            {
              field: "panNumber",
              message: "PAN number already exists",
              value: panNumber,
            },
          ],
        })
      }

      // Check Aadhaar uniqueness
      if (aadhaarNumber && !(await ValidationService.validateUniqueAadhaar(aadhaarNumber, userId))) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DUPLICATE_AADHAAR",
            message: "Aadhaar number already exists",
            details: "This Aadhaar number is already registered",
            timestamp: new Date().toISOString(),
          },
          validation: [
            {
              field: "aadhaarNumber",
              message: "Aadhaar number already exists",
              value: aadhaarNumber,
            },
          ],
        })
      }

      // Check Credit Card uniqueness
      if (creditCardNumber && !(await ValidationService.validateUniqueCreditCard(creditCardNumber, userId))) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DUPLICATE_CREDIT_CARD",
            message: "Credit card number already exists",
            details: "This credit card number is already registered",
            timestamp: new Date().toISOString(),
          },
          validation: [
            {
              field: "creditCardNumber",
              message: "Credit card number already exists",
              value: creditCardNumber,
            },
          ],
        })
      }

      next()
    } catch (error) {
      logger.error("Unique fields validation error:", error)
      return res.status(500).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: "An error occurred during validation",
          timestamp: new Date().toISOString(),
        },
      })
    }
  },
}
