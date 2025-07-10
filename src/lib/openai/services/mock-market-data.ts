/**
 * Mock Market Data Service
 *
 * Comprehensive service for generating realistic market data simulation
 * for testing and development. Provides market conditions, comparables,
 * pricing trends, and negotiation insights without requiring real MLS access.
 */

import { getOpenAIClient, AI_MODELS } from '../client'
import type {
  MarketData,
  Comparable,
  MarketTrend,
} from '../../../shared/types/market-data'

// ========== MOCK DATA TYPES ==========

export interface MockMarketConfig {
  location: {
    city: string
    state: string
    zipCode: string
    neighborhood?: string
  }
  propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family'
  priceRange: {
    min: number
    max: number
    median: number
  }
  marketConditions: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    seasonality: 'peak' | 'normal' | 'slow'
  }
  timeframe: 'current' | '3months' | '6months' | '12months'
}

export interface MockMarketResult {
  marketData: MarketData
  comparables: Comparable[]
  trends: MarketTrend[]
  insights: MarketInsights
}

export interface MarketInsights {
  keyIndicators: {
    medianPrice: number
    averageDaysOnMarket: number
    priceAppreciation: number
    inventoryLevel: number
    absorptionRate: number
  }
  competitionLevel: 'high' | 'medium' | 'low'
  buyerAdvantages: string[]
  sellerAdvantages: string[]
  negotiationFactors: string[]
  recommendations: string[]
}

export interface PropertyComparison {
  subjectProperty: {
    address: string
    price: number
    squareFootage: number
    bedrooms: number
    bathrooms: number
    features: string[]
  }
  comparables: MockComparable[]
  analysis: ComparisonAnalysis
}

export interface MockComparable {
  address: string
  soldPrice: number
  listPrice: number
  squareFootage: number
  bedrooms: number
  bathrooms: number
  daysOnMarket: number
  soldDate: Date
  distance: number
  similarity: number
  adjustments: PropertyAdjustment[]
}

export interface PropertyAdjustment {
  feature: string
  adjustment: number
  reason: string
}

export interface ComparisonAnalysis {
  suggestedPrice: number
  priceRange: { min: number; max: number }
  marketPosition: 'above' | 'at' | 'below'
  competitiveFactors: string[]
  pricingStrategy: string
}

// ========== MOCK DATA GENERATORS ==========

class MockMarketDataGenerator {
  private static generateBaseMarketData(config: MockMarketConfig): MarketData {
    const { location, propertyType, priceRange, marketConditions } = config

    // Generate realistic market metrics based on conditions
    const hotMarketMultiplier =
      marketConditions.trend === 'hot'
        ? 1.3
        : marketConditions.trend === 'cool'
          ? 0.8
          : 1.0

    const inventoryMultiplier =
      marketConditions.inventory === 'low'
        ? 0.7
        : marketConditions.inventory === 'high'
          ? 1.4
          : 1.0

    return {
      id: `market-${Date.now()}`,
      propertyId: `mock-property-${Date.now()}`,
      address: {
        street: '123 Market St',
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        neighborhood: location.neighborhood,
      },
      propertyType,
      listPrice: priceRange.median,
      soldPrice: priceRange.median * (0.95 + Math.random() * 0.1), // 95-105% of list
      squareFootage: 1800 + Math.floor(Math.random() * 1200), // 1800-3000 sq ft
      bedrooms: 3 + Math.floor(Math.random() * 3), // 3-5 bedrooms
      bathrooms: 2 + Math.floor(Math.random() * 2), // 2-3 bathrooms
      lotSize: 6000 + Math.floor(Math.random() * 4000), // 6000-10000 sq ft
      yearBuilt: 1980 + Math.floor(Math.random() * 43), // 1980-2023
      listingDate: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      ), // Last 90 days
      soldDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      daysOnMarket: Math.floor((15 + Math.random() * 45) * inventoryMultiplier), // 15-60 days adjusted
      status: 'sold',
      coordinates: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
      },
      features: this.generatePropertyFeatures(),
      schoolRatings: {
        elementary: 7 + Math.floor(Math.random() * 3), // 7-9
        middle: 6 + Math.floor(Math.random() * 4), // 6-9
        high: 7 + Math.floor(Math.random() * 3), // 7-9
      },
      neighborhood: {
        walkScore: 50 + Math.floor(Math.random() * 40), // 50-90
        transitScore: 30 + Math.floor(Math.random() * 50), // 30-80
        bikeScore: 40 + Math.floor(Math.random() * 40), // 40-80
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  private static generatePropertyFeatures(): string[] {
    const allFeatures = [
      'hardwood floors',
      'granite counters',
      'stainless appliances',
      'fireplace',
      'deck',
      'garage',
      'pool',
      'basement',
      'updated kitchen',
      'master suite',
      'walk-in closets',
      'central air',
      'new roof',
      'fenced yard',
    ]

    const numFeatures = 4 + Math.floor(Math.random() * 6) // 4-9 features
    const features: string[] = []

    while (features.length < numFeatures) {
      const feature =
        allFeatures[Math.floor(Math.random() * allFeatures.length)]
      if (!features.includes(feature)) {
        features.push(feature)
      }
    }

    return features
  }

  private static generateComparables(
    config: MockMarketConfig,
    count: number = 5
  ): Comparable[] {
    const comparables: Comparable[] = []
    const baseProperty = this.generateBaseMarketData(config)

    for (let i = 0; i < count; i++) {
      const variation = 0.8 + Math.random() * 0.4 // 80-120% variation
      const comparable: Comparable = {
        id: `comp-${Date.now()}-${i}`,
        subjectPropertyId: baseProperty.propertyId,
        compPropertyId: `comp-prop-${Date.now()}-${i}`,
        address: {
          street: `${100 + i * 50} ${['Oak', 'Pine', 'Elm', 'Maple'][i % 4]} St`,
          city: config.location.city,
          state: config.location.state,
          zipCode: config.location.zipCode,
        },
        soldPrice: Math.round(baseProperty.soldPrice * variation),
        squareFootage: Math.round(baseProperty.squareFootage * variation),
        bedrooms: baseProperty.bedrooms + (Math.random() > 0.5 ? 1 : -1),
        bathrooms: baseProperty.bathrooms + (Math.random() > 0.7 ? 0.5 : 0),
        daysOnMarket: Math.floor(
          baseProperty.daysOnMarket * (0.7 + Math.random() * 0.6)
        ),
        soldDate: new Date(
          Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
        ),
        distance: Math.round((0.1 + Math.random() * 1.4) * 100) / 100, // 0.1-1.5 miles
        similarity: Math.round((75 + Math.random() * 20) * 100) / 100, // 75-95% similar
        adjustments: this.generateAdjustments(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      comparables.push(comparable)
    }

    return comparables.sort((a, b) => b.similarity - a.similarity)
  }

  private static generateAdjustments(): PropertyAdjustment[] {
    const possibleAdjustments = [
      { feature: 'Square Footage', adjustment: 5000, reason: 'Larger size' },
      { feature: 'Condition', adjustment: -3000, reason: 'Needs updates' },
      { feature: 'Garage', adjustment: 8000, reason: 'Has 2-car garage' },
      { feature: 'Pool', adjustment: 15000, reason: 'In-ground pool' },
      { feature: 'Basement', adjustment: 12000, reason: 'Finished basement' },
      { feature: 'Kitchen', adjustment: 10000, reason: 'Recently renovated' },
      { feature: 'Lot Size', adjustment: 7000, reason: 'Larger lot' },
    ]

    const numAdjustments = 2 + Math.floor(Math.random() * 3) // 2-4 adjustments
    const adjustments: PropertyAdjustment[] = []

    while (adjustments.length < numAdjustments) {
      const adj =
        possibleAdjustments[
          Math.floor(Math.random() * possibleAdjustments.length)
        ]
      if (!adjustments.find(a => a.feature === adj.feature)) {
        adjustments.push({
          ...adj,
          adjustment:
            adj.adjustment *
            (Math.random() > 0.5 ? 1 : -1) *
            (0.7 + Math.random() * 0.6),
        })
      }
    }

    return adjustments
  }

  private static generateMarketTrends(config: MockMarketConfig): MarketTrend[] {
    const trends: MarketTrend[] = []
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    let basePrice = config.priceRange.median
    const trendDirection =
      config.marketConditions.trend === 'hot'
        ? 1
        : config.marketConditions.trend === 'cool'
          ? -1
          : 0

    for (let i = 0; i < 12; i++) {
      const monthlyChange =
        trendDirection * 0.005 + (Math.random() - 0.5) * 0.02 // ±1% monthly
      basePrice *= 1 + monthlyChange

      trends.push({
        id: `trend-${Date.now()}-${i}`,
        location: `${config.location.city}, ${config.location.state}`,
        propertyType: config.propertyType,
        period: `${months[i]} 2024`,
        averagePrice: Math.round(basePrice),
        medianPrice: Math.round(basePrice * 0.95),
        priceChange: monthlyChange,
        volume: 45 + Math.floor(Math.random() * 30), // 45-75 sales
        daysOnMarket: Math.floor(
          (25 + Math.random() * 35) *
            (config.marketConditions.inventory === 'low'
              ? 0.7
              : config.marketConditions.inventory === 'high'
                ? 1.4
                : 1.0)
        ),
        inventory: Math.floor(150 + Math.random() * 100),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return trends
  }

  private static generateMarketInsights(
    config: MockMarketConfig,
    marketData: MarketData,
    comparables: Comparable[],
    trends: MarketTrend[]
  ): MarketInsights {
    const latestTrend = trends[trends.length - 1]
    const priceAppreciation =
      trends.length > 1
        ? ((latestTrend.averagePrice - trends[0].averagePrice) /
            trends[0].averagePrice) *
          100
        : 5

    const competitionLevel =
      config.marketConditions.inventory === 'low' &&
      config.marketConditions.trend === 'hot'
        ? 'high'
        : config.marketConditions.inventory === 'high' &&
            config.marketConditions.trend === 'cool'
          ? 'low'
          : 'medium'

    const buyerAdvantages: string[] = []
    const sellerAdvantages: string[] = []

    if (config.marketConditions.trend === 'cool') {
      buyerAdvantages.push(
        'More inventory to choose from',
        'Longer inspection periods accepted',
        'Price negotiations possible'
      )
    } else if (config.marketConditions.trend === 'hot') {
      sellerAdvantages.push(
        'Multiple offers likely',
        'Quick sales expected',
        'Above asking prices common'
      )
    }

    if (config.marketConditions.inventory === 'low') {
      sellerAdvantages.push(
        'Low competition from other sellers',
        'Buyer urgency high'
      )
    } else if (config.marketConditions.inventory === 'high') {
      buyerAdvantages.push(
        'Sellers more motivated',
        'Price reductions possible'
      )
    }

    return {
      keyIndicators: {
        medianPrice: latestTrend.medianPrice,
        averageDaysOnMarket: latestTrend.daysOnMarket,
        priceAppreciation: Math.round(priceAppreciation * 100) / 100,
        inventoryLevel: latestTrend.inventory,
        absorptionRate:
          Math.round((latestTrend.volume / latestTrend.inventory) * 100) / 100,
      },
      competitionLevel,
      buyerAdvantages,
      sellerAdvantages,
      negotiationFactors: this.generateNegotiationFactors(config),
      recommendations: this.generateRecommendations(config, competitionLevel),
    }
  }

  private static generateNegotiationFactors(
    config: MockMarketConfig
  ): string[] {
    const factors: string[] = []

    if (config.marketConditions.trend === 'hot') {
      factors.push(
        'Time is critical - delays cost money',
        'Cash offers have significant advantage'
      )
    }

    if (config.marketConditions.inventory === 'low') {
      factors.push('Sellers have leverage', 'Backup offers recommended')
    }

    if (config.marketConditions.seasonality === 'peak') {
      factors.push(
        'Peak season - maximum competition',
        'Families motivated by school calendar'
      )
    }

    factors.push(
      'Interest rates affecting buyer qualification',
      'Local economic factors influencing market',
      'Recent sales setting price expectations'
    )

    return factors
  }

  private static generateRecommendations(
    config: MockMarketConfig,
    competitionLevel: 'high' | 'medium' | 'low'
  ): string[] {
    const recommendations: string[] = []

    if (competitionLevel === 'high') {
      recommendations.push(
        'Consider escalation clauses',
        'Minimize contingencies where safe',
        'Be prepared to move quickly on showings'
      )
    } else if (competitionLevel === 'low') {
      recommendations.push(
        'Take time for thorough inspections',
        'Negotiate repairs and improvements',
        'Consider longer closing periods'
      )
    }

    if (config.marketConditions.trend === 'hot') {
      recommendations.push('Price aggressively to attract attention')
    } else if (config.marketConditions.trend === 'cool') {
      recommendations.push('Focus on value and unique features')
    }

    return recommendations
  }

  public static generateMockMarketData(
    config: MockMarketConfig
  ): MockMarketResult {
    const marketData = this.generateBaseMarketData(config)
    const comparables = this.generateComparables(config)
    const trends = this.generateMarketTrends(config)
    const insights = this.generateMarketInsights(
      config,
      marketData,
      comparables,
      trends
    )

    return {
      marketData,
      comparables,
      trends,
      insights,
    }
  }
}

// ========== AI-ENHANCED MARKET ANALYSIS ==========

export class AIMarketAnalysisService {
  /**
   * Generate AI-enhanced market analysis with narrative insights
   */
  static async generateMarketNarrative(
    mockData: MockMarketResult,
    config: MockMarketConfig
  ): Promise<string> {
    const client = getOpenAIClient()

    const context = {
      location: config.location,
      marketConditions: config.marketConditions,
      keyMetrics: mockData.insights.keyIndicators,
      trends: mockData.trends.slice(-3), // Last 3 months
      competitionLevel: mockData.insights.competitionLevel,
    }

    const prompt = `Create a comprehensive market analysis narrative for real estate professionals.
    
Context: ${JSON.stringify(context, null, 2)}

Write a professional market analysis that includes:
1. Current market overview and conditions
2. Key trends and indicators analysis  
3. Competition and inventory assessment
4. Pricing dynamics and appreciation trends
5. Strategic implications for buyers and sellers
6. Negotiation considerations
7. Market outlook and recommendations

Use specific data points and maintain a professional, analytical tone suitable for real estate agents and clients.`

    const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
      systemPrompt: `You are a senior real estate market analyst providing comprehensive market insights. 
        Focus on actionable intelligence and strategic implications for real estate transactions.`,
    })

    return response
  }

  /**
   * Generate property comparison analysis
   */
  static async generatePropertyComparison(
    subjectProperty: any,
    comparables: MockComparable[]
  ): Promise<ComparisonAnalysis> {
    const client = getOpenAIClient()

    const context = {
      subjectProperty,
      comparables: comparables.slice(0, 3), // Top 3 comparables
    }

    const prompt = `Analyze this property against recent comparable sales to determine optimal pricing strategy.

Context: ${JSON.stringify(context, null, 2)}

Provide:
1. Suggested listing/offer price with justification
2. Price range (min/max) based on comparables
3. Market position assessment (above/at/below market)
4. Key competitive factors and differentiators
5. Pricing strategy recommendation

Focus on data-driven analysis and specific dollar amounts.`

    const response = await client.generateJSON<{
      suggestedPrice: number
      priceRange: { min: number; max: number }
      marketPosition: 'above' | 'at' | 'below'
      competitiveFactors: string[]
      pricingStrategy: string
    }>(prompt, {}, AI_MODELS.ANALYSIS, {
      systemPrompt: `You are a professional appraiser analyzing property values. 
        Provide accurate, market-based pricing recommendations in JSON format.`,
    })

    return response
  }

  /**
   * Generate negotiation strategy based on market conditions
   */
  static async generateNegotiationInsights(
    mockData: MockMarketResult,
    offerContext: {
      offerPrice: number
      listPrice: number
      daysOnMarket: number
      buyerPosition: 'strong' | 'average' | 'weak'
    }
  ): Promise<string[]> {
    const client = getOpenAIClient()

    const context = {
      marketInsights: mockData.insights,
      offerContext,
      marketTrend: mockData.trends[mockData.trends.length - 1],
    }

    const prompt = `Generate specific negotiation insights and tactical recommendations based on current market conditions and offer details.

Context: ${JSON.stringify(context, null, 2)}

Provide 5-7 specific negotiation insights that consider:
1. Market leverage (buyer vs seller advantage)
2. Pricing position relative to market
3. Timeline and urgency factors
4. Competitive dynamics
5. Market trend implications
6. Specific tactical recommendations

Format as an array of actionable insight strings.`

    const response = await client.generateJSON<string[]>(
      prompt,
      {},
      AI_MODELS.ANALYSIS,
      {
        systemPrompt: `You are a master real estate negotiator providing tactical insights. 
        Focus on specific, actionable recommendations based on market data.`,
      }
    )

    return response
  }
}

// ========== PRE-CONFIGURED MARKET SCENARIOS ==========

export const MARKET_SCENARIOS = {
  HOT_SELLER_MARKET: {
    location: { city: 'Austin', state: 'TX', zipCode: '78704' },
    propertyType: 'single-family' as const,
    priceRange: { min: 400000, max: 800000, median: 600000 },
    marketConditions: {
      trend: 'hot' as const,
      inventory: 'low' as const,
      seasonality: 'peak' as const,
    },
    timeframe: 'current' as const,
  },

  COOL_BUYER_MARKET: {
    location: { city: 'Phoenix', state: 'AZ', zipCode: '85016' },
    propertyType: 'single-family' as const,
    priceRange: { min: 300000, max: 600000, median: 450000 },
    marketConditions: {
      trend: 'cool' as const,
      inventory: 'high' as const,
      seasonality: 'slow' as const,
    },
    timeframe: 'current' as const,
  },

  BALANCED_MARKET: {
    location: { city: 'Atlanta', state: 'GA', zipCode: '30309' },
    propertyType: 'condo' as const,
    priceRange: { min: 250000, max: 500000, median: 375000 },
    marketConditions: {
      trend: 'warm' as const,
      inventory: 'balanced' as const,
      seasonality: 'normal' as const,
    },
    timeframe: 'current' as const,
  },

  LUXURY_MARKET: {
    location: { city: 'Beverly Hills', state: 'CA', zipCode: '90210' },
    propertyType: 'single-family' as const,
    priceRange: { min: 2000000, max: 5000000, median: 3500000 },
    marketConditions: {
      trend: 'warm' as const,
      inventory: 'low' as const,
      seasonality: 'peak' as const,
    },
    timeframe: 'current' as const,
  },
}

// ========== MAIN SERVICE FUNCTIONS ==========

/**
 * Generate comprehensive mock market data for a given configuration
 */
export const generateMarketData = async (
  config: MockMarketConfig
): Promise<MockMarketResult> => {
  const mockData = MockMarketDataGenerator.generateMockMarketData(config)

  // Enhance with AI-generated narrative
  const narrative = await AIMarketAnalysisService.generateMarketNarrative(
    mockData,
    config
  )

  return {
    ...mockData,
    insights: {
      ...mockData.insights,
      narrative,
    } as any,
  }
}

/**
 * Generate market data for a specific scenario
 */
export const generateScenarioData = async (
  scenarioName: keyof typeof MARKET_SCENARIOS
): Promise<MockMarketResult> => {
  const config = MARKET_SCENARIOS[scenarioName]
  return generateMarketData(config)
}

/**
 * Generate property comparison analysis
 */
export const generatePropertyAnalysis = async (
  subjectProperty: any,
  marketConfig: MockMarketConfig
): Promise<PropertyComparison> => {
  const mockData = MockMarketDataGenerator.generateMockMarketData(marketConfig)
  const comparables = mockData.comparables.slice(0, 5)

  // Convert to MockComparable format
  const mockComparables: MockComparable[] = comparables.map(comp => ({
    address: `${comp.address.street}, ${comp.address.city}`,
    soldPrice: comp.soldPrice || 0,
    listPrice: comp.soldPrice * 1.05, // Assume 5% above list
    squareFootage: comp.squareFootage || 2000,
    bedrooms: comp.bedrooms || 3,
    bathrooms: comp.bathrooms || 2,
    daysOnMarket: comp.daysOnMarket || 30,
    soldDate: comp.soldDate || new Date(),
    distance: comp.distance,
    similarity: comp.similarity,
    adjustments: MockMarketDataGenerator['generateAdjustments'](),
  }))

  const analysis = await AIMarketAnalysisService.generatePropertyComparison(
    subjectProperty,
    mockComparables
  )

  return {
    subjectProperty,
    comparables: mockComparables,
    analysis,
  }
}

/**
 * Generate negotiation insights for an offer
 */
export const generateOfferInsights = async (
  offerDetails: {
    offerPrice: number
    listPrice: number
    daysOnMarket: number
    buyerPosition: 'strong' | 'average' | 'weak'
  },
  marketConfig: MockMarketConfig
): Promise<string[]> => {
  const mockData = MockMarketDataGenerator.generateMockMarketData(marketConfig)
  return AIMarketAnalysisService.generateNegotiationInsights(
    mockData,
    offerDetails
  )
}

/**
 * Get quick market summary for a location
 */
export const getMarketSummary = async (
  city: string,
  state: string,
  propertyType: 'single-family' | 'condo' | 'townhouse' = 'single-family'
): Promise<{
  trend: string
  medianPrice: number
  daysOnMarket: number
  competition: string
  recommendations: string[]
}> => {
  // Use balanced market as default for quick summaries
  const config: MockMarketConfig = {
    location: { city, state, zipCode: '00000' },
    propertyType,
    priceRange: { min: 200000, max: 600000, median: 400000 },
    marketConditions: {
      trend: 'warm',
      inventory: 'balanced',
      seasonality: 'normal',
    },
    timeframe: 'current',
  }

  const mockData = MockMarketDataGenerator.generateMockMarketData(config)

  return {
    trend: config.marketConditions.trend,
    medianPrice: mockData.insights.keyIndicators.medianPrice,
    daysOnMarket: mockData.insights.keyIndicators.averageDaysOnMarket,
    competition: mockData.insights.competitionLevel,
    recommendations: mockData.insights.recommendations,
  }
}

// ========== SERVICE OBJECT ==========

export const MockMarketDataService = {
  generateMarketData,
  generateScenarioData,
  generatePropertyAnalysis,
  generateOfferInsights,
  getMarketSummary,
  MARKET_SCENARIOS,
}

export default MockMarketDataService
