/**
 * LangChain Document Generation Prompt Templates
 *
 * Specialized prompt templates for LangChain document generation agents.
 * Converts existing OpenAI prompts to LangChain format with proper template handling.
 */

import { PromptTemplate } from '@langchain/core/prompts'
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from '@langchain/core/prompts'

// ========== SYSTEM PROMPT TEMPLATES ==========

export const BUYER_LETTER_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are an expert real estate agent writing cover letters for buyer offers. 
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
- Professional signature block

You have access to market data tools, property analysis tools, and document formatting tools.
Use these tools to gather supporting information and enhance your letter's effectiveness.
`)

export const SELLER_LETTER_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are an expert real estate agent writing cover letters for seller offers. 
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
- Professional signature block

You have access to market analysis tools, property valuation tools, and document formatting tools.
Use these tools to gather market data and support your letter's claims.
`)

export const PROFESSIONAL_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are writing on behalf of a real estate agent/broker to other professionals 
in the industry. Your tone should be professional, knowledgeable, and collaborative.

Key principles:
- Demonstrate market expertise
- Build professional relationships
- Provide valuable market insights
- Maintain industry standards
- Use appropriate terminology
- Show commitment to transaction success
- Include relevant credentials and experience

You have access to market data tools, document formatting tools, and validation tools.
Use these tools to ensure accuracy and professionalism in your documents.
`)

export const MEMO_SYSTEM_TEMPLATE = SystemMessagePromptTemplate.fromTemplate(`
You are a real estate expert writing professional memos and explanations for clients.
Your role is to educate clients about real estate processes, market conditions, and transaction details.

Key principles:
- Explain complex concepts in simple terms
- Provide clear, actionable information
- Support explanations with relevant data
- Maintain professional but accessible tone
- Include practical examples and scenarios
- Focus on client education and empowerment
- Address common concerns and questions

Always include:
- Clear subject line and purpose
- Executive summary
- Detailed explanations with examples
- Supporting data and analysis
- Practical recommendations
- Next steps and action items
- Professional closing

You have access to market data tools, calculation tools, and document formatting tools.
Use these tools to provide accurate information and professional presentation.
`)

// ========== DOCUMENT PROMPT TEMPLATES ==========

export const BUYER_OFFER_LETTER_PROMPT = ChatPromptTemplate.fromMessages([
  BUYER_LETTER_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Write a compelling cover letter for a buyer's offer on a property. 
The letter should help the buyer stand out in a competitive market by highlighting 
their strengths, connection to the property, and commitment to a smooth transaction.

Cover Letter Context:
{context}

Letter Requirements:
- Tone: {tone}
- Length: {length}
- Include Market Analysis: {includeMarketAnalysis}
- Include Personal Story: {includePersonalStory}
- Include Brokerage Info: {includeBrokerageInfo}
- Emphasize Strengths: {emphasizeStrengths}

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

Use available tools to gather market data and property analysis to support your letter.
Make the letter authentic, specific to this property, and compelling to sellers.
`),
])

export const SELLER_COUNTER_LETTER_PROMPT = ChatPromptTemplate.fromMessages([
  SELLER_LETTER_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Write a professional cover letter to accompany a seller's counter-offer. 
The letter should justify the counter-offer terms while maintaining a collaborative tone 
and keeping the transaction moving forward.

Cover Letter Context:
{context}

Letter Requirements:
- Tone: {tone}
- Length: {length}
- Include Market Analysis: {includeMarketAnalysis}
- Include Brokerage Info: {includeBrokerageInfo}

Structure the letter with:
1. Professional subject line
2. Appreciation for the original offer
3. Market analysis supporting counter-offer
4. Explanation of counter-offer terms
5. Seller's flexibility and motivation
6. Invitation for continued negotiation
7. Professional closing
8. Agent signature block

Use market data tools to support your counter-offer justification.
Keep the tone collaborative and focused on reaching a mutually beneficial agreement.
`),
])

export const MULTIPLE_OFFERS_LETTER_PROMPT = ChatPromptTemplate.fromMessages([
  BUYER_LETTER_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Write a cover letter for a buyer's offer in a multiple offer situation. 
The letter should be strategic, highlighting the buyer's competitive advantages and 
addressing common seller concerns in bidding wars.

Cover Letter Context:
{context}

Letter Requirements:
- Tone: confident and professional
- Length: {length}
- Emphasize competitive advantages
- Address seller concerns proactively
- Include Market Analysis: {includeMarketAnalysis}
- Include Personal Story: {includePersonalStory}

Structure the letter with:
1. Attention-grabbing subject line
2. Recognition of multiple offer situation
3. Buyer's competitive advantages
4. Financial strength and reliability
5. Offer terms highlights
6. Commitment to smooth, quick close
7. Call to action
8. Professional signature

Use market analysis tools to understand the competitive landscape.
Focus on what makes this buyer stand out among competitors.
`),
])

export const MARKET_ANALYSIS_LETTER_PROMPT = ChatPromptTemplate.fromMessages([
  PROFESSIONAL_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Write a market analysis cover letter that provides valuable insights 
to support the offer or counter-offer. This should demonstrate market expertise and 
provide data-driven justification for the offer terms.

Cover Letter Context:
{context}

Letter Requirements:
- Professional, analytical tone
- Include relevant market data
- Support offer with market evidence
- Maintain credibility and expertise
- Length: {length}

Structure the letter with:
1. Professional subject line
2. Market overview and trends
3. Property-specific market analysis
4. Comparative market analysis
5. Offer justification based on market data
6. Future market outlook
7. Professional closing
8. Agent credentials and contact info

Use market data tools, property valuation tools, and trend analysis tools.
Base all analysis on current market data and maintain professional credibility.
`),
])

export const EXPLANATION_MEMO_PROMPT = ChatPromptTemplate.fromMessages([
  MEMO_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Write a professional explanation memo for a client about a real estate topic or process.
The memo should educate the client and provide clear, actionable information.

Memo Context:
{context}

Memo Requirements:
- Topic: {topic}
- Audience: {audience}
- Detail Level: {detailLevel}
- Include Examples: {includeExamples}
- Include Action Items: {includeActionItems}

Structure the memo with:
1. Clear subject line and purpose
2. Executive summary
3. Background information
4. Detailed explanation with examples
5. Market context and implications
6. Practical recommendations
7. Next steps and action items
8. Contact information for questions

Use available tools to gather supporting data and ensure accuracy.
Focus on client education and empowerment through clear explanations.
`),
])

export const DOCUMENT_SUMMARY_PROMPT = ChatPromptTemplate.fromMessages([
  PROFESSIONAL_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Create a professional summary of a real estate document or transaction component.
The summary should highlight key points and provide clear insights.

Document Context:
{context}

Summary Requirements:
- Document Type: {documentType}
- Audience: {audience}
- Focus Areas: {focusAreas}
- Length: {length}

Structure the summary with:
1. Document title and purpose
2. Key highlights and findings
3. Important terms and conditions
4. Risk factors and considerations
5. Recommendations and next steps
6. Contact information

Use validation tools to ensure accuracy and completeness.
Present information in a clear, professional format.
`),
])

// ========== PROMPT TEMPLATE REGISTRY ==========

export const DOCUMENT_PROMPT_TEMPLATES = {
  BUYER_OFFER_LETTER: BUYER_OFFER_LETTER_PROMPT,
  SELLER_COUNTER_LETTER: SELLER_COUNTER_LETTER_PROMPT,
  MULTIPLE_OFFERS_LETTER: MULTIPLE_OFFERS_LETTER_PROMPT,
  MARKET_ANALYSIS_LETTER: MARKET_ANALYSIS_LETTER_PROMPT,
  EXPLANATION_MEMO: EXPLANATION_MEMO_PROMPT,
  DOCUMENT_SUMMARY: DOCUMENT_SUMMARY_PROMPT,
}

export const DOCUMENT_SYSTEM_TEMPLATES = {
  BUYER_LETTER: BUYER_LETTER_SYSTEM_TEMPLATE,
  SELLER_LETTER: SELLER_LETTER_SYSTEM_TEMPLATE,
  PROFESSIONAL: PROFESSIONAL_SYSTEM_TEMPLATE,
  MEMO: MEMO_SYSTEM_TEMPLATE,
}

// ========== UTILITY FUNCTIONS ==========

export const getDocumentPrompt = (documentType: string) => {
  const typeKey =
    documentType.toUpperCase() as keyof typeof DOCUMENT_PROMPT_TEMPLATES
  return (
    DOCUMENT_PROMPT_TEMPLATES[typeKey] ||
    DOCUMENT_PROMPT_TEMPLATES.BUYER_OFFER_LETTER
  )
}

export const getDocumentSystemTemplate = (type: string) => {
  const typeKey = type.toUpperCase() as keyof typeof DOCUMENT_SYSTEM_TEMPLATES
  return (
    DOCUMENT_SYSTEM_TEMPLATES[typeKey] || DOCUMENT_SYSTEM_TEMPLATES.PROFESSIONAL
  )
}

export const formatCoverLetterContext = (context: any): string => {
  return JSON.stringify(
    {
      offer: context.offer
        ? {
            type: context.offer.type,
            purchasePrice: context.offer.purchasePrice,
            earnestMoney: context.offer.earnestMoney,
            downPayment: context.offer.downPayment,
            closingDate: context.offer.closingDate,
            contingencies: context.offer.contingencies,
            inspections: context.offer.inspections,
          }
        : null,
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

export const formatMemoContext = (context: any): string => {
  return JSON.stringify(
    {
      topic: context.topic,
      audience: context.audience,
      background: context.background,
      keyPoints: context.keyPoints,
      examples: context.examples,
      actionItems: context.actionItems,
      relatedDocuments: context.relatedDocuments,
      marketContext: context.marketContext,
    },
    null,
    2
  )
}

export const formatDocumentOptions = (options: any): string => {
  return JSON.stringify(
    {
      tone: options.tone,
      length: options.length,
      includeMarketAnalysis: options.includeMarketAnalysis,
      includePersonalStory: options.includePersonalStory,
      includeBrokerageInfo: options.includeBrokerageInfo,
      emphasizeStrengths: options.emphasizeStrengths,
      audience: options.audience,
      focusAreas: options.focusAreas,
    },
    null,
    2
  )
}
