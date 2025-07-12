/**
 * TypeScript interfaces for deal pipeline analytics and negotiation success rate tracking
 *
 * These types define the data structures for capturing, storing, and analyzing
 * negotiation strategies and their outcomes for individual real estate agents.
 */

// ========== CORE ANALYTICS TYPES ==========

export interface NegotiationRecord {
  id: string
  agentId: string
  clientId: string
  propertyId: string
  negotiationId: string

  // Negotiation Strategy Data
  strategy: NegotiationStrategy

  // Contextual Factors
  context: NegotiationContext

  // Outcome Data
  outcome: NegotiationOutcome

  // Metadata
  createdAt: string
  updatedAt: string
  version: number
}

export interface NegotiationStrategy {
  // Initial Offer Strategy
  initialOfferPercentage: number // e.g., 95 for 95% of asking price
  offerPosition: 'above' | 'at' | 'below' // relative to asking price

  // Escalation Strategy
  escalationClause: {
    used: boolean
    maxAmount?: number
    increment?: number
    capPercentage?: number
  }

  // Contingency Strategy
  contingencies: {
    inspection: boolean
    financing: boolean
    appraisal: boolean
    saleOfHome: boolean
    other: string[]
  }

  // Communication Strategy
  communicationTone: 'professional' | 'warm' | 'confident' | 'personal'
  coverLetterUsed: boolean
  personalStoryIncluded: boolean

  // Negotiation Tactics
  tactics: {
    quickClose: boolean
    asIsOffer: boolean
    rentBack: boolean
    flexibleClosing: boolean
    extraDeposit: boolean
    customTerms: string[]
  }

  // Counter-Offer Strategy
  counterOfferPattern: {
    responsiveness: 'immediate' | 'quick' | 'deliberate' | 'slow'
    concessionWillingness: 'high' | 'medium' | 'low'
    negotiationRounds: number
  }
}

export interface NegotiationContext {
  // Property Details
  propertyType:
    | 'single_family'
    | 'condo'
    | 'townhouse'
    | 'multi_family'
    | 'land'
  priceRange: PriceRange
  daysOnMarket: number

  // Market Conditions
  marketConditions: 'hot' | 'warm' | 'cool'
  marketTrend: 'rising' | 'stable' | 'falling'
  seasonality: 'spring' | 'summer' | 'fall' | 'winter'

  // Competitive Environment
  multipleOffers: boolean
  competingOffers: number
  averageOfferPrice?: number

  // Geographic Context
  location: {
    city: string
    state: string
    neighborhood?: string
    zipCode?: string
  }

  // Transaction Context
  listingAgent: string
  buyerAgent: string
  transactionType: 'purchase' | 'refinance' | 'investment'
}

export interface NegotiationOutcome {
  // Primary Outcome
  successful: boolean
  acceptedDate?: string
  rejectedDate?: string

  // Final Terms
  finalPrice?: number
  finalTerms?: {
    closingDate: string
    contingencies: string[]
    concessions: string[]
    modifications: string[]
  }

  // Timeline Data
  daysToAcceptance?: number
  negotiationRounds: number

  // Competitive Results
  chosenOverOffers?: number
  reasonForSelection?: string

  // Agent Assessment
  clientSatisfaction?: 'high' | 'medium' | 'low'
  lessonLearned?: string
}

// ========== ANALYTICS CALCULATION TYPES ==========

export interface SuccessRateAnalytics {
  agentId: string

  // Overall Statistics
  totalNegotiations: number
  successfulNegotiations: number
  overallSuccessRate: number

  // Success Rate Breakdowns
  byStrategy: StrategySuccessRate[]
  byPropertyType: PropertyTypeSuccessRate[]
  byMarketConditions: MarketConditionSuccessRate[]
  byPriceRange: PriceRangeSuccessRate[]
  byCompetitiveEnvironment: CompetitiveSuccessRate[]

  // Performance Trends
  trends: PerformanceTrend[]

  // Metadata
  calculatedAt: string
  dataRange: {
    startDate: string
    endDate: string
    totalRecords: number
  }
}

export interface StrategySuccessRate {
  strategyType: string
  strategyValue: string | number | boolean
  totalAttempts: number
  successfulAttempts: number
  successRate: number
  averageDaysToClose?: number
  averageFinalPrice?: number
  confidence: number // 0-1 based on sample size
}

export interface PropertyTypeSuccessRate {
  propertyType: string
  totalAttempts: number
  successfulAttempts: number
  successRate: number
  averageOfferPercentage?: number
  mostSuccessfulStrategy?: string
}

export interface MarketConditionSuccessRate {
  marketCondition: 'hot' | 'warm' | 'cool'
  totalAttempts: number
  successfulAttempts: number
  successRate: number
  averageDaysToClose?: number
  recommendedStrategy?: string
}

export interface PriceRangeSuccessRate {
  priceRange: PriceRange
  totalAttempts: number
  successfulAttempts: number
  successRate: number
  averageOfferPercentage?: number
  mostEffectiveStrategy?: string
}

export interface CompetitiveSuccessRate {
  multipleOffers: boolean
  averageCompetingOffers: number
  totalAttempts: number
  successfulAttempts: number
  successRate: number
  winningFactors: string[]
}

// ========== RECOMMENDATION TYPES ==========

export interface StrategyRecommendation {
  agentId: string
  recommendationType:
    | 'initial_offer'
    | 'escalation'
    | 'contingency'
    | 'communication'
    | 'overall'

  // Recommendation Details
  recommendation: {
    strategy: string
    value: string | number | boolean
    confidence: number // 0-1
    reasoning: string
    expectedSuccessRate: number
  }

  // Context for Recommendation
  basedOn: {
    propertyType: string
    marketConditions: string
    priceRange: PriceRange
    competitiveEnvironment: boolean
    historicalDataPoints: number
  }

  // Alternative Strategies
  alternatives: {
    strategy: string
    expectedSuccessRate: number
    reasoning: string
  }[]

  // Metadata
  generatedAt: string
  validUntil: string
}

// ========== REPORTING TYPES ==========

export interface AnalyticsReport {
  id: string
  agentId: string
  reportType:
    | 'top_strategies'
    | 'performance_trends'
    | 'strategy_breakdown'
    | 'recommendations'

  // Report Content
  title: string
  summary: string
  keyInsights: string[]
  data: any // Flexible data structure based on report type

  // Report Configuration
  filters: {
    dateRange: {
      startDate: string
      endDate: string
    }
    propertyTypes?: string[]
    marketConditions?: string[]
    priceRanges?: PriceRange[]
  }

  // Metadata
  generatedAt: string
  dataAsOf: string
}

export interface PerformanceTrend {
  period: string // e.g., "2024-01", "2024-Q1"
  periodType: 'month' | 'quarter' | 'year'

  // Performance Metrics
  totalNegotiations: number
  successfulNegotiations: number
  successRate: number

  // Comparative Data
  previousPeriodSuccessRate?: number
  changeFromPrevious?: number
  trend: 'improving' | 'stable' | 'declining'

  // Strategy Performance
  topStrategy: string
  topStrategySuccessRate: number

  // Market Context
  marketConditions: string
  averageMarketPerformance?: number
}

// ========== UTILITY TYPES ==========

export interface PriceRange {
  min: number
  max: number
  label: string // e.g., "Under $300K", "$300K-$500K", "Above $1M"
}

export interface AnalyticsQuery {
  agentId: string
  dateRange?: {
    startDate: string
    endDate: string
  }
  filters?: {
    propertyTypes?: string[]
    marketConditions?: string[]
    priceRanges?: PriceRange[]
    successful?: boolean
    strategyTypes?: string[]
    strategyValues?: string[]
    competitiveEnvironment?: boolean
    dateRange?: {
      startDate: string
      endDate: string
    }
  }
  groupBy?: string[]
  sortBy?: string
  limit?: number
}

export interface AnalyticsCache {
  key: string
  agentId: string
  data: any
  expiresAt: string
  generatedAt: string
}

// ========== API RESPONSE TYPES ==========

export interface AnalyticsResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    totalRecords: number
    filteredRecords: number
    calculationTime: number
    cacheStatus: 'hit' | 'miss' | 'expired'
  }
}

export interface NegotiationAnalyticsResponse
  extends AnalyticsResponse<SuccessRateAnalytics> {}
export interface RecommendationResponse
  extends AnalyticsResponse<StrategyRecommendation[]> {}
export interface ReportResponse extends AnalyticsResponse<AnalyticsReport> {}

// ========== FIREBASE COLLECTION TYPES ==========

export interface FirebaseNegotiationRecord
  extends Omit<NegotiationRecord, 'id'> {
  // Firebase-specific fields
  _createdAt: any // Firebase Timestamp
  _updatedAt: any // Firebase Timestamp
}

export interface FirebaseAnalyticsCache
  extends Omit<AnalyticsCache, 'expiresAt' | 'generatedAt'> {
  _expiresAt: any // Firebase Timestamp
  _generatedAt: any // Firebase Timestamp
}

// ========== VALIDATION TYPES ==========

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface DataQualityMetrics {
  totalRecords: number
  validRecords: number
  invalidRecords: number
  completenessScore: number // 0-1
  accuracyScore: number // 0-1
  timelinessScore: number // 0-1
  lastQualityCheck: string
}

// ========== EXPORT TYPES ==========

export type AnalyticsEventType =
  | 'negotiation_started'
  | 'negotiation_completed'
  | 'strategy_changed'
  | 'outcome_recorded'
  | 'analytics_calculated'
  | 'recommendation_generated'

export type AnalyticsPermission =
  | 'read_own_analytics'
  | 'write_own_analytics'
  | 'admin_all_analytics'

export type ReportFormat = 'json' | 'csv' | 'pdf' | 'html'
