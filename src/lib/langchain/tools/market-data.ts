/**
 * Market Data Analysis Tools for LangChain
 *
 * LangChain tools for analyzing market data, property values, and competitive landscapes
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// ========== MARKET ANALYSIS TOOLS ==========

/**
 * Calculate Property Value Tool
 */
export class CalculatePropertyValueTool extends Tool {
  name = 'calculate_property_value'
  description =
    'Calculate estimated property value based on market data and comparables'

  schema = z.object({
    property: z
      .object({
        address: z.string().describe('Property address'),
        bedrooms: z.number().describe('Number of bedrooms'),
        bathrooms: z.number().describe('Number of bathrooms'),
        squareFootage: z.number().describe('Square footage'),
        lotSize: z.number().optional().describe('Lot size in square feet'),
        yearBuilt: z.number().optional().describe('Year built'),
        propertyType: z
          .enum(['single_family', 'condo', 'townhouse', 'multi_family'])
          .describe('Property type'),
        features: z.array(z.string()).optional().describe('Special features'),
        condition: z
          .enum(['excellent', 'good', 'fair', 'poor'])
          .describe('Property condition'),
      })
      .describe('Property details'),
    comparables: z
      .array(
        z.object({
          address: z.string().describe('Comparable property address'),
          soldPrice: z.number().describe('Sold price'),
          bedrooms: z.number().describe('Number of bedrooms'),
          bathrooms: z.number().describe('Number of bathrooms'),
          squareFootage: z.number().describe('Square footage'),
          soldDate: z.string().describe('Date sold'),
          daysOnMarket: z.number().describe('Days on market'),
          distance: z.number().describe('Distance in miles'),
        })
      )
      .describe('Comparable properties'),
    marketConditions: z
      .object({
        trend: z
          .enum(['rising', 'stable', 'declining'])
          .describe('Market trend'),
        inventory: z
          .enum(['low', 'normal', 'high'])
          .describe('Inventory level'),
        averageDaysOnMarket: z.number().describe('Average days on market'),
        pricePerSquareFoot: z
          .number()
          .describe('Average price per square foot'),
      })
      .describe('Current market conditions'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { property, comparables, marketConditions } = input

      // Calculate base value from comparables
      const comparableAnalysis = comparables.map(comp => {
        const pricePerSqFt = comp.soldPrice / comp.squareFootage
        const adjustmentFactor = this.calculateAdjustmentFactor(property, comp)
        const adjustedPrice = comp.soldPrice * adjustmentFactor

        return {
          address: comp.address,
          originalPrice: comp.soldPrice,
          pricePerSqFt,
          adjustmentFactor,
          adjustedPrice,
          weight: this.calculateWeight(comp.distance, comp.daysOnMarket),
        }
      })

      // Calculate weighted average value
      const totalWeight = comparableAnalysis.reduce(
        (sum, comp) => sum + comp.weight,
        0
      )
      const weightedValue =
        comparableAnalysis.reduce(
          (sum, comp) => sum + comp.adjustedPrice * comp.weight,
          0
        ) / totalWeight

      // Apply market condition adjustments
      const marketAdjustment = this.calculateMarketAdjustment(marketConditions)
      const finalValue = weightedValue * marketAdjustment

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        comparables.length,
        comparableAnalysis,
        marketConditions
      )

      // Calculate value range
      const valueRange = {
        low: finalValue * 0.95,
        high: finalValue * 1.05,
        mostLikely: finalValue,
      }

      return JSON.stringify({
        success: true,
        estimatedValue: Math.round(finalValue),
        valueRange,
        confidenceScore,
        pricePerSquareFoot: Math.round(finalValue / property.squareFootage),
        comparableAnalysis,
        marketAdjustment,
        methodology:
          'Comparative Market Analysis (CMA) with market adjustments',
        notes: [
          `Based on ${comparables.length} comparable properties`,
          `Market trend: ${marketConditions.trend}`,
          `Inventory level: ${marketConditions.inventory}`,
          `Confidence level: ${confidenceScore}%`,
        ],
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculateAdjustmentFactor(property: any, comparable: any): number {
    let adjustment = 1.0

    // Bedroom adjustment
    const bedroomDiff = property.bedrooms - comparable.bedrooms
    adjustment += bedroomDiff * 0.05

    // Bathroom adjustment
    const bathroomDiff = property.bathrooms - comparable.bathrooms
    adjustment += bathroomDiff * 0.03

    // Square footage adjustment
    const sqftDiff =
      (property.squareFootage - comparable.squareFootage) /
      comparable.squareFootage
    adjustment += sqftDiff * 0.5

    // Condition adjustment
    const conditionAdjustments = {
      excellent: 1.1,
      good: 1.0,
      fair: 0.95,
      poor: 0.85,
    }
    adjustment *= conditionAdjustments[property.condition]

    return Math.max(0.7, Math.min(1.3, adjustment))
  }

  private calculateWeight(distance: number, daysOnMarket: number): number {
    const distanceWeight = Math.max(0.1, 1 - distance * 0.2)
    const timeWeight = Math.max(0.5, 1 - daysOnMarket * 0.01)
    return distanceWeight * timeWeight
  }

  private calculateMarketAdjustment(conditions: any): number {
    let adjustment = 1.0

    // Trend adjustment
    const trendAdjustments = {
      rising: 1.05,
      stable: 1.0,
      declining: 0.95,
    }
    adjustment *= trendAdjustments[conditions.trend]

    // Inventory adjustment
    const inventoryAdjustments = {
      low: 1.03,
      normal: 1.0,
      high: 0.97,
    }
    adjustment *= inventoryAdjustments[conditions.inventory]

    return adjustment
  }

  private calculateConfidenceScore(
    comparableCount: number,
    analysis: any[],
    conditions: any
  ): number {
    let score = 50 // Base score

    // More comparables increase confidence
    score += Math.min(comparableCount * 10, 30)

    // Consistent adjustments increase confidence
    const adjustmentVariance = this.calculateVariance(
      analysis.map(a => a.adjustmentFactor)
    )
    score += Math.max(0, 20 - adjustmentVariance * 100)

    // Stable market conditions increase confidence
    if (conditions.trend === 'stable') score += 10
    if (conditions.inventory === 'normal') score += 10

    return Math.min(95, Math.max(40, Math.round(score)))
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    const variance =
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    return Math.sqrt(variance)
  }
}

/**
 * Market Trend Analysis Tool
 */
export class MarketTrendAnalysisTool extends Tool {
  name = 'market_trend_analysis'
  description = 'Analyze market trends and predict future movements'

  schema = z.object({
    location: z
      .object({
        city: z.string().describe('City name'),
        state: z.string().describe('State abbreviation'),
        zipCode: z.string().optional().describe('ZIP code'),
        neighborhood: z.string().optional().describe('Neighborhood'),
      })
      .describe('Location to analyze'),
    timeframe: z
      .enum(['3_months', '6_months', '1_year', '2_years', '5_years'])
      .describe('Analysis timeframe'),
    propertyType: z
      .enum(['single_family', 'condo', 'townhouse', 'multi_family', 'all'])
      .describe('Property type'),
    dataPoints: z
      .array(
        z.object({
          date: z.string().describe('Date of data point'),
          averagePrice: z.number().describe('Average sale price'),
          medianPrice: z.number().describe('Median sale price'),
          salesVolume: z.number().describe('Number of sales'),
          daysOnMarket: z.number().describe('Average days on market'),
          listToSaleRatio: z.number().describe('List to sale price ratio'),
        })
      )
      .describe('Historical market data points'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { location, timeframe, propertyType, dataPoints } = input

      // Sort data points by date
      const sortedData = dataPoints.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Calculate trend metrics
      const priceChange = this.calculatePriceChange(sortedData)
      const volumeChange = this.calculateVolumeChange(sortedData)
      const marketVelocity = this.calculateMarketVelocity(sortedData)
      const priceVolatility = this.calculatePriceVolatility(sortedData)

      // Determine market phase
      const marketPhase = this.determineMarketPhase(
        priceChange,
        volumeChange,
        marketVelocity
      )

      // Generate forecast
      const forecast = this.generateForecast(
        sortedData,
        priceChange,
        volumeChange
      )

      // Calculate market health score
      const healthScore = this.calculateMarketHealthScore(
        priceChange,
        volumeChange,
        marketVelocity,
        priceVolatility
      )

      // Generate insights
      const insights = this.generateInsights(
        priceChange,
        volumeChange,
        marketVelocity,
        marketPhase,
        healthScore
      )

      return JSON.stringify({
        success: true,
        location,
        timeframe,
        propertyType,
        analysis: {
          priceChange: {
            percentage: priceChange.percentage,
            direction: priceChange.direction,
            annualizedRate: priceChange.annualizedRate,
          },
          volumeChange: {
            percentage: volumeChange.percentage,
            direction: volumeChange.direction,
            trend: volumeChange.trend,
          },
          marketVelocity: {
            averageDaysOnMarket: marketVelocity.averageDaysOnMarket,
            change: marketVelocity.change,
            trend: marketVelocity.trend,
          },
          priceVolatility: {
            coefficient: priceVolatility,
            level:
              priceVolatility > 0.15
                ? 'high'
                : priceVolatility > 0.08
                  ? 'moderate'
                  : 'low',
          },
        },
        marketPhase,
        forecast,
        healthScore,
        insights,
        recommendations: this.generateRecommendations(
          marketPhase,
          healthScore,
          priceChange
        ),
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private calculatePriceChange(data: any[]) {
    const firstPoint = data[0]
    const lastPoint = data[data.length - 1]
    const priceChange =
      (lastPoint.averagePrice - firstPoint.averagePrice) /
      firstPoint.averagePrice
    const timeSpan =
      (new Date(lastPoint.date).getTime() -
        new Date(firstPoint.date).getTime()) /
      (1000 * 60 * 60 * 24 * 365)

    return {
      percentage: priceChange * 100,
      direction:
        priceChange > 0
          ? 'increasing'
          : priceChange < 0
            ? 'decreasing'
            : 'stable',
      annualizedRate: (priceChange / timeSpan) * 100,
    }
  }

  private calculateVolumeChange(data: any[]) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstHalfAvg =
      firstHalf.reduce((sum, d) => sum + d.salesVolume, 0) / firstHalf.length
    const secondHalfAvg =
      secondHalf.reduce((sum, d) => sum + d.salesVolume, 0) / secondHalf.length

    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg

    return {
      percentage: change * 100,
      direction:
        change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      trend:
        change > 0.1
          ? 'strong_increase'
          : change > 0.05
            ? 'moderate_increase'
            : change < -0.1
              ? 'strong_decrease'
              : change < -0.05
                ? 'moderate_decrease'
                : 'stable',
    }
  }

  private calculateMarketVelocity(data: any[]) {
    const recentData = data.slice(-6) // Last 6 months
    const averageDaysOnMarket =
      recentData.reduce((sum, d) => sum + d.daysOnMarket, 0) / recentData.length

    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstHalfAvg =
      firstHalf.reduce((sum, d) => sum + d.daysOnMarket, 0) / firstHalf.length
    const secondHalfAvg =
      secondHalf.reduce((sum, d) => sum + d.daysOnMarket, 0) / secondHalf.length

    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg

    return {
      averageDaysOnMarket,
      change: change * 100,
      trend:
        change < -0.1 ? 'accelerating' : change > 0.1 ? 'slowing' : 'stable',
    }
  }

  private calculatePriceVolatility(data: any[]): number {
    const prices = data.map(d => d.averagePrice)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    return Math.sqrt(variance) / mean
  }

  private determineMarketPhase(
    priceChange: any,
    volumeChange: any,
    marketVelocity: any
  ): string {
    if (
      priceChange.direction === 'increasing' &&
      volumeChange.direction === 'increasing' &&
      marketVelocity.trend === 'accelerating'
    ) {
      return 'expansion'
    } else if (
      priceChange.direction === 'increasing' &&
      volumeChange.direction === 'decreasing'
    ) {
      return 'peak'
    } else if (
      priceChange.direction === 'decreasing' &&
      volumeChange.direction === 'decreasing'
    ) {
      return 'contraction'
    } else if (
      priceChange.direction === 'decreasing' &&
      volumeChange.direction === 'increasing'
    ) {
      return 'recovery'
    } else {
      return 'stable'
    }
  }

  private generateForecast(data: any[], priceChange: any, volumeChange: any) {
    const trend = priceChange.annualizedRate
    const confidence = Math.max(
      0.4,
      Math.min(0.9, 0.7 - Math.abs(trend) * 0.01)
    )

    return {
      nextQuarter: {
        priceChange: trend / 4,
        confidence: confidence,
        direction: trend > 2 ? 'increase' : trend < -2 ? 'decrease' : 'stable',
      },
      nextYear: {
        priceChange: trend,
        confidence: confidence * 0.8,
        direction: trend > 5 ? 'increase' : trend < -5 ? 'decrease' : 'stable',
      },
      risks: this.identifyRisks(priceChange, volumeChange),
      opportunities: this.identifyOpportunities(priceChange, volumeChange),
    }
  }

  private calculateMarketHealthScore(
    priceChange: any,
    volumeChange: any,
    marketVelocity: any,
    volatility: number
  ): number {
    let score = 50

    // Price stability
    if (priceChange.annualizedRate > 0 && priceChange.annualizedRate < 10)
      score += 20
    else if (priceChange.annualizedRate > 10) score += 10
    else if (priceChange.annualizedRate < -5) score -= 15

    // Volume health
    if (volumeChange.direction === 'increasing') score += 15
    else if (volumeChange.direction === 'stable') score += 5
    else score -= 10

    // Market velocity
    if (marketVelocity.trend === 'accelerating') score += 10
    else if (marketVelocity.trend === 'slowing') score -= 5

    // Volatility
    if (volatility < 0.08) score += 10
    else if (volatility > 0.15) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  private generateInsights(
    priceChange: any,
    volumeChange: any,
    marketVelocity: any,
    phase: string,
    healthScore: number
  ) {
    const insights = []

    if (priceChange.annualizedRate > 8) {
      insights.push('Market is experiencing above-average price appreciation')
    }

    if (
      volumeChange.direction === 'decreasing' &&
      priceChange.direction === 'increasing'
    ) {
      insights.push(
        'Price increases may be driven by supply constraints rather than demand'
      )
    }

    if (marketVelocity.trend === 'accelerating') {
      insights.push(
        'Properties are selling faster, indicating strong buyer demand'
      )
    }

    if (phase === 'expansion') {
      insights.push(
        'Market is in expansion phase with growing prices and volume'
      )
    } else if (phase === 'peak') {
      insights.push('Market may be nearing peak conditions')
    }

    if (healthScore > 75) {
      insights.push('Market shows strong fundamentals and stability')
    } else if (healthScore < 40) {
      insights.push('Market shows signs of weakness or instability')
    }

    return insights
  }

  private generateRecommendations(
    phase: string,
    healthScore: number,
    priceChange: any
  ) {
    const recommendations = []

    if (phase === 'expansion') {
      recommendations.push('Consider buying before further price increases')
      recommendations.push(
        'Sellers should capitalize on strong market conditions'
      )
    } else if (phase === 'peak') {
      recommendations.push('Buyers should be cautious and negotiate carefully')
      recommendations.push(
        'Sellers should list properties soon to maximize value'
      )
    } else if (phase === 'contraction') {
      recommendations.push(
        'Buyers may find opportunities with motivated sellers'
      )
      recommendations.push('Sellers should be realistic about pricing')
    }

    if (healthScore > 75) {
      recommendations.push('Market fundamentals support long-term investment')
    } else if (healthScore < 40) {
      recommendations.push('Exercise caution with market timing decisions')
    }

    return recommendations
  }

  private identifyRisks(priceChange: any, volumeChange: any) {
    const risks = []

    if (priceChange.annualizedRate > 15) {
      risks.push('Rapid price appreciation may not be sustainable')
    }

    if (volumeChange.direction === 'decreasing') {
      risks.push('Declining sales volume may indicate weakening demand')
    }

    return risks
  }

  private identifyOpportunities(priceChange: any, volumeChange: any) {
    const opportunities = []

    if (
      priceChange.direction === 'stable' &&
      volumeChange.direction === 'increasing'
    ) {
      opportunities.push(
        'Stable prices with increasing volume suggest healthy market entry point'
      )
    }

    if (
      priceChange.direction === 'decreasing' &&
      volumeChange.direction === 'stable'
    ) {
      opportunities.push('Price corrections may create buying opportunities')
    }

    return opportunities
  }
}

/**
 * Competitive Market Analysis Tool
 */
export class CompetitiveMarketAnalysisTool extends Tool {
  name = 'competitive_market_analysis'
  description = 'Analyze competitive landscape and positioning for a property'

  schema = z.object({
    subjectProperty: z
      .object({
        address: z.string().describe('Property address'),
        listPrice: z.number().describe('Current list price'),
        bedrooms: z.number().describe('Number of bedrooms'),
        bathrooms: z.number().describe('Number of bathrooms'),
        squareFootage: z.number().describe('Square footage'),
        daysOnMarket: z.number().describe('Days on market'),
        features: z.array(z.string()).describe('Property features'),
        condition: z
          .enum(['excellent', 'good', 'fair', 'poor'])
          .describe('Property condition'),
      })
      .describe('Subject property details'),
    activeCompetitors: z
      .array(
        z.object({
          address: z.string().describe('Competitor address'),
          listPrice: z.number().describe('List price'),
          bedrooms: z.number().describe('Number of bedrooms'),
          bathrooms: z.number().describe('Number of bathrooms'),
          squareFootage: z.number().describe('Square footage'),
          daysOnMarket: z.number().describe('Days on market'),
          features: z.array(z.string()).describe('Features'),
          condition: z
            .enum(['excellent', 'good', 'fair', 'poor'])
            .describe('Condition'),
          distance: z.number().describe('Distance in miles'),
        })
      )
      .describe('Active competing properties'),
    marketConditions: z
      .object({
        averageDaysOnMarket: z.number().describe('Average days on market'),
        listToSaleRatio: z.number().describe('List to sale price ratio'),
        inventory: z
          .enum(['low', 'normal', 'high'])
          .describe('Inventory level'),
        seasonality: z
          .enum(['peak', 'normal', 'slow'])
          .describe('Seasonal factor'),
      })
      .describe('Current market conditions'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { subjectProperty, activeCompetitors, marketConditions } = input

      // Analyze pricing position
      const pricingAnalysis = this.analyzePricingPosition(
        subjectProperty,
        activeCompetitors
      )

      // Analyze feature competitiveness
      const featureAnalysis = this.analyzeFeatureCompetitiveness(
        subjectProperty,
        activeCompetitors
      )

      // Analyze market position
      const marketPosition = this.analyzeMarketPosition(
        subjectProperty,
        activeCompetitors,
        marketConditions
      )

      // Generate competitive score
      const competitiveScore = this.calculateCompetitiveScore(
        pricingAnalysis,
        featureAnalysis,
        marketPosition
      )

      // Identify strengths and weaknesses
      const strengths = this.identifyStrengths(
        subjectProperty,
        activeCompetitors
      )
      const weaknesses = this.identifyWeaknesses(
        subjectProperty,
        activeCompetitors
      )

      // Generate recommendations
      const recommendations = this.generateCompetitiveRecommendations(
        pricingAnalysis,
        featureAnalysis,
        marketPosition,
        competitiveScore
      )

      return JSON.stringify({
        success: true,
        subjectProperty: {
          address: subjectProperty.address,
          listPrice: subjectProperty.listPrice,
          daysOnMarket: subjectProperty.daysOnMarket,
        },
        competitiveAnalysis: {
          pricingAnalysis,
          featureAnalysis,
          marketPosition,
          competitiveScore,
          strengths,
          weaknesses,
        },
        recommendations,
        marketInsights: {
          totalActiveCompetitors: activeCompetitors.length,
          averageCompetitorPrice:
            activeCompetitors.reduce((sum, c) => sum + c.listPrice, 0) /
            activeCompetitors.length,
          averageCompetitorDaysOnMarket:
            activeCompetitors.reduce((sum, c) => sum + c.daysOnMarket, 0) /
            activeCompetitors.length,
          priceRange: {
            lowest: Math.min(...activeCompetitors.map(c => c.listPrice)),
            highest: Math.max(...activeCompetitors.map(c => c.listPrice)),
          },
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private analyzePricingPosition(subject: any, competitors: any[]) {
    const prices = competitors.map(c => c.listPrice)
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const medianPrice = prices.sort((a, b) => a - b)[
      Math.floor(prices.length / 2)
    ]

    const pricePosition =
      subject.listPrice < averagePrice
        ? 'below_average'
        : subject.listPrice > averagePrice
          ? 'above_average'
          : 'average'

    const pricePercentile =
      (prices.filter(p => p <= subject.listPrice).length / prices.length) * 100

    return {
      position: pricePosition,
      percentile: pricePercentile,
      differenceFromAverage:
        ((subject.listPrice - averagePrice) / averagePrice) * 100,
      differenceFromMedian:
        ((subject.listPrice - medianPrice) / medianPrice) * 100,
      competitiveAdvantage:
        pricePosition === 'below_average'
          ? 'price_competitive'
          : pricePosition === 'above_average'
            ? 'premium_positioned'
            : 'market_aligned',
    }
  }

  private analyzeFeatureCompetitiveness(subject: any, competitors: any[]) {
    const uniqueFeatures = subject.features.filter(f =>
      competitors.every(c => !c.features.includes(f))
    )

    const commonFeatures = subject.features.filter(f =>
      competitors.some(c => c.features.includes(f))
    )

    const missingFeatures = competitors.reduce((features, c) => {
      c.features.forEach(f => {
        if (!subject.features.includes(f) && !features.includes(f)) {
          features.push(f)
        }
      })
      return features
    }, [] as string[])

    return {
      uniqueFeatures,
      commonFeatures,
      missingFeatures,
      featureAdvantage:
        uniqueFeatures.length > 0 ? 'differentiated' : 'standard',
      totalFeatures: subject.features.length,
      averageCompetitorFeatures:
        competitors.reduce((sum, c) => sum + c.features.length, 0) /
        competitors.length,
    }
  }

  private analyzeMarketPosition(
    subject: any,
    competitors: any[],
    marketConditions: any
  ) {
    const daysOnMarketPosition =
      subject.daysOnMarket < marketConditions.averageDaysOnMarket
        ? 'fresh'
        : subject.daysOnMarket > marketConditions.averageDaysOnMarket * 1.5
          ? 'stale'
          : 'normal'

    const timeOnMarketAdvantage =
      subject.daysOnMarket <
      competitors.reduce((sum, c) => sum + c.daysOnMarket, 0) /
        competitors.length

    return {
      daysOnMarketPosition,
      timeOnMarketAdvantage,
      marketTiming:
        marketConditions.seasonality === 'peak'
          ? 'favorable'
          : marketConditions.seasonality === 'slow'
            ? 'challenging'
            : 'neutral',
      inventoryContext:
        marketConditions.inventory === 'low'
          ? 'seller_favorable'
          : marketConditions.inventory === 'high'
            ? 'buyer_favorable'
            : 'balanced',
    }
  }

  private calculateCompetitiveScore(
    pricingAnalysis: any,
    featureAnalysis: any,
    marketPosition: any
  ): number {
    let score = 50

    // Pricing score
    if (pricingAnalysis.position === 'below_average') score += 15
    else if (pricingAnalysis.position === 'above_average') score -= 5

    // Feature score
    score += featureAnalysis.uniqueFeatures.length * 5
    score -= featureAnalysis.missingFeatures.length * 3

    // Market position score
    if (marketPosition.daysOnMarketPosition === 'fresh') score += 10
    else if (marketPosition.daysOnMarketPosition === 'stale') score -= 15

    if (marketPosition.timeOnMarketAdvantage) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private identifyStrengths(subject: any, competitors: any[]) {
    const strengths = []

    if (subject.condition === 'excellent') {
      strengths.push('Excellent property condition')
    }

    const avgCompetitorPrice =
      competitors.reduce((sum, c) => sum + c.listPrice, 0) / competitors.length
    if (subject.listPrice < avgCompetitorPrice) {
      strengths.push('Competitively priced below market average')
    }

    const avgCompetitorSize =
      competitors.reduce((sum, c) => sum + c.squareFootage, 0) /
      competitors.length
    if (subject.squareFootage > avgCompetitorSize) {
      strengths.push('Larger than average square footage')
    }

    return strengths
  }

  private identifyWeaknesses(subject: any, competitors: any[]) {
    const weaknesses = []

    if (subject.condition === 'poor' || subject.condition === 'fair') {
      weaknesses.push('Property condition needs improvement')
    }

    const avgCompetitorDaysOnMarket =
      competitors.reduce((sum, c) => sum + c.daysOnMarket, 0) /
      competitors.length
    if (subject.daysOnMarket > avgCompetitorDaysOnMarket * 1.5) {
      weaknesses.push('Extended time on market')
    }

    return weaknesses
  }

  private generateCompetitiveRecommendations(
    pricingAnalysis: any,
    featureAnalysis: any,
    marketPosition: any,
    competitiveScore: number
  ) {
    const recommendations = []

    if (pricingAnalysis.position === 'above_average' && competitiveScore < 60) {
      recommendations.push(
        'Consider price reduction to improve competitive position'
      )
    }

    if (featureAnalysis.missingFeatures.length > 0) {
      recommendations.push(
        `Consider highlighting alternative features or amenities to compete with: ${featureAnalysis.missingFeatures.join(', ')}`
      )
    }

    if (marketPosition.daysOnMarketPosition === 'stale') {
      recommendations.push(
        'Refresh marketing strategy or consider price adjustment'
      )
    }

    if (featureAnalysis.uniqueFeatures.length > 0) {
      recommendations.push(
        `Emphasize unique features in marketing: ${featureAnalysis.uniqueFeatures.join(', ')}`
      )
    }

    if (competitiveScore > 75) {
      recommendations.push(
        'Property is well-positioned competitively - maintain current strategy'
      )
    }

    return recommendations
  }
}

/**
 * Market Data Tools Registry
 */
export const marketDataTools = {
  calculatePropertyValue: new CalculatePropertyValueTool(),
  marketTrendAnalysis: new MarketTrendAnalysisTool(),
  competitiveMarketAnalysis: new CompetitiveMarketAnalysisTool(),
}

/**
 * Get all market data tools as an array
 */
export const getAllMarketDataTools = (): Tool[] => {
  return Object.values(marketDataTools)
}

/**
 * Get market data tools by category
 */
export const getMarketDataToolsByCategory = (
  category: 'valuation' | 'trends' | 'competitive'
) => {
  switch (category) {
    case 'valuation':
      return [marketDataTools.calculatePropertyValue]
    case 'trends':
      return [marketDataTools.marketTrendAnalysis]
    case 'competitive':
      return [marketDataTools.competitiveMarketAnalysis]
    default:
      return []
  }
}
