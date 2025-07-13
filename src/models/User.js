const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    panNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    },
    aadhaarNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{4}-[0-9]{4}-[0-9]{4}$/,
    },
    creditCardNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/,
    },
    password: {
      type: String,
      required: false, // Will be set during first login
      minLength: 6,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    walletAddress: {
      type: String,
      required: false,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    panHash: {
      type: String,
      required: false,
    },
    aadhaarHash: {
      type: String,
      required: false,
    },
    creditCardHash: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Remove ALL indexes for fields that have unique: true
// These fields already get indexes automatically:
// - email (unique: true)
// - panNumber (unique: true) 
// - aadhaarNumber (unique: true)
// - creditCardNumber (unique: true)

// Only add indexes for fields that don't have unique: true
userSchema.index({ walletAddress: 1 })

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next()
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Update timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("User", userSchema)