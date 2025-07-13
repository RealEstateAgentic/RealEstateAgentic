import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { Progress } from '../ui/progress'
import {
  Lightbulb,
  Target,
  TrendingUp,
  DollarSign,
  Home,
  MessageSquare,
  Users,
  RefreshCw,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { strategyRecommender } from '../../../lib/analytics/strategy-recommender'
import type {
  StrategyRecommendation,
  NegotiationContext,
  RecommendationResponse,
} from '../../../shared/types/analytics'
import { useAuth } from '../../hooks/useAuth'

interface StrategyRecommendationsProps {
  className?: string
  context: NegotiationContext
  onRecommendationSelected?: (recommendation: StrategyRecommendation) => void
  onApplyRecommendation?: (recommendation: StrategyRecommendation) => void
  showDetailed?: boolean
}

interface RecommendationCardProps {
  recommendation: StrategyRecommendation
  onSelect?: (recommendation: StrategyRecommendation) => void
  onApply?: (recommendation: StrategyRecommendation) => void
  isSelected?: boolean
}

const RECOMMENDATION_ICONS = {
  initial_offer: <DollarSign className="w-5 h-5" />,
  escalation: <TrendingUp className="w-5 h-5" />,
  contingency: <CheckCircle className="w-5 h-5" />,
  communication: <MessageSquare className="w-5 h-5" />,
  overall: <Target className="w-5 h-5" />,
}

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onSelect,
  onApply,
  isSelected = false,
}) => {
  const confidenceLevel =
    recommendation.recommendation.confidence >= 0.8
      ? 'high'
      : recommendation.recommendation.confidence >= 0.6
        ? 'medium'
        : 'low'

  const confidenceText =
    recommendation.recommendation.confidence >= 0.8
      ? 'High'
      : recommendation.recommendation.confidence >= 0.6
        ? 'Medium'
        : 'Low'

  return (
    <Card
      className={`p-4 transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {
              RECOMMENDATION_ICONS[
                recommendation.recommendationType as keyof typeof RECOMMENDATION_ICONS
              ]
            }
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">
              {recommendation.recommendationType.replace('_', ' ')}
            </h3>
            <p className="text-sm text-gray-600">
              {recommendation.recommendation.strategy}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${CONFIDENCE_COLORS[confidenceLevel]}`}
          >
            {confidenceText} Confidence
          </span>
          <div className="flex items-center text-sm text-gray-500">
            <Star className="w-4 h-4 mr-1" />
            {Math.round(
              recommendation.recommendation.expectedSuccessRate * 100
            )}
            %
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Confidence Level
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(recommendation.recommendation.confidence * 100)}%
          </span>
        </div>
        <Progress
          value={recommendation.recommendation.confidence * 100}
          className="h-2"
        />
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Recommendation</h4>
        <div className="bg-gray-50 rounded-lg p-3">
          {typeof recommendation.recommendation.value === 'object' ? (
            <div className="space-y-2">
              {Object.entries(recommendation.recommendation.value).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm font-medium">
              {String(recommendation.recommendation.value)}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Why This Works</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {recommendation.recommendation.reasoning}
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Based On</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Home className="w-3 h-3 text-gray-500" />
            <span>{recommendation.basedOn.propertyType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3 h-3 text-gray-500" />
            <span>{recommendation.basedOn.marketConditions}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-3 h-3 text-gray-500" />
            <span>{recommendation.basedOn.priceRange.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3 text-gray-500" />
            <span>
              {recommendation.basedOn.competitiveEnvironment
                ? 'Competitive'
                : 'Non-competitive'}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Based on {recommendation.basedOn.historicalDataPoints} historical data
          points
        </div>
      </div>

      {recommendation.alternatives.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Alternative Strategies
          </h4>
          <div className="space-y-2">
            {recommendation.alternatives
              .slice(0, 2)
              .map((alt: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {alt.strategy}
                    </p>
                    <p className="text-xs text-gray-500">{alt.reasoning}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(alt.expectedSuccessRate * 100)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(recommendation)}
            className="flex-1"
          >
            <Info className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
        {onApply && (
          <Button
            size="sm"
            onClick={() => onApply(recommendation)}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Strategy
          </Button>
        )}
      </div>
    </Card>
  )
}

export const StrategyRecommendations: React.FC<
  StrategyRecommendationsProps
> = ({
  className = '',
  context,
  onRecommendationSelected,
  onApplyRecommendation,
  showDetailed = false,
}) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<
    StrategyRecommendation[]
  >([])
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<StrategyRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataRequirements, setDataRequirements] = useState<any>(null)

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    if (!user?.uid) return

    setLoading(true)
    setError(null)

    try {
      const result = await strategyRecommender.generateRecommendations(
        user.uid,
        context,
        {
          includeAlternatives: true,
          minConfidence: 0.5,
          maxRecommendations: 6,
        }
      )

      if (result.success && result.data) {
        setRecommendations(result.data)
      } else {
        setError(result.error || 'Failed to load recommendations')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user?.uid, context])

  // Load data requirements
  const loadDataRequirements = useCallback(async () => {
    const requirements = strategyRecommender.getMinimumDataRequirements()
    setDataRequirements(requirements)
  }, [])

  // Handle recommendation selection
  const handleRecommendationSelect = (
    recommendation: StrategyRecommendation
  ) => {
    setSelectedRecommendation(recommendation)
    onRecommendationSelected?.(recommendation)
  }

  // Handle recommendation application
  const handleApplyRecommendation = (
    recommendation: StrategyRecommendation
  ) => {
    onApplyRecommendation?.(recommendation)
  }

  // Load recommendations on mount and when context changes
  useEffect(() => {
    loadRecommendations()
    loadDataRequirements()
  }, [loadRecommendations, loadDataRequirements])

  // Render context summary
  const renderContextSummary = () => (
    <Card className="p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Negotiation Context</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Home className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-gray-500">Property</p>
            <p className="font-medium capitalize">
              {context.propertyType.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-gray-500">Market</p>
            <p className="font-medium capitalize">{context.marketConditions}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-gray-500">Price Range</p>
            <p className="font-medium">{context.priceRange.label}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-gray-500">Competition</p>
            <p className="font-medium">
              {context.multipleOffers
                ? `${context.competingOffers} offers`
                : 'Single offer'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )

  // Render data requirements warning
  const renderDataRequirementsWarning = () => {
    if (!dataRequirements) return null

    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50">
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <div className="ml-2">
          <h4 className="font-medium text-yellow-800">Data Requirements</h4>
          <p className="text-yellow-700 text-sm">
            For optimal recommendations, you need at least{' '}
            {dataRequirements.optimal} completed negotiations. Minimum required:{' '}
            {dataRequirements.minimal} negotiations.
          </p>
        </div>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading recommendations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div className="ml-2">
            <h4 className="font-medium text-red-800">
              Error loading recommendations
            </h4>
            <p className="text-red-700">{error}</p>
          </div>
        </Alert>
        <Button onClick={loadRecommendations} className="w-full">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Strategy Recommendations
            </h2>
            <p className="text-gray-600">
              AI-powered negotiation strategies for your context
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecommendations}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Context Summary */}
      {renderContextSummary()}

      {/* Data Requirements Warning */}
      {renderDataRequirementsWarning()}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended Strategies ({recommendations.length})
            </h3>
            <div className="text-sm text-gray-500">
              Sorted by confidence and success rate
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={`${recommendation.recommendationType}-${index}`}
                recommendation={recommendation}
                onSelect={showDetailed ? handleRecommendationSelect : undefined}
                onApply={onApplyRecommendation}
                isSelected={
                  selectedRecommendation?.recommendationType ===
                  recommendation.recommendationType
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Recommendations Available
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to generate recommendations for the current context. This may
            be due to insufficient historical data or specific market
            conditions.
          </p>
          <Button onClick={loadRecommendations} variant="outline">
            Try Again
          </Button>
        </Card>
      )}

      {/* Detailed Recommendation View */}
      {showDetailed && selectedRecommendation && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Detailed Analysis:{' '}
              {selectedRecommendation.recommendationType.replace('_', ' ')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRecommendation(null)}
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Strategy Details
              </h4>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      Expected Success Rate
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {Math.round(
                        selectedRecommendation.recommendation
                          .expectedSuccessRate * 100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      selectedRecommendation.recommendation
                        .expectedSuccessRate * 100
                    }
                    className="h-2"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      Confidence Level
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {Math.round(
                        selectedRecommendation.recommendation.confidence * 100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      selectedRecommendation.recommendation.confidence * 100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Historical Context
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Data Points</span>
                  <span className="font-medium">
                    {selectedRecommendation.basedOn.historicalDataPoints}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium capitalize">
                    {selectedRecommendation.basedOn.propertyType.replace(
                      '_',
                      ' '
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Market Conditions</span>
                  <span className="font-medium capitalize">
                    {selectedRecommendation.basedOn.marketConditions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span className="font-medium">
                    {selectedRecommendation.basedOn.priceRange.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Competition</span>
                  <span className="font-medium">
                    {selectedRecommendation.basedOn.competitiveEnvironment
                      ? 'Multiple offers'
                      : 'Single offer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Complete Reasoning
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-900 leading-relaxed">
                {selectedRecommendation.recommendation.reasoning}
              </p>
            </div>
          </div>

          {selectedRecommendation.alternatives.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Alternative Strategies
              </h4>
              <div className="space-y-3">
                {selectedRecommendation.alternatives.map(
                  (alt: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          {alt.strategy}
                        </h5>
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round(alt.expectedSuccessRate * 100)}% success
                          rate
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alt.reasoning}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => handleApplyRecommendation(selectedRecommendation)}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Apply This Strategy</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Recommendations are generated based on historical data and market
          conditions. Always review and adapt strategies based on specific
          circumstances.
        </p>
      </div>
    </div>
  )
}

export default StrategyRecommendations
