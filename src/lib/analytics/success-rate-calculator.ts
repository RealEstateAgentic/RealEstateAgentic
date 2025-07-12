import type {
  NegotiationRecord,
  SuccessRateAnalytics,
  StrategySuccessRate,
  PropertyTypeSuccessRate,
  MarketConditionSuccessRate,
  PriceRangeSuccessRate,
  CompetitiveSuccessRate,
  PerformanceTrend,
  AnalyticsQuery,
  AnalyticsResponse,
  NegotiationAnalyticsResponse,
} from '../../shared/types/analytics'
import {
  getNegotiationRecords,
  getCachedAnalytics,
  setCachedAnalytics,
  storeAgentAnalytics,
} from '../firebase/collections/negotiation-analytics'
import { auth } from '../firebase'
import { logger } from '../../main/utils/logger'

/**
 * Success Rate Calculator Service
 *
 * Analyzes negotiation data to calculate success rates, generate insights,
 * and provide actionable recommendations for real estate agents.
 */
export class SuccessRateCalculator {
  private static instance: SuccessRateCalculator
  private readonly CACHE_DURATION_MINUTES = 60 // 1 hour cache
  private readonly MIN_DATA_POINTS = 5 // Minimum negotiations for reliable analysis

  private constructor() {}

  public static getInstance(): SuccessRateCalculator {
    if (!SuccessRateCalculator.instance) {
      SuccessRateCalculator.instance = new SuccessRateCalculator()
    }
    return SuccessRateCalculator.instance
  }

  // ========== MAIN ANALYTICS CALCULATION ==========

  /**
   * Calculate comprehensive success rate analytics for an agent
   */
  public async calculateSuccessRateAnalytics(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): Promise<NegotiationAnalyticsResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(agentId, query)
      const cachedResult = await getCachedAnalytics(cacheKey, agentId)

      if (cachedResult.success && cachedResult.data) {
        logger.info(`Using cached analytics for agent: ${agentId}`)
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

      // Build query for fetching negotiation records
      const analyticsQuery: AnalyticsQuery = {
        agentId,
        dateRange: query?.dateRange || {
          startDate: new Date(
            Date.now() - 90 * 24 * 60 * 60 * 1000
          ).toISOString(), // 90 days ago
          endDate: new Date().toISOString(),
        },
        filters: query?.filters,
        groupBy: query?.groupBy,
        sortBy: query?.sortBy || 'createdAt',
        limit: query?.limit || 1000,
      }

      // Fetch negotiation records
      const recordsResponse = await getNegotiationRecords(analyticsQuery)

      if (!recordsResponse.success || !recordsResponse.data) {
        return {
          success: false,
          error: recordsResponse.error || 'Failed to fetch negotiation records',
        }
      }

      const records = recordsResponse.data
      const totalRecords = records.length

      // Filter records based on criteria
      const filteredRecords = this.filterRecords(records, query?.filters)
      const filteredCount = filteredRecords.length

      // Check minimum data requirements
      if (filteredCount < this.MIN_DATA_POINTS) {
        logger.warn(
          `Insufficient data for reliable analysis: ${filteredCount} records (minimum: ${this.MIN_DATA_POINTS})`
        )
      }

      // Calculate analytics
      const analytics = await this.computeAnalytics(
        filteredRecords,
        analyticsQuery
      )

      const calculationTime = Date.now() - startTime

      // Cache the results
      await setCachedAnalytics(
        cacheKey,
        agentId,
        analytics,
        this.CACHE_DURATION_MINUTES
      )

      // Store in agent analytics collection
      await storeAgentAnalytics(agentId, analytics)

      logger.info(
        `Calculated analytics for agent ${agentId}: ${filteredCount} records processed in ${calculationTime}ms`
      )

      return {
        success: true,
        data: analytics,
        metadata: {
          totalRecords,
          filteredRecords: filteredCount,
          calculationTime,
          cacheStatus: 'miss',
        },
      }
    } catch (error) {
      logger.error('Failed to calculate success rate analytics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== CORE COMPUTATION METHODS ==========

  /**
   * Compute comprehensive analytics from filtered records
   */
  private async computeAnalytics(
    records: NegotiationRecord[],
    query: AnalyticsQuery
  ): Promise<SuccessRateAnalytics> {
    const totalNegotiations = records.length
    const successfulNegotiations = records.filter(
      r => r.outcome?.successful
    ).length
    const overallSuccessRate =
      totalNegotiations > 0 ? successfulNegotiations / totalNegotiations : 0

    return {
      agentId: query.agentId,
      totalNegotiations,
      successfulNegotiations,
      overallSuccessRate,
      byStrategy: await this.calculateStrategySuccessRates(records),
      byPropertyType: this.calculatePropertyTypeSuccessRates(records),
      byMarketConditions: this.calculateMarketConditionSuccessRates(records),
      byPriceRange: this.calculatePriceRangeSuccessRates(records),
      byCompetitiveEnvironment: this.calculateCompetitiveSuccessRates(records),
      trends: this.calculatePerformanceTrends(records),
      calculatedAt: new Date().toISOString(),
      dataRange: {
        startDate: query.dateRange?.startDate || '',
        endDate: query.dateRange?.endDate || '',
        totalRecords: totalNegotiations,
      },
    }
  }

  /**
   * Calculate success rates by strategy type
   */
  private async calculateStrategySuccessRates(
    records: NegotiationRecord[]
  ): Promise<StrategySuccessRate[]> {
    const strategyGroups = new Map<string, NegotiationRecord[]>()

    // Group records by primary strategy
    for (const record of records) {
      if (record.strategy?.communicationTone) {
        const key = `communication_${record.strategy.communicationTone}`
        if (!strategyGroups.has(key)) {
          strategyGroups.set(key, [])
        }
        const group = strategyGroups.get(key)
        if (group) {
          group.push(record)
        }
      }

      // Group by offer position
      if (record.strategy?.offerPosition) {
        const key = `offer_position_${record.strategy.offerPosition}`
        if (!strategyGroups.has(key)) {
          strategyGroups.set(key, [])
        }
        const group = strategyGroups.get(key)
        if (group) {
          group.push(record)
        }
      }

      // Group by escalation clause usage
      if (record.strategy?.escalationClause?.used !== undefined) {
        const key = `escalation_${record.strategy.escalationClause.used}`
        if (!strategyGroups.has(key)) {
          strategyGroups.set(key, [])
        }
        const group = strategyGroups.get(key)
        if (group) {
          group.push(record)
        }
      }

      // Group by cover letter usage
      if (record.strategy?.coverLetterUsed !== undefined) {
        const key = `cover_letter_${record.strategy.coverLetterUsed}`
        if (!strategyGroups.has(key)) {
          strategyGroups.set(key, [])
        }
        const group = strategyGroups.get(key)
        if (group) {
          group.push(record)
        }
      }
    }

    const strategySuccessRates: StrategySuccessRate[] = []

    for (const [strategyKey, strategyRecords] of strategyGroups) {
      const [strategyType, strategyValue] = strategyKey.split('_', 2)
      const totalAttempts = strategyRecords.length
      const successfulAttempts = strategyRecords.filter(
        r => r.outcome?.successful
      ).length
      const successRate =
        totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

      // Calculate averages
      const completedRecords = strategyRecords.filter(
        r => r.outcome?.finalPrice
      )
      const averageDaysToClose =
        completedRecords.length > 0
          ? completedRecords.reduce(
              (sum, r) => sum + (r.outcome?.daysToAcceptance || 0),
              0
            ) / completedRecords.length
          : undefined

      const averageFinalPrice =
        completedRecords.length > 0
          ? completedRecords.reduce(
              (sum, r) => sum + (r.outcome?.finalPrice || 0),
              0
            ) / completedRecords.length
          : undefined

      // Calculate confidence based on sample size
      const confidence = Math.min(totalAttempts / 20, 1) // Full confidence at 20+ samples

      strategySuccessRates.push({
        strategyType,
        strategyValue,
        totalAttempts,
        successfulAttempts,
        successRate,
        averageDaysToClose,
        averageFinalPrice,
        confidence,
      })
    }

    // Sort by success rate descending
    return strategySuccessRates.sort((a, b) => b.successRate - a.successRate)
  }

  /**
   * Calculate success rates by property type
   */
  private calculatePropertyTypeSuccessRates(
    records: NegotiationRecord[]
  ): PropertyTypeSuccessRate[] {
    const propertyGroups = new Map<string, NegotiationRecord[]>()

    for (const record of records) {
      const propertyType = record.context?.propertyType || 'unknown'
      if (!propertyGroups.has(propertyType)) {
        propertyGroups.set(propertyType, [])
      }
      const group = propertyGroups.get(propertyType)
      if (group) {
        group.push(record)
      }
    }

    const propertySuccessRates: PropertyTypeSuccessRate[] = []

    for (const [propertyType, propertyRecords] of propertyGroups) {
      const totalAttempts = propertyRecords.length
      const successfulAttempts = propertyRecords.filter(
        r => r.outcome?.successful
      ).length
      const successRate =
        totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

      // Calculate average offer percentage
      const recordsWithOffers = propertyRecords.filter(
        r =>
          r.strategy?.initialOfferPercentage &&
          r.strategy.initialOfferPercentage > 0
      )
      const averageOfferPercentage =
        recordsWithOffers.length > 0
          ? recordsWithOffers.reduce(
              (sum, r) => sum + (r.strategy?.initialOfferPercentage || 0),
              0
            ) / recordsWithOffers.length
          : undefined

      // Find most successful strategy
      const strategySuccess = new Map<
        string,
        { total: number; successful: number }
      >()
      for (const record of propertyRecords) {
        const strategy = record.strategy?.communicationTone || 'unknown'
        if (!strategySuccess.has(strategy)) {
          strategySuccess.set(strategy, { total: 0, successful: 0 })
        }
        const stats = strategySuccess.get(strategy)
        if (stats) {
          stats.total++
          if (record.outcome?.successful) stats.successful++
        }
      }

      let mostSuccessfulStrategy: string | undefined
      let bestRate = 0
      for (const [strategy, stats] of strategySuccess) {
        const rate = stats.total > 0 ? stats.successful / stats.total : 0
        if (rate > bestRate && stats.total >= 2) {
          // At least 2 samples
          bestRate = rate
          mostSuccessfulStrategy = strategy
        }
      }

      propertySuccessRates.push({
        propertyType,
        totalAttempts,
        successfulAttempts,
        successRate,
        averageOfferPercentage,
        mostSuccessfulStrategy,
      })
    }

    return propertySuccessRates.sort((a, b) => b.successRate - a.successRate)
  }

  /**
   * Calculate success rates by market conditions
   */
  private calculateMarketConditionSuccessRates(
    records: NegotiationRecord[]
  ): MarketConditionSuccessRate[] {
    const marketGroups = new Map<string, NegotiationRecord[]>()

    records.forEach(record => {
      const marketCondition = record.context?.marketConditions || 'unknown'
      if (!marketGroups.has(marketCondition)) {
        marketGroups.set(marketCondition, [])
      }
      marketGroups.get(marketCondition)!.push(record)
    })

    const marketSuccessRates: MarketConditionSuccessRate[] = []

    for (const [marketCondition, marketRecords] of marketGroups) {
      const totalAttempts = marketRecords.length
      const successfulAttempts = marketRecords.filter(
        r => r.outcome?.successful
      ).length
      const successRate =
        totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

      // Calculate average days to close
      const completedRecords = marketRecords.filter(
        r => r.outcome?.daysToAcceptance
      )
      const averageDaysToClose =
        completedRecords.length > 0
          ? completedRecords.reduce(
              (sum, r) => sum + (r.outcome?.daysToAcceptance || 0),
              0
            ) / completedRecords.length
          : undefined

      // Recommend strategy based on success rates
      const strategySuccess = new Map<
        string,
        { total: number; successful: number }
      >()
      marketRecords.forEach(record => {
        const strategy = record.strategy?.communicationTone || 'professional'
        if (!strategySuccess.has(strategy)) {
          strategySuccess.set(strategy, { total: 0, successful: 0 })
        }
        const stats = strategySuccess.get(strategy)!
        stats.total++
        if (record.outcome?.successful) stats.successful++
      })

      let recommendedStrategy: string | undefined
      let bestRate = 0
      for (const [strategy, stats] of strategySuccess) {
        const rate = stats.total > 0 ? stats.successful / stats.total : 0
        if (rate > bestRate && stats.total >= 2) {
          bestRate = rate
          recommendedStrategy = strategy
        }
      }

      marketSuccessRates.push({
        marketCondition: marketCondition as 'hot' | 'warm' | 'cool',
        totalAttempts,
        successfulAttempts,
        successRate,
        averageDaysToClose,
        recommendedStrategy,
      })
    }

    return marketSuccessRates.sort((a, b) => b.successRate - a.successRate)
  }

  /**
   * Calculate success rates by price range
   */
  private calculatePriceRangeSuccessRates(
    records: NegotiationRecord[]
  ): PriceRangeSuccessRate[] {
    const priceRanges = [
      { min: 0, max: 300000, label: 'Under $300K' },
      { min: 300000, max: 500000, label: '$300K-$500K' },
      { min: 500000, max: 750000, label: '$500K-$750K' },
      { min: 750000, max: 1000000, label: '$750K-$1M' },
      { min: 1000000, max: Infinity, label: 'Above $1M' },
    ]

    return priceRanges
      .map(range => {
        const rangeRecords = records.filter(record => {
          const price = record.context?.priceRange?.min || 0
          return price >= range.min && price < range.max
        })

        const totalAttempts = rangeRecords.length
        const successfulAttempts = rangeRecords.filter(
          r => r.outcome?.successful
        ).length
        const successRate =
          totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

        // Calculate average offer percentage
        const recordsWithOffers = rangeRecords.filter(
          r =>
            r.strategy?.initialOfferPercentage &&
            r.strategy.initialOfferPercentage > 0
        )
        const averageOfferPercentage =
          recordsWithOffers.length > 0
            ? recordsWithOffers.reduce(
                (sum, r) => sum + (r.strategy?.initialOfferPercentage || 0),
                0
              ) / recordsWithOffers.length
            : undefined

        // Find most effective strategy
        const strategySuccess = new Map<
          string,
          { total: number; successful: number }
        >()
        rangeRecords.forEach(record => {
          const strategy = record.strategy?.communicationTone || 'professional'
          if (!strategySuccess.has(strategy)) {
            strategySuccess.set(strategy, { total: 0, successful: 0 })
          }
          const stats = strategySuccess.get(strategy)!
          stats.total++
          if (record.outcome?.successful) stats.successful++
        })

        let mostEffectiveStrategy: string | undefined
        let bestRate = 0
        for (const [strategy, stats] of strategySuccess) {
          const rate = stats.total > 0 ? stats.successful / stats.total : 0
          if (rate > bestRate && stats.total >= 2) {
            bestRate = rate
            mostEffectiveStrategy = strategy
          }
        }

        return {
          priceRange: range,
          totalAttempts,
          successfulAttempts,
          successRate,
          averageOfferPercentage,
          mostEffectiveStrategy,
        }
      })
      .filter(range => range.totalAttempts > 0)
  }

  /**
   * Calculate success rates by competitive environment
   */
  private calculateCompetitiveSuccessRates(
    records: NegotiationRecord[]
  ): CompetitiveSuccessRate[] {
    const competitiveGroups = new Map<string, NegotiationRecord[]>()

    records.forEach(record => {
      const multipleOffers = record.context?.multipleOffers || false
      const key = multipleOffers ? 'multiple_offers' : 'single_offer'
      if (!competitiveGroups.has(key)) {
        competitiveGroups.set(key, [])
      }
      competitiveGroups.get(key)!.push(record)
    })

    const competitiveSuccessRates: CompetitiveSuccessRate[] = []

    for (const [competitiveType, competitiveRecords] of competitiveGroups) {
      const multipleOffers = competitiveType === 'multiple_offers'
      const totalAttempts = competitiveRecords.length
      const successfulAttempts = competitiveRecords.filter(
        r => r.outcome?.successful
      ).length
      const successRate =
        totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

      // Calculate average competing offers
      const recordsWithCompetition = competitiveRecords.filter(
        r => r.context?.competingOffers !== undefined
      )
      const averageCompetingOffers =
        recordsWithCompetition.length > 0
          ? recordsWithCompetition.reduce(
              (sum, r) => sum + (r.context?.competingOffers || 0),
              0
            ) / recordsWithCompetition.length
          : 0

      // Identify winning factors
      const winningFactors: string[] = []
      const successfulRecords = competitiveRecords.filter(
        r => r.outcome?.successful
      )

      // Analyze successful strategies
      const strategyCounts = new Map<string, number>()
      successfulRecords.forEach(record => {
        if (record.strategy?.escalationClause?.used)
          strategyCounts.set(
            'escalation_clause',
            (strategyCounts.get('escalation_clause') || 0) + 1
          )
        if (record.strategy?.coverLetterUsed)
          strategyCounts.set(
            'cover_letter',
            (strategyCounts.get('cover_letter') || 0) + 1
          )
        if (record.strategy?.personalStoryIncluded)
          strategyCounts.set(
            'personal_story',
            (strategyCounts.get('personal_story') || 0) + 1
          )
        if (record.strategy?.tactics?.quickClose)
          strategyCounts.set(
            'quick_close',
            (strategyCounts.get('quick_close') || 0) + 1
          )
        if (record.strategy?.tactics?.asIsOffer)
          strategyCounts.set(
            'as_is_offer',
            (strategyCounts.get('as_is_offer') || 0) + 1
          )
      })

      // Add factors that appear in >50% of successful cases
      const threshold = Math.max(1, successfulRecords.length * 0.5)
      for (const [factor, count] of strategyCounts) {
        if (count >= threshold) {
          winningFactors.push(factor.replace('_', ' '))
        }
      }

      competitiveSuccessRates.push({
        multipleOffers,
        averageCompetingOffers,
        totalAttempts,
        successfulAttempts,
        successRate,
        winningFactors,
      })
    }

    return competitiveSuccessRates
  }

  /**
   * Calculate performance trends over time
   */
  private calculatePerformanceTrends(
    records: NegotiationRecord[]
  ): PerformanceTrend[] {
    // Group records by month
    const monthlyGroups = new Map<string, NegotiationRecord[]>()

    records.forEach(record => {
      const date = new Date(record.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, [])
      }
      monthlyGroups.get(monthKey)!.push(record)
    })

    const trends: PerformanceTrend[] = []
    const sortedMonths = Array.from(monthlyGroups.keys()).sort()

    sortedMonths.forEach((monthKey, index) => {
      const monthRecords = monthlyGroups.get(monthKey)!
      const totalNegotiations = monthRecords.length
      const successfulNegotiations = monthRecords.filter(
        r => r.outcome?.successful
      ).length
      const successRate =
        totalNegotiations > 0 ? successfulNegotiations / totalNegotiations : 0

      // Calculate change from previous month
      let previousPeriodSuccessRate: number | undefined
      let changeFromPrevious: number | undefined
      let trend: 'improving' | 'stable' | 'declining' = 'stable'

      if (index > 0) {
        const previousMonthKey = sortedMonths[index - 1]
        const previousMonthRecords = monthlyGroups.get(previousMonthKey)!
        const prevTotal = previousMonthRecords.length
        const prevSuccessful = previousMonthRecords.filter(
          r => r.outcome?.successful
        ).length
        previousPeriodSuccessRate =
          prevTotal > 0 ? prevSuccessful / prevTotal : 0
        changeFromPrevious = successRate - previousPeriodSuccessRate

        if (changeFromPrevious > 0.05)
          trend = 'improving' // 5% improvement
        else if (changeFromPrevious < -0.05) trend = 'declining' // 5% decline
      }

      // Find top strategy for the month
      const strategySuccess = new Map<
        string,
        { total: number; successful: number }
      >()
      monthRecords.forEach(record => {
        const strategy = record.strategy?.communicationTone || 'professional'
        if (!strategySuccess.has(strategy)) {
          strategySuccess.set(strategy, { total: 0, successful: 0 })
        }
        const stats = strategySuccess.get(strategy)!
        stats.total++
        if (record.outcome?.successful) stats.successful++
      })

      let topStrategy = 'professional'
      let topStrategySuccessRate = 0
      for (const [strategy, stats] of strategySuccess) {
        const rate = stats.total > 0 ? stats.successful / stats.total : 0
        if (rate > topStrategySuccessRate && stats.total >= 1) {
          topStrategySuccessRate = rate
          topStrategy = strategy
        }
      }

      trends.push({
        period: monthKey,
        periodType: 'month',
        totalNegotiations,
        successfulNegotiations,
        successRate,
        previousPeriodSuccessRate,
        changeFromPrevious,
        trend,
        topStrategy,
        topStrategySuccessRate,
        marketConditions: this.getMostCommonMarketCondition(monthRecords),
      })
    })

    return trends
  }

  // ========== UTILITY METHODS ==========

  /**
   * Filter records based on provided criteria
   */
  private filterRecords(
    records: NegotiationRecord[],
    filters?: AnalyticsQuery['filters']
  ): NegotiationRecord[] {
    if (!filters) return records

    return records.filter(record => {
      // Filter by property types
      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        const propertyType = record.context?.propertyType
        if (!propertyType || !filters.propertyTypes.includes(propertyType)) {
          return false
        }
      }

      // Filter by market conditions
      if (filters.marketConditions && filters.marketConditions.length > 0) {
        const marketCondition = record.context?.marketConditions
        if (
          !marketCondition ||
          !filters.marketConditions.includes(marketCondition)
        ) {
          return false
        }
      }

      // Filter by price ranges
      if (filters.priceRanges && filters.priceRanges.length > 0) {
        const recordPrice = record.context?.priceRange?.min || 0
        const matchesRange = filters.priceRanges.some(
          range => recordPrice >= range.min && recordPrice < range.max
        )
        if (!matchesRange) {
          return false
        }
      }

      // Filter by success status
      if (filters.successful !== undefined) {
        const isSuccessful = record.outcome?.successful || false
        if (isSuccessful !== filters.successful) {
          return false
        }
      }

      // Filter by strategy types
      if (filters.strategyTypes && filters.strategyTypes.length > 0) {
        const matchesStrategy = filters.strategyTypes.some(strategyType => {
          switch (strategyType) {
            case 'communication_tone':
              return record.strategy?.communicationTone !== undefined
            case 'offer_position':
              return record.strategy?.offerPosition !== undefined
            case 'escalation_clause':
              return record.strategy?.escalationClause?.used === true
            case 'cover_letter':
              return record.strategy?.coverLetterUsed === true
            case 'personal_story':
              return record.strategy?.personalStoryIncluded === true
            case 'quick_close':
              return record.strategy?.tactics?.quickClose === true
            case 'as_is_offer':
              return record.strategy?.tactics?.asIsOffer === true
            default:
              return false
          }
        })
        if (!matchesStrategy) {
          return false
        }
      }

      // Filter by specific strategy values
      if (filters.strategyValues && filters.strategyValues.length > 0) {
        const matchesValue = filters.strategyValues.some(value => {
          return (
            record.strategy?.communicationTone === value ||
            record.strategy?.offerPosition === value ||
            (value === 'escalation_used' &&
              record.strategy?.escalationClause?.used) ||
            (value === 'cover_letter_used' &&
              record.strategy?.coverLetterUsed) ||
            (value === 'personal_story_included' &&
              record.strategy?.personalStoryIncluded)
          )
        })
        if (!matchesValue) {
          return false
        }
      }

      // Filter by competitive environment
      if (filters.competitiveEnvironment !== undefined) {
        const hasMultipleOffers = record.context?.multipleOffers || false
        if (hasMultipleOffers !== filters.competitiveEnvironment) {
          return false
        }
      }

      // Filter by date range (additional to the main query date range)
      if (filters.dateRange) {
        const recordDate = new Date(record.createdAt)
        const startDate = new Date(filters.dateRange.startDate)
        const endDate = new Date(filters.dateRange.endDate)

        if (recordDate < startDate || recordDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Generate cache key for analytics results
   */
  private generateCacheKey(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): string {
    const queryString = JSON.stringify({
      agentId,
      dateRange: query?.dateRange,
      filters: query?.filters,
      groupBy: query?.groupBy,
      sortBy: query?.sortBy,
    })

    return `analytics_${agentId}_${btoa(queryString).slice(0, 32)}`
  }

  /**
   * Get most common market condition from records
   */
  private getMostCommonMarketCondition(records: NegotiationRecord[]): string {
    const conditionCounts = new Map<string, number>()

    records.forEach(record => {
      const condition = record.context?.marketConditions || 'unknown'
      conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1)
    })

    let mostCommon = 'unknown'
    let maxCount = 0
    for (const [condition, count] of conditionCounts) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = condition
      }
    }

    return mostCommon
  }

  // ========== REPORT GENERATION METHODS ==========

  /**
   * Generate strategy effectiveness report
   */
  public async generateStrategyEffectivenessReport(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): Promise<AnalyticsResponse<AnalyticsReport>> {
    try {
      const analytics = await this.calculateSuccessRateAnalytics(agentId, query)

      if (!analytics.success || !analytics.data) {
        return {
          success: false,
          error: analytics.error || 'Failed to calculate analytics',
        }
      }

      const topStrategies = analytics.data.byStrategy
        .slice(0, 5)
        .map(strategy => ({
          strategy: `${strategy.strategyType}: ${strategy.strategyValue}`,
          successRate: Math.round(strategy.successRate * 100),
          totalAttempts: strategy.totalAttempts,
          confidence: Math.round(strategy.confidence * 100),
        }))

      const report: AnalyticsReport = {
        id: `strategy-effectiveness-${Date.now()}`,
        agentId,
        reportType: 'strategy_breakdown',
        title: 'Strategy Effectiveness Report',
        summary: `Analysis of ${analytics.data.totalNegotiations} negotiations showing top-performing strategies`,
        keyInsights: [
          `Overall success rate: ${Math.round(analytics.data.overallSuccessRate * 100)}%`,
          `Top strategy: ${topStrategies[0]?.strategy || 'N/A'} (${topStrategies[0]?.successRate || 0}% success rate)`,
          `Most consistent strategy: ${topStrategies.find(s => s.confidence > 80)?.strategy || 'Needs more data'}`,
          `Analyzed ${analytics.data.totalNegotiations} negotiations with ${analytics.data.successfulNegotiations} successful outcomes`,
        ],
        data: {
          topStrategies,
          strategySummary: analytics.data.byStrategy,
          recommendations: this.generateStrategyRecommendations(
            analytics.data.byStrategy
          ),
        },
        filters: {
          dateRange: {
            startDate:
              query?.dateRange?.startDate || analytics.data.dataRange.startDate,
            endDate:
              query?.dateRange?.endDate || analytics.data.dataRange.endDate,
          },
          propertyTypes: query?.filters?.propertyTypes,
          marketConditions: query?.filters?.marketConditions,
          priceRanges: query?.filters?.priceRanges,
        },
        generatedAt: new Date().toISOString(),
        dataAsOf: analytics.data.calculatedAt,
      }

      return {
        success: true,
        data: report,
      }
    } catch (error) {
      logger.error('Failed to generate strategy effectiveness report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate performance trends report
   */
  public async generatePerformanceTrendsReport(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): Promise<AnalyticsResponse<AnalyticsReport>> {
    try {
      const analytics = await this.calculateSuccessRateAnalytics(agentId, query)

      if (!analytics.success || !analytics.data) {
        return {
          success: false,
          error: analytics.error || 'Failed to calculate analytics',
        }
      }

      const recentTrends = analytics.data.trends.slice(-6) // Last 6 months
      const trendDirection = this.analyzeTrendDirection(recentTrends)
      const performanceChange = this.calculatePerformanceChange(recentTrends)

      const report: AnalyticsReport = {
        id: `performance-trends-${Date.now()}`,
        agentId,
        reportType: 'performance_trends',
        title: 'Performance Trends Report',
        summary: `${recentTrends.length}-month performance analysis showing ${trendDirection} trend`,
        keyInsights: [
          `Current trend: ${trendDirection}`,
          `Performance change: ${performanceChange}`,
          `Recent success rate: ${Math.round((recentTrends[recentTrends.length - 1]?.successRate || 0) * 100)}%`,
          `Best performing month: ${this.findBestPerformingPeriod(recentTrends)}`,
        ],
        data: {
          trends: recentTrends,
          trendAnalysis: {
            direction: trendDirection,
            performanceChange,
            consistency: this.calculateConsistency(recentTrends),
          },
          monthlyBreakdown: recentTrends.map(trend => ({
            period: trend.period,
            successRate: Math.round(trend.successRate * 100),
            negotiations: trend.totalNegotiations,
            topStrategy: trend.topStrategy,
          })),
        },
        filters: {
          dateRange: {
            startDate:
              query?.dateRange?.startDate || analytics.data.dataRange.startDate,
            endDate:
              query?.dateRange?.endDate || analytics.data.dataRange.endDate,
          },
          propertyTypes: query?.filters?.propertyTypes,
          marketConditions: query?.filters?.marketConditions,
          priceRanges: query?.filters?.priceRanges,
        },
        generatedAt: new Date().toISOString(),
        dataAsOf: analytics.data.calculatedAt,
      }

      return {
        success: true,
        data: report,
      }
    } catch (error) {
      logger.error('Failed to generate performance trends report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate market analysis report
   */
  public async generateMarketAnalysisReport(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): Promise<AnalyticsResponse<AnalyticsReport>> {
    try {
      const analytics = await this.calculateSuccessRateAnalytics(agentId, query)

      if (!analytics.success || !analytics.data) {
        return {
          success: false,
          error: analytics.error || 'Failed to calculate analytics',
        }
      }

      const marketPerformance = analytics.data.byMarketConditions
      const priceRangePerformance = analytics.data.byPriceRange
      const competitivePerformance = analytics.data.byCompetitiveEnvironment

      const report: AnalyticsReport = {
        id: `market-analysis-${Date.now()}`,
        agentId,
        reportType: 'strategy_breakdown',
        title: 'Market Analysis Report',
        summary: `Market conditions analysis across ${analytics.data.totalNegotiations} negotiations`,
        keyInsights: [
          `Best market condition: ${marketPerformance[0]?.marketCondition || 'N/A'} (${Math.round((marketPerformance[0]?.successRate || 0) * 100)}% success rate)`,
          `Most profitable price range: ${priceRangePerformance[0]?.priceRange?.label || 'N/A'}`,
          `Competitive environment performance: ${competitivePerformance.find(c => c.multipleOffers)?.successRate ? Math.round(competitivePerformance.find(c => c.multipleOffers)!.successRate * 100) : 0}% in multiple offer situations`,
          `Single offer success rate: ${competitivePerformance.find(c => !c.multipleOffers)?.successRate ? Math.round(competitivePerformance.find(c => !c.multipleOffers)!.successRate * 100) : 0}%`,
        ],
        data: {
          marketConditions: marketPerformance,
          priceRanges: priceRangePerformance,
          competitiveEnvironment: competitivePerformance,
          marketRecommendations: this.generateMarketRecommendations(
            marketPerformance,
            priceRangePerformance
          ),
        },
        filters: {
          dateRange: {
            startDate:
              query?.dateRange?.startDate || analytics.data.dataRange.startDate,
            endDate:
              query?.dateRange?.endDate || analytics.data.dataRange.endDate,
          },
          propertyTypes: query?.filters?.propertyTypes,
          marketConditions: query?.filters?.marketConditions,
          priceRanges: query?.filters?.priceRanges,
        },
        generatedAt: new Date().toISOString(),
        dataAsOf: analytics.data.calculatedAt,
      }

      return {
        success: true,
        data: report,
      }
    } catch (error) {
      logger.error('Failed to generate market analysis report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate executive summary report
   */
  public async generateExecutiveSummaryReport(
    agentId: string,
    query?: Partial<AnalyticsQuery>
  ): Promise<AnalyticsResponse<AnalyticsReport>> {
    try {
      const analytics = await this.calculateSuccessRateAnalytics(agentId, query)

      if (!analytics.success || !analytics.data) {
        return {
          success: false,
          error: analytics.error || 'Failed to calculate analytics',
        }
      }

      const topStrategy = analytics.data.byStrategy[0]
      const recentTrend =
        analytics.data.trends[analytics.data.trends.length - 1]
      const topPropertyType = analytics.data.byPropertyType[0]

      const report: AnalyticsReport = {
        id: `executive-summary-${Date.now()}`,
        agentId,
        reportType: 'top_strategies',
        title: 'Executive Summary Report',
        summary: `Comprehensive overview of negotiation performance and key insights`,
        keyInsights: [
          `Overall success rate: ${Math.round(analytics.data.overallSuccessRate * 100)}% (${analytics.data.successfulNegotiations}/${analytics.data.totalNegotiations} negotiations)`,
          `Top performing strategy: ${topStrategy?.strategyType || 'N/A'} - ${topStrategy?.strategyValue || 'N/A'}`,
          `Best property type: ${topPropertyType?.propertyType || 'N/A'} (${Math.round((topPropertyType?.successRate || 0) * 100)}% success rate)`,
          `Recent trend: ${recentTrend?.trend || 'stable'} (${recentTrend?.period || 'N/A'})`,
        ],
        data: {
          overallStats: {
            totalNegotiations: analytics.data.totalNegotiations,
            successfulNegotiations: analytics.data.successfulNegotiations,
            successRate: Math.round(analytics.data.overallSuccessRate * 100),
          },
          topPerformers: {
            strategy: topStrategy,
            propertyType: topPropertyType,
            marketCondition: analytics.data.byMarketConditions[0],
          },
          recentPerformance: recentTrend,
          quickStats: {
            avgDaysToClose: this.calculateAverageMetric(
              analytics.data.byStrategy,
              'averageDaysToClose'
            ),
            avgFinalPrice: this.calculateAverageMetric(
              analytics.data.byStrategy,
              'averageFinalPrice'
            ),
            highestConfidenceStrategy:
              analytics.data.byStrategy.find(s => s.confidence > 0.8)
                ?.strategyType || 'Need more data',
          },
        },
        filters: {
          dateRange: {
            startDate:
              query?.dateRange?.startDate || analytics.data.dataRange.startDate,
            endDate:
              query?.dateRange?.endDate || analytics.data.dataRange.endDate,
          },
          propertyTypes: query?.filters?.propertyTypes,
          marketConditions: query?.filters?.marketConditions,
          priceRanges: query?.filters?.priceRanges,
        },
        generatedAt: new Date().toISOString(),
        dataAsOf: analytics.data.calculatedAt,
      }

      return {
        success: true,
        data: report,
      }
    } catch (error) {
      logger.error('Failed to generate executive summary report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== REPORT HELPER METHODS ==========

  /**
   * Generate strategy recommendations based on performance data
   */
  private generateStrategyRecommendations(
    strategies: StrategySuccessRate[]
  ): string[] {
    const recommendations: string[] = []

    const topStrategy = strategies[0]
    if (topStrategy && topStrategy.confidence > 0.7) {
      recommendations.push(
        `Continue using ${topStrategy.strategyType} with ${topStrategy.strategyValue} - highest success rate at ${Math.round(topStrategy.successRate * 100)}%`
      )
    }

    const underperformingStrategies = strategies.filter(
      s => s.successRate < 0.3 && s.totalAttempts > 2
    )
    if (underperformingStrategies.length > 0) {
      recommendations.push(
        `Consider avoiding ${underperformingStrategies[0].strategyType} with ${underperformingStrategies[0].strategyValue} - low success rate`
      )
    }

    const inconsistentStrategies = strategies.filter(s => s.confidence < 0.5)
    if (inconsistentStrategies.length > 0) {
      recommendations.push(
        `Gather more data on ${inconsistentStrategies[0].strategyType} strategies to improve confidence`
      )
    }

    return recommendations
  }

  /**
   * Generate market-specific recommendations
   */
  private generateMarketRecommendations(
    marketPerformance: MarketConditionSuccessRate[],
    priceRangePerformance: PriceRangeSuccessRate[]
  ): string[] {
    const recommendations: string[] = []

    const bestMarket = marketPerformance[0]
    if (bestMarket) {
      recommendations.push(
        `Focus on ${bestMarket.marketCondition} market conditions where you have ${Math.round(bestMarket.successRate * 100)}% success rate`
      )
    }

    const bestPriceRange = priceRangePerformance[0]
    if (bestPriceRange) {
      recommendations.push(
        `Your strongest performance is in the ${bestPriceRange.priceRange.label} price range`
      )
    }

    return recommendations
  }

  /**
   * Analyze trend direction from recent performance
   */
  private analyzeTrendDirection(
    trends: PerformanceTrend[]
  ): 'improving' | 'stable' | 'declining' {
    if (trends.length < 2) return 'stable'

    const recentTrends = trends.slice(-3)
    const improvingCount = recentTrends.filter(
      t => t.trend === 'improving'
    ).length
    const decliningCount = recentTrends.filter(
      t => t.trend === 'declining'
    ).length

    if (improvingCount > decliningCount) return 'improving'
    if (decliningCount > improvingCount) return 'declining'
    return 'stable'
  }

  /**
   * Calculate overall performance change
   */
  private calculatePerformanceChange(trends: PerformanceTrend[]): string {
    if (trends.length < 2) return 'No comparison available'

    const first = trends[0]
    const last = trends[trends.length - 1]
    const change = last.successRate - first.successRate
    const changePercent = Math.round(change * 100)

    if (changePercent > 0) return `+${changePercent}% improvement`
    if (changePercent < 0) return `${changePercent}% decline`
    return '0% change'
  }

  /**
   * Find best performing period
   */
  private findBestPerformingPeriod(trends: PerformanceTrend[]): string {
    if (trends.length === 0) return 'No data available'

    const bestTrend = trends.reduce((best, current) =>
      current.successRate > best.successRate ? current : best
    )

    return `${bestTrend.period} (${Math.round(bestTrend.successRate * 100)}% success rate)`
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistency(trends: PerformanceTrend[]): number {
    if (trends.length === 0) return 0

    const rates = trends.map(t => t.successRate)
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    const variance =
      rates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) /
      rates.length

    return Math.max(0, 1 - variance * 10) // Scale variance to 0-1 consistency score
  }

  /**
   * Calculate average metric from strategy data
   */
  private calculateAverageMetric(
    strategies: StrategySuccessRate[],
    metric: 'averageDaysToClose' | 'averageFinalPrice'
  ): number | undefined {
    const validStrategies = strategies.filter(s => s[metric] !== undefined)
    if (validStrategies.length === 0) return undefined

    const sum = validStrategies.reduce(
      (total, s) => total + (s[metric] || 0),
      0
    )
    return sum / validStrategies.length
  }

  // ========== PUBLIC UTILITY METHODS ==========

  /**
   * Get minimum data requirements for reliable analysis
   */
  public getMinimumDataRequirements(): number {
    return this.MIN_DATA_POINTS
  }

  /**
   * Check if agent has sufficient data for analysis
   */
  public async checkDataSufficiency(agentId: string): Promise<{
    sufficient: boolean
    currentCount: number
    minimumRequired: number
    message: string
  }> {
    try {
      const query: AnalyticsQuery = {
        agentId,
        limit: this.MIN_DATA_POINTS + 1,
      }

      const recordsResponse = await getNegotiationRecords(query)
      const currentCount = recordsResponse.data?.length || 0
      const sufficient = currentCount >= this.MIN_DATA_POINTS

      return {
        sufficient,
        currentCount,
        minimumRequired: this.MIN_DATA_POINTS,
        message: sufficient
          ? 'Sufficient data available for reliable analytics'
          : `Need ${this.MIN_DATA_POINTS - currentCount} more completed negotiations for reliable analysis`,
      }
    } catch (error) {
      logger.error('Failed to check data sufficiency:', error)
      return {
        sufficient: false,
        currentCount: 0,
        minimumRequired: this.MIN_DATA_POINTS,
        message: 'Unable to check data sufficiency',
      }
    }
  }

  /**
   * Clear analytics cache for agent
   */
  public async clearCache(agentId: string): Promise<void> {
    try {
      const { invalidateAnalyticsCache } = await import(
        '../firebase/collections/negotiation-analytics'
      )
      await invalidateAnalyticsCache(agentId)
      logger.info(`Cleared analytics cache for agent: ${agentId}`)
    } catch (error) {
      logger.error('Failed to clear analytics cache:', error)
      throw error
    }
  }
}

// Export singleton instance
export const successRateCalculator = SuccessRateCalculator.getInstance()
