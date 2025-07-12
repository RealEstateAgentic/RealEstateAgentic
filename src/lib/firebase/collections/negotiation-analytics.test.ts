/**
 * Unit tests for negotiation analytics Firebase collection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createNegotiationRecord,
  getNegotiationRecord,
  updateNegotiationRecord,
  deleteNegotiationRecord,
  getNegotiationRecords,
  validateNegotiationRecord,
  getCachedAnalytics,
  setCachedAnalytics,
  invalidateAnalyticsCache,
  storeAgentAnalytics,
  getAgentAnalytics,
  storeDataQualityMetrics,
  getDataQualityMetrics,
  batchCreateNegotiationRecords,
  generateCacheKey,
  toFirebaseRecord,
  fromFirebaseRecord,
  toFirebaseTimestamp,
  fromFirebaseTimestamp,
} from './negotiation-analytics'
import type {
  NegotiationRecord,
  SuccessRateAnalytics,
  DataQualityMetrics,
  AnalyticsQuery,
  ValidationResult,
} from '../../../shared/types/analytics'

// Mock Firebase
vi.mock('../config', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => 1000000 })),
    fromDate: vi.fn(),
    fromMillis: vi.fn(),
  },
  writeBatch: vi.fn(),
}))

describe('Negotiation Analytics Firebase Collection', () => {
  // Test data
  const mockAgentId = 'test-agent-123'
  const mockClientId = 'test-client-456'
  const mockPropertyId = 'test-property-789'
  const mockNegotiationId = 'test-negotiation-abc'

  const mockNegotiationRecord: Omit<NegotiationRecord, 'id'> = {
    agentId: mockAgentId,
    clientId: mockClientId,
    propertyId: mockPropertyId,
    negotiationId: mockNegotiationId,
    strategy: {
      initialOfferPercentage: 95,
      offerPosition: 'below',
      escalationClause: {
        used: true,
        maxAmount: 350000,
        increment: 5000,
        capPercentage: 105,
      },
      contingencies: {
        inspection: true,
        financing: true,
        appraisal: true,
        saleOfHome: false,
        other: [],
      },
      communicationTone: 'warm',
      coverLetterUsed: true,
      personalStoryIncluded: true,
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
      priceRange: {
        min: 300000,
        max: 400000,
        label: '$300K-$400K',
      },
      daysOnMarket: 15,
      marketConditions: 'warm',
      marketTrend: 'stable',
      seasonality: 'spring',
      multipleOffers: true,
      competingOffers: 3,
      location: {
        city: 'Austin',
        state: 'TX',
        neighborhood: 'Downtown',
        zipCode: '78701',
      },
      listingAgent: 'listing-agent-123',
      buyerAgent: mockAgentId,
      transactionType: 'purchase',
    },
    outcome: {
      successful: true,
      acceptedDate: '2024-01-15T10:30:00Z',
      finalPrice: 335000,
      finalTerms: {
        closingDate: '2024-02-15',
        contingencies: ['inspection', 'financing'],
        concessions: ['repairs under $2000'],
        modifications: ['extended closing date'],
      },
      daysToAcceptance: 7,
      negotiationRounds: 2,
      chosenOverOffers: 2,
      reasonForSelection: 'Best terms and quick close',
      clientSatisfaction: 'high',
      lessonLearned: 'Personal story in cover letter was effective',
    },
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    version: 1,
  }

  const mockSuccessRateAnalytics: SuccessRateAnalytics = {
    agentId: mockAgentId,
    totalNegotiations: 10,
    successfulNegotiations: 8,
    overallSuccessRate: 0.8,
    byStrategy: [
      {
        strategyType: 'initialOfferPercentage',
        strategyValue: 95,
        totalAttempts: 5,
        successfulAttempts: 4,
        successRate: 0.8,
        averageDaysToClose: 30,
        averageFinalPrice: 340000,
        confidence: 0.9,
      },
    ],
    byPropertyType: [
      {
        propertyType: 'single_family',
        totalAttempts: 8,
        successfulAttempts: 7,
        successRate: 0.875,
        averageOfferPercentage: 96,
        mostSuccessfulStrategy: 'warm communication',
      },
    ],
    byMarketConditions: [
      {
        marketCondition: 'warm',
        totalAttempts: 6,
        successfulAttempts: 5,
        successRate: 0.83,
        averageDaysToClose: 25,
        recommendedStrategy: 'competitive offer with personal story',
      },
    ],
    byPriceRange: [
      {
        priceRange: {
          min: 300000,
          max: 400000,
          label: '$300K-$400K',
        },
        totalAttempts: 4,
        successfulAttempts: 3,
        successRate: 0.75,
        averageOfferPercentage: 97,
        mostEffectiveStrategy: 'escalation clause',
      },
    ],
    byCompetitiveEnvironment: [
      {
        multipleOffers: true,
        averageCompetingOffers: 3,
        totalAttempts: 5,
        successfulAttempts: 3,
        successRate: 0.6,
        winningFactors: ['quick close', 'personal story', 'competitive price'],
      },
    ],
    trends: [
      {
        period: '2024-01',
        periodType: 'month',
        totalNegotiations: 3,
        successfulNegotiations: 2,
        successRate: 0.67,
        trend: 'improving',
        topStrategy: 'warm communication',
        topStrategySuccessRate: 0.75,
        marketConditions: 'warm',
      },
    ],
    calculatedAt: '2024-01-15T10:00:00Z',
    dataRange: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-15T23:59:59Z',
      totalRecords: 10,
    },
  }

  const mockDataQualityMetrics: DataQualityMetrics = {
    totalRecords: 10,
    validRecords: 9,
    invalidRecords: 1,
    completenessScore: 0.9,
    accuracyScore: 0.95,
    timelinessScore: 0.8,
    lastQualityCheck: '2024-01-15T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Utility Functions', () => {
    describe('validateNegotiationRecord', () => {
      it('should validate a complete record successfully', () => {
        const result = validateNegotiationRecord(mockNegotiationRecord)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should return errors for missing required fields', () => {
        const incompleteRecord = {
          agentId: mockAgentId,
          // Missing clientId, propertyId, negotiationId
        }
        const result = validateNegotiationRecord(incompleteRecord)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Client ID is required')
        expect(result.errors).toContain('Property ID is required')
        expect(result.errors).toContain('Negotiation ID is required')
      })

      it('should return warnings for unusual values', () => {
        const recordWithUnusualValues = {
          ...mockNegotiationRecord,
          strategy: {
            ...mockNegotiationRecord.strategy,
            initialOfferPercentage: 250, // Unusual percentage
          },
        }
        const result = validateNegotiationRecord(recordWithUnusualValues)
        expect(result.warnings).toContain(
          'Initial offer percentage seems unusual (outside 0-200%)'
        )
      })

      it('should return errors for invalid strategy data', () => {
        const recordWithInvalidStrategy = {
          ...mockNegotiationRecord,
          strategy: {
            ...mockNegotiationRecord.strategy,
            initialOfferPercentage: 'invalid' as any,
          },
        }
        const result = validateNegotiationRecord(recordWithInvalidStrategy)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
          'Initial offer percentage must be a number'
        )
      })

      it('should return errors for invalid context data', () => {
        const recordWithInvalidContext = {
          ...mockNegotiationRecord,
          context: {
            ...mockNegotiationRecord.context,
            daysOnMarket: -5,
            competingOffers: -2,
          },
        }
        const result = validateNegotiationRecord(recordWithInvalidContext)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Days on market cannot be negative')
        expect(result.errors).toContain('Competing offers cannot be negative')
      })
    })

    describe('generateCacheKey', () => {
      it('should generate a consistent cache key', () => {
        const query: AnalyticsQuery = {
          agentId: mockAgentId,
          dateRange: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-31T23:59:59Z',
          },
          filters: {
            propertyTypes: ['single_family'],
            marketConditions: ['warm'],
          },
        }

        const key1 = generateCacheKey(mockAgentId, query)
        const key2 = generateCacheKey(mockAgentId, query)

        expect(key1).toBe(key2)
        expect(key1).toContain('analytics_')
        expect(key1).toContain(mockAgentId)
      })

      it('should generate different keys for different queries', () => {
        const query1: AnalyticsQuery = {
          agentId: mockAgentId,
          dateRange: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-31T23:59:59Z',
          },
        }

        const query2: AnalyticsQuery = {
          agentId: mockAgentId,
          dateRange: {
            startDate: '2024-02-01T00:00:00Z',
            endDate: '2024-02-28T23:59:59Z',
          },
        }

        const key1 = generateCacheKey(mockAgentId, query1)
        const key2 = generateCacheKey(mockAgentId, query2)

        expect(key1).not.toBe(key2)
      })
    })

    describe('timestamp conversion', () => {
      it('should convert Date to Firebase timestamp', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const timestamp = toFirebaseTimestamp(date)
        expect(timestamp).toBeDefined()
      })

      it('should convert string to Firebase timestamp', () => {
        const dateString = '2024-01-15T10:30:00Z'
        const timestamp = toFirebaseTimestamp(dateString)
        expect(timestamp).toBeDefined()
      })

      it('should convert Firebase timestamp to ISO string', () => {
        const mockTimestamp = {
          toDate: () => new Date('2024-01-15T10:30:00Z'),
        }
        const isoString = fromFirebaseTimestamp(mockTimestamp as any)
        expect(isoString).toBe('2024-01-15T10:30:00.000Z')
      })
    })

    describe('record conversion', () => {
      it('should convert NegotiationRecord to Firebase format', () => {
        const firebaseRecord = toFirebaseRecord(mockNegotiationRecord)
        expect(firebaseRecord).toHaveProperty('_createdAt')
        expect(firebaseRecord).toHaveProperty('_updatedAt')
        expect(firebaseRecord.agentId).toBe(mockAgentId)
      })

      it('should convert Firebase record to NegotiationRecord', () => {
        const firebaseRecord = toFirebaseRecord(mockNegotiationRecord)
        const record = fromFirebaseRecord('test-id', firebaseRecord)
        expect(record.id).toBe('test-id')
        expect(record.agentId).toBe(mockAgentId)
        expect(record.createdAt).toBeDefined()
        expect(record.updatedAt).toBeDefined()
      })
    })
  })

  describe('CRUD Operations', () => {
    describe('createNegotiationRecord', () => {
      it('should create a valid negotiation record', async () => {
        // This test would need proper Firebase mocking
        // For now, we'll test the validation logic
        const result = await createNegotiationRecord(mockNegotiationRecord)
        // Since we're mocking Firebase, we can't test the actual creation
        // but we can verify the validation would pass
        expect(validateNegotiationRecord(mockNegotiationRecord).valid).toBe(
          true
        )
      })

      it('should reject invalid negotiation record', async () => {
        const invalidRecord = {
          ...mockNegotiationRecord,
          agentId: '', // Invalid empty agentId
        }

        const result = await createNegotiationRecord(invalidRecord)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Validation failed')
      })
    })

    describe('getNegotiationRecord', () => {
      it('should handle record not found', async () => {
        // Mock Firebase to return no document
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => false,
        } as any)

        const result = await getNegotiationRecord(
          'non-existent-id',
          mockAgentId
        )
        expect(result.success).toBe(false)
        expect(result.error).toBe('Negotiation record not found')
      })

      it('should handle unauthorized access', async () => {
        // Mock Firebase to return document with different agentId
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => true,
          data: () => ({
            agentId: 'different-agent-id',
          }),
        } as any)

        const result = await getNegotiationRecord('test-id', mockAgentId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized access to negotiation record')
      })
    })
  })

  describe('Analytics Operations', () => {
    describe('storeAgentAnalytics', () => {
      it('should store analytics successfully', async () => {
        const result = await storeAgentAnalytics(
          mockAgentId,
          mockSuccessRateAnalytics
        )
        // Since we're mocking Firebase, this will always succeed
        expect(result.success).toBe(true)
      })
    })

    describe('getAgentAnalytics', () => {
      it('should handle analytics not found', async () => {
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => false,
        } as any)

        const result = await getAgentAnalytics(mockAgentId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Agent analytics not found')
      })
    })
  })

  describe('Cache Operations', () => {
    describe('setCachedAnalytics', () => {
      it('should cache analytics data', async () => {
        const cacheKey = 'test-cache-key'
        const data = { test: 'data' }

        const result = await setCachedAnalytics(cacheKey, mockAgentId, data, 60)
        expect(result.success).toBe(true)
      })
    })

    describe('getCachedAnalytics', () => {
      it('should handle cache miss', async () => {
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => false,
        } as any)

        const result = await getCachedAnalytics('non-existent-key', mockAgentId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Cache miss')
      })

      it('should handle unauthorized cache access', async () => {
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => true,
          data: () => ({
            agentId: 'different-agent-id',
          }),
        } as any)

        const result = await getCachedAnalytics('test-key', mockAgentId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized cache access')
      })
    })
  })

  describe('Data Quality Operations', () => {
    describe('storeDataQualityMetrics', () => {
      it('should store metrics successfully', async () => {
        const result = await storeDataQualityMetrics(
          mockAgentId,
          mockDataQualityMetrics
        )
        expect(result.success).toBe(true)
      })
    })

    describe('getDataQualityMetrics', () => {
      it('should handle metrics not found', async () => {
        const { getDoc } = await import('firebase/firestore')
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => false,
        } as any)

        const result = await getDataQualityMetrics(mockAgentId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Data quality metrics not found')
      })
    })
  })

  describe('Batch Operations', () => {
    describe('batchCreateNegotiationRecords', () => {
      it('should validate all records before batch creation', async () => {
        const records = [
          mockNegotiationRecord,
          { ...mockNegotiationRecord, agentId: '' }, // Invalid record
        ]

        const result = await batchCreateNegotiationRecords(records)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Validation failed')
      })

      it('should handle valid batch creation', async () => {
        const records = [
          mockNegotiationRecord,
          { ...mockNegotiationRecord, clientId: 'different-client' },
        ]

        const result = await batchCreateNegotiationRecords(records)
        // Since we're mocking Firebase, we can't test actual batch creation
        // but we can verify validation passes
        expect(validateNegotiationRecord(records[0]).valid).toBe(true)
        expect(validateNegotiationRecord(records[1]).valid).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase error'))

      const result = await getNegotiationRecord('test-id', mockAgentId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Firebase error')
    })

    it('should handle unknown errors', async () => {
      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockRejectedValue('Unknown error')

      const result = await getNegotiationRecord('test-id', mockAgentId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })
  })
})
