const axios = require("axios")
const logger = require("../utils/logger")
const { getConfig } = require("../config/environment")

class AIModelService {
  constructor() {
    this.config = getConfig()
    this.baseURL = this.config.mlService.url
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  async calculateCreditScore(userProfile, transactionMetrics) {
    try {
      logger.info("Calling credit scoring model", { userId: userProfile.userId })

      const requestData = {
        userProfile: {
          age: userProfile.personalInfo.age,
          monthlyIncome: userProfile.personalInfo.monthlyIncome,
          monthlyExpenses: userProfile.personalInfo.monthlyExpenses,
          employmentType: userProfile.personalInfo.employmentType,
          experienceYears: userProfile.personalInfo.experienceYears,
          companyName: userProfile.personalInfo.companyName,
          existingLoans_totalAmount: userProfile.existingLoans.totalAmount,
          existingLoans_monthlyEMI: userProfile.existingLoans.monthlyEMI,
          existingLoans_loanTypes: userProfile.existingLoans.loanTypes,
          existingLoans_activeLoanCount: userProfile.existingLoans.activeLoanCount,
          creditCards_totalLimit: userProfile.creditCards.totalLimit,
          creditCards_currentUtilization: userProfile.creditCards.currentUtilization,
          creditCards_utilizationAmount: userProfile.creditCards.utilizationAmount,
          creditCards_cardCount: userProfile.creditCards.cardCount,
          bankAccounts_accountType: userProfile.bankAccounts.accountType,
          bankAccounts_averageBalance: userProfile.bankAccounts.averageBalance,
          bankAccounts_accountAge: userProfile.bankAccounts.accountAge,
          digitalPaymentScore: userProfile.alternativeFactors.digitalPaymentScore,
          socialMediaScore: userProfile.alternativeFactors.socialMediaScore,
          appUsageScore: userProfile.alternativeFactors.appUsageScore,
          locationStabilityScore: userProfile.alternativeFactors.locationStabilityScore,
          phoneUsagePattern: userProfile.alternativeFactors.phoneUsagePattern,
          paymentRegularity: userProfile.behavioralPatterns.paymentRegularity,
          transactionFrequency: userProfile.behavioralPatterns.transactionFrequency,
          financialDiscipline: userProfile.behavioralPatterns.financialDiscipline,
          riskTolerance: userProfile.behavioralPatterns.riskTolerance,
          incomeToExpenseRatio: userProfile.calculatedRatios.incomeToExpenseRatio,
          debtToIncomeRatio: userProfile.calculatedRatios.debtToIncomeRatio,
          creditUtilizationRatio: userProfile.calculatedRatios.creditUtilizationRatio,
        },
        transactionMetrics,
      }

      const response = await this.client.post(this.config.mlService.creditEndpoint, requestData)

      logger.info("Credit scoring model response received", {
        userId: userProfile.userId,
        creditScore: response.data.creditScore,
      })

      return response.data
    } catch (error) {
      logger.error("Credit scoring model error:", error)
      throw new Error(`Credit scoring failed: ${error.message}`)
    }
  }

  async detectAnomalies(transactionData, contextualFeatures, userBehavioralContext) {
    try {
      logger.info("Calling anomaly detection model", {
        transactionId: transactionData.transactionId,
      })

      const requestData = {
        transactionData,
        contextualFeatures,
        userBehavioralContext,
      }

      const response = await this.client.post(this.config.mlService.anomalyEndpoint, requestData)

      logger.info("Anomaly detection model response received", {
        transactionId: transactionData.transactionId,
        isAnomaly: response.data.isAnomaly,
        anomalyScore: response.data.anomalyScore,
      })

      return response.data
    } catch (error) {
      logger.error("Anomaly detection model error:", error)
      throw new Error(`Anomaly detection failed: ${error.message}`)
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get(this.config.mlService.healthEndpoint)
      return response.data
    } catch (error) {
      logger.error("ML service health check failed:", error)
      throw new Error(`ML service health check failed: ${error.message}`)
    }
  }
}

module.exports = new AIModelService()
