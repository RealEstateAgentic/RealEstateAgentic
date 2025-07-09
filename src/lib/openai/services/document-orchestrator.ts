/**
 * Document Generation Orchestration Service
 *
 * Comprehensive service that coordinates all document generation activities,
 * manages workflows, handles dependencies between documents, and provides
 * a unified interface for complex document generation requests.
 */

import { getOpenAIClient, AI_MODELS } from '../client'
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

// ========== ORCHESTRATION TYPES ==========

export interface DocumentPackageRequest {
  type: DocumentPackageType
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  requirements: DocumentRequirements
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
      // Validate and prepare context
      const validatedContext = await this.validateAndEnrichContext(
        request.context
      )

      // Determine document generation strategy
      const generationPlan = this.createGenerationPlan(request)

      // Generate documents based on strategy
      const documents = await this.executeGenerationPlan(
        generationPlan,
        validatedContext,
        request.options
      )

      // Analyze and validate generated content
      const insights = await this.analyzeDocumentPackage(
        documents,
        validatedContext
      )

      // Generate package-level recommendations
      const recommendations = await this.generatePackageRecommendations(
        documents,
        insights,
        request
      )

      const endTime = Date.now()

      return {
        packageId,
        status:
          documents.length === request.requirements.documents.length
            ? 'success'
            : 'partial',
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
    } catch (error) {
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
    options: DocumentGenerationOptions
  ): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = []
    const generatedContent: Record<string, any> = {}

    for (const documentType of plan.order) {
      try {
        const document = await this.generateSingleDocument(
          documentType,
          context,
          options,
          generatedContent
        )

        documents.push(document)
        generatedContent[documentType] = document
      } catch (error) {
        console.error(`Failed to generate ${documentType}:`, error)

        // Apply fallback if enabled
        if (options.prioritizeSpeed) {
          const fallbackDocument = this.createFallbackDocument(
            documentType,
            error as Error
          )
          documents.push(fallbackDocument)
        }
      }
    }

    return documents
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
        title = coverLetterResult.subject
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
        title = memoResult.title
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
          title = 'Market Analysis (Limited)'
        }
        break

      default:
        content = `Generated content for ${type}`
        title = `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
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
    const client = getOpenAIClient()

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

      return analysis
    } catch (error) {
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
    const lowQualityDocs = documents.filter(doc => doc.quality.score < 70)
    if (lowQualityDocs.length > 0) {
      recommendations.push(
        `Review and improve quality of: ${lowQualityDocs.map(d => d.type).join(', ')}`
      )
    }

    // Consistency recommendations
    if (insights.consistencyScore < 80) {
      recommendations.push(
        'Review documents for consistency in tone and messaging'
      )
    }

    // Content recommendations
    if (insights.riskFactors.length > 3) {
      recommendations.push(
        'Consider addressing identified risk factors in client communication'
      )
    }

    // Market alignment recommendations
    if (insights.marketAlignment.includes('misaligned')) {
      recommendations.push(
        'Update market data and realign strategy with current conditions'
      )
    }

    // Add strategic recommendations
    recommendations.push(...insights.recommendedActions.slice(0, 3))

    return recommendations
  }

  // ========== HELPER METHODS ==========

  private static createCoverLetterContext(
    context: DocumentGenerationContext
  ): CoverLetterContext {
    return {
      offer: context.offer!,
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
    return {
      primaryOffer: context.offer!,
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
    return {
      id: `fallback-${Date.now()}-${type}`,
      type,
      title: `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (Fallback)`,
      content: `This document could not be generated due to an error: ${error.message}. Please contact support for assistance.`,
      format: 'text',
      metadata: {
        wordCount: 20,
        readingTime: 1,
        complexity: 'simple',
        tone: 'professional',
        generatedAt: new Date(),
        version: 'fallback',
      },
      quality: {
        score: 0,
        issues: ['Fallback content due to generation error'],
        suggestions: ['Retry generation with updated parameters'],
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
