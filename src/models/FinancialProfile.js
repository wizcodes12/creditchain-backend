const mongoose = require("mongoose")

const financialProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // This automatically creates a unique index
    },
    personalInfo: {
      age: {
        type: Number,
        required: true,
        min: 18,
        max: 80,
      },
      monthlyIncome: {
        type: Number,
        required: true,
        min: 15000,
        max: 500000,
      },
      monthlyExpenses: {
        type: Number,
        required: true,
        min: 10000,
        max: 400000,
      },
      employmentType: {
        type: String,
        enum: ["salaried", "self_employed", "business_owner", "freelancer"],
        required: true,
      },
      experienceYears: {
        type: Number,
        required: true,
        min: 0,
        max: 50,
      },
      companyName: {
        type: String,
        required: true,
      },
      designation: {
        type: String,
        required: true,
      },
    },
    existingLoans: {
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
        max: 10000000,
      },
      monthlyEMI: {
        type: Number,
        required: true,
        min: 0,
        max: 100000,
      },
      loanTypes: [
        {
          type: String,
          enum: ["personal", "home", "car", "education", "business", "gold"],
        },
      ],
      activeLoanCount: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
      },
    },
    creditCards: {
      totalLimit: {
        type: Number,
        required: true,
        min: 0,
        max: 1000000,
      },
      currentUtilization: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      utilizationAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      cardCount: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
      },
    },
    bankAccounts: {
      accountType: {
        type: String,
        enum: ["savings", "current", "salary"],
        required: true,
      },
      averageBalance: {
        type: Number,
        required: true,
        min: 1000,
        max: 5000000,
      },
      accountAge: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
      },
    },
    alternativeFactors: {
      digitalPaymentScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      socialMediaScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      appUsageScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      locationStabilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      phoneUsagePattern: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    behavioralPatterns: {
      paymentRegularity: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      transactionFrequency: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      financialDiscipline: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      riskTolerance: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    calculatedRatios: {
      incomeToExpenseRatio: {
        type: Number,
        required: true,
        min: 0,
      },
      debtToIncomeRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      creditUtilizationRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    generatedAt: {
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

// Indexes
// NOTE: userId index is automatically created by the 'unique: true' in the schema
// so we don't need to add it again here
financialProfileSchema.index({ generatedAt: -1 })

module.exports = mongoose.model("FinancialProfile", financialProfileSchema)