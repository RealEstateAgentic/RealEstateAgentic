/**
 * Negotiation Dashboard
 *
 * Comprehensive dashboard for managing active negotiations with timeline tracking,
 * communication logs, strategy recommendations, document management, and real-time
 * status updates for agents and clients.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import {
  createNegotiation,
  updateNegotiation,
  getNegotiationsByAgent,
  getNegotiationsByClient,
} from '../../lib/firebase/collections/negotiations'
import { NegotiationStrategyService } from '../../lib/openai/prompts/negotiation-strategy'
import type {
  Negotiation,
  NegotiationPhase,
  NegotiationStrategy,
} from '../../shared/types/negotiations'
import type { Offer } from '../../shared/types/offers'
import type { AgentProfile, ClientProfile } from '../../shared/types'

// ========== DASHBOARD TYPES ==========

interface NegotiationDashboardProps {
  userProfile: AgentProfile | ClientProfile
  userType: 'agent' | 'client'
  onNegotiationSelect: (negotiation: Negotiation) => void
  onCreateNegotiation: () => void
}

interface NegotiationCardProps {
  negotiation: Negotiation
  onSelect: () => void
  onUpdateStatus: (status: string) => void
  onAddNote: (note: string) => void
}

interface NegotiationTimelineProps {
  negotiation: Negotiation
  onAddEvent: (event: any) => void
}

interface CommunicationLogProps {
  negotiation: Negotiation
  onAddMessage: (message: any) => void
}

// ========== NEGOTIATION CARD COMPONENT ==========

const NegotiationCard: React.FC<NegotiationCardProps> = ({
  negotiation,
  onSelect,
  onUpdateStatus,
  onAddNote,
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [newNote, setNewNote] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPhaseColor = (phase: NegotiationPhase) => {
    switch (phase) {
      case 'initial_offer':
        return 'bg-blue-50 text-blue-700'
      case 'counter_offer':
        return 'bg-orange-50 text-orange-700'
      case 'negotiation':
        return 'bg-purple-50 text-purple-700'
      case 'final_terms':
        return 'bg-green-50 text-green-700'
      case 'acceptance':
        return 'bg-emerald-50 text-emerald-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const calculateProgress = () => {
    const phases = [
      'initial_offer',
      'counter_offer',
      'negotiation',
      'final_terms',
      'acceptance',
    ]
    const currentPhaseIndex = phases.indexOf(negotiation.currentPhase)
    return ((currentPhaseIndex + 1) / phases.length) * 100
  }

  const addNote = async () => {
    if (newNote.trim()) {
      await onAddNote(newNote.trim())
      setNewNote('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {negotiation.propertyDetails.address}
            </h3>
            <p className="text-gray-600 mb-2">
              {negotiation.type === 'buyer_seller'
                ? 'Buyer-Seller Negotiation'
                : 'Multi-party Negotiation'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                ${negotiation.currentOffer.purchasePrice.toLocaleString()}
              </span>
              <span>•</span>
              <span>
                {new Date(negotiation.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(negotiation.status)}`}
            >
              {negotiation.status.toUpperCase()}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(negotiation.currentPhase)}`}
            >
              {negotiation.currentPhase.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Timeline:</span>
            <p className="text-gray-600">{negotiation.timeline.deadline}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Activity:</span>
            <p className="text-gray-600">
              {new Date(negotiation.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Rounds:</span>
            <p className="text-gray-600">
              {negotiation.negotiationRounds?.length || 0}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <div className="flex space-x-2">
            <Button
              onClick={onSelect}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Manage
            </Button>
            <select
              value={negotiation.status}
              onChange={e => onUpdateStatus(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Current Strategy
                </h4>
                <p className="text-sm text-gray-700">
                  {negotiation.strategy?.approach || 'No strategy set'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Terms</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Purchase Price:
                    </span>
                    <span className="ml-2">
                      ${negotiation.currentOffer.purchasePrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Closing Date:
                    </span>
                    <span className="ml-2">
                      {negotiation.currentOffer.closingDate}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Earnest Money:
                    </span>
                    <span className="ml-2">
                      ${negotiation.currentOffer.earnestMoney.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Contingencies:
                    </span>
                    <span className="ml-2">
                      {negotiation.currentOffer.contingencies.length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Note</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={addNote}
                    size="sm"
                    disabled={!newNote.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== NEGOTIATION TIMELINE COMPONENT ==========

const NegotiationTimeline: React.FC<NegotiationTimelineProps> = ({
  negotiation,
  onAddEvent,
}) => {
  const [newEvent, setNewEvent] = useState('')

  const timelineEvents = [
    {
      id: '1',
      type: 'offer_submitted',
      description: 'Initial offer submitted',
      timestamp: negotiation.createdAt,
      actor: 'buyer',
    },
    ...(negotiation.negotiationRounds?.map((round, index) => ({
      id: `round-${index}`,
      type: 'counter_offer',
      description: `Counter offer #${index + 1}`,
      timestamp: round.timestamp,
      actor: index % 2 === 0 ? 'seller' : 'buyer',
    })) || []),
    ...(negotiation.communicationLog?.map((log, index) => ({
      id: `comm-${index}`,
      type: 'communication',
      description: log.message,
      timestamp: log.timestamp,
      actor: log.sender.type,
    })) || []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'offer_submitted':
        return '📝'
      case 'counter_offer':
        return '🔄'
      case 'communication':
        return '💬'
      case 'document_generated':
        return '📄'
      case 'strategy_updated':
        return '🎯'
      default:
        return '📌'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'offer_submitted':
        return 'bg-blue-100 text-blue-800'
      case 'counter_offer':
        return 'bg-orange-100 text-orange-800'
      case 'communication':
        return 'bg-green-100 text-green-800'
      case 'document_generated':
        return 'bg-purple-100 text-purple-800'
      case 'strategy_updated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const addEvent = () => {
    if (newEvent.trim()) {
      onAddEvent({
        type: 'note',
        description: newEvent.trim(),
        timestamp: new Date().toISOString(),
        actor: 'agent',
      })
      setNewEvent('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newEvent}
            onChange={e => setNewEvent(e.target.value)}
            placeholder="Add timeline event..."
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={addEvent} size="sm" disabled={!newEvent.trim()}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getEventColor(event.type)}`}
            >
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {event.description}
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 capitalize">{event.actor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== COMMUNICATION LOG COMPONENT ==========

const CommunicationLog: React.FC<CommunicationLogProps> = ({
  negotiation,
  onAddMessage,
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<'email' | 'phone' | 'meeting'>(
    'email'
  )

  const addMessage = () => {
    if (newMessage.trim()) {
      onAddMessage({
        type: messageType,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        sender: {
          type: 'agent',
          name: 'Agent',
        },
      })
      setNewMessage('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
        <div className="flex space-x-2">
          <select
            value={messageType}
            onChange={e =>
              setMessageType(e.target.value as 'email' | 'phone' | 'meeting')
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="meeting">Meeting</option>
          </select>
          <Button onClick={addMessage} size="sm" disabled={!newMessage.trim()}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {negotiation.communicationLog?.map((log, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {log.sender.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({log.sender.type})
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.type === 'email'
                      ? 'bg-blue-100 text-blue-800'
                      : log.type === 'phone'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {log.type.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{log.message}</p>
          </div>
        )) || (
          <p className="text-gray-500 text-center py-8">
            No communication logs yet
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Add communication note..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

// ========== STRATEGY PANEL COMPONENT ==========

interface StrategyPanelProps {
  negotiation: Negotiation
  onUpdateStrategy: (strategy: NegotiationStrategy) => void
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({
  negotiation,
  onUpdateStrategy,
}) => {
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<any>(null)
  const [error, setError] = useState('')

  const generateStrategy = async () => {
    setLoading(true)
    setError('')

    try {
      const context = {
        scenario: 'counter_offer' as const,
        client: {
          role: 'buyer' as const,
          goals: ['purchase property', 'fair price'],
          priorities: ['price' as const],
          constraints: [],
          timeline: 'flexible',
          motivations: [],
          experienceLevel: 'first-time' as const,
        },
        opposition: {
          estimatedRole: 'seller' as const,
        },
        property: {
          address: negotiation.propertyDetails.address,
          listPrice: negotiation.currentOffer.purchasePrice,
          marketValue: negotiation.currentOffer.purchasePrice,
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
        currentOffer: negotiation.currentOffer,
        agent: {
          name: 'Agent',
          experience: 'experienced',
          negotiationStyle: 'collaborative' as const,
        },
      }

      const strategyResult =
        await NegotiationStrategyService.generateCounterOfferStrategy(context)
      setStrategy(strategyResult)

      onUpdateStrategy({
        approach: strategyResult.strategy.primaryApproach,
        tactics: strategyResult.strategy.tacticalRecommendations,
        risks: strategyResult.riskAssessment.factors,
        nextSteps: strategyResult.nextSteps,
      })
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
        <h3 className="text-lg font-semibold text-gray-900">Strategy</h3>
        <Button
          onClick={generateStrategy}
          disabled={loading}
          size="sm"
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
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Primary Approach</h4>
            <p className="text-sm text-gray-700">
              {strategy.strategy.primaryApproach}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Tactical Recommendations
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {strategy.strategy.tacticalRecommendations.map(
                (tactic: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    {tactic}
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
            <div className="mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  strategy.riskAssessment.level === 'high'
                    ? 'bg-red-100 text-red-800'
                    : strategy.riskAssessment.level === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {strategy.riskAssessment.level.toUpperCase()} RISK
              </span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              {strategy.riskAssessment.factors.map(
                (factor: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">⚠</span>
                    {factor}
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {strategy.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">→</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No strategy generated yet</p>
          <p className="text-sm text-gray-400">
            Click "Generate Strategy" to get AI-powered negotiation
            recommendations
          </p>
        </div>
      )}
    </div>
  )
}

// ========== MAIN DASHBOARD COMPONENT ==========

export const NegotiationDashboard: React.FC<NegotiationDashboardProps> = ({
  userProfile,
  userType,
  onNegotiationSelect,
  onCreateNegotiation,
}) => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNegotiation, setSelectedNegotiation] =
    useState<Negotiation | null>(null)
  const [view, setView] = useState<'dashboard' | 'details'>('dashboard')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'progress'>('date')

  useEffect(() => {
    fetchNegotiations()
  }, [userProfile, userType])

  const fetchNegotiations = async () => {
    try {
      setLoading(true)
      let fetchedNegotiations: Negotiation[]

      if (userType === 'agent') {
        fetchedNegotiations = await getNegotiationsByAgent(userProfile.id)
      } else {
        fetchedNegotiations = await getNegotiationsByClient(userProfile.id)
      }

      setNegotiations(fetchedNegotiations)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch negotiations'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleNegotiationSelect = (negotiation: Negotiation) => {
    setSelectedNegotiation(negotiation)
    setView('details')
    onNegotiationSelect(negotiation)
  }

  const handleUpdateStatus = async (negotiationId: string, status: string) => {
    try {
      await updateNegotiation(negotiationId, { status })
      setNegotiations(prev =>
        prev.map(n => (n.id === negotiationId ? { ...n, status } : n))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleAddNote = async (negotiationId: string, note: string) => {
    try {
      const negotiation = negotiations.find(n => n.id === negotiationId)
      if (!negotiation) return

      const updatedCommunicationLog = [
        ...(negotiation.communicationLog || []),
        {
          type: 'note' as const,
          message: note,
          timestamp: new Date().toISOString(),
          sender: {
            type: userType,
            name:
              userType === 'agent'
                ? `${(userProfile as AgentProfile).personalInfo.firstName} ${(userProfile as AgentProfile).personalInfo.lastName}`
                : `${(userProfile as ClientProfile).personalInfo.firstName} ${(userProfile as ClientProfile).personalInfo.lastName}`,
          },
        },
      ]

      await updateNegotiation(negotiationId, {
        communicationLog: updatedCommunicationLog,
      })

      setNegotiations(prev =>
        prev.map(n =>
          n.id === negotiationId
            ? { ...n, communicationLog: updatedCommunicationLog }
            : n
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    }
  }

  const handleUpdateStrategy = async (strategy: NegotiationStrategy) => {
    if (!selectedNegotiation) return

    try {
      await updateNegotiation(selectedNegotiation.id, { strategy })
      setSelectedNegotiation(prev => (prev ? { ...prev, strategy } : null))
      setNegotiations(prev =>
        prev.map(n =>
          n.id === selectedNegotiation.id ? { ...n, strategy } : n
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update strategy')
    }
  }

  const filteredNegotiations = negotiations
    .filter(n => filterStatus === 'all' || n.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        case 'status':
          return a.status.localeCompare(b.status)
        case 'progress':
          const phases = [
            'initial_offer',
            'counter_offer',
            'negotiation',
            'final_terms',
            'acceptance',
          ]
          return phases.indexOf(b.currentPhase) - phases.indexOf(a.currentPhase)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (view === 'details' && selectedNegotiation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedNegotiation.propertyDetails.address}
            </h1>
            <p className="text-gray-600">
              Negotiation Details • {selectedNegotiation.status}
            </p>
          </div>
          <Button onClick={() => setView('dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <NegotiationTimeline
              negotiation={selectedNegotiation}
              onAddEvent={event => console.log('Add event:', event)}
            />
            <CommunicationLog
              negotiation={selectedNegotiation}
              onAddMessage={message => console.log('Add message:', message)}
            />
          </div>
          <div className="space-y-6">
            <StrategyPanel
              negotiation={selectedNegotiation}
              onUpdateStrategy={handleUpdateStrategy}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negotiations</h1>
          <p className="text-gray-600">
            {userType === 'agent'
              ? 'Manage your active negotiations'
              : 'Your active negotiations'}
          </p>
        </div>
        <Button
          onClick={onCreateNegotiation}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Negotiation
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(e.target.value as 'date' | 'status' | 'progress')
                }
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredNegotiations.length} negotiation
            {filteredNegotiations.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNegotiations.map(negotiation => (
            <NegotiationCard
              key={negotiation.id}
              negotiation={negotiation}
              onSelect={() => handleNegotiationSelect(negotiation)}
              onUpdateStatus={status =>
                handleUpdateStatus(negotiation.id, status)
              }
              onAddNote={note => handleAddNote(negotiation.id, note)}
            />
          ))}
        </div>

        {filteredNegotiations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {negotiations.length === 0
                ? 'No negotiations yet'
                : 'No negotiations match your current filter'}
            </p>
            <Button
              onClick={onCreateNegotiation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Your First Negotiation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NegotiationDashboard
