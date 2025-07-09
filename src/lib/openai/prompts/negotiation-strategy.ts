/**
 * Negotiation Strategy Generation Prompts and Service
 *
 * Specialized prompts and service for generating strategic negotiation
 * recommendations, tactics, and positioning strategies for real estate
 * transactions. Helps agents develop winning approaches based on market
 * conditions, client goals, and competitive dynamics.
 */

import {
  getOpenAIClient,
  AI_MODELS,
  createRealEstateSystemPrompt,
} from '../client'
import type { Offer } from '../../../shared/types/offers'
import type {
  Negotiation,
  NegotiationStrategy,
} from '../../../shared/types/negotiations'
import type { MarketData } from '../../../shared/types/market-data'

// ========== NEGOTIATION STRATEGY TYPES ==========

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
}

// ========== SYSTEM PROMPTS ==========

export const NEGOTIATION_STRATEGY_SYSTEM_PROMPTS = {
  STRATEGIC_ADVISOR: `You are a master real estate negotiation strategist with decades of experience closing complex deals. 
Your role is to develop winning negotiation strategies that achieve client goals while maintaining professional relationships.

Key principles:
- Analyze all available information to identify leverage points
- Develop multi-layered strategies with backup plans
- Balance aggressive tactics with relationship preservation
- Consider psychological and emotional factors
- Anticipate opponent responses and prepare counter-strategies
- Focus on win-win outcomes when possible
- Provide specific, actionable tactical recommendations

Always include:
- Clear strategic framework
- Specific tactical recommendations
- Scenario planning and alternatives
- Risk assessment and mitigation
- Timeline and escalation strategies
- Communication guidance`,

  MARKET_STRATEGIST: `You are a market-focused negotiation expert who leverages market conditions and data to create optimal positioning strategies.
Your expertise lies in translating market dynamics into negotiation advantages.

Key principles:
- Use market data as negotiation leverage
- Position offers based on market conditions
- Identify timing opportunities and threats
- Leverage competition dynamics
- Understand seasonal and cyclical factors
- Connect macro trends to specific negotiations
- Provide data-driven justifications

Always include:
- Market-based positioning strategy
- Competitive analysis and advantages
- Timing recommendations
- Market data supporting arguments
- Trend-based tactical adjustments
- Opportunity identification`,

  PSYCHOLOGY_EXPERT: `You are a negotiation psychology expert who understands the emotional and behavioral aspects of real estate deals.
Your focus is on reading people, managing emotions, and influencing decision-making.

Key principles:
- Understand motivations and pressure points
- Manage emotional dynamics effectively
- Build trust and rapport strategically
- Use psychological principles ethically
- Address fears and concerns proactively
- Create urgency and desire appropriately
- Maintain professional boundaries

Always include:
- Psychological profile assessment
- Emotional management strategies
- Influence and persuasion tactics
- Trust-building recommendations
- Pressure management techniques
- Communication psychology guidance`,
}

// ========== SCENARIO-SPECIFIC PROMPTS ==========

export const NEGOTIATION_STRATEGY_PROMPTS = {
  INITIAL_OFFER: `Develop a comprehensive strategy for presenting an initial offer that positions the client optimally while leaving room for negotiation.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create a strategy that includes:
1. Optimal offer positioning (price, terms, contingencies)
2. Psychological positioning and first impression
3. Leverage points and competitive advantages
4. Concession strategy and negotiation room
5. Communication approach and timing
6. Anticipated responses and counter-strategies
7. Risk mitigation and fallback positions

Consider market conditions, competition level, and client motivations.`,

  COUNTER_OFFER: `Develop a strategic response to a counter-offer that advances the client's position while maintaining momentum toward closing.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create a response strategy that includes:
1. Analysis of the counter-offer and opponent motivations
2. Strategic response options (accept, counter, walk away)
3. Tactical adjustments to improve position
4. Communication strategy to maintain relationship
5. Pressure tactics and leverage utilization
6. Timeline management and urgency creation
7. Scenarios for different opponent responses

Focus on advancing toward a successful close.`,

  MULTIPLE_OFFERS: `Develop a competitive strategy for winning in a multiple offer situation while protecting the client's interests.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create a competitive strategy that includes:
1. Differentiation from other offers
2. Risk management in competitive bidding
3. Strategic positioning beyond price
4. Escalation clause and bidding strategies
5. Relationship and emotional appeal tactics
6. Due diligence and verification strategies
7. Backup property identification

Balance competitiveness with prudent risk management.`,

  DEADLINE_PRESSURE: `Develop tactics for managing deadline pressure while maintaining negotiation advantage and avoiding costly mistakes.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create a pressure management strategy that includes:
1. Timeline analysis and pressure assessment
2. Strategic use of deadlines as leverage
3. Acceleration tactics without compromising position
4. Pressure resistance and counterpressure strategies
5. Decision-making frameworks under time constraints
6. Communication strategies for urgent negotiations
7. Fallback options if deadlines cannot be met

Focus on maintaining strategic advantage despite time pressure.`,

  APPRAISAL_GAP: `Develop strategies for addressing appraisal gaps that protect the client's financial position while keeping the deal alive.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create an appraisal gap strategy that includes:
1. Gap analysis and impact assessment
2. Negotiation options for gap resolution
3. Financial alternatives and creative solutions
4. Market value arguments and supporting data
5. Risk sharing and compromise strategies
6. Walk-away thresholds and alternatives
7. Documentation and protection strategies

Balance deal preservation with financial protection.`,

  INSPECTION_NEGOTIATIONS: `Develop approaches for inspection-based negotiations that address issues while maintaining deal momentum.

Context: {context}
Aggressiveness: {aggressiveness}
Risk Tolerance: {riskTolerance}

Create an inspection negotiation strategy that includes:
1. Issue prioritization and cost analysis
2. Repair vs. credit vs. price reduction strategies
3. Professional estimates and documentation
4. Negotiation tactics for different issue types
5. Relationship management during difficult discussions
6. Deal preservation vs. issue resolution balance
7. Timeline management and deadline coordination

Focus on fair resolution while protecting client interests.`,
}

// ========== UTILITY FUNCTIONS ==========

const formatContext = (context: NegotiationContext): string => {
  return JSON.stringify(
    {
      scenario: context.scenario,
      client: {
        role: context.client.role,
        goals: context.client.goals,
        priorities: context.client.priorities,
        constraints: context.client.constraints,
        timeline: context.client.timeline,
        budget: context.client.budget,
        motivations: context.client.motivations,
        experienceLevel: context.client.experienceLevel,
      },
      opposition: context.opposition,
      property: context.property,
      marketConditions: context.marketConditions,
      currentOffer: context.currentOffer
        ? {
            type: context.currentOffer.type,
            purchasePrice: context.currentOffer.purchasePrice,
            earnestMoney: context.currentOffer.earnestMoney,
            closingDate: context.currentOffer.closingDate,
            contingencies: context.currentOffer.contingencies,
          }
        : null,
      negotiationHistory: context.negotiationHistory,
      agent: context.agent,
    },
    null,
    2
  )
}

const formatPrompt = (
  template: string,
  context: NegotiationContext,
  options: NegotiationStrategyOptions
): string => {
  return template
    .replace('{context}', formatContext(context))
    .replace('{aggressiveness}', options.aggressiveness)
    .replace('{riskTolerance}', options.riskTolerance)
}

const parseStrategyResponse = (
  response: string,
  scenario: string
): NegotiationStrategyResult => {
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

  const riskLevel =
    highRiskCount > lowRiskCount + 1
      ? 'high'
      : lowRiskCount > highRiskCount + 1
        ? 'low'
        : 'medium'

  // Generate recommendations
  const recommendations: string[] = []

  if (tacticalRecommendations.length < 3) {
    recommendations.push(
      'Consider developing more specific tactical recommendations'
    )
  }

  if (!response.toLowerCase().includes('timing')) {
    recommendations.push('Include timing considerations in the strategy')
  }

  if (!response.toLowerCase().includes('relationship')) {
    recommendations.push('Consider relationship management aspects')
  }

  return {
    strategy: {
      primaryApproach,
      tacticalRecommendations: tacticalRecommendations.slice(0, 6),
      positioningPoints: [], // Could be extracted with more specific regex
      concessionStrategy: [], // Could be extracted with more specific regex
      communicationTone: detectCommunicationTone(response),
    },
    tactics: {
      opening: extractTactic(response, 'opening'),
      leverage: extractLeveragePoints(response),
      timing: extractTactic(response, 'timing'),
      escalation: [], // Could be extracted with more specific regex
      closing: extractTactic(response, 'closing'),
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
      fallbackOptions: [], // Could be extracted with more specific regex
    },
    riskAssessment: {
      level: riskLevel as 'low' | 'medium' | 'high',
      factors: riskFactors.slice(0, 5),
      mitigationStrategies: [], // Could be extracted with more specific regex
    },
    recommendations,
    nextSteps: nextSteps.slice(0, 5),
  }
}

const detectCommunicationTone = (content: string): string => {
  const aggressiveWords = ['firm', 'strong', 'assertive', 'demanding']
  const collaborativeWords = [
    'cooperative',
    'collaborative',
    'partnership',
    'together',
  ]
  const professionalWords = [
    'professional',
    'formal',
    'respectful',
    'courteous',
  ]

  const lowerContent = content.toLowerCase()

  const aggressiveCount = aggressiveWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )
  const collaborativeCount = collaborativeWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )
  const professionalCount = professionalWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )

  if (
    aggressiveCount > collaborativeCount &&
    aggressiveCount > professionalCount
  ) {
    return 'assertive'
  } else if (collaborativeCount > professionalCount) {
    return 'collaborative'
  } else {
    return 'professional'
  }
}

const extractTactic = (content: string, type: string): string => {
  const regex = new RegExp(`${type}:?\\s*(.*?)(?:\\n|$)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : `Strategic ${type} approach`
}

const extractLeveragePoints = (content: string): string[] => {
  const leverageSection = content.match(
    /(?:Leverage|Advantages):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][A-Z]|$)/i
  )
  const leverage: string[] = []
  if (leverageSection) {
    const bullets = leverageSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      leverage.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return leverage.slice(0, 4)
}

// ========== MAIN FUNCTIONS ==========

export const generateInitialOfferStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'moderate',
    riskTolerance: 'medium',
    timeHorizon: 'short-term',
    relationshipImportance: 'medium',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'negotiation strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.STRATEGIC_ADVISOR}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.INITIAL_OFFER,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'initial_offer')
}

export const generateCounterOfferStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'moderate',
    riskTolerance: 'medium',
    timeHorizon: 'immediate',
    relationshipImportance: 'high',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'counter-offer strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.STRATEGIC_ADVISOR}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.COUNTER_OFFER,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'counter_offer')
}

export const generateMultipleOffersStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'aggressive',
    riskTolerance: 'high',
    timeHorizon: 'immediate',
    relationshipImportance: 'low',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'competitive bidding strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.MARKET_STRATEGIST}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.MULTIPLE_OFFERS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'multiple_offers')
}

export const generateDeadlinePressureStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'moderate',
    riskTolerance: 'medium',
    timeHorizon: 'immediate',
    relationshipImportance: 'medium',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'deadline negotiation strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.PSYCHOLOGY_EXPERT}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.DEADLINE_PRESSURE,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'deadline_pressure')
}

export const generateAppraisalGapStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'conservative',
    riskTolerance: 'low',
    timeHorizon: 'short-term',
    relationshipImportance: 'high',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'appraisal gap strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.STRATEGIC_ADVISOR}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.APPRAISAL_GAP,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'appraisal_gap')
}

export const generateInspectionNegotiationStrategy = async (
  context: NegotiationContext,
  options: NegotiationStrategyOptions = {
    aggressiveness: 'moderate',
    riskTolerance: 'medium',
    timeHorizon: 'short-term',
    relationshipImportance: 'high',
    includeAlternatives: true,
    includeFallbacks: true,
  }
): Promise<NegotiationStrategyResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'inspection negotiation strategy',
    options.jurisdiction
  )}\n\n${NEGOTIATION_STRATEGY_SYSTEM_PROMPTS.STRATEGIC_ADVISOR}`

  const prompt = formatPrompt(
    NEGOTIATION_STRATEGY_PROMPTS.INSPECTION_NEGOTIATIONS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  return parseStrategyResponse(response, 'inspection_negotiations')
}

// ========== HELPER FUNCTIONS ==========

/**
 * Create negotiation context from available data
 */
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
      priorities: clientData.priorities || ['price'],
      constraints: clientData.constraints || [],
      timeline: clientData.timeline || 'flexible',
      budget: clientData.budget,
      motivations: clientData.motivations || [],
      experienceLevel: clientData.experienceLevel || 'first-time',
    },
    opposition: oppositionData || {
      estimatedRole: clientData.role === 'buyer' ? 'seller' : 'buyer',
    },
    property: {
      address: propertyData.address || 'Property Address',
      listPrice: propertyData.listPrice || propertyData.price || 0,
      marketValue: propertyData.marketValue || propertyData.price || 0,
      daysOnMarket: propertyData.daysOnMarket || 0,
      propertyCondition: propertyData.condition || 'good',
      uniqueFeatures: propertyData.features || [],
      issues: propertyData.issues || [],
    },
    marketConditions: {
      trend: marketData.trend || 'warm',
      inventory: marketData.inventory || 'balanced',
      competitionLevel: marketData.competition || 'medium',
      seasonality: marketData.seasonality || 'normal',
      interestRates: marketData.interestRates || 'stable',
    },
    currentOffer: offerData,
    negotiationHistory: historyData,
    agent: agentData || {
      name: 'Agent',
      experience: 'experienced',
      negotiationStyle: 'collaborative',
    },
  }
}

/**
 * Get recommended strategy options based on scenario and client profile
 */
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
  const aggressiveScenarios = [
    'multiple_offers',
    'deadline_pressure',
    'final_push',
  ]
  const conservativeScenarios = ['appraisal_gap', 'inspection_negotiations']

  if (aggressiveScenarios.includes(scenario)) {
    baseOptions.aggressiveness = 'aggressive'
    baseOptions.riskTolerance = 'high'
    baseOptions.timeHorizon = 'immediate'
  } else if (conservativeScenarios.includes(scenario)) {
    baseOptions.aggressiveness = 'conservative'
    baseOptions.riskTolerance = 'low'
    baseOptions.relationshipImportance = 'high'
  }

  // Adjust based on experience
  if (clientExperience === 'first-time') {
    baseOptions.aggressiveness = 'conservative'
    baseOptions.riskTolerance = 'low'
  } else if (clientExperience === 'investor') {
    baseOptions.aggressiveness = 'aggressive'
    baseOptions.riskTolerance = 'high'
    baseOptions.relationshipImportance = 'low'
  }

  // Adjust based on market conditions
  if (marketConditions === 'hot') {
    baseOptions.aggressiveness = 'aggressive'
    baseOptions.riskTolerance = 'high'
    baseOptions.timeHorizon = 'immediate'
  } else if (marketConditions === 'cool') {
    baseOptions.aggressiveness = 'conservative'
    baseOptions.timeHorizon = 'flexible'
  }

  return baseOptions
}

// ========== SERVICE OBJECT ==========

export const NegotiationStrategyService = {
  generateInitialOfferStrategy,
  generateCounterOfferStrategy,
  generateMultipleOffersStrategy,
  generateDeadlinePressureStrategy,
  generateAppraisalGapStrategy,
  generateInspectionNegotiationStrategy,
  createNegotiationContext,
  getRecommendedStrategyOptions,
}

export default NegotiationStrategyService
