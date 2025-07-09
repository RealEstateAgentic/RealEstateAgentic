/**
 * Appraisal Scenario Handling Components
 *
 * Comprehensive components for managing appraisal scenarios including appraisal gaps,
 * challenges, resolution strategies, and automated response generation for both
 * buyers and sellers in real estate transactions.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { NegotiationStrategyService } from '../../lib/openai/prompts/negotiation-strategy'
import { MockMarketDataService } from '../../lib/openai/services/mock-market-data'
import type { Offer } from '../../shared/types/offers'
import type { Negotiation } from '../../shared/types/negotiations'
import type { AgentProfile, ClientProfile } from '../../shared/types'

// ========== APPRAISAL SCENARIO TYPES ==========

export interface AppraisalScenario {
  id: string
  offerId: string
  negotiationId?: string
  propertyAddress: string
  contractPrice: number
  appraisalValue: number
  gap: number
  gapPercentage: number
  scenarioType: AppraisalScenarioType
  status: AppraisalScenarioStatus
  options: AppraisalOption[]
  recommendations: AppraisalRecommendation[]
  timeline: AppraisalTimeline
  createdAt: Date
  updatedAt: Date
}

export type AppraisalScenarioType =
  | 'low_appraisal'
  | 'high_appraisal'
  | 'appraisal_challenge'
  | 'rebuttal_needed'
  | 'second_opinion'

export type AppraisalScenarioStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'escalated'
  | 'cancelled'

export interface AppraisalOption {
  id: string
  title: string
  description: string
  type:
    | 'price_reduction'
    | 'buyer_makes_up_gap'
    | 'split_difference'
    | 'challenge_appraisal'
    | 'walk_away'
  financialImpact: {
    buyer: number
    seller: number
  }
  pros: string[]
  cons: string[]
  likelihood: 'high' | 'medium' | 'low'
  recommended: boolean
}

export interface AppraisalRecommendation {
  id: string
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
  timeline: string
  responsible: 'agent' | 'buyer' | 'seller' | 'lender'
}

export interface AppraisalTimeline {
  appraisalOrdered: string
  appraisalCompleted: string
  resultsReceived: string
  responseDeadline: string
  contingencyDeadline: string
}

interface AppraisalScenariosProps {
  offer: Offer
  negotiation?: Negotiation
  agentProfile: AgentProfile
  clientProfile: ClientProfile
  onScenarioResolved: (scenario: AppraisalScenario) => void
  onNegotiationUpdate: (updates: any) => void
}

// ========== APPRAISAL GAP CALCULATOR ==========

interface AppraisalGapCalculatorProps {
  contractPrice: number
  appraisalValue: number
  onCalculate: (gap: number, percentage: number) => void
}

const AppraisalGapCalculator: React.FC<AppraisalGapCalculatorProps> = ({
  contractPrice,
  appraisalValue,
  onCalculate,
}) => {
  const [contract, setContract] = useState(contractPrice)
  const [appraisal, setAppraisal] = useState(appraisalValue)

  useEffect(() => {
    const gap = contract - appraisal
    const percentage = (gap / contract) * 100
    onCalculate(gap, percentage)
  }, [contract, appraisal, onCalculate])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Appraisal Gap Analysis
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={contract}
              onChange={e => setContract(Number(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appraisal Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={appraisal}
              onChange={e => setAppraisal(Number(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Gap Amount</p>
            <p
              className={`text-2xl font-bold ${
                contract - appraisal > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              ${Math.abs(contract - appraisal).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gap Percentage</p>
            <p
              className={`text-2xl font-bold ${
                contract - appraisal > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {(((contract - appraisal) / contract) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {contract - appraisal > 0
              ? '⚠️ Appraisal came in LOW - potential issue'
              : '✅ Appraisal came in HIGH or AT VALUE - good news!'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ========== APPRAISAL OPTIONS COMPONENT ==========

interface AppraisalOptionsProps {
  scenario: AppraisalScenario
  onOptionSelect: (option: AppraisalOption) => void
  onGenerateOptions: () => void
}

const AppraisalOptions: React.FC<AppraisalOptionsProps> = ({
  scenario,
  onOptionSelect,
  onGenerateOptions,
}) => {
  const getOptionColor = (type: string) => {
    switch (type) {
      case 'price_reduction':
        return 'bg-red-50 border-red-200'
      case 'buyer_makes_up_gap':
        return 'bg-blue-50 border-blue-200'
      case 'split_difference':
        return 'bg-purple-50 border-purple-200'
      case 'challenge_appraisal':
        return 'bg-yellow-50 border-yellow-200'
      case 'walk_away':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Resolution Options
        </h3>
        <Button
          onClick={onGenerateOptions}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate AI Options
        </Button>
      </div>

      <div className="space-y-4">
        {scenario.options.map(option => (
          <div
            key={option.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              option.recommended
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : getOptionColor(option.type)
            }`}
            onClick={() => onOptionSelect(option)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {option.title}
                  {option.recommended && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Recommended
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getLikelihoodColor(option.likelihood)}`}
                >
                  {option.likelihood.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Financial Impact
                </p>
                <div className="text-sm">
                  <p className="text-gray-600">
                    Buyer:{' '}
                    <span className="font-medium">
                      ${Math.abs(option.financialImpact.buyer).toLocaleString()}
                    </span>
                    {option.financialImpact.buyer > 0 && (
                      <span className="text-red-600"> (cost)</span>
                    )}
                  </p>
                  <p className="text-gray-600">
                    Seller:{' '}
                    <span className="font-medium">
                      $
                      {Math.abs(option.financialImpact.seller).toLocaleString()}
                    </span>
                    {option.financialImpact.seller < 0 && (
                      <span className="text-red-600"> (loss)</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Success Likelihood
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      option.likelihood === 'high'
                        ? 'bg-green-500'
                        : option.likelihood === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width:
                        option.likelihood === 'high'
                          ? '80%'
                          : option.likelihood === 'medium'
                            ? '60%'
                            : '30%',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Pros</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {option.pros.map((pro, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Cons</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {option.cons.map((con, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">-</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {scenario.options.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No resolution options generated yet
          </p>
          <Button
            onClick={onGenerateOptions}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Generate Resolution Options
          </Button>
        </div>
      )}
    </div>
  )
}

// ========== APPRAISAL TIMELINE COMPONENT ==========

interface AppraisalTimelineProps {
  timeline: AppraisalTimeline
  onUpdateTimeline: (updates: Partial<AppraisalTimeline>) => void
}

const AppraisalTimeline: React.FC<AppraisalTimelineProps> = ({
  timeline,
  onUpdateTimeline,
}) => {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(timeline)

  const handleSave = () => {
    onUpdateTimeline(formData)
    setEditing(false)
  }

  const isOverdue = (date: string) => {
    return new Date(date) < new Date()
  }

  const getDaysRemaining = (date: string) => {
    const days = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Appraisal Timeline
        </h3>
        <Button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          size="sm"
          variant={editing ? 'default' : 'outline'}
        >
          {editing ? 'Save' : 'Edit'}
        </Button>
      </div>

      <div className="space-y-4">
        {[
          { key: 'appraisalOrdered', label: 'Appraisal Ordered', icon: '📝' },
          {
            key: 'appraisalCompleted',
            label: 'Appraisal Completed',
            icon: '🏠',
          },
          { key: 'resultsReceived', label: 'Results Received', icon: '📊' },
          { key: 'responseDeadline', label: 'Response Deadline', icon: '⏰' },
          {
            key: 'contingencyDeadline',
            label: 'Contingency Deadline',
            icon: '🚨',
          },
        ].map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <input
                  type="date"
                  value={formData[item.key as keyof AppraisalTimeline]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      [item.key]: e.target.value,
                    }))
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
              ) : (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {timeline[item.key as keyof AppraisalTimeline]
                      ? new Date(
                          timeline[item.key as keyof AppraisalTimeline]
                        ).toLocaleDateString()
                      : 'Not set'}
                  </p>
                  {timeline[item.key as keyof AppraisalTimeline] && (
                    <p
                      className={`text-xs ${
                        isOverdue(timeline[item.key as keyof AppraisalTimeline])
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {isOverdue(timeline[item.key as keyof AppraisalTimeline])
                        ? 'Overdue'
                        : `${getDaysRemaining(timeline[item.key as keyof AppraisalTimeline])} days remaining`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Critical deadlines alert */}
      {timeline.responseDeadline &&
        getDaysRemaining(timeline.responseDeadline) <= 3 && (
          <Alert variant="destructive" className="mt-4">
            <span className="font-medium">
              ⚠️ Critical Deadline Approaching!
            </span>
            <p className="mt-1">
              Response deadline is in{' '}
              {getDaysRemaining(timeline.responseDeadline)} days. Action
              required to avoid losing the deal.
            </p>
          </Alert>
        )}
    </div>
  )
}

// ========== STRATEGY GENERATOR COMPONENT ==========

interface StrategyGeneratorProps {
  scenario: AppraisalScenario
  clientRole: 'buyer' | 'seller'
  onStrategyGenerated: (strategy: any) => void
}

const StrategyGenerator: React.FC<StrategyGeneratorProps> = ({
  scenario,
  clientRole,
  onStrategyGenerated,
}) => {
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<any>(null)
  const [error, setError] = useState('')

  const generateStrategy = async () => {
    setLoading(true)
    setError('')

    try {
      const context = {
        scenario: 'appraisal_gap' as const,
        client: {
          role: clientRole,
          goals: [
            clientRole === 'buyer' ? 'purchase property' : 'sell property',
          ],
          priorities: ['price' as const],
          constraints: [`${scenario.gap} appraisal gap`],
          timeline: 'urgent',
          motivations: ['close deal'],
          experienceLevel: 'experienced' as const,
        },
        opposition: {
          estimatedRole:
            clientRole === 'buyer' ? ('seller' as const) : ('buyer' as const),
        },
        property: {
          address: scenario.propertyAddress,
          listPrice: scenario.contractPrice,
          marketValue: scenario.appraisalValue,
          daysOnMarket: 30,
          propertyCondition: 'good' as const,
        },
        marketConditions: {
          trend: 'warm' as const,
          inventory: 'balanced' as const,
          competitionLevel: 'medium' as const,
          seasonality: 'normal' as const,
          interestRates: 'stable' as const,
        },
        agent: {
          name: 'Agent',
          experience: 'experienced',
          negotiationStyle: 'collaborative' as const,
        },
      }

      const strategyResult =
        await NegotiationStrategyService.generateAppraisalGapStrategy(context)
      setStrategy(strategyResult)
      onStrategyGenerated(strategyResult)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate strategy'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          AI Strategy Generator
        </h3>
        <Button
          onClick={generateStrategy}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Generating...' : 'Generate Strategy'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {strategy ? (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">
              Recommended Approach
            </h4>
            <p className="text-sm text-purple-800">
              {strategy.strategy.primaryApproach}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tactical Steps</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              {strategy.strategy.tacticalRecommendations.map(
                (tactic: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">{index + 1}.</span>
                    {tactic}
                  </li>
                )
              )}
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Immediate Actions
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {strategy.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              Risk Considerations
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              {strategy.riskAssessment.factors.map(
                (risk: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠</span>
                    {risk}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            Generate an AI-powered strategy for handling this appraisal scenario
          </p>
          <p className="text-sm text-gray-400">
            Our AI will analyze the situation and provide tailored
            recommendations
          </p>
        </div>
      )}
    </div>
  )
}

// ========== MAIN APPRAISAL SCENARIOS COMPONENT ==========

export const AppraisalScenarios: React.FC<AppraisalScenariosProps> = ({
  offer,
  negotiation,
  agentProfile,
  clientProfile,
  onScenarioResolved,
  onNegotiationUpdate,
}) => {
  const [scenario, setScenario] = useState<AppraisalScenario | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appraisalValue, setAppraisalValue] = useState(offer.purchasePrice)

  const createScenario = (gap: number, percentage: number) => {
    const newScenario: AppraisalScenario = {
      id: `appraisal-${Date.now()}`,
      offerId: offer.id,
      negotiationId: negotiation?.id,
      propertyAddress: offer.propertyDetails.address,
      contractPrice: offer.purchasePrice,
      appraisalValue,
      gap,
      gapPercentage: percentage,
      scenarioType: gap > 0 ? 'low_appraisal' : 'high_appraisal',
      status: 'pending',
      options: [],
      recommendations: [],
      timeline: {
        appraisalOrdered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        appraisalCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        resultsReceived: new Date().toISOString().split('T')[0],
        responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        contingencyDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setScenario(newScenario)
  }

  const generateOptions = async () => {
    if (!scenario) return

    setLoading(true)
    try {
      const options: AppraisalOption[] = [
        {
          id: '1',
          title: 'Reduce Purchase Price',
          description: 'Lower the contract price to match the appraised value',
          type: 'price_reduction',
          financialImpact: {
            buyer: 0,
            seller: -scenario.gap,
          },
          pros: [
            'Maintains financing terms',
            'Deal moves forward smoothly',
            'No additional cash required from buyer',
          ],
          cons: [
            'Seller loses money',
            "May affect seller's next purchase",
            'Could set precedent for future negotiations',
          ],
          likelihood: 'medium',
          recommended: clientProfile.clientType === 'buyer',
        },
        {
          id: '2',
          title: 'Buyer Covers Gap',
          description: 'Buyer pays the difference in cash at closing',
          type: 'buyer_makes_up_gap',
          financialImpact: {
            buyer: scenario.gap,
            seller: 0,
          },
          pros: ['Keeps original price', 'Seller satisfied', 'Fast resolution'],
          cons: [
            'Requires additional cash from buyer',
            "May strain buyer's finances",
            "Reduces buyer's equity position",
          ],
          likelihood: scenario.gap < 20000 ? 'medium' : 'low',
          recommended: clientProfile.clientType === 'seller',
        },
        {
          id: '3',
          title: 'Split the Difference',
          description: 'Both parties share the appraisal gap equally',
          type: 'split_difference',
          financialImpact: {
            buyer: scenario.gap / 2,
            seller: -scenario.gap / 2,
          },
          pros: [
            'Fair compromise',
            'Maintains relationship',
            'Both parties contribute to solution',
          ],
          cons: [
            'Both parties lose money',
            'May still require additional cash',
            'Compromise may not satisfy either party',
          ],
          likelihood: 'high',
          recommended: true,
        },
        {
          id: '4',
          title: 'Challenge the Appraisal',
          description: 'Request a second appraisal or provide additional comps',
          type: 'challenge_appraisal',
          financialImpact: {
            buyer: 500, // Cost of second appraisal
            seller: 0,
          },
          pros: [
            'Might get higher appraisal',
            'Relatively low cost',
            'Worth trying if good comps available',
          ],
          cons: [
            'Delays closing',
            'May not succeed',
            'Additional costs and time',
          ],
          likelihood: 'medium',
          recommended: scenario.gap > 10000,
        },
        {
          id: '5',
          title: 'Walk Away',
          description: 'Terminate the contract due to appraisal contingency',
          type: 'walk_away',
          financialImpact: {
            buyer: 0,
            seller: 0,
          },
          pros: [
            'Protects buyer from overpaying',
            'No additional costs',
            'Can look for other properties',
          ],
          cons: [
            'Lose time and opportunity',
            'May need to restart search',
            'Seller back to market',
          ],
          likelihood: 'low',
          recommended: false,
        },
      ]

      setScenario(prev => (prev ? { ...prev, options } : null))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate options'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (option: AppraisalOption) => {
    console.log('Selected option:', option)
    // Here you would typically handle the selected option
    // by updating the negotiation or creating follow-up actions
  }

  const handleUpdateTimeline = (updates: Partial<AppraisalTimeline>) => {
    if (scenario) {
      setScenario(prev =>
        prev
          ? {
              ...prev,
              timeline: { ...prev.timeline, ...updates },
              updatedAt: new Date(),
            }
          : null
      )
    }
  }

  const handleStrategyGenerated = (strategy: any) => {
    console.log('Generated strategy:', strategy)
    // Here you would typically save the strategy to the negotiation
    if (negotiation) {
      onNegotiationUpdate({ strategy })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Appraisal Scenario
          </h1>
          <p className="text-gray-600">
            {offer.propertyDetails.address} • Contract: $
            {offer.purchasePrice.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Role:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {clientProfile.clientType.toUpperCase()}
          </span>
        </div>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AppraisalGapCalculator
            contractPrice={offer.purchasePrice}
            appraisalValue={appraisalValue}
            onCalculate={createScenario}
          />

          {scenario && (
            <AppraisalOptions
              scenario={scenario}
              onOptionSelect={handleOptionSelect}
              onGenerateOptions={generateOptions}
            />
          )}
        </div>

        <div className="space-y-6">
          {scenario && (
            <>
              <AppraisalTimeline
                timeline={scenario.timeline}
                onUpdateTimeline={handleUpdateTimeline}
              />

              <StrategyGenerator
                scenario={scenario}
                clientRole={clientProfile.clientType}
                onStrategyGenerated={handleStrategyGenerated}
              />
            </>
          )}
        </div>
      </div>

      {scenario && scenario.status === 'resolved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">
            ✅ Scenario Resolved
          </h3>
          <p className="text-sm text-green-800">
            This appraisal scenario has been successfully resolved. The
            transaction can proceed.
          </p>
        </div>
      )}
    </div>
  )
}

export default AppraisalScenarios
