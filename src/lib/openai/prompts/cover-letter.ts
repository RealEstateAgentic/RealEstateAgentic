/**
 * Cover Letter Generation Prompts and Service
 *
 * Specialized prompts and service for generating professional cover letters
 * for real estate offers. Includes different templates for buyer and seller
 * offer letters with market analysis and strategic positioning.
 */

import {
  getGroqClient,
  AI_MODELS,
  createRealEstateSystemPrompt,
} from '../../groq/client'
import type { Offer } from '../../../shared/types/offers'
import type { MarketData } from '../../../shared/types/market-data'
import type { UserProfile } from '../../../shared/types'

// ========== COVER LETTER TYPES ==========

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

export interface CoverLetterOptions {
  tone: 'professional' | 'warm' | 'confident' | 'personal'
  length: 'brief' | 'standard' | 'detailed'
  includeMarketAnalysis: boolean
  includePersonalStory: boolean
  includeBrokerageInfo: boolean
  emphasizeStrengths: boolean
  jurisdiction?: string
}

export interface CoverLetterResult {
  content: string
  subject: string
  keyPoints: string[]
  tone: string
  wordCount: number
  recommendations: string[]
}

// ========== PROMPT TEMPLATES ==========

export const COVER_LETTER_SYSTEM_PROMPTS = {
  BUYER: `You are a skilled real estate agent writing cover letters for your buyer clients. 
Think of yourself as writing a friendly but professional letter that helps your buyers make a personal connection with sellers while showcasing their strengths.

Your approach should be:
- Warm and genuine - like talking to a neighbor over coffee
- Personal and relatable - focus on the buyer's real story
- Confident but not pushy - highlight strengths naturally
- Conversational yet professional - avoid stuffy real estate jargon
- Specific to this property - mention what they actually love about it
- Reassuring about the process - address seller concerns casually

Write like you're introducing your buyer to the seller in person:
- Start with a friendly greeting
- Share who your buyer is as a person (not just their finances)
- Explain why this specific home speaks to them
- Mention their qualifications without being overly formal
- Show they're serious and ready to move forward
- End with warmth and next steps
- Keep your agent signature professional but approachable

Remember: Sellers are people too. They want to know their home is going to someone who will love it as much as they have.`,

  SELLER: `You are a seasoned real estate agent writing on behalf of your seller clients. 
Your job is to present the property and your seller's position in a way that feels authentic and reasonable - like a thoughtful conversation between professionals.

Your tone should be:
- Straightforward and honest - no overselling or fluff
- Confident in the property's value - but not arrogant
- Understanding of market realities - acknowledge what buyers care about
- Collaborative rather than confrontational - we're all working toward the same goal
- Transparent about the seller's situation - appropriate level of disclosure
- Professional but personable - like talking to a colleague

Present the information like you're having a productive conversation:
- Open with appreciation for their interest
- Share what makes this property special (real reasons, not generic features)
- Explain the market context in plain terms
- Address any concerns proactively
- Show your seller's flexibility where appropriate
- Keep negotiations collaborative
- End with clear next steps and open communication

Remember: Every transaction works best when everyone feels heard and respected.`,

  AGENT_BROKER: `You are communicating with other real estate professionals - agents, brokers, and industry colleagues. 
Your tone should be professional but conversational, like talking to someone you respect in the industry.

Keep it real and direct:
- Skip the sales speak - we all know how this works
- Share relevant market insights and data
- Be transparent about challenges and opportunities
- Focus on getting the deal done for everyone
- Use industry knowledge appropriately - but explain when needed
- Show your experience without being condescending
- Keep communication efficient and useful

Write like you're talking to a colleague you trust:
- Direct but respectful communication
- Share relevant experience and insights
- Address concerns openly
- Focus on solutions and next steps
- Maintain professional credibility
- Keep the big picture in mind

Remember: We're all trying to serve our clients well and get good deals done.`,
}

export const COVER_LETTER_PROMPTS = {
  BUYER_OFFER: `Write a warm, genuine cover letter for a buyer's offer that feels like a personal introduction rather than a sales pitch. 
The goal is to help the sellers connect with your buyer as a real person who would love and care for their home.

Context: {context}

Tone and style:
- Tone: {tone}
- Length: {length}
- Include market analysis: {includeMarketAnalysis}
- Include personal story: {includePersonalStory}
- Include brokerage info: {includeBrokerageInfo}

Write the letter like you're introducing your buyer to the seller in person:
1. Start with a warm, friendly greeting
2. Introduce your buyer as a person (not just a qualified purchaser)
3. Share what they genuinely love about this specific property
4. Mention their qualifications naturally - no need to oversell
5. Highlight what makes them a great fit for this home
6. Show they're serious and ready to move smoothly through the process
7. End with genuine enthusiasm and clear next steps
8. Professional but friendly agent signature

Make it feel authentic and specific to this property and buyer. Avoid generic real estate language - write like you're having a conversation.`,

  SELLER_COUNTER: `Write a thoughtful response to accompany your seller's counter-offer. 
The goal is to keep the conversation moving forward while explaining your seller's position in a way that feels reasonable and collaborative.

Context: {context}

Approach:
- Tone: {tone}
- Length: {length}
- Include market analysis: {includeMarketAnalysis}

Structure it like a productive conversation:
1. Start by thanking them for their offer - it shows genuine interest
2. Explain the market context in simple, clear terms
3. Share the reasoning behind the counter-offer (without being defensive)
4. Highlight where your seller is being flexible
5. Address any concerns you anticipate
6. Keep the focus on finding a solution that works for everyone
7. End with openness to continued discussion
8. Professional but approachable agent signature

Keep it collaborative - we're all trying to get to a win-win here.`,

  MULTIPLE_OFFERS: `Write a cover letter that helps your buyer stand out in a competitive situation. 
The key is to be confident without being aggressive, and to highlight genuine advantages rather than just trying to outbid everyone.

Context: {context}

Focus on:
- Tone: confident but respectful
- Length: {length}
- What makes this buyer genuinely special
- Why they're the right choice for this home

Make your case like you're recommending a friend:
1. Acknowledge the competitive situation with respect
2. Share what makes your buyer special as a person
3. Highlight their genuine financial strength and reliability
4. Explain why they're the right fit for this specific home
5. Show they're committed to a smooth, efficient process
6. Address common seller concerns proactively
7. End with confidence and a clear call to action
8. Professional signature that shows you're experienced

Focus on substance over flash - what really matters to sellers in this situation.`,

  MARKET_ANALYSIS: `Write a market analysis that provides valuable insights to support your offer or counter-offer. 
Present the data in a way that's informative and credible without being overly technical or dry.

Context: {context}

Present it like you're sharing insights with a colleague:
- Professional but conversational tone
- Clear explanation of relevant market data
- Honest assessment of market conditions
- Data-driven support for your position
- Length: {length}

Structure it as a helpful briefing:
1. Open with a clear market overview
2. Share the most relevant trends and data
3. Explain what this means for this specific property
4. Compare to similar properties and sales
5. Connect the market data to your offer/counter-offer
6. Share your professional outlook
7. End with your credentials and contact information

Make the data meaningful and actionable, not just impressive.`,
}

// ========== UTILITY FUNCTIONS ==========

const formatContext = (context: CoverLetterContext): string => {
  return JSON.stringify(
    {
      offer: {
        type: context.offer.type,
        purchasePrice: context.offer.purchasePrice,
        earnestMoney: context.offer.earnestMoney,
        downPayment: context.offer.downPayment,
        closingDate: context.offer.closingDate,
        contingencies: context.offer.contingencies,
        inspections: (context.offer as any).inspections,
      },
      property: context.property,
      client: context.client,
      agent: context.agent,
      marketData: context.marketData
        ? {
            medianPrice: context.marketData.medianPrice,
            averagePrice: context.marketData.averagePrice,
            averageDaysOnMarket: context.marketData.averageDaysOnMarket,
            area: context.marketData.area,
            marketType: context.marketData.marketType,
            marketTrend: context.marketData.marketTrend,
          }
        : null,
      competitiveAnalysis: context.competitiveAnalysis,
      specialCircumstances: context.specialCircumstances,
    },
    null,
    2
  )
}

const formatPrompt = (
  template: string,
  context: CoverLetterContext,
  options: CoverLetterOptions
): string => {
  return template
    .replace('{context}', formatContext(context))
    .replace('{tone}', options.tone)
    .replace('{length}', options.length)
    .replace(
      '{includeMarketAnalysis}',
      options.includeMarketAnalysis.toString()
    )
    .replace('{includePersonalStory}', options.includePersonalStory.toString())
    .replace('{includeBrokerageInfo}', options.includeBrokerageInfo.toString())
}

const parseResponse = (response: string, type: string): CoverLetterResult => {
  // Extract subject line (usually the first line or marked with "Subject:")
  const subjectMatch =
    response.match(/Subject:\s*(.+)/i) ||
    response.match(/Re:\s*(.+)/i) ||
    response.match(/^(.+)/m)

  let subject = subjectMatch ? subjectMatch[1].trim() : `${type} Letter`

  // Clean up the subject line to remove extra descriptions and markdown
  subject = subject
    .replace(/^(Subject|Title|Re):\s*/i, '') // Only remove specific prefixes
    .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold formatting
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/\s*-\s*.+$/, '') // Remove everything after first dash (extra descriptions)
    .replace(/:\s*.+$/, '') // Remove everything after colon (explanatory text)
    .replace(/\.$/, '') // Remove trailing period
    .trim()

  // Keep only first 2-3 words
  const words = subject.split(/\s+/)
  if (words.length > 3) {
    subject = words.slice(0, 3).join(' ')
  }

  // Ensure it's not too long
  if (subject.length > 30) {
    subject = `${subject.substring(0, 27)}...`
  }

  // Extract key points (look for bullet points or numbered lists)
  const keyPointsRegex = /(?:[-•*]\s*(.+)|(?:\d+\.\s*(.+)))/g
  const keyPoints: string[] = []
  let keyPointMatch: RegExpExecArray | null = keyPointsRegex.exec(response)

  while (keyPointMatch !== null) {
    const point = keyPointMatch[1] || keyPointMatch[2]
    if (point && point.length > 10) {
      // Filter out short matches
      keyPoints.push(point.trim())
    }
    keyPointMatch = keyPointsRegex.exec(response)
  }

  // Count words
  const wordCount = response.split(/\s+/).filter(word => word.length > 0).length

  // Generate recommendations based on the content
  const recommendations: string[] = []

  if (wordCount > 500) {
    recommendations.push('Consider shortening the letter for better impact')
  }

  if (wordCount < 200) {
    recommendations.push(
      'Consider adding more specific details about the buyer/seller'
    )
  }

  if (!response.includes('$')) {
    recommendations.push('Consider including specific financial details')
  }

  if (!response.includes('close') && !response.includes('closing')) {
    recommendations.push('Consider emphasizing commitment to closing timeline')
  }

  return {
    content: response,
    subject,
    keyPoints: keyPoints.slice(0, 5), // Limit to top 5 key points
    tone: detectTone(response),
    wordCount,
    recommendations,
  }
}

const detectTone = (content: string): string => {
  const warmWords = ['excited', 'love', 'dream', 'family', 'home', 'wonderful']
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

  if (warmCount > professionalCount && warmCount > confidentCount) {
    return 'warm'
  } else if (confidentCount > professionalCount) {
    return 'confident'
  } else {
    return 'professional'
  }
}

// ========== MAIN FUNCTIONS ==========

export const generateBuyerOfferLetter = async (
  context: CoverLetterContext,
  options: CoverLetterOptions = {
    tone: 'warm',
    length: 'standard',
    includeMarketAnalysis: true,
    includePersonalStory: true,
    includeBrokerageInfo: true,
    emphasizeStrengths: true,
  }
): Promise<CoverLetterResult> => {
  const client = getGroqClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'buyer',
    'cover letter',
    options.jurisdiction
  )}\n\n${COVER_LETTER_SYSTEM_PROMPTS.BUYER}`

  const prompt = formatPrompt(
    COVER_LETTER_PROMPTS.BUYER_OFFER,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'buyer_offer')
}

export const generateSellerCounterLetter = async (
  context: CoverLetterContext,
  options: CoverLetterOptions = {
    tone: 'professional',
    length: 'standard',
    includeMarketAnalysis: true,
    includePersonalStory: false,
    includeBrokerageInfo: true,
    emphasizeStrengths: false,
  }
): Promise<CoverLetterResult> => {
  const client = getGroqClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'seller',
    'cover letter',
    options.jurisdiction
  )}\n\n${COVER_LETTER_SYSTEM_PROMPTS.SELLER}`

  const prompt = formatPrompt(
    COVER_LETTER_PROMPTS.SELLER_COUNTER,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'seller_counter')
}

export const generateMultipleOfferLetter = async (
  context: CoverLetterContext,
  options: CoverLetterOptions = {
    tone: 'confident',
    length: 'standard',
    includeMarketAnalysis: true,
    includePersonalStory: true,
    includeBrokerageInfo: true,
    emphasizeStrengths: true,
  }
): Promise<CoverLetterResult> => {
  const client = getGroqClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'buyer',
    'competitive offer letter',
    options.jurisdiction
  )}\n\n${COVER_LETTER_SYSTEM_PROMPTS.BUYER}`

  const prompt = formatPrompt(
    COVER_LETTER_PROMPTS.MULTIPLE_OFFERS,
    context,
    options
  )

  const response = await client.generateText(
    prompt,
    AI_MODELS.DOCUMENT_GENERATION,
    { systemPrompt }
  )

  return parseResponse(response, 'multiple_offers')
}

export const generateMarketAnalysisLetter = async (
  context: CoverLetterContext,
  options: CoverLetterOptions = {
    tone: 'professional',
    length: 'detailed',
    includeMarketAnalysis: true,
    includePersonalStory: false,
    includeBrokerageInfo: true,
    emphasizeStrengths: false,
  }
): Promise<CoverLetterResult> => {
  const client = getGroqClient()

  const systemPrompt = `${createRealEstateSystemPrompt(
    'agent',
    'market analysis letter',
    options.jurisdiction
  )}\n\n${COVER_LETTER_SYSTEM_PROMPTS.AGENT_BROKER}`

  const prompt = formatPrompt(
    COVER_LETTER_PROMPTS.MARKET_ANALYSIS,
    context,
    options
  )

  const response = await client.generateText(prompt, AI_MODELS.ANALYSIS, {
    systemPrompt,
  })

  return parseResponse(response, 'market_analysis')
}

// ========== HELPER FUNCTIONS ==========

/**
 * Create a basic cover letter context from offer data
 */
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
      address: propertyData.address || 'Property Address',
      price: propertyData.price || offer.purchasePrice,
      description: propertyData.description,
      features: propertyData.features || [],
      neighborhood: propertyData.neighborhood,
      schools: propertyData.schools || [],
      commute: propertyData.commute,
    },
    client: {
      name: clientData.name || 'Client Name',
      background: clientData.background,
      motivation: clientData.motivation,
      timeline: clientData.timeline,
      preApprovalAmount: clientData.preApprovalAmount,
      cashBuyer: clientData.cashBuyer || false,
      firstTimeHomeBuyer: clientData.firstTimeHomeBuyer || false,
      localConnection: clientData.localConnection,
      personalStory: clientData.personalStory,
    },
    agent: {
      name: agentData.name || 'Agent Name',
      brokerage: agentData.brokerage,
      experience: agentData.experience,
      credentials: agentData.credentials,
      phoneNumber: agentData.phoneNumber,
      email: agentData.email,
    },
    marketData,
  }
}

/**
 * Get recommended cover letter options based on offer type and market conditions
 */
export const getRecommendedOptions = (
  offerType: 'buyer' | 'seller',
  marketConditions: 'hot' | 'warm' | 'cool',
  hasCompetingOffers = false
): CoverLetterOptions => {
  const baseOptions: CoverLetterOptions = {
    tone: 'professional',
    length: 'standard',
    includeMarketAnalysis: true,
    includePersonalStory: false,
    includeBrokerageInfo: true,
    emphasizeStrengths: false,
  }

  // Adjust based on offer type
  if (offerType === 'buyer') {
    baseOptions.tone = 'warm'
    baseOptions.includePersonalStory = true
    baseOptions.emphasizeStrengths = true
  }

  // Adjust based on market conditions
  if (marketConditions === 'hot' || hasCompetingOffers) {
    baseOptions.tone = 'confident'
    baseOptions.emphasizeStrengths = true
    baseOptions.includeMarketAnalysis = true
  }

  if (marketConditions === 'cool') {
    baseOptions.length = 'detailed'
    baseOptions.includeMarketAnalysis = true
  }

  return baseOptions
}

// ========== SERVICE OBJECT ==========

export const CoverLetterService = {
  generateBuyerOfferLetter,
  generateSellerCounterLetter,
  generateMultipleOfferLetter,
  generateMarketAnalysisLetter,
  createCoverLetterContext,
  getRecommendedOptions,
}

export default CoverLetterService
