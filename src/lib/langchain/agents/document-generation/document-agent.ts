/**
 * LangChain Document Generation Agent
 *
 * LangChain agent implementation for generating professional real estate documents
 * including cover letters, memos, and explanations. Replaces the existing
 * OpenAI document generation services.
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ConversationMemory } from '../../memory/conversation-memory'
import { ToolRegistry } from '../../tools/index'
import {
  DOCUMENT_PROMPT_TEMPLATES,
  formatCoverLetterContext,
  formatMemoContext,
  formatDocumentOptions,
  getDocumentPrompt,
} from '../../prompts/document-prompts'
import { getModelConfig } from '../../common/model-config'
import type { Offer } from '../../../../shared/types/offers'
import type { MarketData } from '../../../../shared/types/market-data'
import type { UserProfile } from '../../../../shared/types'

// ========== DOCUMENT AGENT TYPES ==========

export interface CoverLetterContext {
  offer: Offer
  property: {
    address: string
    price: number
    description?: string
    features?: string[]
    neighborhood?: string
    schools?: string[]
    commute?: string
  }
  client: {
    name: string
    background?: string
    motivation?: string
    timeline?: string
    preApprovalAmount?: number
    cashBuyer?: boolean
    firstTimeHomeBuyer?: boolean
    localConnection?: string
    personalStory?: string
  }
  agent: {
    name: string
    brokerage?: string
    experience?: string
    credentials?: string
    phoneNumber?: string
    email?: string
  }
  marketData?: MarketData
  competitiveAnalysis?: {
    averageDaysOnMarket: number
    competingOffers: number
    priceComparison: 'above' | 'at' | 'below'
    marketTrend: 'hot' | 'warm' | 'cool'
  }
  specialCircumstances?: {
    escalationClause?: boolean
    quickClose?: boolean
    asIsOffer?: boolean
    rentBack?: boolean
    contingencyWaivers?: string[]
  }
}

export interface MemoContext {
  topic: string
  audience: 'client' | 'agent' | 'professional'
  background: string
  keyPoints: string[]
  examples?: string[]
  actionItems?: string[]
  relatedDocuments?: string[]
  marketContext?: any
}

export interface DocumentOptions {
  tone: 'professional' | 'warm' | 'confident' | 'personal'
  length: 'brief' | 'standard' | 'detailed'
  includeMarketAnalysis: boolean
  includePersonalStory: boolean
  includeBrokerageInfo: boolean
  emphasizeStrengths: boolean
  audience?: 'client' | 'agent' | 'professional'
  focusAreas?: string[]
  jurisdiction?: string
  sessionId?: string
}

export interface DocumentResult {
  content: string
  subject: string
  keyPoints: string[]
  tone: string
  wordCount: number
  recommendations: string[]
  toolsUsed: string[]
  confidence: number
  formatting: {
    hasHeader: boolean
    hasFooter: boolean
    hasBulletPoints: boolean
    hasSignature: boolean
  }
}

// ========== DOCUMENT AGENT CLASS ==========

export class DocumentAgent {
  private agent: AgentExecutor
  private memory: ConversationMemory
  private toolRegistry: ToolRegistry
  private model: ChatOpenAI

  constructor(options: { sessionId?: string } = {}) {
    this.model = new ChatOpenAI(getModelConfig())
    this.toolRegistry = new ToolRegistry()
    this.memory = new ConversationMemory(options.sessionId)
    this.agent = this.createAgent()
  }

  private createAgent(): AgentExecutor {
    // Get relevant tools for document generation
    const tools = [
      this.toolRegistry.getTool('GetMarketDataTool'),
      this.toolRegistry.getTool('GetComparablePropertiesTool'),
      this.toolRegistry.getTool('CalculatePropertyValueTool'),
      this.toolRegistry.getTool('MarketTrendAnalysisTool'),
      this.toolRegistry.getTool('CompetitiveMarketAnalysisTool'),
      this.toolRegistry.getTool('PropertyConditionAssessmentTool'),
      this.toolRegistry.getTool('HTMLDocumentGeneratorTool'),
      this.toolRegistry.getTool('PDFDocumentGeneratorTool'),
      this.toolRegistry.getTool('DocumentTemplateManagerTool'),
      this.toolRegistry.getTool('DocumentQualityCheckerTool'),
      this.toolRegistry.getTool('CurrencyFormatterTool'),
      this.toolRegistry.getTool('DateFormatterTool'),
      this.toolRegistry.getTool('NumberFormatterTool'),
      this.toolRegistry.getTool('PropertyDataValidatorTool'),
      this.toolRegistry.getTool('ErrorHandlerTool'),
      this.toolRegistry.getTool('CreateDocumentTool'),
      this.toolRegistry.getTool('GetDocumentTool'),
      this.toolRegistry.getTool('GetDocumentsByTypeTool'),
    ].filter(Boolean)

    // Create agent with tools
    const agent = createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt: DOCUMENT_PROMPT_TEMPLATES.BUYER_OFFER_LETTER, // Default prompt
    })

    return new AgentExecutor({
      agent,
      tools,
      memory: this.memory.getMemory(),
      verbose: true,
      maxIterations: 10,
      returnIntermediateSteps: true,
    })
  }

  // ========== COVER LETTER METHODS ==========

  async generateBuyerOfferLetter(
    context: CoverLetterContext,
    options: DocumentOptions = {
      tone: 'warm',
      length: 'standard',
      includeMarketAnalysis: true,
      includePersonalStory: true,
      includeBrokerageInfo: true,
      emphasizeStrengths: true,
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('buyer_offer_letter')

    const input = await prompt.format({
      context: formatCoverLetterContext(context),
      tone: options.tone,
      length: options.length,
      includeMarketAnalysis: options.includeMarketAnalysis.toString(),
      includePersonalStory: options.includePersonalStory.toString(),
      includeBrokerageInfo: options.includeBrokerageInfo.toString(),
      emphasizeStrengths: options.emphasizeStrengths.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'buyer_offer_letter')
  }

  async generateSellerCounterLetter(
    context: CoverLetterContext,
    options: DocumentOptions = {
      tone: 'professional',
      length: 'standard',
      includeMarketAnalysis: true,
      includePersonalStory: false,
      includeBrokerageInfo: true,
      emphasizeStrengths: false,
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('seller_counter_letter')

    const input = await prompt.format({
      context: formatCoverLetterContext(context),
      tone: options.tone,
      length: options.length,
      includeMarketAnalysis: options.includeMarketAnalysis.toString(),
      includeBrokerageInfo: options.includeBrokerageInfo.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'seller_counter_letter')
  }

  async generateMultipleOfferLetter(
    context: CoverLetterContext,
    options: DocumentOptions = {
      tone: 'confident',
      length: 'standard',
      includeMarketAnalysis: true,
      includePersonalStory: true,
      includeBrokerageInfo: true,
      emphasizeStrengths: true,
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('multiple_offers_letter')

    const input = await prompt.format({
      context: formatCoverLetterContext(context),
      length: options.length,
      includeMarketAnalysis: options.includeMarketAnalysis.toString(),
      includePersonalStory: options.includePersonalStory.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'multiple_offers_letter')
  }

  async generateMarketAnalysisLetter(
    context: CoverLetterContext,
    options: DocumentOptions = {
      tone: 'professional',
      length: 'detailed',
      includeMarketAnalysis: true,
      includePersonalStory: false,
      includeBrokerageInfo: true,
      emphasizeStrengths: false,
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('market_analysis_letter')

    const input = await prompt.format({
      context: formatCoverLetterContext(context),
      length: options.length,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'market_analysis_letter')
  }

  // ========== MEMO METHODS ==========

  async generateExplanationMemo(
    context: MemoContext,
    options: DocumentOptions = {
      tone: 'professional',
      length: 'detailed',
      includeMarketAnalysis: false,
      includePersonalStory: false,
      includeBrokerageInfo: false,
      emphasizeStrengths: false,
      audience: 'client',
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('explanation_memo')

    const input = await prompt.format({
      context: formatMemoContext(context),
      topic: context.topic,
      audience: context.audience,
      detailLevel: options.length,
      includeExamples: (
        context.examples && context.examples.length > 0
      ).toString(),
      includeActionItems: (
        context.actionItems && context.actionItems.length > 0
      ).toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'explanation_memo')
  }

  async generateDocumentSummary(
    context: any,
    options: DocumentOptions = {
      tone: 'professional',
      length: 'standard',
      includeMarketAnalysis: false,
      includePersonalStory: false,
      includeBrokerageInfo: false,
      emphasizeStrengths: false,
      audience: 'client',
    }
  ): Promise<DocumentResult> {
    const prompt = getDocumentPrompt('document_summary')

    const input = await prompt.format({
      context: JSON.stringify(context, null, 2),
      documentType: context.documentType || 'general',
      audience: options.audience || 'client',
      focusAreas: options.focusAreas?.join(', ') || 'key highlights',
      length: options.length,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseDocumentResult(result, 'document_summary')
  }

  // ========== UTILITY METHODS ==========

  private parseDocumentResult(
    result: any,
    documentType: string
  ): DocumentResult {
    const output = result.output || result.text || ''
    const intermediateSteps = result.intermediateSteps || []

    // Extract tools used
    const toolsUsed = intermediateSteps
      .map((step: any) => step.action?.tool)
      .filter(Boolean)

    // Parse the document response
    const parsed = this.parseDocumentResponse(output, documentType)

    return {
      ...parsed,
      toolsUsed,
      confidence: this.calculateConfidence(parsed, toolsUsed),
    }
  }

  private parseDocumentResponse(
    response: string,
    documentType: string
  ): Omit<DocumentResult, 'toolsUsed' | 'confidence'> {
    // Extract subject line
    const subjectMatch =
      response.match(/Subject:\s*(.+)/i) ||
      response.match(/Re:\s*(.+)/i) ||
      response.match(/^(.+)/m)
    const subject = subjectMatch
      ? subjectMatch[1].trim()
      : `${documentType} Document`

    // Extract key points
    const keyPointsRegex = /(?:[-•*]\s*(.+)|(?:\d+\.\s*(.+)))/g
    const keyPoints: string[] = []
    let keyPointMatch

    while ((keyPointMatch = keyPointsRegex.exec(response)) !== null) {
      const point = keyPointMatch[1] || keyPointMatch[2]
      if (point && point.length > 10) {
        keyPoints.push(point.trim())
      }
    }

    // Count words
    const wordCount = response
      .split(/\s+/)
      .filter(word => word.length > 0).length

    // Detect tone
    const tone = this.detectTone(response)

    // Check formatting
    const formatting = this.analyzeFormatting(response)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      response,
      wordCount,
      keyPoints.length
    )

    return {
      content: response,
      subject,
      keyPoints: keyPoints.slice(0, 8),
      tone,
      wordCount,
      recommendations,
      formatting,
    }
  }

  private detectTone(content: string): string {
    const warmWords = [
      'excited',
      'love',
      'dream',
      'family',
      'home',
      'wonderful',
    ]
    const professionalWords = [
      'qualified',
      'experience',
      'market',
      'analysis',
      'terms',
    ]
    const confidentWords = [
      'confident',
      'strong',
      'competitive',
      'advantage',
      'best',
    ]
    const personalWords = [
      'personal',
      'story',
      'connection',
      'feeling',
      'appreciate',
    ]

    const lowerContent = content.toLowerCase()

    const warmCount = warmWords.reduce(
      (count, word) =>
        count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
      0
    )
    const professionalCount = professionalWords.reduce(
      (count, word) =>
        count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
      0
    )
    const confidentCount = confidentWords.reduce(
      (count, word) =>
        count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
      0
    )
    const personalCount = personalWords.reduce(
      (count, word) =>
        count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
      0
    )

    if (
      warmCount > Math.max(professionalCount, confidentCount, personalCount)
    ) {
      return 'warm'
    } else if (confidentCount > Math.max(professionalCount, personalCount)) {
      return 'confident'
    } else if (personalCount > professionalCount) {
      return 'personal'
    } else {
      return 'professional'
    }
  }

  private analyzeFormatting(content: string): any {
    return {
      hasHeader: content.includes('Subject:') || content.includes('Re:'),
      hasFooter:
        content.includes('Sincerely') || content.includes('Best regards'),
      hasBulletPoints:
        content.includes('•') || content.includes('*') || content.includes('-'),
      hasSignature: content.includes('Agent') || content.includes('Broker'),
    }
  }

  private generateRecommendations(
    content: string,
    wordCount: number,
    keyPointsCount: number
  ): string[] {
    const recommendations: string[] = []

    if (wordCount > 600) {
      recommendations.push('Consider shortening the document for better impact')
    }

    if (wordCount < 150) {
      recommendations.push('Consider adding more specific details and examples')
    }

    if (keyPointsCount < 3) {
      recommendations.push(
        'Consider adding more key points or bullet points for clarity'
      )
    }

    if (!content.includes('$')) {
      recommendations.push(
        'Consider including specific financial details where appropriate'
      )
    }

    if (!content.includes('timeline') && !content.includes('schedule')) {
      recommendations.push(
        'Consider mentioning timelines or schedules where relevant'
      )
    }

    if (!content.includes('market') && !content.includes('condition')) {
      recommendations.push(
        'Consider adding market context to strengthen your position'
      )
    }

    if (
      !content.includes('contact') &&
      !content.includes('phone') &&
      !content.includes('email')
    ) {
      recommendations.push('Ensure contact information is clearly provided')
    }

    return recommendations
  }

  private calculateConfidence(parsed: any, toolsUsed: string[]): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on tools used
    if (toolsUsed.includes('GetMarketDataTool')) confidence += 0.1
    if (toolsUsed.includes('DocumentQualityCheckerTool')) confidence += 0.1
    if (toolsUsed.includes('HTMLDocumentGeneratorTool')) confidence += 0.05
    if (toolsUsed.includes('PropertyDataValidatorTool')) confidence += 0.05

    // Increase confidence based on document completeness
    if (parsed.subject && parsed.subject.length > 5) confidence += 0.05
    if (parsed.keyPoints.length >= 3) confidence += 0.05
    if (parsed.wordCount >= 200 && parsed.wordCount <= 500) confidence += 0.05
    if (parsed.formatting.hasHeader && parsed.formatting.hasFooter)
      confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  // ========== HELPER METHODS ==========

  clearMemory(): void {
    this.memory.clear()
  }

  getMemoryHistory(): any[] {
    return this.memory.getChatHistory()
  }

  async saveToFirebase(
    result: DocumentResult,
    context: any,
    documentType: string
  ): Promise<void> {
    // Use the CreateDocumentTool to save the document
    const saveTool = this.toolRegistry.getTool('CreateDocumentTool')
    if (saveTool) {
      await saveTool.invoke({
        type: documentType,
        content: result.content,
        subject: result.subject,
        metadata: {
          tone: result.tone,
          wordCount: result.wordCount,
          keyPoints: result.keyPoints,
          toolsUsed: result.toolsUsed,
          confidence: result.confidence,
        },
        createdAt: new Date().toISOString(),
      })
    }
  }

  async convertToHTML(result: DocumentResult): Promise<string> {
    const htmlTool = this.toolRegistry.getTool('HTMLDocumentGeneratorTool')
    if (htmlTool) {
      return await htmlTool.invoke({
        content: result.content,
        title: result.subject,
        theme: 'professional',
        includeStyles: true,
        metadata: {
          wordCount: result.wordCount,
          tone: result.tone,
        },
      })
    }
    return result.content
  }

  async convertToPDF(result: DocumentResult): Promise<any> {
    const pdfTool = this.toolRegistry.getTool('PDFDocumentGeneratorTool')
    if (pdfTool) {
      return await pdfTool.invoke({
        content: result.content,
        title: result.subject,
        format: 'letter',
        margins: 'standard',
        includeHeader: true,
        includeFooter: true,
      })
    }
    return null
  }

  async validateDocumentQuality(result: DocumentResult): Promise<any> {
    const qualityTool = this.toolRegistry.getTool('DocumentQualityCheckerTool')
    if (qualityTool) {
      return await qualityTool.invoke({
        content: result.content,
        documentType: 'cover_letter',
        checkReadability: true,
        checkProfessionalTone: true,
        checkCompleteness: true,
      })
    }
    return { quality: 'good', suggestions: [] }
  }
}

// ========== UTILITY FUNCTIONS ==========

export const createCoverLetterContext = (
  offer: Offer,
  propertyData: any,
  clientData: any,
  agentData: any,
  marketData?: MarketData
): CoverLetterContext => {
  return {
    offer,
    property: {
      address: propertyData.address,
      price: propertyData.price || propertyData.listPrice,
      description: propertyData.description,
      features: propertyData.features,
      neighborhood: propertyData.neighborhood,
      schools: propertyData.schools,
      commute: propertyData.commute,
    },
    client: {
      name: clientData.name,
      background: clientData.background,
      motivation: clientData.motivation,
      timeline: clientData.timeline,
      preApprovalAmount: clientData.preApprovalAmount,
      cashBuyer: clientData.cashBuyer,
      firstTimeHomeBuyer: clientData.firstTimeHomeBuyer,
      localConnection: clientData.localConnection,
      personalStory: clientData.personalStory,
    },
    agent: {
      name: agentData.name,
      brokerage: agentData.brokerage,
      experience: agentData.experience,
      credentials: agentData.credentials,
      phoneNumber: agentData.phoneNumber,
      email: agentData.email,
    },
    marketData,
    competitiveAnalysis: propertyData.competitiveAnalysis,
    specialCircumstances: propertyData.specialCircumstances,
  }
}

export const createMemoContext = (
  topic: string,
  audience: 'client' | 'agent' | 'professional',
  background: string,
  keyPoints: string[],
  options: any = {}
): MemoContext => {
  return {
    topic,
    audience,
    background,
    keyPoints,
    examples: options.examples,
    actionItems: options.actionItems,
    relatedDocuments: options.relatedDocuments,
    marketContext: options.marketContext,
  }
}

export const getRecommendedDocumentOptions = (
  documentType: string,
  marketConditions: 'hot' | 'warm' | 'cool',
  hasCompetingOffers: boolean = false
): DocumentOptions => {
  const baseOptions: DocumentOptions = {
    tone: 'professional',
    length: 'standard',
    includeMarketAnalysis: true,
    includePersonalStory: false,
    includeBrokerageInfo: true,
    emphasizeStrengths: false,
  }

  // Adjust based on document type
  switch (documentType) {
    case 'buyer_offer_letter':
      return {
        ...baseOptions,
        tone: 'warm',
        includePersonalStory: true,
        emphasizeStrengths: true,
      }
    case 'multiple_offers_letter':
      return {
        ...baseOptions,
        tone: 'confident',
        includePersonalStory: true,
        emphasizeStrengths: true,
      }
    case 'seller_counter_letter':
      return {
        ...baseOptions,
        tone: 'professional',
        includeMarketAnalysis: true,
      }
    case 'explanation_memo':
      return {
        ...baseOptions,
        tone: 'professional',
        length: 'detailed',
        includeMarketAnalysis: false,
        includeBrokerageInfo: false,
      }
    default:
      return baseOptions
  }
}

export default DocumentAgent
