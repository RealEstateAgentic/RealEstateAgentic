/**
 * LangGraph Document Orchestration Workflow
 *
 * Comprehensive LangGraph workflow system that orchestrates multiple document
 * generation tasks with dependency management, state persistence, and error recovery.
 * Replaces the existing DocumentOrchestrationService with workflow-based architecture.
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { DocumentAgent } from '../agents/document-generation/document-agent'
import { OfferAnalysisAgent } from '../agents/offer-analysis/analysis-agent'
import { NegotiationAgent } from '../agents/negotiation/negotiation-agent'
import { MarketAnalysisAgent } from '../agents/market-analysis/market-agent'
import { StreamingService, StreamingCallbackHandler } from '../common/streaming'
import type { Offer } from '../../../shared/types/offers'
import type { Negotiation } from '../../../shared/types/negotiations'
import type { MarketData } from '../../../shared/types/market-data'

// ========== WORKFLOW STATE TYPES ==========

export interface DocumentWorkflowState {
  // Request information
  packageId: string
  packageType: DocumentPackageType
  status: WorkflowStatus
  createdAt: string
  updatedAt: string

  // Input context
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  requirements: DocumentRequirements

  // Generation state
  pendingDocuments: DocumentType[]
  completedDocuments: GeneratedDocument[]
  failedDocuments: DocumentError[]
  currentDocument?: DocumentType

  // Workflow state
  generationPlan: GenerationPlan
  dependencies: Record<string, string[]>
  generatedContent: Record<string, any>

  // Results and insights
  insights?: DocumentInsights
  recommendations?: string[]
  metadata?: WorkflowMetadata

  // Error handling
  retryCount: number
  maxRetries: number
  errors: WorkflowError[]

  // Streaming
  sessionId?: string
  messages: BaseMessage[]
}

export type WorkflowStatus =
  | 'pending'
  | 'planning'
  | 'generating'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type DocumentPackageType =
  | 'buyer_offer_package'
  | 'seller_counter_package'
  | 'negotiation_strategy_package'
  | 'market_analysis_package'
  | 'client_education_package'
  | 'competitive_analysis_package'
  | 'custom_package'

export interface DocumentGenerationContext {
  offer?: Offer
  negotiation?: Negotiation
  marketData?: MarketData
  property: {
    address: string
    price: number
    type: string
    features?: string[]
    condition?: string
    daysOnMarket?: number
  }
  client: {
    name: string
    role: 'buyer' | 'seller'
    experienceLevel: 'first-time' | 'experienced' | 'investor'
    goals?: string[]
    concerns?: string[]
    timeline?: string
  }
  agent: {
    name: string
    brokerage?: string
    experience?: string
    credentials?: string
    contact?: {
      phone?: string
      email?: string
    }
  }
  market?: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    competition: 'high' | 'medium' | 'low'
    location: {
      city: string
      state: string
      zipCode?: string
    }
  }
  competingOffers?: Offer[]
  customData?: Record<string, any>
}

export interface DocumentGenerationOptions {
  format: 'text' | 'structured' | 'pdf-ready'
  complexity: 'simple' | 'intermediate' | 'detailed'
  tone: 'professional' | 'warm' | 'confident' | 'analytical'
  includeMarketAnalysis: boolean
  includeRiskAssessment: boolean
  includeNegotiationTactics: boolean
  includeClientEducation: boolean
  prioritizeSpeed: boolean
  ensureConsistency: boolean
  validateContent: boolean
  jurisdiction?: string
  brokerageBranding?: {
    name: string
    logo?: string
    colors?: string[]
    disclaimer?: string
  }
}

export interface DocumentRequirements {
  documents: DocumentType[]
  deliveryMethod: 'immediate' | 'batch' | 'progressive'
  qualityLevel: 'draft' | 'review' | 'final'
  maxGenerationTime?: number
  fallbackOptions?: boolean
}

export type DocumentType =
  | 'cover_letter'
  | 'explanation_memo'
  | 'negotiation_strategy'
  | 'offer_analysis'
  | 'market_analysis'
  | 'risk_assessment'
  | 'client_summary'
  | 'competitive_comparison'

export interface GeneratedDocument {
  id: string
  type: DocumentType
  title: string
  content: string
  format: 'text' | 'structured' | 'pdf-ready'
  metadata: {
    wordCount: number
    readingTime: number
    complexity: string
    tone: string
    generatedAt: Date
    version: string
    agentUsed: string
    toolsUsed: string[]
  }
  quality: {
    score: number
    issues: string[]
    suggestions: string[]
  }
}

export interface GenerationPlan {
  order: DocumentType[]
  phases: GenerationPhase[]
  estimatedTime: number
  parallelGroups: DocumentType[][]
}

export interface GenerationPhase {
  name: string
  documents: DocumentType[]
  dependencies: string[]
  canRunInParallel: boolean
}

export interface DocumentInsights {
  keyThemes: string[]
  consistencyScore: number
  recommendedActions: string[]
  marketAlignment: string
  strategicPosition: string
  riskFactors: string[]
  qualityMetrics: {
    averageScore: number
    totalWords: number
    estimatedReadingTime: number
  }
}

export interface WorkflowMetadata {
  generatedAt: Date
  totalTime: number
  tokensUsed: number
  documentsRequested: number
  documentsGenerated: number
  packageType: DocumentPackageType
  clientId: string
  agentId: string
  workflowVersion: string
}

export interface DocumentError {
  documentType: DocumentType
  error: string
  severity: 'low' | 'medium' | 'high'
  fallbackApplied: boolean
  retryAttempt: number
}

export interface WorkflowError {
  step: string
  error: string
  timestamp: string
  recovered: boolean
  recoveryAction?: string
}

// ========== WORKFLOW NODES ==========

export class DocumentOrchestrationWorkflow {
  private documentAgent: DocumentAgent
  private analysisAgent: OfferAnalysisAgent
  private negotiationAgent: NegotiationAgent
  private marketAgent: MarketAnalysisAgent
  private streamingService: StreamingService

  constructor() {
    this.documentAgent = new DocumentAgent()
    this.analysisAgent = new OfferAnalysisAgent()
    this.negotiationAgent = new NegotiationAgent()
    this.marketAgent = new MarketAnalysisAgent()
    this.streamingService = new StreamingService()
  }

  // ========== WORKFLOW DEFINITION ==========

  createWorkflow(): StateGraph<DocumentWorkflowState> {
    const workflow = new StateGraph<DocumentWorkflowState>({
      channels: {
        packageId: 'string',
        packageType: 'string',
        status: 'string',
        createdAt: 'string',
        updatedAt: 'string',
        context: 'object',
        options: 'object',
        requirements: 'object',
        pendingDocuments: 'array',
        completedDocuments: 'array',
        failedDocuments: 'array',
        currentDocument: 'string',
        generationPlan: 'object',
        dependencies: 'object',
        generatedContent: 'object',
        insights: 'object',
        recommendations: 'array',
        metadata: 'object',
        retryCount: 'number',
        maxRetries: 'number',
        errors: 'array',
        sessionId: 'string',
        messages: 'array',
      },
    })

    // Add workflow nodes
    workflow.addNode('initialize', this.initializeWorkflow.bind(this))
    workflow.addNode('plan_generation', this.planGeneration.bind(this))
    workflow.addNode('validate_context', this.validateContext.bind(this))
    workflow.addNode('generate_document', this.generateDocument.bind(this))
    workflow.addNode('validate_document', this.validateDocument.bind(this))
    workflow.addNode('analyze_package', this.analyzePackage.bind(this))
    workflow.addNode('generate_insights', this.generateInsights.bind(this))
    workflow.addNode('handle_error', this.handleError.bind(this))
    workflow.addNode('finalize_package', this.finalizePackage.bind(this))

    // Define workflow edges
    workflow.addEdge(START, 'initialize')
    workflow.addEdge('initialize', 'validate_context')
    workflow.addEdge('validate_context', 'plan_generation')
    workflow.addEdge('plan_generation', 'generate_document')

    // Conditional routing for document generation
    workflow.addConditionalEdges(
      'generate_document',
      this.routeAfterGeneration.bind(this),
      {
        continue: 'validate_document',
        error: 'handle_error',
        complete: 'analyze_package',
      }
    )

    workflow.addConditionalEdges(
      'validate_document',
      this.routeAfterValidation.bind(this),
      {
        next_document: 'generate_document',
        complete: 'analyze_package',
        retry: 'generate_document',
      }
    )

    workflow.addConditionalEdges(
      'handle_error',
      this.routeAfterError.bind(this),
      {
        retry: 'generate_document',
        skip: 'generate_document',
        fail: 'finalize_package',
      }
    )

    workflow.addEdge('analyze_package', 'generate_insights')
    workflow.addEdge('generate_insights', 'finalize_package')
    workflow.addEdge('finalize_package', END)

    return workflow
  }

  // ========== WORKFLOW NODE IMPLEMENTATIONS ==========

  async initializeWorkflow(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    const packageId = `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      packageId,
      sessionId,
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingDocuments: [...state.requirements.documents],
      completedDocuments: [],
      failedDocuments: [],
      generatedContent: {},
      retryCount: 0,
      maxRetries: 3,
      errors: [],
      messages: [],
    }
  }

  async validateContext(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    try {
      // Validate required fields
      if (!state.context.property.address) {
        state.context.property.address = 'Property Address'
      }
      if (!state.context.client.name) {
        state.context.client.name = 'Client'
      }
      if (!state.context.agent.name) {
        state.context.agent.name = 'Agent'
      }

      // Enrich context with market data if needed
      let enrichedContext = { ...state.context }
      if (!state.context.marketData && state.context.market) {
        try {
          const marketConfig = {
            location: state.context.market.location,
            propertyType: state.context.property.type as any,
            priceRange: {
              min: state.context.property.price * 0.8,
              max: state.context.property.price * 1.2,
              median: state.context.property.price,
            },
            marketConditions: {
              trend: state.context.market.trend,
              inventory: state.context.market.inventory,
              seasonality: 'normal' as const,
            },
            timeframe: 'current' as const,
            analysisType: 'comprehensive' as const,
          }

          const marketAnalysis =
            await this.marketAgent.generateMarketAnalysis(marketConfig)
          enrichedContext.marketData = marketAnalysis.marketData
        } catch (error) {
          console.warn('Failed to generate market data:', error)
        }
      }

      return {
        context: enrichedContext,
        status: 'planning',
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'failed',
        errors: [
          ...state.errors,
          {
            step: 'validate_context',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async planGeneration(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    try {
      // Define document dependencies
      const dependencies: Record<string, string[]> = {
        cover_letter: [],
        explanation_memo: [],
        negotiation_strategy: ['offer_analysis'],
        offer_analysis: [],
        market_analysis: [],
        risk_assessment: ['offer_analysis'],
        client_summary: ['offer_analysis', 'market_analysis'],
        competitive_comparison: ['market_analysis'],
      }

      // Create generation plan with topological sorting
      const order = this.topologicalSort(
        state.requirements.documents,
        dependencies
      )

      // Group documents that can run in parallel
      const parallelGroups = this.createParallelGroups(order, dependencies)

      // Estimate total time
      const estimatedTime = this.estimateGenerationTime(
        state.requirements.documents,
        state.options
      )

      // Create phases
      const phases = this.createGenerationPhases(order, dependencies)

      const generationPlan: GenerationPlan = {
        order,
        phases,
        estimatedTime,
        parallelGroups,
      }

      return {
        generationPlan,
        dependencies,
        status: 'generating',
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'failed',
        errors: [
          ...state.errors,
          {
            step: 'plan_generation',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async generateDocument(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    if (state.pendingDocuments.length === 0) {
      return {
        status: 'analyzing',
        updatedAt: new Date().toISOString(),
      }
    }

    const currentDocument = state.pendingDocuments[0]

    try {
      // Check if dependencies are satisfied
      const dependencies = state.dependencies[currentDocument] || []
      const unsatisfiedDeps = dependencies.filter(
        dep => !state.completedDocuments.some(doc => doc.type === dep)
      )

      if (unsatisfiedDeps.length > 0) {
        // Find next document that can be generated
        const nextDocument = state.pendingDocuments.find(docType => {
          const deps = state.dependencies[docType] || []
          return deps.every(dep =>
            state.completedDocuments.some(doc => doc.type === dep)
          )
        })

        if (!nextDocument) {
          throw new Error(
            'Circular dependency detected or no available documents to generate'
          )
        }

        // Reorder pending documents
        const reorderedPending = [
          nextDocument,
          ...state.pendingDocuments.filter(doc => doc !== nextDocument),
        ]

        return {
          pendingDocuments: reorderedPending,
          currentDocument: nextDocument,
          updatedAt: new Date().toISOString(),
        }
      }

      // Generate the document using appropriate agent
      let generatedDocument: GeneratedDocument

      switch (currentDocument) {
        case 'cover_letter':
        case 'explanation_memo':
          generatedDocument = await this.generateDocumentWithAgent(
            currentDocument,
            state,
            this.documentAgent
          )
          break

        case 'offer_analysis':
        case 'risk_assessment':
        case 'competitive_comparison':
          generatedDocument = await this.generateAnalysisDocument(
            currentDocument,
            state,
            this.analysisAgent
          )
          break

        case 'negotiation_strategy':
          generatedDocument = await this.generateNegotiationDocument(
            currentDocument,
            state,
            this.negotiationAgent
          )
          break

        case 'market_analysis':
        case 'client_summary':
          generatedDocument = await this.generateMarketDocument(
            currentDocument,
            state,
            this.marketAgent
          )
          break

        default:
          throw new Error(`Unknown document type: ${currentDocument}`)
      }

      // Update state with completed document
      const updatedPendingDocuments = state.pendingDocuments.slice(1)
      const updatedCompletedDocuments = [
        ...state.completedDocuments,
        generatedDocument,
      ]
      const updatedGeneratedContent = {
        ...state.generatedContent,
        [currentDocument]: generatedDocument,
      }

      return {
        pendingDocuments: updatedPendingDocuments,
        completedDocuments: updatedCompletedDocuments,
        generatedContent: updatedGeneratedContent,
        currentDocument: updatedPendingDocuments[0],
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      const documentError: DocumentError = {
        documentType: currentDocument,
        error: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        fallbackApplied: false,
        retryAttempt: state.retryCount,
      }

      return {
        failedDocuments: [...state.failedDocuments, documentError],
        errors: [
          ...state.errors,
          {
            step: 'generate_document',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async validateDocument(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    if (state.completedDocuments.length === 0) {
      return state
    }

    const lastDocument =
      state.completedDocuments[state.completedDocuments.length - 1]

    try {
      // Validate document quality
      const qualityCheck = await this.validateDocumentQuality(
        lastDocument,
        state.options
      )

      // Update document with quality metrics
      const updatedDocument = {
        ...lastDocument,
        quality: qualityCheck,
      }

      const updatedCompletedDocuments = [
        ...state.completedDocuments.slice(0, -1),
        updatedDocument,
      ]

      return {
        completedDocuments: updatedCompletedDocuments,
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            step: 'validate_document',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async analyzePackage(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    try {
      const insights = await this.generatePackageInsights(
        state.completedDocuments,
        state.context
      )

      return {
        insights,
        status: 'analyzing',
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            step: 'analyze_package',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async generateInsights(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    try {
      const recommendations = await this.generatePackageRecommendations(
        state.completedDocuments,
        state.insights!,
        state
      )

      const metadata: WorkflowMetadata = {
        generatedAt: new Date(),
        totalTime: Date.now() - new Date(state.createdAt).getTime(),
        tokensUsed: this.estimateTokensUsed(state.completedDocuments),
        documentsRequested: state.requirements.documents.length,
        documentsGenerated: state.completedDocuments.length,
        packageType: state.packageType,
        clientId: state.context.client.name,
        agentId: state.context.agent.name,
        workflowVersion: '1.0.0',
      }

      return {
        recommendations,
        metadata,
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            step: 'generate_insights',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recovered: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async handleError(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    const canRetry = state.retryCount < state.maxRetries
    const lastError = state.errors[state.errors.length - 1]

    if (canRetry) {
      return {
        retryCount: state.retryCount + 1,
        errors: [
          ...state.errors.slice(0, -1),
          {
            ...lastError,
            recovered: true,
            recoveryAction: 'retry',
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    } else {
      // Apply fallback or skip document
      if (state.requirements.fallbackOptions && state.currentDocument) {
        const fallbackDocument = this.createFallbackDocument(
          state.currentDocument
        )

        return {
          pendingDocuments: state.pendingDocuments.slice(1),
          completedDocuments: [...state.completedDocuments, fallbackDocument],
          errors: [
            ...state.errors.slice(0, -1),
            {
              ...lastError,
              recovered: true,
              recoveryAction: 'fallback_applied',
            },
          ],
          updatedAt: new Date().toISOString(),
        }
      } else {
        return {
          status: 'failed',
          updatedAt: new Date().toISOString(),
        }
      }
    }
  }

  async finalizePackage(
    state: DocumentWorkflowState
  ): Promise<Partial<DocumentWorkflowState>> {
    const finalStatus: WorkflowStatus =
      state.completedDocuments.length === state.requirements.documents.length
        ? 'completed'
        : state.completedDocuments.length > 0
          ? 'completed' // Partial success still counts as completed
          : 'failed'

    return {
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    }
  }

  // ========== ROUTING FUNCTIONS ==========

  private routeAfterGeneration(state: DocumentWorkflowState): string {
    if (
      state.errors.length > 0 &&
      state.errors[state.errors.length - 1].step === 'generate_document'
    ) {
      return 'error'
    }
    if (state.pendingDocuments.length === 0) {
      return 'complete'
    }
    return 'continue'
  }

  private routeAfterValidation(state: DocumentWorkflowState): string {
    if (state.pendingDocuments.length === 0) {
      return 'complete'
    }

    // Check if last document needs retry based on quality
    const lastDocument =
      state.completedDocuments[state.completedDocuments.length - 1]
    if (
      lastDocument?.quality.score < 0.7 &&
      state.retryCount < state.maxRetries
    ) {
      return 'retry'
    }

    return 'next_document'
  }

  private routeAfterError(state: DocumentWorkflowState): string {
    const canRetry = state.retryCount < state.maxRetries

    if (canRetry) {
      return 'retry'
    }

    if (state.requirements.fallbackOptions) {
      return 'skip'
    }

    return 'fail'
  }

  // ========== HELPER METHODS ==========

  private async generateDocumentWithAgent(
    documentType: DocumentType,
    state: DocumentWorkflowState,
    agent: DocumentAgent
  ): Promise<GeneratedDocument> {
    const context = this.createDocumentContext(state.context, documentType)
    const options = this.createDocumentOptions(state.options, documentType)

    const result = await agent.generateDocument({
      type: documentType,
      context,
      options,
      previousContent: state.generatedContent,
    })

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      title: result.title,
      content: result.content,
      format: state.options.format,
      metadata: {
        wordCount: result.content.split(' ').length,
        readingTime: Math.ceil(result.content.split(' ').length / 200),
        complexity: state.options.complexity,
        tone: state.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'DocumentAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.8, // Will be updated in validation
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateAnalysisDocument(
    documentType: DocumentType,
    state: DocumentWorkflowState,
    agent: OfferAnalysisAgent
  ): Promise<GeneratedDocument> {
    const context = this.createAnalysisContext(state.context)
    const options = this.createAnalysisOptions(state.options)

    const result = await agent.analyzeOffer({
      ...context,
      analysisType:
        documentType === 'offer_analysis' ? 'comprehensive' : 'risk_assessment',
      options,
    })

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      title: `${documentType.replace('_', ' ').toUpperCase()} Analysis`,
      content: this.formatAnalysisResult(result),
      format: state.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: state.options.complexity,
        tone: state.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'OfferAnalysisAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateNegotiationDocument(
    documentType: DocumentType,
    state: DocumentWorkflowState,
    agent: NegotiationAgent
  ): Promise<GeneratedDocument> {
    const context = this.createNegotiationContext(state.context)
    const options = this.createNegotiationOptions(state.options)

    const result = await agent.developStrategy({
      ...context,
      strategyType: 'comprehensive',
      options,
    })

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      title: 'Negotiation Strategy',
      content: this.formatNegotiationResult(result),
      format: state.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: state.options.complexity,
        tone: state.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'NegotiationAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateMarketDocument(
    documentType: DocumentType,
    state: DocumentWorkflowState,
    agent: MarketAnalysisAgent
  ): Promise<GeneratedDocument> {
    const context = this.createMarketContext(state.context)
    const options = this.createMarketOptions(state.options)

    const result = await agent.generateMarketAnalysis({
      ...context,
      analysisType: 'comprehensive',
      options,
    })

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      title: 'Market Analysis',
      content: this.formatMarketResult(result),
      format: state.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: state.options.complexity,
        tone: state.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'MarketAnalysisAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async validateDocumentQuality(
    document: GeneratedDocument,
    options: DocumentGenerationOptions
  ): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 1.0

    // Basic quality checks
    if (document.content.length < 100) {
      issues.push('Content too short')
      score -= 0.3
    }

    if (document.content.length > 5000 && options.complexity === 'simple') {
      issues.push('Content too long for simple complexity')
      score -= 0.1
    }

    // Tone validation
    const toneKeywords = {
      professional: ['professional', 'formal', 'business'],
      warm: ['warm', 'friendly', 'personal'],
      confident: ['confident', 'assured', 'strong'],
      analytical: ['analysis', 'data', 'metrics'],
    }

    const expectedKeywords = toneKeywords[options.tone] || []
    const hasExpectedTone = expectedKeywords.some(keyword =>
      document.content.toLowerCase().includes(keyword)
    )

    if (!hasExpectedTone) {
      issues.push(`Document tone doesn't match expected ${options.tone} tone`)
      score -= 0.2
    }

    // Content validation
    if (options.includeMarketAnalysis && document.type !== 'market_analysis') {
      if (!document.content.toLowerCase().includes('market')) {
        suggestions.push('Consider adding market analysis context')
      }
    }

    if (
      options.includeNegotiationTactics &&
      document.type !== 'negotiation_strategy'
    ) {
      if (!document.content.toLowerCase().includes('negotiation')) {
        suggestions.push('Consider adding negotiation insights')
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      issues,
      suggestions,
    }
  }

  private async generatePackageInsights(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): Promise<DocumentInsights> {
    const allContent = documents.map(doc => doc.content).join(' ')
    const words = allContent.split(' ')

    // Extract key themes (simplified approach)
    const keyThemes = this.extractKeyThemes(allContent)

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(documents)

    // Generate recommendations
    const recommendedActions = this.generateRecommendedActions(
      documents,
      context
    )

    // Market alignment assessment
    const marketAlignment = this.assessMarketAlignment(documents, context)

    // Strategic position analysis
    const strategicPosition = this.analyzeStrategicPosition(documents, context)

    // Risk factor identification
    const riskFactors = this.identifyRiskFactors(documents, context)

    return {
      keyThemes,
      consistencyScore,
      recommendedActions,
      marketAlignment,
      strategicPosition,
      riskFactors,
      qualityMetrics: {
        averageScore:
          documents.reduce((sum, doc) => sum + doc.quality.score, 0) /
          documents.length,
        totalWords: words.length,
        estimatedReadingTime: Math.ceil(words.length / 200),
      },
    }
  }

  private async generatePackageRecommendations(
    documents: GeneratedDocument[],
    insights: DocumentInsights,
    state: DocumentWorkflowState
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Quality-based recommendations
    if (insights.qualityMetrics.averageScore < 0.7) {
      recommendations.push(
        'Consider reviewing and refining generated content for better quality'
      )
    }

    // Consistency recommendations
    if (insights.consistencyScore < 0.8) {
      recommendations.push(
        'Ensure consistent messaging and tone across all documents'
      )
    }

    // Market alignment recommendations
    if (insights.marketAlignment.includes('misaligned')) {
      recommendations.push(
        'Review market positioning and adjust strategy accordingly'
      )
    }

    // Document-specific recommendations
    if (documents.some(doc => doc.type === 'negotiation_strategy')) {
      recommendations.push(
        'Practice key negotiation points before client meetings'
      )
    }

    if (documents.some(doc => doc.type === 'market_analysis')) {
      recommendations.push(
        'Share market insights with client to build credibility'
      )
    }

    // Risk-based recommendations
    if (insights.riskFactors.length > 0) {
      recommendations.push(
        'Address identified risk factors in client communications'
      )
    }

    return recommendations
  }

  private topologicalSort(
    documents: DocumentType[],
    dependencies: Record<string, string[]>
  ): DocumentType[] {
    const visited = new Set<string>()
    const result: DocumentType[] = []

    const visit = (doc: DocumentType) => {
      if (visited.has(doc)) return
      visited.add(doc)

      const deps = dependencies[doc] || []
      deps.forEach(dep => {
        if (documents.includes(dep as DocumentType)) {
          visit(dep as DocumentType)
        }
      })

      result.push(doc)
    }

    documents.forEach(doc => visit(doc))
    return result
  }

  private createParallelGroups(
    order: DocumentType[],
    dependencies: Record<string, string[]>
  ): DocumentType[][] {
    const groups: DocumentType[][] = []
    const processed = new Set<string>()

    for (const doc of order) {
      if (processed.has(doc)) continue

      const deps = dependencies[doc] || []
      const canRunNow = deps.every(dep => processed.has(dep))

      if (canRunNow) {
        // Find other documents that can run in parallel
        const parallelDocs = order.filter(otherDoc => {
          if (processed.has(otherDoc) || otherDoc === doc) return false
          const otherDeps = dependencies[otherDoc] || []
          return otherDeps.every(dep => processed.has(dep))
        })

        const group = [doc, ...parallelDocs]
        groups.push(group)
        group.forEach(d => processed.add(d))
      }
    }

    return groups
  }

  private estimateGenerationTime(
    documents: DocumentType[],
    options: DocumentGenerationOptions
  ): number {
    const baseTime = 30000 // 30 seconds per document
    const complexityMultiplier =
      options.complexity === 'simple'
        ? 0.7
        : options.complexity === 'detailed'
          ? 1.5
          : 1.0
    const speedMultiplier = options.prioritizeSpeed ? 0.8 : 1.0

    return documents.length * baseTime * complexityMultiplier * speedMultiplier
  }

  private createGenerationPhases(
    order: DocumentType[],
    dependencies: Record<string, string[]>
  ): GenerationPhase[] {
    const phases: GenerationPhase[] = []
    const processed = new Set<string>()

    let phaseIndex = 0
    while (processed.size < order.length) {
      const phaseDocs = order.filter(doc => {
        if (processed.has(doc)) return false
        const deps = dependencies[doc] || []
        return deps.every(dep => processed.has(dep))
      })

      if (phaseDocs.length === 0) break

      phases.push({
        name: `Phase ${phaseIndex + 1}`,
        documents: phaseDocs,
        dependencies: [],
        canRunInParallel: phaseDocs.length > 1,
      })

      phaseDocs.forEach(doc => processed.add(doc))
      phaseIndex++
    }

    return phases
  }

  private createFallbackDocument(
    documentType: DocumentType
  ): GeneratedDocument {
    return {
      id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      title: `${documentType.replace('_', ' ').toUpperCase()} (Fallback)`,
      content: `This ${documentType.replace('_', ' ')} document was generated as a fallback due to processing issues. Please review and customize as needed.`,
      format: 'text',
      metadata: {
        wordCount: 20,
        readingTime: 1,
        complexity: 'simple',
        tone: 'professional',
        generatedAt: new Date(),
        version: '1.0.0-fallback',
        agentUsed: 'Fallback',
        toolsUsed: [],
      },
      quality: {
        score: 0.5,
        issues: ['Fallback content used'],
        suggestions: ['Review and customize content'],
      },
    }
  }

  private estimateTokensUsed(documents: GeneratedDocument[]): number {
    return documents.reduce(
      (total, doc) => total + Math.ceil(doc.content.length / 4),
      0
    )
  }

  // Context creation helpers
  private createDocumentContext(
    context: DocumentGenerationContext,
    documentType: DocumentType
  ): any {
    return {
      property: context.property,
      client: context.client,
      agent: context.agent,
      market: context.market,
      offer: context.offer,
      negotiation: context.negotiation,
      documentType,
    }
  }

  private createDocumentOptions(
    options: DocumentGenerationOptions,
    documentType: DocumentType
  ): any {
    return {
      format: options.format,
      tone: options.tone,
      complexity: options.complexity,
      includeMarketAnalysis: options.includeMarketAnalysis,
      includeClientEducation: options.includeClientEducation,
      brokerageBranding: options.brokerageBranding,
    }
  }

  private createAnalysisContext(context: DocumentGenerationContext): any {
    return {
      offer: context.offer,
      property: context.property,
      market: context.market,
      marketData: context.marketData,
      competingOffers: context.competingOffers,
    }
  }

  private createAnalysisOptions(options: DocumentGenerationOptions): any {
    return {
      complexity: options.complexity,
      includeRiskAssessment: options.includeRiskAssessment,
      includeMarketAnalysis: options.includeMarketAnalysis,
    }
  }

  private createNegotiationContext(context: DocumentGenerationContext): any {
    return {
      offer: context.offer,
      negotiation: context.negotiation,
      property: context.property,
      client: context.client,
      market: context.market,
      competingOffers: context.competingOffers,
    }
  }

  private createNegotiationOptions(options: DocumentGenerationOptions): any {
    return {
      complexity: options.complexity,
      includeNegotiationTactics: options.includeNegotiationTactics,
      tone: options.tone,
    }
  }

  private createMarketContext(context: DocumentGenerationContext): any {
    return {
      location: context.market?.location || {
        city: 'Unknown',
        state: 'Unknown',
      },
      propertyType: context.property.type,
      priceRange: {
        min: context.property.price * 0.8,
        max: context.property.price * 1.2,
        median: context.property.price,
      },
      marketConditions: {
        trend: context.market?.trend || 'warm',
        inventory: context.market?.inventory || 'balanced',
        seasonality: 'normal',
      },
    }
  }

  private createMarketOptions(options: DocumentGenerationOptions): any {
    return {
      complexity: options.complexity,
      includeMarketAnalysis: options.includeMarketAnalysis,
      format: options.format,
    }
  }

  // Formatting helpers
  private formatAnalysisResult(result: any): string {
    return JSON.stringify(result, null, 2)
  }

  private formatNegotiationResult(result: any): string {
    return JSON.stringify(result, null, 2)
  }

  private formatMarketResult(result: any): string {
    return JSON.stringify(result, null, 2)
  }

  // Analysis helpers
  private extractKeyThemes(content: string): string[] {
    const words = content.toLowerCase().split(/\W+/)
    const wordCount = new Map<string, number>()

    words.forEach(word => {
      if (word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private calculateConsistencyScore(documents: GeneratedDocument[]): number {
    if (documents.length < 2) return 1.0

    const tones = documents.map(doc => doc.metadata.tone)
    const uniqueTones = new Set(tones)

    const complexity = documents.map(doc => doc.metadata.complexity)
    const uniqueComplexity = new Set(complexity)

    const toneConsistency = 1 - (uniqueTones.size - 1) / documents.length
    const complexityConsistency =
      1 - (uniqueComplexity.size - 1) / documents.length

    return (toneConsistency + complexityConsistency) / 2
  }

  private generateRecommendedActions(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): string[] {
    const actions: string[] = []

    if (documents.some(doc => doc.type === 'cover_letter')) {
      actions.push('Review cover letter for personalization')
    }

    if (documents.some(doc => doc.type === 'negotiation_strategy')) {
      actions.push('Prepare negotiation talking points')
    }

    if (context.client.experienceLevel === 'first-time') {
      actions.push('Schedule client education session')
    }

    return actions
  }

  private assessMarketAlignment(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): string {
    const marketDoc = documents.find(doc => doc.type === 'market_analysis')
    if (!marketDoc) return 'No market analysis available'

    const trend = context.market?.trend || 'warm'
    const alignment =
      trend === 'hot' ? 'Strongly aligned' : 'Moderately aligned'

    return `${alignment} with current ${trend} market conditions`
  }

  private analyzeStrategicPosition(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): string {
    const role = context.client.role
    const trend = context.market?.trend || 'warm'

    if (role === 'buyer' && trend === 'hot') {
      return 'Competitive position requires aggressive strategy'
    } else if (role === 'seller' && trend === 'cool') {
      return 'Defensive position requires flexible pricing'
    }

    return 'Balanced strategic position'
  }

  private identifyRiskFactors(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): string[] {
    const risks: string[] = []

    if (context.market?.trend === 'hot' && context.client.role === 'buyer') {
      risks.push('High competition may lead to overbidding')
    }

    if (context.property.daysOnMarket && context.property.daysOnMarket > 60) {
      risks.push('Extended time on market may indicate pricing issues')
    }

    if (context.client.experienceLevel === 'first-time') {
      risks.push('First-time buyer may need additional guidance')
    }

    return risks
  }
}

// ========== WORKFLOW EXECUTION SERVICE ==========

export class WorkflowExecutionService {
  private workflow: StateGraph<DocumentWorkflowState>
  private orchestrator: DocumentOrchestrationWorkflow

  constructor() {
    this.orchestrator = new DocumentOrchestrationWorkflow()
    this.workflow = this.orchestrator.createWorkflow()
  }

  async executeDocumentPackage(
    packageType: DocumentPackageType,
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions,
    requirements: DocumentRequirements,
    streamingCallback?: StreamingCallbackHandler
  ): Promise<DocumentPackageResult> {
    const initialState: DocumentWorkflowState = {
      packageId: '',
      packageType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context,
      options,
      requirements,
      pendingDocuments: [],
      completedDocuments: [],
      failedDocuments: [],
      generationPlan: {
        order: [],
        phases: [],
        estimatedTime: 0,
        parallelGroups: [],
      },
      dependencies: {},
      generatedContent: {},
      retryCount: 0,
      maxRetries: 3,
      errors: [],
      messages: [],
    }

    try {
      // Compile and execute workflow
      const compiledWorkflow = this.workflow.compile()
      const result = await compiledWorkflow.invoke(initialState)

      // Convert workflow result to package result
      return this.convertWorkflowResultToPackageResult(result)
    } catch (error) {
      return this.createFailedPackageResult(packageType, context, error)
    }
  }

  private convertWorkflowResultToPackageResult(
    state: DocumentWorkflowState
  ): DocumentPackageResult {
    return {
      packageId: state.packageId,
      status:
        state.status === 'completed'
          ? 'success'
          : state.status === 'failed'
            ? 'failed'
            : 'partial',
      documents: state.completedDocuments,
      metadata: state.metadata || {
        generatedAt: new Date(),
        totalTime: 0,
        tokensUsed: 0,
        documentsRequested: state.requirements.documents.length,
        documentsGenerated: state.completedDocuments.length,
        packageType: state.packageType,
        clientId: state.context.client.name,
        agentId: state.context.agent.name,
        workflowVersion: '1.0.0',
      },
      insights: state.insights || {
        keyThemes: [],
        consistencyScore: 0,
        recommendedActions: [],
        marketAlignment: '',
        strategicPosition: '',
        riskFactors: [],
        qualityMetrics: {
          averageScore: 0,
          totalWords: 0,
          estimatedReadingTime: 0,
        },
      },
      recommendations: state.recommendations || [],
      errors: state.failedDocuments,
    }
  }

  private createFailedPackageResult(
    packageType: DocumentPackageType,
    context: DocumentGenerationContext,
    error: any
  ): DocumentPackageResult {
    return {
      packageId: `failed-${Date.now()}`,
      status: 'failed',
      documents: [],
      metadata: {
        generatedAt: new Date(),
        totalTime: 0,
        tokensUsed: 0,
        documentsRequested: 0,
        documentsGenerated: 0,
        packageType,
        clientId: context.client.name,
        agentId: context.agent.name,
        workflowVersion: '1.0.0',
      },
      insights: {
        keyThemes: [],
        consistencyScore: 0,
        recommendedActions: [],
        marketAlignment: '',
        strategicPosition: '',
        riskFactors: [],
        qualityMetrics: {
          averageScore: 0,
          totalWords: 0,
          estimatedReadingTime: 0,
        },
      },
      recommendations: [],
      errors: [
        {
          documentType: 'cover_letter',
          error: error instanceof Error ? error.message : 'Unknown error',
          severity: 'high',
          fallbackApplied: false,
          retryAttempt: 0,
        },
      ],
    }
  }
}

// ========== EXPORT TYPES FOR COMPATIBILITY ==========

export interface DocumentPackageRequest {
  type: DocumentPackageType
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  requirements: DocumentRequirements
}

export interface DocumentPackageResult {
  packageId: string
  status: 'success' | 'partial' | 'failed'
  documents: GeneratedDocument[]
  metadata: WorkflowMetadata
  insights: DocumentInsights
  recommendations: string[]
  errors?: DocumentError[]
}

// ========== CONVENIENCE FUNCTIONS ==========

export const executeDocumentPackage = async (
  request: DocumentPackageRequest,
  streamingCallback?: StreamingCallbackHandler
): Promise<DocumentPackageResult> => {
  const service = new WorkflowExecutionService()
  return service.executeDocumentPackage(
    request.type,
    request.context,
    request.options,
    request.requirements,
    streamingCallback
  )
}

export const generateBuyerOfferPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  const service = new WorkflowExecutionService()
  return service.executeDocumentPackage(
    'buyer_offer_package',
    context,
    {
      format: 'text',
      complexity: 'intermediate',
      tone: 'warm',
      includeMarketAnalysis: true,
      includeRiskAssessment: true,
      includeNegotiationTactics: false,
      includeClientEducation: true,
      prioritizeSpeed: false,
      ensureConsistency: true,
      validateContent: true,
      ...options,
    },
    {
      documents: [
        'cover_letter',
        'explanation_memo',
        'offer_analysis',
        'market_analysis',
      ],
      deliveryMethod: 'batch',
      qualityLevel: 'review',
      fallbackOptions: true,
    }
  )
}

export const generateSellerCounterPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  const service = new WorkflowExecutionService()
  return service.executeDocumentPackage(
    'seller_counter_package',
    context,
    {
      format: 'text',
      complexity: 'detailed',
      tone: 'professional',
      includeMarketAnalysis: true,
      includeRiskAssessment: true,
      includeNegotiationTactics: true,
      includeClientEducation: false,
      prioritizeSpeed: false,
      ensureConsistency: true,
      validateContent: true,
      ...options,
    },
    {
      documents: [
        'cover_letter',
        'explanation_memo',
        'negotiation_strategy',
        'market_analysis',
      ],
      deliveryMethod: 'batch',
      qualityLevel: 'review',
      fallbackOptions: true,
    }
  )
}
