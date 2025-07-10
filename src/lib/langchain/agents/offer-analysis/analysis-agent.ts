/**
 * LangChain Offer Analysis Agent
 *
 * LangChain agent implementation for analyzing real estate offers, generating summaries,
 * comparing multiple offers, and providing strategic insights. Replaces the existing
 * OpenAI offer analysis service.
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ConversationMemory } from '../../memory/conversation-memory'
import { ToolRegistry } from '../../tools/index'
import {
  ANALYSIS_PROMPT_TEMPLATES,
  formatAnalysisContext,
  formatAnalysisOptions,
  getAnalysisPrompt,
} from '../../prompts/analysis-prompts'
import { getModelConfig } from '../../common/model-config'
import type { Offer } from '../../../../shared/types/offers'
import type { MarketData } from '../../../../shared/types/market-data'

// ========== ANALYSIS AGENT TYPES ==========

export interface OfferAnalysisContext {
  primaryOffer: Offer
  competingOffers?: Offer[]
  marketData?: MarketData
  property: {
    address: string
    listPrice: number
    estimatedValue?: number
    daysOnMarket: number
    propertyType: string
    condition: 'excellent' | 'good' | 'fair' | 'needs-work'
    features?: string[]
    issues?: string[]
  }
  seller?: {
    motivations?: string[]
    timeline?: string
    circumstances?: string[]
    flexibility?: 'high' | 'medium' | 'low'
  }
  market: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    competitionLevel: 'high' | 'medium' | 'low'
    averageDaysOnMarket: number
    averagePricePerSqFt?: number
  }
  analysisType: AnalysisType
}

export type AnalysisType =
  | 'single_offer_review'
  | 'competitive_comparison'
  | 'offer_strength_assessment'
  | 'financial_analysis'
  | 'risk_assessment'
  | 'negotiation_readiness'
  | 'market_positioning'
  | 'client_presentation'

export interface OfferAnalysisOptions {
  perspective: 'seller' | 'buyer' | 'agent' | 'neutral'
  depth: 'summary' | 'detailed' | 'comprehensive'
  includeRecommendations: boolean
  includeRisks: boolean
  includeComparisons: boolean
  focusAreas?: OfferFocusArea[]
  jurisdiction?: string
  sessionId?: string
}

export type OfferFocusArea =
  | 'price'
  | 'financing'
  | 'timeline'
  | 'contingencies'
  | 'terms'
  | 'competition'
  | 'market_position'
  | 'risks'

export interface OfferAnalysisResult {
  summary: {
    overallStrength: 'strong' | 'moderate' | 'weak'
    keyStrengths: string[]
    keyWeaknesses: string[]
    competitivePosition: 'leading' | 'competitive' | 'trailing'
    recommendation: string
  }
  financial: {
    priceAnalysis: string
    financingStrength: 'strong' | 'moderate' | 'weak'
    cashFlow: string
    totalCost: string
    marketValueComparison: string
  }
  terms: {
    timeline: string
    contingencies: string[]
    flexibilityLevel: 'high' | 'medium' | 'low'
    unusualTerms: string[]
    standardCompliance: 'compliant' | 'non-standard' | 'problematic'
  }
  risks: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
    mitigationStrategies: string[]
    dealBreakers: string[]
  }
  comparison?: {
    ranking: number
    totalOffers: number
    advantages: string[]
    disadvantages: string[]
    competitiveGaps: string[]
  }
  recommendations: {
    immediate: string[]
    strategic: string[]
    negotiation: string[]
    fallback: string[]
  }
  insights: string[]
  toolsUsed: string[]
  confidence: number
}

// ========== OFFER ANALYSIS AGENT CLASS ==========

export class OfferAnalysisAgent {
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
    // Get relevant tools for offer analysis
    const tools = [
      this.toolRegistry.getTool('GetMarketDataTool'),
      this.toolRegistry.getTool('GetComparablePropertiesTool'),
      this.toolRegistry.getTool('CalculatePropertyValueTool'),
      this.toolRegistry.getTool('MarketTrendAnalysisTool'),
      this.toolRegistry.getTool('CompetitiveMarketAnalysisTool'),
      this.toolRegistry.getTool('MortgagePaymentCalculatorTool'),
      this.toolRegistry.getTool('InvestmentReturnCalculatorTool'),
      this.toolRegistry.getTool('ClosingCostCalculatorTool'),
      this.toolRegistry.getTool('PropertyConditionAssessmentTool'),
      this.toolRegistry.getTool('InvestmentPropertyAnalysisTool'),
      this.toolRegistry.getTool('PropertyDataValidatorTool'),
      this.toolRegistry.getTool('CurrencyFormatterTool'),
      this.toolRegistry.getTool('DateFormatterTool'),
      this.toolRegistry.getTool('NumberFormatterTool'),
      this.toolRegistry.getTool('GetOfferTool'),
      this.toolRegistry.getTool('CreateOfferComparisonTool'),
      this.toolRegistry.getTool('ErrorHandlerTool'),
    ].filter(Boolean)

    // Create agent with tools
    const agent = createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt: ANALYSIS_PROMPT_TEMPLATES.SINGLE_OFFER_REVIEW, // Default prompt
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

  // ========== OFFER ANALYSIS METHODS ==========

  async analyzeSingleOffer(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'neutral',
      depth: 'detailed',
      includeRecommendations: true,
      includeRisks: true,
      includeComparisons: false,
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('single_offer_review')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
      includeRisks: options.includeRisks.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  async compareMultipleOffers(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'seller',
      depth: 'comprehensive',
      includeRecommendations: true,
      includeRisks: true,
      includeComparisons: true,
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('competitive_comparison')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
      includeComparisons: options.includeComparisons.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  async assessOfferStrength(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'neutral',
      depth: 'detailed',
      includeRecommendations: true,
      includeRisks: false,
      includeComparisons: false,
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('offer_strength_assessment')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
      focusAreas: options.focusAreas?.join(', ') || 'all',
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  async analyzeFinancials(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'neutral',
      depth: 'comprehensive',
      includeRecommendations: true,
      includeRisks: true,
      includeComparisons: false,
      focusAreas: ['price', 'financing'],
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('financial_analysis')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
      focusAreas: options.focusAreas?.join(', ') || 'price, financing',
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  async assessRisks(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'neutral',
      depth: 'comprehensive',
      includeRecommendations: true,
      includeRisks: true,
      includeComparisons: false,
      focusAreas: ['risks'],
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('risk_assessment')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
      includeRisks: options.includeRisks.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  async generateClientSummary(
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions = {
      perspective: 'agent',
      depth: 'summary',
      includeRecommendations: true,
      includeRisks: false,
      includeComparisons: false,
    }
  ): Promise<OfferAnalysisResult> {
    const prompt = getAnalysisPrompt('client_presentation')

    const input = await prompt.format({
      context: formatAnalysisContext(context),
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations.toString(),
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseAnalysisResult(result, context, options)
  }

  // ========== UTILITY METHODS ==========

  private parseAnalysisResult(
    result: any,
    context: OfferAnalysisContext,
    options: OfferAnalysisOptions
  ): OfferAnalysisResult {
    const output = result.output || result.text || ''
    const intermediateSteps = result.intermediateSteps || []

    // Extract tools used
    const toolsUsed = intermediateSteps
      .map((step: any) => step.action?.tool)
      .filter(Boolean)

    // Parse the analysis response
    const parsed = this.parseOfferAnalysisResponse(output, context.analysisType)

    return {
      ...parsed,
      toolsUsed,
      confidence: this.calculateConfidence(parsed, toolsUsed),
    }
  }

  private parseOfferAnalysisResponse(
    response: string,
    analysisType: string
  ): Omit<OfferAnalysisResult, 'toolsUsed' | 'confidence'> {
    // Extract overall strength
    const strengthMatch = response.match(
      /(?:Overall|Strength|Rating):?\s*(strong|moderate|weak)/i
    )
    const overallStrength = strengthMatch
      ? (strengthMatch[1].toLowerCase() as 'strong' | 'moderate' | 'weak')
      : 'moderate'

    // Extract key strengths
    const strengthsSection = response.match(
      /(?:Strengths?|Advantages?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|Weak|Risk|$)/i
    )
    const keyStrengths: string[] = []
    if (strengthsSection) {
      const bullets = strengthsSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        keyStrengths.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Extract key weaknesses
    const weaknessSection = response.match(
      /(?:Weakness|Concerns?|Issues?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|Risk|Recommend|$)/i
    )
    const keyWeaknesses: string[] = []
    if (weaknessSection) {
      const bullets = weaknessSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        keyWeaknesses.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Extract recommendations
    const recommendationSection = response.match(
      /(?:Recommend|Next Steps?|Actions?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    const recommendations: string[] = []
    if (recommendationSection) {
      const bullets = recommendationSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        recommendations.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Extract risks
    const riskSection = response.match(
      /(?:Risk|Risks):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|Recommend|$)/i
    )
    const riskFactors: string[] = []
    if (riskSection) {
      const bullets = riskSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        riskFactors.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Extract insights
    const insightSection = response.match(
      /(?:Insights?|Key Points?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    const insights: string[] = []
    if (insightSection) {
      const bullets = insightSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        insights.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Determine various levels and ratings
    const riskLevel = this.determineRiskLevel(response)
    const financingStrength = this.determineFinancingStrength(response)
    const competitivePosition = this.determineCompetitivePosition(response)
    const flexibilityLevel = this.determineFlexibilityLevel(response)
    const standardCompliance = this.determineStandardCompliance(response)

    // Extract financial details
    const priceAnalysis = this.extractFinancialDetail(response, 'price')
    const cashFlow = this.extractFinancialDetail(response, 'cash flow')
    const totalCost = this.extractFinancialDetail(response, 'total cost')
    const marketValueComparison = this.extractFinancialDetail(
      response,
      'market value'
    )

    // Extract terms details
    const timeline = this.extractTermDetail(response, 'timeline')
    const contingencies = this.extractContingencies(response)
    const unusualTerms = this.extractUnusualTerms(response)

    // Extract main recommendation
    const mainRecommendationMatch = response.match(
      /(?:Recommendation|Recommend):?\s*(.*?)(?:\n|\.)/i
    )
    const mainRecommendation = mainRecommendationMatch
      ? mainRecommendationMatch[1].trim()
      : 'Proceed with standard analysis approach'

    return {
      summary: {
        overallStrength,
        keyStrengths: keyStrengths.slice(0, 5),
        keyWeaknesses: keyWeaknesses.slice(0, 5),
        competitivePosition,
        recommendation: mainRecommendation,
      },
      financial: {
        priceAnalysis,
        financingStrength,
        cashFlow,
        totalCost,
        marketValueComparison,
      },
      terms: {
        timeline,
        contingencies: contingencies.slice(0, 5),
        flexibilityLevel,
        unusualTerms: unusualTerms.slice(0, 3),
        standardCompliance,
      },
      risks: {
        level: riskLevel,
        factors: riskFactors.slice(0, 5),
        mitigationStrategies: this.extractMitigationStrategies(response),
        dealBreakers: this.extractDealBreakers(response),
      },
      comparison: this.extractComparisonData(response),
      recommendations: {
        immediate: this.extractRecommendationsByType(response, 'immediate'),
        strategic: this.extractRecommendationsByType(response, 'strategic'),
        negotiation: this.extractRecommendationsByType(response, 'negotiation'),
        fallback: this.extractRecommendationsByType(response, 'fallback'),
      },
      insights: insights.slice(0, 5),
    }
  }

  private determineRiskLevel(response: string): 'low' | 'medium' | 'high' {
    const highRiskWords = [
      'high risk',
      'significant risk',
      'major concern',
      'serious issue',
    ]
    const lowRiskWords = ['low risk', 'minimal risk', 'safe', 'secure']
    const lowerResponse = response.toLowerCase()

    const highRiskCount = highRiskWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )
    const lowRiskCount = lowRiskWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )

    return highRiskCount > lowRiskCount
      ? 'high'
      : lowRiskCount > highRiskCount
        ? 'low'
        : 'medium'
  }

  private determineFinancingStrength(
    response: string
  ): 'strong' | 'moderate' | 'weak' {
    const strongWords = [
      'strong financing',
      'solid financing',
      'excellent financing',
    ]
    const weakWords = ['weak financing', 'poor financing', 'financing concerns']
    const lowerResponse = response.toLowerCase()

    const strongCount = strongWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )
    const weakCount = weakWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )

    return strongCount > weakCount
      ? 'strong'
      : weakCount > strongCount
        ? 'weak'
        : 'moderate'
  }

  private determineCompetitivePosition(
    response: string
  ): 'leading' | 'competitive' | 'trailing' {
    const leadingWords = ['leading', 'strongest', 'best positioned']
    const trailingWords = ['trailing', 'weakest', 'behind']
    const lowerResponse = response.toLowerCase()

    const leadingCount = leadingWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )
    const trailingCount = trailingWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )

    return leadingCount > trailingCount
      ? 'leading'
      : trailingCount > leadingCount
        ? 'trailing'
        : 'competitive'
  }

  private determineFlexibilityLevel(
    response: string
  ): 'high' | 'medium' | 'low' {
    const highFlexWords = [
      'very flexible',
      'highly flexible',
      'maximum flexibility',
    ]
    const lowFlexWords = ['inflexible', 'rigid', 'non-negotiable']
    const lowerResponse = response.toLowerCase()

    const highFlexCount = highFlexWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )
    const lowFlexCount = lowFlexWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )

    return highFlexCount > lowFlexCount
      ? 'high'
      : lowFlexCount > highFlexCount
        ? 'low'
        : 'medium'
  }

  private determineStandardCompliance(
    response: string
  ): 'compliant' | 'non-standard' | 'problematic' {
    const compliantWords = ['standard', 'compliant', 'typical']
    const problematicWords = ['problematic', 'concerning', 'irregular']
    const lowerResponse = response.toLowerCase()

    const compliantCount = compliantWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )
    const problematicCount = problematicWords.reduce(
      (count, phrase) => count + (lowerResponse.includes(phrase) ? 1 : 0),
      0
    )

    return compliantCount > problematicCount
      ? 'compliant'
      : problematicCount > compliantCount
        ? 'problematic'
        : 'non-standard'
  }

  private extractFinancialDetail(response: string, type: string): string {
    const match = response.match(
      new RegExp(`(?:${type}):?\\s*(.*?)(?:\\n|$)`, 'i')
    )
    return match ? match[1].trim() : `${type} analysis not available`
  }

  private extractTermDetail(response: string, type: string): string {
    const match = response.match(
      new RegExp(`(?:${type}):?\\s*(.*?)(?:\\n|$)`, 'i')
    )
    return match ? match[1].trim() : `${type} analysis not available`
  }

  private extractContingencies(response: string): string[] {
    const contingencySection = response.match(
      /(?:Contingenc|Conditions?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!contingencySection) return []

    const bullets = contingencySection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      : []
  }

  private extractUnusualTerms(response: string): string[] {
    const unusualSection = response.match(
      /(?:Unusual|Special|Unique):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!unusualSection) return []

    const bullets = unusualSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      : []
  }

  private extractMitigationStrategies(response: string): string[] {
    const mitigationSection = response.match(
      /(?:Mitigation|Mitigate):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!mitigationSection) return []

    const bullets = mitigationSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractDealBreakers(response: string): string[] {
    const dealBreakerSection = response.match(
      /(?:Deal Breaker|Show Stopper):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!dealBreakerSection) return []

    const bullets = dealBreakerSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractComparisonData(response: string): any {
    const rankingMatch = response.match(/(?:Rank|Position):?\s*(\d+)/i)
    const totalMatch = response.match(/(?:of|total):?\s*(\d+)/i)

    if (!rankingMatch) return undefined

    return {
      ranking: parseInt(rankingMatch[1], 10),
      totalOffers: totalMatch ? parseInt(totalMatch[1], 10) : 1,
      advantages: this.extractAdvantages(response),
      disadvantages: this.extractDisadvantages(response),
      competitiveGaps: this.extractCompetitiveGaps(response),
    }
  }

  private extractAdvantages(response: string): string[] {
    const advantageSection = response.match(
      /(?:Advantage|Benefit):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|Disadvantage|$)/i
    )
    if (!advantageSection) return []

    const bullets = advantageSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractDisadvantages(response: string): string[] {
    const disadvantageSection = response.match(
      /(?:Disadvantage|Weakness):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!disadvantageSection) return []

    const bullets = disadvantageSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractCompetitiveGaps(response: string): string[] {
    const gapSection = response.match(
      /(?:Gap|Opportunity):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )
    if (!gapSection) return []

    const bullets = gapSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractRecommendationsByType(
    response: string,
    type: string
  ): string[] {
    const typeSection = response.match(
      new RegExp(
        `(?:${type}):?\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n[A-Z][a-z]|$)`,
        'i'
      )
    )
    if (!typeSection) return []

    const bullets = typeSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private calculateConfidence(parsed: any, toolsUsed: string[]): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on tools used
    if (toolsUsed.includes('GetMarketDataTool')) confidence += 0.1
    if (toolsUsed.includes('CalculatePropertyValueTool')) confidence += 0.1
    if (toolsUsed.includes('MortgagePaymentCalculatorTool')) confidence += 0.05
    if (toolsUsed.includes('PropertyConditionAssessmentTool'))
      confidence += 0.05

    // Increase confidence based on response completeness
    if (parsed.summary.keyStrengths.length >= 3) confidence += 0.05
    if (parsed.summary.keyWeaknesses.length >= 2) confidence += 0.05
    if (parsed.insights.length >= 3) confidence += 0.05

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
    result: OfferAnalysisResult,
    context: OfferAnalysisContext
  ): Promise<void> {
    // Use the CreateOfferComparisonTool to save the analysis
    const saveTool = this.toolRegistry.getTool('CreateOfferComparisonTool')
    if (saveTool) {
      await saveTool.invoke({
        offers: [context.primaryOffer, ...(context.competingOffers || [])],
        analysis: result,
        createdAt: new Date().toISOString(),
      })
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

export const createOfferAnalysisContext = (
  primaryOffer: Offer,
  propertyData: any,
  marketData: any,
  analysisType: AnalysisType = 'single_offer_review',
  competingOffers?: Offer[],
  sellerData?: any
): OfferAnalysisContext => {
  return {
    primaryOffer,
    competingOffers,
    marketData,
    property: {
      address: propertyData.address,
      listPrice: propertyData.listPrice || propertyData.price,
      estimatedValue: propertyData.estimatedValue || propertyData.marketValue,
      daysOnMarket: propertyData.daysOnMarket || 0,
      propertyType: propertyData.propertyType || 'residential',
      condition: propertyData.condition || 'good',
      features: propertyData.features,
      issues: propertyData.issues,
    },
    seller: {
      motivations: sellerData?.motivations,
      timeline: sellerData?.timeline,
      circumstances: sellerData?.circumstances,
      flexibility: sellerData?.flexibility,
    },
    market: {
      trend: marketData?.trend || 'warm',
      inventory: marketData?.inventory || 'balanced',
      competitionLevel: marketData?.competitionLevel || 'medium',
      averageDaysOnMarket: marketData?.averageDaysOnMarket || 30,
      averagePricePerSqFt: marketData?.averagePricePerSqFt,
    },
    analysisType,
  }
}

export const getRecommendedAnalysisOptions = (
  analysisType: AnalysisType,
  userRole: 'agent' | 'buyer' | 'seller'
): OfferAnalysisOptions => {
  const baseOptions: OfferAnalysisOptions = {
    perspective: 'neutral',
    depth: 'detailed',
    includeRecommendations: true,
    includeRisks: true,
    includeComparisons: false,
  }

  // Adjust based on analysis type
  switch (analysisType) {
    case 'competitive_comparison':
      return {
        ...baseOptions,
        perspective: 'seller',
        depth: 'comprehensive',
        includeComparisons: true,
      }
    case 'financial_analysis':
      return {
        ...baseOptions,
        depth: 'comprehensive',
        focusAreas: ['price', 'financing'],
      }
    case 'risk_assessment':
      return {
        ...baseOptions,
        depth: 'comprehensive',
        focusAreas: ['risks'],
      }
    case 'client_presentation':
      return {
        ...baseOptions,
        perspective: 'agent',
        depth: 'summary',
        includeRisks: false,
      }
    default:
      return baseOptions
  }
}

export default OfferAnalysisAgent
