/**
 * Offer Analysis and Summarization Service
 *
 * Comprehensive service for analyzing real estate offers, generating summaries,
 * comparing multiple offers, and providing strategic insights. Helps agents
 * quickly understand offer strengths, weaknesses, and competitive positioning.
 */

import {
  getOpenAIClient,
  AI_MODELS,
  createRealEstateSystemPrompt,
} from '../client'
import type { Offer } from '../../../shared/types/offers'
import type { MarketData } from '../../../shared/types/market-data'

// ========== ANALYSIS TYPES ==========

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
}

// ========== SYSTEM PROMPTS ==========

export const OFFER_ANALYSIS_SYSTEM_PROMPTS = {
  ANALYTICAL: `You are a seasoned real estate analyst with expertise in offer evaluation and market analysis.
Your role is to provide objective, data-driven analysis of real estate offers with strategic insights.

Key principles:
- Analyze offers objectively using market data and industry standards
- Identify strengths, weaknesses, and opportunities clearly
- Provide actionable insights and recommendations
- Consider multiple perspectives (buyer, seller, market)
- Focus on both financial and strategic implications
- Use clear, professional language with specific details
- Support conclusions with reasoning and evidence

Always include:
- Comprehensive offer breakdown
- Market position analysis
- Risk assessment
- Strategic recommendations
- Competitive comparison when applicable
- Clear action items`,

  COMPETITIVE: `You are a competitive analysis expert specializing in multiple offer situations and market positioning.
Your expertise lies in comparing offers and identifying competitive advantages.

Key principles:
- Compare offers systematically across all dimensions
- Identify differentiating factors beyond price
- Assess competitive positioning and market dynamics
- Understand seller psychology and decision factors
- Provide strategic positioning advice
- Highlight unique value propositions
- Focus on winning strategies

Always include:
- Detailed competitive comparison
- Ranking and positioning analysis
- Strategic differentiation opportunities
- Seller appeal assessment
- Competitive response strategies
- Market dynamic insights`,

  STRATEGIC: `You are a strategic real estate advisor focused on long-term implications and comprehensive deal analysis.
Your role is to provide strategic insights that go beyond immediate transaction details.

Key principles:
- Consider long-term implications and outcomes
- Analyze strategic fit and alignment with goals
- Evaluate risk-reward trade-offs comprehensively
- Provide scenario-based analysis
- Consider market trends and future implications
- Balance aggressive and conservative approaches
- Focus on optimal outcomes

Always include:
- Strategic assessment and fit analysis
- Scenario planning and outcomes
- Long-term value considerations
- Risk-adjusted recommendations
- Market trend implications
- Strategic positioning advice`,
}

// ========== ANALYSIS PROMPTS ==========

export const OFFER_ANALYSIS_PROMPTS = {
  SINGLE_OFFER_REVIEW: `Conduct a comprehensive analysis of this real estate offer, evaluating its strengths, weaknesses, and overall position.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Analyze the offer across these dimensions:
1. Financial Structure: Price, financing, down payment, loan terms
2. Timeline: Closing date, possession, key milestones
3. Terms & Conditions: Contingencies, special clauses, flexibility
4. Market Position: How this offer fits current market conditions
5. Risk Assessment: Potential challenges and mitigation strategies
6. Competitive Analysis: How this offer stands against market norms
7. Strategic Implications: Long-term considerations and outcomes

Provide specific insights, data-driven conclusions, and actionable recommendations.`,

  COMPETITIVE_COMPARISON: `Analyze and compare multiple offers to identify the strongest candidates and competitive positioning.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Compare offers across:
1. Financial Strength: Purchase price, financing quality, cash components
2. Terms Favorability: Timeline, contingencies, seller benefits
3. Execution Risk: Financing probability, buyer qualifications, timeline reliability
4. Strategic Value: Long-term benefits, relationship factors, unique advantages
5. Market Positioning: How each offer fits current conditions and seller needs
6. Competitive Dynamics: Offer interactions and positioning strategies

Rank offers and provide detailed justification for recommended selection.`,

  OFFER_STRENGTH_ASSESSMENT: `Evaluate the overall strength and competitiveness of this offer in the current market context.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Assess offer strength across:
1. Price Competitiveness: Market value alignment and pricing strategy
2. Financial Credibility: Financing strength and buyer qualifications
3. Terms Attractiveness: Seller-friendly terms and flexibility
4. Timeline Alignment: Closing schedule and possession timing
5. Risk Profile: Contingency structure and execution probability
6. Market Fit: Alignment with current market conditions and trends
7. Negotiation Position: Leverage and adjustment potential

Provide an overall strength rating and specific improvement recommendations.`,

  FINANCIAL_ANALYSIS: `Conduct a detailed financial analysis of this offer, focusing on monetary implications and value assessment.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Analyze financial aspects:
1. Price Analysis: Market value comparison and pricing justification
2. Financing Structure: Loan terms, down payment, interest rates
3. Cost Breakdown: All transaction costs and financial implications
4. Cash Flow Impact: Monthly payments and ongoing costs
5. Market Value Assessment: Current and projected property values
6. Investment Return: ROI calculations and value appreciation potential
7. Financial Risk: Loan approval probability and financial stability

Provide comprehensive financial summary and value recommendations.`,

  RISK_ASSESSMENT: `Identify and analyze all potential risks associated with this offer and transaction.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Evaluate risks across:
1. Financing Risks: Loan approval, interest rate, qualification issues
2. Market Risks: Value fluctuation, market condition changes
3. Property Risks: Condition, inspection, appraisal concerns
4. Timeline Risks: Closing delays, coordination challenges
5. Legal Risks: Contract terms, compliance, documentation
6. Competitive Risks: Multiple offers, bidding war dynamics
7. Economic Risks: Market shifts, economic factors, external influences

Provide risk ratings, mitigation strategies, and decision frameworks.`,

  CLIENT_PRESENTATION: `Create a client-focused summary that explains this offer analysis in clear, understandable terms.

Context: {context}
Perspective: {perspective}
Depth: {depth}

Structure the presentation:
1. Executive Summary: Key findings and recommendations in simple terms
2. Offer Highlights: Main strengths and attractive features
3. Areas of Concern: Potential issues and their significance
4. Market Context: How this offer fits current market conditions
5. Financial Implications: What this means financially for the client
6. Next Steps: Recommended actions and decision points
7. Q&A Preparation: Anticipated client questions and answers

Use clear, jargon-free language appropriate for client communication.`,
}

// ========== UTILITY FUNCTIONS ==========

const formatAnalysisContext = (context: OfferAnalysisContext): string => {
  return JSON.stringify(
    {
      primaryOffer: {
        type: context.primaryOffer.type,
        purchasePrice: context.primaryOffer.purchasePrice,
        earnestMoney: context.primaryOffer.earnestMoney,
        downPayment: context.primaryOffer.downPayment,
        loanAmount: context.primaryOffer.loanAmount,
        closingDate: context.primaryOffer.closingDate,
        contingencies: context.primaryOffer.contingencies,
        status: context.primaryOffer.status,
      },
      competingOffers: context.competingOffers?.map(offer => ({
        type: offer.type,
        purchasePrice: offer.purchasePrice,
        earnestMoney: offer.earnestMoney,
        downPayment: offer.downPayment,
        closingDate: offer.closingDate,
        contingencies: offer.contingencies,
      })),
      property: context.property,
      seller: context.seller,
      market: context.market,
      analysisType: context.analysisType,
      marketData: context.marketData
        ? {
            averagePrice: (context.marketData as any).averagePrice,
            daysOnMarket: (context.marketData as any).daysOnMarket,
            trend: (context.marketData as any).trend,
          }
        : null,
    },
    null,
    2
  )
}

const formatAnalysisPrompt = (
  template: string,
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions
): string => {
  return template
    .replace('{context}', formatAnalysisContext(context))
    .replace('{perspective}', options.perspective)
    .replace('{depth}', options.depth)
}

const parseAnalysisResponse = (
  response: string,
  analysisType: string
): OfferAnalysisResult => {
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

  // Determine risk level
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

  const riskLevel =
    highRiskCount > lowRiskCount
      ? 'high'
      : lowRiskCount > highRiskCount
        ? 'low'
        : 'medium'

  // Extract price analysis
  const priceMatch = response.match(/(?:Price|Pricing):?\s*(.*?)(?:\n|$)/i)
  const priceAnalysis = priceMatch
    ? priceMatch[1].trim()
    : 'Competitive pricing analysis'

  // Extract financing strength
  const financingMatch = response.match(
    /(?:Financing|Financial):?\s*(strong|moderate|weak)/i
  )
  const financingStrength = financingMatch
    ? (financingMatch[1].toLowerCase() as 'strong' | 'moderate' | 'weak')
    : 'moderate'

  // Extract competitive position
  const competitiveMatch = response.match(
    /(?:Competitive|Position|Ranking):?\s*(leading|competitive|trailing|strong|weak)/i
  )
  let competitivePosition: 'leading' | 'competitive' | 'trailing' =
    'competitive'
  if (competitiveMatch) {
    const pos = competitiveMatch[1].toLowerCase()
    if (pos.includes('lead') || pos === 'strong')
      competitivePosition = 'leading'
    else if (pos.includes('trail') || pos === 'weak')
      competitivePosition = 'trailing'
  }

  // Extract main recommendation
  const mainRecommendationMatch = response.match(
    /(?:Recommendation|Recommend):?\s*(.*?)(?:\n|\.)/i
  )
  const mainRecommendation = mainRecommendationMatch
    ? mainRecommendationMatch[1].trim()
    : 'Proceed with standard negotiation approach'

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
      cashFlow: extractFinancialDetail(response, 'cash flow'),
      totalCost: extractFinancialDetail(response, 'total cost'),
      marketValueComparison: extractFinancialDetail(response, 'market value'),
    },
    terms: {
      timeline: extractTermDetail(response, 'timeline'),
      contingencies: extractContingencies(response),
      flexibilityLevel: extractFlexibilityLevel(response),
      unusualTerms: extractUnusualTerms(response),
      standardCompliance: determineStandardCompliance(response),
    },
    risks: {
      level: riskLevel as 'low' | 'medium' | 'high',
      factors: riskFactors.slice(0, 5),
      mitigationStrategies: extractMitigationStrategies(response),
      dealBreakers: extractDealBreakers(response),
    },
    recommendations: {
      immediate: recommendations.slice(0, 3),
      strategic: extractStrategicRecommendations(response),
      negotiation: extractNegotiationRecommendations(response),
      fallback: extractFallbackOptions(response),
    },
    insights: extractInsights(response),
  }
}

// Helper functions for parsing specific sections
const extractFinancialDetail = (content: string, type: string): string => {
  const regex = new RegExp(`${type}:?\\s*(.*?)(?:\\n|$)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : `${type} analysis pending`
}

const extractTermDetail = (content: string, type: string): string => {
  const regex = new RegExp(`${type}:?\\s*(.*?)(?:\\n|$)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : `${type} details`
}

const extractContingencies = (content: string): string[] => {
  const contingencySection = content.match(
    /(?:Contingenc|Conditions?):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const contingencies: string[] = []
  if (contingencySection) {
    const bullets = contingencySection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      contingencies.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return contingencies.slice(0, 4)
}

const extractFlexibilityLevel = (
  content: string
): 'high' | 'medium' | 'low' => {
  const flexWords = {
    high: ['flexible', 'accommodating', 'adaptable'],
    low: ['rigid', 'inflexible', 'strict', 'firm'],
  }

  const lowerContent = content.toLowerCase()
  const highCount = flexWords.high.reduce(
    (count, word) => count + (lowerContent.includes(word) ? 1 : 0),
    0
  )
  const lowCount = flexWords.low.reduce(
    (count, word) => count + (lowerContent.includes(word) ? 1 : 0),
    0
  )

  if (highCount > lowCount) return 'high'
  if (lowCount > highCount) return 'low'
  return 'medium'
}

const extractUnusualTerms = (content: string): string[] => {
  const unusualSection = content.match(
    /(?:Unusual|Non-standard|Special):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const terms: string[] = []
  if (unusualSection) {
    const bullets = unusualSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      terms.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return terms.slice(0, 3)
}

const determineStandardCompliance = (
  content: string
): 'compliant' | 'non-standard' | 'problematic' => {
  const lowerContent = content.toLowerCase()
  if (
    lowerContent.includes('problematic') ||
    lowerContent.includes('concerning')
  )
    return 'problematic'
  if (lowerContent.includes('non-standard') || lowerContent.includes('unusual'))
    return 'non-standard'
  return 'compliant'
}

const extractMitigationStrategies = (content: string): string[] => {
  const mitigationSection = content.match(
    /(?:Mitigation|Strategies|Address):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const strategies: string[] = []
  if (mitigationSection) {
    const bullets = mitigationSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      strategies.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return strategies.slice(0, 3)
}

const extractDealBreakers = (content: string): string[] => {
  const dealBreakerSection = content.match(
    /(?:Deal.?breaker|Fatal|Critical):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const dealBreakers: string[] = []
  if (dealBreakerSection) {
    const bullets = dealBreakerSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      dealBreakers.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return dealBreakers.slice(0, 3)
}

const extractStrategicRecommendations = (content: string): string[] => {
  const strategicSection = content.match(
    /(?:Strategic|Long.?term):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const recommendations: string[] = []
  if (strategicSection) {
    const bullets = strategicSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      recommendations.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return recommendations.slice(0, 3)
}

const extractNegotiationRecommendations = (content: string): string[] => {
  const negotiationSection = content.match(
    /(?:Negotiation|Negotiate):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const recommendations: string[] = []
  if (negotiationSection) {
    const bullets = negotiationSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      recommendations.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return recommendations.slice(0, 3)
}

const extractFallbackOptions = (content: string): string[] => {
  const fallbackSection = content.match(
    /(?:Fallback|Alternative|Backup):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const options: string[] = []
  if (fallbackSection) {
    const bullets = fallbackSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      options.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }
  return options.slice(0, 3)
}

const extractInsights = (content: string): string[] => {
  const insightSection = content.match(
    /(?:Insight|Key point|Notable):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
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
  return insights.slice(0, 4)
}

// ========== MAIN ANALYSIS FUNCTIONS ==========

export const analyzeSingleOffer = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'neutral',
    depth: 'detailed',
    includeRecommendations: true,
    includeRisks: true,
    includeComparisons: false,
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'offer analysis',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.ANALYTICAL}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.SINGLE_OFFER_REVIEW,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseAnalysisResponse(response, 'single_offer_review')
}

export const compareMultipleOffers = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'seller',
    depth: 'comprehensive',
    includeRecommendations: true,
    includeRisks: true,
    includeComparisons: true,
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'competitive offer analysis',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.COMPETITIVE}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.COMPETITIVE_COMPARISON,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.COMPLEX_REASONING,
    { systemPrompt }
  )

  const result = parseAnalysisResponse(response, 'competitive_comparison')

  // Add comparison-specific data
  result.comparison = {
    ranking: extractRanking(response),
    totalOffers: context.competingOffers
      ? context.competingOffers.length + 1
      : 1,
    advantages: result.summary.keyStrengths,
    disadvantages: result.summary.keyWeaknesses,
    competitiveGaps: extractCompetitiveGaps(response),
  }

  return result
}

export const assessOfferStrength = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'neutral',
    depth: 'detailed',
    includeRecommendations: true,
    includeRisks: false,
    includeComparisons: false,
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'offer strength assessment',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.STRATEGIC}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.OFFER_STRENGTH_ASSESSMENT,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseAnalysisResponse(response, 'offer_strength_assessment')
}

export const analyzeFinancials = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'neutral',
    depth: 'comprehensive',
    includeRecommendations: true,
    includeRisks: true,
    includeComparisons: false,
    focusAreas: ['price', 'financing'],
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'financial analysis',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.ANALYTICAL}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.FINANCIAL_ANALYSIS,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseAnalysisResponse(response, 'financial_analysis')
}

export const assessRisks = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'neutral',
    depth: 'comprehensive',
    includeRecommendations: true,
    includeRisks: true,
    includeComparisons: false,
    focusAreas: ['risks'],
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'risk assessment',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.STRATEGIC}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.RISK_ASSESSMENT,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseAnalysisResponse(response, 'risk_assessment')
}

export const generateClientSummary = async (
  context: OfferAnalysisContext,
  options: OfferAnalysisOptions = {
    perspective: 'agent',
    depth: 'summary',
    includeRecommendations: true,
    includeRisks: false,
    includeComparisons: false,
  }
): Promise<OfferAnalysisResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'client presentation',
    options.jurisdiction
  )}\n\n${OFFER_ANALYSIS_SYSTEM_PROMPTS.ANALYTICAL}`

  const prompt = formatAnalysisPrompt(
    OFFER_ANALYSIS_PROMPTS.CLIENT_PRESENTATION,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseAnalysisResponse(response, 'client_presentation')
}

// ========== HELPER FUNCTIONS ==========

const extractRanking = (content: string): number => {
  const rankingMatch = content.match(/(?:rank|position):?\s*(\d+)/i)
  return rankingMatch ? Number.parseInt(rankingMatch[1], 10) : 1
}

const extractCompetitiveGaps = (content: string): string[] => {
  const gapsSection = content.match(
    /(?:Gap|Gaps|Behind):?\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
  )
  const gaps: string[] = []
  if (gapsSection) {
    const bullets = gapsSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      gaps.push(...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()))
    }
  }
  return gaps.slice(0, 3)
}

/**
 * Create offer analysis context from available data
 */
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
      address: propertyData.address || 'Property Address',
      listPrice: propertyData.listPrice || propertyData.price || 0,
      estimatedValue: propertyData.estimatedValue,
      daysOnMarket: propertyData.daysOnMarket || 0,
      propertyType: propertyData.type || 'residential',
      condition: propertyData.condition || 'good',
      features: propertyData.features || [],
      issues: propertyData.issues || [],
    },
    seller: sellerData,
    market: {
      trend: marketData.trend || 'warm',
      inventory: marketData.inventory || 'balanced',
      competitionLevel: marketData.competition || 'medium',
      averageDaysOnMarket: marketData.averageDaysOnMarket || 30,
      averagePricePerSqFt: marketData.averagePricePerSqFt,
    },
    analysisType,
  }
}

/**
 * Get recommended analysis options based on context
 */
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
      baseOptions.depth = 'comprehensive'
      baseOptions.includeComparisons = true
      baseOptions.perspective = 'seller'
      break
    case 'client_presentation':
      baseOptions.depth = 'summary'
      baseOptions.perspective = 'agent'
      baseOptions.includeRisks = false
      break
    case 'financial_analysis':
      baseOptions.focusAreas = ['price', 'financing']
      baseOptions.depth = 'comprehensive'
      break
    case 'risk_assessment':
      baseOptions.focusAreas = ['risks']
      baseOptions.includeRisks = true
      break
  }

  // Adjust based on user role
  if (userRole === 'seller') {
    baseOptions.perspective = 'seller'
  } else if (userRole === 'buyer') {
    baseOptions.perspective = 'buyer'
  }

  return baseOptions
}

// ========== SERVICE OBJECT ==========

export const OfferAnalysisService = {
  analyzeSingleOffer,
  compareMultipleOffers,
  assessOfferStrength,
  analyzeFinancials,
  assessRisks,
  generateClientSummary,
  createOfferAnalysisContext,
  getRecommendedAnalysisOptions,
}

export default OfferAnalysisService
