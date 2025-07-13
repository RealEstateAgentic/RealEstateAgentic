import type {
  NegotiationRecord,
  NegotiationStrategy,
  NegotiationContext,
  NegotiationOutcome,
} from '../../shared/types/analytics'
import {
  createNegotiationRecord,
  updateNegotiationRecord,
  getNegotiationRecord,
} from '../firebase/collections/negotiation-analytics'
import { auth } from '../firebase'
import { logger } from '../../main/utils/logger'

// Extract specific types from the analytics types
type StrategyType =
  | 'emotional'
  | 'competitive'
  | 'valueAdd'
  | 'priceJustification'
  | 'timeConstraint'
  | 'flexibility'
type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'land'
type MarketConditions = 'hot' | 'warm' | 'cool'
type OutcomeType = 'accepted' | 'rejected' | 'expired' | 'pending'

// Define additional types for tracking
interface ContextualFactors {
  buyerAgent?: string
  sellerAgent?: string
  competingOffers?: number
  daysOnMarket?: number
  priceRange?: {
    min: number
    max: number
    label: string
  }
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  location?: {
    city: string
    state: string
    neighborhood?: string
  }
}

interface StrategyExtraction {
  type: StrategyType
  confidence: number
  extractedText: string
  keywords: string[]
}

// Extended tracking interface for in-progress negotiations
interface TrackingRecord {
  id: string
  agentId: string
  clientId: string
  propertyId: string
  negotiationId: string
  strategy?: NegotiationStrategy
  context?: NegotiationContext
  outcome?: NegotiationOutcome

  // Additional tracking fields
  documentHistory?: {
    type: string
    content: string
    offerAmount?: number
    listingPrice?: number
    extractedStrategies: StrategyExtraction[]
    timestamp: string
  }[]
  offerHistory?: {
    type: 'initial' | 'counter' | 'final'
    amount: number
    listingPrice: number
    responseTime?: number
    additionalNotes?: string
    timestamp: string
  }[]

  createdAt: string
  updatedAt: string
  version: number
}

// Constants for strategy extraction
const STRATEGY_KEYWORDS = {
  emotional: [
    'personal',
    'story',
    'family',
    'dream',
    'love',
    'perfect',
    'emotional',
  ],
  competitive: [
    'best',
    'highest',
    'compete',
    'better',
    'superior',
    'outbid',
    'competitive',
  ],
  valueAdd: [
    'value',
    'benefit',
    'advantage',
    'improvement',
    'enhancement',
    'upgrade',
  ],
  priceJustification: [
    'price',
    'cost',
    'worth',
    'value',
    'market',
    'comparable',
    'fair',
  ],
  timeConstraint: [
    'urgent',
    'deadline',
    'quickly',
    'soon',
    'time',
    'immediate',
    'fast',
  ],
  flexibility: [
    'flexible',
    'negotiate',
    'work with',
    'accommodate',
    'adjust',
    'open to',
  ],
}

export class NegotiationTracker {
  private static instance: NegotiationTracker
  private activeTracking: Map<string, Partial<TrackingRecord>> = new Map()

  private constructor() {}

  public static getInstance(): NegotiationTracker {
    if (!NegotiationTracker.instance) {
      NegotiationTracker.instance = new NegotiationTracker()
    }
    return NegotiationTracker.instance
  }

  /**
   * Start tracking a new negotiation
   */
  public async startNegotiationTracking(
    propertyId: string,
    propertyType: PropertyType,
    marketConditions: MarketConditions,
    contextualFactors: ContextualFactors
  ): Promise<string> {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const negotiationId = `${propertyId}-${Date.now()}`
      const negotiationRecord: Partial<TrackingRecord> = {
        id: negotiationId,
        agentId: user.uid,
        clientId: propertyId, // Using propertyId as clientId for now
        propertyId,
        negotiationId,
        context: {
          propertyType,
          marketConditions,
          priceRange: contextualFactors.priceRange || {
            min: 0,
            max: 0,
            label: 'Unknown',
          },
          daysOnMarket: contextualFactors.daysOnMarket || 0,
          multipleOffers: false,
          competingOffers: contextualFactors.competingOffers || 0,
          location: contextualFactors.location || { city: '', state: '' },
          listingAgent: contextualFactors.buyerAgent || '',
          buyerAgent: contextualFactors.sellerAgent || '',
          transactionType: 'purchase',
          marketTrend: 'stable',
          seasonality: contextualFactors.season || 'spring',
        },
        documentHistory: [],
        offerHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      // Store in active tracking
      this.activeTracking.set(negotiationId, negotiationRecord)

      logger.info(`Started tracking negotiation: ${negotiationId}`)
      return negotiationId
    } catch (error) {
      logger.error('Failed to start negotiation tracking:', error)
      throw error
    }
  }

  /**
   * Extract strategies from document content
   */
  public extractStrategiesFromContent(content: string): StrategyExtraction[] {
    const strategies: StrategyExtraction[] = []
    const lowerContent = content.toLowerCase()

    // Check for each strategy type
    for (const [strategyType, keywords] of Object.entries(STRATEGY_KEYWORDS)) {
      const matchedKeywords = keywords.filter(keyword =>
        lowerContent.includes(keyword.toLowerCase())
      )

      if (matchedKeywords.length > 0) {
        const confidence = Math.min(matchedKeywords.length / keywords.length, 1)
        strategies.push({
          type: strategyType as StrategyType,
          confidence,
          extractedText: this.extractRelevantText(content, matchedKeywords),
          keywords: matchedKeywords,
        })
      }
    }

    return strategies.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Track strategy usage from document generation
   */
  public async trackStrategyFromDocument(
    negotiationId: string,
    documentType: string,
    documentContent: string,
    offerAmount?: number,
    listingPrice?: number
  ): Promise<void> {
    try {
      const tracking = this.activeTracking.get(negotiationId)
      if (!tracking) {
        logger.warn(
          `No active tracking found for negotiation: ${negotiationId}`
        )
        return
      }

      const extractedStrategies =
        this.extractStrategiesFromContent(documentContent)

      // Add strategy data to tracking
      const strategyData = {
        type: documentType,
        content: documentContent,
        offerAmount,
        listingPrice,
        extractedStrategies,
        timestamp: new Date().toISOString(),
      }

      if (!tracking.documentHistory) {
        tracking.documentHistory = []
      }
      tracking.documentHistory.push(strategyData)

      tracking.updatedAt = new Date().toISOString()
      this.activeTracking.set(negotiationId, tracking)

      logger.info(
        `Tracked strategy from ${documentType} for negotiation: ${negotiationId}`
      )
    } catch (error) {
      logger.error('Failed to track strategy from document:', error)
      throw error
    }
  }

  /**
   * Track offer/counter-offer from negotiation pipeline
   */
  public async trackOfferActivity(
    negotiationId: string,
    offerType: 'initial' | 'counter' | 'final',
    offerAmount: number,
    listingPrice: number,
    responseTime?: number,
    additionalNotes?: string
  ): Promise<void> {
    try {
      const tracking = this.activeTracking.get(negotiationId)
      if (!tracking) {
        logger.warn(
          `No active tracking found for negotiation: ${negotiationId}`
        )
        return
      }

      const offerData = {
        type: offerType,
        amount: offerAmount,
        listingPrice,
        responseTime,
        additionalNotes,
        timestamp: new Date(),
      }

      if (!tracking.offerHistory) {
        tracking.offerHistory = []
      }
      tracking.offerHistory.push(offerData)

      tracking.updatedAt = new Date()
      this.activeTracking.set(negotiationId, tracking)

      logger.info(
        `Tracked ${offerType} offer for negotiation: ${negotiationId}`
      )
    } catch (error) {
      logger.error('Failed to track offer activity:', error)
      throw error
    }
  }

  /**
   * Update contextual factors during negotiation
   */
  public async updateContextualFactors(
    negotiationId: string,
    factors: Partial<ContextualFactors>
  ): Promise<void> {
    try {
      const tracking = this.activeTracking.get(negotiationId)
      if (!tracking) {
        logger.warn(
          `No active tracking found for negotiation: ${negotiationId}`
        )
        return
      }

      tracking.contextualFactors = {
        ...tracking.contextualFactors,
        ...factors,
      }

      tracking.updatedAt = new Date()
      this.activeTracking.set(negotiationId, tracking)

      logger.info(
        `Updated contextual factors for negotiation: ${negotiationId}`
      )
    } catch (error) {
      logger.error('Failed to update contextual factors:', error)
      throw error
    }
  }

  /**
   * Record negotiation outcome
   */
  public async recordNegotiationOutcome(
    negotiationId: string,
    outcome: OutcomeType,
    finalAmount?: number,
    timeToClose?: number,
    additionalNotes?: string
  ): Promise<void> {
    try {
      const tracking = this.activeTracking.get(negotiationId)
      if (!tracking) {
        logger.warn(
          `No active tracking found for negotiation: ${negotiationId}`
        )
        return
      }

      const outcomeData = {
        type: outcome,
        finalAmount,
        timeToClose,
        additionalNotes,
        timestamp: new Date(),
      }

      if (!tracking.outcomes) {
        tracking.outcomes = []
      }
      tracking.outcomes.push(outcomeData)

      tracking.finalOutcome = outcome
      tracking.updatedAt = new Date()

      // Save to Firebase if completed
      if (
        outcome === 'accepted' ||
        outcome === 'rejected' ||
        outcome === 'expired'
      ) {
        await this.saveNegotiationRecord(negotiationId)
      }

      logger.info(
        `Recorded ${outcome} outcome for negotiation: ${negotiationId}`
      )
    } catch (error) {
      logger.error('Failed to record negotiation outcome:', error)
      throw error
    }
  }

  /**
   * Save negotiation record to Firebase
   */
  private async saveNegotiationRecord(negotiationId: string): Promise<void> {
    try {
      const tracking = this.activeTracking.get(negotiationId)
      if (!tracking) {
        throw new Error(
          `No tracking data found for negotiation: ${negotiationId}`
        )
      }

      // Check if record already exists
      const existingRecord = await getNegotiationRecordById(negotiationId)

      if (existingRecord) {
        // Update existing record
        await updateNegotiationRecord(
          negotiationId,
          tracking as Partial<NegotiationRecord>
        )
      } else {
        // Create new record
        await createNegotiationRecord(tracking as NegotiationRecord)
      }

      // Remove from active tracking
      this.activeTracking.delete(negotiationId)

      logger.info(`Saved negotiation record to Firebase: ${negotiationId}`)
    } catch (error) {
      logger.error('Failed to save negotiation record:', error)
      throw error
    }
  }

  /**
   * Get active negotiation data
   */
  public getActiveNegotiation(
    negotiationId: string
  ): Partial<NegotiationRecord> | null {
    return this.activeTracking.get(negotiationId) || null
  }

  /**
   * Get all active negotiations
   */
  public getAllActiveNegotiations(): Map<string, Partial<NegotiationRecord>> {
    return new Map(this.activeTracking)
  }

  /**
   * Force save all active negotiations (useful for app shutdown)
   */
  public async saveAllActiveNegotiations(): Promise<void> {
    const savePromises: Promise<void>[] = []

    for (const [negotiationId, tracking] of this.activeTracking) {
      if (tracking.strategies && tracking.strategies.length > 0) {
        savePromises.push(this.saveNegotiationRecord(negotiationId))
      }
    }

    await Promise.all(savePromises)
    logger.info(`Saved ${savePromises.length} active negotiations to Firebase`)
  }

  /**
   * Extract relevant text around matched keywords
   */
  private extractRelevantText(content: string, keywords: string[]): string {
    const sentences = content.split(/[.!?]+/)
    const relevantSentences: string[] = []

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (
        keywords.some(keyword => lowerSentence.includes(keyword.toLowerCase()))
      ) {
        relevantSentences.push(sentence.trim())
      }
    }

    return relevantSentences.slice(0, 3).join('. ')
  }

  /**
   * Cleanup old active tracking data (older than 24 hours)
   */
  public cleanupOldTracking(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    for (const [negotiationId, tracking] of this.activeTracking) {
      if (tracking.createdAt && tracking.createdAt < oneDayAgo) {
        this.activeTracking.delete(negotiationId)
        logger.info(
          `Cleaned up old tracking data for negotiation: ${negotiationId}`
        )
      }
    }
  }
}

// Export singleton instance
export const negotiationTracker = NegotiationTracker.getInstance()
