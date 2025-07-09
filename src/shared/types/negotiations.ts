/**
 * TypeScript interfaces for negotiation-related data structures
 * Used across the negotiation management and strategy system
 */

import type { MarketDataPoint } from './offers'

export interface Negotiation {
  id: string
  agentId: string
  clientId: string
  offerId: string
  propertyId: string
  type: 'buyer_negotiation' | 'seller_negotiation'
  status: 'active' | 'completed' | 'stalled' | 'cancelled'

  // Negotiation Context
  originalOffer: NegotiationOffer
  currentOffer: NegotiationOffer
  counterHistory: NegotiationCounter[]

  // Strategy and Analysis
  strategy: NegotiationStrategy
  marketAnalysis: MarketAnalysis
  riskAssessment: RiskAssessment

  // Timeline
  startDate: string
  targetClosingDate: string
  lastActivity: string
  deadlines: NegotiationDeadline[]

  // Outcome
  finalAgreement?: FinalAgreement

  // Metadata
  createdAt: string
  updatedAt: string
  version: number
}

export interface NegotiationOffer {
  price: number
  terms: {
    earnestMoney: number
    downPayment: number
    loanType: string
    closingDate: string
    inspectionDeadline: string
    appraisalDeadline: string
    contingencies: string[]
    repairRequests: string[]
    specialConditions: string[]
  }
  offerDate: string
  expirationDate: string
  source: 'buyer' | 'seller'
}

export interface NegotiationCounter {
  id: string
  counterNumber: number
  fromParty: 'buyer' | 'seller'
  toParty: 'buyer' | 'seller'
  offer: NegotiationOffer
  strategy: string
  justification: string
  response?: NegotiationResponse
  createdAt: string
  respondedAt?: string
}

export interface NegotiationResponse {
  type: 'accept' | 'reject' | 'counter'
  message?: string
  newOffer?: NegotiationOffer
  createdAt: string
}

export interface NegotiationStrategy {
  id: string
  negotiationId: string
  type:
    | 'price_negotiation'
    | 'terms_negotiation'
    | 'appraisal_response'
    | 'repair_negotiation'

  // Strategy Details
  objectives: string[]
  priorities: StrategyPriority[]
  walkAwayConditions: string[]

  // Recommendations
  recommendations: StrategyRecommendation[]
  tactics: NegotiationTactic[]

  // AI-Generated Content
  aiGeneratedStrategy: string
  confidenceScore: number

  // Success Metrics
  successCriteria: string[]
  riskMitigation: string[]

  createdAt: string
  updatedAt: string
}

export interface StrategyPriority {
  item: string
  importance: 'high' | 'medium' | 'low'
  flexibility: 'rigid' | 'moderate' | 'flexible'
  reasoning: string
}

export interface StrategyRecommendation {
  id: string
  title: string
  description: string
  reasoning: string
  expectedOutcome: string
  riskLevel: 'low' | 'medium' | 'high'
  marketSupport: MarketDataPoint[]
  priority: number
}

export interface NegotiationTactic {
  id: string
  name: string
  description: string
  when: string
  expectedResponse: string
  riskLevel: 'low' | 'medium' | 'high'
  effectiveness: number
}

export interface MarketAnalysis {
  id: string
  negotiationId: string
  propertyValue: PropertyValuation
  marketConditions: MarketConditions
  comparables: MarketDataPoint[]
  trends: MarketTrend[]
  competitiveAnalysis: CompetitiveAnalysis
  priceJustification: PriceJustification
  createdAt: string
  updatedAt: string
}

export interface PropertyValuation {
  estimatedValue: number
  valueRange: {
    low: number
    high: number
  }
  confidence: number
  methodology: string[]
  factors: ValuationFactor[]
  appraisalData?: AppraisalData
}

export interface ValuationFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  description: string
}

export interface AppraisalData {
  appraisedValue: number
  appraisalDate: string
  appraiserName: string
  method: string
  comparables: MarketDataPoint[]
  adjustments: AppraisalAdjustment[]
  conditions: string[]
}

export interface AppraisalAdjustment {
  item: string
  adjustment: number
  reason: string
}

export interface MarketConditions {
  marketType: 'sellers_market' | 'buyers_market' | 'balanced_market'
  inventory: 'low' | 'normal' | 'high'
  demandLevel: 'low' | 'moderate' | 'high'
  priceDirection: 'rising' | 'stable' | 'falling'
  averageDaysOnMarket: number
  priceToListRatio: number
}

export interface MarketTrend {
  period: string
  metric: string
  value: number
  change: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
}

export interface CompetitiveAnalysis {
  activeCompetitors: number
  priceComparison: {
    aboveMarket: number
    atMarket: number
    belowMarket: number
  }
  timeComparison: {
    faster: number
    similar: number
    slower: number
  }
  strengthAnalysis: string[]
  weaknessAnalysis: string[]
}

export interface PriceJustification {
  recommendedPrice: number
  justification: string
  supportingData: MarketDataPoint[]
  priceStrategy: 'aggressive' | 'moderate' | 'conservative'
  negotiationRoom: {
    minimum: number
    maximum: number
    optimal: number
  }
}

export interface RiskAssessment {
  id: string
  negotiationId: string
  overallRisk: 'low' | 'medium' | 'high'
  riskFactors: RiskFactor[]
  mitigationStrategies: MitigationStrategy[]
  recommendations: string[]
  createdAt: string
  updatedAt: string
}

export interface RiskFactor {
  factor: string
  riskLevel: 'low' | 'medium' | 'high'
  probability: number
  impact: string
  description: string
}

export interface MitigationStrategy {
  risk: string
  strategy: string
  action: string
  timeline: string
  responsible: string
}

export interface NegotiationDeadline {
  id: string
  name: string
  date: string
  type:
    | 'inspection'
    | 'appraisal'
    | 'financing'
    | 'closing'
    | 'response'
    | 'other'
  status: 'pending' | 'met' | 'missed' | 'extended'
  impact: 'low' | 'medium' | 'high'
  description: string
  actions: string[]
}

export interface FinalAgreement {
  agreedPrice: number
  agreedTerms: NegotiationOffer['terms']
  concessionsSeller: string[]
  concessionsBuyer: string[]
  totalNegotiationTime: number
  priceReduction: number
  termsChanges: string[]
  agreementDate: string
  outcome: 'win_win' | 'buyer_advantage' | 'seller_advantage' | 'compromise'
}

export interface AppraisalScenario {
  id: string
  negotiationId: string
  propertyId: string
  scenario: 'low_appraisal' | 'high_appraisal' | 'appraisal_at_value'

  // Scenario Details
  contractPrice: number
  appraisedValue: number
  gap: number
  gapPercentage: number

  // Options and Strategies
  options: AppraisalOption[]
  recommendedStrategy: string

  // Market Context
  marketSupport: MarketDataPoint[]
  disputeEvidence?: DisputeEvidence

  // Outcome Predictions
  outcomeScenarios: OutcomeScenario[]

  createdAt: string
  updatedAt: string
}

export interface AppraisalOption {
  id: string
  name: string
  description: string
  pros: string[]
  cons: string[]
  riskLevel: 'low' | 'medium' | 'high'
  timeframe: string
  cost: number
  likelihood: number
  impact: string
}

export interface DisputeEvidence {
  comparables: MarketDataPoint[]
  marketConditions: string[]
  propertyFeatures: string[]
  errorsClaimed: string[]
  supportingDocuments: string[]
  strengthOfCase: 'weak' | 'moderate' | 'strong'
}

export interface OutcomeScenario {
  scenario: string
  probability: number
  finalPrice: number
  timeDelay: number
  additionalCosts: number
  description: string
}

export interface NegotiationDocument {
  id: string
  negotiationId: string
  agentId: string
  clientId: string
  type:
    | 'strategy_memo'
    | 'counter_offer'
    | 'appraisal_response'
    | 'negotiation_summary'
  title: string
  content: string
  htmlContent: string
  status: 'draft' | 'final' | 'sent'

  // Document Context
  context: {
    scenario: string
    objective: string
    audience: string
    tone: 'professional' | 'friendly' | 'firm' | 'persuasive'
  }

  // AI Generation
  generatedBy: 'ai' | 'agent' | 'template'
  aiModel?: string
  prompt?: string

  // Metadata
  wordCount: number
  readingTime: number
  createdAt: string
  updatedAt: string
  version: number
}

// API Request/Response Types
export interface CreateNegotiationRequest {
  offerId: string
  type: 'buyer_negotiation' | 'seller_negotiation'
  initialStrategy?: Partial<NegotiationStrategy>
}

export interface UpdateNegotiationRequest {
  negotiationId: string
  updates: Partial<Negotiation>
}

export interface GenerateNegotiationStrategyRequest {
  negotiationId: string
  scenario: string
  parameters?: {
    riskTolerance?: 'low' | 'medium' | 'high'
    timeframe?: 'urgent' | 'normal' | 'flexible'
    priorities?: string[]
    constraints?: string[]
  }
}

export interface CreateCounterStrategyRequest {
  negotiationId: string
  counterOffer: NegotiationOffer
  includeMarketData?: boolean
  includeRiskAnalysis?: boolean
}

export interface AnalyzeAppraisalScenarioRequest {
  negotiationId: string
  appraisedValue: number
  includeDispute?: boolean
  includeAlternatives?: boolean
}

// Response Types
export interface NegotiationResponse {
  success: boolean
  data?: Negotiation
  error?: string
}

export interface NegotiationStrategyResponse {
  success: boolean
  data?: NegotiationStrategy
  error?: string
}

export interface AppraisalScenarioResponse {
  success: boolean
  data?: AppraisalScenario
  error?: string
}

export interface NegotiationDocumentResponse {
  success: boolean
  data?: NegotiationDocument
  error?: string
}

// Utility Types
export type NegotiationType = Negotiation['type']
export type NegotiationStatus = Negotiation['status']
export type StrategyType = NegotiationStrategy['type']
export type RiskLevel = 'low' | 'medium' | 'high'
export type MarketType = MarketConditions['marketType']
export type PartyType = 'buyer' | 'seller'

// Constants
export const NEGOTIATION_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  STALLED: 'stalled',
  CANCELLED: 'cancelled',
} as const

export const STRATEGY_TYPES = {
  PRICE_NEGOTIATION: 'price_negotiation',
  TERMS_NEGOTIATION: 'terms_negotiation',
  APPRAISAL_RESPONSE: 'appraisal_response',
  REPAIR_NEGOTIATION: 'repair_negotiation',
} as const

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export const MARKET_TYPES = {
  SELLERS_MARKET: 'sellers_market',
  BUYERS_MARKET: 'buyers_market',
  BALANCED_MARKET: 'balanced_market',
} as const

export const DOCUMENT_TYPES = {
  STRATEGY_MEMO: 'strategy_memo',
  COUNTER_OFFER: 'counter_offer',
  APPRAISAL_RESPONSE: 'appraisal_response',
  NEGOTIATION_SUMMARY: 'negotiation_summary',
} as const
