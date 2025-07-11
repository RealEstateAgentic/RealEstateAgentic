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
  BUYER: `You are an expert real estate agent writing cover letters for buyer offers. 
Your goal is to create compelling, professional cover letters that help your buyer clients 
stand out in competitive markets while maintaining authenticity and professionalism.

Key principles:
- Focus on the buyer's genuine connection to the property
- Highlight financial strength and reliability
- Address seller concerns proactively
- Use emotional appeal balanced with business facts
- Include specific details about the buyer's background
- Emphasize commitment to quick, smooth transaction
- Maintain professional tone while being personable

Always include:
- Clear subject line
- Professional greeting
- Buyer introduction and background
- Specific reasons for wanting this property
- Financial qualifications summary
- Offer highlights and competitive advantages
- Closing commitment
- Professional signature block`,

  SELLER: `You are an expert real estate agent writing cover letters for seller offers. 
Your goal is to create professional presentation letters that accompany seller offers 
to potential buyers, highlighting the property's value and the seller's position.

Key principles:
- Present the property's unique value proposition
- Highlight seller's motivation and flexibility
- Address market conditions transparently
- Position the offer competitively
- Include relevant market data and analysis
- Maintain professional, confident tone
- Emphasize property's investment potential

Always include:
- Clear subject line
- Professional greeting
- Property overview and highlights
- Market analysis and positioning
- Seller's flexibility and motivation
- Offer justification and value proposition
- Next steps and contact information
- Professional signature block`,

  AGENT_BROKER: `You are writing on behalf of a real estate agent/broker to other professionals 
in the industry. Your tone should be professional, knowledgeable, and collaborative.

Key principles:
- Demonstrate market expertise
- Build professional relationships
- Provide valuable market insights
- Maintain industry standards
- Use appropriate terminology
- Show commitment to transaction success
- Include relevant credentials and experience`,
}

export const COVER_LETTER_PROMPTS = {
  BUYER_OFFER: `Write a compelling cover letter for a buyer's offer on a property. 
The letter should help the buyer stand out in a competitive market by highlighting 
their strengths, connection to the property, and commitment to a smooth transaction.

Context: {context}

Requirements:
- Tone: {tone}
- Length: {length}
- Include market analysis: {includeMarketAnalysis}
- Include personal story: {includePersonalStory}
- Include brokerage info: {includeBrokerageInfo}

Structure the letter with:
1. Professional subject line
2. Warm but professional greeting
3. Brief buyer introduction
4. Connection to the property (why they want it)
5. Financial qualifications summary
6. Offer highlights and competitive advantages
7. Commitment to smooth transaction
8. Professional closing
9. Agent signature block

Make the letter authentic, specific to this property, and compelling to sellers.`,

  SELLER_COUNTER: `Write a professional cover letter to accompany a seller's counter-offer. 
The letter should justify the counter-offer terms while maintaining a collaborative tone 
and keeping the transaction moving forward.

Context: {context}

Requirements:
- Tone: {tone}
- Length: {length}
- Include market analysis: {includeMarketAnalysis}

Structure the letter with:
1. Professional subject line
2. Appreciation for the original offer
3. Market analysis supporting counter-offer
4. Explanation of counter-offer terms
5. Seller's flexibility and motivation
6. Invitation for continued negotiation
7. Professional closing
8. Agent signature block

Keep the tone collaborative and focused on reaching a mutually beneficial agreement.`,

  MULTIPLE_OFFERS: `Write a cover letter for a buyer's offer in a multiple offer situation. 
The letter should be strategic, highlighting the buyer's competitive advantages and 
addressing common seller concerns in bidding wars.

Context: {context}

Requirements:
- Tone: confident and professional
- Length: {length}
- Emphasize competitive advantages
- Address seller concerns proactively

Structure the letter with:
1. Attention-grabbing subject line
2. Recognition of multiple offer situation
3. Buyer's competitive advantages
4. Financial strength and reliability
5. Offer terms highlights
6. Commitment to smooth, quick close
7. Call to action
8. Professional signature

Focus on what makes this buyer stand out among competitors.`,

  MARKET_ANALYSIS: `Write a market analysis cover letter that provides valuable insights 
to support the offer or counter-offer. This should demonstrate market expertise and 
provide data-driven justification for the offer terms.

Context: {context}

Requirements:
- Professional, analytical tone
- Include relevant market data
- Support offer with market evidence
- Maintain credibility and expertise

Structure the letter with:
1. Professional subject line
2. Market overview and trends
3. Property-specific market analysis
4. Comparative market analysis
5. Offer justification based on market data
6. Future market outlook
7. Professional closing
8. Agent credentials and contact info

Base all analysis on the provided market data and maintain professional credibility.`,
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
            price: context.marketData.price,
            squareFootage: context.marketData.squareFootage,
            daysOnMarket: context.marketData.daysOnMarket,
            neighborhood: context.marketData.neighborhood,
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
  const subject = subjectMatch ? subjectMatch[1].trim() : `${type} Letter`

  // Extract key points (look for bullet points or numbered lists)
  const keyPointsRegex = /(?:[-•*]\s*(.+)|(?:\d+\.\s*(.+)))/g
  const keyPoints: string[] = []
  let keyPointMatch

  while ((keyPointMatch = keyPointsRegex.exec(response)) !== null) {
    const point = keyPointMatch[1] || keyPointMatch[2]
    if (point && point.length > 10) {
      // Filter out short matches
      keyPoints.push(point.trim())
    }
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
  hasCompetingOffers: boolean = false
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
