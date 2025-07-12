import { negotiationTracker } from './negotiation-tracker'
import type {
  DocumentGenerationContext,
  DocumentGenerationOptions,
  DocumentPackageResult,
  GeneratedDocument,
} from '../langchain/workflows/document-orchestration'
import type {
  NegotiationPipelineState,
  NegotiationContext,
} from '../langchain/workflows/negotiation-pipeline'
import type { Offer } from '../../shared/types/offers'
import type { Negotiation } from '../../shared/types/negotiations'
import { logger } from '../../main/utils/logger'

/**
 * Integration service that connects negotiation tracking with existing workflows
 */
export class WorkflowIntegrationService {
  private static instance: WorkflowIntegrationService

  private constructor() {}

  public static getInstance(): WorkflowIntegrationService {
    if (!WorkflowIntegrationService.instance) {
      WorkflowIntegrationService.instance = new WorkflowIntegrationService()
    }
    return WorkflowIntegrationService.instance
  }

  // ========== DOCUMENT GENERATION INTEGRATION ==========

  /**
   * Hook called before document generation starts
   */
  public async onDocumentGenerationStart(
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions
  ): Promise<string | null> {
    try {
      // Extract contextual factors from document context
      const contextualFactors = this.extractContextualFactors(context)
      const propertyType = this.determinePropertyType(context)
      const marketConditions = this.determineMarketConditions(context)

      // Start negotiation tracking
      const negotiationId = await negotiationTracker.startNegotiationTracking(
        context.property?.id || `property-${Date.now()}`,
        propertyType,
        marketConditions,
        contextualFactors
      )

      logger.info(
        `Started negotiation tracking for document generation: ${negotiationId}`
      )
      return negotiationId
    } catch (error) {
      logger.error(
        'Failed to start negotiation tracking for document generation:',
        error
      )
      return null
    }
  }

  /**
   * Hook called after each document is generated
   */
  public async onDocumentGenerated(
    negotiationId: string,
    document: GeneratedDocument,
    context: DocumentGenerationContext
  ): Promise<void> {
    try {
      // Extract offer information from context
      const offerAmount = context.offer?.price || context.offer?.purchasePrice
      const listingPrice =
        context.property?.price || context.property?.listPrice

      // Track strategy from generated document
      await negotiationTracker.trackStrategyFromDocument(
        negotiationId,
        document.type,
        document.content,
        offerAmount,
        listingPrice
      )

      // Update contextual factors based on document insights
      if (document.metadata?.insights) {
        await this.updateContextFromDocumentInsights(
          negotiationId,
          document.metadata.insights
        )
      }

      logger.info(
        `Tracked strategy from ${document.type} document: ${negotiationId}`
      )
    } catch (error) {
      logger.error('Failed to track document generation:', error)
    }
  }

  /**
   * Hook called when document generation completes
   */
  public async onDocumentGenerationComplete(
    negotiationId: string,
    result: DocumentPackageResult,
    context: DocumentGenerationContext
  ): Promise<void> {
    try {
      // Track overall strategy package
      const overallStrategy = this.synthesizeOverallStrategy(result.documents)

      if (overallStrategy) {
        await negotiationTracker.trackStrategyFromDocument(
          negotiationId,
          'document_package',
          overallStrategy,
          context.offer?.price || context.offer?.purchasePrice,
          context.property?.price || context.property?.listPrice
        )
      }

      // Update contextual factors with final insights
      if (result.insights) {
        await this.updateContextFromPackageInsights(
          negotiationId,
          result.insights
        )
      }

      logger.info(`Completed document generation tracking: ${negotiationId}`)
    } catch (error) {
      logger.error('Failed to complete document generation tracking:', error)
    }
  }

  // ========== NEGOTIATION PIPELINE INTEGRATION ==========

  /**
   * Hook called when negotiation pipeline starts
   */
  public async onNegotiationPipelineStart(
    originalOffer: Offer,
    negotiationContext: NegotiationContext
  ): Promise<string | null> {
    try {
      // Extract contextual factors from negotiation context
      const contextualFactors =
        this.extractContextualFactorsFromNegotiation(negotiationContext)
      const propertyType =
        this.determinePropertyTypeFromNegotiation(negotiationContext)
      const marketConditions =
        this.determineMarketConditionsFromNegotiation(negotiationContext)

      // Start negotiation tracking
      const negotiationId = await negotiationTracker.startNegotiationTracking(
        originalOffer.propertyId,
        propertyType,
        marketConditions,
        contextualFactors
      )

      // Track initial offer
      await negotiationTracker.trackOfferActivity(
        negotiationId,
        'initial',
        originalOffer.purchasePrice,
        negotiationContext.property.listPrice,
        undefined,
        'Initial offer from negotiation pipeline'
      )

      logger.info(`Started negotiation tracking for pipeline: ${negotiationId}`)
      return negotiationId
    } catch (error) {
      logger.error('Failed to start negotiation tracking for pipeline:', error)
      return null
    }
  }

  /**
   * Hook called when counter-offer is made
   */
  public async onCounterOfferMade(
    negotiationId: string,
    counterOffer: any,
    responseTime?: number
  ): Promise<void> {
    try {
      await negotiationTracker.trackOfferActivity(
        negotiationId,
        'counter',
        counterOffer.purchasePrice || counterOffer.price,
        counterOffer.originalPrice || counterOffer.listPrice,
        responseTime,
        `Counter offer #${counterOffer.counterNumber}: ${counterOffer.strategy}`
      )

      logger.info(`Tracked counter offer: ${negotiationId}`)
    } catch (error) {
      logger.error('Failed to track counter offer:', error)
    }
  }

  /**
   * Hook called when negotiation completes
   */
  public async onNegotiationComplete(
    negotiationId: string,
    outcome: 'accepted' | 'rejected' | 'expired',
    finalAmount?: number,
    timeToClose?: number,
    additionalNotes?: string
  ): Promise<void> {
    try {
      await negotiationTracker.recordNegotiationOutcome(
        negotiationId,
        outcome,
        finalAmount,
        timeToClose,
        additionalNotes
      )

      logger.info(`Recorded negotiation outcome: ${negotiationId} - ${outcome}`)
    } catch (error) {
      logger.error('Failed to record negotiation outcome:', error)
    }
  }

  // ========== OFFER LIFECYCLE INTEGRATION ==========

  /**
   * Hook called when offer status changes
   */
  public async onOfferStatusChange(
    negotiationId: string,
    offer: Offer,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      // Map offer status to negotiation outcome
      let outcome: 'accepted' | 'rejected' | 'expired' | 'pending' = 'pending'

      switch (newStatus) {
        case 'accepted':
          outcome = 'accepted'
          break
        case 'rejected':
          outcome = 'rejected'
          break
        case 'expired':
          outcome = 'expired'
          break
        default:
          outcome = 'pending'
      }

      if (outcome !== 'pending') {
        const timeToClose = this.calculateTimeToClose(offer)
        await negotiationTracker.recordNegotiationOutcome(
          negotiationId,
          outcome,
          offer.purchasePrice,
          timeToClose,
          `Offer status changed from ${previousStatus} to ${newStatus}`
        )
      }

      logger.info(
        `Tracked offer status change: ${negotiationId} - ${previousStatus} → ${newStatus}`
      )
    } catch (error) {
      logger.error('Failed to track offer status change:', error)
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Extract contextual factors from document generation context
   */
  private extractContextualFactors(context: DocumentGenerationContext): any {
    return {
      buyerAgent: context.agent?.name,
      sellerAgent: context.property?.sellerAgent,
      competingOffers: context.market?.competingOffers,
      daysOnMarket: context.property?.daysOnMarket,
      priceRange: context.property?.priceRange,
      season: this.getCurrentSeason(),
      location: {
        city: context.property?.address?.city,
        state: context.property?.address?.state,
        neighborhood: context.property?.address?.neighborhood,
      },
    }
  }

  /**
   * Extract contextual factors from negotiation context
   */
  private extractContextualFactorsFromNegotiation(
    context: NegotiationContext
  ): any {
    return {
      buyerAgent:
        context.client.role === 'buyer' ? context.agent?.name : 'Unknown',
      sellerAgent:
        context.client.role === 'seller' ? context.agent?.name : 'Unknown',
      competingOffers:
        context.marketConditions.competitionLevel === 'high'
          ? 3
          : context.marketConditions.competitionLevel === 'medium'
            ? 1
            : 0,
      daysOnMarket: context.property.daysOnMarket,
      priceRange: {
        min: context.property.listPrice * 0.9,
        max: context.property.listPrice * 1.1,
        label: this.getPriceRangeLabel(context.property.listPrice),
      },
      season: this.getCurrentSeason(),
      location: {
        city: this.extractCityFromAddress(context.property.address),
        state: this.extractStateFromAddress(context.property.address),
      },
    }
  }

  /**
   * Determine property type from context
   */
  private determinePropertyType(
    context: DocumentGenerationContext
  ): 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' {
    const propertyType =
      context.property?.type?.toLowerCase() || 'single_family'

    if (propertyType.includes('condo')) return 'condo'
    if (propertyType.includes('townhouse') || propertyType.includes('town'))
      return 'townhouse'
    if (propertyType.includes('multi') || propertyType.includes('duplex'))
      return 'multi_family'
    if (propertyType.includes('land') || propertyType.includes('lot'))
      return 'land'

    return 'single_family'
  }

  /**
   * Determine property type from negotiation context
   */
  private determinePropertyTypeFromNegotiation(
    context: NegotiationContext
  ): 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' {
    // For now, default to single_family - could be enhanced with property data
    return 'single_family'
  }

  /**
   * Determine market conditions from context
   */
  private determineMarketConditions(
    context: DocumentGenerationContext
  ): 'hot' | 'warm' | 'cool' {
    const marketTrend = context.market?.trend?.toLowerCase() || 'warm'

    if (marketTrend.includes('hot') || marketTrend.includes('seller'))
      return 'hot'
    if (marketTrend.includes('cool') || marketTrend.includes('buyer'))
      return 'cool'

    return 'warm'
  }

  /**
   * Determine market conditions from negotiation context
   */
  private determineMarketConditionsFromNegotiation(
    context: NegotiationContext
  ): 'hot' | 'warm' | 'cool' {
    return context.marketConditions.trend
  }

  /**
   * Synthesize overall strategy from multiple documents
   */
  private synthesizeOverallStrategy(
    documents: GeneratedDocument[]
  ): string | null {
    if (!documents || documents.length === 0) return null

    const strategies: string[] = []

    documents.forEach(doc => {
      if (doc.content && doc.content.length > 100) {
        // Extract key strategic elements from each document
        const strategyElements = this.extractStrategyElements(
          doc.content,
          doc.type
        )
        if (strategyElements) {
          strategies.push(`${doc.type}: ${strategyElements}`)
        }
      }
    })

    return strategies.length > 0 ? strategies.join('\n\n') : null
  }

  /**
   * Extract strategy elements from document content
   */
  private extractStrategyElements(
    content: string,
    documentType: string
  ): string | null {
    const lowerContent = content.toLowerCase()

    // Look for strategic phrases and approaches
    const strategicPhrases = [
      'our strategy',
      'we propose',
      'our approach',
      'key advantage',
      'competitive edge',
      'value proposition',
      'negotiation point',
      'leverage',
      'positioning',
    ]

    for (const phrase of strategicPhrases) {
      const index = lowerContent.indexOf(phrase)
      if (index !== -1) {
        // Extract context around the strategic phrase
        const start = Math.max(0, index - 50)
        const end = Math.min(content.length, index + 200)
        return content.substring(start, end).trim()
      }
    }

    return null
  }

  /**
   * Update context from document insights
   */
  private async updateContextFromDocumentInsights(
    negotiationId: string,
    insights: any
  ): Promise<void> {
    try {
      const contextualFactors: any = {}

      if (insights.marketAnalysis) {
        contextualFactors.marketAnalysis = insights.marketAnalysis
      }

      if (insights.competitivePosition) {
        contextualFactors.competitivePosition = insights.competitivePosition
      }

      if (insights.riskFactors) {
        contextualFactors.riskFactors = insights.riskFactors
      }

      if (Object.keys(contextualFactors).length > 0) {
        await negotiationTracker.updateContextualFactors(
          negotiationId,
          contextualFactors
        )
      }
    } catch (error) {
      logger.error('Failed to update context from document insights:', error)
    }
  }

  /**
   * Update context from package insights
   */
  private async updateContextFromPackageInsights(
    negotiationId: string,
    insights: any
  ): Promise<void> {
    try {
      const contextualFactors: any = {}

      if (insights.overallStrategy) {
        contextualFactors.overallStrategy = insights.overallStrategy
      }

      if (insights.recommendedApproach) {
        contextualFactors.recommendedApproach = insights.recommendedApproach
      }

      if (insights.successProbability) {
        contextualFactors.successProbability = insights.successProbability
      }

      if (Object.keys(contextualFactors).length > 0) {
        await negotiationTracker.updateContextualFactors(
          negotiationId,
          contextualFactors
        )
      }
    } catch (error) {
      logger.error('Failed to update context from package insights:', error)
    }
  }

  /**
   * Calculate time to close in days
   */
  private calculateTimeToClose(offer: Offer): number {
    const createdDate = new Date(offer.createdAt)
    const updatedDate = new Date(offer.updatedAt)
    const timeDiff = updatedDate.getTime() - createdDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  /**
   * Get price range label
   */
  private getPriceRangeLabel(price: number): string {
    if (price < 300000) return 'Under $300K'
    if (price < 500000) return '$300K-$500K'
    if (price < 750000) return '$500K-$750K'
    if (price < 1000000) return '$750K-$1M'
    return 'Above $1M'
  }

  /**
   * Extract city from address
   */
  private extractCityFromAddress(address: string): string {
    const parts = address.split(',')
    return parts.length > 1 ? parts[1].trim() : ''
  }

  /**
   * Extract state from address
   */
  private extractStateFromAddress(address: string): string {
    const parts = address.split(',')
    if (parts.length > 2) {
      const stateZip = parts[2].trim()
      return stateZip.substring(0, 2).toUpperCase()
    }
    return ''
  }
}

// Export singleton instance
export const workflowIntegration = WorkflowIntegrationService.getInstance()
