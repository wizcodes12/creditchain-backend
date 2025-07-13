const crypto = require("crypto")
const logger = require("../utils/logger")

class DummyDataService {
  constructor() {
    this.categories = [
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
    ]

    this.merchants = [
      "BigBasket",
      "Swiggy",
      "Zomato",
      "BookMyShow",
      "Uber",
      "Ola",
      "Amazon",
      "Flipkart",
      "Myntra",
      "BPCL",
      "HPCL",
      "Reliance",
      "Apollo Pharmacy",
      "Medplus",
      "HDFC Bank",
      "ICICI Bank",
      "SBI",
      "Axis Bank",
      "Paytm",
      "PhonePe",
      "GPay",
      "IRCTC",
    ]

    this.cities = [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Chennai",
      "Kolkata",
      "Hyderabad",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Lucknow",
    ]

    this.states = [
      "Maharashtra",
      "Delhi",
      "Karnataka",
      "Tamil Nadu",
      "West Bengal",
      "Telangana",
      "Gujarat",
      "Rajasthan",
      "Uttar Pradesh",
    ]

    this.employmentTypes = ["salaried", "self_employed", "business_owner", "freelancer"]
    this.accountTypes = ["savings", "current", "salary"]
    this.loanTypes = ["personal", "home", "car", "education", "business", "gold"]
    this.paymentMethods = ["card", "upi", "netbanking", "cash", "wallet"]
  }

  generateSeed(input, length = 4) {
    const hash = crypto.createHash("md5").update(input).digest("hex")
    return Number.parseInt(hash.substring(0, length), 16)
  }

  generateFinancialProfile(user) {
    try {
      logger.info("Generating financial profile", { userId: user._id })

      // Generate seeds from user data
      const panSeed = this.generateSeed(user.panNumber)
      const aadhaarSeed = this.generateSeed(user.aadhaarNumber)
      const creditCardSeed = this.generateSeed(user.creditCardNumber)

      // Generate age (18-65)
      const age = 18 + (panSeed % 48)

      // Generate salary based on PAN (₹15,000 - ₹5,00,000)
      const salaryMultiplier = 1 + (panSeed % 33)
      const monthlyIncome = 15000 + salaryMultiplier * 15000

      // Generate expenses (70-90% of income)
      const expenseRatio = 0.7 + (aadhaarSeed % 20) / 100
      const monthlyExpenses = Math.floor(monthlyIncome * expenseRatio)

      // Generate employment details
      const employmentType = this.employmentTypes[panSeed % this.employmentTypes.length]
      const experienceYears = Math.min(age - 18, 1 + (panSeed % 30))

      // Generate company name
      const companyNames = [
        "TCS",
        "Infosys",
        "Wipro",
        "HCL",
        "Tech Mahindra",
        "Cognizant",
        "Accenture",
        "IBM",
        "Microsoft",
        "Google",
        "Amazon",
        "Flipkart",
        "Reliance",
        "HDFC Bank",
        "ICICI Bank",
        "SBI",
        "Axis Bank",
      ]
      const companyName = companyNames[panSeed % companyNames.length]

      // Generate designation
      const designations = [
        "Software Engineer",
        "Senior Software Engineer",
        "Team Lead",
        "Project Manager",
        "Business Analyst",
        "Data Scientist",
        "Product Manager",
        "Sales Executive",
        "Marketing Manager",
      ]
      const designation = designations[aadhaarSeed % designations.length]

      // Generate loan details based on Aadhaar
      const loanMultiplier = aadhaarSeed % 25
      const totalLoanAmount = loanMultiplier * 40000
      const monthlyEMI = totalLoanAmount > 0 ? Math.floor(totalLoanAmount * 0.015) : 0
      const activeLoanCount = totalLoanAmount > 0 ? 1 + (aadhaarSeed % 3) : 0
      const loanTypes = activeLoanCount > 0 ? this.loanTypes.slice(0, Math.min(activeLoanCount, 3)) : []

      // Generate credit card details based on credit card number
      const creditLimitMultiplier = 1 + (creditCardSeed % 100)
      const totalCreditLimit = creditLimitMultiplier * 10000
      const currentUtilization = creditCardSeed % 80 // 0-80%
      const utilizationAmount = Math.floor((totalCreditLimit * currentUtilization) / 100)
      const cardCount = totalCreditLimit > 0 ? 1 + (creditCardSeed % 4) : 0

      // Generate bank account details
      const accountType = this.accountTypes[panSeed % this.accountTypes.length]
      const averageBalance = 5000 + (aadhaarSeed % 100) * 5000
      const accountAge = 1 + (creditCardSeed % 15)

      // Generate alternative factors (0-100)
      const digitalPaymentScore = 30 + (panSeed % 70)
      const socialMediaScore = 20 + (aadhaarSeed % 80)
      const appUsageScore = 40 + (creditCardSeed % 60)
      const locationStabilityScore = 50 + (panSeed % 50)
      const phoneUsagePattern = 30 + (aadhaarSeed % 70)

      // Generate behavioral patterns (0-100)
      const paymentRegularity = 60 + (creditCardSeed % 40)
      const transactionFrequency = 40 + (panSeed % 60)
      const financialDiscipline = 50 + (aadhaarSeed % 50)
      const riskTolerance = 30 + (creditCardSeed % 70)

      // Calculate ratios
      const incomeToExpenseRatio = monthlyIncome / monthlyExpenses
      const debtToIncomeRatio = (monthlyEMI / monthlyIncome) * 100
      const creditUtilizationRatio = totalCreditLimit > 0 ? (utilizationAmount / totalCreditLimit) * 100 : 0

      const financialProfile = {
        userId: user._id,
        personalInfo: {
          age,
          monthlyIncome,
          monthlyExpenses,
          employmentType,
          experienceYears,
          companyName,
          designation,
        },
        existingLoans: {
          totalAmount: totalLoanAmount,
          monthlyEMI,
          loanTypes,
          activeLoanCount,
        },
        creditCards: {
          totalLimit: totalCreditLimit,
          currentUtilization,
          utilizationAmount,
          cardCount,
        },
        bankAccounts: {
          accountType,
          averageBalance,
          accountAge,
        },
        alternativeFactors: {
          digitalPaymentScore,
          socialMediaScore,
          appUsageScore,
          locationStabilityScore,
          phoneUsagePattern,
        },
        behavioralPatterns: {
          paymentRegularity,
          transactionFrequency,
          financialDiscipline,
          riskTolerance,
        },
        calculatedRatios: {
          incomeToExpenseRatio,
          debtToIncomeRatio,
          creditUtilizationRatio,
        },
      }

      logger.info("Financial profile generated", {
        userId: user._id,
        monthlyIncome,
        totalLoanAmount,
        totalCreditLimit,
      })

      return financialProfile
    } catch (error) {
      logger.error("Error generating financial profile:", error)
      throw error
    }
  }

  generateTransactions(user, financialProfile, count = 75) {
    try {
      logger.info("Generating transactions", { userId: user._id, count })

      const transactions = []
      const userSeed = this.generateSeed(user._id.toString())
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6) // 6 months ago

      // Calculate daily spending budget
      const dailyBudget = financialProfile.personalInfo.monthlyExpenses / 30

      for (let i = 0; i < count; i++) {
        const transactionSeed = this.generateSeed(`${user._id}_${i}`)

        // Generate random date within last 6 months
        const daysAgo = transactionSeed % 180
        const transactionDate = new Date(startDate)
        transactionDate.setDate(transactionDate.getDate() + daysAgo)

        // Generate time
        const hour = transactionSeed % 24
        const minute = (transactionSeed * 7) % 60
        transactionDate.setHours(hour, minute, 0, 0)

        // Determine if weekend and late night
        const dayOfWeek = transactionDate.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isLateNight = hour >= 22 || hour <= 5

        // Generate transaction type (80% debit, 20% credit)
        const type = transactionSeed % 10 < 8 ? "debit" : "credit"

        // Generate category
        let category
        if (type === "credit") {
          category = ["salary", "investment", "business"][transactionSeed % 3]
        } else {
          category = this.categories[transactionSeed % this.categories.length]
        }

        // Generate amount based on category and user profile
        let amount
        if (type === "credit") {
          if (category === "salary") {
            amount = financialProfile.personalInfo.monthlyIncome
          } else {
            amount = 1000 + (transactionSeed % 50000)
          }
        } else {
          // Debit transaction amounts
          const categoryMultipliers = {
            groceries: 0.15,
            dining: 0.1,
            entertainment: 0.05,
            transportation: 0.08,
            utilities: 0.12,
            healthcare: 0.03,
            education: 0.02,
            shopping: 0.2,
            travel: 0.1,
            fuel: 0.05,
            insurance: 0.03,
            loan_payment: 0.15,
            other: 0.05,
          }

          const baseAmount = dailyBudget * (categoryMultipliers[category] || 0.05)
          const variation = 0.5 + (transactionSeed % 100) / 100 // 0.5 to 1.5
          amount = Math.floor(baseAmount * variation)

          // Ensure minimum amount
          amount = Math.max(amount, 10)
        }

        // Generate merchant
        const merchant = this.merchants[transactionSeed % this.merchants.length]

        // Generate location
        const city = this.cities[transactionSeed % this.cities.length]
        const state = this.states[transactionSeed % this.states.length]
        const latitude = 12.9716 + (transactionSeed % 1000) / 10000 // Around Bangalore
        const longitude = 77.5946 + (transactionSeed % 1000) / 10000

        // Generate payment method
        const paymentMethod = this.paymentMethods[transactionSeed % this.paymentMethods.length]

        // Generate balance (simplified)
        const balanceAfterTransaction = 50000 + (transactionSeed % 200000)

        const transaction = {
          userId: user._id,
          transactionId: `TXN_${user._id}_${Date.now()}_${i}`,
          amount,
          type,
          category,
          subcategory: null,
          date: transactionDate,
          description: `${category} transaction at ${merchant}`,
          merchant,
          balanceAfterTransaction,
          location: {
            latitude,
            longitude,
            city,
            state,
          },
          currency: "INR",
          status: "completed",
          paymentMethod,
          isWeekend,
          isLateNight,
          hourOfDay: hour,
          dayOfWeek,
          isAnomaly: false,
          anomalyScore: 0,
        }

        transactions.push(transaction)
      }

      // Sort transactions by date
      transactions.sort((a, b) => a.date - b.date)

      logger.info("Transactions generated", {
        userId: user._id,
        count: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.type === "debit" ? t.amount : 0), 0),
      })

      return transactions
    } catch (error) {
      logger.error("Error generating transactions:", error)
      throw error
    }
  }

  calculateTransactionMetrics(transactions) {
    try {
      const debitTransactions = transactions.filter((t) => t.type === "debit")
      const creditTransactions = transactions.filter((t) => t.type === "credit")

      const totalTransactionsCount = transactions.length
      const amounts = transactions.map((t) => t.amount)
      const avgTransactionAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const maxTransactionAmount = Math.max(...amounts)
      const minTransactionAmount = Math.min(...amounts)

      // Calculate daily averages
      const dateRange = new Date() - new Date(Math.min(...transactions.map((t) => t.date)))
      const dayCount = Math.ceil(dateRange / (1000 * 60 * 60 * 24))
      const avgDailyTransactions = totalTransactionsCount / dayCount

      // Calculate category spending
      const categorySpending = {}
      debitTransactions.forEach((t) => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
      })

      // Calculate monthly averages (assuming 6 months of data)
      const monthlyMultiplier = 6
      const avgMonthlySpendingGroceries = (categorySpending.groceries || 0) / monthlyMultiplier
      const avgMonthlySpendingDining = (categorySpending.dining || 0) / monthlyMultiplier
      const avgMonthlySpendingEntertainment = (categorySpending.entertainment || 0) / monthlyMultiplier
      const avgMonthlySpendingTransportation = (categorySpending.transportation || 0) / monthlyMultiplier
      const avgMonthlySpendingUtilities = (categorySpending.utilities || 0) / monthlyMultiplier
      const avgMonthlySpendingHealthcare = (categorySpending.healthcare || 0) / monthlyMultiplier
      const avgMonthlySpendingEducation = (categorySpending.education || 0) / monthlyMultiplier
      const avgMonthlySpendingShopping = (categorySpending.shopping || 0) / monthlyMultiplier
      const avgMonthlySpendingTravel = (categorySpending.travel || 0) / monthlyMultiplier
      const avgMonthlySpendingFuel = (categorySpending.fuel || 0) / monthlyMultiplier
      const avgMonthlySpendingInsurance = (categorySpending.insurance || 0) / monthlyMultiplier
      const avgMonthlySpendingLoanPayment = (categorySpending.loan_payment || 0) / monthlyMultiplier

      // Calculate other metrics
      const totalSpending = debitTransactions.reduce((sum, t) => sum + t.amount, 0)
      const needsCategories = ["groceries", "utilities", "healthcare", "loan_payment", "insurance"]
      const needsSpending = debitTransactions
        .filter((t) => needsCategories.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0)
      const percentageSpendingNeedsVsWants = (needsSpending / totalSpending) * 100

      const uniqueMerchants = [...new Set(transactions.map((t) => t.merchant))]
      const numberOfUniqueMerchants = uniqueMerchants.length

      const spreadOfTransactionsAcrossCategories = Object.keys(categorySpending).length

      const weekendTransactions = transactions.filter((t) => t.isWeekend)
      const weekendSpendingPattern = (weekendTransactions.length / totalTransactionsCount) * 100

      const lateNightTransactions = transactions.filter((t) => t.isLateNight)
      const lateNightTransactionFrequency = (lateNightTransactions.length / totalTransactionsCount) * 100

      // Simplified calculations for other metrics
      const loanRepaymentConsistency = categorySpending.loan_payment ? 85 : 0
      const creditCardBillPaymentRegularity = 80 // Assumed
      const recurringTransactionCount = Math.floor(totalTransactionsCount * 0.3)
      const averageTransactionFrequencyPerDay = avgDailyTransactions
      const transactionVelocityPattern = avgDailyTransactions > 2 ? 75 : 50

      return {
        totalTransactionsCount,
        avgTransactionAmount,
        maxTransactionAmount,
        minTransactionAmount,
        numCreditTransactions: creditTransactions.length,
        numDebitTransactions: debitTransactions.length,
        avgDailyTransactions,
        avgMonthlySpendingGroceries,
        avgMonthlySpendingDining,
        avgMonthlySpendingEntertainment,
        avgMonthlySpendingTransportation,
        avgMonthlySpendingUtilities,
        avgMonthlySpendingHealthcare,
        avgMonthlySpendingEducation,
        avgMonthlySpendingShopping,
        avgMonthlySpendingTravel,
        avgMonthlySpendingFuel,
        avgMonthlySpendingInsurance,
        avgMonthlySpendingLoanPayment,
        percentageSpendingNeedsVsWants,
        spreadOfTransactionsAcrossCategories,
        loanRepaymentConsistency,
        creditCardBillPaymentRegularity,
        numberOfUniqueMerchants,
        weekendSpendingPattern,
        lateNightTransactionFrequency,
        recurringTransactionCount,
        averageTransactionFrequencyPerDay,
        transactionVelocityPattern,
      }
    } catch (error) {
      logger.error("Error calculating transaction metrics:", error)
      throw error
    }
  }
}

module.exports = new DummyDataService()
