/**
 * LangChain Negotiation Strategy Prompt Templates
 *
 * Specialized prompt templates for LangChain negotiation strategy agents.
 * Converts existing OpenAI prompts to LangChain format with proper template handling.
 */

import { PromptTemplate } from '@langchain/core/prompts'
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from '@langchain/core/prompts'

// ========== SYSTEM PROMPT TEMPLATES ==========

export const STRATEGIC_ADVISOR_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a master real estate negotiation strategist with decades of experience closing complex deals. 
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
- Communication guidance

You have access to real estate tools for market data, calculations, and document generation.
Use these tools to gather information and support your strategic recommendations.
`)

export const MARKET_STRATEGIST_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a market-focused negotiation expert who leverages market conditions and data to create optimal positioning strategies.
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
- Opportunity identification

You have access to market data analysis tools and property valuation tools.
Use these tools to gather current market information and support your strategic recommendations.
`)

export const PSYCHOLOGY_EXPERT_SYSTEM_TEMPLATE =
  SystemMessagePromptTemplate.fromTemplate(`
You are a negotiation psychology expert who understands the emotional and behavioral aspects of real estate deals.
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
- Communication psychology guidance

You have access to property analysis and market data tools to support your psychological assessments.
Use these tools to understand the full context of the negotiation situation.
`)

// ========== SCENARIO-SPECIFIC PROMPT TEMPLATES ==========

export const INITIAL_OFFER_PROMPT = ChatPromptTemplate.fromMessages([
  STRATEGIC_ADVISOR_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop a comprehensive strategy for presenting an initial offer that positions the client optimally while leaving room for negotiation.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create a strategy that includes:
1. Optimal offer positioning (price, terms, contingencies)
2. Psychological positioning and first impression
3. Leverage points and competitive advantages
4. Concession strategy and negotiation room
5. Communication approach and timing
6. Anticipated responses and counter-strategies
7. Risk mitigation and fallback positions

Consider market conditions, competition level, and client motivations.
Use available tools to gather market data and property analysis to support your recommendations.
`),
])

export const COUNTER_OFFER_PROMPT = ChatPromptTemplate.fromMessages([
  STRATEGIC_ADVISOR_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop a strategic response to a counter-offer that advances the client's position while maintaining momentum toward closing.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create a response strategy that includes:
1. Analysis of the counter-offer and opponent motivations
2. Strategic response options (accept, counter, walk away)
3. Tactical adjustments to improve position
4. Communication strategy to maintain relationship
5. Pressure tactics and leverage utilization
6. Timeline management and urgency creation
7. Scenarios for different opponent responses

Focus on advancing toward a successful close.
Use available tools to analyze the counter-offer and gather supporting market data.
`),
])

export const MULTIPLE_OFFERS_PROMPT = ChatPromptTemplate.fromMessages([
  MARKET_STRATEGIST_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop a competitive strategy for winning in a multiple offer situation while protecting the client's interests.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create a competitive strategy that includes:
1. Differentiation from other offers
2. Risk management in competitive bidding
3. Strategic positioning beyond price
4. Escalation clause and bidding strategies
5. Relationship and emotional appeal tactics
6. Due diligence and verification strategies
7. Backup property identification

Balance competitiveness with prudent risk management.
Use market analysis and property valuation tools to support your competitive positioning.
`),
])

export const DEADLINE_PRESSURE_PROMPT = ChatPromptTemplate.fromMessages([
  PSYCHOLOGY_EXPERT_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop tactics for managing deadline pressure while maintaining negotiation advantage and avoiding costly mistakes.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create a pressure management strategy that includes:
1. Timeline analysis and pressure assessment
2. Strategic use of deadlines as leverage
3. Acceleration tactics without compromising position
4. Pressure resistance and counterpressure strategies
5. Decision-making frameworks under time constraints
6. Communication strategies for urgent negotiations
7. Fallback options if deadlines cannot be met

Focus on maintaining strategic advantage despite time pressure.
Use calculation tools to assess financial implications of time-sensitive decisions.
`),
])

export const APPRAISAL_GAP_PROMPT = ChatPromptTemplate.fromMessages([
  STRATEGIC_ADVISOR_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop strategies for addressing appraisal gaps that protect the client's financial position while keeping the deal alive.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create an appraisal gap strategy that includes:
1. Gap analysis and impact assessment
2. Negotiation options for gap resolution
3. Financial alternatives and creative solutions
4. Market value arguments and supporting data
5. Risk sharing and compromise strategies
6. Walk-away thresholds and alternatives
7. Documentation and protection strategies

Balance deal preservation with financial protection.
Use property valuation and market analysis tools to support your gap resolution strategies.
`),
])

export const INSPECTION_NEGOTIATIONS_PROMPT = ChatPromptTemplate.fromMessages([
  STRATEGIC_ADVISOR_SYSTEM_TEMPLATE,
  HumanMessagePromptTemplate.fromTemplate(`
Develop approaches for inspection-based negotiations that address issues while maintaining deal momentum.

Negotiation Context:
{context}

Strategy Parameters:
- Aggressiveness: {aggressiveness}
- Risk Tolerance: {riskTolerance}
- Time Horizon: {timeHorizon}
- Relationship Importance: {relationshipImportance}

Create an inspection negotiation strategy that includes:
1. Issue prioritization and cost analysis
2. Repair vs. credit vs. price reduction strategies
3. Professional estimates and documentation
4. Negotiation tactics for different issue types
5. Relationship management during difficult discussions
6. Deal preservation vs. issue resolution balance
7. Timeline management and deadline coordination

Focus on fair resolution while protecting client interests.
Use property analysis tools to assess repair costs and market impact of property issues.
`),
])

// ========== PROMPT TEMPLATE REGISTRY ==========

export const NEGOTIATION_PROMPT_TEMPLATES = {
  INITIAL_OFFER: INITIAL_OFFER_PROMPT,
  COUNTER_OFFER: COUNTER_OFFER_PROMPT,
  MULTIPLE_OFFERS: MULTIPLE_OFFERS_PROMPT,
  DEADLINE_PRESSURE: DEADLINE_PRESSURE_PROMPT,
  APPRAISAL_GAP: APPRAISAL_GAP_PROMPT,
  INSPECTION_NEGOTIATIONS: INSPECTION_NEGOTIATIONS_PROMPT,
}

export const NEGOTIATION_SYSTEM_TEMPLATES = {
  STRATEGIC_ADVISOR: STRATEGIC_ADVISOR_SYSTEM_TEMPLATE,
  MARKET_STRATEGIST: MARKET_STRATEGIST_SYSTEM_TEMPLATE,
  PSYCHOLOGY_EXPERT: PSYCHOLOGY_EXPERT_SYSTEM_TEMPLATE,
}

// ========== UTILITY FUNCTIONS ==========

export const getNegotiationPrompt = (scenario: string) => {
  const scenarioKey =
    scenario.toUpperCase() as keyof typeof NEGOTIATION_PROMPT_TEMPLATES
  return (
    NEGOTIATION_PROMPT_TEMPLATES[scenarioKey] ||
    NEGOTIATION_PROMPT_TEMPLATES.INITIAL_OFFER
  )
}

export const getNegotiationSystemTemplate = (type: string) => {
  const typeKey =
    type.toUpperCase() as keyof typeof NEGOTIATION_SYSTEM_TEMPLATES
  return (
    NEGOTIATION_SYSTEM_TEMPLATES[typeKey] ||
    NEGOTIATION_SYSTEM_TEMPLATES.STRATEGIC_ADVISOR
  )
}

export const formatNegotiationContext = (context: any): string => {
  return JSON.stringify(
    {
      scenario: context.scenario,
      client: {
        role: context.client?.role,
        goals: context.client?.goals,
        priorities: context.client?.priorities,
        constraints: context.client?.constraints,
        timeline: context.client?.timeline,
        budget: context.client?.budget,
        motivations: context.client?.motivations,
        experienceLevel: context.client?.experienceLevel,
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
