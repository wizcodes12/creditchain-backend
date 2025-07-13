const crypto = require("crypto")
const logger = require("./logger")

class CryptoUtils {
  static generateHash(data, algorithm = "sha256") {
    try {
      return crypto.createHash(algorithm).update(data).digest("hex")
    } catch (error) {
      logger.error("Error generating hash:", error)
      throw error
    }
  }

  static generateSalt(length = 32) {
    try {
      return crypto.randomBytes(length).toString("hex")
    } catch (error) {
      logger.error("Error generating salt:", error)
      throw error
    }
  }

  static hashWithSalt(data, salt) {
    try {
      return crypto
        .createHash("sha256")
        .update(data + salt)
        .digest("hex")
    } catch (error) {
      logger.error("Error hashing with salt:", error)
      throw error
    }
  }

  static generateSecureRandom(length = 16) {
    try {
      return crypto.randomBytes(length).toString("hex")
    } catch (error) {
      logger.error("Error generating secure random:", error)
      throw error
    }
  }

  static encrypt(text, key) {
    try {
      const algorithm = "aes-256-cbc"
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(algorithm, key)

      let encrypted = cipher.update(text, "utf8", "hex")
      encrypted += cipher.final("hex")

      return {
        encrypted,
        iv: iv.toString("hex"),
      }
    } catch (error) {
      logger.error("Error encrypting data:", error)
      throw error
    }
  }

  static decrypt(encryptedData, key, iv) {
    try {
      const algorithm = "aes-256-cbc"
      const decipher = crypto.createDecipher(algorithm, key)

      let decrypted = decipher.update(encryptedData, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    } catch (error) {
      logger.error("Error decrypting data:", error)
      throw error
    }
  }

  static generateDataIntegrityHash(data) {
    try {
      const sortedData = JSON.stringify(data, Object.keys(data).sort())
      return this.generateHash(sortedData)
    } catch (error) {
      logger.error("Error generating data integrity hash:", error)
      throw error
    }
  }

  static verifyDataIntegrity(data, expectedHash) {
    try {
      const calculatedHash = this.generateDataIntegrityHash(data)
      return calculatedHash === expectedHash
    } catch (error) {
      logger.error("Error verifying data integrity:", error)
      return false
    }
  }

  static hashPII(data) {
    try {
      // Hash PII data with a consistent salt for the same input
      const salt = this.generateHash(data + process.env.JWT_SECRET)
      return this.hashWithSalt(data, salt)
    } catch (error) {
      logger.error("Error hashing PII:", error)
      throw error
    }
  }

  static generateTransactionId(userId, timestamp = Date.now()) {
    try {
      const data = `${userId}_${timestamp}_${this.generateSecureRandom(8)}`
      return `TXN_${this.generateHash(data).substring(0, 16).toUpperCase()}`
    } catch (error) {
      logger.error("Error generating transaction ID:", error)
      throw error
    }
  }

  static generateRequestId() {
    try {
      return `REQ_${this.generateSecureRandom(16).toUpperCase()}`
    } catch (error) {
      logger.error("Error generating request ID:", error)
      throw error
    }
  }
}

module.exports = CryptoUtils
