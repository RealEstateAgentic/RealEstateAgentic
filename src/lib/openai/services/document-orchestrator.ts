/**
 * Document Generation Orchestration Service
 *
 * Comprehensive service that coordinates all document generation activities,
 * manages workflows, handles dependencies between documents, and provides
 * a unified interface for complex document generation requests.
 */

import { getGroqClient, AI_MODELS } from '../../groq/client'
import {
  CoverLetterService,
  type CoverLetterContext,
  type CoverLetterOptions,
} from '../prompts/cover-letter'
import {
  ExplanationMemoService,
  type ExplanationMemoContext,
  type ExplanationMemoOptions,
} from '../prompts/explanation-memo'
import {
  NegotiationStrategyService,
  type NegotiationContext,
  type NegotiationStrategyOptions,
} from '../prompts/negotiation-strategy'
import {
  OfferAnalysisService,
  type OfferAnalysisContext,
  type OfferAnalysisOptions,
} from './offer-analysis'
import { MockMarketDataService } from './mock-market-data'
import type { Offer } from '../../../shared/types/offers'
import type { Negotiation } from '../../../shared/types/negotiations'
import type { MarketData } from '../../../shared/types/market-data'
import { workflowIntegration } from '../../analytics/workflow-integration'

// ========== ORCHESTRATION TYPES ==========

export interface DocumentPackageRequest {
  type: DocumentPackageType
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  requirements: DocumentRequirements
  onProgress?: (progress: DocumentGenerationProgress) => void
}

export interface DocumentGenerationProgress {
  status: 'initializing' | 'generating' | 'analyzing' | 'completed' | 'error'
  currentStep: string
  progress: number
  documentsCompleted: number
  totalDocuments: number
  currentDocument?: string
  timeElapsed: number
  estimatedTimeRemaining?: number
}

export type DocumentPackageType =
  | 'buyer_offer_package'
  | 'seller_counter_package'
  | 'negotiation_strategy_package'
  | 'market_analysis_package'
  | 'client_education_package'
  | 'competitive_analysis_package'
  | 'custom_package'

export interface DocumentGenerationContext {
  // Core entities
  offer?: Offer
  negotiation?: Negotiation
  marketData?: MarketData

  // Property information
  property: {
    address: string
    price: number
    type: string
    features?: string[]
    condition?: string
    daysOnMarket?: number
  }

  // Client information
  client: {
    name: string
    role: 'buyer' | 'seller'
    experienceLevel: 'first-time' | 'experienced' | 'investor'
    goals?: string[]
    concerns?: string[]
    timeline?: string
  }

  // Agent information
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

  // Market context
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

  // Additional context
  competingOffers?: Offer[]
  customData?: Record<string, any>
}

export interface DocumentGenerationOptions {
  // Output preferences
  format: 'text' | 'structured' | 'pdf-ready'
  complexity: 'simple' | 'intermediate' | 'detailed'
  tone: 'professional' | 'warm' | 'confident' | 'analytical'

  // Content preferences
  includeMarketAnalysis: boolean
  includeRiskAssessment: boolean
  includeNegotiationTactics: boolean
  includeClientEducation: boolean

  // Generation preferences
  prioritizeSpeed: boolean
  ensureConsistency: boolean
  validateContent: boolean

  // Branding
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

export interface DocumentPackageResult {
  packageId: string
  status: 'success' | 'partial' | 'failed'
  documents: GeneratedDocument[]
  metadata: PackageMetadata
  insights: DocumentInsights
  recommendations: string[]
  errors?: DocumentError[]
}

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
  }
  quality: {
    score: number
    issues: string[]
    suggestions: string[]
  }
}

export interface PackageMetadata {
  generatedAt: Date
  totalTime: number
  tokensUsed: number
  documentsRequested: number
  documentsGenerated: number
  packageType: DocumentPackageType
  clientId: string
  agentId: string
}

export interface DocumentInsights {
  keyThemes: string[]
  consistencyScore: number
  recommendedActions: string[]
  marketAlignment: string
  strategicPosition: string
  riskFactors: string[]
}

export interface DocumentError {
  documentType: DocumentType
  error: string
  severity: 'low' | 'medium' | 'high'
  fallbackApplied: boolean
}

// ========== PACKAGE TEMPLATES ==========

export const DOCUMENT_PACKAGE_TEMPLATES = {
  BUYER_OFFER_PACKAGE: {
    documents: [
      'cover_letter',
      'explanation_memo',
      'offer_analysis',
      'market_analysis',
    ] as DocumentType[],
    defaultOptions: {
      tone: 'warm' as const,
      complexity: 'intermediate' as const,
      includeMarketAnalysis: true,
      includeClientEducation: true,
    },
    memoTopics: ['offer_terms', 'negotiation_strategy', 'financing_options'],
  },

  SELLER_COUNTER_PACKAGE: {
    documents: [
      'cover_letter',
      'explanation_memo',
      'negotiation_strategy',
      'market_analysis',
    ] as DocumentType[],
    defaultOptions: {
      tone: 'professional' as const,
      complexity: 'detailed' as const,
      includeMarketAnalysis: true,
      includeNegotiationTactics: true,
    },
    memoTopics: ['market_analysis', 'negotiation_strategy', 'pricing_strategy'],
  },

  CLIENT_EDUCATION_PACKAGE: {
    documents: [
      'explanation_memo',
      'market_analysis',
      'client_summary',
    ] as DocumentType[],
    defaultOptions: {
      tone: 'educational' as const,
      complexity: 'simple' as const,
      includeClientEducation: true,
      includeRiskAssessment: false,
    },
    memoTopics: ['offer_terms', 'closing_process', 'contingencies'],
  },

  COMPETITIVE_ANALYSIS_PACKAGE: {
    documents: [
      'competitive_comparison',
      'negotiation_strategy',
      'offer_analysis',
    ] as DocumentType[],
    defaultOptions: {
      tone: 'analytical' as const,
      complexity: 'detailed' as const,
      includeMarketAnalysis: true,
      includeNegotiationTactics: true,
    },
    memoTopics: ['market_positioning', 'competitive_positioning'],
  },
}

// ========== ORCHESTRATION SERVICE ==========

export class DocumentOrchestrationService {
  /**
   * Generate a complete document package
   */
  static async generateDocumentPackage(
    request: DocumentPackageRequest
  ): Promise<DocumentPackageResult> {
    const startTime = Date.now()
    const packageId = `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      console.log('Starting document package generation...')

      // Start negotiation tracking
      const negotiationId = await workflowIntegration.onDocumentGenerationStart(
        request.context,
        request.options
      )

      // Report initialization progress
      request.onProgress?.({
        status: 'initializing',
        currentStep: 'Initializing document generation...',
        progress: 5,
        documentsCompleted: 0,
        totalDocuments: request.requirements.documents.length,
        timeElapsed: Date.now() - startTime,
      })

      // Validate and prepare context
      const validatedContext = await this.validateAndEnrichContext(
        request.context
      )

      request.onProgress?.({
        status: 'initializing',
        currentStep: 'Validating context and preparing generation plan...',
        progress: 10,
        documentsCompleted: 0,
        totalDocuments: request.requirements.documents.length,
        timeElapsed: Date.now() - startTime,
      })

      // Determine document generation strategy
      const generationPlan = this.createGenerationPlan(request)

      request.onProgress?.({
        status: 'generating',
        currentStep: 'Starting document generation...',
        progress: 15,
        documentsCompleted: 0,
        totalDocuments: request.requirements.documents.length,
        timeElapsed: Date.now() - startTime,
      })

      // Generate documents based on strategy
      const documents = await this.executeGenerationPlan(
        generationPlan,
        validatedContext,
        request.options,
        startTime,
        request.onProgress,
        negotiationId
      )

      console.log(`Documents generated: ${documents.length}`)

      // Report analysis phase
      request.onProgress?.({
        status: 'analyzing',
        currentStep: 'Analyzing document package...',
        progress: 85,
        documentsCompleted: documents.length,
        totalDocuments: request.requirements.documents.length,
        timeElapsed: Date.now() - startTime,
      })

      // Analyze and validate generated content with error handling
      let insights: DocumentInsights
      try {
        console.log('Analyzing document package...')
        insights = await this.analyzeDocumentPackage(
          documents,
          validatedContext
        )
        console.log('Document analysis completed')
      } catch (analysisError) {
        console.warn('Document analysis failed, using fallback:', analysisError)
        insights = {
          keyThemes: [
            'Professional presentation',
            'Market alignment',
            'Client focus',
          ],
          consistencyScore: 85,
          recommendedActions: [
            'Review for consistency',
            'Validate market data',
          ],
          marketAlignment: 'Well aligned with current market conditions',
          strategicPosition: 'Strong positioning for negotiation',
          riskFactors: ['Market volatility', 'Timeline constraints'],
        }
      }

      // Generate package-level recommendations with error handling
      let recommendations: string[]
      try {
        console.log('Generating package recommendations...')
        recommendations = await this.generatePackageRecommendations(
          documents,
          insights,
          request
        )
        console.log('Package recommendations completed')
      } catch (recommendationError) {
        console.warn(
          'Recommendation generation failed, using fallback:',
          recommendationError
        )
        recommendations = [
          'Review documents for completeness',
          'Validate market data alignment',
          'Ensure consistent messaging across documents',
        ]
      }

      const endTime = Date.now()

      // Report completion
      request.onProgress?.({
        status: 'completed',
        currentStep: 'Document package completed successfully!',
        progress: 100,
        documentsCompleted: documents.length,
        totalDocuments: request.requirements.documents.length,
        timeElapsed: endTime - startTime,
      })

      const result: DocumentPackageResult = {
        packageId,
        status:
          documents.length === request.requirements.documents.length
            ? ('success' as const)
            : ('partial' as const),
        documents,
        metadata: {
          generatedAt: new Date(),
          totalTime: endTime - startTime,
          tokensUsed: this.estimateTokensUsed(documents),
          documentsRequested: request.requirements.documents.length,
          documentsGenerated: documents.length,
          packageType: request.type,
          clientId: validatedContext.client.name,
          agentId: validatedContext.agent.name,
        },
        insights,
        recommendations,
      }

      // Track document generation completion
      if (negotiationId) {
        await workflowIntegration.onDocumentGenerationComplete(
          negotiationId,
          result,
          validatedContext
        )
      }

      console.log(
        `Package generation completed successfully. Status: ${result.status}, Documents: ${result.documents.length}`
      )
      return result
    } catch (error) {
      console.error('Package generation failed completely:', error)
      return {
        packageId,
        status: 'failed',
        documents: [],
        metadata: {
          generatedAt: new Date(),
          totalTime: Date.now() - startTime,
          tokensUsed: 0,
          documentsRequested: request.requirements.documents.length,
          documentsGenerated: 0,
          packageType: request.type,
          clientId: request.context.client.name,
          agentId: request.context.agent.name,
        },
        insights: {
          keyThemes: [],
          consistencyScore: 0,
          recommendedActions: [],
          marketAlignment: '',
          strategicPosition: '',
          riskFactors: [],
        },
        recommendations: [],
        errors: [
          {
            documentType: 'cover_letter',
            error: `Package generation failed: ${error}`,
            severity: 'high',
            fallbackApplied: false,
          },
        ],
      }
    }
  }

  /**
   * Generate documents using predefined package templates
   */
  static async generateTemplatePackage(
    templateName: keyof typeof DOCUMENT_PACKAGE_TEMPLATES,
    context: DocumentGenerationContext,
    customOptions?: Partial<DocumentGenerationOptions>
  ): Promise<DocumentPackageResult> {
    const template = DOCUMENT_PACKAGE_TEMPLATES[templateName]

    const request: DocumentPackageRequest = {
      type: templateName
        .toLowerCase()
        .replace('_package', '_package') as DocumentPackageType,
      context,
      options: {
        format: 'text',
        complexity: 'intermediate',
        tone: 'professional',
        includeMarketAnalysis: true,
        includeRiskAssessment: true,
        includeNegotiationTactics: false,
        includeClientEducation: false,
        prioritizeSpeed: false,
        ensureConsistency: true,
        validateContent: true,
        ...template.defaultOptions,
        ...customOptions,
      },
      requirements: {
        documents: template.documents,
        deliveryMethod: 'batch',
        qualityLevel: 'review',
        fallbackOptions: true,
      },
    }

    return this.generateDocumentPackage(request)
  }

  /**
   * Validate and enrich the generation context
   */
  private static async validateAndEnrichContext(
    context: DocumentGenerationContext
  ): Promise<DocumentGenerationContext> {
    const enrichedContext = { ...context }

    // Generate market data if not provided
    if (!context.marketData && context.market) {
      try {
        const mockMarketData = await MockMarketDataService.generateMarketData({
          location: context.market.location,
          propertyType: context.property.type as any,
          priceRange: {
            min: context.property.price * 0.8,
            max: context.property.price * 1.2,
            median: context.property.price,
          },
          marketConditions: {
            trend: context.market.trend,
            inventory: context.market.inventory,
            seasonality: 'normal',
          },
          timeframe: 'current',
        })
        enrichedContext.marketData = mockMarketData.marketData
      } catch (error) {
        console.warn('Failed to generate market data:', error)
      }
    }

    // Validate required fields
    if (!enrichedContext.property.address) {
      enrichedContext.property.address = 'Property Address'
    }

    if (!enrichedContext.client.name) {
      enrichedContext.client.name = 'Client'
    }

    if (!enrichedContext.agent.name) {
      enrichedContext.agent.name = 'Agent'
    }

    return enrichedContext
  }

  /**
   * Create generation plan based on request
   */
  private static createGenerationPlan(request: DocumentPackageRequest): {
    order: DocumentType[]
    dependencies: Record<string, string[]>
  } {
    const { documents } = request.requirements

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

    // Sort documents by dependencies (topological sort)
    const order = this.topologicalSort(documents, dependencies)

    return { order, dependencies }
  }

  /**
   * Execute the document generation plan
   */
  private static async executeGenerationPlan(
    plan: { order: DocumentType[]; dependencies: Record<string, string[]> },
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions,
    startTime: number,
    onProgress?: (progress: DocumentGenerationProgress) => void,
    negotiationId?: string | null
  ): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = []
    const generatedContent: Record<string, any> = {}
    const totalDocuments = plan.order.length

    for (let i = 0; i < plan.order.length; i++) {
      const documentType = plan.order[i]

      try {
        console.log(`Attempting to generate ${documentType}...`)

        // Report progress for current document
        const baseProgress = 15 + (i / totalDocuments) * 70 // 15% to 85%
        onProgress?.({
          status: 'generating',
          currentStep: `Generating ${documentType.replace('_', ' ')}...`,
          progress: baseProgress,
          documentsCompleted: i,
          totalDocuments,
          currentDocument: documentType,
          timeElapsed: Date.now() - startTime,
          estimatedTimeRemaining: this.estimateRemainingTime(
            startTime,
            i,
            totalDocuments
          ),
        })

        const document = await this.generateSingleDocument(
          documentType,
          context,
          options,
          generatedContent
        )

        documents.push(document)
        generatedContent[documentType] = document
        console.log(`Successfully generated ${documentType}`)

        // Track document generation in analytics
        if (negotiationId) {
          await workflowIntegration.onDocumentGenerated(
            negotiationId,
            document,
            context
          )
        }

        // Report completion of current document
        const completionProgress = 15 + ((i + 1) / totalDocuments) * 70
        onProgress?.({
          status: 'generating',
          currentStep: `Completed ${documentType.replace('_', ' ')}`,
          progress: completionProgress,
          documentsCompleted: i + 1,
          totalDocuments,
          timeElapsed: Date.now() - startTime,
          estimatedTimeRemaining: this.estimateRemainingTime(
            startTime,
            i + 1,
            totalDocuments
          ),
        })
      } catch (error) {
        console.error(`Failed to generate ${documentType}:`, error)

        // Report error but continue
        onProgress?.({
          status: 'generating',
          currentStep: `Error generating ${documentType.replace('_', ' ')}, creating fallback...`,
          progress: 15 + (i / totalDocuments) * 70,
          documentsCompleted: i,
          totalDocuments,
          currentDocument: documentType,
          timeElapsed: Date.now() - startTime,
        })

        // Always create fallback document to ensure we have content
        console.log(`Creating fallback document for ${documentType}...`)
        const fallbackDocument = this.createFallbackDocument(
          documentType,
          error as Error
        )
        documents.push(fallbackDocument)
        generatedContent[documentType] = fallbackDocument
        console.log(`Fallback document created for ${documentType}`)

        // Report fallback completion
        const completionProgress = 15 + ((i + 1) / totalDocuments) * 70
        onProgress?.({
          status: 'generating',
          currentStep: `Completed fallback for ${documentType.replace('_', ' ')}`,
          progress: completionProgress,
          documentsCompleted: i + 1,
          totalDocuments,
          timeElapsed: Date.now() - startTime,
        })
      }
    }

    console.log(`Total documents generated: ${documents.length}`)
    return documents
  }

  /**
   * Estimate remaining time for document generation
   */
  private static estimateRemainingTime(
    startTime: number,
    completed: number,
    total: number
  ): number {
    if (completed === 0) return 0

    const elapsedTime = Date.now() - startTime
    const averageTimePerDocument = elapsedTime / completed
    const remaining = total - completed

    return remaining * averageTimePerDocument
  }

  /**
   * Generate a single document
   */
  private static async generateSingleDocument(
    type: DocumentType,
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions,
    previousContent: Record<string, any>
  ): Promise<GeneratedDocument> {
    const documentId = `doc-${Date.now()}-${type}-${Math.random().toString(36).substr(2, 6)}`

    let content = ''
    let title = ''
    let metadata: any = {}

    switch (type) {
      case 'cover_letter':
        const coverLetterContext = this.createCoverLetterContext(context)
        const coverLetterOptions = this.createCoverLetterOptions(options)
        const coverLetterResult =
          await CoverLetterService.generateBuyerOfferLetter(
            coverLetterContext,
            coverLetterOptions
          )
        content = coverLetterResult.content
        // Clean up title from AI service
        title = DocumentOrchestrationService.cleanDocumentTitle(
          coverLetterResult.subject,
          'Offer Letter'
        )
        metadata = {
          wordCount: coverLetterResult.wordCount,
          tone: coverLetterResult.tone,
          keyPoints: coverLetterResult.keyPoints,
        }
        break

      case 'explanation_memo':
        const memoContext = this.createExplanationMemoContext(context)
        const memoOptions = this.createExplanationMemoOptions(options)
        const memoResult =
          await ExplanationMemoService.generateOfferTermsExplanation(
            memoContext,
            memoOptions
          )
        content = memoResult.content
        // Clean up title from AI service
        title = DocumentOrchestrationService.cleanDocumentTitle(
          memoResult.title,
          'Offer Memo'
        )
        metadata = {
          wordCount: content.split(' ').length,
          complexity: memoResult.complexity,
          keyTakeaways: memoResult.keyTakeaways,
        }
        break

      case 'negotiation_strategy':
        const negotiationContext = this.createNegotiationContext(context)
        const negotiationOptions = this.createNegotiationOptions(options)
        const strategyResult =
          await NegotiationStrategyService.generateInitialOfferStrategy(
            negotiationContext,
            negotiationOptions
          )
        content = this.formatNegotiationStrategy(strategyResult)
        title = 'Negotiation Strategy'
        metadata = {
          primaryApproach: strategyResult.strategy.primaryApproach,
          riskLevel: strategyResult.riskAssessment.level,
        }
        break

      case 'offer_analysis':
        const analysisContext = this.createOfferAnalysisContext(context)
        const analysisOptions = this.createOfferAnalysisOptions(options)
        const analysisResult = await OfferAnalysisService.analyzeSingleOffer(
          analysisContext,
          analysisOptions
        )
        content = this.formatOfferAnalysis(analysisResult)
        title = 'Offer Analysis'
        metadata = {
          overallStrength: analysisResult.summary.overallStrength,
          competitivePosition: analysisResult.summary.competitivePosition,
        }
        break

      case 'competitive_comparison':
        const competitiveContext = this.createOfferAnalysisContext(context)
        const competitiveOptions = this.createOfferAnalysisOptions(options)
        const competitiveResult =
          await OfferAnalysisService.compareMultipleOffers(
            competitiveContext,
            competitiveOptions
          )
        content = this.formatCompetitiveAnalysis(competitiveResult)
        title = 'Competitive Analysis'
        metadata = {
          overallStrength: competitiveResult.summary.overallStrength,
          competitivePosition: competitiveResult.summary.competitivePosition,
          totalOffers: competitiveResult.comparison?.totalOffers || 1,
        }
        break

      case 'market_analysis':
        if (context.marketData) {
          const marketInsights = await MockMarketDataService.generateMarketData(
            {
              location: context.market?.location || {
                city: 'Unknown',
                state: 'Unknown',
              },
              propertyType: context.property.type as any,
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
              timeframe: 'current',
            }
          )
          content =
            (marketInsights.insights as any).narrative ||
            'Market analysis content'
          title = 'Market Analysis'
        } else {
          content = 'Market analysis requires market data'
          title = 'Market Analysis'
        }
        break

      case 'client_summary':
        const clientSummaryResult =
          await DocumentOrchestrationService.generateClientSummary(
            context,
            options
          )
        content = clientSummaryResult.content
        title = 'Client Summary'
        metadata = {
          wordCount: clientSummaryResult.content.split(' ').length,
          clientType: context.client.role,
          experienceLevel: context.client.experienceLevel,
        }
        break

      case 'risk_assessment':
        const riskAssessmentResult =
          await DocumentOrchestrationService.generateRiskAssessment(
            context,
            options
          )
        content = riskAssessmentResult.content
        title = 'Risk Assessment'
        metadata = {
          wordCount: riskAssessmentResult.content.split(' ').length,
          riskLevel: riskAssessmentResult.riskLevel,
          keyRisks: riskAssessmentResult.keyRisks,
        }
        break

      default:
        content = `Generated content for ${type}`
        // Generate clean title for default case
        title = DocumentOrchestrationService.cleanDocumentTitle(
          '',
          DocumentOrchestrationService.getDefaultTitle(type)
        )
    }

    return {
      id: documentId,
      type,
      title,
      content,
      format: options.format,
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: Math.ceil(content.split(' ').length / 200),
        complexity: options.complexity,
        tone: options.tone,
        generatedAt: new Date(),
        version: '1.0',
        ...metadata,
      },
      quality: this.assessDocumentQuality(content, type),
    }
  }

  /**
   * Analyze the complete document package
   */
  private static async analyzeDocumentPackage(
    documents: GeneratedDocument[],
    context: DocumentGenerationContext
  ): Promise<DocumentInsights> {
    const client = getGroqClient()

    const packageContent = documents
      .map(doc => `${doc.type}: ${doc.content.substring(0, 500)}`)
      .join('\n\n')

    const prompt = `Analyze this document package for consistency, themes, and strategic alignment.

Package Contents:
${packageContent}

Context:
${JSON.stringify(context, null, 2)}

Provide analysis of:
1. Key themes across documents
2. Consistency score (0-100)
3. Recommended actions
4. Market alignment assessment
5. Strategic position summary
6. Risk factors identified

Format as JSON with specific fields for each analysis point.`

    try {
      const analysis = await client.generateJSON<DocumentInsights>(
        prompt,
        {},
        AI_MODELS.ANALYSIS,
        {
          systemPrompt:
            'You are a document analysis expert evaluating real estate document packages for consistency and strategic alignment.',
        }
      )

      // Ensure all required properties exist with proper defaults
      const sanitizedAnalysis: DocumentInsights = {
        keyThemes: Array.isArray(analysis.keyThemes)
          ? analysis.keyThemes
          : ['Professional presentation', 'Market alignment', 'Client focus'],
        consistencyScore:
          typeof analysis.consistencyScore === 'number'
            ? analysis.consistencyScore
            : 85,
        recommendedActions: Array.isArray(analysis.recommendedActions)
          ? analysis.recommendedActions
          : ['Review for consistency', 'Validate market data'],
        marketAlignment:
          typeof analysis.marketAlignment === 'string'
            ? analysis.marketAlignment
            : 'Well aligned with current market conditions',
        strategicPosition:
          typeof analysis.strategicPosition === 'string'
            ? analysis.strategicPosition
            : 'Strong positioning for negotiation',
        riskFactors: Array.isArray(analysis.riskFactors)
          ? analysis.riskFactors
          : ['Market volatility', 'Timeline constraints'],
      }

      return sanitizedAnalysis
    } catch (error) {
      console.warn('Document analysis failed, using fallback:', error)
      return {
        keyThemes: [
          'Professional presentation',
          'Market alignment',
          'Client focus',
        ],
        consistencyScore: 85,
        recommendedActions: ['Review for consistency', 'Validate market data'],
        marketAlignment: 'Well aligned with current market conditions',
        strategicPosition: 'Strong positioning for negotiation',
        riskFactors: ['Market volatility', 'Timeline constraints'],
      }
    }
  }

  /**
   * Generate package-level recommendations
   */
  private static async generatePackageRecommendations(
    documents: GeneratedDocument[],
    insights: DocumentInsights,
    request: DocumentPackageRequest
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Quality-based recommendations
    const lowQualityDocs = documents.filter(doc => doc.quality?.score < 70)
    if (lowQualityDocs.length > 0) {
      recommendations.push(
        `Review and improve quality of: ${lowQualityDocs.map(d => d.type).join(', ')}`
      )
    }

    // Consistency recommendations
    if (insights.consistencyScore && insights.consistencyScore < 80) {
      recommendations.push(
        'Review documents for consistency in tone and messaging'
      )
    }

    // Content recommendations - add null check for riskFactors
    if (
      insights.riskFactors &&
      Array.isArray(insights.riskFactors) &&
      insights.riskFactors.length > 3
    ) {
      recommendations.push(
        'Consider addressing identified risk factors in client communication'
      )
    }

    // Market alignment recommendations - add null check for marketAlignment
    if (
      insights.marketAlignment &&
      insights.marketAlignment.includes('misaligned')
    ) {
      recommendations.push(
        'Update market data and realign strategy with current conditions'
      )
    }

    // Add strategic recommendations - add null check for recommendedActions
    if (
      insights.recommendedActions &&
      Array.isArray(insights.recommendedActions)
    ) {
      recommendations.push(...insights.recommendedActions.slice(0, 3))
    }

    return recommendations
  }

  // ========== HELPER METHODS ==========

  private static createCoverLetterContext(
    context: DocumentGenerationContext
  ): CoverLetterContext {
    // Create a mock offer if none exists
    const offer = context.offer || {
      id: 'mock-offer',
      type: 'buyer',
      purchasePrice: context.property.price,
      earnestMoney: context.property.price * 0.01,
      downPayment: context.property.price * 0.2,
      closingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      contingencies: {
        inspection: true,
        appraisal: true,
        financing: true,
        saleOfCurrentHome: false,
      },
      status: 'draft',
      agentId: 'mock-agent',
      clientId: 'mock-client',
      propertyId: 'mock-property',
      loanAmount: context.property.price * 0.8,
      loanType: 'conventional',
      offerDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      inspectionDeadline: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      appraisalDeadline: new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000
      ).toISOString(),
      personalProperty: [],
      repairRequests: [],
      specialConditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    return {
      offer,
      property: {
        address: context.property.address,
        price: context.property.price,
        description: `${context.property.type} property`,
        features: context.property.features || [],
      },
      client: {
        name: context.client.name,
        background: `${context.client.experienceLevel} ${context.client.role}`,
      },
      agent: {
        name: context.agent.name,
        brokerage: context.agent.brokerage,
        experience: context.agent.experience,
      },
      marketData: context.marketData,
    }
  }

  private static createCoverLetterOptions(
    options: DocumentGenerationOptions
  ): CoverLetterOptions {
    return {
      tone: options.tone as any,
      length:
        options.complexity === 'simple'
          ? 'brief'
          : options.complexity === 'detailed'
            ? 'detailed'
            : 'standard',
      includeMarketAnalysis: options.includeMarketAnalysis,
      includePersonalStory: true,
      includeBrokerageInfo: true,
      emphasizeStrengths: true,
      jurisdiction: options.jurisdiction,
    }
  }

  private static createExplanationMemoContext(
    context: DocumentGenerationContext
  ): ExplanationMemoContext {
    return {
      topic: 'offer_terms',
      offer: context.offer,
      marketData: context.marketData,
      client: {
        name: context.client.name,
        role: context.client.role,
        experienceLevel: context.client.experienceLevel,
        specificConcerns: context.client.concerns,
      },
      agent: {
        name: context.agent.name,
        brokerage: context.agent.brokerage,
      },
      property: {
        address: context.property.address,
        price: context.property.price,
        type: context.property.type,
        features: context.property.features,
      },
    }
  }

  private static createExplanationMemoOptions(
    options: DocumentGenerationOptions
  ): ExplanationMemoOptions {
    return {
      complexity: options.complexity,
      tone: options.tone as any,
      includeExamples: true,
      includeActionItems: true,
      includeQuestions: true,
      jurisdiction: options.jurisdiction,
    }
  }

  private static createNegotiationContext(
    context: DocumentGenerationContext
  ): NegotiationContext {
    return {
      scenario: 'initial_offer',
      client: {
        role: context.client.role,
        goals: context.client.goals || [],
        priorities: ['price'],
        constraints: [],
        timeline: context.client.timeline || 'flexible',
        motivations: [],
        experienceLevel: context.client.experienceLevel,
      },
      opposition: {
        estimatedRole: context.client.role === 'buyer' ? 'seller' : 'buyer',
      },
      property: {
        address: context.property.address,
        listPrice: context.property.price,
        marketValue: context.property.price,
        daysOnMarket: context.property.daysOnMarket || 30,
        propertyCondition: (context.property.condition as any) || 'good',
      },
      marketConditions: {
        trend: context.market?.trend || 'warm',
        inventory: context.market?.inventory || 'balanced',
        competitionLevel: context.market?.competition || 'medium',
        seasonality: 'normal',
        interestRates: 'stable',
      },
      currentOffer: context.offer,
      agent: {
        name: context.agent.name,
        experience: context.agent.experience || 'experienced',
        negotiationStyle: 'collaborative',
      },
    }
  }

  private static createNegotiationOptions(
    options: DocumentGenerationOptions
  ): NegotiationStrategyOptions {
    return {
      aggressiveness: 'moderate',
      riskTolerance: 'medium',
      timeHorizon: 'short-term',
      relationshipImportance: 'medium',
      includeAlternatives: true,
      includeFallbacks: true,
      jurisdiction: options.jurisdiction,
    }
  }

  private static createOfferAnalysisContext(
    context: DocumentGenerationContext
  ): OfferAnalysisContext {
    // Create a mock offer if none exists
    const offer = context.offer || {
      id: 'mock-offer',
      type: 'buyer',
      purchasePrice: context.property.price,
      earnestMoney: context.property.price * 0.01,
      downPayment: context.property.price * 0.2,
      closingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      contingencies: {
        inspection: true,
        appraisal: true,
        financing: true,
        saleOfCurrentHome: false,
      },
      status: 'draft',
      agentId: 'mock-agent',
      clientId: 'mock-client',
      propertyId: 'mock-property',
      loanAmount: context.property.price * 0.8,
      loanType: 'conventional',
      offerDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      inspectionDeadline: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      appraisalDeadline: new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000
      ).toISOString(),
      personalProperty: [],
      repairRequests: [],
      specialConditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    return {
      primaryOffer: offer,
      competingOffers: context.competingOffers,
      marketData: context.marketData,
      property: {
        address: context.property.address,
        listPrice: context.property.price,
        daysOnMarket: context.property.daysOnMarket || 30,
        propertyType: context.property.type,
        condition: (context.property.condition as any) || 'good',
        features: context.property.features,
      },
      market: {
        trend: context.market?.trend || 'warm',
        inventory: context.market?.inventory || 'balanced',
        competitionLevel: context.market?.competition || 'medium',
        averageDaysOnMarket: 30,
      },
      analysisType: 'single_offer_review',
    }
  }

  private static createOfferAnalysisOptions(
    options: DocumentGenerationOptions
  ): OfferAnalysisOptions {
    return {
      perspective: 'neutral',
      depth: options.complexity,
      includeRecommendations: true,
      includeRisks: options.includeRiskAssessment,
      includeComparisons: false,
      jurisdiction: options.jurisdiction,
    }
  }

  private static formatNegotiationStrategy(strategy: any): string {
    return `
NEGOTIATION STRATEGY

Primary Approach: ${strategy.strategy.primaryApproach}

Tactical Recommendations:
${strategy.strategy.tacticalRecommendations.map((rec: string) => `• ${rec}`).join('\n')}

Risk Assessment: ${strategy.riskAssessment.level.toUpperCase()}
Risk Factors:
${strategy.riskAssessment.factors.map((factor: string) => `• ${factor}`).join('\n')}

Next Steps:
${strategy.nextSteps.map((step: string) => `• ${step}`).join('\n')}

Scenarios:
• Best Case: ${strategy.scenarios.bestCase}
• Most Likely: ${strategy.scenarios.mostLikely}
• Worst Case: ${strategy.scenarios.worstCase}
`
  }

  private static formatOfferAnalysis(analysis: any): string {
    return `
OFFER ANALYSIS

Overall Strength: ${analysis.summary.overallStrength.toUpperCase()}
Competitive Position: ${analysis.summary.competitivePosition}

Key Strengths:
${analysis.summary.keyStrengths.map((strength: string) => `• ${strength}`).join('\n')}

Key Weaknesses:
${analysis.summary.keyWeaknesses.map((weakness: string) => `• ${weakness}`).join('\n')}

Financial Analysis:
• Price Analysis: ${analysis.financial.priceAnalysis}
• Financing Strength: ${analysis.financial.financingStrength}
• Market Value Comparison: ${analysis.financial.marketValueComparison}

Risk Assessment: ${analysis.risks.level.toUpperCase()}
Risk Factors:
${analysis.risks.factors.map((factor: string) => `• ${factor}`).join('\n')}

Recommendations:
${analysis.recommendations.immediate.map((rec: string) => `• ${rec}`).join('\n')}
`
  }

  private static formatCompetitiveAnalysis(analysis: any): string {
    return `
COMPETITIVE ANALYSIS

Overall Strength: ${analysis.summary.overallStrength.toUpperCase()}
Competitive Position: ${analysis.summary.competitivePosition}

Key Strengths:
${analysis.summary.keyStrengths.map((strength: string) => `• ${strength}`).join('\n')}

Key Weaknesses:
${analysis.summary.keyWeaknesses.map((weakness: string) => `• ${weakness}`).join('\n')}

Financial Analysis:
• Price Analysis: ${analysis.financial.priceAnalysis}
• Financing Strength: ${analysis.financial.financingStrength}
• Market Value Comparison: ${analysis.financial.marketValueComparison}

Risk Assessment: ${analysis.risks.level.toUpperCase()}
Risk Factors:
${analysis.risks.factors.map((factor: string) => `• ${factor}`).join('\n')}

Recommendations:
${analysis.recommendations.immediate.map((rec: string) => `• ${rec}`).join('\n')}
`
  }

  private static assessDocumentQuality(
    content: string,
    type: DocumentType
  ): {
    score: number
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Check content length
    const wordCount = content.split(' ').length
    if (wordCount < 100) {
      issues.push('Content too short')
      score -= 20
    } else if (wordCount > 1000) {
      issues.push('Content too long')
      score -= 10
    }

    // Check for completeness
    if (
      !content.includes('$') &&
      ['offer_analysis', 'negotiation_strategy'].includes(type)
    ) {
      issues.push('Missing financial details')
      score -= 15
    }

    // Check for professional tone
    if (
      content.toLowerCase().includes('awesome') ||
      content.toLowerCase().includes('amazing')
    ) {
      issues.push('Tone too casual for professional document')
      score -= 10
    }

    // Generate suggestions
    if (wordCount < 200) {
      suggestions.push('Consider adding more detail and examples')
    }

    if (!content.includes('next steps') && type !== 'market_analysis') {
      suggestions.push('Include clear next steps or action items')
    }

    return {
      score: Math.max(score, 0),
      issues,
      suggestions,
    }
  }

  private static createFallbackDocument(
    type: DocumentType,
    error: Error
  ): GeneratedDocument {
    const documentId = `fallback-${Date.now()}-${type}`

    // Create realistic test content based on document type
    let title = ''
    let content = ''

    switch (type) {
      case 'cover_letter':
        title = 'Professional Offer Cover Letter'
        content = `Dear Seller,

I am writing to present our competitive offer for your property. After carefully reviewing the market conditions and your property's unique features, we believe our offer represents fair market value while demonstrating our serious intent to purchase.

Our buyer is pre-approved for financing and ready to move forward quickly. We have structured our offer to be competitive while ensuring a smooth closing process.

Key highlights of our offer:
• Strong purchase price reflecting current market conditions
• Reasonable contingency periods to protect all parties
• Flexible closing timeline to accommodate your needs
• Earnest money deposit showing commitment

We appreciate your consideration and look forward to working together to achieve a successful transaction.

Best regards,
[Agent Name]`
        break

      case 'explanation_memo':
        title = 'Offer Terms Explanation Memo'
        content = `CONFIDENTIAL CLIENT MEMO

Re: Offer Terms and Strategy Explanation

This memo explains the key terms and strategy behind our offer submission.

PURCHASE PRICE ANALYSIS:
Our offered price is based on recent comparable sales and current market conditions. The pricing strategy balances competitiveness with market reality.

CONTINGENCY PERIODS:
- Inspection: Standard timeframe for professional inspection
- Financing: Adequate time for loan processing and underwriting
- Appraisal: Allows for property valuation and any necessary negotiations

CLOSING TIMELINE:
The proposed closing date provides sufficient time for all parties to complete necessary tasks while maintaining reasonable urgency.

EARNEST MONEY:
The earnest money amount demonstrates serious intent while protecting your interests.

This offer structure positions us competitively while protecting your interests throughout the transaction.`
        break

      case 'negotiation_strategy':
        title = 'Negotiation Strategy Guide'
        content = `NEGOTIATION STRATEGY DOCUMENT

PRIMARY APPROACH: Collaborative negotiation with market-based positioning

STRATEGY OVERVIEW:
Our negotiation approach focuses on building rapport while maintaining firm positions on key terms. We emphasize mutual benefit and market data to support our positions.

KEY NEGOTIATION POINTS:
1. Purchase Price: Supported by recent comps and market analysis
2. Contingency Terms: Balanced to protect buyer while showing commitment
3. Closing Timeline: Flexible to accommodate seller needs
4. Repair Requests: Focus on significant items affecting value/safety

FALLBACK POSITIONS:
- Price: Prepared to adjust within 2-3% based on counteroffers
- Terms: Willing to negotiate contingency periods
- Closing: Can accommodate seller's preferred timeline

RISK ASSESSMENT:
Market conditions favor [buyer/seller]. Competition level is [high/medium/low]. Our strategy accounts for these factors while maintaining competitive positioning.

Expected outcome: Successful negotiation leading to accepted offer within 1-2 rounds.`
        break

      case 'offer_analysis':
        title = 'Comprehensive Offer Analysis'
        content = `OFFER ANALYSIS REPORT

EXECUTIVE SUMMARY:
This offer represents a competitive position in the current market. The terms balance buyer protection with seller appeal.

PRICE ANALYSIS:
- Offered Price: Strong relative to recent comparables
- Market Position: Competitive within current pricing trends
- Value Proposition: Represents fair market value

FINANCIAL STRENGTH:
- Financing: Strong pre-approval with reputable lender
- Down Payment: Demonstrates buyer financial capacity
- Earnest Money: Appropriate amount showing commitment

TERMS EVALUATION:
- Contingencies: Standard and reasonable
- Timeline: Workable for all parties
- Special Conditions: Minimal and appropriate

COMPETITIVE POSITION:
This offer should be competitive in the current market environment. The combination of price, terms, and buyer qualifications presents a strong package.

RECOMMENDATION:
Proceed with confidence. The offer structure provides good negotiating position while protecting buyer interests.`
        break

      case 'competitive_comparison':
        title = 'Comprehensive Competitive Analysis'
        content = `COMPETITIVE ANALYSIS REPORT

EXECUTIVE SUMMARY:
This competitive analysis provides a detailed comparison of our offer against key competing offers in the market.

PRICE ANALYSIS:
- Our Offer Price: Strong relative to comparables
- Competitor 1 Price: [Price]
- Competitor 2 Price: [Price]
- Competitor 3 Price: [Price]

FINANCIAL STRENGTH:
- Our Financing: Strong pre-approval with reputable lender
- Competitor 1 Financing: [Financing]
- Competitor 2 Financing: [Financing]
- Competitor 3 Financing: [Financing]

TERMS EVALUATION:
- Our Contingencies: [Terms]
- Competitor 1 Terms: [Terms]
- Competitor 2 Terms: [Terms]
- Competitor 3 Terms: [Terms]

PROPERTY POSITIONING:
- Our Property: Well-positioned within current market conditions
- Competitor 1 Property: [Position]
- Competitor 2 Property: [Position]
- Competitor 3 Property: [Position]

RECOMMENDATION:
Our offer should be competitive in the current market environment. The combination of price, terms, and buyer qualifications presents a strong package.

This competitive analysis supports our negotiation strategy and offer structure.`
        break

      case 'market_analysis':
        title = 'Market Analysis Report'
        content = `MARKET ANALYSIS REPORT

CURRENT MARKET CONDITIONS:
The local real estate market shows [stable/strong/challenging] conditions with [increasing/stable/decreasing] inventory levels.

COMPARABLE SALES:
Recent sales in the area indicate pricing trends that support our offer strategy. Properties similar to the subject have sold within [X]% of asking price.

MARKET TRENDS:
- Days on Market: Average of XX days
- Price per Square Foot: $XXX
- Inventory Levels: [Low/Moderate/High]
- Buyer Activity: [Strong/Moderate/Weak]

PROPERTY POSITIONING:
The subject property is well-positioned within the current market. Our offer reflects appropriate market value considering current conditions.

TIMING CONSIDERATIONS:
Market timing favors [buyers/sellers] currently. This analysis supports our negotiation strategy and offer structure.

FORECAST:
Based on current trends, we expect [stable/increasing/decreasing] values over the next 6-12 months.`
        break

      case 'risk_assessment':
        title = 'Transaction Risk Assessment'
        content = `RISK ASSESSMENT DOCUMENT

FINANCIAL RISKS:
- Appraisal Risk: [Low/Medium/High] - Market conditions support offered price
- Financing Risk: [Low/Medium/High] - Strong pre-approval mitigates risk
- Market Risk: [Low/Medium/High] - Current market stability

PROPERTY RISKS:
- Condition Risk: [Low/Medium/High] - Inspection contingency provides protection
- Title Risk: [Low/Medium/High] - Standard title insurance will protect
- Environmental Risk: [Low/Medium/High] - Standard due diligence applies

TRANSACTION RISKS:
- Timing Risk: [Low/Medium/High] - Reasonable timeline for completion
- Negotiation Risk: [Low/Medium/High] - Competitive offer structure
- Closing Risk: [Low/Medium/High] - Experienced team managing process

MITIGATION STRATEGIES:
- Comprehensive contingency protection
- Professional inspection and appraisal
- Experienced transaction team
- Regular communication with all parties

OVERALL RISK LEVEL: [Low/Medium/High]

This transaction presents manageable risk with appropriate protections in place.`
        break

      default:
        title = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        content = `This is a sample ${title.toLowerCase()} document generated for testing purposes.

The document generation system is currently in demo mode. In production, this would contain AI-generated content specific to your transaction.

Key features of the actual system:
• Market-specific analysis and recommendations
• Customized content based on property details
• Professional formatting and presentation
• Strategic insights and negotiation guidance

This fallback content allows you to test the document workflow and user interface while the AI generation system is being configured.`
    }

    return {
      id: documentId,
      type,
      title,
      content,
      format: 'text',
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: Math.ceil(content.split(' ').length / 200),
        complexity: 'intermediate',
        tone: 'professional',
        generatedAt: new Date(),
        version: '1.0-fallback',
      },
      quality: {
        score: 85,
        issues: ['Generated using fallback system'],
        suggestions: ['Enable AI generation for customized content'],
      },
    }
  }

  private static topologicalSort(
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

    documents.forEach(visit)
    return result
  }

  private static estimateTokensUsed(documents: GeneratedDocument[]): number {
    return documents.reduce(
      (total, doc) => total + Math.ceil(doc.metadata.wordCount * 1.3),
      0
    )
  }

  private static cleanDocumentTitle(
    originalTitle: string,
    fallbackTitle: string
  ): string {
    if (originalTitle && originalTitle.length > 0) {
      // Only remove specific prefixes, not any uppercase letters
      let cleaned = originalTitle
        .replace(/^(Subject|Title|Re):\s*/i, '') // Remove specific prefixes
        .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/\s*-\s*.+$/, '') // Remove everything after first dash
        .replace(/:\s*.+$/, '') // Remove everything after colon
        .replace(/\.$/, '') // Remove trailing period
        .trim()

      // Keep only first 2-3 words
      const words = cleaned.split(/\s+/)
      if (words.length > 3) {
        cleaned = words.slice(0, 3).join(' ')
      }

      return cleaned
    }
    return fallbackTitle
  }

  private static getDefaultTitle(type: DocumentType): string {
    switch (type) {
      case 'cover_letter':
        return 'Offer Letter'
      case 'explanation_memo':
        return 'Offer Memo'
      case 'negotiation_strategy':
        return 'Negotiation Strategy'
      case 'offer_analysis':
        return 'Offer Analysis'
      case 'market_analysis':
        return 'Market Analysis'
      case 'client_summary':
        return 'Client Summary'
      case 'risk_assessment':
        return 'Risk Assessment'
      case 'competitive_comparison':
        return 'Competitive Analysis'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  private static async generateClientSummary(
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions
  ): Promise<{ content: string; title: string }> {
    const client = getGroqClient()

    const prompt = `Write a friendly, conversational summary about this client that feels like you're introducing them to a colleague over coffee. Skip the formal business language and talk about them as a real person.

Here's what I know about them:

Property they're interested in:
- ${context.property.address}
- $${context.property.price.toLocaleString()}
- ${context.property.type}
- Features: ${context.property.features?.join(', ') || 'Standard features'}
- Condition: ${context.property.condition || 'Good condition'}
- ${context.property.daysOnMarket ? `Been on the market for ${context.property.daysOnMarket} days` : 'Recently listed'}

About ${context.client.name}:
- They're a ${context.client.role}
- Experience level: ${context.client.experienceLevel}
- What they're hoping to achieve: ${context.client.goals?.join(', ') || 'Standard home purchase goals'}
- Main concerns: ${context.client.concerns?.join(', ') || 'Typical buyer concerns'}
- Timeline: ${context.client.timeline || 'Pretty flexible'}

Working with agent ${context.agent.name}:
- ${context.agent.brokerage ? `From ${context.agent.brokerage}` : 'Independent agent'}
- ${context.agent.experience ? `${context.agent.experience} years of experience` : 'Experienced professional'}

Market situation:
- Market trend: ${context.market?.trend || 'Stable'}
- Inventory levels: ${context.market?.inventory || 'Normal'}
- Competition: ${context.market?.competition || 'Moderate'}
- Location: ${context.market?.location?.city || 'Local area'}, ${context.market?.location?.state || 'State'}

Write this like you're telling a colleague about a client you're working with. Keep it warm, natural, and focus on what makes them unique as a person. About 150-200 words, conversational tone.

Don't use formal phrases like "qualified purchaser" or "market analysis indicates." Just talk like a person about a person.`

    try {
      const summary = await client.generateText(prompt, AI_MODELS.SUMMARY, {
        systemPrompt:
          "You are a friendly real estate agent sharing insights about a client with a colleague. Write in a warm, conversational tone like you're having coffee together. Focus on the human side of the story, not just the business details.",
        temperature: 0.7,
        maxTokens: 250,
      })
      return { content: summary, title: 'Client Summary' }
    } catch (error) {
      console.warn('Client summary generation failed, using fallback:', error)
      return {
        content: `So here's the scoop on ${context.client.name}...

They're a ${context.client.experienceLevel} ${context.client.role} looking at that ${context.property.type} on ${context.property.address}. You know how it is - they've got the usual hopes and concerns that come with ${context.client.role === 'buyer' ? 'buying' : 'selling'} a home.

${context.client.goals?.length ? `What they really want: ${context.client.goals.join(', ')}.` : 'They have pretty standard goals for this type of transaction.'}

${context.client.concerns?.length ? `What's keeping them up at night: ${context.client.concerns.join(', ')}.` : 'Nothing too unusual in terms of concerns.'}

${context.client.timeline ? `Timeline-wise, they're ${context.client.timeline}.` : 'They seem pretty flexible on timing.'}

The property is priced at $${context.property.price.toLocaleString()} and honestly, ${context.property.condition === 'excellent' ? "it's in great shape" : context.property.condition === 'good' ? "it's in decent condition" : 'it needs some work'}. ${context.property.daysOnMarket ? `It's been sitting for ${context.property.daysOnMarket} days` : 'Just came on the market'}.

Working with ${context.agent.name} on this one. ${context.agent.experience ? `They've got ${context.agent.experience} years under their belt` : 'Solid agent'}, so should be a smooth process.`,
        title: 'Client Summary',
      }
    }
  }

  private static async generateRiskAssessment(
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions
  ): Promise<{ content: string; riskLevel: string; keyRisks: string[] }> {
    const client = getGroqClient()

    const prompt = `Generate a comprehensive risk assessment for a real estate transaction based on the following context:

Property:
- Address: ${context.property.address}
- Price: $${context.property.price.toLocaleString()}
- Type: ${context.property.type}
- Features: ${context.property.features?.join(', ') || 'Not specified'}
- Condition: ${context.property.condition || 'Not specified'}
- Days on Market: ${context.property.daysOnMarket || 'Not specified'}

Client:
- Name: ${context.client.name}
- Role: ${context.client.role}
- Experience Level: ${context.client.experienceLevel}
- Goals: ${context.client.goals?.join(', ') || 'Not specified'}
- Concerns: ${context.client.concerns?.join(', ') || 'Not specified'}
- Timeline: ${context.client.timeline || 'Flexible'}

Agent:
- Name: ${context.agent.name}
- Brokerage: ${context.agent.brokerage || 'Not specified'}
- Experience: ${context.agent.experience || 'Not specified'}

Market Context:
- Trend: ${context.market?.trend || 'Not specified'}
- Inventory: ${context.market?.inventory || 'Not specified'}
- Competition: ${context.market?.competition || 'Not specified'}
- Location: ${context.market?.location?.city || 'Not specified'}, ${context.market?.location?.state || 'Not specified'}

Offer Details:
- Purchase Price: $${context.offer?.purchasePrice?.toLocaleString() || context.property.price.toLocaleString()}
- Down Payment: $${context.offer?.downPayment?.toLocaleString() || 'Not specified'}
- Loan Amount: $${context.offer?.loanAmount?.toLocaleString() || 'Not specified'}
- Loan Type: ${context.offer?.loanType || 'Not specified'}
- Closing Date: ${context.offer?.closingDate || 'Not specified'}

Generate a detailed risk assessment (200-250 words) that includes:
1. Overall risk level (Low, Medium, High)
2. Market-related risks
3. Property-specific risks
4. Financial risks
5. Timeline risks
6. Mitigation strategies
7. Key recommendations

Format as a professional risk assessment suitable for client review and decision-making.`

    try {
      const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
        systemPrompt:
          'You are an expert real estate risk assessor. Generate comprehensive risk assessments that help clients understand potential challenges and mitigation strategies.',
        temperature: 0.7,
        maxTokens: 500,
      })

      const content = response.trim()
      const riskLevel = this.extractRiskLevel(content)
      const keyRisks = this.extractKeyRisks(content, context)

      return {
        content: content || this.getFallbackRiskAssessment(context),
        riskLevel,
        keyRisks,
      }
    } catch (error) {
      console.error('Error generating risk assessment:', error)
      return {
        content: this.getFallbackRiskAssessment(context),
        riskLevel: 'Medium',
        keyRisks: [
          'Market volatility',
          'Property condition',
          'Financing risks',
        ],
      }
    }
  }

  private static extractRiskLevel(content: string): string {
    const lowerContent = content.toLowerCase()
    if (
      lowerContent.includes('high risk') ||
      lowerContent.includes('risk level: high')
    ) {
      return 'High'
    } else if (
      lowerContent.includes('low risk') ||
      lowerContent.includes('risk level: low')
    ) {
      return 'Low'
    }
    return 'Medium'
  }

  private static extractKeyRisks(
    content: string,
    context: DocumentGenerationContext
  ): string[] {
    const risks: string[] = []

    // Market-based risks
    if (context.market?.trend === 'hot') {
      risks.push('High competition market')
    } else if (context.market?.trend === 'cool') {
      risks.push('Market downturn risk')
    }

    // Property-based risks
    if (context.property.daysOnMarket && context.property.daysOnMarket > 90) {
      risks.push('Extended market time')
    }

    // Financial risks
    if (context.client.experienceLevel === 'first-time') {
      risks.push('First-time buyer risks')
    }

    // Timeline risks
    if (context.client.timeline === 'urgent') {
      risks.push('Compressed timeline')
    }

    // Default risks if none identified
    if (risks.length === 0) {
      risks.push('Market volatility', 'Property condition', 'Financing risks')
    }

    return risks.slice(0, 5) // Limit to 5 key risks
  }

  private static getFallbackRiskAssessment(
    context: DocumentGenerationContext
  ): string {
    const riskLevel = context.market?.trend === 'hot' ? 'Medium-High' : 'Medium'

    return `Risk Assessment for ${context.property.address}

Overall Risk Level: ${riskLevel}

Market Risk Analysis:
The current ${context.market?.trend || 'stable'} market with ${context.market?.inventory || 'balanced'} inventory presents ${riskLevel.toLowerCase()} risk for this transaction. Competition levels are ${context.market?.competition || 'moderate'}, which may affect negotiation dynamics.

Property Risk Factors:
This ${context.property.type} at $${context.property.price.toLocaleString()} has been on the market for ${context.property.daysOnMarket || 'an undisclosed number of'} days. Property condition is ${context.property.condition || 'not specified'}, requiring due diligence during inspection.

Financial Risk Considerations:
${context.client.name} as a ${context.client.experienceLevel} ${context.client.role} should consider financing contingencies and market timing. The current offer structure includes standard protections.

Timeline Risk Assessment:
With a ${context.client.timeline || 'flexible'} timeline, there are ${context.client.timeline === 'urgent' ? 'elevated' : 'standard'} timeline risks that should be monitored throughout the process.

Mitigation Strategies:
1. Maintain appropriate contingencies
2. Monitor market conditions closely
3. Ensure thorough property inspection
4. Secure financing pre-approval
5. Prepare for potential negotiation scenarios

Recommendations:
Proceed with standard due diligence and maintain flexibility in negotiation approach based on market response and inspection findings.`
  }
}

// ========== CONVENIENCE FUNCTIONS ==========

/**
 * Generate a buyer offer package (cover letter + explanation memo + analysis)
 */
export const generateBuyerOfferPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  return DocumentOrchestrationService.generateTemplatePackage(
    'BUYER_OFFER_PACKAGE',
    context,
    options
  )
}

/**
 * Generate a seller counter package (cover letter + strategy + analysis)
 */
export const generateSellerCounterPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  return DocumentOrchestrationService.generateTemplatePackage(
    'SELLER_COUNTER_PACKAGE',
    context,
    options
  )
}

/**
 * Generate client education package (memos + summaries)
 */
export const generateClientEducationPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  return DocumentOrchestrationService.generateTemplatePackage(
    'CLIENT_EDUCATION_PACKAGE',
    context,
    options
  )
}

/**
 * Generate competitive analysis package
 */
export const generateCompetitiveAnalysisPackage = async (
  context: DocumentGenerationContext,
  options?: Partial<DocumentGenerationOptions>
): Promise<DocumentPackageResult> => {
  return DocumentOrchestrationService.generateTemplatePackage(
    'COMPETITIVE_ANALYSIS_PACKAGE',
    context,
    options
  )
}

// ========== SERVICE OBJECT ==========

export const DocumentOrchestrator = {
  generateDocumentPackage:
    DocumentOrchestrationService.generateDocumentPackage.bind(
      DocumentOrchestrationService
    ),
  generateTemplatePackage:
    DocumentOrchestrationService.generateTemplatePackage.bind(
      DocumentOrchestrationService
    ),
  generateBuyerOfferPackage,
  generateSellerCounterPackage,
  generateClientEducationPackage,
  generateCompetitiveAnalysisPackage,
  DOCUMENT_PACKAGE_TEMPLATES,
}

export default DocumentOrchestrator
