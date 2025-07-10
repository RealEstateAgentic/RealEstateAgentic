/**
 * Calculation and Formatting Utility Tools for LangChain
 *
 * LangChain tools for mathematical calculations, financial analysis, and formatting utilities
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// ========== FINANCIAL CALCULATION TOOLS ==========

/**
 * Mortgage Payment Calculator Tool
 */
export class MortgagePaymentCalculatorTool extends Tool {
  name = 'mortgage_payment_calculator'
  description =
    'Calculate mortgage payments including principal, interest, taxes, and insurance'

  schema = z.object({
    loanAmount: z.number().describe('Principal loan amount'),
    interestRate: z.number().describe('Annual interest rate (as percentage)'),
    termYears: z.number().describe('Loan term in years'),
    propertyTax: z.number().optional().describe('Annual property tax'),
    homeInsurance: z.number().optional().describe('Annual home insurance'),
    pmi: z.number().optional().describe('Monthly private mortgage insurance'),
    hoaFees: z.number().optional().describe('Monthly HOA fees'),
    downPayment: z.number().optional().describe('Down payment amount'),
    closingCosts: z.number().optional().describe('Closing costs'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        loanAmount,
        interestRate,
        termYears,
        propertyTax = 0,
        homeInsurance = 0,
        pmi = 0,
        hoaFees = 0,
        downPayment = 0,
        closingCosts = 0,
      } = input

      // Calculate monthly payment (principal + interest)
      const monthlyRate = interestRate / 100 / 12
      const numPayments = termYears * 12

      const monthlyPI =
        monthlyRate > 0
          ? (loanAmount *
              monthlyRate *
              Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
          : loanAmount / numPayments

      // Calculate additional monthly costs
      const monthlyPropertyTax = propertyTax / 12
      const monthlyHomeInsurance = homeInsurance / 12
      const monthlyPMI = pmi
      const monthlyHOA = hoaFees

      // Total monthly payment
      const totalMonthlyPayment =
        monthlyPI +
        monthlyPropertyTax +
        monthlyHomeInsurance +
        monthlyPMI +
        monthlyHOA

      // Calculate total cost over life of loan
      const totalInterestPaid = monthlyPI * numPayments - loanAmount
      const totalLoanCost = loanAmount + totalInterestPaid

      // Calculate initial costs
      const totalInitialCosts = downPayment + closingCosts

      // Calculate debt-to-income guidelines
      const recommendedMaxPayment = {
        conservative: totalMonthlyPayment / 0.25, // 25% of income
        moderate: totalMonthlyPayment / 0.28, // 28% of income
        aggressive: totalMonthlyPayment / 0.31, // 31% of income
      }

      // Calculate amortization schedule for first year
      const amortizationSchedule = this.calculateAmortizationSchedule(
        loanAmount,
        monthlyRate,
        numPayments,
        12 // First 12 months
      )

      return JSON.stringify({
        success: true,
        monthlyPayments: {
          principalAndInterest: Math.round(monthlyPI * 100) / 100,
          propertyTax: Math.round(monthlyPropertyTax * 100) / 100,
          homeInsurance: Math.round(monthlyHomeInsurance * 100) / 100,
          pmi: Math.round(monthlyPMI * 100) / 100,
          hoaFees: Math.round(monthlyHOA * 100) / 100,
          totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        },
        loanSummary: {
          loanAmount,
          interestRate,
          termYears,
          totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
          totalLoanCost: Math.round(totalLoanCost * 100) / 100,
          totalInitialCosts: Math.round(totalInitialCosts * 100) / 100,
        },
        affordabilityGuidelines: {
          recommendedMinimumIncome: {
            conservative: Math.round(recommendedMaxPayment.conservative),
            moderate: Math.round(recommendedMaxPayment.moderate),
            aggressive: Math.round(recommendedMaxPayment.aggressive),
          },
          paymentToIncomeRatio: {
            atConservative: 25,
            atModerate: 28,
            atAggressive: 31,
          },
        },
        amortizationFirstYear: amortizationSchedule,
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculateAmortizationSchedule(
    loanAmount: number,
    monthlyRate: number,
    totalPayments: number,
    monthsToShow: number
  ) {
    let remainingBalance = loanAmount
    const schedule = []

    for (let month = 1; month <= monthsToShow; month++) {
      const interestPayment = remainingBalance * monthlyRate
      const principalPayment =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1) -
        interestPayment

      remainingBalance -= principalPayment

      schedule.push({
        month,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        totalPayment:
          Math.round((principalPayment + interestPayment) * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
      })
    }

    return schedule
  }
}

/**
 * Investment Return Calculator Tool
 */
export class InvestmentReturnCalculatorTool extends Tool {
  name = 'investment_return_calculator'
  description =
    'Calculate real estate investment returns and cash flow analysis'

  schema = z.object({
    purchasePrice: z.number().describe('Property purchase price'),
    downPayment: z.number().describe('Down payment amount'),
    monthlyRent: z.number().describe('Monthly rental income'),
    monthlyExpenses: z
      .object({
        mortgage: z.number().describe('Monthly mortgage payment'),
        taxes: z.number().describe('Monthly property taxes'),
        insurance: z.number().describe('Monthly insurance'),
        maintenance: z.number().describe('Monthly maintenance costs'),
        management: z.number().describe('Monthly property management fees'),
        vacancy: z.number().describe('Monthly vacancy allowance'),
        other: z.number().optional().describe('Other monthly expenses'),
      })
      .describe('Monthly operating expenses'),
    closingCosts: z.number().describe('Initial closing costs'),
    renovationCosts: z.number().optional().describe('Initial renovation costs'),
    appreciationRate: z
      .number()
      .optional()
      .describe('Annual appreciation rate percentage'),
    holdingPeriod: z.number().describe('Investment holding period in years'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        purchasePrice,
        downPayment,
        monthlyRent,
        monthlyExpenses,
        closingCosts,
        renovationCosts = 0,
        appreciationRate = 3,
        holdingPeriod,
      } = input

      // Calculate initial investment
      const initialInvestment = downPayment + closingCosts + renovationCosts

      // Calculate monthly cash flow
      const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce(
        (sum, expense) => sum + expense,
        0
      )
      const monthlyCashFlow = monthlyRent - totalMonthlyExpenses

      // Calculate annual figures
      const annualRent = monthlyRent * 12
      const annualExpenses = totalMonthlyExpenses * 12
      const annualCashFlow = monthlyCashFlow * 12

      // Calculate key metrics
      const capRate = (annualCashFlow / purchasePrice) * 100
      const cashOnCashReturn = (annualCashFlow / initialInvestment) * 100
      const grossRentMultiplier = purchasePrice / annualRent
      const onePercentRule = monthlyRent / purchasePrice
      const twoPercentRule = monthlyRent / purchasePrice >= 0.02

      // Calculate projected returns over holding period
      const projectedValue =
        purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriod)
      const totalCashFlow = annualCashFlow * holdingPeriod
      const capitalAppreciation = projectedValue - purchasePrice

      // Calculate total return
      const totalReturn = totalCashFlow + capitalAppreciation
      const totalReturnPercentage = (totalReturn / initialInvestment) * 100
      const annualizedReturn =
        (Math.pow(1 + totalReturnPercentage / 100, 1 / holdingPeriod) - 1) * 100

      // Calculate break-even analysis
      const breakEvenRent = totalMonthlyExpenses
      const breakEvenOccupancy = (totalMonthlyExpenses / monthlyRent) * 100

      return JSON.stringify({
        success: true,
        initialInvestment: {
          downPayment,
          closingCosts,
          renovationCosts,
          totalInitialInvestment: Math.round(initialInvestment * 100) / 100,
        },
        cashFlowAnalysis: {
          monthlyRent,
          monthlyExpenses: totalMonthlyExpenses,
          monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
          annualCashFlow: Math.round(annualCashFlow * 100) / 100,
        },
        keyMetrics: {
          capRate: Math.round(capRate * 100) / 100,
          cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
          grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
          onePercentRule: Math.round(onePercentRule * 10000) / 100, // As percentage
          meetsOnePercentRule: onePercentRule >= 0.01,
          meetsTwoPercentRule: twoPercentRule,
        },
        projectedReturns: {
          holdingPeriod,
          projectedValue: Math.round(projectedValue * 100) / 100,
          totalCashFlow: Math.round(totalCashFlow * 100) / 100,
          capitalAppreciation: Math.round(capitalAppreciation * 100) / 100,
          totalReturn: Math.round(totalReturn * 100) / 100,
          totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100,
          annualizedReturn: Math.round(annualizedReturn * 100) / 100,
        },
        breakEvenAnalysis: {
          breakEvenRent: Math.round(breakEvenRent * 100) / 100,
          breakEvenOccupancy: Math.round(breakEvenOccupancy * 100) / 100,
          cushion:
            Math.round(((monthlyRent - breakEvenRent) / monthlyRent) * 10000) /
            100,
        },
        riskAssessment: {
          leverageRatio:
            Math.round(
              ((purchasePrice - downPayment) / purchasePrice) * 10000
            ) / 100,
          debtServiceCoverage:
            Math.round((annualRent / (monthlyExpenses.mortgage * 12)) * 100) /
            100,
          expenseRatio: Math.round((annualExpenses / annualRent) * 10000) / 100,
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Closing Cost Calculator Tool
 */
export class ClosingCostCalculatorTool extends Tool {
  name = 'closing_cost_calculator'
  description = 'Calculate estimated closing costs for real estate transactions'

  schema = z.object({
    purchasePrice: z.number().describe('Property purchase price'),
    loanAmount: z.number().describe('Loan amount'),
    loanType: z
      .enum(['conventional', 'fha', 'va', 'usda', 'cash'])
      .describe('Type of loan'),
    state: z.string().describe('State where property is located'),
    buyerOrSeller: z
      .enum(['buyer', 'seller'])
      .describe('Perspective for cost calculation'),
    propertyType: z
      .enum(['single_family', 'condo', 'townhouse', 'multi_family'])
      .describe('Property type'),
    isFirstTime: z.boolean().optional().describe('Is this a first-time buyer'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        purchasePrice,
        loanAmount,
        loanType,
        state,
        buyerOrSeller,
        propertyType,
        isFirstTime = false,
      } = input

      const downPayment = purchasePrice - loanAmount
      const costs =
        buyerOrSeller === 'buyer'
          ? this.calculateBuyerCosts(input)
          : this.calculateSellerCosts(input)

      return JSON.stringify({
        success: true,
        perspective: buyerOrSeller,
        transactionDetails: {
          purchasePrice,
          loanAmount,
          downPayment,
          loanType,
          state,
          propertyType,
        },
        costs,
        summary: {
          totalCosts: Math.round(costs.total * 100) / 100,
          percentageOfPurchasePrice:
            Math.round((costs.total / purchasePrice) * 10000) / 100,
          cashNeeded:
            buyerOrSeller === 'buyer'
              ? Math.round((downPayment + costs.total) * 100) / 100
              : null,
        },
        notes: this.generateClosingCostNotes(input),
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculateBuyerCosts(input: any) {
    const { purchasePrice, loanAmount, loanType, state, isFirstTime } = input

    // Loan-related costs
    const loanOriginationFee = loanAmount * 0.005 // 0.5%
    const appraisalFee = 500
    const creditReportFee = 50
    const floodDetermination = 25
    const taxServiceFee = 50
    const processingFee = 400
    const underwritingFee = 500

    // Title and escrow costs
    const titleInsurance = purchasePrice * 0.0035
    const escrowFee = purchasePrice * 0.001
    const recordingFee = 150

    // Prepaid items
    const prepaidInterest = ((loanAmount * 0.05) / 365) * 15 // 15 days at 5%
    const prepaidTaxes = ((purchasePrice * 0.012) / 12) * 3 // 3 months
    const prepaidInsurance = 1200 // Annual premium

    // Inspections
    const homeInspection = 500
    const pestInspection = 100

    // Government fees
    const transferTax = purchasePrice * this.getTransferTaxRate(state)

    // FHA-specific costs
    const fhaUpfrontMIP = loanType === 'fha' ? loanAmount * 0.0175 : 0

    // VA-specific costs
    const vaFundingFee = loanType === 'va' ? loanAmount * 0.023 : 0

    // First-time buyer adjustments
    const firstTimeBuyerCredit = isFirstTime ? -500 : 0

    const costs = {
      loanCosts: {
        originationFee: Math.round(loanOriginationFee * 100) / 100,
        appraisalFee,
        creditReportFee,
        floodDetermination,
        taxServiceFee,
        processingFee,
        underwritingFee,
        fhaUpfrontMIP: Math.round(fhaUpfrontMIP * 100) / 100,
        vaFundingFee: Math.round(vaFundingFee * 100) / 100,
      },
      titleAndEscrow: {
        titleInsurance: Math.round(titleInsurance * 100) / 100,
        escrowFee: Math.round(escrowFee * 100) / 100,
        recordingFee,
      },
      prepaidItems: {
        prepaidInterest: Math.round(prepaidInterest * 100) / 100,
        prepaidTaxes: Math.round(prepaidTaxes * 100) / 100,
        prepaidInsurance,
      },
      inspections: {
        homeInspection,
        pestInspection,
      },
      governmentFees: {
        transferTax: Math.round(transferTax * 100) / 100,
      },
      other: {
        firstTimeBuyerCredit,
      },
    }

    // Calculate total
    const total = Object.values(costs).reduce(
      (sum, category) =>
        sum +
        Object.values(category).reduce((catSum, cost) => catSum + cost, 0),
      0
    )

    return { ...costs, total }
  }

  private calculateSellerCosts(input: any) {
    const { purchasePrice, state } = input

    // Real estate commission
    const buyerAgentCommission = purchasePrice * 0.025 // 2.5%
    const sellerAgentCommission = purchasePrice * 0.025 // 2.5%

    // Title and escrow
    const titleInsurance = purchasePrice * 0.0035
    const escrowFee = purchasePrice * 0.001

    // Government fees
    const transferTax = purchasePrice * this.getTransferTaxRate(state)
    const recordingFee = 150

    // Inspections and repairs
    const homeWarranty = 500
    const concessions = purchasePrice * 0.01 // 1% estimated

    // Payoff costs
    const loanPayoffFee = 300
    const reconveyanceFee = 150

    const costs = {
      commissions: {
        buyerAgentCommission: Math.round(buyerAgentCommission * 100) / 100,
        sellerAgentCommission: Math.round(sellerAgentCommission * 100) / 100,
      },
      titleAndEscrow: {
        titleInsurance: Math.round(titleInsurance * 100) / 100,
        escrowFee: Math.round(escrowFee * 100) / 100,
      },
      governmentFees: {
        transferTax: Math.round(transferTax * 100) / 100,
        recordingFee,
      },
      inspectionsAndRepairs: {
        homeWarranty,
        concessions: Math.round(concessions * 100) / 100,
      },
      loanPayoff: {
        loanPayoffFee,
        reconveyanceFee,
      },
    }

    // Calculate total
    const total = Object.values(costs).reduce(
      (sum, category) =>
        sum +
        Object.values(category).reduce((catSum, cost) => catSum + cost, 0),
      0
    )

    return { ...costs, total }
  }

  private getTransferTaxRate(state: string): number {
    const transferTaxRates: { [key: string]: number } = {
      AL: 0.001,
      AK: 0.0,
      AZ: 0.0,
      AR: 0.0003,
      CA: 0.0011,
      CO: 0.0001,
      CT: 0.0075,
      DE: 0.004,
      FL: 0.007,
      GA: 0.001,
      HI: 0.001,
      ID: 0.0,
      IL: 0.001,
      IN: 0.0,
      IA: 0.0008,
      KS: 0.0026,
      KY: 0.0015,
      LA: 0.0,
      ME: 0.0022,
      MD: 0.005,
      MA: 0.00456,
      MI: 0.0075,
      MN: 0.0033,
      MS: 0.0,
      MO: 0.0,
      MT: 0.0,
      NE: 0.00225,
      NV: 0.0,
      NH: 0.0075,
      NJ: 0.005,
      NM: 0.0,
      NY: 0.004,
      NC: 0.002,
      ND: 0.0,
      OH: 0.0,
      OK: 0.0,
      OR: 0.0,
      PA: 0.01,
      RI: 0.0023,
      SC: 0.00185,
      SD: 0.0,
      TN: 0.0037,
      TX: 0.0,
      UT: 0.0,
      VT: 0.005,
      VA: 0.0025,
      WA: 0.0128,
      WV: 0.0011,
      WI: 0.003,
      WY: 0.0,
    }

    return transferTaxRates[state.toUpperCase()] || 0.001
  }

  private generateClosingCostNotes(input: any) {
    const notes = []

    if (input.loanType === 'fha') {
      notes.push('FHA loans require upfront mortgage insurance premium (MIP)')
    }

    if (input.loanType === 'va') {
      notes.push('VA loans include funding fee but no mortgage insurance')
    }

    if (input.loanType === 'cash') {
      notes.push('Cash purchases eliminate loan-related costs')
    }

    if (input.isFirstTime) {
      notes.push('First-time buyer programs may offer closing cost assistance')
    }

    notes.push(
      'Actual costs may vary based on lender, location, and specific transaction details'
    )

    return notes
  }
}

// ========== FORMATTING TOOLS ==========

/**
 * Currency Formatter Tool
 */
export class CurrencyFormatterTool extends Tool {
  name = 'currency_formatter'
  description =
    'Format numbers as currency with proper formatting and localization'

  schema = z.object({
    amount: z.number().describe('Amount to format'),
    currency: z
      .enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
      .optional()
      .describe('Currency code'),
    locale: z
      .string()
      .optional()
      .describe('Locale for formatting (e.g., en-US, en-GB)'),
    showCents: z.boolean().optional().describe('Whether to show cents'),
    abbreviated: z
      .boolean()
      .optional()
      .describe('Use abbreviated format (K, M, B)'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        amount,
        currency = 'USD',
        locale = 'en-US',
        showCents = true,
        abbreviated = false,
      } = input

      if (abbreviated) {
        const formatted = this.formatAbbreviated(amount, currency)
        return JSON.stringify({
          success: true,
          formatted,
          original: amount,
          currency,
          type: 'abbreviated',
        })
      }

      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
      })

      const formatted = formatter.format(amount)

      return JSON.stringify({
        success: true,
        formatted,
        original: amount,
        currency,
        locale,
        type: 'standard',
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private formatAbbreviated(amount: number, currency: string): string {
    const absAmount = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''

    if (absAmount >= 1000000000) {
      return `${sign}${currency} ${(absAmount / 1000000000).toFixed(1)}B`
    } else if (absAmount >= 1000000) {
      return `${sign}${currency} ${(absAmount / 1000000).toFixed(1)}M`
    } else if (absAmount >= 1000) {
      return `${sign}${currency} ${(absAmount / 1000).toFixed(1)}K`
    } else {
      return `${sign}${currency} ${absAmount.toFixed(0)}`
    }
  }
}

/**
 * Date Formatter Tool
 */
export class DateFormatterTool extends Tool {
  name = 'date_formatter'
  description = 'Format dates in various formats and perform date calculations'

  schema = z.object({
    date: z.string().describe('Date to format (ISO string or common format)'),
    format: z
      .enum(['short', 'medium', 'long', 'full', 'iso', 'relative'])
      .describe('Output format'),
    locale: z.string().optional().describe('Locale for formatting'),
    timezone: z.string().optional().describe('Timezone for formatting'),
    addDays: z.number().optional().describe('Add days to the date'),
    addMonths: z.number().optional().describe('Add months to the date'),
    addYears: z.number().optional().describe('Add years to the date'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        date,
        format,
        locale = 'en-US',
        timezone = 'UTC',
        addDays = 0,
        addMonths = 0,
        addYears = 0,
      } = input

      let dateObj = new Date(date)

      // Add time if specified
      if (addDays) dateObj.setDate(dateObj.getDate() + addDays)
      if (addMonths) dateObj.setMonth(dateObj.getMonth() + addMonths)
      if (addYears) dateObj.setFullYear(dateObj.getFullYear() + addYears)

      let formatted: string

      switch (format) {
        case 'short':
          formatted = dateObj.toLocaleDateString(locale, {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })
          break
        case 'medium':
          formatted = dateObj.toLocaleDateString(locale, {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
          break
        case 'long':
          formatted = dateObj.toLocaleDateString(locale, {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          break
        case 'full':
          formatted = dateObj.toLocaleDateString(locale, {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          break
        case 'iso':
          formatted = dateObj.toISOString()
          break
        case 'relative':
          formatted = this.formatRelativeDate(dateObj)
          break
        default:
          formatted = dateObj.toLocaleDateString(locale, { timeZone: timezone })
      }

      return JSON.stringify({
        success: true,
        formatted,
        original: date,
        processed: dateObj.toISOString(),
        format,
        locale,
        timezone,
        calculations: {
          addDays,
          addMonths,
          addYears,
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private formatRelativeDate(date: Date): string {
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'today'
    if (diffInDays === 1) return 'tomorrow'
    if (diffInDays === -1) return 'yesterday'
    if (diffInDays > 0) return `in ${diffInDays} days`
    if (diffInDays < 0) return `${Math.abs(diffInDays)} days ago`

    return date.toLocaleDateString()
  }
}

/**
 * Number Formatter Tool
 */
export class NumberFormatterTool extends Tool {
  name = 'number_formatter'
  description = 'Format numbers with proper localization and various styles'

  schema = z.object({
    number: z.number().describe('Number to format'),
    style: z
      .enum(['decimal', 'percent', 'scientific', 'ordinal'])
      .describe('Number style'),
    locale: z.string().optional().describe('Locale for formatting'),
    decimals: z.number().optional().describe('Number of decimal places'),
    useGrouping: z.boolean().optional().describe('Use thousand separators'),
    prefix: z.string().optional().describe('Prefix to add'),
    suffix: z.string().optional().describe('Suffix to add'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        number,
        style,
        locale = 'en-US',
        decimals,
        useGrouping = true,
        prefix = '',
        suffix = '',
      } = input

      let formatted: string

      switch (style) {
        case 'decimal':
          const decimalFormatter = new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping,
          })
          formatted = decimalFormatter.format(number)
          break
        case 'percent':
          const percentFormatter = new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals || 2,
            maximumFractionDigits: decimals || 2,
          })
          formatted = percentFormatter.format(number)
          break
        case 'scientific':
          formatted = number.toExponential(decimals || 2)
          break
        case 'ordinal':
          formatted = this.formatOrdinal(number, locale)
          break
        default:
          formatted = number.toString()
      }

      const finalFormatted = `${prefix}${formatted}${suffix}`

      return JSON.stringify({
        success: true,
        formatted: finalFormatted,
        original: number,
        style,
        locale,
        options: {
          decimals,
          useGrouping,
          prefix,
          suffix,
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private formatOrdinal(number: number, locale: string): string {
    const rules = new Intl.PluralRules(locale, { type: 'ordinal' })
    const suffixes = new Map([
      ['one', 'st'],
      ['two', 'nd'],
      ['few', 'rd'],
      ['other', 'th'],
    ])

    const rule = rules.select(number)
    const suffix = suffixes.get(rule) || 'th'

    return `${number}${suffix}`
  }
}

// ========== CALCULATION TOOLS REGISTRY ==========

/**
 * Calculation Tools Registry
 */
export const calculationTools = {
  mortgagePaymentCalculator: new MortgagePaymentCalculatorTool(),
  investmentReturnCalculator: new InvestmentReturnCalculatorTool(),
  closingCostCalculator: new ClosingCostCalculatorTool(),
  currencyFormatter: new CurrencyFormatterTool(),
  dateFormatter: new DateFormatterTool(),
  numberFormatter: new NumberFormatterTool(),
}

/**
 * Get all calculation tools as an array
 */
export const getAllCalculationTools = (): Tool[] => {
  return Object.values(calculationTools)
}

/**
 * Get calculation tools by category
 */
export const getCalculationToolsByCategory = (
  category: 'financial' | 'formatting' | 'utilities'
) => {
  switch (category) {
    case 'financial':
      return [
        calculationTools.mortgagePaymentCalculator,
        calculationTools.investmentReturnCalculator,
        calculationTools.closingCostCalculator,
      ]
    case 'formatting':
      return [
        calculationTools.currencyFormatter,
        calculationTools.dateFormatter,
        calculationTools.numberFormatter,
      ]
    case 'utilities':
      return [calculationTools.dateFormatter, calculationTools.numberFormatter]
    default:
      return []
  }
}
