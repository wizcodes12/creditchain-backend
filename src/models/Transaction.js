const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true, // This automatically creates a unique index
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 1000000,
    },
    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
    },
    subcategory: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: false,
      maxLength: 200,
    },
    merchant: {
      type: String,
      required: false,
      maxLength: 100,
    },
    balanceAfterTransaction: {
      type: Number,
      required: false,
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
      city: String,
      state: String,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "cash", "wallet"],
      required: false,
    },
    isWeekend: {
      type: Boolean,
      required: true,
    },
    isLateNight: {
      type: Boolean,
      required: true,
    },
    hourOfDay: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    anomalyScore: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes - Remove transactionId index since it's already created by unique: true
transactionSchema.index({ userId: 1, date: -1 })
// transactionSchema.index({ transactionId: 1 }) // REMOVE THIS - already created by unique: true
transactionSchema.index({ userId: 1, category: 1 })
transactionSchema.index({ userId: 1, isAnomaly: 1 })
transactionSchema.index({ date: -1 })

module.exports = mongoose.model("Transaction", transactionSchema)