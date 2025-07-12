import { StrategyRecommender } from './strategy-recommender'
import {
  NegotiationRecord,
  NegotiationContext,
  StrategyRecommendation,
  SuccessRateAnalytics,
  RecommendationResponse,
  PriceRange,
} from '../../shared/types/analytics'

// Mock the dependencies
jest.mock('./success-rate-calculator', () => ({
  successRateCalculator: {
    calculateSuccessRateAnalytics: jest.fn(),
  },
}))

jest.mock('../firebase/collections/negotiation-analytics', () => ({
  getNegotiationRecords: jest.fn(),
  getCachedAnalytics: jest.fn(),
  setCachedAnalytics: jest.fn(),
  invalidateAnalyticsCache: jest.fn(),
}))

jest.mock('../../main/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Import mocked functions
import { successRateCalculator } from './success-rate-calculator'
import {
  getNegotiationRecords,
  getCachedAnalytics,
  setCachedAnalytics,
  invalidateAnalyticsCache,
} from '../firebase/collections/negotiation-analytics'

describe('StrategyRecommender', () => {
  let recommender: StrategyRecommender
  let mockContext: NegotiationContext
  let mockAnalytics: SuccessRateAnalytics
  let mockNegotiationRecords: NegotiationRecord[]

  beforeEach(() => {
    recommender = StrategyRecommender.getInstance()
    jest.clearAllMocks()

    // Mock context
    mockContext = {
      propertyType: 'single_family',
      priceRange: { min: 400000, max: 500000, label: '$400K-$500K' },
      daysOnMarket: 15,
      marketConditions: 'hot',
      marketTrend: 'rising',
      seasonality: 'spring',
      multipleOffers: true,
      competingOffers: 3,
      averageOfferPrice: 450000,
      location: {
        city: 'Seattle',
        state: 'WA',
        neighborhood: 'Capitol Hill',
        zipCode: '98102',
      },
      listingAgent: 'agent-2',
      buyerAgent: 'agent-1',
      transactionType: 'purchase',
    }

    // Mock analytics
    mockAnalytics = {
      agentId: 'agent-1',
      totalNegotiations: 15,
      successfulNegotiations: 10,
      overallSuccessRate: 0.67,
      byStrategy: [
        {
          strategyType: 'communication_tone',
          strategyValue: 'professional',
          totalAttempts: 8,
          successfulAttempts: 6,
          successRate: 0.75,
          averageDaysToClose: 10,
          averageFinalPrice: 450000,
          confidence: 0.8,
        },
        {
          strategyType: 'offer_position',
          strategyValue: 'below',
          totalAttempts: 10,
          successfulAttempts: 7,
          successRate: 0.7,
          averageDaysToClose: 12,
          averageFinalPrice: 445000,
          confidence: 0.85,
        },
      ],
      byPropertyType: [
        {
          propertyType: 'single_family',
          totalAttempts: 12,
          successfulAttempts: 8,
          successRate: 0.67,
          averageOfferPercentage: 95,
          mostSuccessfulStrategy: 'professional',
        },
      ],
      byMarketConditions: [
        {
          marketCondition: 'hot',
          totalAttempts: 8,
          successfulAttempts: 6,
          successRate: 0.75,
          averageDaysToClose: 8,
          recommendedStrategy: 'aggressive',
        },
      ],
      byPriceRange: [
        {
          priceRange: { min: 400000, max: 500000, label: '$400K-$500K' },
          totalAttempts: 6,
          successfulAttempts: 4,
          successRate: 0.67,
          averageOfferPercentage: 96,
          mostEffectiveStrategy: 'professional',
        },
      ],
      byCompetitiveEnvironment: [
        {
          multipleOffers: true,
          averageCompetingOffers: 3,
          totalAttempts: 8,
          successfulAttempts: 5,
          successRate: 0.625,
          winningFactors: ['escalation_clause', 'cover_letter'],
        },
      ],
      trends: [
        {
          period: '2024-01',
          periodType: 'month',
          totalNegotiations: 5,
          successfulNegotiations: 3,
          successRate: 0.6,
          changeFromPrevious: 0.1,
          trend: 'improving',
          topStrategy: 'professional',
          topStrategySuccessRate: 0.75,
          marketConditions: 'hot',
        },
      ],
      calculatedAt: '2024-01-15T10:00:00Z',
      dataRange: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T00:00:00Z',
        totalRecords: 15,
      },
    }

    // Mock negotiation records
    mockNegotiationRecords = [
      {
        id: 'record-1',
        agentId: 'agent-1',
        clientId: 'client-1',
        propertyId: 'prop-1',
        negotiationId: 'neg-1',
        strategy: {
          initialOfferPercentage: 95,
          offerPosition: 'below',
          escalationClause: { used: true, maxAmount: 10000 },
          contingencies: {
            inspection: true,
            financing: true,
            appraisal: true,
            saleOfHome: false,
            other: [],
          },
          communicationTone: 'professional',
          coverLetterUsed: true,
          personalStoryIncluded: false,
          tactics: {
            quickClose: false,
            asIsOffer: false,
            rentBack: false,
            flexibleClosing: true,
            extraDeposit: false,
            customTerms: [],
          },
          counterOfferPattern: {
            responsiveness: 'quick',
            concessionWillingness: 'medium',
            negotiationRounds: 2,
          },
        },
        context: mockContext,
        outcome: {
          successful: true,
          acceptedDate: '2024-01-15T10:00:00Z',
          finalPrice: 430000,
          finalTerms: {
            closingDate: '2024-02-15T10:00:00Z',
            contingencies: ['inspection', 'financing'],
            concessions: ['home_warranty'],
            modifications: [],
          },
          daysToAcceptance: 5,
          negotiationRounds: 2,
          chosenOverOffers: 3,
          clientSatisfaction: 'high',
        },
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        version: 1,
      },
      {
        id: 'record-2',
        agentId: 'agent-1',
        clientId: 'client-2',
        propertyId: 'prop-2',
        negotiationId: 'neg-2',
        strategy: {
          initialOfferPercentage: 90,
          offerPosition: 'below',
          escalationClause: { used: false },
          contingencies: {
            inspection: true,
            financing: true,
            appraisal: false,
            saleOfHome: false,
            other: [],
          },
          communicationTone: 'warm',
          coverLetterUsed: false,
          personalStoryIncluded: true,
          tactics: {
            quickClose: true,
            asIsOffer: false,
            rentBack: false,
            flexibleClosing: false,
            extraDeposit: true,
            customTerms: [],
          },
          counterOfferPattern: {
            responsiveness: 'immediate',
            concessionWillingness: 'high',
            negotiationRounds: 1,
          },
        },
        context: {
          ...mockContext,
          marketConditions: 'cool',
          multipleOffers: false,
          competingOffers: 0,
        },
        outcome: {
          successful: false,
          rejectedDate: '2024-01-20T14:00:00Z',
          daysToAcceptance: 0,
          negotiationRounds: 1,
          clientSatisfaction: 'medium',
        },
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        version: 1,
      },
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = StrategyRecommender.getInstance()
      const instance2 = StrategyRecommender.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully with sufficient data', async () => {
      // Mock successful cache miss
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)
      expect(result.metadata?.cacheStatus).toBe('miss')
    })

    it('should return cached recommendations when available', async () => {
      const mockCachedRecommendations: StrategyRecommendation[] = [
        {
          agentId: 'agent-1',
          recommendationType: 'initial_offer',
          recommendation: {
            strategy: 'cached_recommendation',
            value: 95,
            confidence: 0.8,
            reasoning: 'Cached recommendation',
            expectedSuccessRate: 0.75,
          },
          basedOn: {
            propertyType: 'single_family',
            marketConditions: 'hot',
            priceRange: { min: 400000, max: 500000, label: '$400K-$500K' },
            competitiveEnvironment: true,
            historicalDataPoints: 15,
          },
          alternatives: [],
          generatedAt: '2024-01-01T00:00:00Z',
          validUntil: '2024-01-08T00:00:00Z',
        },
      ]
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCachedRecommendations,
      })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCachedRecommendations)
      expect(result.metadata?.cacheStatus).toBe('hit')
    })

    it('should handle analytics calculation failure', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: 'Analytics calculation failed',
      })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Analytics calculation failed')
    })

    it('should generate fallback recommendations with insufficient data', async () => {
      const limitedAnalytics = {
        ...mockAnalytics,
        totalNegotiations: 2, // Below minimum threshold
      }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: limitedAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords.slice(0, 2),
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)
      // Should use fallback recommendations
      expect(
        result.data!.some(rec => rec.basedOn.historicalDataPoints === 0)
      ).toBe(true)
    })

    it('should filter recommendations by minimum confidence', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext,
        {
          minConfidence: 0.9, // High confidence threshold
        }
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Should filter out low confidence recommendations
      result.data!.forEach(rec => {
        expect(rec.recommendation.confidence).toBeGreaterThanOrEqual(0.9)
      })
    })

    it('should limit number of recommendations', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext,
        {
          maxRecommendations: 2,
        }
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeLessThanOrEqual(2)
    })

    it('should handle unexpected errors gracefully', async () => {
      ;(getCachedAnalytics as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      )

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected error')
    })
  })

  describe('generateSpecificRecommendation', () => {
    it('should generate specific recommendation type', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateSpecificRecommendation(
        'agent-1',
        mockContext,
        'initial_offer'
      )

      expect(result).toBeDefined()
      expect(result?.recommendationType).toBe('initial_offer')
    })

    it('should return null when specific recommendation not found', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateSpecificRecommendation(
        'agent-1',
        mockContext,
        'initial_offer'
      )

      expect(result).toBeNull()
    })

    it('should handle errors and return null', async () => {
      ;(getCachedAnalytics as jest.Mock).mockRejectedValue(
        new Error('Test error')
      )

      const result = await recommender.generateSpecificRecommendation(
        'agent-1',
        mockContext,
        'initial_offer'
      )

      expect(result).toBeNull()
    })
  })

  describe('Fallback recommendations', () => {
    it('should generate market-based recommendations in hot market', async () => {
      const hotMarketContext = {
        ...mockContext,
        marketConditions: 'hot' as const,
      }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 }, // Insufficient data
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        hotMarketContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should contain market-based recommendation with higher offer percentage for hot market
      const marketRec = result.data!.find(
        rec => rec.recommendationType === 'initial_offer'
      )
      expect(marketRec).toBeDefined()
      expect(marketRec?.recommendation.value).toBe(98) // Hot market recommendation
    })

    it('should generate market-based recommendations in cool market', async () => {
      const coolMarketContext = {
        ...mockContext,
        marketConditions: 'cool' as const,
      }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        coolMarketContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should contain market-based recommendation with lower offer percentage for cool market
      const marketRec = result.data!.find(
        rec => rec.recommendationType === 'initial_offer'
      )
      expect(marketRec).toBeDefined()
      expect(marketRec?.recommendation.value).toBe(90) // Cool market recommendation
    })

    it('should generate property-based contingency recommendations', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should contain property-based contingency recommendation
      const contingencyRec = result.data!.find(
        rec => rec.recommendationType === 'contingency'
      )
      expect(contingencyRec).toBeDefined()
      expect(Array.isArray(contingencyRec?.recommendation.value)).toBe(true)
    })

    it('should generate escalation recommendations based on competitive environment', async () => {
      const competitiveContext = { ...mockContext, multipleOffers: true }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        competitiveContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should recommend escalation for competitive environment
      const escalationRec = result.data!.find(
        rec => rec.recommendationType === 'escalation'
      )
      expect(escalationRec).toBeDefined()
      expect(escalationRec?.recommendation.value).toBe(true)
    })
  })

  describe('Data sufficiency and requirements', () => {
    it('should return minimum data requirements', () => {
      const requirements = recommender.getMinimumDataRequirements()

      expect(requirements).toBeDefined()
      expect(requirements.minimal).toBe(3)
      expect(requirements.optimal).toBe(10)
      expect(requirements.confidenceThreshold).toBe(0.6)
    })

    it('should handle edge cases with empty data', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: {
          ...mockAnalytics,
          totalNegotiations: 0,
          byStrategy: [],
          byPropertyType: [],
          byMarketConditions: [],
          byPriceRange: [],
          byCompetitiveEnvironment: [],
        },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Should still generate fallback recommendations
      expect(result.data!.length).toBeGreaterThan(0)
    })
  })

  describe('Cache management', () => {
    it('should clear cache successfully', async () => {
      ;(invalidateAnalyticsCache as jest.Mock).mockResolvedValue({
        success: true,
      })

      await expect(recommender.clearCache('agent-1')).resolves.not.toThrow()
      expect(invalidateAnalyticsCache).toHaveBeenCalledWith('agent-1')
    })

    it('should handle cache clearing errors', async () => {
      ;(invalidateAnalyticsCache as jest.Mock).mockRejectedValue(
        new Error('Cache error')
      )

      await expect(recommender.clearCache('agent-1')).rejects.toThrow(
        'Cache error'
      )
    })
  })

  describe('Context matching and similarity', () => {
    it('should handle different property types correctly', async () => {
      const condoContext = { ...mockContext, propertyType: 'condo' as const }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        condoContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should generate appropriate recommendations for condo
      const contingencyRec = result.data!.find(
        rec => rec.recommendationType === 'contingency'
      )
      expect(contingencyRec).toBeDefined()
      expect(contingencyRec?.basedOn.propertyType).toBe('condo')
    })

    it('should handle different market conditions', async () => {
      const warmMarketContext = {
        ...mockContext,
        marketConditions: 'warm' as const,
      }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { ...mockAnalytics, totalNegotiations: 1 },
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        warmMarketContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should generate appropriate recommendations for warm market
      const marketRec = result.data!.find(
        rec => rec.recommendationType === 'initial_offer'
      )
      expect(marketRec).toBeDefined()
      expect(marketRec?.recommendation.value).toBe(95) // Warm market recommendation
    })
  })

  describe('Recommendation quality and alternatives', () => {
    it('should generate alternative strategies', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should include alternatives in recommendations
      const recommendationWithAlternatives = result.data!.find(
        rec => rec.alternatives.length > 0
      )
      expect(recommendationWithAlternatives).toBeDefined()
      expect(recommendationWithAlternatives?.alternatives[0]).toHaveProperty(
        'strategy'
      )
      expect(recommendationWithAlternatives?.alternatives[0]).toHaveProperty(
        'expectedSuccessRate'
      )
      expect(recommendationWithAlternatives?.alternatives[0]).toHaveProperty(
        'reasoning'
      )
    })

    it('should calculate confidence scores appropriately', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(
        successRateCalculator.calculateSuccessRateAnalytics as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await recommender.generateRecommendations(
        'agent-1',
        mockContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // All recommendations should have confidence scores
      result.data!.forEach(rec => {
        expect(rec.recommendation.confidence).toBeGreaterThan(0)
        expect(rec.recommendation.confidence).toBeLessThanOrEqual(1)
      })
    })
  })
})
