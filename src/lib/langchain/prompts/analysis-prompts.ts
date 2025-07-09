/**
 * LangChain Offer Analysis Prompt Templates
 *
 * Specialized prompt templates for LangChain offer analysis agents.
 * Converts existing OpenAI prompts to LangChain format with proper template handling.
 */

import { PromptTemplate } from '@langchain/core/prompts'
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from '@langchain/core/prompts'

// ========== SYSTEM PROMPT TEMPLATES ==========

export const ANALYTICAL_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a seasoned real estate analyst with expertise in offer evaluation and market analysis.
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
- Clear action items

You have access to real estate tools for market data, property analysis, and financial calculations.
Use these tools to gather information and support your analysis with concrete data.
`)

export const COMPETITIVE_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a competitive analysis expert specializing in multiple offer situations and market positioning.
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
- Market dynamic insights

You have access to market analysis tools, property valuation tools, and offer comparison utilities.
Use these tools to perform comprehensive competitive analysis.
`)

export const STRATEGIC_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a strategic real estate advisor focused on long-term implications and comprehensive deal analysis.
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
- Strategic positioning advice

You have access to investment analysis tools, market trend tools, and property valuation systems.
Use these tools to provide comprehensive strategic analysis.
`)

// ========== ANALYSIS PROMPT TEMPLATES ==========

export const SINGLE_OFFER_REVIEW_PROMPT = ChatPromptTemplate.fromMessages([
  ANALYTICAL_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Conduct a comprehensive analysis of this real estate offer, evaluating its strengths, weaknesses, and overall position.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}
- Include Risks: {includeRisks}

Analyze the offer across these dimensions:
1. Financial Structure: Price, financing, down payment, loan terms
2. Timeline: Closing date, possession, key milestones
3. Terms & Conditions: Contingencies, special clauses, flexibility
4. Market Position: How this offer fits current market conditions
5. Risk Assessment: Potential challenges and mitigation strategies
6. Competitive Analysis: How this offer stands against market norms
7. Strategic Implications: Long-term considerations and outcomes

Use available tools to gather market data, property analysis, and financial calculations.
Provide specific insights, data-driven conclusions, and actionable recommendations.
`),
])

export const COMPETITIVE_COMPARISON_PROMPT = ChatPromptTemplate.fromMessages([
  COMPETITIVE_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Analyze and compare multiple offers to identify the strongest candidates and competitive positioning.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}
- Include Comparisons: {includeComparisons}

Compare offers across:
1. Financial Strength: Purchase price, financing quality, cash components
2. Terms Favorability: Timeline, contingencies, seller benefits
3. Execution Risk: Financing probability, buyer qualifications, timeline reliability
4. Strategic Value: Long-term benefits, relationship factors, unique advantages
5. Market Positioning: How each offer fits current conditions and seller needs
6. Competitive Dynamics: Offer interactions and positioning strategies

Use market analysis and offer comparison tools to support your analysis.
Rank offers and provide detailed justification for recommended selection.
`),
])

export const OFFER_STRENGTH_ASSESSMENT_PROMPT = ChatPromptTemplate.fromMessages(
  [
    ANALYTICAL_SYSTEM_TEMPLATE,
    HumanMessagePromptTemplate.fromTemplate(`
Evaluate the overall strength and competitiveness of this offer in the current market context.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}
- Focus Areas: {focusAreas}

Assess offer strength across:
1. Price Competitiveness: Market value alignment and pricing strategy
2. Financial Credibility: Financing strength and buyer qualifications
3. Terms Attractiveness: Seller-friendly terms and flexibility
4. Timeline Alignment: Closing schedule and possession timing
5. Risk Profile: Contingency structure and execution probability
6. Market Fit: Alignment with current market conditions and trends
7. Negotiation Position: Leverage and adjustment potential

Use property valuation and market analysis tools to support your assessment.
Provide an overall strength rating and specific improvement recommendations.
`),
  ]
)

export const FINANCIAL_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  ANALYTICAL_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Conduct a detailed financial analysis of this offer, focusing on monetary implications and value assessment.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}
- Focus Areas: {focusAreas}

Analyze financial aspects:
1. Price Analysis: Market value comparison and pricing justification
2. Financing Structure: Loan terms, down payment, interest rates
3. Cost Breakdown: All transaction costs and financial implications
4. Cash Flow Impact: Monthly payments and ongoing costs
5. Market Value Assessment: Current and projected property values
6. Investment Return: ROI calculations and value appreciation potential
7. Financial Risk: Loan approval probability and financial stability

Use financial calculation tools, mortgage calculators, and investment analysis tools.
Provide comprehensive financial summary and value recommendations.
`),
])

export const RISK_ASSESSMENT_PROMPT = ChatPromptTemplate.fromMessages([
  STRATEGIC_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Identify and analyze all potential risks associated with this offer and transaction.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}
- Include Risks: {includeRisks}

Evaluate risks across:
1. Financing Risks: Loan approval, interest rate, qualification issues
2. Market Risks: Value fluctuation, market condition changes
3. Property Risks: Condition, inspection, appraisal concerns
4. Timeline Risks: Closing delays, coordination challenges
5. Legal Risks: Contract terms, compliance, documentation
6. Competitive Risks: Multiple offers, bidding war dynamics
7. Economic Risks: Market shifts, economic factors, external influences

Use property analysis tools, market data tools, and validation tools.
Provide risk ratings, mitigation strategies, and decision frameworks.
`),
])

export const CLIENT_PRESENTATION_PROMPT = ChatPromptTemplate.fromMessages([
  ANALYTICAL_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Create a client-focused summary that explains this offer analysis in clear, understandable terms.

Analysis Context:
{context}

Analysis Parameters:
- Perspective: {perspective}
- Depth: {depth}
- Include Recommendations: {includeRecommendations}

Structure the presentation:
1. Executive Summary: Key findings and recommendations in simple terms
2. Offer Highlights: Main strengths and attractive features
3. Areas of Concern: Potential issues and their significance
4. Market Context: How this offer fits current market conditions
5. Financial Implications: What this means financially for the client
6. Next Steps: Recommended actions and decision points
7. Q&A Preparation: Anticipated client questions and answers

Use clear, jargon-free language appropriate for client communication.
Support key points with data from market analysis and financial calculation tools.
`),
])

// ========== PROMPT TEMPLATE REGISTRY ==========

export const ANALYSIS_PROMPT_TEMPLATES = {
  SINGLE_OFFER_REVIEW: SINGLE_OFFER_REVIEW_PROMPT,
  COMPETITIVE_COMPARISON: COMPETITIVE_COMPARISON_PROMPT,
  OFFER_STRENGTH_ASSESSMENT: OFFER_STRENGTH_ASSESSMENT_PROMPT,
  FINANCIAL_ANALYSIS: FINANCIAL_ANALYSIS_PROMPT,
  RISK_ASSESSMENT: RISK_ASSESSMENT_PROMPT,
  CLIENT_PRESENTATION: CLIENT_PRESENTATION_PROMPT,
}

export const ANALYSIS_SYSTEM_TEMPLATES = {
  ANALYTICAL: ANALYTICAL_SYSTEM_TEMPLATE,
  COMPETITIVE: COMPETITIVE_SYSTEM_TEMPLATE,
  STRATEGIC: STRATEGIC_SYSTEM_TEMPLATE,
}

// ========== UTILITY FUNCTIONS ==========

export const getAnalysisPrompt = (analysisType: string) => {
  const typeKey =
    analysisType.toUpperCase() as keyof typeof ANALYSIS_PROMPT_TEMPLATES
  return (
    ANALYSIS_PROMPT_TEMPLATES[typeKey] ||
    ANALYSIS_PROMPT_TEMPLATES.SINGLE_OFFER_REVIEW
  )
}

export const getAnalysisSystemTemplate = (type: string) => {
  const typeKey = type.toUpperCase() as keyof typeof ANALYSIS_SYSTEM_TEMPLATES
  return (
    ANALYSIS_SYSTEM_TEMPLATES[typeKey] || ANALYSIS_SYSTEM_TEMPLATES.ANALYTICAL
  )
}

export const formatAnalysisContext = (context: any): string => {
  return JSON.stringify(
    {
      primaryOffer: context.primaryOffer
        ? {
            type: context.primaryOffer.type,
            purchasePrice: context.primaryOffer.purchasePrice,
            earnestMoney: context.primaryOffer.earnestMoney,
            downPayment: context.primaryOffer.downPayment,
            loanAmount: context.primaryOffer.loanAmount,
            closingDate: context.primaryOffer.closingDate,
            contingencies: context.primaryOffer.contingencies,
            status: context.primaryOffer.status,
          }
        : null,
      competingOffers: context.competingOffers?.map((offer: any) => ({
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
            averagePrice: context.marketData.averagePrice,
            daysOnMarket: context.marketData.daysOnMarket,
            trend: context.marketData.trend,
          }
        : null,
    },
    null,
    2
  )
}

export const formatAnalysisOptions = (options: any): string => {
  return JSON.stringify(
    {
      perspective: options.perspective,
      depth: options.depth,
      includeRecommendations: options.includeRecommendations,
      includeRisks: options.includeRisks,
      includeComparisons: options.includeComparisons,
      focusAreas: options.focusAreas,
    },
    null,
    2
  )
}
