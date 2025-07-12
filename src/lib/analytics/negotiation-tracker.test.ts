import { NegotiationTracker } from './negotiation-tracker'
import { auth } from '../firebase'
import { logger } from '../../main/utils/logger'

// Mock dependencies
jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'test-agent-id' },
  },
}))

jest.mock('../firebase/collections/negotiation-analytics', () => ({
  createNegotiationRecord: jest.fn(),
  updateNegotiationRecord: jest.fn(),
  getNegotiationRecord: jest.fn(),
}))

jest.mock('../../main/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('NegotiationTracker', () => {
  let tracker: NegotiationTracker

  beforeEach(() => {
    tracker = NegotiationTracker.getInstance()
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up active tracking
    tracker.cleanupOldTracking()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NegotiationTracker.getInstance()
      const instance2 = NegotiationTracker.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('startNegotiationTracking', () => {
    it('should start tracking a new negotiation', async () => {
      const propertyId = 'property-123'
      const contextualFactors = {
        competingOffers: 2,
        daysOnMarket: 15,
        location: { city: 'San Francisco', state: 'CA' },
      }

      const negotiationId = await tracker.startNegotiationTracking(
        propertyId,
        'single_family',
        'hot',
        contextualFactors
      )

      expect(negotiationId).toBe(`${propertyId}-${expect.any(Number)}`)
      expect(negotiationId).toContain(propertyId)

      // Verify the negotiation is being tracked
      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation).toBeDefined()
      expect(activeNegotiation?.propertyId).toBe(propertyId)
      expect(activeNegotiation?.agentId).toBe('test-agent-id')
    })

    it('should throw error when user is not authenticated', async () => {
      ;(auth.currentUser as any) = null

      await expect(
        tracker.startNegotiationTracking(
          'property-123',
          'single_family',
          'hot',
          {}
        )
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('extractStrategiesFromContent', () => {
    it('should extract emotional strategy from content', () => {
      const content =
        'This is a personal story about our family finding the perfect home. We love this property and dream of raising our children here.'

      const strategies = tracker.extractStrategiesFromContent(content)

      expect(strategies).toHaveLength(1)
      expect(strategies[0].type).toBe('emotional')
      expect(strategies[0].confidence).toBeGreaterThan(0)
      expect(strategies[0].keywords).toContain('personal')
      expect(strategies[0].keywords).toContain('family')
      expect(strategies[0].keywords).toContain('love')
    })

    it('should extract competitive strategy from content', () => {
      const content =
        'We are making the best and highest offer. We want to compete effectively and outbid other buyers with our superior proposal.'

      const strategies = tracker.extractStrategiesFromContent(content)

      expect(strategies).toHaveLength(1)
      expect(strategies[0].type).toBe('competitive')
      expect(strategies[0].confidence).toBeGreaterThan(0)
      expect(strategies[0].keywords).toContain('best')
      expect(strategies[0].keywords).toContain('highest')
      expect(strategies[0].keywords).toContain('compete')
    })

    it('should extract multiple strategies from content', () => {
      const content =
        'We love this home and want to make the best offer. The market price is fair and we can be flexible with the timeline.'

      const strategies = tracker.extractStrategiesFromContent(content)

      expect(strategies.length).toBeGreaterThan(1)
      expect(strategies.some(s => s.type === 'emotional')).toBe(true)
      expect(strategies.some(s => s.type === 'competitive')).toBe(true)
      expect(strategies.some(s => s.type === 'priceJustification')).toBe(true)
    })

    it('should return empty array for content without strategies', () => {
      const content =
        'This is just a simple statement without any strategic keywords.'

      const strategies = tracker.extractStrategiesFromContent(content)

      expect(strategies).toHaveLength(0)
    })

    it('should sort strategies by confidence level', () => {
      const content =
        'We love this home and it is perfect for our family. We want to make the best offer and compete effectively.'

      const strategies = tracker.extractStrategiesFromContent(content)

      expect(strategies.length).toBeGreaterThan(1)
      for (let i = 0; i < strategies.length - 1; i++) {
        expect(strategies[i].confidence).toBeGreaterThanOrEqual(
          strategies[i + 1].confidence
        )
      }
    })
  })

  describe('trackStrategyFromDocument', () => {
    it('should track strategy from document content', async () => {
      const negotiationId = 'negotiation-123'
      const documentContent =
        'This is our personal story about finding the perfect home for our family.'

      // First start tracking
      await tracker.startNegotiationTracking(
        'property-123',
        'single_family',
        'hot',
        {}
      )

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        documentHistory: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      await tracker.trackStrategyFromDocument(
        negotiationId,
        'cover_letter',
        documentContent,
        500000,
        550000
      )

      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation?.documentHistory).toHaveLength(1)
      expect(activeNegotiation?.documentHistory?.[0].type).toBe('cover_letter')
      expect(activeNegotiation?.documentHistory?.[0].content).toBe(
        documentContent
      )
      expect(activeNegotiation?.documentHistory?.[0].offerAmount).toBe(500000)
      expect(activeNegotiation?.documentHistory?.[0].listingPrice).toBe(550000)
    })

    it('should warn when negotiation is not found', async () => {
      await tracker.trackStrategyFromDocument(
        'nonexistent-negotiation',
        'cover_letter',
        'content',
        500000,
        550000
      )

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No active tracking found for negotiation')
      )
    })
  })

  describe('trackOfferActivity', () => {
    it('should track offer activity', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        offerHistory: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      await tracker.trackOfferActivity(
        negotiationId,
        'initial',
        500000,
        550000,
        undefined,
        'Initial offer submission'
      )

      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation?.offerHistory).toHaveLength(1)
      expect(activeNegotiation?.offerHistory?.[0].type).toBe('initial')
      expect(activeNegotiation?.offerHistory?.[0].amount).toBe(500000)
      expect(activeNegotiation?.offerHistory?.[0].listingPrice).toBe(550000)
      expect(activeNegotiation?.offerHistory?.[0].additionalNotes).toBe(
        'Initial offer submission'
      )
    })

    it('should track counter offer with response time', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        offerHistory: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      await tracker.trackOfferActivity(
        negotiationId,
        'counter',
        520000,
        550000,
        24,
        'Counter offer response'
      )

      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation?.offerHistory).toHaveLength(1)
      expect(activeNegotiation?.offerHistory?.[0].type).toBe('counter')
      expect(activeNegotiation?.offerHistory?.[0].responseTime).toBe(24)
    })
  })

  describe('updateContextualFactors', () => {
    it('should update contextual factors', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        context: {
          competingOffers: 1,
          daysOnMarket: 10,
        },
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      await tracker.updateContextualFactors(negotiationId, {
        competingOffers: 3,
        season: 'spring',
      })

      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation?.context?.competingOffers).toBe(3)
      expect(activeNegotiation?.context?.season).toBe('spring')
      expect(activeNegotiation?.context?.daysOnMarket).toBe(10) // Should preserve existing data
    })
  })

  describe('recordNegotiationOutcome', () => {
    beforeEach(() => {
      const {
        createNegotiationRecord,
        updateNegotiationRecord,
        getNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')
      createNegotiationRecord.mockResolvedValue({})
      updateNegotiationRecord.mockResolvedValue({})
      getNegotiationRecord.mockResolvedValue({ success: false })
    })

    it('should record accepted outcome', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        outcomes: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      await tracker.recordNegotiationOutcome(
        negotiationId,
        'accepted',
        510000,
        30,
        'Successful negotiation'
      )

      const activeNegotiation = tracker.getActiveNegotiation(negotiationId)
      expect(activeNegotiation?.outcomes).toHaveLength(1)
      expect(activeNegotiation?.outcomes?.[0].type).toBe('accepted')
      expect(activeNegotiation?.outcomes?.[0].finalAmount).toBe(510000)
      expect(activeNegotiation?.outcomes?.[0].timeToClose).toBe(30)
      expect(activeNegotiation?.finalOutcome).toBe('accepted')
    })

    it('should save to Firebase when negotiation completes', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        outcomes: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      const {
        createNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')

      await tracker.recordNegotiationOutcome(
        negotiationId,
        'accepted',
        510000,
        30,
        'Successful negotiation'
      )

      expect(createNegotiationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: negotiationId,
          agentId: 'test-agent-id',
        })
      )
    })

    it('should not save to Firebase for pending outcomes', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        outcomes: [],
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      const {
        createNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')

      await tracker.recordNegotiationOutcome(
        negotiationId,
        'pending',
        undefined,
        undefined,
        'Still negotiating'
      )

      expect(createNegotiationRecord).not.toHaveBeenCalled()
    })
  })

  describe('getActiveNegotiation', () => {
    it('should return active negotiation data', async () => {
      const negotiationId = 'negotiation-123'

      // Mock the active negotiation
      const mockNegotiation = {
        id: negotiationId,
        agentId: 'test-agent-id',
        propertyId: 'property-123',
      }
      ;(tracker as any).activeTracking.set(negotiationId, mockNegotiation)

      const result = tracker.getActiveNegotiation(negotiationId)

      expect(result).toEqual(mockNegotiation)
    })

    it('should return null for non-existent negotiation', () => {
      const result = tracker.getActiveNegotiation('nonexistent-negotiation')

      expect(result).toBeNull()
    })
  })

  describe('getAllActiveNegotiations', () => {
    it('should return all active negotiations', async () => {
      const negotiation1 = {
        id: 'negotiation-1',
        agentId: 'test-agent-id',
        propertyId: 'property-1',
      }
      const negotiation2 = {
        id: 'negotiation-2',
        agentId: 'test-agent-id',
        propertyId: 'property-2',
      }

      ;(tracker as any).activeTracking.set('negotiation-1', negotiation1)
      ;(tracker as any).activeTracking.set('negotiation-2', negotiation2)

      const result = tracker.getAllActiveNegotiations()

      expect(result.size).toBe(2)
      expect(result.get('negotiation-1')).toEqual(negotiation1)
      expect(result.get('negotiation-2')).toEqual(negotiation2)
    })

    it('should return empty map when no active negotiations', () => {
      const result = tracker.getAllActiveNegotiations()

      expect(result.size).toBe(0)
    })
  })

  describe('saveAllActiveNegotiations', () => {
    beforeEach(() => {
      const {
        createNegotiationRecord,
        getNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')
      createNegotiationRecord.mockResolvedValue({})
      getNegotiationRecord.mockResolvedValue({ success: false })
    })

    it('should save all active negotiations with strategies', async () => {
      const negotiation1 = {
        id: 'negotiation-1',
        agentId: 'test-agent-id',
        propertyId: 'property-1',
        documentHistory: [{ type: 'cover_letter', content: 'content' }],
      }
      const negotiation2 = {
        id: 'negotiation-2',
        agentId: 'test-agent-id',
        propertyId: 'property-2',
        documentHistory: [{ type: 'memo', content: 'memo content' }],
      }

      ;(tracker as any).activeTracking.set('negotiation-1', negotiation1)
      ;(tracker as any).activeTracking.set('negotiation-2', negotiation2)

      const {
        createNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')

      await tracker.saveAllActiveNegotiations()

      expect(createNegotiationRecord).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Saved 2 active negotiations')
      )
    })

    it('should not save negotiations without strategies', async () => {
      const negotiation1 = {
        id: 'negotiation-1',
        agentId: 'test-agent-id',
        propertyId: 'property-1',
        // No strategies
      }

      ;(tracker as any).activeTracking.set('negotiation-1', negotiation1)

      const {
        createNegotiationRecord,
      } = require('../firebase/collections/negotiation-analytics')

      await tracker.saveAllActiveNegotiations()

      expect(createNegotiationRecord).not.toHaveBeenCalled()
    })
  })

  describe('cleanupOldTracking', () => {
    it('should cleanup old tracking data', () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago

      const oldNegotiation = {
        id: 'old-negotiation',
        agentId: 'test-agent-id',
        createdAt: oldDate,
      }
      const recentNegotiation = {
        id: 'recent-negotiation',
        agentId: 'test-agent-id',
        createdAt: recentDate,
      }

      ;(tracker as any).activeTracking.set('old-negotiation', oldNegotiation)
      ;(tracker as any).activeTracking.set(
        'recent-negotiation',
        recentNegotiation
      )

      tracker.cleanupOldTracking()

      expect(tracker.getActiveNegotiation('old-negotiation')).toBeNull()
      expect(tracker.getActiveNegotiation('recent-negotiation')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully in startNegotiationTracking', async () => {
      ;(auth.currentUser as any) = null

      await expect(
        tracker.startNegotiationTracking(
          'property-123',
          'single_family',
          'hot',
          {}
        )
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to start negotiation tracking:',
        expect.any(Error)
      )
    })

    it('should handle errors gracefully in trackStrategyFromDocument', async () => {
      await tracker.trackStrategyFromDocument(
        'nonexistent-negotiation',
        'cover_letter',
        'content',
        500000,
        550000
      )

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No active tracking found')
      )
    })
  })
})
