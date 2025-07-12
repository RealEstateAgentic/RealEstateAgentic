import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Alert } from '../ui/alert'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calendar,
  DollarSign,
  Home,
  Users,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react'
import { successRateCalculator } from '../../lib/analytics/success-rate-calculator'
import type {
  SuccessRateAnalytics,
  AnalyticsReport,
  AnalyticsQuery,
  PerformanceTrend,
  StrategySuccessRate,
} from '../../shared/types/analytics'
import { useAuth } from '../hooks/useAuth'

interface AnalyticsReportsProps {
  className?: string
  onReportGenerated?: (report: AnalyticsReport) => void
  initialFilters?: Partial<AnalyticsQuery>
}

interface FilterOptions {
  dateRange: {
    startDate: string
    endDate: string
  }
  propertyTypes: string[]
  marketConditions: string[]
  showSuccessfulOnly: boolean
}

const CHART_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C7C',
]

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  className = '',
  onReportGenerated,
  initialFilters,
}) => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<SuccessRateAnalytics | null>(null)
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trends' | 'strategies' | 'market'
  >('overview')
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    propertyTypes: [],
    marketConditions: [],
    showSuccessfulOnly: false,
  })

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!user?.uid) return

    setLoading(true)
    setError(null)

    try {
      const query: Partial<AnalyticsQuery> = {
        dateRange: {
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
        },
        filters: {
          propertyTypes:
            filters.propertyTypes.length > 0
              ? filters.propertyTypes
              : undefined,
          marketConditions:
            filters.marketConditions.length > 0
              ? filters.marketConditions
              : undefined,
          successful: filters.showSuccessfulOnly ? true : undefined,
        },
        ...initialFilters,
      }

      const result = await successRateCalculator.calculateSuccessRateAnalytics(
        user.uid,
        query
      )

      if (result.success && result.data) {
        setAnalytics(result.data)
      } else {
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user?.uid, filters, initialFilters])

  // Generate specific report
  const generateReport = useCallback(
    async (reportType: 'strategy' | 'trends' | 'market' | 'summary') => {
      if (!user?.uid) return

      setLoading(true)
      setError(null)

      try {
        const query: Partial<AnalyticsQuery> = {
          dateRange: {
            startDate: filters.dateRange.startDate,
            endDate: filters.dateRange.endDate,
          },
          filters: {
            propertyTypes:
              filters.propertyTypes.length > 0
                ? filters.propertyTypes
                : undefined,
            marketConditions:
              filters.marketConditions.length > 0
                ? filters.marketConditions
                : undefined,
            successful: filters.showSuccessfulOnly ? true : undefined,
          },
        }

        let result
        switch (reportType) {
          case 'strategy':
            result =
              await successRateCalculator.generateStrategyEffectivenessReport(
                user.uid,
                query
              )
            break
          case 'trends':
            result =
              await successRateCalculator.generatePerformanceTrendsReport(
                user.uid,
                query
              )
            break
          case 'market':
            result = await successRateCalculator.generateMarketAnalysisReport(
              user.uid,
              query
            )
            break
          case 'summary':
            result = await successRateCalculator.generateExecutiveSummaryReport(
              user.uid,
              query
            )
            break
          default:
            throw new Error('Invalid report type')
        }

        if (result.success && result.data) {
          setSelectedReport(result.data)
          onReportGenerated?.(result.data)
        } else {
          setError(result.error || 'Failed to generate report')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    },
    [user?.uid, filters, onReportGenerated]
  )

  // Load data on mount and when filters change
  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Render overview tab
  const renderOverview = () => {
    if (!analytics) return null

    const overallStats = [
      {
        label: 'Total Negotiations',
        value: analytics.totalNegotiations,
        icon: <Target className="w-4 h-4" />,
        color: 'text-blue-600',
      },
      {
        label: 'Success Rate',
        value: `${Math.round(analytics.overallSuccessRate * 100)}%`,
        icon: <Award className="w-4 h-4" />,
        color: 'text-green-600',
      },
      {
        label: 'Successful Deals',
        value: analytics.successfulNegotiations,
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-emerald-600',
      },
      {
        label: 'Data Points',
        value: analytics.dataRange.totalRecords,
        icon: <Calendar className="w-4 h-4" />,
        color: 'text-purple-600',
      },
    ]

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overallStats.map((stat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color}`}>{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Top Strategies */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top Performing Strategies
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byStrategy.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="strategyType"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={value => `${Math.round(value * 100)}%`} />
                <Tooltip
                  formatter={(value: number) => [
                    `${Math.round(value * 100)}%`,
                    'Success Rate',
                  ]}
                />
                <Bar dataKey="successRate" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Property Type Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Performance by Property Type
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byPropertyType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ propertyType, successRate }) =>
                    `${propertyType}: ${Math.round(successRate * 100)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="successRate"
                >
                  {analytics.byPropertyType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${Math.round(value * 100)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    )
  }

  // Render trends tab
  const renderTrends = () => {
    if (!analytics?.trends.length)
      return (
        <Card className="p-6">
          <p className="text-center text-gray-500">No trend data available</p>
        </Card>
      )

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={value => `${Math.round(value * 100)}%`} />
                <Tooltip
                  formatter={(value: number) => [
                    `${Math.round(value * 100)}%`,
                    'Success Rate',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#0088FE"
                  name="Success Rate"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.trends.slice(-3).map((trend, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {trend.period}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.round(trend.successRate * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {trend.totalNegotiations} negotiations
                  </p>
                </div>
                <div
                  className={`${
                    trend.trend === 'improving'
                      ? 'text-green-600'
                      : trend.trend === 'declining'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {trend.trend === 'improving' ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : trend.trend === 'declining' ? (
                    <TrendingDown className="w-6 h-6" />
                  ) : (
                    <Target className="w-6 h-6" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Render strategies tab
  const renderStrategies = () => {
    if (!analytics?.byStrategy.length)
      return (
        <Card className="p-6">
          <p className="text-center text-gray-500">
            No strategy data available
          </p>
        </Card>
      )

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Strategy Effectiveness</h3>
          <div className="space-y-4">
            {analytics.byStrategy.slice(0, 10).map((strategy, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {strategy.strategyType}: {String(strategy.strategyValue)}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {strategy.totalAttempts} attempts
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.successRate > 0.7
                          ? 'bg-green-100 text-green-800'
                          : strategy.successRate > 0.5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {Math.round(strategy.successRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round(strategy.successRate * 100)}%</span>
                  </div>
                  <Progress
                    value={strategy.successRate * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span>{Math.round(strategy.confidence * 100)}%</span>
                  </div>
                  <Progress value={strategy.confidence * 100} className="h-2" />
                  {strategy.averageDaysToClose && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Avg. Days to Close</span>
                      <span>
                        {Math.round(strategy.averageDaysToClose)} days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // Render market analysis tab
  const renderMarket = () => {
    if (!analytics) return null

    return (
      <div className="space-y-6">
        {/* Market Conditions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Market Conditions Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byMarketConditions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="marketCondition" />
                <YAxis tickFormatter={value => `${Math.round(value * 100)}%`} />
                <Tooltip
                  formatter={(value: number) => [
                    `${Math.round(value * 100)}%`,
                    'Success Rate',
                  ]}
                />
                <Bar dataKey="successRate" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Price Range Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Price Range Performance
          </h3>
          <div className="space-y-4">
            {analytics.byPriceRange.map((range, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{range.priceRange.label}</h4>
                  <span className="text-sm text-gray-500">
                    {range.totalAttempts} attempts
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round(range.successRate * 100)}%</span>
                  </div>
                  <Progress value={range.successRate * 100} className="h-2" />
                  {range.averageOfferPercentage && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Avg. Offer %</span>
                      <span>{Math.round(range.averageOfferPercentage)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Competitive Environment */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Competitive Environment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.byCompetitiveEnvironment.map((env, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {env.multipleOffers ? 'Multiple Offers' : 'Single Offer'}
                  </h4>
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round(env.successRate * 100)}%</span>
                  </div>
                  <Progress value={env.successRate * 100} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Avg. Competing Offers</span>
                    <span>{Math.round(env.averageCompetingOffers)}</span>
                  </div>
                  {env.winningFactors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Winning Factors:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {env.winningFactors.map((factor, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // Render filters
  const renderFilters = () => (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setFilters({
              dateRange: {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              },
              propertyTypes: [],
              marketConditions: [],
              showSuccessfulOnly: false,
            })
          }
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.dateRange.startDate}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, startDate: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.dateRange.endDate}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, endDate: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Types
          </label>
          <select
            multiple
            value={filters.propertyTypes}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                propertyTypes: Array.from(
                  e.target.selectedOptions,
                  option => option.value
                ),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="single_family">Single Family</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="multi_family">Multi Family</option>
            <option value="land">Land</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Market Conditions
          </label>
          <select
            multiple
            value={filters.marketConditions}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                marketConditions: Array.from(
                  e.target.selectedOptions,
                  option => option.value
                ),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.showSuccessfulOnly}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                showSuccessfulOnly: e.target.checked,
              }))
            }
            className="mr-2"
          />
          Show successful only
        </label>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠</div>
            <div>
              <h4 className="font-medium text-red-800">
                Error loading analytics
              </h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Alert>
        <Button onClick={loadAnalytics} className="w-full">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Reports</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateReport('summary')}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            {
              id: 'overview',
              label: 'Overview',
              icon: <Target className="w-4 h-4" />,
            },
            {
              id: 'trends',
              label: 'Trends',
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              id: 'strategies',
              label: 'Strategies',
              icon: <Award className="w-4 h-4" />,
            },
            {
              id: 'market',
              label: 'Market',
              icon: <Home className="w-4 h-4" />,
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'strategies' && renderStrategies()}
        {activeTab === 'market' && renderMarket()}
      </div>

      {/* Report Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          Generate Detailed Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => generateReport('strategy')}
            disabled={loading}
            className="flex items-center justify-center space-x-2"
          >
            <Award className="w-4 h-4" />
            <span>Strategy Report</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport('trends')}
            disabled={loading}
            className="flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trends Report</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport('market')}
            disabled={loading}
            className="flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Market Report</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport('summary')}
            disabled={loading}
            className="flex items-center justify-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Executive Summary</span>
          </Button>
        </div>
      </Card>

      {/* Selected Report Display */}
      {selectedReport && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{selectedReport.title}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReport(null)}
            >
              Close
            </Button>
          </div>
          <p className="text-gray-600 mb-4">{selectedReport.summary}</p>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {selectedReport.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500">
              Generated:{' '}
              {new Date(selectedReport.generatedAt).toLocaleDateString()}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AnalyticsReports
