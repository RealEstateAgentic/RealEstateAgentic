/**
 * Common TypeScript Interfaces for LangChain Workflows
 *
 * Shared type definitions for all LangChain agents and workflows
 * to ensure consistency and type safety across the system.
 */

import type { BaseMessage } from '@langchain/core/messages'
import type { ChatOpenAI } from '@langchain/openai'
import type { Tool } from '@langchain/core/tools'
import type { StateGraph } from '@langchain/langgraph'

// ========== CORE WORKFLOW TYPES ==========

/**
 * Base interface for all workflow contexts
 */
export interface BaseWorkflowContext {
  workflowId: string
  timestamp: Date
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * Base interface for all workflow results
 */
export interface BaseWorkflowResult {
  workflowId: string
  status: 'success' | 'partial' | 'failed'
  result: any
  error?: string
  metadata?: {
    tokensUsed?: number
    executionTime?: number
    modelUsed?: string
  }
}

/**
 * Base interface for all workflow configurations
 */
export interface BaseWorkflowConfig {
  model?: ChatOpenAI
  tools?: Tool[]
  streaming?: boolean
  timeout?: number
  maxRetries?: number
  temperature?: number
  maxTokens?: number
}

// ========== AGENT TYPES ==========

/**
 * Base interface for all agent states
 */
export interface BaseAgentState {
  messages: BaseMessage[]
  tools: Tool[]
  model: ChatOpenAI
  metadata: Record<string, any>
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext extends BaseWorkflowContext {
  state: BaseAgentState
  config: BaseWorkflowConfig
  tools: Tool[]
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult extends BaseWorkflowResult {
  messages: BaseMessage[]
  toolCalls?: any[]
  finalState: BaseAgentState
}

// ========== NEGOTIATION WORKFLOW TYPES ==========

/**
 * Negotiation context for LangChain workflows
 */
export interface NegotiationWorkflowContext extends BaseWorkflowContext {
  scenario: NegotiationScenario
  client: NegotiationClient
  property: NegotiationProperty
  marketConditions: MarketConditions
  currentOffer?: any
  negotiationHistory?: BaseMessage[]
}

/**
 * Negotiation scenario types
 */
export type NegotiationScenario =
  | 'initial_offer'
  | 'counter_offer'
  | 'multiple_offers'
  | 'deadline_pressure'
  | 'appraisal_gap'
  | 'inspection_negotiations'
  | 'financing_contingency'
  | 'final_push'

/**
 * Negotiation client information
 */
export interface NegotiationClient {
  role: 'buyer' | 'seller'
  goals: string[]
  priorities: string[]
  constraints: string[]
  timeline: string
  experienceLevel: 'first-time' | 'experienced' | 'investor'
  motivations: string[]
  budget?: {
    max: number
    preferred: number
    flexibility: 'high' | 'medium' | 'low'
  }
}

/**
 * Property information for negotiations
 */
export interface NegotiationProperty {
  address: string
  listPrice: number
  marketValue: number
  daysOnMarket: number
  propertyCondition: 'excellent' | 'good' | 'fair' | 'needs-work'
  uniqueFeatures?: string[]
  issues?: string[]
}

/**
 * Market conditions for negotiations
 */
export interface MarketConditions {
  trend: 'hot' | 'warm' | 'cool'
  inventory: 'low' | 'balanced' | 'high'
  competitionLevel: 'high' | 'medium' | 'low'
  seasonality: 'peak' | 'normal' | 'slow'
  interestRates: 'rising' | 'stable' | 'falling'
}

/**
 * Negotiation workflow result
 */
export interface NegotiationWorkflowResult extends BaseWorkflowResult {
  strategy: {
    primaryApproach: string
    tacticalRecommendations: string[]
    positioningPoints: string[]
    communicationTone: string
  }
  scenarios: {
    bestCase: string
    worstCase: string
    mostLikely: string
    fallbackOptions: string[]
  }
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
    mitigationStrategies: string[]
  }
  recommendations: string[]
  nextSteps: string[]
}

// ========== OFFER ANALYSIS WORKFLOW TYPES ==========

/**
 * Offer analysis context for LangChain workflows
 */
export interface OfferAnalysisWorkflowContext extends BaseWorkflowContext {
  primaryOffer: any
  competingOffers?: any[]
  property: AnalysisProperty
  market: AnalysisMarket
  analysisType: AnalysisType
  seller?: AnalysisSeller
}

/**
 * Property information for analysis
 */
export interface AnalysisProperty {
  address: string
  listPrice: number
  estimatedValue?: number
  daysOnMarket: number
  propertyType: string
  condition: 'excellent' | 'good' | 'fair' | 'needs-work'
  features?: string[]
  issues?: string[]
}

/**
 * Market information for analysis
 */
export interface AnalysisMarket {
  trend: 'hot' | 'warm' | 'cool'
  inventory: 'low' | 'balanced' | 'high'
  competitionLevel: 'high' | 'medium' | 'low'
  averageDaysOnMarket: number
  averagePricePerSqFt?: number
}

/**
 * Seller information for analysis
 */
export interface AnalysisSeller {
  motivations?: string[]
  timeline?: string
  circumstances?: string[]
  flexibility?: 'high' | 'medium' | 'low'
}

/**
 * Analysis type options
 */
export type AnalysisType =
  | 'single_offer_review'
  | 'competitive_comparison'
  | 'offer_strength_assessment'
  | 'financial_analysis'
  | 'risk_assessment'
  | 'client_presentation'

/**
 * Offer analysis workflow result
 */
export interface OfferAnalysisWorkflowResult extends BaseWorkflowResult {
  summary: {
    overallStrength: 'strong' | 'moderate' | 'weak'
    competitivePosition: 'excellent' | 'good' | 'fair' | 'poor'
    keyStrengths: string[]
    areasOfConcern: string[]
    marketFit: string
  }
  analysis: {
    financial: {
      priceAnalysis: string
      financingStrength: string
      costBreakdown: string
    }
    terms: {
      timeline: string
      contingencies: string
      flexibility: string
    }
    risk: {
      level: 'low' | 'medium' | 'high'
      factors: string[]
      mitigation: string[]
    }
  }
  recommendations: string[]
  nextSteps: string[]
}

// ========== DOCUMENT GENERATION WORKFLOW TYPES ==========

/**
 * Document generation context for LangChain workflows
 */
export interface DocumentGenerationWorkflowContext extends BaseWorkflowContext {
  documentType: DocumentType
  client: DocumentClient
  property: DocumentProperty
  agent: DocumentAgent
  customData?: Record<string, any>
}

/**
 * Document type options
 */
export type DocumentType =
  | 'cover_letter'
  | 'explanation_memo'
  | 'offer_analysis'
  | 'negotiation_strategy'
  | 'market_analysis'
  | 'client_summary'

/**
 * Client information for document generation
 */
export interface DocumentClient {
  name: string
  role: 'buyer' | 'seller'
  experienceLevel: 'first-time' | 'experienced' | 'investor'
  goals?: string[]
  concerns?: string[]
  timeline?: string
}

/**
 * Property information for document generation
 */
export interface DocumentProperty {
  address: string
  price: number
  type: string
  features?: string[]
  condition?: string
  daysOnMarket?: number
}

/**
 * Agent information for document generation
 */
export interface DocumentAgent {
  name: string
  brokerage?: string
  experience?: string
  credentials?: string
  contact?: {
    phone?: string
    email?: string
  }
}

/**
 * Document generation workflow result
 */
export interface DocumentGenerationWorkflowResult extends BaseWorkflowResult {
  document: {
    type: DocumentType
    title: string
    content: string
    metadata: {
      generatedAt: Date
      tokensUsed: number
      modelUsed: string
    }
  }
  alternatives?: string[]
  suggestions?: string[]
}

// ========== MARKET ANALYSIS WORKFLOW TYPES ==========

/**
 * Market analysis context for LangChain workflows
 */
export interface MarketAnalysisWorkflowContext extends BaseWorkflowContext {
  location: MarketLocation
  analysisType: MarketAnalysisType
  timeframe: MarketTimeframe
  dataPoints?: MarketDataPoint[]
}

/**
 * Market location information
 */
export interface MarketLocation {
  city: string
  state: string
  zipCode?: string
  neighborhood?: string
  propertyType?: string
}

/**
 * Market analysis type options
 */
export type MarketAnalysisType =
  | 'price_trends'
  | 'inventory_analysis'
  | 'competition_assessment'
  | 'seasonal_patterns'
  | 'investment_potential'

/**
 * Market timeframe options
 */
export type MarketTimeframe =
  | 'current'
  | 'past_month'
  | 'past_quarter'
  | 'past_year'
  | 'forecast'

/**
 * Market data point
 */
export interface MarketDataPoint {
  metric: string
  value: number
  unit: string
  date: Date
  source?: string
}

/**
 * Market analysis workflow result
 */
export interface MarketAnalysisWorkflowResult extends BaseWorkflowResult {
  insights: {
    trend: 'rising' | 'stable' | 'declining'
    priceMovement: number
    inventoryLevel: 'low' | 'normal' | 'high'
    competitionLevel: 'high' | 'medium' | 'low'
    keyFactors: string[]
  }
  recommendations: string[]
  dataPoints: MarketDataPoint[]
  forecast?: {
    nextMonth: string
    nextQuarter: string
    risks: string[]
    opportunities: string[]
  }
}

// ========== WORKFLOW ORCHESTRATION TYPES ==========

/**
 * Workflow orchestration context
 */
export interface WorkflowOrchestrationContext extends BaseWorkflowContext {
  workflows: WorkflowDefinition[]
  dependencies: WorkflowDependency[]
  executionStrategy: 'sequential' | 'parallel' | 'conditional'
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string
  name: string
  type: 'agent' | 'tool' | 'langgraph'
  config: BaseWorkflowConfig
  inputs: Record<string, any>
  outputs: Record<string, any>
}

/**
 * Workflow dependency
 */
export interface WorkflowDependency {
  workflowId: string
  dependsOn: string[]
  condition?: string
}

/**
 * Workflow orchestration result
 */
export interface WorkflowOrchestrationResult extends BaseWorkflowResult {
  workflows: Array<{
    id: string
    status: 'success' | 'failed' | 'skipped'
    result: any
    error?: string
    executionTime: number
  }>
  totalExecutionTime: number
  successCount: number
  failureCount: number
}

// ========== MEMORY TYPES ==========

/**
 * Memory context for workflows
 */
export interface MemoryContext {
  sessionId: string
  workflowId: string
  userId?: string
  conversationHistory: BaseMessage[]
  contextData: Record<string, any>
}

/**
 * Memory storage interface
 */
export interface MemoryStorage {
  store(context: MemoryContext): Promise<void>
  retrieve(sessionId: string, workflowId: string): Promise<MemoryContext | null>
  clear(sessionId: string): Promise<void>
  update(
    sessionId: string,
    workflowId: string,
    data: Partial<MemoryContext>
  ): Promise<void>
}

// ========== TOOL TYPES ==========

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  toolName: string
  parameters: Record<string, any>
  workflowId: string
  sessionId?: string
  userId?: string
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  toolName: string
  success: boolean
  result: any
  error?: string
  executionTime: number
}

// ========== STREAMING TYPES ==========

/**
 * Streaming event types
 */
export type StreamingEventType =
  | 'workflow_start'
  | 'workflow_step'
  | 'workflow_complete'
  | 'workflow_error'
  | 'agent_message'
  | 'tool_call'
  | 'tool_result'

/**
 * Streaming event
 */
export interface StreamingEvent {
  type: StreamingEventType
  workflowId: string
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

/**
 * Streaming callback
 */
export type StreamingCallback = (event: StreamingEvent) => void

// ========== CONFIGURATION TYPES ==========

/**
 * Global LangChain configuration
 */
export interface LangChainGlobalConfig {
  models: {
    default: string
    analysis: string
    document: string
    negotiation: string
    streaming: string
  }
  memory: {
    enabled: boolean
    provider: 'memory' | 'redis' | 'firebase'
    config: Record<string, any>
  }
  tools: {
    enabled: string[]
    config: Record<string, any>
  }
  streaming: {
    enabled: boolean
    bufferSize: number
    timeout: number
  }
}

// ========== EXPORTS ==========

export type { BaseMessage, ChatOpenAI, Tool, StateGraph }
