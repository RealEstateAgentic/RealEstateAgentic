/**
 * Analytics Module - Main Exports
 *
 * This module provides comprehensive analytics capabilities for real estate negotiations,
 * including success rate calculations, strategy recommendations, and performance tracking.
 */

// Core Analytics Services
export {
  successRateCalculator,
  SuccessRateCalculator,
} from './success-rate-calculator'
export {
  strategyRecommender,
  StrategyRecommender,
} from './strategy-recommender'
export { negotiationTracker, NegotiationTracker } from './negotiation-tracker'

// Import instances for internal use
import { successRateCalculator } from './success-rate-calculator'
import { strategyRecommender } from './strategy-recommender'
import { negotiationTracker } from './negotiation-tracker'

// Analytics Types
export type {
  // Core Types
  NegotiationRecord,
  NegotiationStrategy,
  NegotiationContext,
  NegotiationOutcome,
  // Analytics Response Types
  SuccessRateAnalytics,
  StrategySuccessRate,
  PropertyTypeSuccessRate,
  MarketConditionSuccessRate,
  PriceRangeSuccessRate,
  CompetitiveSuccessRate,
  PerformanceTrend,
  // Recommendation Types
  StrategyRecommendation,
  RecommendationResponse,
  // Report Types
  AnalyticsReport,
  ReportResponse,
  // Query Types
  AnalyticsQuery,
  AnalyticsResponse,
  NegotiationAnalyticsResponse,
  // Utility Types
  PriceRange,
  ValidationResult,
  DataQualityMetrics,
  AnalyticsCache,
  // Permission Types
  AnalyticsPermission,
  AnalyticsEventType,
  ReportFormat,
} from '../../shared/types/analytics'

// Firebase Analytics Collections
export {
  // Query Functions
  getNegotiationRecords,
  getAgentAnalytics,
  getNegotiationRecord,
  // Mutation Functions
  createNegotiationRecord,
  updateNegotiationRecord,
  deleteNegotiationRecord,
  storeAgentAnalytics,
  // Cache Functions
  getCachedAnalytics,
  setCachedAnalytics,
  invalidateAnalyticsCache,
  // Validation Functions
  validateNegotiationRecord,
} from '../firebase/collections/negotiation-analytics'

// Utility Functions (to be implemented)
// export { ... } from './utils'

// Constants
export const ANALYTICS_CONSTANTS = {
  // Data Requirements
  MIN_DATA_POINTS: 5,
  OPTIMAL_DATA_POINTS: 10,
  CONFIDENCE_THRESHOLD: 0.6,

  // Cache Settings
  CACHE_DURATION_MINUTES: 60,
  RECOMMENDATION_CACHE_DURATION_MINUTES: 120,

  // Success Rate Thresholds
  HIGH_SUCCESS_RATE: 0.8,
  MEDIUM_SUCCESS_RATE: 0.6,
  LOW_SUCCESS_RATE: 0.4,

  // Confidence Levels
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4,

  // Strategy Categories
  STRATEGY_TYPES: [
    'initial_offer',
    'escalation',
    'contingency',
    'communication',
    'overall',
  ] as const,

  // Property Types
  PROPERTY_TYPES: [
    'single_family',
    'condo',
    'townhouse',
    'multi_family',
    'land',
  ] as const,

  // Market Conditions
  MARKET_CONDITIONS: ['hot', 'warm', 'cool'] as const,

  // Communication Tones
  COMMUNICATION_TONES: [
    'professional',
    'warm',
    'confident',
    'personal',
  ] as const,

  // Report Types
  REPORT_TYPES: [
    'top_strategies',
    'performance_trends',
    'strategy_breakdown',
    'recommendations',
  ] as const,
}

// Helper Functions
export const AnalyticsHelpers = {
  /**
   * Initialize analytics for a new agent
   */
  initializeAgent: async (agentId: string) => {
    try {
      // Check data sufficiency
      const sufficiency =
        await successRateCalculator.checkDataSufficiency(agentId)

      return {
        success: true,
        data: {
          agentId,
          initialized: true,
          dataSufficiency: sufficiency,
          recommendations: sufficiency.sufficient ? 'data_driven' : 'fallback',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Generate comprehensive analytics summary
   */
  generateSummary: async (agentId: string) => {
    try {
      const analytics =
        await successRateCalculator.calculateSuccessRateAnalytics(agentId)
      const recommendations = await strategyRecommender.generateRecommendations(
        agentId,
        {
          propertyType: 'single_family',
          marketConditions: 'warm',
          priceRange: { min: 400000, max: 500000, label: '$400K-$500K' },
          multipleOffers: false,
          competingOffers: 0,
          daysOnMarket: 15,
          marketTrend: 'stable',
          seasonality: 'spring',
          location: { city: 'Unknown', state: 'Unknown' },
          listingAgent: 'unknown',
          buyerAgent: agentId,
          transactionType: 'purchase',
        }
      )

      return {
        success: true,
        data: {
          analytics: analytics.success ? analytics.data : null,
          recommendations: recommendations.success
            ? recommendations.data
            : null,
          summary: {
            totalNegotiations: analytics.data?.totalNegotiations || 0,
            successRate: analytics.data?.overallSuccessRate || 0,
            topStrategy:
              analytics.data?.byStrategy[0]?.strategyType || 'unknown',
            recommendationCount: recommendations.data?.length || 0,
            lastUpdated: new Date().toISOString(),
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Clear all analytics cache for agent
   */
  clearAllCache: async (agentId: string) => {
    try {
      await Promise.all([
        successRateCalculator.clearCache(agentId),
        strategyRecommender.clearCache(agentId),
        negotiationTracker.clearCache(agentId),
      ])

      return {
        success: true,
        message: 'All analytics cache cleared successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Validate analytics permissions for agent
   */
  validatePermissions: (agentId: string, requestedAgentId: string): boolean => {
    // Agents can only access their own analytics
    return agentId === requestedAgentId
  },

  /**
   * Get analytics health status
   */
  getHealthStatus: async (agentId: string) => {
    try {
      const [dataSufficiency, cacheStatus, lastActivity] = await Promise.all([
        successRateCalculator.checkDataSufficiency(agentId),
        // Mock cache status check
        Promise.resolve({
          healthy: true,
          lastAccess: new Date().toISOString(),
        }),
        // Mock last activity check
        Promise.resolve({ lastNegotiation: new Date().toISOString() }),
      ])

      return {
        success: true,
        data: {
          dataSufficiency,
          cacheStatus,
          lastActivity,
          healthScore: dataSufficiency.sufficient
            ? 100
            : dataSufficiency.currentCount > 0
              ? 50
              : 0,
          status: dataSufficiency.sufficient
            ? 'healthy'
            : dataSufficiency.currentCount > 0
              ? 'limited'
              : 'insufficient',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
}

// Version Information
export const ANALYTICS_VERSION = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  features: [
    'Success Rate Analytics',
    'Strategy Recommendations',
    'Performance Tracking',
    'Market Analysis',
    'Trend Analysis',
    'Report Generation',
    'Cache Management',
    'Data Validation',
  ],
  compatibility: {
    minNodeVersion: '18.0.0',
    supportedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    firebaseVersion: '9.x',
    reactVersion: '18.x',
  },
}

// Default Export - Main Analytics API
export default {
  // Core Services
  successRateCalculator,
  strategyRecommender,
  negotiationTracker,

  // Helper Functions
  helpers: AnalyticsHelpers,

  // Constants
  constants: ANALYTICS_CONSTANTS,

  // Version
  version: ANALYTICS_VERSION,

  // Quick Access Methods
  async getAnalytics(agentId: string) {
    return successRateCalculator.calculateSuccessRateAnalytics(agentId)
  },

  async getRecommendations(agentId: string, context: any) {
    return strategyRecommender.generateRecommendations(agentId, context)
  },

  async trackNegotiation(agentId: string, negotiationData: any) {
    return negotiationTracker.trackNegotiation(agentId, negotiationData)
  },

  // Utility Methods
  validatePermissions: AnalyticsHelpers.validatePermissions,
  clearCache: AnalyticsHelpers.clearAllCache,
  getHealth: AnalyticsHelpers.getHealthStatus,

  // Initialization
  initialize: AnalyticsHelpers.initializeAgent,
}
