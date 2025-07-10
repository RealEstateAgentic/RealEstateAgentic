/**
 * Negotiation Pipeline Workflow
 *
 * Specialized LangGraph workflow for complex negotiation processes including
 * strategy development, counter-offer analysis, response generation, and
 * multi-round negotiation management.
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { NegotiationAgent } from '../agents/negotiation/negotiation-agent'
import { OfferAnalysisAgent } from '../agents/offer-analysis/analysis-agent'
import { MarketAnalysisAgent } from '../agents/market-analysis/market-agent'
import { DocumentAgent } from '../agents/document-generation/document-agent'
import { StreamingCallbackHandler } from '../common/streaming'
import { ConditionalRoutingEngine } from './conditional-routing'
import type {
  Offer,
  Negotiation,
  NegotiationMessage,
  NegotiationCounterOffer,
  NegotiationStrategy,
  NegotiationOutcome,
} from '../../../shared/types/negotiations'
import type { MarketData } from '../../../shared/types/market-data'
import type { DocumentGenerationContext } from './document-orchestration'

// ========== NEGOTIATION WORKFLOW TYPES ==========

export interface NegotiationPipelineState {
  // Core negotiation data
  negotiationId: string
  sessionId: string
  originalOffer: Offer
  currentNegotiation: Negotiation
  negotiationHistory: NegotiationMessage[]
  counterOffers: NegotiationCounterOffer[]

  // Context and strategy
  context: NegotiationContext
  strategy: NegotiationStrategy
  currentRound: number
  maxRounds: number

  // Workflow state
  status: NegotiationStatus
  currentPhase: NegotiationPhase
  completedPhases: NegotiationPhase[]

  // Analysis results
  offerAnalysis?: OfferAnalysisResult
  marketAnalysis?: MarketAnalysisResult
  competitiveAnalysis?: CompetitiveAnalysisResult

  // Generated documents
  strategicDocuments: NegotiationDocument[]
  responseDocuments: NegotiationDocument[]

  // Execution metadata
  startTime: number
  endTime?: number
  totalTime?: number

  // Error handling
  errors: NegotiationError[]
  warnings: NegotiationWarning[]

  // Communication
  messages: BaseMessage[]
  recommendations: string[]

  // Final outcome
  outcome?: NegotiationOutcome
}

export interface NegotiationContext {
  // Property information
  property: {
    address: string
    price: number
    type: string
    features: string[]
    condition: string
    daysOnMarket: number
    comparables?: PropertyComparable[]
  }

  // Client information
  client: {
    name: string
    role: 'buyer' | 'seller'
    budget?: number
    timeline: string
    priorities: string[]
    concessions: string[]
    dealBreakers: string[]
    negotiationStyle:
      | 'aggressive'
      | 'cooperative'
      | 'analytical'
      | 'accommodating'
  }

  // Market context
  market: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    competition: 'high' | 'medium' | 'low'
    seasonality: 'peak' | 'normal' | 'slow'
    averageDaysOnMarket: number
  }

  // Negotiation specifics
  negotiationGoals: {
    primaryObjective: string
    secondaryObjectives: string[]
    acceptableOutcomes: string[]
    worstCaseScenarios: string[]
  }

  // External factors
  externalFactors: {
    financingContingencies: string[]
    inspectionResults?: string[]
    appraisalConcerns?: string[]
    timeConstraints: string[]
  }
}

export type NegotiationStatus =
  | 'initializing'
  | 'analyzing'
  | 'strategizing'
  | 'responding'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type NegotiationPhase =
  | 'initial_analysis'
  | 'strategy_development'
  | 'market_research'
  | 'competitive_analysis'
  | 'response_generation'
  | 'counter_offer_preparation'
  | 'final_recommendations'

export interface OfferAnalysisResult {
  priceAnalysis: {
    fairMarketValue: number
    offerToMarketRatio: number
    priceJustification: string
    adjustmentRecommendations: string[]
  }
  termsAnalysis: {
    favorableTerms: string[]
    concerningTerms: string[]
    missingTerms: string[]
    riskFactors: string[]
  }
  negotiationLeverage: {
    buyerLeverage: number
    sellerLeverage: number
    keyLeveragePoints: string[]
  }
  recommendations: string[]
}

export interface MarketAnalysisResult {
  marketConditions: {
    trend: string
    strength: number
    outlook: string
    factors: string[]
  }
  competitivePosition: {
    propertyRanking: number
    uniqueSellingPoints: string[]
    competitiveDisadvantages: string[]
  }
  pricingStrategy: {
    recommendedPrice: number
    priceRange: { min: number; max: number }
    pricingRationale: string
  }
}

export interface CompetitiveAnalysisResult {
  competitorProperties: PropertyComparable[]
  marketPositioning: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  strategicRecommendations: string[]
}

export interface NegotiationDocument {
  id: string
  type: NegotiationDocumentType
  title: string
  content: string
  purpose: string
  audience: 'client' | 'counterparty' | 'internal'
  priority: 'high' | 'medium' | 'low'
  generatedAt: Date
  round: number
}

export type NegotiationDocumentType =
  | 'strategy_memo'
  | 'counter_offer_analysis'
  | 'response_letter'
  | 'negotiation_talking_points'
  | 'concession_strategy'
  | 'closing_arguments'
  | 'fallback_options'

export interface PropertyComparable {
  address: string
  price: number
  squareFootage: number
  bedrooms: number
  bathrooms: number
  daysOnMarket: number
  pricePerSquareFoot: number
  adjustments: string[]
}

export interface NegotiationError {
  phase: NegotiationPhase
  error: string
  severity: 'low' | 'medium' | 'high'
  timestamp: number
  context: string
}

export interface NegotiationWarning {
  phase: NegotiationPhase
  warning: string
  impact: string
  recommendation: string
  timestamp: number
}

// ========== NEGOTIATION PIPELINE WORKFLOW ==========

export class NegotiationPipeline {
  private negotiationAgent: NegotiationAgent
  private analysisAgent: OfferAnalysisAgent
  private marketAgent: MarketAnalysisAgent
  private documentAgent: DocumentAgent
  private routingEngine: ConditionalRoutingEngine

  constructor() {
    this.negotiationAgent = new NegotiationAgent()
    this.analysisAgent = new OfferAnalysisAgent()
    this.marketAgent = new MarketAnalysisAgent()
    this.documentAgent = new DocumentAgent()
    this.routingEngine = new ConditionalRoutingEngine()
  }

  // ========== WORKFLOW DEFINITION ==========

  createNegotiationWorkflow(): StateGraph<NegotiationPipelineState> {
    const workflow = new StateGraph<NegotiationPipelineState>({
      channels: {
        negotiationId: 'string',
        sessionId: 'string',
        originalOffer: 'object',
        currentNegotiation: 'object',
        negotiationHistory: 'array',
        counterOffers: 'array',
        context: 'object',
        strategy: 'object',
        currentRound: 'number',
        maxRounds: 'number',
        status: 'string',
        currentPhase: 'string',
        completedPhases: 'array',
        offerAnalysis: 'object',
        marketAnalysis: 'object',
        competitiveAnalysis: 'object',
        strategicDocuments: 'array',
        responseDocuments: 'array',
        startTime: 'number',
        endTime: 'number',
        totalTime: 'number',
        errors: 'array',
        warnings: 'array',
        messages: 'array',
        recommendations: 'array',
        outcome: 'object',
      },
    })

    // Add workflow nodes
    workflow.addNode(
      'initialize_negotiation',
      this.initializeNegotiation.bind(this)
    )
    workflow.addNode('analyze_offer', this.analyzeOffer.bind(this))
    workflow.addNode('research_market', this.researchMarket.bind(this))
    workflow.addNode('analyze_competition', this.analyzeCompetition.bind(this))
    workflow.addNode('develop_strategy', this.developStrategy.bind(this))
    workflow.addNode('prepare_response', this.prepareResponse.bind(this))
    workflow.addNode('generate_documents', this.generateDocuments.bind(this))
    workflow.addNode('evaluate_outcome', this.evaluateOutcome.bind(this))
    workflow.addNode(
      'finalize_negotiation',
      this.finalizeNegotiation.bind(this)
    )

    // Define workflow edges
    workflow.addEdge(START, 'initialize_negotiation')
    workflow.addEdge('initialize_negotiation', 'analyze_offer')
    workflow.addEdge('analyze_offer', 'research_market')
    workflow.addEdge('research_market', 'analyze_competition')
    workflow.addEdge('analyze_competition', 'develop_strategy')
    workflow.addEdge('develop_strategy', 'prepare_response')
    workflow.addEdge('prepare_response', 'generate_documents')

    workflow.addConditionalEdges(
      'generate_documents',
      this.routeAfterDocumentGeneration.bind(this),
      {
        evaluate: 'evaluate_outcome',
        continue: 'prepare_response',
        finalize: 'finalize_negotiation',
      }
    )

    workflow.addConditionalEdges(
      'evaluate_outcome',
      this.routeAfterEvaluation.bind(this),
      {
        continue: 'analyze_offer',
        finalize: 'finalize_negotiation',
      }
    )

    workflow.addEdge('finalize_negotiation', END)

    return workflow
  }

  // ========== WORKFLOW NODE IMPLEMENTATIONS ==========

  async initializeNegotiation(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    const negotiationId = `neg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      negotiationId,
      sessionId,
      status: 'analyzing',
      currentPhase: 'initial_analysis',
      completedPhases: [],
      currentRound: 1,
      maxRounds: 5,
      strategicDocuments: [],
      responseDocuments: [],
      errors: [],
      warnings: [],
      messages: [],
      recommendations: [],
      startTime: Date.now(),
    }
  }

  async analyzeOffer(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const analysisResult = await this.analysisAgent.analyzeOffer({
        offer: state.originalOffer,
        property: state.context.property,
        market: state.context.market,
        competingOffers: [],
        analysisType: 'comprehensive',
        options: {
          complexity: 'detailed',
          includeRiskAssessment: true,
          includeMarketAnalysis: true,
        },
      })

      // Transform analysis result to our format
      const offerAnalysis: OfferAnalysisResult = {
        priceAnalysis: {
          fairMarketValue: state.context.property.price,
          offerToMarketRatio:
            (state.originalOffer.price || 0) / state.context.property.price,
          priceJustification: `Analysis of offer price relative to market value`,
          adjustmentRecommendations: analysisResult.recommendations || [],
        },
        termsAnalysis: {
          favorableTerms: analysisResult.strengths || [],
          concerningTerms: analysisResult.weaknesses || [],
          missingTerms: [],
          riskFactors: analysisResult.risks || [],
        },
        negotiationLeverage: {
          buyerLeverage: 0.7,
          sellerLeverage: 0.3,
          keyLeveragePoints: analysisResult.keyInsights || [],
        },
        recommendations: analysisResult.recommendations || [],
      }

      const completedPhases = [...state.completedPhases, 'initial_analysis']

      return {
        offerAnalysis,
        completedPhases,
        currentPhase: 'market_research',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'initial_analysis',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'high',
            timestamp: Date.now(),
            context: 'Offer analysis failed',
          },
        ],
      }
    }
  }

  async researchMarket(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const marketResult = await this.marketAgent.generateMarketAnalysis({
        location: { city: 'Unknown', state: 'Unknown' },
        propertyType: state.context.property.type,
        priceRange: {
          min: state.context.property.price * 0.8,
          max: state.context.property.price * 1.2,
          median: state.context.property.price,
        },
        marketConditions: {
          trend: state.context.market.trend,
          inventory: state.context.market.inventory,
          seasonality: state.context.market.seasonality,
        },
        analysisType: 'comprehensive',
        options: {
          complexity: 'detailed',
          includeMarketAnalysis: true,
          format: 'structured',
        },
      })

      const marketAnalysis: MarketAnalysisResult = {
        marketConditions: {
          trend: state.context.market.trend,
          strength: 0.7,
          outlook: 'Stable market conditions',
          factors: marketResult.keyInsights || [],
        },
        competitivePosition: {
          propertyRanking: 1,
          uniqueSellingPoints: state.context.property.features,
          competitiveDisadvantages: [],
        },
        pricingStrategy: {
          recommendedPrice: state.context.property.price,
          priceRange: {
            min: state.context.property.price * 0.9,
            max: state.context.property.price * 1.1,
          },
          pricingRationale:
            'Based on market analysis and comparable properties',
        },
      }

      const completedPhases = [...state.completedPhases, 'market_research']

      return {
        marketAnalysis,
        completedPhases,
        currentPhase: 'competitive_analysis',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'market_research',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium',
            timestamp: Date.now(),
            context: 'Market research failed',
          },
        ],
      }
    }
  }

  async analyzeCompetition(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      // Simulate competitive analysis
      const competitiveAnalysis: CompetitiveAnalysisResult = {
        competitorProperties: state.context.property.comparables || [],
        marketPositioning: {
          strengths: state.context.property.features,
          weaknesses: [],
          opportunities: [
            'Price adjustment potential',
            'Market timing advantage',
          ],
          threats: ['Competing properties', 'Market conditions'],
        },
        strategicRecommendations: [
          'Emphasize unique property features',
          'Leverage market timing',
          'Address potential buyer concerns proactively',
        ],
      }

      const completedPhases = [...state.completedPhases, 'competitive_analysis']

      return {
        competitiveAnalysis,
        completedPhases,
        currentPhase: 'strategy_development',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'competitive_analysis',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium',
            timestamp: Date.now(),
            context: 'Competitive analysis failed',
          },
        ],
      }
    }
  }

  async developStrategy(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const strategyResult = await this.negotiationAgent.developStrategy({
        offer: state.originalOffer,
        negotiation: state.currentNegotiation,
        property: state.context.property,
        client: state.context.client,
        market: state.context.market,
        strategyType: 'comprehensive',
        options: {
          complexity: 'detailed',
          includeNegotiationTactics: true,
          tone: 'professional',
        },
      })

      const strategy: NegotiationStrategy = {
        id: `strategy-${Date.now()}`,
        type: 'comprehensive',
        objectives: state.context.negotiationGoals.primaryObjective,
        tactics: strategyResult.tactics || [],
        concessions: strategyResult.concessions || [],
        walkAwayPoints: state.context.client.dealBreakers,
        timeline: state.context.client.timeline,
        riskFactors: strategyResult.risks || [],
        contingencyPlans: strategyResult.alternatives || [],
        communicationStrategy: {
          tone: 'professional',
          keyMessages: strategyResult.keyMessages || [],
          timing: strategyResult.timing || 'immediate',
        },
        successMetrics: strategyResult.successMetrics || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const completedPhases = [...state.completedPhases, 'strategy_development']

      return {
        strategy,
        completedPhases,
        currentPhase: 'response_generation',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'strategy_development',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'high',
            timestamp: Date.now(),
            context: 'Strategy development failed',
          },
        ],
      }
    }
  }

  async prepareResponse(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const recommendations = [
        'Review all terms carefully before responding',
        'Consider market conditions in your response',
        'Maintain professional tone throughout negotiation',
        'Be prepared for counter-offers',
        'Document all agreements in writing',
      ]

      const completedPhases = [...state.completedPhases, 'response_generation']

      return {
        recommendations,
        completedPhases,
        currentPhase: 'counter_offer_preparation',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'response_generation',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium',
            timestamp: Date.now(),
            context: 'Response preparation failed',
          },
        ],
      }
    }
  }

  async generateDocuments(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const strategicDocuments: NegotiationDocument[] = []
      const responseDocuments: NegotiationDocument[] = []

      // Generate strategy memo
      const strategyMemo = await this.generateStrategyMemo(state)
      strategicDocuments.push(strategyMemo)

      // Generate response letter
      const responseLetter = await this.generateResponseLetter(state)
      responseDocuments.push(responseLetter)

      // Generate talking points
      const talkingPoints = await this.generateTalkingPoints(state)
      strategicDocuments.push(talkingPoints)

      const completedPhases = [
        ...state.completedPhases,
        'counter_offer_preparation',
      ]

      return {
        strategicDocuments,
        responseDocuments,
        completedPhases,
        currentPhase: 'final_recommendations',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'counter_offer_preparation',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'high',
            timestamp: Date.now(),
            context: 'Document generation failed',
          },
        ],
      }
    }
  }

  async evaluateOutcome(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    try {
      const outcome: NegotiationOutcome = {
        id: `outcome-${Date.now()}`,
        negotiationId: state.negotiationId,
        status: 'in_progress',
        finalOffer: state.originalOffer,
        agreedTerms: [],
        rejectedTerms: [],
        totalRounds: state.currentRound,
        duration: Date.now() - state.startTime,
        satisfaction: {
          client: 0.8,
          counterparty: 0.7,
          overall: 0.75,
        },
        keyOutcomes: [
          'Strategy developed successfully',
          'Market analysis completed',
          'Response documents prepared',
        ],
        lessonsLearned: [
          'Market conditions favor current strategy',
          'Client priorities align with market reality',
          'Negotiation timeline is realistic',
        ],
        createdAt: new Date(),
      }

      return {
        outcome,
        status: 'completed',
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            phase: 'final_recommendations',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium',
            timestamp: Date.now(),
            context: 'Outcome evaluation failed',
          },
        ],
      }
    }
  }

  async finalizeNegotiation(
    state: NegotiationPipelineState
  ): Promise<Partial<NegotiationPipelineState>> {
    const completedPhases = [...state.completedPhases, 'final_recommendations']

    return {
      completedPhases,
      endTime: Date.now(),
      totalTime: Date.now() - state.startTime,
      status: 'completed',
    }
  }

  // ========== ROUTING FUNCTIONS ==========

  private routeAfterDocumentGeneration(
    state: NegotiationPipelineState
  ): string {
    if (state.errors.some(e => e.severity === 'high')) {
      return 'finalize'
    }

    if (state.currentRound >= state.maxRounds) {
      return 'finalize'
    }

    return 'evaluate'
  }

  private routeAfterEvaluation(state: NegotiationPipelineState): string {
    if (state.outcome?.status === 'completed') {
      return 'finalize'
    }

    if (state.currentRound < state.maxRounds) {
      return 'continue'
    }

    return 'finalize'
  }

  // ========== DOCUMENT GENERATION HELPERS ==========

  private async generateStrategyMemo(
    state: NegotiationPipelineState
  ): Promise<NegotiationDocument> {
    const content = `
# Negotiation Strategy Memo

## Property Overview
- Address: ${state.context.property.address}
- Price: $${state.context.property.price.toLocaleString()}
- Type: ${state.context.property.type}

## Market Analysis
- Trend: ${state.context.market.trend}
- Competition: ${state.context.market.competition}
- Inventory: ${state.context.market.inventory}

## Strategy Recommendations
${state.strategy.tactics.map((tactic, index) => `${index + 1}. ${tactic}`).join('\n')}

## Key Leverage Points
${state.offerAnalysis?.negotiationLeverage.keyLeveragePoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

## Recommended Approach
${state.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}
    `.trim()

    return {
      id: `strategy-memo-${Date.now()}`,
      type: 'strategy_memo',
      title: 'Negotiation Strategy Memo',
      content,
      purpose: 'Strategic guidance for negotiation approach',
      audience: 'internal',
      priority: 'high',
      generatedAt: new Date(),
      round: state.currentRound,
    }
  }

  private async generateResponseLetter(
    state: NegotiationPipelineState
  ): Promise<NegotiationDocument> {
    const content = `
Dear [Counterparty],

Thank you for your offer on the property at ${state.context.property.address}. After careful consideration and market analysis, we would like to respond with the following:

## Our Position
Based on current market conditions and the property's unique features, we believe the offer requires adjustment to reflect fair market value.

## Key Considerations
- Current market trend: ${state.context.market.trend}
- Property's competitive advantages: ${state.context.property.features.join(', ')}
- Market analysis indicates: ${state.marketAnalysis?.marketConditions.outlook}

## Proposed Terms
We propose the following adjustments to create a mutually beneficial agreement:

${state.strategy.tactics.map((tactic, index) => `${index + 1}. ${tactic}`).join('\n')}

We look forward to your response and working together to reach a successful conclusion.

Best regards,
[Agent Name]
    `.trim()

    return {
      id: `response-letter-${Date.now()}`,
      type: 'response_letter',
      title: 'Negotiation Response Letter',
      content,
      purpose: 'Formal response to counterparty offer',
      audience: 'counterparty',
      priority: 'high',
      generatedAt: new Date(),
      round: state.currentRound,
    }
  }

  private async generateTalkingPoints(
    state: NegotiationPipelineState
  ): Promise<NegotiationDocument> {
    const content = `
# Negotiation Talking Points

## Opening Points
- Acknowledge the offer and express appreciation
- Highlight positive aspects of the proposal
- Set collaborative tone for discussion

## Key Arguments
${state.strategy.tactics.map((tactic, index) => `${index + 1}. ${tactic}`).join('\n')}

## Supporting Data
- Market analysis: ${state.marketAnalysis?.marketConditions.outlook}
- Property advantages: ${state.context.property.features.join(', ')}
- Competitive position: Strong based on analysis

## Potential Concessions
${state.strategy.concessions.map((concession, index) => `${index + 1}. ${concession}`).join('\n')}

## Deal Breakers
${state.context.client.dealBreakers.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Closing Points
- Reiterate mutual benefits
- Propose next steps
- Maintain positive relationship
    `.trim()

    return {
      id: `talking-points-${Date.now()}`,
      type: 'negotiation_talking_points',
      title: 'Negotiation Talking Points',
      content,
      purpose: 'Guidance for verbal negotiations',
      audience: 'internal',
      priority: 'medium',
      generatedAt: new Date(),
      round: state.currentRound,
    }
  }
}

// ========== PIPELINE EXECUTION SERVICE ==========

export class NegotiationPipelineService {
  private pipeline: NegotiationPipeline

  constructor() {
    this.pipeline = new NegotiationPipeline()
  }

  async executeNegotiationPipeline(
    originalOffer: Offer,
    currentNegotiation: Negotiation,
    context: NegotiationContext,
    streamingCallback?: StreamingCallbackHandler
  ): Promise<NegotiationPipelineResult> {
    const workflow = this.pipeline.createNegotiationWorkflow()
    const compiledWorkflow = workflow.compile()

    const initialState: NegotiationPipelineState = {
      negotiationId: '',
      sessionId: '',
      originalOffer,
      currentNegotiation,
      negotiationHistory: [],
      counterOffers: [],
      context,
      strategy: {} as NegotiationStrategy,
      currentRound: 1,
      maxRounds: 5,
      status: 'initializing',
      currentPhase: 'initial_analysis',
      completedPhases: [],
      strategicDocuments: [],
      responseDocuments: [],
      startTime: Date.now(),
      errors: [],
      warnings: [],
      messages: [],
      recommendations: [],
    }

    try {
      const result = await compiledWorkflow.invoke(initialState)

      return {
        negotiationId: result.negotiationId,
        status: result.status,
        strategy: result.strategy,
        offerAnalysis: result.offerAnalysis,
        marketAnalysis: result.marketAnalysis,
        competitiveAnalysis: result.competitiveAnalysis,
        strategicDocuments: result.strategicDocuments,
        responseDocuments: result.responseDocuments,
        recommendations: result.recommendations,
        outcome: result.outcome,
        executionTime: result.totalTime || 0,
        errors: result.errors,
        warnings: result.warnings,
      }
    } catch (error) {
      return {
        negotiationId: 'failed',
        status: 'failed',
        strategy: {} as NegotiationStrategy,
        strategicDocuments: [],
        responseDocuments: [],
        recommendations: [],
        executionTime: 0,
        errors: [
          {
            phase: 'initial_analysis',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'high',
            timestamp: Date.now(),
            context: 'Pipeline execution failed',
          },
        ],
        warnings: [],
      }
    }
  }
}

// ========== RESULT TYPES ==========

export interface NegotiationPipelineResult {
  negotiationId: string
  status: NegotiationStatus
  strategy: NegotiationStrategy
  offerAnalysis?: OfferAnalysisResult
  marketAnalysis?: MarketAnalysisResult
  competitiveAnalysis?: CompetitiveAnalysisResult
  strategicDocuments: NegotiationDocument[]
  responseDocuments: NegotiationDocument[]
  recommendations: string[]
  outcome?: NegotiationOutcome
  executionTime: number
  errors: NegotiationError[]
  warnings: NegotiationWarning[]
}

// ========== CONVENIENCE FUNCTIONS ==========

export const createNegotiationPipeline = () => {
  return new NegotiationPipelineService()
}

export const executeNegotiationWorkflow = async (
  originalOffer: Offer,
  currentNegotiation: Negotiation,
  context: NegotiationContext
): Promise<NegotiationPipelineResult> => {
  const pipeline = createNegotiationPipeline()
  return pipeline.executeNegotiationPipeline(
    originalOffer,
    currentNegotiation,
    context
  )
}
