/**
 * TypeScript interfaces for offer-related data structures
 * Used across the offer preparation and negotiation system
 */

export interface Offer {
  id: string
  agentId: string
  clientId: string
  propertyId: string
  type: 'buyer' | 'seller'
  status:
    | 'draft'
    | 'submitted'
    | 'accepted'
    | 'rejected'
    | 'countered'
    | 'expired'

  // Offer Details
  purchasePrice: number
  earnestMoney: number
  downPayment: number
  loanAmount: number
  loanType: 'conventional' | 'fha' | 'va' | 'usda' | 'cash' | 'other'

  // Dates
  offerDate: string
  expirationDate: string
  closingDate: string
  inspectionDeadline: string
  appraisalDeadline: string

  // Conditions
  contingencies: {
    inspection: boolean
    appraisal: boolean
    financing: boolean
    saleOfCurrentHome: boolean
    other?: string
  }

  // Additional Terms
  personalProperty: string[]
  repairRequests: string[]
  specialConditions: string[]

  // Generated Documents
  coverLetter?: string
  explanationMemo?: string

  // Metadata
  createdAt: string
  updatedAt: string
  version: number
}

export interface OfferComparison {
  id: string
  agentId: string
  clientId: string
  propertyId: string
  offers: OfferComparisonItem[]
  analysis: OfferAnalysis
  recommendation: string
  createdAt: string
  updatedAt: string
}

export interface OfferComparisonItem {
  offerId: string
  buyerName: string
  purchasePrice: number
  earnestMoney: number
  downPayment: number
  loanType: string
  contingencies: string[]
  closingDate: string
  strengths: string[]
  weaknesses: string[]
  score: number
}

export interface OfferAnalysis {
  priceAnalysis: {
    highestOffer: number
    lowestOffer: number
    averageOffer: number
    priceRange: number
    marketValueComparison: number
  }
  financialStrength: {
    strongOffers: number
    weakOffers: number
    cashOffers: number
    financedOffers: number
  }
  timeline: {
    fastestClosing: string
    slowestClosing: string
    averageClosingDays: number
  }
  contingencyAnalysis: {
    noContingencies: number
    inspectionOnly: number
    financingOnly: number
    multipleContingencies: number
  }
}

export interface CounterOffer {
  id: string
  originalOfferId: string
  agentId: string
  clientId: string
  counterNumber: number
  type: 'buyer_counter' | 'seller_counter'

  // Counter Terms
  purchasePrice: number
  terms: {
    closingDate?: string
    inspectionDeadline?: string
    appraisalDeadline?: string
    earnestMoney?: number
    repairRequests?: string[]
    specialConditions?: string[]
  }

  // AI-Generated Content
  strategy: string
  justification: string
  dataBackup: MarketDataPoint[]

  // Payment Impact Analysis
  paymentComparison?: {
    originalMonthlyPayment: number
    newMonthlyPayment: number
    difference: number
    percentChange: number
  }

  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  expirationDate: string
  createdAt: string
  updatedAt: string
}

export interface MarketDataPoint {
  type: 'comp_sale' | 'active_listing' | 'pending_sale' | 'market_trend'
  address: string
  price: number
  date: string
  sqft: number
  beds: number
  baths: number
  daysOnMarket: number
  pricePerSqft: number
  source: string
  relevanceScore: number
}

export interface OfferDocument {
  id: string
  offerId: string
  agentId: string
  clientId: string
  type:
    | 'cover_letter'
    | 'explanation_memo'
    | 'counter_strategy'
    | 'appraisal_response'
  title: string
  content: string
  htmlContent: string
  status: 'draft' | 'final' | 'sent'

  // Document metadata
  wordCount: number
  readingTime: number
  tone: 'professional' | 'friendly' | 'persuasive' | 'formal'

  // Generation details
  generatedBy: 'ai' | 'agent' | 'template'
  aiModel?: string
  prompt?: string

  createdAt: string
  updatedAt: string
  version: number
}

export interface OfferWorkflow {
  id: string
  agentId: string
  clientId: string
  propertyId: string
  type: 'buyer_workflow' | 'seller_workflow'
  currentStep: number
  totalSteps: number

  steps: WorkflowStep[]

  status: 'active' | 'completed' | 'paused' | 'cancelled'
  startedAt: string
  completedAt?: string
  updatedAt: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'input' | 'review' | 'generate' | 'send' | 'wait'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'

  // Step data
  inputData?: Record<string, any>
  outputData?: Record<string, any>

  // AI generation details
  aiTask?: {
    prompt: string
    model: string
    parameters: Record<string, any>
    result?: string
    error?: string
  }

  // Timing
  startedAt?: string
  completedAt?: string
  estimatedDuration?: number
  actualDuration?: number
}

// API Request/Response Types
export interface CreateOfferRequest {
  propertyId: string
  type: 'buyer' | 'seller'
  offerData: Omit<
    Offer,
    'id' | 'agentId' | 'clientId' | 'createdAt' | 'updatedAt' | 'version'
  >
}

export interface UpdateOfferRequest {
  offerId: string
  updates: Partial<Offer>
}

export interface GenerateOfferDocumentRequest {
  offerId: string
  documentType:
    | 'cover_letter'
    | 'explanation_memo'
    | 'counter_strategy'
    | 'appraisal_response'
  parameters?: {
    tone?: 'professional' | 'friendly' | 'persuasive' | 'formal'
    length?: 'short' | 'medium' | 'long'
    focus?: string[]
    additionalContext?: string
  }
}

export interface AnalyzeOffersRequest {
  propertyId: string
  offers: string[] // offer IDs
  analysisType: 'comparison' | 'recommendation' | 'market_analysis'
}

export interface CreateCounterOfferRequest {
  originalOfferId: string
  counterTerms: CounterOffer['terms']
  strategy?: string
  includeMarketData?: boolean
}

// Response Types
export interface OfferResponse {
  success: boolean
  data?: Offer
  error?: string
}

export interface OfferDocumentResponse {
  success: boolean
  data?: OfferDocument
  error?: string
}

export interface OfferAnalysisResponse {
  success: boolean
  data?: OfferComparison
  error?: string
}

export interface CounterOfferResponse {
  success: boolean
  data?: CounterOffer
  error?: string
}

// Utility Types
export type OfferStatus = Offer['status']
export type OfferType = Offer['type']
export type DocumentType = OfferDocument['type']
export type WorkflowType = OfferWorkflow['type']
export type StepType = WorkflowStep['type']
export type StepStatus = WorkflowStep['status']

// Constants
export const OFFER_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTERED: 'countered',
  EXPIRED: 'expired',
} as const

export const LOAN_TYPES = {
  CONVENTIONAL: 'conventional',
  FHA: 'fha',
  VA: 'va',
  USDA: 'usda',
  CASH: 'cash',
  OTHER: 'other',
} as const

export const DOCUMENT_TYPES = {
  COVER_LETTER: 'cover_letter',
  EXPLANATION_MEMO: 'explanation_memo',
  COUNTER_STRATEGY: 'counter_strategy',
  APPRAISAL_RESPONSE: 'appraisal_response',
} as const

export const WORKFLOW_TYPES = {
  BUYER_WORKFLOW: 'buyer_workflow',
  SELLER_WORKFLOW: 'seller_workflow',
} as const
