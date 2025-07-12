import type {
  NegotiationRecord,
  StrategyRecommendation,
  AnalyticsQuery,
  RecommendationResponse,
  SuccessRateAnalytics,
  NegotiationStrategy,
  NegotiationContext,
  PriceRange,
} from '../../shared/types/analytics'
import { successRateCalculator } from './success-rate-calculator'
import {
  getNegotiationRecords,
  getCachedAnalytics,
  setCachedAnalytics,
} from '../firebase/collections/negotiation-analytics'
import { logger } from '../../main/utils/logger'

/**
 * Strategy Recommender Service
 *
 * Provides intelligent negotiation strategy recommendations based on:
 * - Historical performance data
 * - Market conditions and property characteristics
 * - Competitive environment
 * - Agent's past success patterns
 */
export class StrategyRecommender {
  private static instance: StrategyRecommender
  private readonly CACHE_DURATION_MINUTES = 120 // 2 hours cache for recommendations
  private readonly MIN_DATA_POINTS = 3 // Minimum for basic recommendations
  private readonly OPTIMAL_DATA_POINTS = 10 // Optimal for high-confidence recommendations
  private readonly CONFIDENCE_THRESHOLD = 0.6 // Minimum confidence for recommendations

  private constructor() {}

  public static getInstance(): StrategyRecommender {
    if (!StrategyRecommender.instance) {
      StrategyRecommender.instance = new StrategyRecommender()
    }
    return StrategyRecommender.instance
  }

  // ========== MAIN RECOMMENDATION METHODS ==========

  /**
   * Generate comprehensive strategy recommendations for a negotiation
   */
  public async generateRecommendations(
    agentId: string,
    context: NegotiationContext,
    options?: {
      includeAlternatives?: boolean
      minConfidence?: number
      maxRecommendations?: number
    }
  ): Promise<RecommendationResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(agentId, context)
      const cachedResult = await getCachedAnalytics(cacheKey, agentId)

      if (cachedResult.success && cachedResult.data) {
        logger.info(`Using cached recommendations for agent: ${agentId}`)
        return {
          success: true,
          data: cachedResult.data,
          metadata: {
            totalRecords: 0,
            filteredRecords: 0,
            calculationTime: 0,
            cacheStatus: 'hit',
          },
        }
      }

      const startTime = Date.now()

      // Get historical data
      const analytics =
        await successRateCalculator.calculateSuccessRateAnalytics(agentId)

      if (!analytics.success || !analytics.data) {
        return {
          success: false,
          error: analytics.error || 'Failed to get analytics data',
        }
      }

      // Check data sufficiency
      const dataSufficiency = await this.checkDataSufficiency(
        agentId,
        analytics.data
      )

      let recommendations: StrategyRecommendation[]

      if (dataSufficiency.sufficient) {
        // Generate data-driven recommendations
        recommendations = await this.generateDataDrivenRecommendations(
          agentId,
          context,
          analytics.data,
          options
        )
      } else {
        // Generate fallback recommendations
        recommendations = await this.generateFallbackRecommendations(
          agentId,
          context,
          analytics.data,
          options
        )
      }

      // Filter by confidence if specified
      const minConfidence = options?.minConfidence || this.CONFIDENCE_THRESHOLD
      const filteredRecommendations = recommendations.filter(
        rec => rec.recommendation.confidence >= minConfidence
      )

      // Limit number of recommendations
      const maxRecommendations = options?.maxRecommendations || 5
      const finalRecommendations = filteredRecommendations.slice(
        0,
        maxRecommendations
      )

      const calculationTime = Date.now() - startTime

      // Cache the results
      await setCachedAnalytics(
        cacheKey,
        agentId,
        finalRecommendations,
        this.CACHE_DURATION_MINUTES
      )

      logger.info(
        `Generated ${finalRecommendations.length} recommendations for agent ${agentId} in ${calculationTime}ms`
      )

      return {
        success: true,
        data: finalRecommendations,
        metadata: {
          totalRecords: analytics.data.totalNegotiations,
          filteredRecords: filteredRecommendations.length,
          calculationTime,
          cacheStatus: 'miss',
        },
      }
    } catch (error) {
      logger.error('Failed to generate recommendations:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate specific recommendation for a strategy type
   */
  public async generateSpecificRecommendation(
    agentId: string,
    context: NegotiationContext,
    recommendationType: StrategyRecommendation['recommendationType']
  ): Promise<StrategyRecommendation | null> {
    try {
      const recommendations = await this.generateRecommendations(
        agentId,
        context,
        { maxRecommendations: 10 }
      )

      if (!recommendations.success || !recommendations.data) {
        return null
      }

      // Find the best recommendation for the specific type
      const specificRecommendation = recommendations.data.find(
        rec => rec.recommendationType === recommendationType
      )

      return specificRecommendation || null
    } catch (error) {
      logger.error('Failed to generate specific recommendation:', error)
      return null
    }
  }

  // ========== DATA-DRIVEN RECOMMENDATION METHODS ==========

  /**
   * Generate recommendations based on historical data analysis
   */
  private async generateDataDrivenRecommendations(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics,
    options?: {
      includeAlternatives?: boolean
      minConfidence?: number
      maxRecommendations?: number
    }
  ): Promise<StrategyRecommendation[]> {
    const recommendations: StrategyRecommendation[] = []

    // Generate initial offer recommendation
    const initialOfferRec = await this.generateInitialOfferRecommendation(
      agentId,
      context,
      analytics
    )
    if (initialOfferRec) recommendations.push(initialOfferRec)

    // Generate escalation recommendation
    const escalationRec = await this.generateEscalationRecommendation(
      agentId,
      context,
      analytics
    )
    if (escalationRec) recommendations.push(escalationRec)

    // Generate contingency recommendation
    const contingencyRec = await this.generateContingencyRecommendation(
      agentId,
      context,
      analytics
    )
    if (contingencyRec) recommendations.push(contingencyRec)

    // Generate communication recommendation
    const communicationRec = await this.generateCommunicationRecommendation(
      agentId,
      context,
      analytics
    )
    if (communicationRec) recommendations.push(communicationRec)

    // Generate overall strategy recommendation
    const overallRec = await this.generateOverallStrategyRecommendation(
      agentId,
      context,
      analytics
    )
    if (overallRec) recommendations.push(overallRec)

    return recommendations.sort(
      (a, b) => b.recommendation.confidence - a.recommendation.confidence
    )
  }

  /**
   * Generate initial offer recommendation based on historical success
   */
  private async generateInitialOfferRecommendation(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics
  ): Promise<StrategyRecommendation | null> {
    try {
      // Find similar contexts in historical data
      const similarContexts = await this.findSimilarContexts(agentId, context, [
        'propertyType',
        'marketConditions',
        'priceRange',
      ])

      if (similarContexts.length === 0) {
        return null
      }

      // Analyze successful initial offer percentages
      const successfulOffers = similarContexts.filter(
        record => record.outcome?.successful
      )

      if (successfulOffers.length === 0) {
        return null
      }

      const offerPercentages = successfulOffers.map(
        record => record.strategy.initialOfferPercentage
      )
      const averageOfferPercentage =
        offerPercentages.reduce((sum, pct) => sum + pct, 0) /
        offerPercentages.length

      // Calculate confidence based on sample size and consistency
      const consistency = this.calculateConsistency(offerPercentages)
      const sampleSizeConfidence = Math.min(successfulOffers.length / 10, 1)
      const confidence = consistency * sampleSizeConfidence

      // Adjust recommendation based on market conditions
      let adjustedPercentage = averageOfferPercentage
      if (context.marketConditions === 'hot') {
        adjustedPercentage += 2 // Slightly higher in hot markets
      } else if (context.marketConditions === 'cool') {
        adjustedPercentage -= 3 // Lower in cool markets
      }

      // Ensure percentage is within reasonable bounds
      adjustedPercentage = Math.max(85, Math.min(100, adjustedPercentage))

      const recommendation: StrategyRecommendation = {
        agentId,
        recommendationType: 'initial_offer',
        recommendation: {
          strategy: 'initial_offer_percentage',
          value: Math.round(adjustedPercentage),
          confidence,
          reasoning: `Based on ${successfulOffers.length} similar successful negotiations, recommend offering ${Math.round(adjustedPercentage)}% of asking price. This strategy has shown ${Math.round((successfulOffers.length / similarContexts.length) * 100)}% success rate in similar contexts.`,
          expectedSuccessRate: successfulOffers.length / similarContexts.length,
        },
        basedOn: {
          propertyType: context.propertyType,
          marketConditions: context.marketConditions,
          priceRange: context.priceRange,
          competitiveEnvironment: context.multipleOffers,
          historicalDataPoints: similarContexts.length,
        },
        alternatives: await this.generateAlternativeOfferStrategies(
          similarContexts,
          context
        ),
        generatedAt: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
      }

      return recommendation
    } catch (error) {
      logger.error('Failed to generate initial offer recommendation:', error)
      return null
    }
  }

  /**
   * Generate escalation recommendation
   */
  private async generateEscalationRecommendation(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics
  ): Promise<StrategyRecommendation | null> {
    try {
      // Find escalation usage patterns in similar contexts
      const similarContexts = await this.findSimilarContexts(agentId, context, [
        'propertyType',
        'marketConditions',
        'multipleOffers',
      ])

      if (similarContexts.length === 0) {
        return null
      }

      const escalationUsage = similarContexts.map(record => ({
        used: record.strategy.escalationClause.used,
        successful: record.outcome?.successful || false,
        amount: record.strategy.escalationClause.maxAmount,
      }))

      const escalationSuccessRate =
        escalationUsage.filter(e => e.used && e.successful).length /
        escalationUsage.filter(e => e.used).length

      const noEscalationSuccessRate =
        escalationUsage.filter(e => !e.used && e.successful).length /
        escalationUsage.filter(e => !e.used).length

      const shouldUseEscalation =
        escalationSuccessRate > noEscalationSuccessRate

      // Calculate recommended escalation amount
      const successfulEscalations = escalationUsage.filter(
        e => e.used && e.successful && e.amount
      )
      const averageEscalationAmount =
        successfulEscalations.length > 0
          ? successfulEscalations.reduce((sum, e) => sum + (e.amount || 0), 0) /
            successfulEscalations.length
          : 10000

      const confidence = Math.min(similarContexts.length / 10, 1) * 0.8

      const recommendation: StrategyRecommendation = {
        agentId,
        recommendationType: 'escalation',
        recommendation: {
          strategy: 'escalation_clause',
          value: shouldUseEscalation,
          confidence,
          reasoning: shouldUseEscalation
            ? `Include escalation clause up to $${averageEscalationAmount.toLocaleString()}. Success rate with escalation: ${Math.round(escalationSuccessRate * 100)}% vs ${Math.round(noEscalationSuccessRate * 100)}% without.`
            : `Avoid escalation clause in this context. Success rate without escalation: ${Math.round(noEscalationSuccessRate * 100)}% vs ${Math.round(escalationSuccessRate * 100)}% with escalation.`,
          expectedSuccessRate: shouldUseEscalation
            ? escalationSuccessRate
            : noEscalationSuccessRate,
        },
        basedOn: {
          propertyType: context.propertyType,
          marketConditions: context.marketConditions,
          priceRange: context.priceRange,
          competitiveEnvironment: context.multipleOffers,
          historicalDataPoints: similarContexts.length,
        },
        alternatives: [
          {
            strategy: shouldUseEscalation
              ? 'no_escalation_clause'
              : 'escalation_clause',
            expectedSuccessRate: shouldUseEscalation
              ? noEscalationSuccessRate
              : escalationSuccessRate,
            reasoning: shouldUseEscalation
              ? 'Alternative approach without escalation clause'
              : 'Alternative approach with escalation clause',
          },
        ],
        generatedAt: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }

      return recommendation
    } catch (error) {
      logger.error('Failed to generate escalation recommendation:', error)
      return null
    }
  }

  /**
   * Generate contingency recommendation
   */
  private async generateContingencyRecommendation(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics
  ): Promise<StrategyRecommendation | null> {
    try {
      const similarContexts = await this.findSimilarContexts(agentId, context, [
        'propertyType',
        'marketConditions',
      ])

      if (similarContexts.length === 0) {
        return null
      }

      // Analyze contingency patterns
      const contingencyPatterns = similarContexts.map(record => ({
        inspection: record.strategy.contingencies.inspection,
        financing: record.strategy.contingencies.financing,
        appraisal: record.strategy.contingencies.appraisal,
        saleOfHome: record.strategy.contingencies.saleOfHome,
        successful: record.outcome?.successful || false,
      }))

      // Calculate success rates for different contingency combinations
      const contingencyTypes = [
        'inspection',
        'financing',
        'appraisal',
        'saleOfHome',
      ]
      const contingencyAnalysis = contingencyTypes.map(type => {
        const withContingency = contingencyPatterns.filter(
          p => p[type as keyof typeof p]
        )
        const withoutContingency = contingencyPatterns.filter(
          p => !p[type as keyof typeof p]
        )

        const withSuccess = withContingency.filter(p => p.successful).length
        const withoutSuccess = withoutContingency.filter(
          p => p.successful
        ).length

        return {
          type,
          withRate:
            withContingency.length > 0
              ? withSuccess / withContingency.length
              : 0,
          withoutRate:
            withoutContingency.length > 0
              ? withoutSuccess / withoutContingency.length
              : 0,
          recommended:
            withContingency.length > 0 && withoutContingency.length > 0
              ? withSuccess / withContingency.length >
                withoutSuccess / withoutContingency.length
              : true, // Default to including contingency if no data
        }
      })

      const recommendedContingencies = contingencyAnalysis
        .filter(c => c.recommended)
        .map(c => c.type)

      const confidence = Math.min(similarContexts.length / 10, 1) * 0.7

      const recommendation: StrategyRecommendation = {
        agentId,
        recommendationType: 'contingency',
        recommendation: {
          strategy: 'contingency_selection',
          value: recommendedContingencies,
          confidence,
          reasoning: `Based on ${similarContexts.length} similar cases, recommend including: ${recommendedContingencies.join(', ')} contingencies. These have shown better success rates in similar contexts.`,
          expectedSuccessRate:
            contingencyAnalysis
              .filter(c => c.recommended)
              .reduce((sum, c) => sum + c.withRate, 0) /
            Math.max(1, contingencyAnalysis.filter(c => c.recommended).length),
        },
        basedOn: {
          propertyType: context.propertyType,
          marketConditions: context.marketConditions,
          priceRange: context.priceRange,
          competitiveEnvironment: context.multipleOffers,
          historicalDataPoints: similarContexts.length,
        },
        alternatives: contingencyAnalysis
          .filter(c => !c.recommended)
          .map(c => ({
            strategy: `include_${c.type}_contingency`,
            expectedSuccessRate: c.withRate,
            reasoning: `Alternative: Include ${c.type} contingency`,
          })),
        generatedAt: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }

      return recommendation
    } catch (error) {
      logger.error('Failed to generate contingency recommendation:', error)
      return null
    }
  }

  /**
   * Generate communication recommendation
   */
  private async generateCommunicationRecommendation(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics
  ): Promise<StrategyRecommendation | null> {
    try {
      // Find best communication tone from analytics
      const bestCommunicationStrategy = analytics.byStrategy.find(
        s => s.strategyType === 'communication_tone'
      )

      if (!bestCommunicationStrategy) {
        return null
      }

      const similarContexts = await this.findSimilarContexts(agentId, context, [
        'propertyType',
        'marketConditions',
      ])

      // Analyze communication patterns
      const communicationPatterns = similarContexts.map(record => ({
        tone: record.strategy.communicationTone,
        coverLetter: record.strategy.coverLetterUsed,
        personalStory: record.strategy.personalStoryIncluded,
        successful: record.outcome?.successful || false,
      }))

      // Find best communication approach
      const toneAnalysis = new Map<
        string,
        { total: number; successful: number }
      >()

      for (const pattern of communicationPatterns) {
        const key = pattern.tone
        if (!toneAnalysis.has(key)) {
          toneAnalysis.set(key, { total: 0, successful: 0 })
        }
        const stats = toneAnalysis.get(key)!
        stats.total++
        if (pattern.successful) stats.successful++
      }

      let bestTone = 'professional'
      let bestRate = 0
      for (const [tone, stats] of toneAnalysis) {
        const rate = stats.total > 0 ? stats.successful / stats.total : 0
        if (rate > bestRate && stats.total >= 2) {
          bestRate = rate
          bestTone = tone
        }
      }

      // Analyze cover letter effectiveness
      const coverLetterSuccess = communicationPatterns.filter(
        p => p.coverLetter && p.successful
      ).length
      const coverLetterTotal = communicationPatterns.filter(
        p => p.coverLetter
      ).length
      const coverLetterRate =
        coverLetterTotal > 0 ? coverLetterSuccess / coverLetterTotal : 0

      const noCoverLetterSuccess = communicationPatterns.filter(
        p => !p.coverLetter && p.successful
      ).length
      const noCoverLetterTotal = communicationPatterns.filter(
        p => !p.coverLetter
      ).length
      const noCoverLetterRate =
        noCoverLetterTotal > 0 ? noCoverLetterSuccess / noCoverLetterTotal : 0

      const recommendCoverLetter = coverLetterRate > noCoverLetterRate

      const confidence = Math.min(similarContexts.length / 10, 1) * 0.8

      const recommendation: StrategyRecommendation = {
        agentId,
        recommendationType: 'communication',
        recommendation: {
          strategy: 'communication_approach',
          value: {
            tone: bestTone,
            coverLetter: recommendCoverLetter,
            personalStory:
              recommendCoverLetter && context.propertyType === 'single_family',
          },
          confidence,
          reasoning: `Use ${bestTone} communication tone (${Math.round(bestRate * 100)}% success rate). ${recommendCoverLetter ? 'Include' : 'Skip'} cover letter (${Math.round((recommendCoverLetter ? coverLetterRate : noCoverLetterRate) * 100)}% success rate).`,
          expectedSuccessRate: bestRate,
        },
        basedOn: {
          propertyType: context.propertyType,
          marketConditions: context.marketConditions,
          priceRange: context.priceRange,
          competitiveEnvironment: context.multipleOffers,
          historicalDataPoints: similarContexts.length,
        },
        alternatives: Array.from(toneAnalysis.entries())
          .filter(([tone]) => tone !== bestTone)
          .map(([tone, stats]) => ({
            strategy: `${tone}_communication`,
            expectedSuccessRate:
              stats.total > 0 ? stats.successful / stats.total : 0,
            reasoning: `Alternative: Use ${tone} communication tone`,
          })),
        generatedAt: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }

      return recommendation
    } catch (error) {
      logger.error('Failed to generate communication recommendation:', error)
      return null
    }
  }

  /**
   * Generate overall strategy recommendation
   */
  private async generateOverallStrategyRecommendation(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics
  ): Promise<StrategyRecommendation | null> {
    try {
      // Get the top performing strategy overall
      const topStrategy = analytics.byStrategy[0]
      if (!topStrategy) {
        return null
      }

      // Get market-specific insights
      const marketInsights = analytics.byMarketConditions.find(
        m => m.marketCondition === context.marketConditions
      )

      // Get property-specific insights
      const propertyInsights = analytics.byPropertyType.find(
        p => p.propertyType === context.propertyType
      )

      // Get competitive environment insights
      const competitiveInsights = analytics.byCompetitiveEnvironment.find(
        c => c.multipleOffers === context.multipleOffers
      )

      const confidence = Math.min(
        (topStrategy.confidence +
          (marketInsights ? 0.8 : 0.5) +
          (propertyInsights ? 0.8 : 0.5) +
          (competitiveInsights ? 0.8 : 0.5)) /
          4,
        1
      )

      const recommendation: StrategyRecommendation = {
        agentId,
        recommendationType: 'overall',
        recommendation: {
          strategy: 'comprehensive_approach',
          value: {
            primaryStrategy: topStrategy.strategyType,
            marketAdjustment: marketInsights?.recommendedStrategy || 'standard',
            competitiveResponse: context.multipleOffers
              ? 'aggressive'
              : 'standard',
            timeline:
              context.marketConditions === 'hot' ? 'urgent' : 'standard',
          },
          confidence,
          reasoning: `Your most successful strategy is ${topStrategy.strategyType} (${Math.round(topStrategy.successRate * 100)}% success rate). In ${context.marketConditions} markets like this, ${marketInsights?.recommendedStrategy || 'standard approach'} works best. ${context.multipleOffers ? 'With multiple offers expected, be prepared to act quickly and competitively.' : 'Single offer situation allows for more deliberate negotiation.'}`,
          expectedSuccessRate: topStrategy.successRate,
        },
        basedOn: {
          propertyType: context.propertyType,
          marketConditions: context.marketConditions,
          priceRange: context.priceRange,
          competitiveEnvironment: context.multipleOffers,
          historicalDataPoints: analytics.totalNegotiations,
        },
        alternatives: analytics.byStrategy.slice(1, 3).map(strategy => ({
          strategy: strategy.strategyType,
          expectedSuccessRate: strategy.successRate,
          reasoning: `Alternative: Focus on ${strategy.strategyType} approach`,
        })),
        generatedAt: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }

      return recommendation
    } catch (error) {
      logger.error('Failed to generate overall strategy recommendation:', error)
      return null
    }
  }

  // ========== FALLBACK RECOMMENDATION METHODS ==========

  /**
   * Generate fallback recommendations when insufficient historical data
   */
  private async generateFallbackRecommendations(
    agentId: string,
    context: NegotiationContext,
    analytics: SuccessRateAnalytics,
    options?: {
      includeAlternatives?: boolean
      minConfidence?: number
      maxRecommendations?: number
    }
  ): Promise<StrategyRecommendation[]> {
    const recommendations: StrategyRecommendation[] = []

    // Generate market-based recommendations
    const marketRec = this.generateMarketBasedRecommendation(agentId, context)
    if (marketRec) recommendations.push(marketRec)

    // Generate property-based recommendations
    const propertyRec = this.generatePropertyBasedRecommendation(
      agentId,
      context
    )
    if (propertyRec) recommendations.push(propertyRec)

    // Generate competitive-based recommendations
    const competitiveRec = this.generateCompetitiveBasedRecommendation(
      agentId,
      context
    )
    if (competitiveRec) recommendations.push(competitiveRec)

    // Generate conservative overall recommendation
    const conservativeRec = this.generateConservativeRecommendation(
      agentId,
      context
    )
    if (conservativeRec) recommendations.push(conservativeRec)

    return recommendations
  }

  /**
   * Generate market-based fallback recommendation
   */
  private generateMarketBasedRecommendation(
    agentId: string,
    context: NegotiationContext
  ): StrategyRecommendation {
    let recommendedPercentage = 95
    let reasoning = 'Standard market approach'

    switch (context.marketConditions) {
      case 'hot':
        recommendedPercentage = 98
        reasoning =
          'Hot market requires competitive offers close to asking price'
        break
      case 'cool':
        recommendedPercentage = 90
        reasoning = 'Cool market allows for more aggressive initial offers'
        break
      case 'warm':
        recommendedPercentage = 95
        reasoning = 'Balanced market suggests moderate initial offer'
        break
    }

    return {
      agentId,
      recommendationType: 'initial_offer',
      recommendation: {
        strategy: 'market_based_offer',
        value: recommendedPercentage,
        confidence: 0.7,
        reasoning,
        expectedSuccessRate: 0.65,
      },
      basedOn: {
        propertyType: context.propertyType,
        marketConditions: context.marketConditions,
        priceRange: context.priceRange,
        competitiveEnvironment: context.multipleOffers,
        historicalDataPoints: 0,
      },
      alternatives: [
        {
          strategy: 'aggressive_offer',
          expectedSuccessRate: 0.5,
          reasoning: 'More aggressive approach with lower initial offer',
        },
        {
          strategy: 'conservative_offer',
          expectedSuccessRate: 0.8,
          reasoning: 'Conservative approach with higher initial offer',
        },
      ],
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  /**
   * Generate property-based fallback recommendation
   */
  private generatePropertyBasedRecommendation(
    agentId: string,
    context: NegotiationContext
  ): StrategyRecommendation {
    let recommendedContingencies = ['inspection', 'financing']
    let reasoning = 'Standard contingencies for property type'

    switch (context.propertyType) {
      case 'single_family':
        recommendedContingencies = ['inspection', 'financing', 'appraisal']
        reasoning =
          'Single family homes typically require comprehensive contingencies'
        break
      case 'condo':
        recommendedContingencies = ['inspection', 'financing']
        reasoning = 'Condos usually need basic contingencies'
        break
      case 'multi_family':
        recommendedContingencies = ['inspection', 'financing', 'appraisal']
        reasoning = 'Multi-family properties require thorough due diligence'
        break
    }

    return {
      agentId,
      recommendationType: 'contingency',
      recommendation: {
        strategy: 'property_based_contingencies',
        value: recommendedContingencies,
        confidence: 0.75,
        reasoning,
        expectedSuccessRate: 0.7,
      },
      basedOn: {
        propertyType: context.propertyType,
        marketConditions: context.marketConditions,
        priceRange: context.priceRange,
        competitiveEnvironment: context.multipleOffers,
        historicalDataPoints: 0,
      },
      alternatives: [
        {
          strategy: 'minimal_contingencies',
          expectedSuccessRate: 0.6,
          reasoning: 'Minimal contingencies for competitive advantage',
        },
        {
          strategy: 'comprehensive_contingencies',
          expectedSuccessRate: 0.8,
          reasoning: 'Comprehensive contingencies for maximum protection',
        },
      ],
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  /**
   * Generate competitive-based fallback recommendation
   */
  private generateCompetitiveBasedRecommendation(
    agentId: string,
    context: NegotiationContext
  ): StrategyRecommendation {
    const competitiveEnvironment = context.multipleOffers
    const recommendEscalation = competitiveEnvironment

    return {
      agentId,
      recommendationType: 'escalation',
      recommendation: {
        strategy: 'competitive_escalation',
        value: recommendEscalation,
        confidence: 0.7,
        reasoning: competitiveEnvironment
          ? 'Multiple offers expected - escalation clause recommended for competitive advantage'
          : 'Single offer situation - escalation clause not necessary',
        expectedSuccessRate: competitiveEnvironment ? 0.75 : 0.65,
      },
      basedOn: {
        propertyType: context.propertyType,
        marketConditions: context.marketConditions,
        priceRange: context.priceRange,
        competitiveEnvironment: context.multipleOffers,
        historicalDataPoints: 0,
      },
      alternatives: [
        {
          strategy: competitiveEnvironment
            ? 'no_escalation'
            : 'include_escalation',
          expectedSuccessRate: competitiveEnvironment ? 0.6 : 0.7,
          reasoning: competitiveEnvironment
            ? 'Alternative: Risk no escalation clause'
            : 'Alternative: Include escalation clause for safety',
        },
      ],
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  /**
   * Generate conservative overall fallback recommendation
   */
  private generateConservativeRecommendation(
    agentId: string,
    context: NegotiationContext
  ): StrategyRecommendation {
    return {
      agentId,
      recommendationType: 'overall',
      recommendation: {
        strategy: 'conservative_approach',
        value: {
          communicationTone: 'professional',
          coverLetter: true,
          personalStory: context.propertyType === 'single_family',
          timeline: 'standard',
        },
        confidence: 0.8,
        reasoning:
          'Conservative approach with professional communication, cover letter, and appropriate timeline. This balanced strategy works well when historical data is limited.',
        expectedSuccessRate: 0.7,
      },
      basedOn: {
        propertyType: context.propertyType,
        marketConditions: context.marketConditions,
        priceRange: context.priceRange,
        competitiveEnvironment: context.multipleOffers,
        historicalDataPoints: 0,
      },
      alternatives: [
        {
          strategy: 'aggressive_approach',
          expectedSuccessRate: 0.5,
          reasoning: 'More aggressive approach with higher risk/reward',
        },
        {
          strategy: 'ultra_conservative',
          expectedSuccessRate: 0.8,
          reasoning: 'Ultra-conservative approach with minimal risk',
        },
      ],
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Find similar negotiation contexts from historical data
   */
  private async findSimilarContexts(
    agentId: string,
    context: NegotiationContext,
    matchCriteria: (keyof NegotiationContext)[]
  ): Promise<NegotiationRecord[]> {
    try {
      const query: AnalyticsQuery = {
        agentId,
        limit: 100,
      }

      const recordsResponse = await getNegotiationRecords(query)
      if (!recordsResponse.success || !recordsResponse.data) {
        return []
      }

      // Filter for similar contexts
      const similarRecords = recordsResponse.data.filter(record => {
        return matchCriteria.every(criteria => {
          switch (criteria) {
            case 'propertyType':
              return record.context?.propertyType === context.propertyType
            case 'marketConditions':
              return (
                record.context?.marketConditions === context.marketConditions
              )
            case 'multipleOffers':
              return record.context?.multipleOffers === context.multipleOffers
            case 'priceRange':
              return this.isPriceRangeMatch(
                record.context?.priceRange,
                context.priceRange
              )
            default:
              return true
          }
        })
      })

      return similarRecords
    } catch (error) {
      logger.error('Failed to find similar contexts:', error)
      return []
    }
  }

  /**
   * Check if price ranges match (within 20% tolerance)
   */
  private isPriceRangeMatch(
    range1: PriceRange | undefined,
    range2: PriceRange | undefined
  ): boolean {
    if (!range1 || !range2) return false

    const range1Mid = (range1.min + range1.max) / 2
    const range2Mid = (range2.min + range2.max) / 2

    const tolerance = 0.2 // 20% tolerance
    return (
      Math.abs(range1Mid - range2Mid) <=
      Math.max(range1Mid, range2Mid) * tolerance
    )
  }

  /**
   * Generate alternative offer strategies
   */
  private async generateAlternativeOfferStrategies(
    similarContexts: NegotiationRecord[],
    context: NegotiationContext
  ): Promise<StrategyRecommendation['alternatives']> {
    const alternatives: StrategyRecommendation['alternatives'] = []

    // Analyze different offer percentage brackets
    const brackets = [
      { min: 85, max: 90, label: 'aggressive' },
      { min: 90, max: 95, label: 'moderate' },
      { min: 95, max: 100, label: 'conservative' },
    ]

    for (const bracket of brackets) {
      const bracketRecords = similarContexts.filter(
        record =>
          record.strategy.initialOfferPercentage >= bracket.min &&
          record.strategy.initialOfferPercentage < bracket.max
      )

      if (bracketRecords.length > 0) {
        const successRate =
          bracketRecords.filter(r => r.outcome?.successful).length /
          bracketRecords.length
        alternatives.push({
          strategy: `${bracket.label}_offer`,
          expectedSuccessRate: successRate,
          reasoning: `${bracket.label} approach (${bracket.min}-${bracket.max}% of asking price)`,
        })
      }
    }

    return alternatives
  }

  /**
   * Calculate consistency of values (lower variance = higher consistency)
   */
  private calculateConsistency(values: number[]): number {
    if (values.length === 0) return 0

    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
      values.length

    // Convert variance to consistency score (0-1, higher is more consistent)
    const maxVariance = 100 // Assume max variance of 100 for percentage values
    return Math.max(0, 1 - variance / maxVariance)
  }

  /**
   * Check data sufficiency for recommendations
   */
  private async checkDataSufficiency(
    agentId: string,
    analytics: SuccessRateAnalytics
  ): Promise<{
    sufficient: boolean
    dataPoints: number
    message: string
  }> {
    const dataPoints = analytics.totalNegotiations
    const sufficient = dataPoints >= this.MIN_DATA_POINTS

    return {
      sufficient,
      dataPoints,
      message: sufficient
        ? `Sufficient data (${dataPoints} negotiations) for personalized recommendations`
        : `Limited data (${dataPoints} negotiations) - using general best practices`,
    }
  }

  /**
   * Generate cache key for recommendations
   */
  private generateCacheKey(
    agentId: string,
    context: NegotiationContext
  ): string {
    const contextString = JSON.stringify({
      propertyType: context.propertyType,
      marketConditions: context.marketConditions,
      multipleOffers: context.multipleOffers,
      priceRange: context.priceRange,
    })

    return `recommendations_${agentId}_${btoa(contextString).slice(0, 32)}`
  }

  /**
   * Clear recommendations cache for agent
   */
  public async clearCache(agentId: string): Promise<void> {
    try {
      const { invalidateAnalyticsCache } = await import(
        '../firebase/collections/negotiation-analytics'
      )
      await invalidateAnalyticsCache(agentId)
      logger.info(`Cleared recommendations cache for agent: ${agentId}`)
    } catch (error) {
      logger.error('Failed to clear recommendations cache:', error)
      throw error
    }
  }

  /**
   * Get minimum data requirements
   */
  public getMinimumDataRequirements(): {
    minimal: number
    optimal: number
    confidenceThreshold: number
  } {
    return {
      minimal: this.MIN_DATA_POINTS,
      optimal: this.OPTIMAL_DATA_POINTS,
      confidenceThreshold: this.CONFIDENCE_THRESHOLD,
    }
  }
}

// Export singleton instance
export const strategyRecommender = StrategyRecommender.getInstance()
