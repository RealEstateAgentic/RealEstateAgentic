/**
 * Explanation Memo Generation Prompts and Service
 *
 * Specialized prompts and service for generating educational memos that help
 * clients understand complex real estate terms, market conditions, offer strategies,
 * and negotiation decisions. These memos bridge the gap between professional
 * expertise and client comprehension.
 */

import {
  getOpenAIClient,
  AI_MODELS,
  createRealEstateSystemPrompt,
} from '../client'
import type { Offer } from '../../../shared/types/offers'
import type { Negotiation } from '../../../shared/types/negotiations'
import type { MarketData } from '../../../shared/types/market-data'

// ========== EXPLANATION MEMO TYPES ==========

export interface ExplanationMemoContext {
  topic: ExplanationTopic
  offer?: Offer
  negotiation?: Negotiation
  marketData?: MarketData
  client: {
    name: string
    role: 'buyer' | 'seller'
    experienceLevel: 'first-time' | 'experienced' | 'investor'
    specificConcerns?: string[]
    questionsAsked?: string[]
  }
  agent: {
    name: string
    brokerage?: string
    credentials?: string
  }
  property?: {
    address: string
    price: number
    type: string
    features?: string[]
  }
  customContext?: {
    specificTerms?: string[]
    marketConditions?: 'hot' | 'warm' | 'cool'
    competitionLevel?: 'high' | 'medium' | 'low'
    timeline?: string
    concerns?: string[]
  }
}

export type ExplanationTopic =
  | 'offer_terms'
  | 'market_analysis'
  | 'negotiation_strategy'
  | 'financing_options'
  | 'contingencies'
  | 'inspection_process'
  | 'closing_process'
  | 'pricing_strategy'
  | 'contract_terms'
  | 'market_trends'
  | 'investment_analysis'
  | 'risk_assessment'
  | 'timeline_explanation'
  | 'competitive_positioning'

export interface ExplanationMemoOptions {
  complexity: 'simple' | 'intermediate' | 'detailed'
  tone: 'educational' | 'reassuring' | 'analytical' | 'conversational'
  includeExamples: boolean
  includeActionItems: boolean
  includeQuestions: boolean
  customFocus?: string[]
  jurisdiction?: string
}

export interface ExplanationMemoResult {
  content: string
  title: string
  keyTakeaways: string[]
  actionItems: string[]
  followUpQuestions: string[]
  complexity: string
  readingTime: number
  recommendations: string[]
}

// ========== SYSTEM PROMPTS ==========

export const EXPLANATION_MEMO_SYSTEM_PROMPTS = {
  EDUCATIONAL: `You are an expert real estate educator helping clients understand complex real estate concepts. 
Your goal is to make sophisticated real estate knowledge accessible and actionable for clients at all experience levels.

Key principles:
- Use clear, jargon-free language while maintaining accuracy
- Provide concrete examples and analogies
- Break down complex concepts into digestible parts
- Address common concerns and misconceptions
- Include practical next steps and action items
- Maintain a supportive, confidence-building tone
- Tailor explanations to client experience level

Always include:
- Clear title and overview
- Step-by-step explanations
- Real-world examples
- Key takeaways summary
- Recommended next steps
- Questions to consider`,

  MARKET_FOCUSED: `You are a market analysis expert explaining market conditions and trends to real estate clients.
Your goal is to help clients understand how market factors affect their specific situation and decisions.

Key principles:
- Translate market data into personal impact
- Explain market trends in simple terms
- Connect macro trends to local conditions
- Address timing concerns and opportunities
- Provide actionable market insights
- Use visual analogies and comparisons
- Maintain objectivity while being helpful

Always include:
- Current market overview
- Impact on client's situation
- Timing considerations
- Opportunity analysis
- Risk factors
- Strategic recommendations`,

  STRATEGY_FOCUSED: `You are a negotiation and strategy expert helping clients understand complex deal structures and tactics.
Your goal is to explain the reasoning behind strategic decisions and help clients feel confident in their approach.

Key principles:
- Explain the 'why' behind each strategy
- Present multiple options and trade-offs
- Address potential objections and concerns
- Build confidence through understanding
- Prepare clients for possible outcomes
- Emphasize collaborative decision-making
- Use scenario-based explanations

Always include:
- Strategy overview and rationale
- Potential outcomes and alternatives
- Risk/benefit analysis
- Client role and expectations
- Contingency planning
- Success metrics`,
}

// ========== TOPIC-SPECIFIC PROMPTS ==========

export const EXPLANATION_MEMO_PROMPTS = {
  OFFER_TERMS: `Create an educational memo explaining the key terms and components of a real estate offer. 
Help the client understand what each term means, why it matters, and how it affects their position.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Overview: What is a real estate offer?
2. Key Components: Break down each major term
3. Strategic Implications: Why each term matters
4. Your Specific Offer: How these apply to your situation
5. Next Steps: What to expect and prepare for
6. Q&A: Common questions and answers

Focus on terms like purchase price, earnest money, contingencies, closing date, and financing.
Use specific examples from the client's actual offer when possible.`,

  MARKET_ANALYSIS: `Create an informative memo explaining current market conditions and their impact on the client's real estate decision.
Translate market data into personal, actionable insights.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Market Overview: Current conditions in simple terms
2. Local Impact: How this affects your neighborhood/property type
3. Timing Analysis: Is now a good time for your goals?
4. Competition Level: What to expect from other buyers/sellers
5. Pricing Implications: How market affects values and strategies
6. Opportunity Assessment: Advantages and challenges
7. Strategic Recommendations: How to position yourself

Include relevant statistics but explain what they mean in practical terms.`,

  NEGOTIATION_STRATEGY: `Create a strategic memo explaining the negotiation approach and helping the client understand the reasoning behind tactical decisions.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Negotiation Overview: What we're trying to achieve
2. Our Strategy: Why this approach makes sense
3. Anticipated Responses: What the other party might do
4. Your Role: How you can help and what to expect
5. Flexibility Points: Where we can adjust if needed
6. Success Scenarios: What different outcomes look like
7. Next Steps: Timeline and action items

Explain both offensive and defensive tactics, and prepare client for various scenarios.`,

  FINANCING_OPTIONS: `Create an educational memo explaining financing options and their implications for the real estate transaction.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Financing Basics: Overview of how real estate financing works
2. Available Options: Different loan types and their features
3. Qualification Requirements: What lenders look for
4. Cost Comparison: Interest rates, fees, and total costs
5. Timeline Implications: How financing affects your offer
6. Pre-approval Process: Steps and documentation needed
7. Strategic Considerations: How financing affects negotiation

Make complex financial concepts accessible and relevant to their specific situation.`,

  CONTINGENCIES: `Create an educational memo explaining contingencies in real estate contracts and their strategic importance.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Contingency Basics: What they are and why they exist
2. Common Types: Inspection, financing, appraisal, sale of home
3. Protection vs. Competition: Balancing safety and competitiveness
4. Timeline Management: Key dates and deadlines
5. Waiver Strategies: When and why to consider removing contingencies
6. Your Specific Situation: Which contingencies make sense for you
7. Risk Management: How to protect yourself while staying competitive

Focus on both protection and strategic positioning aspects.`,

  CLOSING_PROCESS: `Create a comprehensive memo explaining the closing process and timeline to help clients prepare and understand expectations.

Context: {context}
Complexity: {complexity}
Tone: {tone}

Structure the memo with:
1. Closing Overview: What happens and why
2. Timeline Breakdown: Week-by-week expectations
3. Key Players: Who's involved and their roles
4. Required Documents: What you'll need to provide
5. Costs and Fees: What to expect financially
6. Final Walk-through: Purpose and what to look for
7. Closing Day: Step-by-step process
8. Post-Closing: What happens after you sign

Reduce anxiety by explaining each step clearly and setting proper expectations.`,
}

// ========== UTILITY FUNCTIONS ==========

const formatContext = (context: ExplanationMemoContext): string => {
  return JSON.stringify(
    {
      topic: context.topic,
      offer: context.offer
        ? {
            type: context.offer.type,
            purchasePrice: context.offer.purchasePrice,
            earnestMoney: context.offer.earnestMoney,
            downPayment: context.offer.downPayment,
            closingDate: context.offer.closingDate,
            contingencies: context.offer.contingencies,
          }
        : null,
      negotiation: context.negotiation
        ? {
            type: context.negotiation.type,
            status: context.negotiation.status,
            currentPhase: (context.negotiation as any).currentPhase,
          }
        : null,
      marketData: context.marketData
        ? {
            averagePrice: (context.marketData as any).averagePrice,
            daysOnMarket: (context.marketData as any).daysOnMarket,
            marketTrend: (context.marketData as any).trend,
          }
        : null,
      client: context.client,
      agent: context.agent,
      property: context.property,
      customContext: context.customContext,
    },
    null,
    2
  )
}

const formatPrompt = (
  template: string,
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions
): string => {
  return template
    .replace('{context}', formatContext(context))
    .replace('{complexity}', options.complexity)
    .replace('{tone}', options.tone)
}

const parseResponse = (
  response: string,
  topic: string
): ExplanationMemoResult => {
  // Extract title (usually the first line or marked with "Title:")
  const titleMatch =
    response.match(/Title:\s*(.+)/i) || response.match(/^(.+)/m)
  const title = titleMatch ? titleMatch[1].trim() : `${topic} Explanation`

  // Extract key takeaways (look for "Key Takeaways", "Summary", or bullet points)
  const takeawaysSection = response.match(
    /Key Takeaways?:?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
  )
  const keyTakeaways: string[] = []

  if (takeawaysSection) {
    const bullets = takeawaysSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      keyTakeaways.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }

  // Extract action items
  const actionSection = response.match(
    /(?:Action Items?|Next Steps?|To Do):?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
  )
  const actionItems: string[] = []

  if (actionSection) {
    const bullets = actionSection[1].match(/[-•*]\s*(.+)/g)
    if (bullets) {
      actionItems.push(
        ...bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim())
      )
    }
  }

  // Extract follow-up questions
  const questionsSection = response.match(
    /(?:Questions?|Q&A|Consider):?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
  )
  const followUpQuestions: string[] = []

  if (questionsSection) {
    const questions = questionsSection[1].match(/[?]\s*(.+)/g)
    if (questions) {
      followUpQuestions.push(...questions.map(q => q.trim()))
    }
  }

  // Estimate reading time (average 200 words per minute)
  const wordCount = response.split(/\s+/).filter(word => word.length > 0).length
  const readingTime = Math.ceil(wordCount / 200)

  // Generate recommendations
  const recommendations: string[] = []

  if (wordCount > 800) {
    recommendations.push(
      'Consider breaking this into smaller sections for easier reading'
    )
  }

  if (keyTakeaways.length === 0) {
    recommendations.push('Add a key takeaways section to summarize main points')
  }

  if (actionItems.length === 0) {
    recommendations.push('Include specific action items or next steps')
  }

  if (!response.toLowerCase().includes('example')) {
    recommendations.push(
      'Consider adding concrete examples to illustrate concepts'
    )
  }

  return {
    content: response,
    title,
    keyTakeaways: keyTakeaways.slice(0, 5),
    actionItems: actionItems.slice(0, 5),
    followUpQuestions: followUpQuestions.slice(0, 5),
    complexity: detectComplexity(response),
    readingTime,
    recommendations,
  }
}

const detectComplexity = (content: string): string => {
  const simpleWords = ['basic', 'simple', 'easy', 'straightforward', 'overview']
  const complexWords = [
    'sophisticated',
    'comprehensive',
    'detailed',
    'analysis',
    'strategy',
  ]
  const technicalWords = [
    'appraisal',
    'contingency',
    'escrow',
    'underwriting',
    'amortization',
  ]

  const lowerContent = content.toLowerCase()

  const simpleCount = simpleWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )
  const complexCount = complexWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )
  const technicalCount = technicalWords.reduce(
    (count, word) =>
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length,
    0
  )

  if (technicalCount > 3 || complexCount > simpleCount) {
    return 'detailed'
  } else if (simpleCount > complexCount) {
    return 'simple'
  } else {
    return 'intermediate'
  }
}

// ========== MAIN FUNCTIONS ==========

export const generateOfferTermsExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'intermediate',
    tone: 'educational',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: true,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'explanation memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.EDUCATIONAL}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.OFFER_TERMS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'offer_terms')
}

export const generateMarketAnalysisExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'intermediate',
    tone: 'analytical',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: false,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'market analysis memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.MARKET_FOCUSED}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.MARKET_ANALYSIS,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseResponse(response, 'market_analysis')
}

export const generateNegotiationStrategyExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'intermediate',
    tone: 'reassuring',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: true,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'strategy explanation memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.STRATEGY_FOCUSED}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.NEGOTIATION_STRATEGY,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'negotiation_strategy')
}

export const generateFinancingOptionsExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'detailed',
    tone: 'educational',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: true,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'financing explanation memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.EDUCATIONAL}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.FINANCING_OPTIONS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'financing_options')
}

export const generateContingenciesExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'intermediate',
    tone: 'educational',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: true,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'contingencies explanation memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.EDUCATIONAL}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.CONTINGENCIES,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'contingencies')
}

export const generateClosingProcessExplanation = async (
  context: ExplanationMemoContext,
  options: ExplanationMemoOptions = {
    complexity: 'detailed',
    tone: 'reassuring',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: false,
  }
): Promise<ExplanationMemoResult> => {
  const client = getOpenAIClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    context.client.role,
    'closing process memo',
    options.jurisdiction
  )}\n\n${EXPLANATION_MEMO_SYSTEM_PROMPTS.EDUCATIONAL}`

  const prompt = formatPrompt(
    EXPLANATION_MEMO_PROMPTS.CLOSING_PROCESS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'closing_process')
}

// ========== HELPER FUNCTIONS ==========

/**
 * Create explanation memo context from available data
 */
export const createExplanationMemoContext = (
  topic: ExplanationTopic,
  clientData: any,
  agentData: any,
  offerData?: Offer,
  negotiationData?: Negotiation,
  marketData?: MarketData,
  propertyData?: any,
  customContext?: any
): ExplanationMemoContext => {
  return {
    topic,
    offer: offerData,
    negotiation: negotiationData,
    marketData,
    client: {
      name: clientData.name || 'Client',
      role: clientData.role || 'buyer',
      experienceLevel: clientData.experienceLevel || 'first-time',
      specificConcerns: clientData.concerns || [],
      questionsAsked: clientData.questions || [],
    },
    agent: {
      name: agentData.name || 'Agent',
      brokerage: agentData.brokerage,
      credentials: agentData.credentials,
    },
    property: propertyData
      ? {
          address: propertyData.address || 'Property Address',
          price: propertyData.price || 0,
          type: propertyData.type || 'residential',
          features: propertyData.features || [],
        }
      : undefined,
    customContext,
  }
}

/**
 * Get recommended options based on client experience and topic complexity
 */
export const getRecommendedMemoOptions = (
  topic: ExplanationTopic,
  clientExperience: 'first-time' | 'experienced' | 'investor'
): ExplanationMemoOptions => {
  const baseOptions: ExplanationMemoOptions = {
    complexity: 'intermediate',
    tone: 'educational',
    includeExamples: true,
    includeActionItems: true,
    includeQuestions: true,
  }

  // Adjust complexity based on experience
  if (clientExperience === 'first-time') {
    baseOptions.complexity = 'simple'
    baseOptions.tone = 'reassuring'
  } else if (clientExperience === 'investor') {
    baseOptions.complexity = 'detailed'
    baseOptions.tone = 'analytical'
  }

  // Adjust based on topic
  const complexTopics = [
    'financing_options',
    'contract_terms',
    'investment_analysis',
  ]
  if (complexTopics.includes(topic)) {
    baseOptions.complexity =
      baseOptions.complexity === 'simple' ? 'intermediate' : 'detailed'
  }

  const analyticalTopics = [
    'market_analysis',
    'pricing_strategy',
    'risk_assessment',
  ]
  if (analyticalTopics.includes(topic)) {
    baseOptions.tone = 'analytical'
    baseOptions.includeQuestions = false
  }

  return baseOptions
}

// ========== SERVICE OBJECT ==========

export const ExplanationMemoService = {
  generateOfferTermsExplanation,
  generateMarketAnalysisExplanation,
  generateNegotiationStrategyExplanation,
  generateFinancingOptionsExplanation,
  generateContingenciesExplanation,
  generateClosingProcessExplanation,
  createExplanationMemoContext,
  getRecommendedMemoOptions,
}

export default ExplanationMemoService
