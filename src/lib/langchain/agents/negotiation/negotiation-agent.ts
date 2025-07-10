/**
 * LangChain Negotiation Strategy Agent
 *
 * LangChain agent implementation for generating strategic negotiation
 * recommendations, tactics, and positioning strategies for real estate
 * transactions. Replaces the existing OpenAI negotiation service.
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ConversationMemory } from '../../memory/conversation-memory'
import { ToolRegistry } from '../../tools/index'
import {
  NEGOTIATION_PROMPT_TEMPLATES,
  formatNegotiationContext,
  getNegotiationPrompt,
} from '../../prompts/negotiation-prompts'
import { getModelConfig } from '../../common/model-config'
import type { Offer } from '../../../../shared/types/offers'
import type {
  Negotiation,
  NegotiationStrategy,
} from '../../../../shared/types/negotiations'
import type { MarketData } from '../../../../shared/types/market-data'

// ========== NEGOTIATION AGENT TYPES ==========

export interface NegotiationContext {
  scenario: NegotiationScenario
  client: {
    role: 'buyer' | 'seller'
    goals: string[]
    priorities: NegotiationPriority[]
    constraints: string[]
    timeline: string
    budget?: {
      max: number
      preferred: number
      flexibility: 'high' | 'medium' | 'low'
    }
    motivations: string[]
    experienceLevel: 'first-time' | 'experienced' | 'investor'
  }
  opposition: {
    estimatedRole: 'buyer' | 'seller'
    knownMotivations?: string[]
    timelinePressure?: 'high' | 'medium' | 'low'
    financialPosition?: 'strong' | 'average' | 'constrained'
    negotiationStyle?: 'aggressive' | 'collaborative' | 'formal' | 'emotional'
    previousResponses?: string[]
  }
  property: {
    address: string
    listPrice: number
    marketValue: number
    daysOnMarket: number
    propertyCondition: 'excellent' | 'good' | 'fair' | 'needs-work'
    uniqueFeatures?: string[]
    issues?: string[]
  }
  marketConditions: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    competitionLevel: 'high' | 'medium' | 'low'
    seasonality: 'peak' | 'normal' | 'slow'
    interestRates: 'rising' | 'stable' | 'falling'
  }
  currentOffer?: Offer
  negotiationHistory?: {
    previousOffers: any[]
    counterOffers: any[]
    concessionsMade: string[]
    stickingPoints: string[]
  }
  agent: {
    name: string
    experience: string
    negotiationStyle: 'aggressive' | 'collaborative' | 'analytical'
    relationship?: 'known' | 'unknown' | 'difficult'
  }
}

export type NegotiationScenario =
  | 'initial_offer'
  | 'counter_offer'
  | 'multiple_offers'
  | 'deadline_pressure'
  | 'appraisal_gap'
  | 'inspection_negotiations'
  | 'financing_contingency'
  | 'seller_financing'
  | 'lease_back'
  | 'as_is_negotiation'
  | 'price_reduction'
  | 'closing_timeline'
  | 'repair_negotiations'
  | 'final_push'

export type NegotiationPriority =
  | 'price'
  | 'timeline'
  | 'contingencies'
  | 'repairs'
  | 'possession_date'
  | 'inclusions'
  | 'financing_terms'
  | 'inspection_period'

export interface NegotiationStrategyOptions {
  aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  riskTolerance: 'low' | 'medium' | 'high'
  timeHorizon: 'immediate' | 'short-term' | 'flexible'
  relationshipImportance: 'high' | 'medium' | 'low'
  includeAlternatives: boolean
  includeFallbacks: boolean
  jurisdiction?: string
  sessionId?: string
}

export interface NegotiationStrategyResult {
  strategy: {
    primaryApproach: string
    tacticalRecommendations: string[]
    positioningPoints: string[]
    concessionStrategy: string[]
    communicationTone: string
  }
  tactics: {
    opening: string
    leverage: string[]
    timing: string
    escalation: string[]
    closing: string
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
  toolsUsed: string[]
  confidence: number
}

// ========== NEGOTIATION AGENT CLASS ==========

export class NegotiationAgent {
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
    // Get relevant tools for negotiation
    const tools = [
      this.toolRegistry.getTool('GetMarketDataTool'),
      this.toolRegistry.getTool('GetComparablePropertiesTool'),
      this.toolRegistry.getTool('CalculatePropertyValueTool'),
      this.toolRegistry.getTool('MarketTrendAnalysisTool'),
      this.toolRegistry.getTool('MortgagePaymentCalculatorTool'),
      this.toolRegistry.getTool('InvestmentReturnCalculatorTool'),
      this.toolRegistry.getTool('PropertyConditionAssessmentTool'),
      this.toolRegistry.getTool('PropertyDataValidatorTool'),
      this.toolRegistry.getTool('CurrencyFormatterTool'),
      this.toolRegistry.getTool('DateFormatterTool'),
      this.toolRegistry.getTool('CreateOfferTool'),
      this.toolRegistry.getTool('GetOfferTool'),
      this.toolRegistry.getTool('CreateOfferComparisonTool'),
      this.toolRegistry.getTool('CreateNegotiationTool'),
      this.toolRegistry.getTool('GetNegotiationTool'),
      this.toolRegistry.getTool('AddNegotiationMessageTool'),
    ].filter(Boolean)

    // Create agent with tools
    const agent = createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt: NEGOTIATION_PROMPT_TEMPLATES.INITIAL_OFFER, // Default prompt
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

  // ========== NEGOTIATION STRATEGY METHODS ==========

  async generateInitialOfferStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'moderate',
      riskTolerance: 'medium',
      timeHorizon: 'short-term',
      relationshipImportance: 'medium',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('initial_offer')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  async generateCounterOfferStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'moderate',
      riskTolerance: 'medium',
      timeHorizon: 'immediate',
      relationshipImportance: 'high',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('counter_offer')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  async generateMultipleOffersStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'aggressive',
      riskTolerance: 'high',
      timeHorizon: 'immediate',
      relationshipImportance: 'low',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('multiple_offers')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  async generateDeadlinePressureStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'moderate',
      riskTolerance: 'medium',
      timeHorizon: 'immediate',
      relationshipImportance: 'medium',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('deadline_pressure')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  async generateAppraisalGapStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'conservative',
      riskTolerance: 'low',
      timeHorizon: 'short-term',
      relationshipImportance: 'high',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('appraisal_gap')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  async generateInspectionNegotiationStrategy(
    context: NegotiationContext,
    options: NegotiationStrategyOptions = {
      aggressiveness: 'moderate',
      riskTolerance: 'medium',
      timeHorizon: 'short-term',
      relationshipImportance: 'high',
      includeAlternatives: true,
      includeFallbacks: true,
    }
  ): Promise<NegotiationStrategyResult> {
    const prompt = getNegotiationPrompt('inspection_negotiations')

    const input = await prompt.format({
      context: formatNegotiationContext(context),
      aggressiveness: options.aggressiveness,
      riskTolerance: options.riskTolerance,
      timeHorizon: options.timeHorizon,
      relationshipImportance: options.relationshipImportance,
    })

    const result = await this.agent.invoke({
      input,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseStrategyResult(result, context, options)
  }

  // ========== UTILITY METHODS ==========

  private parseStrategyResult(
    result: any,
    context: NegotiationContext,
    options: NegotiationStrategyOptions
  ): NegotiationStrategyResult {
    const output = result.output || result.text || ''
    const intermediateSteps = result.intermediateSteps || []

    // Extract tools used
    const toolsUsed = intermediateSteps
      .map((step: any) => step.action?.tool)
      .filter(Boolean)

    // Parse the strategy response
    const parsed = this.parseNegotiationResponse(output, context.scenario)

    return {
      ...parsed,
      toolsUsed,
      confidence: this.calculateConfidence(parsed, toolsUsed),
    }
  }

  private parseNegotiationResponse(
    response: string,
    scenario: string
  ): Omit<NegotiationStrategyResult, 'toolsUsed' | 'confidence'> {
    // Extract primary approach
    const approachMatch = response.match(
      /(?:Primary Approach|Main Strategy|Strategy):?\s*(.*?)(?:\n\n|\n[A-Z])/i
    )
    const primaryApproach = approachMatch
      ? approachMatch[1].trim()
      : 'Collaborative negotiation approach'

    // Extract tactical recommendations
    const tacticalSection = response.match(
      /(?:Tactical|Tactics|Recommendations):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    const tacticalRecommendations: string[] = []
    if (tacticalSection) {
      const bullets = tacticalSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        tacticalRecommendations.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Extract scenarios
    const bestCaseMatch = response.match(/Best Case:?\s*(.*?)(?:\n|$)/i)
    const worstCaseMatch = response.match(/Worst Case:?\s*(.*?)(?:\n|$)/i)
    const likelyMatch = response.match(
      /(?:Most Likely|Likely):?\s*(.*?)(?:\n|$)/i
    )

    // Extract risks
    const riskSection = response.match(
      /(?:Risk|Risks):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
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

    // Extract next steps
    const stepsSection = response.match(
      /(?:Next Steps|Action Items|Steps):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    const nextSteps: string[] = []
    if (stepsSection) {
      const bullets = stepsSection[1].match(/[-•*]\s*(.+)/g)
      if (bullets) {
        nextSteps.push(
          ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
        )
      }
    }

    // Determine risk level
    const riskLevel = this.determineRiskLevel(response)

    return {
      strategy: {
        primaryApproach,
        tacticalRecommendations: tacticalRecommendations.slice(0, 6),
        positioningPoints: this.extractPositioningPoints(response),
        concessionStrategy: this.extractConcessionStrategy(response),
        communicationTone: this.detectCommunicationTone(response),
      },
      tactics: {
        opening: this.extractTactic(response, 'opening'),
        leverage: this.extractLeveragePoints(response),
        timing: this.extractTactic(response, 'timing'),
        escalation: this.extractEscalationTactics(response),
        closing: this.extractTactic(response, 'closing'),
      },
      scenarios: {
        bestCase: bestCaseMatch
          ? bestCaseMatch[1].trim()
          : 'Successful negotiation with favorable terms',
        worstCase: worstCaseMatch
          ? worstCaseMatch[1].trim()
          : 'Deal falls through or unfavorable terms',
        mostLikely: likelyMatch
          ? likelyMatch[1].trim()
          : 'Moderate compromise required',
        fallbackOptions: this.extractFallbackOptions(response),
      },
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors.slice(0, 5),
        mitigationStrategies: this.extractMitigationStrategies(response),
      },
      recommendations: tacticalRecommendations.slice(0, 5),
      nextSteps: nextSteps.slice(0, 5),
    }
  }

  private determineRiskLevel(response: string): 'low' | 'medium' | 'high' {
    const highRiskWords = ['aggressive', 'risky', 'dangerous', 'threat']
    const lowRiskWords = ['safe', 'conservative', 'secure', 'stable']
    const lowerResponse = response.toLowerCase()

    const highRiskCount = highRiskWords.reduce(
      (count, word) =>
        count + (lowerResponse.match(new RegExp(word, 'g')) || []).length,
      0
    )
    const lowRiskCount = lowRiskWords.reduce(
      (count, word) =>
        count + (lowerResponse.match(new RegExp(word, 'g')) || []).length,
      0
    )

    return highRiskCount > lowRiskCount + 1
      ? 'high'
      : lowRiskCount > highRiskCount + 1
        ? 'low'
        : 'medium'
  }

  private extractPositioningPoints(response: string): string[] {
    const positioningSection = response.match(
      /(?:Position|Positioning):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!positioningSection) return []

    const bullets = positioningSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 4)
      : []
  }

  private extractConcessionStrategy(response: string): string[] {
    const concessionSection = response.match(
      /(?:Concession|Concessions):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!concessionSection) return []

    const bullets = concessionSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 4)
      : []
  }

  private detectCommunicationTone(response: string): string {
    const lowerResponse = response.toLowerCase()
    if (
      lowerResponse.includes('professional') ||
      lowerResponse.includes('formal')
    ) {
      return 'Professional and formal'
    }
    if (
      lowerResponse.includes('collaborative') ||
      lowerResponse.includes('friendly')
    ) {
      return 'Collaborative and friendly'
    }
    if (lowerResponse.includes('assertive') || lowerResponse.includes('firm')) {
      return 'Assertive and firm'
    }
    return 'Balanced and diplomatic'
  }

  private extractTactic(response: string, type: string): string {
    const tacticMatch = response.match(
      new RegExp(`(?:${type}):?\\s*(.*?)(?:\\n|$)`, 'i')
    )
    return tacticMatch ? tacticMatch[1].trim() : `Strategic ${type} approach`
  }

  private extractLeveragePoints(response: string): string[] {
    const leverageSection = response.match(
      /(?:Leverage|Advantages?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!leverageSection) return []

    const bullets = leverageSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 4)
      : []
  }

  private extractEscalationTactics(response: string): string[] {
    const escalationSection = response.match(
      /(?:Escalation|Escalate):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!escalationSection) return []

    const bullets = escalationSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractFallbackOptions(response: string): string[] {
    const fallbackSection = response.match(
      /(?:Fallback|Alternative|Plan B):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!fallbackSection) return []

    const bullets = fallbackSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private extractMitigationStrategies(response: string): string[] {
    const mitigationSection = response.match(
      /(?:Mitigation|Mitigate):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
    )
    if (!mitigationSection) return []

    const bullets = mitigationSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 3)
      : []
  }

  private calculateConfidence(parsed: any, toolsUsed: string[]): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on tools used
    if (toolsUsed.includes('GetMarketDataTool')) confidence += 0.1
    if (toolsUsed.includes('CalculatePropertyValueTool')) confidence += 0.1
    if (toolsUsed.includes('MarketTrendAnalysisTool')) confidence += 0.1

    // Increase confidence based on response completeness
    if (parsed.strategy.tacticalRecommendations.length >= 3) confidence += 0.05
    if (parsed.nextSteps.length >= 3) confidence += 0.05

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
    result: NegotiationStrategyResult,
    context: NegotiationContext
  ): Promise<void> {
    // Use the CreateNegotiationTool to save the strategy
    const saveTool = this.toolRegistry.getTool('CreateNegotiationTool')
    if (saveTool) {
      await saveTool.invoke({
        offerId: context.currentOffer?.id || '',
        strategy: result.strategy.primaryApproach,
        tactics: result.tactics,
        scenarios: result.scenarios,
        riskAssessment: result.riskAssessment,
        recommendations: result.recommendations,
        nextSteps: result.nextSteps,
        agentId: context.agent.name,
        createdAt: new Date().toISOString(),
      })
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

export const createNegotiationContext = (
  scenario: NegotiationScenario,
  clientData: any,
  propertyData: any,
  marketData: any,
  oppositionData?: any,
  offerData?: Offer,
  historyData?: any,
  agentData?: any
): NegotiationContext => {
  return {
    scenario,
    client: {
      role: clientData.role || 'buyer',
      goals: clientData.goals || [],
      priorities: clientData.priorities || [],
      constraints: clientData.constraints || [],
      timeline: clientData.timeline || 'flexible',
      budget: clientData.budget,
      motivations: clientData.motivations || [],
      experienceLevel: clientData.experienceLevel || 'experienced',
    },
    opposition: {
      estimatedRole:
        oppositionData?.role ||
        (clientData.role === 'buyer' ? 'seller' : 'buyer'),
      knownMotivations: oppositionData?.motivations,
      timelinePressure: oppositionData?.timelinePressure,
      financialPosition: oppositionData?.financialPosition,
      negotiationStyle: oppositionData?.negotiationStyle,
      previousResponses: oppositionData?.previousResponses,
    },
    property: {
      address: propertyData.address,
      listPrice: propertyData.listPrice || propertyData.price,
      marketValue: propertyData.marketValue || propertyData.estimatedValue,
      daysOnMarket: propertyData.daysOnMarket || 0,
      propertyCondition: propertyData.condition || 'good',
      uniqueFeatures: propertyData.features,
      issues: propertyData.issues,
    },
    marketConditions: {
      trend: marketData.trend || 'warm',
      inventory: marketData.inventory || 'balanced',
      competitionLevel: marketData.competitionLevel || 'medium',
      seasonality: marketData.seasonality || 'normal',
      interestRates: marketData.interestRates || 'stable',
    },
    currentOffer: offerData,
    negotiationHistory: historyData,
    agent: {
      name: agentData?.name || 'Agent',
      experience: agentData?.experience || 'experienced',
      negotiationStyle: agentData?.negotiationStyle || 'collaborative',
      relationship: agentData?.relationship,
    },
  }
}

export const getRecommendedStrategyOptions = (
  scenario: NegotiationScenario,
  clientExperience: 'first-time' | 'experienced' | 'investor',
  marketConditions: 'hot' | 'warm' | 'cool'
): NegotiationStrategyOptions => {
  const baseOptions: NegotiationStrategyOptions = {
    aggressiveness: 'moderate',
    riskTolerance: 'medium',
    timeHorizon: 'short-term',
    relationshipImportance: 'medium',
    includeAlternatives: true,
    includeFallbacks: true,
  }

  // Adjust based on scenario
  switch (scenario) {
    case 'multiple_offers':
      return {
        ...baseOptions,
        aggressiveness: 'aggressive',
        riskTolerance: 'high',
        timeHorizon: 'immediate',
        relationshipImportance: 'low',
      }
    case 'deadline_pressure':
      return {
        ...baseOptions,
        aggressiveness: 'moderate',
        riskTolerance: 'medium',
        timeHorizon: 'immediate',
        relationshipImportance: 'medium',
      }
    case 'appraisal_gap':
      return {
        ...baseOptions,
        aggressiveness: 'conservative',
        riskTolerance: 'low',
        timeHorizon: 'short-term',
        relationshipImportance: 'high',
      }
    default:
      return baseOptions
  }
}

export default NegotiationAgent
