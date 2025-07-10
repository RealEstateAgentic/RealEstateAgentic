/**
 * Property Analysis Tools for LangChain
 *
 * LangChain tools for analyzing property characteristics, condition, and investment potential
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// ========== PROPERTY ANALYSIS TOOLS ==========

/**
 * Property Condition Assessment Tool
 */
export class PropertyConditionAssessmentTool extends Tool {
  name = 'property_condition_assessment'
  description =
    'Analyze property condition and identify potential issues and improvements'

  schema = z.object({
    property: z
      .object({
        address: z.string().describe('Property address'),
        yearBuilt: z.number().describe('Year property was built'),
        squareFootage: z.number().describe('Total square footage'),
        propertyType: z
          .enum(['single_family', 'condo', 'townhouse', 'multi_family'])
          .describe('Property type'),
        stories: z.number().describe('Number of stories'),
        bedrooms: z.number().describe('Number of bedrooms'),
        bathrooms: z.number().describe('Number of bathrooms'),
        lotSize: z.number().optional().describe('Lot size in square feet'),
        garage: z
          .enum(['none', 'attached', 'detached', 'carport'])
          .optional()
          .describe('Garage type'),
        basement: z
          .enum(['none', 'partial', 'full', 'finished'])
          .optional()
          .describe('Basement type'),
      })
      .describe('Basic property information'),
    condition: z
      .object({
        overall: z
          .enum(['excellent', 'good', 'fair', 'poor'])
          .describe('Overall condition'),
        exterior: z
          .object({
            roofCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Roof condition'),
            roofAge: z.number().optional().describe('Roof age in years'),
            sidingCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Siding condition'),
            foundationCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Foundation condition'),
            windowsCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Windows condition'),
            doorCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Door condition'),
            drivewayCCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .optional()
              .describe('Driveway condition'),
          })
          .describe('Exterior condition details'),
        interior: z
          .object({
            flooringCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Flooring condition'),
            paintCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Paint condition'),
            kitchenCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Kitchen condition'),
            bathroomCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Bathroom condition'),
            fixturesCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Fixtures condition'),
            cabinetCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Cabinet condition'),
          })
          .describe('Interior condition details'),
        systems: z
          .object({
            hvacCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('HVAC condition'),
            hvacAge: z.number().optional().describe('HVAC age in years'),
            plumbingCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Plumbing condition'),
            electricalCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Electrical condition'),
            waterHeaterCondition: z
              .enum(['excellent', 'good', 'fair', 'poor'])
              .describe('Water heater condition'),
            waterHeaterAge: z
              .number()
              .optional()
              .describe('Water heater age in years'),
          })
          .describe('Systems condition details'),
      })
      .describe('Detailed condition assessment'),
    knownIssues: z
      .array(z.string())
      .optional()
      .describe('Known issues or problems'),
    recentUpdates: z
      .array(z.string())
      .optional()
      .describe('Recent updates or renovations'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        property,
        condition,
        knownIssues = [],
        recentUpdates = [],
      } = input

      // Calculate property age
      const currentYear = new Date().getFullYear()
      const propertyAge = currentYear - property.yearBuilt

      // Assess overall condition score
      const conditionScore = this.calculateConditionScore(
        condition,
        propertyAge
      )

      // Identify immediate repair needs
      const immediateRepairs = this.identifyImmediateRepairs(
        condition,
        propertyAge
      )

      // Identify future maintenance needs
      const futureMaintenance = this.identifyFutureMaintenance(
        condition,
        propertyAge
      )

      // Calculate estimated repair costs
      const repairCosts = this.calculateRepairCosts(
        immediateRepairs,
        futureMaintenance,
        property.squareFootage
      )

      // Assess investment potential
      const investmentPotential = this.assessInvestmentPotential(
        conditionScore,
        propertyAge,
        immediateRepairs,
        futureMaintenance,
        repairCosts
      )

      // Generate maintenance timeline
      const maintenanceTimeline = this.generateMaintenanceTimeline(
        condition,
        propertyAge
      )

      // Provide recommendations
      const recommendations = this.generateRecommendations(
        conditionScore,
        immediateRepairs,
        futureMaintenance,
        investmentPotential
      )

      return JSON.stringify({
        success: true,
        property: {
          address: property.address,
          age: propertyAge,
          type: property.propertyType,
          squareFootage: property.squareFootage,
        },
        assessment: {
          overallCondition: condition.overall,
          conditionScore,
          ageCategory: this.categorizeAge(propertyAge),
          marketAppeal: this.assessMarketAppeal(conditionScore, propertyAge),
        },
        repairAnalysis: {
          immediateRepairs,
          futureMaintenance,
          repairCosts,
          priorityLevel: this.calculatePriorityLevel(immediateRepairs),
        },
        investmentAnalysis: {
          investmentPotential,
          riskLevel: this.calculateRiskLevel(
            immediateRepairs,
            futureMaintenance
          ),
          expectedMaintenanceCosts: repairCosts.total,
          costPerSquareFoot:
            Math.round((repairCosts.total / property.squareFootage) * 100) /
            100,
        },
        maintenanceTimeline,
        recommendations,
        additionalConsiderations: {
          knownIssues,
          recentUpdates,
          ageFactors: this.getAgeFactors(propertyAge),
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculateConditionScore(condition: any, propertyAge: number): number {
    const weights = {
      exterior: 0.3,
      interior: 0.3,
      systems: 0.4,
    }

    const conditionValues = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
    }

    // Calculate exterior score
    const exteriorItems = Object.values(condition.exterior)
    const exteriorScore =
      exteriorItems.reduce(
        (sum, item) =>
          sum + conditionValues[item as keyof typeof conditionValues],
        0
      ) / exteriorItems.length

    // Calculate interior score
    const interiorItems = Object.values(condition.interior)
    const interiorScore =
      interiorItems.reduce(
        (sum, item) =>
          sum + conditionValues[item as keyof typeof conditionValues],
        0
      ) / interiorItems.length

    // Calculate systems score
    const systemsItems = Object.values(condition.systems)
    const systemsScore =
      systemsItems.reduce(
        (sum, item) =>
          sum + conditionValues[item as keyof typeof conditionValues],
        0
      ) / systemsItems.length

    // Calculate weighted score
    const weightedScore =
      exteriorScore * weights.exterior +
      interiorScore * weights.interior +
      systemsScore * weights.systems

    // Adjust for age
    const ageAdjustment = propertyAge > 50 ? -0.2 : propertyAge > 30 ? -0.1 : 0

    return Math.max(
      1,
      Math.min(4, Math.round((weightedScore + ageAdjustment) * 100) / 100)
    )
  }

  private identifyImmediateRepairs(
    condition: any,
    propertyAge: number
  ): Array<{ item: string; urgency: string; reason: string }> {
    const repairs = []

    // Check for poor conditions requiring immediate attention
    if (condition.exterior.roofCondition === 'poor') {
      repairs.push({
        item: 'Roof Replacement/Repair',
        urgency: 'high',
        reason:
          'Poor roof condition can lead to water damage and structural issues',
      })
    }

    if (condition.exterior.foundationCondition === 'poor') {
      repairs.push({
        item: 'Foundation Repair',
        urgency: 'high',
        reason:
          'Foundation issues can affect structural integrity and property value',
      })
    }

    if (condition.systems.electricalCondition === 'poor') {
      repairs.push({
        item: 'Electrical System Upgrade',
        urgency: 'high',
        reason:
          'Poor electrical systems pose safety hazards and code violations',
      })
    }

    if (condition.systems.plumbingCondition === 'poor') {
      repairs.push({
        item: 'Plumbing Repairs',
        urgency: 'high',
        reason: 'Plumbing issues can cause water damage and health hazards',
      })
    }

    if (condition.systems.hvacCondition === 'poor') {
      repairs.push({
        item: 'HVAC System Replacement',
        urgency: 'medium',
        reason: 'HVAC system affects habitability and energy efficiency',
      })
    }

    // Check for fair conditions that may need attention
    if (condition.interior.kitchenCondition === 'poor') {
      repairs.push({
        item: 'Kitchen Renovation',
        urgency: 'medium',
        reason:
          'Kitchen condition significantly impacts property value and marketability',
      })
    }

    if (condition.interior.bathroomCondition === 'poor') {
      repairs.push({
        item: 'Bathroom Renovation',
        urgency: 'medium',
        reason: 'Bathroom condition affects daily living and resale value',
      })
    }

    return repairs
  }

  private identifyFutureMaintenance(
    condition: any,
    propertyAge: number
  ): Array<{ item: string; timeframe: string; reason: string }> {
    const maintenance = []

    // Age-based maintenance
    if (condition.exterior.roofAge && condition.exterior.roofAge > 15) {
      maintenance.push({
        item: 'Roof Inspection/Replacement',
        timeframe: '2-5 years',
        reason: 'Roof is approaching typical replacement age',
      })
    }

    if (condition.systems.hvacAge && condition.systems.hvacAge > 12) {
      maintenance.push({
        item: 'HVAC System Replacement',
        timeframe: '3-7 years',
        reason: 'HVAC system is approaching end of useful life',
      })
    }

    if (
      condition.systems.waterHeaterAge &&
      condition.systems.waterHeaterAge > 8
    ) {
      maintenance.push({
        item: 'Water Heater Replacement',
        timeframe: '2-4 years',
        reason: 'Water heater is approaching typical replacement age',
      })
    }

    // Condition-based maintenance
    if (condition.exterior.sidingCondition === 'fair') {
      maintenance.push({
        item: 'Exterior Painting/Siding Repair',
        timeframe: '1-3 years',
        reason: 'Exterior maintenance needed to prevent deterioration',
      })
    }

    if (condition.interior.paintCondition === 'fair') {
      maintenance.push({
        item: 'Interior Painting',
        timeframe: '1-2 years',
        reason: 'Interior refresh needed for appearance and protection',
      })
    }

    if (condition.interior.flooringCondition === 'fair') {
      maintenance.push({
        item: 'Flooring Replacement',
        timeframe: '2-5 years',
        reason: 'Flooring shows wear and may need replacement',
      })
    }

    return maintenance
  }

  private calculateRepairCosts(
    immediateRepairs: any[],
    futureMaintenance: any[],
    squareFootage: number
  ) {
    const costEstimates = {
      'Roof Replacement/Repair': squareFootage * 8,
      'Foundation Repair': 15000,
      'Electrical System Upgrade': squareFootage * 6,
      'Plumbing Repairs': 8000,
      'HVAC System Replacement': squareFootage * 7,
      'Kitchen Renovation': squareFootage * 80,
      'Bathroom Renovation': 15000,
      'Exterior Painting/Siding Repair': squareFootage * 5,
      'Interior Painting': squareFootage * 3,
      'Flooring Replacement': squareFootage * 8,
      'Water Heater Replacement': 1500,
    }

    const immediateCosts = immediateRepairs.reduce((sum, repair) => {
      return (
        sum + (costEstimates[repair.item as keyof typeof costEstimates] || 0)
      )
    }, 0)

    const futureCosts = futureMaintenance.reduce((sum, maintenance) => {
      return (
        sum +
        (costEstimates[maintenance.item as keyof typeof costEstimates] || 0)
      )
    }, 0)

    return {
      immediate: Math.round(immediateCosts),
      future: Math.round(futureCosts),
      total: Math.round(immediateCosts + futureCosts),
    }
  }

  private assessInvestmentPotential(
    conditionScore: number,
    propertyAge: number,
    immediateRepairs: any[],
    futureMaintenance: any[],
    repairCosts: any
  ): string {
    let score = conditionScore

    // Adjust for age
    if (propertyAge > 50) score -= 0.5
    else if (propertyAge > 30) score -= 0.2

    // Adjust for repair needs
    if (immediateRepairs.length > 3) score -= 0.5
    if (repairCosts.immediate > 50000) score -= 0.3

    if (score >= 3.5) return 'excellent'
    if (score >= 3.0) return 'good'
    if (score >= 2.5) return 'fair'
    return 'poor'
  }

  private generateMaintenanceTimeline(condition: any, propertyAge: number) {
    const timeline = {
      '0-6 months': [] as string[],
      '6-12 months': [] as string[],
      '1-2 years': [] as string[],
      '2-5 years': [] as string[],
      '5+ years': [] as string[],
    }

    // Add based on condition
    if (condition.exterior.roofCondition === 'poor') {
      timeline['0-6 months'].push('Roof repair/replacement')
    }

    if (condition.systems.hvacCondition === 'fair') {
      timeline['1-2 years'].push('HVAC system service/replacement')
    }

    if (condition.interior.paintCondition === 'fair') {
      timeline['6-12 months'].push('Interior painting')
    }

    return timeline
  }

  private generateRecommendations(
    conditionScore: number,
    immediateRepairs: any[],
    futureMaintenance: any[],
    investmentPotential: string
  ): string[] {
    const recommendations = []

    if (conditionScore < 2.5) {
      recommendations.push(
        'Consider extensive renovation or pass on this property'
      )
    }

    if (immediateRepairs.length > 0) {
      recommendations.push(
        'Address immediate repair needs before closing or factor into offer price'
      )
    }

    if (investmentPotential === 'excellent') {
      recommendations.push(
        'Strong investment opportunity with minimal repair needs'
      )
    }

    if (futureMaintenance.length > 3) {
      recommendations.push(
        'Budget for ongoing maintenance needs over next 5 years'
      )
    }

    return recommendations
  }

  private categorizeAge(age: number): string {
    if (age < 10) return 'new'
    if (age < 20) return 'modern'
    if (age < 30) return 'established'
    if (age < 50) return 'mature'
    return 'historic'
  }

  private assessMarketAppeal(
    conditionScore: number,
    propertyAge: number
  ): string {
    const ageMultiplier = propertyAge > 50 ? 0.9 : propertyAge > 30 ? 0.95 : 1.0
    const adjustedScore = conditionScore * ageMultiplier

    if (adjustedScore >= 3.5) return 'high'
    if (adjustedScore >= 3.0) return 'moderate'
    if (adjustedScore >= 2.5) return 'low'
    return 'very low'
  }

  private calculatePriorityLevel(immediateRepairs: any[]): string {
    const highPriorityCount = immediateRepairs.filter(
      r => r.urgency === 'high'
    ).length
    const mediumPriorityCount = immediateRepairs.filter(
      r => r.urgency === 'medium'
    ).length

    if (highPriorityCount > 2) return 'critical'
    if (highPriorityCount > 0) return 'high'
    if (mediumPriorityCount > 2) return 'medium'
    return 'low'
  }

  private calculateRiskLevel(
    immediateRepairs: any[],
    futureMaintenance: any[]
  ): string {
    const riskFactors = immediateRepairs.length + futureMaintenance.length * 0.5

    if (riskFactors > 5) return 'high'
    if (riskFactors > 3) return 'medium'
    return 'low'
  }

  private getAgeFactors(age: number): string[] {
    const factors = []

    if (age > 50) {
      factors.push('Historic charm but may require more maintenance')
      factors.push('Potential for outdated electrical and plumbing systems')
      factors.push('May qualify for historic tax credits')
    } else if (age > 30) {
      factors.push('Established neighborhood with mature landscaping')
      factors.push('Systems may be approaching replacement age')
    } else if (age > 15) {
      factors.push('Modern amenities with some wear expected')
      factors.push('Good balance of new and established features')
    } else {
      factors.push('Newer construction with modern systems')
      factors.push('Lower maintenance needs expected')
    }

    return factors
  }
}

/**
 * Investment Property Analysis Tool
 */
export class InvestmentPropertyAnalysisTool extends Tool {
  name = 'investment_property_analysis'
  description =
    'Comprehensive analysis of investment property potential including cash flow, returns, and market factors'

  schema = z.object({
    property: z
      .object({
        address: z.string().describe('Property address'),
        purchasePrice: z.number().describe('Purchase price'),
        squareFootage: z.number().describe('Square footage'),
        bedrooms: z.number().describe('Number of bedrooms'),
        bathrooms: z.number().describe('Number of bathrooms'),
        propertyType: z
          .enum([
            'single_family',
            'duplex',
            'triplex',
            'fourplex',
            'apartment',
            'condo',
          ])
          .describe('Property type'),
        yearBuilt: z.number().describe('Year built'),
        lotSize: z.number().optional().describe('Lot size in square feet'),
        parking: z.number().optional().describe('Number of parking spaces'),
      })
      .describe('Property details'),
    financial: z
      .object({
        downPayment: z.number().describe('Down payment amount'),
        loanAmount: z.number().describe('Loan amount'),
        interestRate: z.number().describe('Interest rate percentage'),
        loanTermYears: z.number().describe('Loan term in years'),
        closingCosts: z.number().describe('Closing costs'),
        renovationCosts: z
          .number()
          .optional()
          .describe('Initial renovation costs'),
        monthlyRent: z.number().describe('Expected monthly rent'),
        monthlyExpenses: z
          .object({
            propertyTax: z.number().describe('Monthly property tax'),
            insurance: z.number().describe('Monthly insurance'),
            maintenance: z.number().describe('Monthly maintenance reserve'),
            vacancy: z.number().describe('Monthly vacancy allowance'),
            propertyManagement: z
              .number()
              .describe('Monthly property management fee'),
            utilities: z
              .number()
              .optional()
              .describe('Monthly utilities (if landlord pays)'),
            hoa: z.number().optional().describe('Monthly HOA fees'),
            other: z.number().optional().describe('Other monthly expenses'),
          })
          .describe('Monthly expenses'),
      })
      .describe('Financial details'),
    market: z
      .object({
        averageRent: z
          .number()
          .describe('Average market rent for similar properties'),
        rentGrowthRate: z
          .number()
          .describe('Annual rent growth rate percentage'),
        appreciationRate: z
          .number()
          .describe('Annual appreciation rate percentage'),
        vacancyRate: z.number().describe('Market vacancy rate percentage'),
        marketCondition: z
          .enum(['hot', 'warm', 'balanced', 'cool', 'cold'])
          .describe('Current market condition'),
        daysOnMarket: z.number().describe('Average days on market'),
        comparableSales: z
          .array(
            z.object({
              address: z.string().describe('Comparable property address'),
              salePrice: z.number().describe('Sale price'),
              saleDate: z.string().describe('Sale date'),
              squareFootage: z.number().describe('Square footage'),
              bedrooms: z.number().describe('Number of bedrooms'),
              bathrooms: z.number().describe('Number of bathrooms'),
            })
          )
          .describe('Comparable sales data'),
      })
      .describe('Market information'),
    goals: z
      .object({
        holdingPeriod: z.number().describe('Intended holding period in years'),
        targetCashFlow: z
          .number()
          .optional()
          .describe('Target monthly cash flow'),
        targetCashOnCashReturn: z
          .number()
          .optional()
          .describe('Target cash-on-cash return percentage'),
        targetCapRate: z
          .number()
          .optional()
          .describe('Target cap rate percentage'),
        exitStrategy: z
          .enum(['hold', 'flip', 'refinance', 'trade_up'])
          .describe('Exit strategy'),
      })
      .describe('Investment goals'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { property, financial, market, goals } = input

      // Calculate mortgage payment
      const monthlyRate = financial.interestRate / 100 / 12
      const numPayments = financial.loanTermYears * 12
      const monthlyMortgage =
        monthlyRate > 0
          ? (financial.loanAmount *
              monthlyRate *
              Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
          : financial.loanAmount / numPayments

      // Calculate total initial investment
      const totalInitialInvestment =
        financial.downPayment +
        financial.closingCosts +
        (financial.renovationCosts || 0)

      // Calculate monthly cash flow
      const totalMonthlyExpenses =
        Object.values(financial.monthlyExpenses).reduce(
          (sum, expense) => sum + (expense || 0),
          0
        ) + monthlyMortgage
      const monthlyCashFlow = financial.monthlyRent - totalMonthlyExpenses

      // Calculate key metrics
      const metrics = this.calculateInvestmentMetrics(
        property,
        financial,
        totalInitialInvestment,
        monthlyCashFlow,
        monthlyMortgage
      )

      // Analyze market position
      const marketAnalysis = this.analyzeMarketPosition(
        financial.monthlyRent,
        market
      )

      // Assess investment risks
      const riskAnalysis = this.assessInvestmentRisks(
        property,
        financial,
        market,
        metrics
      )

      // Generate projections
      const projections = this.generateProjections(
        property,
        financial,
        market,
        goals,
        totalInitialInvestment,
        monthlyCashFlow
      )

      // Compare to goals
      const goalAnalysis = this.compareToGoals(metrics, goals)

      // Generate recommendations
      const recommendations = this.generateInvestmentRecommendations(
        metrics,
        marketAnalysis,
        riskAnalysis,
        goalAnalysis
      )

      return JSON.stringify({
        success: true,
        property: {
          address: property.address,
          purchasePrice: property.purchasePrice,
          type: property.propertyType,
          specs: `${property.bedrooms}bd/${property.bathrooms}ba, ${property.squareFootage} sq ft`,
        },
        initialInvestment: {
          downPayment: financial.downPayment,
          closingCosts: financial.closingCosts,
          renovationCosts: financial.renovationCosts || 0,
          totalInitialInvestment,
        },
        cashFlowAnalysis: {
          monthlyRent: financial.monthlyRent,
          monthlyMortgage: Math.round(monthlyMortgage * 100) / 100,
          monthlyExpenses: totalMonthlyExpenses,
          monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
          annualCashFlow: Math.round(monthlyCashFlow * 12 * 100) / 100,
        },
        investmentMetrics: metrics,
        marketAnalysis,
        riskAnalysis,
        projections,
        goalAnalysis,
        recommendations,
        summary: {
          overallRating: this.calculateOverallRating(
            metrics,
            riskAnalysis,
            goalAnalysis
          ),
          keyStrengths: this.identifyKeyStrengths(metrics, marketAnalysis),
          keyWeaknesses: this.identifyKeyWeaknesses(metrics, riskAnalysis),
          bottomLine: this.generateBottomLine(metrics, goalAnalysis),
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculateInvestmentMetrics(
    property: any,
    financial: any,
    totalInitialInvestment: number,
    monthlyCashFlow: number,
    monthlyMortgage: number
  ) {
    const annualCashFlow = monthlyCashFlow * 12
    const annualRent = financial.monthlyRent * 12
    const totalMonthlyExpenses = Object.values(
      financial.monthlyExpenses
    ).reduce((sum, expense) => sum + (expense || 0), 0)
    const annualExpenses = totalMonthlyExpenses * 12

    return {
      capRate:
        Math.round((annualCashFlow / property.purchasePrice) * 10000) / 100,
      cashOnCashReturn:
        Math.round((annualCashFlow / totalInitialInvestment) * 10000) / 100,
      grossRentMultiplier:
        Math.round((property.purchasePrice / annualRent) * 100) / 100,
      rentToValueRatio:
        Math.round((financial.monthlyRent / property.purchasePrice) * 100000) /
        100,
      debtServiceCoverageRatio:
        Math.round((annualRent / (monthlyMortgage * 12)) * 100) / 100,
      operatingExpenseRatio:
        Math.round((annualExpenses / annualRent) * 10000) / 100,
      breakEvenOccupancy:
        Math.round(
          ((totalMonthlyExpenses + monthlyMortgage) / financial.monthlyRent) *
            10000
        ) / 100,
      pricePerSquareFoot:
        Math.round((property.purchasePrice / property.squareFootage) * 100) /
        100,
      rentPerSquareFoot:
        Math.round((financial.monthlyRent / property.squareFootage) * 100) /
        100,
      netOperatingIncome: Math.round(annualCashFlow + monthlyMortgage * 12),
    }
  }

  private analyzeMarketPosition(monthlyRent: number, market: any) {
    const rentDifference = monthlyRent - market.averageRent
    const rentPercentage = (rentDifference / market.averageRent) * 100

    return {
      rentPosition:
        rentPercentage > 5
          ? 'above_market'
          : rentPercentage < -5
            ? 'below_market'
            : 'market_rate',
      rentDifference: Math.round(rentDifference * 100) / 100,
      rentPercentage: Math.round(rentPercentage * 100) / 100,
      marketCondition: market.marketCondition,
      vacancyRate: market.vacancyRate,
      rentGrowthPotential: market.rentGrowthRate,
      appreciationPotential: market.appreciationRate,
      marketStrength: this.assessMarketStrength(market),
    }
  }

  private assessInvestmentRisks(
    property: any,
    financial: any,
    market: any,
    metrics: any
  ) {
    const risks = []
    let riskLevel = 'low'

    if (metrics.cashOnCashReturn < 8) {
      risks.push('Low cash-on-cash return may not meet investment goals')
      riskLevel = 'medium'
    }

    if (metrics.breakEvenOccupancy > 80) {
      risks.push('High break-even occupancy leaves little room for vacancy')
      riskLevel = 'high'
    }

    if (market.vacancyRate > 10) {
      risks.push('High market vacancy rate increases income risk')
      riskLevel = 'medium'
    }

    if (property.yearBuilt < 1980) {
      risks.push('Older property may require more maintenance and repairs')
    }

    if (financial.downPayment < property.purchasePrice * 0.2) {
      risks.push('Low down payment increases leverage risk')
    }

    if (market.daysOnMarket > 90) {
      risks.push('Slow market may affect future liquidity')
    }

    return {
      riskLevel,
      risks,
      riskScore: this.calculateRiskScore(metrics, market, property),
    }
  }

  private generateProjections(
    property: any,
    financial: any,
    market: any,
    goals: any,
    totalInitialInvestment: number,
    monthlyCashFlow: number
  ) {
    const projections = []

    for (let year = 1; year <= Math.min(goals.holdingPeriod, 10); year++) {
      const inflatedRent =
        financial.monthlyRent * Math.pow(1 + market.rentGrowthRate / 100, year)
      const inflatedValue =
        property.purchasePrice *
        Math.pow(1 + market.appreciationRate / 100, year)
      const cumulativeCashFlow = monthlyCashFlow * 12 * year
      const totalReturn =
        cumulativeCashFlow + (inflatedValue - property.purchasePrice)

      projections.push({
        year,
        monthlyRent: Math.round(inflatedRent * 100) / 100,
        propertyValue: Math.round(inflatedValue * 100) / 100,
        cumulativeCashFlow: Math.round(cumulativeCashFlow * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalReturnPercentage:
          Math.round((totalReturn / totalInitialInvestment) * 10000) / 100,
      })
    }

    return projections
  }

  private compareToGoals(metrics: any, goals: any) {
    const analysis = {
      cashFlowGoalMet:
        !goals.targetCashFlow ||
        metrics.cashOnCashReturn >= goals.targetCashFlow,
      returnGoalMet:
        !goals.targetCashOnCashReturn ||
        metrics.cashOnCashReturn >= goals.targetCashOnCashReturn,
      capRateGoalMet:
        !goals.targetCapRate || metrics.capRate >= goals.targetCapRate,
      overallGoalAlignment: 'good',
    }

    const goalsMetCount = [
      analysis.cashFlowGoalMet,
      analysis.returnGoalMet,
      analysis.capRateGoalMet,
    ].filter(Boolean).length

    if (goalsMetCount === 3) analysis.overallGoalAlignment = 'excellent'
    else if (goalsMetCount === 2) analysis.overallGoalAlignment = 'good'
    else if (goalsMetCount === 1) analysis.overallGoalAlignment = 'fair'
    else analysis.overallGoalAlignment = 'poor'

    return analysis
  }

  private generateInvestmentRecommendations(
    metrics: any,
    marketAnalysis: any,
    riskAnalysis: any,
    goalAnalysis: any
  ): string[] {
    const recommendations = []

    if (goalAnalysis.overallGoalAlignment === 'excellent') {
      recommendations.push(
        'Strong investment opportunity that aligns well with your goals'
      )
    } else if (goalAnalysis.overallGoalAlignment === 'poor') {
      recommendations.push(
        'Consider passing on this property or renegotiating terms'
      )
    }

    if (metrics.cashOnCashReturn < 8) {
      recommendations.push(
        'Consider increasing down payment or negotiating lower purchase price'
      )
    }

    if (riskAnalysis.riskLevel === 'high') {
      recommendations.push(
        'High risk investment - ensure adequate cash reserves'
      )
    }

    if (marketAnalysis.rentPosition === 'below_market') {
      recommendations.push('Rent increase potential may improve returns')
    }

    if (metrics.breakEvenOccupancy > 85) {
      recommendations.push(
        'Consider strategies to reduce expenses or increase rent'
      )
    }

    return recommendations
  }

  private calculateOverallRating(
    metrics: any,
    riskAnalysis: any,
    goalAnalysis: any
  ): string {
    let score = 0

    if (metrics.cashOnCashReturn >= 12) score += 2
    else if (metrics.cashOnCashReturn >= 8) score += 1

    if (metrics.capRate >= 8) score += 2
    else if (metrics.capRate >= 6) score += 1

    if (riskAnalysis.riskLevel === 'low') score += 2
    else if (riskAnalysis.riskLevel === 'medium') score += 1

    if (goalAnalysis.overallGoalAlignment === 'excellent') score += 2
    else if (goalAnalysis.overallGoalAlignment === 'good') score += 1

    if (score >= 7) return 'excellent'
    if (score >= 5) return 'good'
    if (score >= 3) return 'fair'
    return 'poor'
  }

  private identifyKeyStrengths(metrics: any, marketAnalysis: any): string[] {
    const strengths = []

    if (metrics.cashOnCashReturn >= 10) {
      strengths.push('Strong cash-on-cash return')
    }

    if (metrics.capRate >= 8) {
      strengths.push('Excellent cap rate')
    }

    if (marketAnalysis.rentPosition === 'below_market') {
      strengths.push('Rent growth potential')
    }

    if (marketAnalysis.marketCondition === 'hot') {
      strengths.push('Strong market conditions')
    }

    return strengths
  }

  private identifyKeyWeaknesses(metrics: any, riskAnalysis: any): string[] {
    const weaknesses = []

    if (metrics.cashOnCashReturn < 6) {
      weaknesses.push('Low cash-on-cash return')
    }

    if (metrics.breakEvenOccupancy > 85) {
      weaknesses.push('High break-even occupancy')
    }

    if (riskAnalysis.riskLevel === 'high') {
      weaknesses.push('High risk profile')
    }

    return weaknesses
  }

  private generateBottomLine(metrics: any, goalAnalysis: any): string {
    if (
      goalAnalysis.overallGoalAlignment === 'excellent' &&
      metrics.cashOnCashReturn >= 10
    ) {
      return 'Excellent investment opportunity with strong returns and goal alignment'
    } else if (
      goalAnalysis.overallGoalAlignment === 'good' &&
      metrics.cashOnCashReturn >= 8
    ) {
      return 'Good investment opportunity worth considering'
    } else if (metrics.cashOnCashReturn < 6) {
      return 'Returns may not justify the investment risk'
    } else {
      return 'Marginal investment opportunity - consider other options'
    }
  }

  private assessMarketStrength(market: any): string {
    let score = 0

    if (market.marketCondition === 'hot') score += 2
    else if (market.marketCondition === 'warm') score += 1

    if (market.vacancyRate < 5) score += 2
    else if (market.vacancyRate < 8) score += 1

    if (market.rentGrowthRate > 5) score += 2
    else if (market.rentGrowthRate > 3) score += 1

    if (score >= 5) return 'strong'
    if (score >= 3) return 'moderate'
    return 'weak'
  }

  private calculateRiskScore(metrics: any, market: any, property: any): number {
    let score = 0

    if (metrics.breakEvenOccupancy > 85) score += 2
    if (metrics.cashOnCashReturn < 6) score += 2
    if (market.vacancyRate > 10) score += 1
    if (property.yearBuilt < 1980) score += 1

    return score
  }
}

// ========== PROPERTY ANALYSIS TOOLS REGISTRY ==========

/**
 * Property Analysis Tools Registry
 */
export const propertyAnalysisTools = {
  propertyConditionAssessment: new PropertyConditionAssessmentTool(),
  investmentPropertyAnalysis: new InvestmentPropertyAnalysisTool(),
}

/**
 * Get all property analysis tools as an array
 */
export const getAllPropertyAnalysisTools = (): Tool[] => {
  return Object.values(propertyAnalysisTools)
}

/**
 * Get property analysis tools by category
 */
export const getPropertyAnalysisToolsByCategory = (
  category: 'condition' | 'investment' | 'all'
) => {
  switch (category) {
    case 'condition':
      return [propertyAnalysisTools.propertyConditionAssessment]
    case 'investment':
      return [propertyAnalysisTools.investmentPropertyAnalysis]
    case 'all':
    default:
      return getAllPropertyAnalysisTools()
  }
}
