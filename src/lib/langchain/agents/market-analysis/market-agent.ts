/**
 * LangChain Market Analysis Agent
 *
 * LangChain agent implementation for generating comprehensive market analysis,
 * property comparisons, and market insights. Replaces the existing
 * MockMarketDataService with AI-enhanced analysis capabilities.
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ConversationMemory } from '../../memory/conversation-memory'
import { ToolRegistry } from '../../tools/index'
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from '@langchain/core/prompts'
import { getModelConfig } from '../../common/model-config'
import type {
  MarketData,
  Comparable,
  MarketTrend,
} from '../../../../shared/types/market-data'

// ========== MARKET ANALYSIS AGENT TYPES ==========

export interface MarketAnalysisConfig {
  location: {
    city: string
    state: string
    zipCode: string
    neighborhood?: string
  }
  propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family'
  priceRange: {
    min: number
    max: number
    median: number
  }
  marketConditions: {
    trend: 'hot' | 'warm' | 'cool'
    inventory: 'low' | 'balanced' | 'high'
    seasonality: 'peak' | 'normal' | 'slow'
  }
  timeframe: 'current' | '3months' | '6months' | '12months'
  analysisType: 'comprehensive' | 'focused' | 'comparison'
}

export interface MarketAnalysisResult {
  marketData: any
  comparables: any[]
  trends: any[]
  insights: MarketInsights
  narrative: string
  recommendations: string[]
  toolsUsed: string[]
  confidence: number
}

export interface MarketInsights {
  keyIndicators: {
    medianPrice: number
    averageDaysOnMarket: number
    priceAppreciation: number
    inventoryLevel: number
    absorptionRate: number
  }
  competitionLevel: 'high' | 'medium' | 'low'
  buyerAdvantages: string[]
  sellerAdvantages: string[]
  negotiationFactors: string[]
  riskFactors: string[]
}

export interface PropertyComparison {
  subjectProperty: any
  comparables: any[]
  analysis: ComparisonAnalysis
  toolsUsed: string[]
  confidence: number
}

export interface ComparisonAnalysis {
  suggestedPrice: number
  priceRange: { min: number; max: number }
  marketPosition: 'above' | 'at' | 'below'
  competitiveFactors: string[]
  pricingStrategy: string
  adjustmentFactors: string[]
}

// ========== MARKET ANALYSIS AGENT CLASS ==========

export class MarketAnalysisAgent {
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
    // Get relevant tools for market analysis
    const tools = [
      this.toolRegistry.getTool('GetMarketDataTool'),
      this.toolRegistry.getTool('GetComparablePropertiesTool'),
      this.toolRegistry.getTool('CreateMarketAnalysisTool'),
      this.toolRegistry.getTool('CalculatePropertyValueTool'),
      this.toolRegistry.getTool('MarketTrendAnalysisTool'),
      this.toolRegistry.getTool('CompetitiveMarketAnalysisTool'),
      this.toolRegistry.getTool('PropertyConditionAssessmentTool'),
      this.toolRegistry.getTool('InvestmentPropertyAnalysisTool'),
      this.toolRegistry.getTool('MortgagePaymentCalculatorTool'),
      this.toolRegistry.getTool('InvestmentReturnCalculatorTool'),
      this.toolRegistry.getTool('PropertyDataValidatorTool'),
      this.toolRegistry.getTool('CurrencyFormatterTool'),
      this.toolRegistry.getTool('NumberFormatterTool'),
      this.toolRegistry.getTool('DateFormatterTool'),
      this.toolRegistry.getTool('ErrorHandlerTool'),
    ].filter(Boolean)

    // Create system prompt for market analysis
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
You are a comprehensive real estate market analysis expert with deep knowledge of property valuation, market trends, and investment analysis. Your role is to provide accurate, data-driven market insights using available tools and real estate expertise.

Key principles:
- Use all available tools to gather comprehensive market data
- Provide objective, data-driven analysis with clear reasoning
- Consider multiple market factors and their interactions
- Generate realistic market scenarios and comparisons
- Offer actionable insights for different market participants
- Maintain transparency about data sources and limitations
- Support conclusions with specific market evidence

Your capabilities include:
- Market data analysis and trend identification
- Property valuation and comparison analysis
- Investment opportunity assessment
- Market timing and positioning advice
- Risk assessment and mitigation strategies
- Competitive market analysis
- Negotiation insights based on market conditions

Always use relevant tools to gather current market data and perform calculations.
Present findings in a clear, professional manner with specific recommendations.
`)

    // Create agent with tools
    const agent = createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt: ChatPromptTemplate.fromMessages([
        systemPrompt,
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]),
    })

    return new AgentExecutor({
      agent,
      tools,
      memory: this.memory.getMemory(),
      verbose: true,
      maxIterations: 12,
      returnIntermediateSteps: true,
    })
  }

  // ========== MARKET ANALYSIS METHODS ==========

  async generateMarketAnalysis(
    config: MarketAnalysisConfig
  ): Promise<MarketAnalysisResult> {
    const prompt = `
Generate a comprehensive market analysis for the following location and property type:

Location: ${config.location.city}, ${config.location.state} ${config.location.zipCode}
${config.location.neighborhood ? `Neighborhood: ${config.location.neighborhood}` : ''}
Property Type: ${config.propertyType}
Price Range: $${config.priceRange.min.toLocaleString()} - $${config.priceRange.max.toLocaleString()}
Median Price: $${config.priceRange.median.toLocaleString()}
Market Conditions: ${config.marketConditions.trend} market, ${config.marketConditions.inventory} inventory, ${config.marketConditions.seasonality} season
Timeframe: ${config.timeframe}
Analysis Type: ${config.analysisType}

Please provide:
1. Current market data and key indicators
2. Comparable property analysis
3. Market trend analysis and patterns
4. Competition level assessment
5. Buyer and seller advantages
6. Negotiation factors and strategies
7. Risk factors and mitigation strategies
8. Specific recommendations for different market participants

Use available tools to gather real market data and perform calculations.
Structure your response with clear sections and actionable insights.
`

    const result = await this.agent.invoke({
      input: prompt,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseMarketAnalysisResult(result, config)
  }

  async generatePropertyComparison(
    subjectProperty: any,
    config: MarketAnalysisConfig
  ): Promise<PropertyComparison> {
    const prompt = `
Generate a comprehensive property comparison analysis for:

Subject Property:
- Address: ${subjectProperty.address}
- Price: $${subjectProperty.price?.toLocaleString() || 'TBD'}
- Square Footage: ${subjectProperty.squareFootage || 'TBD'}
- Bedrooms: ${subjectProperty.bedrooms || 'TBD'}
- Bathrooms: ${subjectProperty.bathrooms || 'TBD'}
- Key Features: ${subjectProperty.features?.join(', ') || 'None listed'}

Market Context:
- Location: ${config.location.city}, ${config.location.state}
- Property Type: ${config.propertyType}
- Market Conditions: ${config.marketConditions.trend} market

Please provide:
1. Comparable property analysis using available tools
2. Property valuation and pricing recommendations
3. Market position assessment (above/at/below market)
4. Competitive factors and differentiators
5. Pricing strategy recommendations
6. Adjustment factors for unique features or conditions
7. Investment potential analysis

Use property valuation tools, market data tools, and comparison tools to support your analysis.
Provide specific price recommendations with supporting rationale.
`

    const result = await this.agent.invoke({
      input: prompt,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parsePropertyComparisonResult(result, subjectProperty, config)
  }

  async generateNegotiationInsights(offerContext: {
    offerPrice: number
    listPrice: number
    daysOnMarket: number
    buyerPosition: 'strong' | 'average' | 'weak'
    marketConditions: any
  }): Promise<string[]> {
    const prompt = `
Generate negotiation insights for the following offer scenario:

Offer Details:
- Offer Price: $${offerContext.offerPrice.toLocaleString()}
- List Price: $${offerContext.listPrice.toLocaleString()}
- Days on Market: ${offerContext.daysOnMarket}
- Buyer Position: ${offerContext.buyerPosition}
- Market Conditions: ${JSON.stringify(offerContext.marketConditions, null, 2)}

Please provide:
1. Offer strength assessment relative to market conditions
2. Negotiation leverage analysis for both parties
3. Specific negotiation strategies and tactics
4. Potential counter-offer scenarios
5. Risk factors and mitigation strategies
6. Timeline considerations and pressure points
7. Alternative negotiation approaches

Use market analysis tools to assess the competitive landscape.
Provide specific, actionable negotiation recommendations.
`

    const result = await this.agent.invoke({
      input: prompt,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseNegotiationInsights(result.output || result.text || '')
  }

  async generateMarketForecast(
    config: MarketAnalysisConfig,
    forecastPeriod: '3months' | '6months' | '12months' = '6months'
  ): Promise<any> {
    const prompt = `
Generate a market forecast for the following area:

Location: ${config.location.city}, ${config.location.state}
Property Type: ${config.propertyType}
Current Market Conditions: ${JSON.stringify(config.marketConditions, null, 2)}
Forecast Period: ${forecastPeriod}

Please provide:
1. Market trend projections and price forecasts
2. Inventory level predictions
3. Interest rate impact analysis
4. Seasonal factor considerations
5. Economic indicator influences
6. Risk factors and uncertainty analysis
7. Investment timing recommendations
8. Strategic planning insights

Use market trend analysis tools and historical data to support projections.
Provide confidence levels and key assumptions for forecasts.
`

    const result = await this.agent.invoke({
      input: prompt,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseMarketForecast(result.output || result.text || '')
  }

  async generateInvestmentAnalysis(
    property: any,
    config: MarketAnalysisConfig
  ): Promise<any> {
    const prompt = `
Generate an investment analysis for the following property:

Property Details:
${JSON.stringify(property, null, 2)}

Market Context:
Location: ${config.location.city}, ${config.location.state}
Market Conditions: ${JSON.stringify(config.marketConditions, null, 2)}

Please provide:
1. Investment return calculations (ROI, cap rate, cash flow)
2. Market appreciation potential
3. Risk assessment and mitigation strategies
4. Financing options and impact analysis
5. Rental income potential (if applicable)
6. Exit strategy considerations
7. Portfolio fit analysis
8. Timing recommendations

Use investment analysis tools, mortgage calculators, and market data tools.
Provide specific financial projections and recommendations.
`

    const result = await this.agent.invoke({
      input: prompt,
      chat_history: this.memory.getChatHistory(),
    })

    return this.parseInvestmentAnalysis(result.output || result.text || '')
  }

  // ========== UTILITY METHODS ==========

  private parseMarketAnalysisResult(
    result: any,
    config: MarketAnalysisConfig
  ): MarketAnalysisResult {
    const output = result.output || result.text || ''
    const intermediateSteps = result.intermediateSteps || []

    // Extract tools used
    const toolsUsed = intermediateSteps
      .map((step: any) => step.action?.tool)
      .filter(Boolean)

    // Parse market insights
    const insights = this.parseMarketInsights(output)

    // Generate narrative
    const narrative = this.extractNarrative(output)

    // Extract recommendations
    const recommendations = this.extractRecommendations(output)

    return {
      marketData: this.extractMarketData(output),
      comparables: this.extractComparables(output),
      trends: this.extractTrends(output),
      insights,
      narrative,
      recommendations,
      toolsUsed,
      confidence: this.calculateConfidence(output, toolsUsed),
    }
  }

  private parsePropertyComparisonResult(
    result: any,
    subjectProperty: any,
    config: MarketAnalysisConfig
  ): PropertyComparison {
    const output = result.output || result.text || ''
    const intermediateSteps = result.intermediateSteps || []

    const toolsUsed = intermediateSteps
      .map((step: any) => step.action?.tool)
      .filter(Boolean)

    const analysis = this.parseComparisonAnalysis(output)

    return {
      subjectProperty,
      comparables: this.extractComparables(output),
      analysis,
      toolsUsed,
      confidence: this.calculateConfidence(output, toolsUsed),
    }
  }

  private parseMarketInsights(output: string): MarketInsights {
    // Extract key indicators
    const medianPriceMatch = output.match(/median price[:\s]+\$?([\d,]+)/i)
    const daysOnMarketMatch = output.match(/days on market[:\s]+([\d]+)/i)
    const appreciationMatch = output.match(/appreciation[:\s]+([\d.]+)%/i)
    const inventoryMatch = output.match(/inventory[:\s]+([\d,]+)/i)
    const absorptionMatch = output.match(/absorption[:\s]+([\d.]+)/i)

    const keyIndicators = {
      medianPrice: medianPriceMatch
        ? parseInt(medianPriceMatch[1].replace(/,/g, ''))
        : 0,
      averageDaysOnMarket: daysOnMarketMatch
        ? parseInt(daysOnMarketMatch[1])
        : 30,
      priceAppreciation: appreciationMatch
        ? parseFloat(appreciationMatch[1])
        : 3.0,
      inventoryLevel: inventoryMatch
        ? parseInt(inventoryMatch[1].replace(/,/g, ''))
        : 100,
      absorptionRate: absorptionMatch ? parseFloat(absorptionMatch[1]) : 0.6,
    }

    // Extract competition level
    const competitionMatch = output.match(/competition[:\s]+(high|medium|low)/i)
    const competitionLevel = competitionMatch
      ? (competitionMatch[1].toLowerCase() as 'high' | 'medium' | 'low')
      : 'medium'

    // Extract advantages and factors
    const buyerAdvantages = this.extractAdvantages(output, 'buyer')
    const sellerAdvantages = this.extractAdvantages(output, 'seller')
    const negotiationFactors = this.extractFactors(output, 'negotiation')
    const riskFactors = this.extractFactors(output, 'risk')

    return {
      keyIndicators,
      competitionLevel,
      buyerAdvantages,
      sellerAdvantages,
      negotiationFactors,
      riskFactors,
    }
  }

  private parseComparisonAnalysis(output: string): ComparisonAnalysis {
    const priceMatch = output.match(/suggested price[:\s]+\$?([\d,]+)/i)
    const minMatch = output.match(/minimum[:\s]+\$?([\d,]+)/i)
    const maxMatch = output.match(/maximum[:\s]+\$?([\d,]+)/i)
    const positionMatch = output.match(/market position[:\s]+(above|at|below)/i)

    const suggestedPrice = priceMatch
      ? parseInt(priceMatch[1].replace(/,/g, ''))
      : 0
    const minPrice = minMatch
      ? parseInt(minMatch[1].replace(/,/g, ''))
      : suggestedPrice * 0.95
    const maxPrice = maxMatch
      ? parseInt(maxMatch[1].replace(/,/g, ''))
      : suggestedPrice * 1.05

    return {
      suggestedPrice,
      priceRange: { min: minPrice, max: maxPrice },
      marketPosition: positionMatch
        ? (positionMatch[1].toLowerCase() as 'above' | 'at' | 'below')
        : 'at',
      competitiveFactors: this.extractFactors(output, 'competitive'),
      pricingStrategy: this.extractStrategy(output),
      adjustmentFactors: this.extractFactors(output, 'adjustment'),
    }
  }

  private extractMarketData(output: string): any {
    // Extract structured market data from output
    // This is a simplified extraction - in practice, you'd parse more detailed data
    return {
      timestamp: new Date().toISOString(),
      source: 'AI Market Analysis',
      summary: output.substring(0, 500) + '...',
    }
  }

  private extractComparables(output: string): any[] {
    // Extract comparable properties from output
    const comparables: any[] = []
    const compMatches = output.match(
      /comparable \d+:.*?(?=comparable \d+:|$)/gis
    )

    if (compMatches) {
      compMatches.forEach((match, index) => {
        const priceMatch = match.match(/\$?([\d,]+)/)
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0

        comparables.push({
          id: `comp-${index + 1}`,
          price,
          description: match.substring(0, 200),
        })
      })
    }

    return comparables
  }

  private extractTrends(output: string): any[] {
    // Extract market trends from output
    const trends: any[] = []
    const trendMatches = output.match(/trend.*?(?=trend|$)/gis)

    if (trendMatches) {
      trendMatches.forEach((match, index) => {
        trends.push({
          id: `trend-${index + 1}`,
          description: match.substring(0, 200),
          timestamp: new Date().toISOString(),
        })
      })
    }

    return trends
  }

  private extractNarrative(output: string): string {
    // Extract the main narrative from the output
    const narrativeMatch = output.match(
      /market narrative[:\s]+(.*?)(?=\n\n|\n[A-Z])/is
    )
    return narrativeMatch ? narrativeMatch[1].trim() : output.substring(0, 500)
  }

  private extractRecommendations(output: string): string[] {
    const recommendationSection = output.match(
      /(?:recommendations?|suggestions?)[:\s]+([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )

    if (!recommendationSection) return []

    const bullets = recommendationSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 5)
      : []
  }

  private extractAdvantages(
    output: string,
    type: 'buyer' | 'seller'
  ): string[] {
    const advantageSection = output.match(
      new RegExp(
        `${type}\\s+advantages?[:\\s]+([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n[A-Z][a-z]|$)`,
        'i'
      )
    )

    if (!advantageSection) return []

    const bullets = advantageSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 4)
      : []
  }

  private extractFactors(output: string, type: string): string[] {
    const factorSection = output.match(
      new RegExp(
        `${type}\\s+factors?[:\\s]+([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n[A-Z][a-z]|$)`,
        'i'
      )
    )

    if (!factorSection) return []

    const bullets = factorSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 4)
      : []
  }

  private extractStrategy(output: string): string {
    const strategyMatch = output.match(/pricing strategy[:\s]+(.*?)(?:\n|$)/i)
    return strategyMatch
      ? strategyMatch[1].trim()
      : 'Market-based pricing recommended'
  }

  private parseNegotiationInsights(output: string): string[] {
    const insightSection = output.match(
      /(?:insights?|strategies?)[:\s]+([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][a-z]|$)/i
    )

    if (!insightSection) return []

    const bullets = insightSection[1].match(/[-•*]\s*(.+)/g)
    return bullets
      ? bullets.map(bullet => bullet.replace(/[-•*]\s*/, '').trim()).slice(0, 7)
      : []
  }

  private parseMarketForecast(output: string): any {
    return {
      forecast: output,
      timestamp: new Date().toISOString(),
      confidence: this.calculateConfidence(output, []),
    }
  }

  private parseInvestmentAnalysis(output: string): any {
    return {
      analysis: output,
      timestamp: new Date().toISOString(),
      confidence: this.calculateConfidence(output, []),
    }
  }

  private calculateConfidence(output: string, toolsUsed: string[]): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on tools used
    if (toolsUsed.includes('GetMarketDataTool')) confidence += 0.1
    if (toolsUsed.includes('CalculatePropertyValueTool')) confidence += 0.1
    if (toolsUsed.includes('MarketTrendAnalysisTool')) confidence += 0.1
    if (toolsUsed.includes('GetComparablePropertiesTool')) confidence += 0.05

    // Increase confidence based on output quality
    if (output.includes('$') && output.match(/\$[\d,]+/g)) confidence += 0.05
    if (output.includes('%') && output.match(/[\d.]+%/g)) confidence += 0.05
    if (output.length > 1000) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  // ========== HELPER METHODS ==========

  clearMemory(): void {
    this.memory.clear()
  }

  getMemoryHistory(): any[] {
    return this.memory.getChatHistory()
  }

  async saveAnalysisToFirebase(
    result: MarketAnalysisResult,
    config: MarketAnalysisConfig
  ): Promise<void> {
    const saveTool = this.toolRegistry.getTool('CreateMarketAnalysisTool')
    if (saveTool) {
      await saveTool.invoke({
        location: config.location,
        propertyType: config.propertyType,
        analysis: result,
        createdAt: new Date().toISOString(),
      })
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

export const createMarketAnalysisConfig = (
  location: string,
  propertyType: string,
  priceRange: any,
  marketConditions: any
): MarketAnalysisConfig => {
  const [city, state] = location.split(', ')

  return {
    location: {
      city: city || '',
      state: state || '',
      zipCode: '',
    },
    propertyType: propertyType as any,
    priceRange: {
      min: priceRange.min || 0,
      max: priceRange.max || 1000000,
      median: priceRange.median || 500000,
    },
    marketConditions: {
      trend: marketConditions.trend || 'warm',
      inventory: marketConditions.inventory || 'balanced',
      seasonality: marketConditions.seasonality || 'normal',
    },
    timeframe: 'current',
    analysisType: 'comprehensive',
  }
}

export const getMarketScenarios = () => ({
  HOT_MARKET: {
    trend: 'hot',
    inventory: 'low',
    seasonality: 'peak',
  },
  COOL_MARKET: {
    trend: 'cool',
    inventory: 'high',
    seasonality: 'slow',
  },
  BALANCED_MARKET: {
    trend: 'warm',
    inventory: 'balanced',
    seasonality: 'normal',
  },
})

export default MarketAnalysisAgent
