/**
 * TypeScript interfaces for market data and analysis
 * Used for mock market data to support negotiation recommendations
 */

export interface MarketData {
  id: string
  area: string
  zipCode: string
  city: string
  state: string

  // Market Overview
  marketType: 'sellers_market' | 'buyers_market' | 'balanced_market'
  marketStrength: number // 0-100
  marketTrend: 'rising' | 'stable' | 'falling'

  // Pricing Data
  medianPrice: number
  averagePrice: number
  pricePerSqft: number
  priceChangePercent: number
  priceChangeAmount: number

  // Inventory Data
  activeListings: number
  newListings: number
  soldListings: number
  inventory: number
  monthsOfSupply: number

  // Market Timing
  averageDaysOnMarket: number
  averageListToSale: number
  saleToListRatio: number

  // Market Activity
  totalSales: number
  totalVolume: number

  // Comparative Data
  yearOverYear: YearOverYearData
  seasonalAdjustment: SeasonalData

  // Metadata
  dataSource: string
  lastUpdated: string
  confidenceLevel: number
  createdAt: string
  updatedAt: string
}

export interface YearOverYearData {
  priceChange: number
  priceChangePercent: number
  salesChange: number
  salesChangePercent: number
  inventoryChange: number
  inventoryChangePercent: number
  domChange: number
  domChangePercent: number
}

export interface SeasonalData {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  month: string
  seasonalFactor: number
  expectedChange: number
  historicalAverage: number
}

export interface ComparableSale {
  id: string
  address: string
  city: string
  state: string
  zipCode: string

  // Property Details
  beds: number
  baths: number
  sqft: number
  lotSize: number
  yearBuilt: number
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family'

  // Sale Details
  salePrice: number
  listPrice: number
  pricePerSqft: number
  saleDate: string
  daysOnMarket: number

  // Property Features
  features: string[]
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  upgrades: string[]

  // Market Context
  marketConditions: string
  competitiveOffers: number

  // Adjustments
  adjustments: PriceAdjustment[]
  adjustedPrice: number

  // Relevance
  relevanceScore: number
  distanceFromSubject: number

  // Metadata
  dataSource: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface PriceAdjustment {
  factor: string
  adjustment: number
  reason: string
  weight: number
}

export interface MarketTrend {
  id: string
  area: string
  metric: string

  // Trend Data
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'

  // Time Period
  period: string
  startDate: string
  endDate: string

  // Forecasting
  predicted: boolean
  confidence: number

  // Context
  significance: 'high' | 'medium' | 'low'
  description: string

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface MarketForecast {
  id: string
  area: string
  forecastType: 'price' | 'inventory' | 'activity' | 'market_conditions'

  // Forecast Data
  timeHorizon: '1_month' | '3_months' | '6_months' | '1_year'
  currentValue: number
  forecastValue: number
  changePercent: number

  // Confidence
  confidence: number
  accuracy: number

  // Factors
  drivingFactors: string[]
  risks: string[]

  // Scenario Analysis
  scenarios: ForecastScenario[]

  // Metadata
  model: string
  createdAt: string
  updatedAt: string
}

export interface ForecastScenario {
  scenario: 'optimistic' | 'base' | 'pessimistic'
  probability: number
  forecastValue: number
  changePercent: number
  description: string
}

export interface MarketSegment {
  id: string
  area: string
  segmentType: 'price_range' | 'property_type' | 'location'

  // Segment Definition
  name: string
  description: string
  criteria: SegmentCriteria

  // Market Data
  marketData: MarketData
  performance: SegmentPerformance

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface SegmentCriteria {
  priceRange?: {
    min: number
    max: number
  }
  propertyType?: string[]
  location?: string[]
  sqftRange?: {
    min: number
    max: number
  }
  yearBuiltRange?: {
    min: number
    max: number
  }
}

export interface SegmentPerformance {
  marketShare: number
  salesVolume: number
  averagePrice: number
  averageDom: number
  absorption: number
  priceAppreciation: number
}

export interface MarketAnalysis {
  id: string
  propertyId: string
  address: string

  // Analysis Type
  analysisType: 'cma' | 'pricing' | 'negotiation' | 'market_position'

  // Market Context
  marketData: MarketData
  comparables: ComparableSale[]
  trends: MarketTrend[]

  // Valuation
  estimatedValue: number
  valueRange: {
    low: number
    high: number
  }
  pricePerSqft: number

  // Recommendations
  listingStrategy: ListingStrategy
  pricingStrategy: PricingStrategy
  negotiationStrategy: NegotiationStrategy

  // Confidence
  confidenceScore: number
  reliability: 'high' | 'medium' | 'low'

  // Metadata
  analystId: string
  createdAt: string
  updatedAt: string
}

export interface ListingStrategy {
  recommendedListPrice: number
  priceStrategy: 'aggressive' | 'moderate' | 'conservative'
  marketingStrategy: string[]
  timing: {
    bestTimeToList: string
    expectedDaysOnMarket: number
  }
  competitiveAdvantages: string[]
  risks: string[]
}

export interface PricingStrategy {
  initialPrice: number
  priceReductions: PriceReduction[]
  minimumAcceptable: number
  negotiationRoom: number
  marketSupport: number
}

export interface PriceReduction {
  timing: string
  amount: number
  reason: string
  expectedImpact: string
}

export interface NegotiationStrategy {
  initialPosition: number
  walkAwayPoint: number
  counterOfferStrategy: string[]
  leveragePoints: string[]
  marketJustification: string[]
}

export interface MarketAlert {
  id: string
  agentId: string
  area: string

  // Alert Configuration
  alertType:
    | 'price_change'
    | 'inventory_change'
    | 'new_listing'
    | 'market_shift'
  threshold: number
  condition: 'greater_than' | 'less_than' | 'equal_to' | 'percent_change'

  // Alert Details
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'

  // Trigger Data
  triggeredAt: string
  currentValue: number
  previousValue: number
  changePercent: number

  // Actions
  actions: AlertAction[]

  // Status
  status: 'active' | 'acknowledged' | 'resolved'

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface AlertAction {
  type: 'email' | 'notification' | 'report' | 'adjustment'
  description: string
  completed: boolean
  completedAt?: string
}

export interface MarketReport {
  id: string
  agentId: string
  title: string
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom'

  // Report Content
  summary: string
  keyFindings: string[]
  recommendations: string[]

  // Data
  marketData: MarketData[]
  trends: MarketTrend[]
  forecasts: MarketForecast[]

  // Visualizations
  charts: ChartConfig[]

  // Metadata
  generatedAt: string
  createdAt: string
  updatedAt: string
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter'
  title: string
  data: any[]
  options: any
}

export interface MockMarketDataGenerator {
  generateMarketData(area: string): MarketData
  generateComparables(propertyAddress: string, count: number): ComparableSale[]
  generateTrends(area: string, timeframe: string): MarketTrend[]
  generateForecast(area: string, type: string): MarketForecast
  generateAnalysis(propertyId: string): MarketAnalysis
}

// API Request/Response Types
export interface GetMarketDataRequest {
  area: string
  zipCode?: string
  radius?: number
  includeComparables?: boolean
  includeTrends?: boolean
  includeForecast?: boolean
}

export interface GetComparablesRequest {
  address: string
  beds?: number
  baths?: number
  sqft?: number
  radius?: number
  maxResults?: number
  timeframe?: string
}

export interface GenerateMarketAnalysisRequest {
  propertyId: string
  analysisType: 'cma' | 'pricing' | 'negotiation' | 'market_position'
  includeComparables?: boolean
  includeTrends?: boolean
  includeForecast?: boolean
}

export interface CreateMarketAlertRequest {
  area: string
  alertType: string
  threshold: number
  condition: string
  notificationMethod: 'email' | 'app' | 'both'
}

export interface GenerateMarketReportRequest {
  area: string
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom'
  dateRange?: {
    startDate: string
    endDate: string
  }
  includeForecasts?: boolean
}

// Response Types
export interface MarketDataResponse {
  success: boolean
  data?: MarketData
  error?: string
}

export interface ComparablesResponse {
  success: boolean
  data?: ComparableSale[]
  error?: string
}

export interface MarketAnalysisResponse {
  success: boolean
  data?: MarketAnalysis
  error?: string
}

export interface MarketReportResponse {
  success: boolean
  data?: MarketReport
  error?: string
}

// Utility Types
export type MarketType = MarketData['marketType']
export type MarketTrendDirection = MarketTrend['direction']
export type ForecastType = MarketForecast['forecastType']
export type AnalysisType = MarketAnalysis['analysisType']
export type PropertyType = ComparableSale['propertyType']
export type PropertyCondition = ComparableSale['condition']

// Constants
export const MARKET_TYPES = {
  SELLERS_MARKET: 'sellers_market',
  BUYERS_MARKET: 'buyers_market',
  BALANCED_MARKET: 'balanced_market',
} as const

export const PROPERTY_TYPES = {
  SINGLE_FAMILY: 'single_family',
  CONDO: 'condo',
  TOWNHOUSE: 'townhouse',
  MULTI_FAMILY: 'multi_family',
} as const

export const PROPERTY_CONDITIONS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const

export const TREND_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
} as const

export const FORECAST_TYPES = {
  PRICE: 'price',
  INVENTORY: 'inventory',
  ACTIVITY: 'activity',
  MARKET_CONDITIONS: 'market_conditions',
} as const

export const ANALYSIS_TYPES = {
  CMA: 'cma',
  PRICING: 'pricing',
  NEGOTIATION: 'negotiation',
  MARKET_POSITION: 'market_position',
} as const
