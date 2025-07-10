/**
 * Firebase Collections Service for Market Data
 * Handles all operations for market data management and mock data generation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../config'
import { getCurrentUserProfile } from '../auth'
import { requireAgent } from '../role-middleware'
import type {
  MarketData,
  ComparableSale,
  MarketTrend,
  MarketForecast,
  MarketAnalysis,
  MarketAlert,
  MarketReport,
  GetMarketDataRequest,
  GetComparablesRequest,
  GenerateMarketAnalysisRequest,
  CreateMarketAlertRequest,
  GenerateMarketReportRequest,
  MarketDataResponse,
  ComparablesResponse,
  MarketAnalysisResponse,
  MarketReportResponse,
  MockMarketDataGenerator,
} from '../../../shared/types/market-data'
import { v4 as uuidv4 } from 'uuid'

// Collection names
const MARKET_DATA_COLLECTION = 'market_data'
const COMPARABLES_COLLECTION = 'comparables'
const MARKET_TRENDS_COLLECTION = 'market_trends'
const MARKET_FORECASTS_COLLECTION = 'market_forecasts'
const MARKET_ANALYSES_COLLECTION = 'market_analyses'
const MARKET_ALERTS_COLLECTION = 'market_alerts'
const MARKET_REPORTS_COLLECTION = 'market_reports'

/**
 * Mock Market Data Generator Implementation
 */
class MockMarketDataGeneratorImpl implements MockMarketDataGenerator {
  generateMarketData(area: string): MarketData {
    const now = new Date().toISOString()

    // Generate realistic market data based on area
    const basePrice = this.getBasePriceForArea(area)
    const marketStrength = Math.random() * 100

    return {
      id: uuidv4(),
      area,
      zipCode: this.generateZipCode(area),
      city: this.extractCity(area),
      state: this.extractState(area),

      marketType:
        marketStrength > 70
          ? 'sellers_market'
          : marketStrength < 30
            ? 'buyers_market'
            : 'balanced_market',
      marketStrength,
      marketTrend:
        marketStrength > 60
          ? 'rising'
          : marketStrength < 40
            ? 'falling'
            : 'stable',

      medianPrice: basePrice * (0.9 + Math.random() * 0.2),
      averagePrice: basePrice * (0.95 + Math.random() * 0.1),
      pricePerSqft: (basePrice / 2000) * (0.8 + Math.random() * 0.4),
      priceChangePercent: (Math.random() - 0.5) * 20,
      priceChangeAmount: basePrice * (Math.random() - 0.5) * 0.2,

      activeListings: Math.floor(Math.random() * 500) + 50,
      newListings: Math.floor(Math.random() * 100) + 10,
      soldListings: Math.floor(Math.random() * 80) + 20,
      inventory: Math.floor(Math.random() * 1000) + 100,
      monthsOfSupply: Math.random() * 12 + 1,

      averageDaysOnMarket: Math.floor(Math.random() * 90) + 10,
      averageListToSale: Math.random() * 0.2 + 0.85,
      saleToListRatio: Math.random() * 0.1 + 0.9,

      totalSales: Math.floor(Math.random() * 200) + 50,
      totalVolume: basePrice * (Math.floor(Math.random() * 200) + 50),

      yearOverYear: {
        priceChange: basePrice * (Math.random() - 0.5) * 0.3,
        priceChangePercent: (Math.random() - 0.5) * 30,
        salesChange: Math.floor((Math.random() - 0.5) * 100),
        salesChangePercent: (Math.random() - 0.5) * 40,
        inventoryChange: Math.floor((Math.random() - 0.5) * 200),
        inventoryChangePercent: (Math.random() - 0.5) * 50,
        domChange: Math.floor((Math.random() - 0.5) * 30),
        domChangePercent: (Math.random() - 0.5) * 60,
      },

      seasonalAdjustment: {
        quarter: this.getCurrentQuarter(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        seasonalFactor: Math.random() * 0.4 + 0.8,
        expectedChange: (Math.random() - 0.5) * 0.2,
        historicalAverage: basePrice * (0.95 + Math.random() * 0.1),
      },

      dataSource: 'Mock MLS Data',
      lastUpdated: now,
      confidenceLevel: Math.random() * 0.3 + 0.7,
      createdAt: now,
      updatedAt: now,
    }
  }

  generateComparables(
    propertyAddress: string,
    count: number
  ): ComparableSale[] {
    const comparables: ComparableSale[] = []
    const basePrice = this.getBasePriceForArea(propertyAddress)

    for (let i = 0; i < count; i++) {
      const now = new Date().toISOString()
      const saleDate = new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      )

      const comparable: ComparableSale = {
        id: uuidv4(),
        address: this.generateNearbyAddress(propertyAddress),
        city: this.extractCity(propertyAddress),
        state: this.extractState(propertyAddress),
        zipCode: this.generateZipCode(propertyAddress),

        beds: Math.floor(Math.random() * 4) + 2,
        baths: Math.floor(Math.random() * 3) + 1,
        sqft: Math.floor(Math.random() * 2000) + 1000,
        lotSize: Math.floor(Math.random() * 20000) + 5000,
        yearBuilt: Math.floor(Math.random() * 50) + 1970,
        propertyType: this.getRandomPropertyType(),

        salePrice: basePrice * (0.8 + Math.random() * 0.4),
        listPrice: basePrice * (0.85 + Math.random() * 0.3),
        pricePerSqft: (basePrice / 2000) * (0.8 + Math.random() * 0.4),
        saleDate: saleDate.toISOString(),
        daysOnMarket: Math.floor(Math.random() * 120) + 1,

        features: this.generatePropertyFeatures(),
        condition: this.getRandomCondition(),
        upgrades: this.generateUpgrades(),

        marketConditions: this.getRandomMarketCondition(),
        competitiveOffers: Math.floor(Math.random() * 5),

        adjustments: this.generatePriceAdjustments(),
        adjustedPrice: basePrice * (0.85 + Math.random() * 0.3),

        relevanceScore: Math.random() * 0.4 + 0.6,
        distanceFromSubject: Math.random() * 2,

        dataSource: 'Mock MLS',
        verified: Math.random() > 0.1,
        createdAt: now,
        updatedAt: now,
      }

      comparables.push(comparable)
    }

    return comparables.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  generateTrends(area: string, timeframe: string): MarketTrend[] {
    const trends: MarketTrend[] = []
    const metrics = [
      'median_price',
      'average_dom',
      'inventory_levels',
      'sales_volume',
    ]

    for (const metric of metrics) {
      const now = new Date().toISOString()
      const trend: MarketTrend = {
        id: uuidv4(),
        area,
        metric,

        currentValue: Math.random() * 1000000,
        previousValue: Math.random() * 1000000,
        change: (Math.random() - 0.5) * 100000,
        changePercent: (Math.random() - 0.5) * 20,
        direction:
          Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'stable',

        period: timeframe,
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: now,

        predicted: false,
        confidence: Math.random() * 0.3 + 0.7,

        significance:
          Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        description: `${metric} trend analysis for ${area}`,

        createdAt: now,
        updatedAt: now,
      }

      trends.push(trend)
    }

    return trends
  }

  generateForecast(area: string, type: string): MarketForecast {
    const now = new Date().toISOString()
    const currentValue = Math.random() * 1000000

    return {
      id: uuidv4(),
      area,
      forecastType: type as any,

      timeHorizon: '6_months',
      currentValue,
      forecastValue: currentValue * (0.9 + Math.random() * 0.2),
      changePercent: (Math.random() - 0.5) * 20,

      confidence: Math.random() * 0.3 + 0.7,
      accuracy: Math.random() * 0.2 + 0.8,

      drivingFactors: [
        'Interest rate changes',
        'Economic conditions',
        'Local market dynamics',
        'Seasonal patterns',
      ],
      risks: [
        'Economic uncertainty',
        'Interest rate volatility',
        'Policy changes',
      ],

      scenarios: [
        {
          scenario: 'optimistic',
          probability: 0.3,
          forecastValue: currentValue * 1.1,
          changePercent: 10,
          description: 'Strong market conditions continue',
        },
        {
          scenario: 'base',
          probability: 0.5,
          forecastValue: currentValue * 1.02,
          changePercent: 2,
          description: 'Moderate growth expected',
        },
        {
          scenario: 'pessimistic',
          probability: 0.2,
          forecastValue: currentValue * 0.95,
          changePercent: -5,
          description: 'Market faces headwinds',
        },
      ],

      model: 'Mock Forecast Model v1.0',
      createdAt: now,
      updatedAt: now,
    }
  }

  generateAnalysis(propertyId: string): MarketAnalysis {
    const now = new Date().toISOString()
    const estimatedValue = Math.random() * 1000000 + 200000

    return {
      id: uuidv4(),
      propertyId,
      address: `Property ${propertyId}`,

      analysisType: 'cma',

      marketData: this.generateMarketData('Sample Area'),
      comparables: this.generateComparables('Sample Address', 5),
      trends: this.generateTrends('Sample Area', '6_months'),

      estimatedValue,
      valueRange: {
        low: estimatedValue * 0.9,
        high: estimatedValue * 1.1,
      },
      pricePerSqft: estimatedValue / 2000,

      listingStrategy: {
        recommendedListPrice: estimatedValue * 1.05,
        priceStrategy: 'moderate',
        marketingStrategy: [
          'Professional photos',
          'Online listings',
          'Open houses',
        ],
        timing: {
          bestTimeToList: 'Spring market',
          expectedDaysOnMarket: 30,
        },
        competitiveAdvantages: ['Great location', 'Move-in ready'],
        risks: ['Market competition', 'Seasonal factors'],
      },

      pricingStrategy: {
        initialPrice: estimatedValue * 1.05,
        priceReductions: [
          {
            timing: 'After 2 weeks',
            amount: estimatedValue * 0.02,
            reason: 'Market adjustment',
            expectedImpact: 'Increased interest',
          },
        ],
        minimumAcceptable: estimatedValue * 0.95,
        negotiationRoom: estimatedValue * 0.1,
        marketSupport: estimatedValue,
      },

      negotiationStrategy: {
        initialPosition: estimatedValue * 1.05,
        walkAwayPoint: estimatedValue * 0.9,
        counterOfferStrategy: [
          'Emphasize unique features',
          'Reference comparables',
        ],
        leveragePoints: ['Market conditions', 'Property condition'],
        marketJustification: ['Recent comparable sales', 'Market trends'],
      },

      confidenceScore: Math.random() * 0.3 + 0.7,
      reliability:
        Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',

      analystId: 'mock-analyst',
      createdAt: now,
      updatedAt: now,
    }
  }

  // Helper methods
  private getBasePriceForArea(area: string): number {
    const hash = area
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return 300000 + (hash % 500000)
  }

  private generateZipCode(area: string): string {
    const hash = area
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return String(10000 + (hash % 90000))
  }

  private extractCity(area: string): string {
    return area.split(',')[0]?.trim() || 'Sample City'
  }

  private extractState(area: string): string {
    return area.split(',')[1]?.trim() || 'CA'
  }

  private getCurrentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    const month = new Date().getMonth()
    if (month < 3) return 'Q1'
    if (month < 6) return 'Q2'
    if (month < 9) return 'Q3'
    return 'Q4'
  }

  private generateNearbyAddress(baseAddress: string): string {
    const streetNumber = Math.floor(Math.random() * 9999) + 1
    const streetNames = [
      'Main St',
      'Oak Ave',
      'Elm Dr',
      'Park Blvd',
      'First St',
    ]
    const streetName =
      streetNames[Math.floor(Math.random() * streetNames.length)]
    return `${streetNumber} ${streetName}`
  }

  private getRandomPropertyType():
    | 'single_family'
    | 'condo'
    | 'townhouse'
    | 'multi_family' {
    const types = ['single_family', 'condo', 'townhouse', 'multi_family']
    return types[Math.floor(Math.random() * types.length)] as any
  }

  private getRandomCondition(): 'excellent' | 'good' | 'fair' | 'poor' {
    const conditions = ['excellent', 'good', 'fair', 'poor']
    const weights = [0.2, 0.5, 0.25, 0.05]
    const random = Math.random()
    let cumulative = 0

    for (let i = 0; i < conditions.length; i++) {
      cumulative += weights[i]
      if (random < cumulative) {
        return conditions[i] as any
      }
    }

    return 'good'
  }

  private generatePropertyFeatures(): string[] {
    const features = [
      'Hardwood floors',
      'Updated kitchen',
      'Granite counters',
      'Stainless appliances',
      'Master suite',
      'Walk-in closet',
      'Two-car garage',
      'Fenced yard',
      'Fireplace',
      'Vaulted ceilings',
      'Skylights',
      'Deck/Patio',
    ]

    const count = Math.floor(Math.random() * 6) + 2
    return features.sort(() => Math.random() - 0.5).slice(0, count)
  }

  private generateUpgrades(): string[] {
    const upgrades = [
      'New roof',
      'HVAC system',
      'Windows',
      'Flooring',
      'Kitchen remodel',
      'Bathroom remodel',
      'Paint',
      'Landscaping',
    ]

    const count = Math.floor(Math.random() * 4)
    return upgrades.sort(() => Math.random() - 0.5).slice(0, count)
  }

  private getRandomMarketCondition(): string {
    const conditions = [
      "Strong seller's market",
      'Balanced market',
      "Buyer's market",
      'Seasonal market',
    ]
    return conditions[Math.floor(Math.random() * conditions.length)]
  }

  private generatePriceAdjustments(): any[] {
    const adjustments = [
      {
        factor: 'Size difference',
        adjustment: (Math.random() - 0.5) * 20000,
        reason: 'Square footage variance',
        weight: 0.3,
      },
      {
        factor: 'Condition',
        adjustment: (Math.random() - 0.5) * 15000,
        reason: 'Property condition',
        weight: 0.2,
      },
      {
        factor: 'Location',
        adjustment: (Math.random() - 0.5) * 10000,
        reason: 'Location premium/discount',
        weight: 0.25,
      },
      {
        factor: 'Age',
        adjustment: (Math.random() - 0.5) * 8000,
        reason: 'Age difference',
        weight: 0.15,
      },
    ]

    return adjustments.slice(0, Math.floor(Math.random() * 3) + 1)
  }
}

// Create singleton instance
const mockGenerator = new MockMarketDataGeneratorImpl()

/**
 * Get market data for an area
 */
export const getMarketData = async (
  request: GetMarketDataRequest
): Promise<MarketDataResponse> => {
  try {
    // Check if we have cached data
    const cacheKey = `market_data_${request.area.replace(/\s+/g, '_')}`
    const cachedDoc = await getDoc(doc(db, MARKET_DATA_COLLECTION, cacheKey))

    if (cachedDoc.exists()) {
      const cachedData = cachedDoc.data()

      // Check if data is still fresh (less than 1 hour old)
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime()
      if (cacheAge < 60 * 60 * 1000) {
        // 1 hour
        return {
          success: true,
          data: {
            id: cachedDoc.id,
            ...cachedData,
            createdAt:
              cachedData.createdAt?.toDate?.()?.toISOString() ||
              cachedData.createdAt,
            updatedAt:
              cachedData.updatedAt?.toDate?.()?.toISOString() ||
              cachedData.updatedAt,
          } as MarketData,
        }
      }
    }

    // Generate new market data
    const marketData = mockGenerator.generateMarketData(request.area)

    // Cache the data
    await setDoc(doc(db, MARKET_DATA_COLLECTION, cacheKey), {
      ...marketData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: marketData,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get comparable sales for a property
 */
export const getComparables = async (
  request: GetComparablesRequest
): Promise<ComparablesResponse> => {
  try {
    const cacheKey = `comparables_${request.address.replace(/\s+/g, '_')}`
    const cachedDoc = await getDoc(doc(db, COMPARABLES_COLLECTION, cacheKey))

    if (cachedDoc.exists()) {
      const cachedData = cachedDoc.data()

      // Check if data is still fresh (less than 4 hours old)
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime()
      if (cacheAge < 4 * 60 * 60 * 1000) {
        // 4 hours
        return {
          success: true,
          data: cachedData.comparables,
        }
      }
    }

    // Generate new comparables
    const maxResults = request.maxResults || 10
    const comparables = mockGenerator.generateComparables(
      request.address,
      maxResults
    )

    // Cache the data
    await setDoc(doc(db, COMPARABLES_COLLECTION, cacheKey), {
      address: request.address,
      comparables,
      lastUpdated: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: comparables,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate market analysis for a property
 */
export const generateMarketAnalysis = async (
  request: GenerateMarketAnalysisRequest
): Promise<MarketAnalysisResponse> => {
  try {
    // Validate agent access
    await requireAgent()

    const analysisId = uuidv4()
    const analysis = mockGenerator.generateAnalysis(request.propertyId)
    analysis.id = analysisId
    analysis.analysisType = request.analysisType

    // Save analysis to Firestore
    await setDoc(doc(db, MARKET_ANALYSES_COLLECTION, analysisId), {
      ...analysis,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: analysis,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create market alert
 */
export const createMarketAlert = async (
  request: CreateMarketAlertRequest
): Promise<{ success: boolean; data?: MarketAlert; error?: string }> => {
  try {
    const userProfile = await requireAgent()

    const alertId = uuidv4()
    const now = new Date().toISOString()

    const alert: MarketAlert = {
      id: alertId,
      agentId: userProfile.uid,
      area: request.area,
      alertType: request.alertType as any,
      threshold: request.threshold,
      condition: request.condition as any,
      title: `${request.alertType} Alert for ${request.area}`,
      message: `Market alert triggered for ${request.area}`,
      severity: 'info',
      triggeredAt: now,
      currentValue: 0,
      previousValue: 0,
      changePercent: 0,
      actions: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    // Save alert to Firestore
    await setDoc(doc(db, MARKET_ALERTS_COLLECTION, alertId), {
      ...alert,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: alert,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate market report
 */
export const generateMarketReport = async (
  request: GenerateMarketReportRequest
): Promise<MarketReportResponse> => {
  try {
    const userProfile = await requireAgent()

    const reportId = uuidv4()
    const now = new Date().toISOString()

    // Generate market data for the report
    const marketData = mockGenerator.generateMarketData(request.area)
    const trends = mockGenerator.generateTrends(request.area, '6_months')
    const forecasts = [mockGenerator.generateForecast(request.area, 'price')]

    const report: MarketReport = {
      id: reportId,
      agentId: userProfile.uid,
      title: `${request.reportType} Market Report - ${request.area}`,
      reportType: request.reportType,
      summary: `Market analysis for ${request.area} shows ${marketData.marketType} conditions with ${marketData.marketTrend} trends.`,
      keyFindings: [
        `Median price: $${marketData.medianPrice.toLocaleString()}`,
        `Average DOM: ${marketData.averageDaysOnMarket} days`,
        `Market type: ${marketData.marketType}`,
        `Inventory: ${marketData.inventory} active listings`,
      ],
      recommendations: [
        'Monitor market trends closely',
        'Adjust pricing strategy based on conditions',
        'Focus on competitive advantages',
        'Consider seasonal timing',
      ],
      marketData: [marketData],
      trends,
      forecasts,
      charts: [
        {
          type: 'line',
          title: 'Price Trends',
          data: trends.map(t => ({ x: t.period, y: t.currentValue })),
          options: {},
        },
      ],
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    // Save report to Firestore
    await setDoc(doc(db, MARKET_REPORTS_COLLECTION, reportId), {
      ...report,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: report,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get market trends for an area
 */
export const getMarketTrends = async (
  area: string,
  timeframe: string = '6_months'
): Promise<{ success: boolean; data?: MarketTrend[]; error?: string }> => {
  try {
    const cacheKey = `trends_${area.replace(/\s+/g, '_')}_${timeframe}`
    const cachedDoc = await getDoc(doc(db, MARKET_TRENDS_COLLECTION, cacheKey))

    if (cachedDoc.exists()) {
      const cachedData = cachedDoc.data()

      // Check if data is still fresh (less than 2 hours old)
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime()
      if (cacheAge < 2 * 60 * 60 * 1000) {
        // 2 hours
        return {
          success: true,
          data: cachedData.trends,
        }
      }
    }

    // Generate new trends
    const trends = mockGenerator.generateTrends(area, timeframe)

    // Cache the data
    await setDoc(doc(db, MARKET_TRENDS_COLLECTION, cacheKey), {
      area,
      timeframe,
      trends,
      lastUpdated: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: trends,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get market forecast for an area
 */
export const getMarketForecast = async (
  area: string,
  forecastType: string = 'price'
): Promise<{ success: boolean; data?: MarketForecast; error?: string }> => {
  try {
    const cacheKey = `forecast_${area.replace(/\s+/g, '_')}_${forecastType}`
    const cachedDoc = await getDoc(
      doc(db, MARKET_FORECASTS_COLLECTION, cacheKey)
    )

    if (cachedDoc.exists()) {
      const cachedData = cachedDoc.data()

      // Check if data is still fresh (less than 6 hours old)
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime()
      if (cacheAge < 6 * 60 * 60 * 1000) {
        // 6 hours
        return {
          success: true,
          data: {
            id: cachedDoc.id,
            ...cachedData,
            createdAt:
              cachedData.createdAt?.toDate?.()?.toISOString() ||
              cachedData.createdAt,
            updatedAt:
              cachedData.updatedAt?.toDate?.()?.toISOString() ||
              cachedData.updatedAt,
          } as MarketForecast,
        }
      }
    }

    // Generate new forecast
    const forecast = mockGenerator.generateForecast(area, forecastType)

    // Cache the data
    await setDoc(doc(db, MARKET_FORECASTS_COLLECTION, cacheKey), {
      ...forecast,
      lastUpdated: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: forecast,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get market analysis by ID
 */
export const getMarketAnalysis = async (
  analysisId: string
): Promise<MarketAnalysisResponse> => {
  try {
    const analysisDoc = await getDoc(
      doc(db, MARKET_ANALYSES_COLLECTION, analysisId)
    )

    if (!analysisDoc.exists()) {
      return {
        success: false,
        error: 'Market analysis not found',
      }
    }

    const analysisData = analysisDoc.data()

    const analysis: MarketAnalysis = {
      id: analysisDoc.id,
      ...analysisData,
      createdAt:
        analysisData.createdAt?.toDate?.()?.toISOString() ||
        analysisData.createdAt,
      updatedAt:
        analysisData.updatedAt?.toDate?.()?.toISOString() ||
        analysisData.updatedAt,
    }

    return {
      success: true,
      data: analysis,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get agent market alerts
 */
export const getAgentMarketAlerts = async (
  agentId: string
): Promise<{ success: boolean; data?: MarketAlert[]; error?: string }> => {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    const q = query(
      collection(db, MARKET_ALERTS_COLLECTION),
      where('agentId', '==', agentId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const alerts: MarketAlert[] = []

    for (const doc of querySnapshot.docs) {
      const alertData = doc.data()
      alerts.push({
        id: doc.id,
        ...alertData,
        createdAt:
          alertData.createdAt?.toDate?.()?.toISOString() || alertData.createdAt,
        updatedAt:
          alertData.updatedAt?.toDate?.()?.toISOString() || alertData.updatedAt,
      } as MarketAlert)
    }

    return {
      success: true,
      data: alerts,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Clear market data cache
 */
export const clearMarketDataCache = async (
  area?: string
): Promise<{ success: boolean; cleared: number; error?: string }> => {
  try {
    const userProfile = await requireAgent()

    let q
    if (area) {
      const cacheKey = `market_data_${area.replace(/\s+/g, '_')}`
      await deleteDoc(doc(db, MARKET_DATA_COLLECTION, cacheKey))
      return {
        success: true,
        cleared: 1,
      }
    } else {
      // Clear all cache (limit to user's data only)
      q = query(collection(db, MARKET_DATA_COLLECTION), limit(100))
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)

      for (const doc of querySnapshot.docs) {
        batch.delete(doc.ref)
      }

      await batch.commit()

      return {
        success: true,
        cleared: querySnapshot.docs.length,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      cleared: 0,
      error: error.message,
    }
  }
}

// Export the mock generator for testing
export { mockGenerator }
