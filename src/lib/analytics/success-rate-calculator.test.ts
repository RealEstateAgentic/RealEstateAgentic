import { SuccessRateCalculator } from './success-rate-calculator'
import {
  NegotiationRecord,
  SuccessRateAnalytics,
  AnalyticsQuery,
  AnalyticsReport,
  NegotiationAnalyticsResponse,
  AnalyticsResponse,
} from '../../shared/types/analytics'

// Mock the Firebase functions
jest.mock('../firebase/collections/negotiation-analytics', () => ({
  getNegotiationRecords: jest.fn(),
  getCachedAnalytics: jest.fn(),
  setCachedAnalytics: jest.fn(),
  storeAgentAnalytics: jest.fn(),
  invalidateAnalyticsCache: jest.fn(),
}))

jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
}))

jest.mock('../../main/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Import mocked functions
import {
  getNegotiationRecords,
  getCachedAnalytics,
  setCachedAnalytics,
  storeAgentAnalytics,
  invalidateAnalyticsCache,
} from '../firebase/collections/negotiation-analytics'

describe('SuccessRateCalculator', () => {
  let calculator: SuccessRateCalculator
  let mockNegotiationRecords: NegotiationRecord[]

  beforeEach(() => {
    calculator = SuccessRateCalculator.getInstance()
    jest.clearAllMocks()

    // Create mock negotiation records
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
        context: {
          propertyType: 'single_family',
          priceRange: { min: 400000, max: 450000, label: '$400K-$450K' },
          daysOnMarket: 15,
          marketConditions: 'hot',
          marketTrend: 'rising',
          seasonality: 'spring',
          multipleOffers: true,
          competingOffers: 3,
          averageOfferPrice: 420000,
          location: {
            city: 'Seattle',
            state: 'WA',
            neighborhood: 'Capitol Hill',
            zipCode: '98102',
          },
          listingAgent: 'agent-2',
          buyerAgent: 'agent-1',
          transactionType: 'purchase',
        },
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
          reasonForSelection: 'Strong cover letter and quick close',
          clientSatisfaction: 'high',
          lessonLearned: 'Cover letters make a difference',
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
          propertyType: 'condo',
          priceRange: { min: 300000, max: 350000, label: '$300K-$350K' },
          daysOnMarket: 30,
          marketConditions: 'cool',
          marketTrend: 'stable',
          seasonality: 'winter',
          multipleOffers: false,
          competingOffers: 0,
          location: {
            city: 'Seattle',
            state: 'WA',
            neighborhood: 'Belltown',
            zipCode: '98121',
          },
          listingAgent: 'agent-3',
          buyerAgent: 'agent-1',
          transactionType: 'purchase',
        },
        outcome: {
          successful: false,
          rejectedDate: '2024-01-20T14:00:00Z',
          daysToAcceptance: 0,
          negotiationRounds: 1,
          clientSatisfaction: 'medium',
          lessonLearned: 'Low offer in cool market was too aggressive',
        },
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        version: 1,
      },
      {
        id: 'record-3',
        agentId: 'agent-1',
        clientId: 'client-3',
        propertyId: 'prop-3',
        negotiationId: 'neg-3',
        strategy: {
          initialOfferPercentage: 98,
          offerPosition: 'at',
          escalationClause: { used: true, maxAmount: 15000, increment: 1000 },
          contingencies: {
            inspection: true,
            financing: true,
            appraisal: true,
            saleOfHome: false,
            other: [],
          },
          communicationTone: 'confident',
          coverLetterUsed: true,
          personalStoryIncluded: true,
          tactics: {
            quickClose: true,
            asIsOffer: false,
            rentBack: false,
            flexibleClosing: true,
            extraDeposit: true,
            customTerms: ['pet_allowed'],
          },
          counterOfferPattern: {
            responsiveness: 'quick',
            concessionWillingness: 'low',
            negotiationRounds: 3,
          },
        },
        context: {
          propertyType: 'townhouse',
          priceRange: { min: 500000, max: 600000, label: '$500K-$600K' },
          daysOnMarket: 7,
          marketConditions: 'warm',
          marketTrend: 'rising',
          seasonality: 'spring',
          multipleOffers: true,
          competingOffers: 2,
          averageOfferPrice: 550000,
          location: {
            city: 'Seattle',
            state: 'WA',
            neighborhood: 'Fremont',
            zipCode: '98103',
          },
          listingAgent: 'agent-4',
          buyerAgent: 'agent-1',
          transactionType: 'purchase',
        },
        outcome: {
          successful: true,
          acceptedDate: '2024-02-01T16:00:00Z',
          finalPrice: 565000,
          finalTerms: {
            closingDate: '2024-03-01T16:00:00Z',
            contingencies: ['inspection', 'financing', 'appraisal'],
            concessions: ['pet_allowed'],
            modifications: ['escalation_triggered'],
          },
          daysToAcceptance: 8,
          negotiationRounds: 3,
          chosenOverOffers: 2,
          reasonForSelection: 'Strong escalation clause and personal story',
          clientSatisfaction: 'high',
          lessonLearned: 'Personal stories resonate with sellers',
        },
        createdAt: '2024-01-25T09:00:00Z',
        updatedAt: '2024-02-01T16:00:00Z',
        version: 1,
      },
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = SuccessRateCalculator.getInstance()
      const instance2 = SuccessRateCalculator.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('calculateSuccessRateAnalytics', () => {
    it('should calculate analytics successfully with valid data', async () => {
      // Mock successful cache miss
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.agentId).toBe('agent-1')
      expect(result.data?.totalNegotiations).toBe(3)
      expect(result.data?.successfulNegotiations).toBe(2)
      expect(result.data?.overallSuccessRate).toBeCloseTo(0.67, 2)
      expect(result.metadata?.cacheStatus).toBe('miss')
    })

    it('should return cached data when available', async () => {
      const mockCachedAnalytics: SuccessRateAnalytics = {
        agentId: 'agent-1',
        totalNegotiations: 3,
        successfulNegotiations: 2,
        overallSuccessRate: 0.67,
        byStrategy: [],
        byPropertyType: [],
        byMarketConditions: [],
        byPriceRange: [],
        byCompetitiveEnvironment: [],
        trends: [],
        calculatedAt: '2024-01-01T00:00:00Z',
        dataRange: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T00:00:00Z',
          totalRecords: 3,
        },
      }
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCachedAnalytics,
      })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCachedAnalytics)
      expect(result.metadata?.cacheStatus).toBe('hit')
    })

    it('should handle database errors gracefully', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle insufficient data gracefully', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords.slice(0, 2), // Only 2 records
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data?.totalNegotiations).toBe(2)
      expect(result.metadata?.filteredRecords).toBe(2)
    })

    it('should apply filters correctly', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const query: Partial<AnalyticsQuery> = {
        filters: {
          propertyTypes: ['single_family'],
          successful: true,
        },
      }

      const result = await calculator.calculateSuccessRateAnalytics(
        'agent-1',
        query
      )

      expect(result.success).toBe(true)
      expect(result.data?.totalNegotiations).toBe(3)
      expect(result.metadata?.filteredRecords).toBe(1) // Only 1 successful single_family
    })

    it('should handle unexpected errors', async () => {
      ;(getCachedAnalytics as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      )

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected error')
    })
  })

  describe('generateStrategyEffectivenessReport', () => {
    it('should generate strategy effectiveness report successfully', async () => {
      // Mock successful analytics calculation
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result =
        await calculator.generateStrategyEffectivenessReport('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.reportType).toBe('strategy_breakdown')
      expect(result.data?.title).toBe('Strategy Effectiveness Report')
      expect(result.data?.keyInsights).toHaveLength(4)
      expect(result.data?.data.topStrategies).toBeDefined()
      expect(result.data?.data.recommendations).toBeDefined()
    })

    it('should handle failed analytics calculation', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch data',
      })

      const result =
        await calculator.generateStrategyEffectivenessReport('agent-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch data')
    })
  })

  describe('generatePerformanceTrendsReport', () => {
    it('should generate performance trends report successfully', async () => {
      // Mock successful analytics calculation
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.generatePerformanceTrendsReport('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.reportType).toBe('performance_trends')
      expect(result.data?.title).toBe('Performance Trends Report')
      expect(result.data?.keyInsights).toHaveLength(4)
      expect(result.data?.data.trends).toBeDefined()
      expect(result.data?.data.trendAnalysis).toBeDefined()
    })
  })

  describe('generateMarketAnalysisReport', () => {
    it('should generate market analysis report successfully', async () => {
      // Mock successful analytics calculation
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.generateMarketAnalysisReport('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.reportType).toBe('strategy_breakdown')
      expect(result.data?.title).toBe('Market Analysis Report')
      expect(result.data?.keyInsights).toHaveLength(4)
      expect(result.data?.data.marketConditions).toBeDefined()
      expect(result.data?.data.priceRanges).toBeDefined()
      expect(result.data?.data.competitiveEnvironment).toBeDefined()
    })
  })

  describe('generateExecutiveSummaryReport', () => {
    it('should generate executive summary report successfully', async () => {
      // Mock successful analytics calculation
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.generateExecutiveSummaryReport('agent-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.reportType).toBe('top_strategies')
      expect(result.data?.title).toBe('Executive Summary Report')
      expect(result.data?.keyInsights).toHaveLength(4)
      expect(result.data?.data.overallStats).toBeDefined()
      expect(result.data?.data.topPerformers).toBeDefined()
      expect(result.data?.data.quickStats).toBeDefined()
    })
  })

  describe('checkDataSufficiency', () => {
    it('should return sufficient data when enough records exist', async () => {
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords, // 3 records
      })

      const result = await calculator.checkDataSufficiency('agent-1')

      expect(result.sufficient).toBe(false) // Need 5 minimum
      expect(result.currentCount).toBe(3)
      expect(result.minimumRequired).toBe(5)
      expect(result.message).toContain('Need 2 more')
    })

    it('should return sufficient data when enough records exist', async () => {
      const moreRecords = [...mockNegotiationRecords, ...mockNegotiationRecords]
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: moreRecords, // 6 records
      })

      const result = await calculator.checkDataSufficiency('agent-1')

      expect(result.sufficient).toBe(true)
      expect(result.currentCount).toBe(6)
      expect(result.minimumRequired).toBe(5)
      expect(result.message).toContain('Sufficient data available')
    })

    it('should handle database errors', async () => {
      ;(getNegotiationRecords as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await calculator.checkDataSufficiency('agent-1')

      expect(result.sufficient).toBe(false)
      expect(result.currentCount).toBe(0)
      expect(result.message).toBe('Unable to check data sufficiency')
    })
  })

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      ;(invalidateAnalyticsCache as jest.Mock).mockResolvedValue({
        success: true,
      })

      await expect(calculator.clearCache('agent-1')).resolves.not.toThrow()
      expect(invalidateAnalyticsCache).toHaveBeenCalledWith('agent-1')
    })

    it('should handle cache clearing errors', async () => {
      ;(invalidateAnalyticsCache as jest.Mock).mockRejectedValue(
        new Error('Cache error')
      )

      await expect(calculator.clearCache('agent-1')).rejects.toThrow(
        'Cache error'
      )
    })
  })

  describe('getMinimumDataRequirements', () => {
    it('should return minimum data requirements', () => {
      const result = calculator.getMinimumDataRequirements()
      expect(result).toBe(5)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty negotiation records', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data?.totalNegotiations).toBe(0)
      expect(result.data?.overallSuccessRate).toBe(0)
    })

    it('should handle records with missing strategy data', async () => {
      const incompleteRecords = [
        {
          ...mockNegotiationRecords[0],
          strategy: {
            ...mockNegotiationRecords[0].strategy,
            communicationTone: undefined,
          },
        },
      ]
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: incompleteRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data?.totalNegotiations).toBe(1)
    })

    it('should handle records with missing context data', async () => {
      const incompleteRecords = [
        {
          ...mockNegotiationRecords[0],
          context: {
            ...mockNegotiationRecords[0].context,
            propertyType: undefined,
          },
        },
      ]
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: incompleteRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data?.totalNegotiations).toBe(1)
    })

    it('should handle various price ranges correctly', async () => {
      const diverseRecords = [
        ...mockNegotiationRecords,
        {
          ...mockNegotiationRecords[0],
          id: 'record-4',
          context: {
            ...mockNegotiationRecords[0].context,
            priceRange: { min: 200000, max: 300000, label: 'Under $300K' },
          },
        },
        {
          ...mockNegotiationRecords[0],
          id: 'record-5',
          context: {
            ...mockNegotiationRecords[0].context,
            priceRange: { min: 1200000, max: 2000000, label: 'Above $1M' },
          },
        },
      ]
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: diverseRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const result = await calculator.calculateSuccessRateAnalytics('agent-1')

      expect(result.success).toBe(true)
      expect(result.data?.byPriceRange).toHaveLength(4) // Should have 4 different price ranges
    })

    it('should handle complex filtering scenarios', async () => {
      ;(getCachedAnalytics as jest.Mock).mockResolvedValue({ success: false })
      ;(getNegotiationRecords as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNegotiationRecords,
      })
      ;(setCachedAnalytics as jest.Mock).mockResolvedValue({ success: true })
      ;(storeAgentAnalytics as jest.Mock).mockResolvedValue({ success: true })

      const query: Partial<AnalyticsQuery> = {
        filters: {
          propertyTypes: ['single_family', 'townhouse'],
          marketConditions: ['hot', 'warm'],
          strategyTypes: ['cover_letter', 'escalation_clause'],
          competitiveEnvironment: true,
        },
      }

      const result = await calculator.calculateSuccessRateAnalytics(
        'agent-1',
        query
      )

      expect(result.success).toBe(true)
      expect(result.metadata?.filteredRecords).toBeLessThanOrEqual(
        result.metadata?.totalRecords || 0
      )
    })
  })
})
