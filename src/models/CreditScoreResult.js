const mongoose = require("mongoose")

const creditScoreResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creditScore: {
      type: Number,
      required: true,
      min: 300,
      max: 850,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    riskCategory: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "very_poor"],
      required: true,
    },
    scoreBreakdown: {
      paymentHistory: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 35,
        },
      },
      creditUtilization: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 30,
        },
      },
      lengthOfHistory: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 15,
        },
      },
      newCredit: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 10,
        },
      },
      creditMix: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 10,
        },
      },
      alternativeFactors: {
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        weight: {
          type: Number,
          required: true,
          default: 10,
        },
      },
    },
    recommendations: [
      {
        type: String,
        required: true,
      },
    ],
    improvementTips: [
      {
        category: {
          type: String,
          required: true,
        },
        suggestion: {
          type: String,
          required: true,
        },
        impactLevel: {
          type: String,
          enum: ["low", "medium", "high"],
          required: true,
        },
      },
    ],
    transactionAnomalies: [
      {
        transactionId: {
          type: String,
          required: true,
        },
        isAnomaly: {
          type: Boolean,
          required: true,
        },
        anomalyScore: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        fraudRisk: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          required: true,
        },
        detectedPatterns: [
          {
            type: String,
            required: true,
          },
        ],
        riskFactors: [
          {
            factor: {
              type: String,
              required: true,
            },
            weight: {
              type: Number,
              required: true,
              min: 0,
              max: 100,
            },
            description: {
              type: String,
              required: false,
            },
          },
        ],
      },
    ],
    overallAnomalyMetrics: {
      totalTransactionsAnalyzed: {
        type: Number,
        required: true,
      },
      anomalousTransactionsCount: {
        type: Number,
        required: true,
      },
      anomalyRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      avgAnomalyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      highestAnomalyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    blockchainHash: {
      type: String,
      required: false,
    },
    ipfsHash: {
      type: String,
      required: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
creditScoreResultSchema.index({ userId: 1, generatedAt: -1 })
creditScoreResultSchema.index({ blockchainHash: 1 })
creditScoreResultSchema.index({ ipfsHash: 1 })

module.exports = mongoose.model("CreditScoreResult", creditScoreResultSchema)
