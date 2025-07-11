/**
 * Enhanced Document Generator with Detailed Progress Tracking
 *
 * Advanced document generation interface that shows real-time agent reasoning,
 * workflow progress, dependency resolution, and detailed behind-the-scenes activity.
 */

import { type FC, useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { Progress } from '../ui/progress'
import {
  Check,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Eye,
  Brain,
  Zap,
  Users,
  ArrowRight,
  CircleDot,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Bot,
  Tool,
  MessageCircle,
  Network,
  BarChart3,
  FileCheck,
  Sparkles,
} from 'lucide-react'
import { DocumentOrchestrationService } from '../../../lib/openai/services/document-orchestrator'
import { WorkflowProgressTracker } from '../../../lib/langchain/common/workflow-progress'
import { createDocument } from '../../../lib/firebase/collections/documents'
import { getCurrentUserProfile } from '../../../lib/firebase/auth'
import { MarkdownRenderer } from '../estimator/markdown-renderer'
import type {
  DocumentPackageResult,
  DocumentPackageRequest,
  DocumentPackageType,
  DocumentGenerationContext,
  DocumentGenerationOptions,
  DocumentRequirements,
  DocumentType,
} from '../../../lib/openai/services/document-orchestrator'
import type {
  WorkflowProgressState,
  AgentActivityInfo,
  DocumentProgressInfo,
  ActivityInfo,
  DependencyGraphInfo,
  WorkflowPhaseInfo,
} from '../../../lib/langchain/common/workflow-progress'
import type { AgentProfile } from '../../../shared/types'
import type { Negotiation } from '../../../shared/types/negotiations'

// ========== ENHANCED DOCUMENT GENERATOR TYPES ==========

interface EnhancedDocumentGeneratorProps {
  agentProfile: AgentProfile
  clientProfile: {
    personalInfo: {
      firstName: string
      lastName: string
      city: string
      state: string
      zipCode: string
    }
    clientType: string
    preferences: {
      timeframe: string
    }
  }
  offer?: {
    propertyDetails: {
      address: string
      listPrice: number
      propertyType: string
    }
  }
  negotiation?: Negotiation
  onDocumentGenerated: (result: DocumentPackageResult) => void
  onCancel: () => void
}

interface ViewMode {
  current:
    | 'overview'
    | 'agents'
    | 'workflow'
    | 'dependencies'
    | 'activity'
    | 'documents'
  showDetails: boolean
}

// ========== MAIN ENHANCED DOCUMENT GENERATOR ==========

export const EnhancedDocumentGenerator: React.FC<
  EnhancedDocumentGeneratorProps
> = ({
  agentProfile,
  clientProfile,
  offer,
  negotiation,
  onDocumentGenerated,
  onCancel,
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>('buyer_offer')
  const [generationOptions, setGenerationOptions] = useState({
    complexity: 'intermediate',
    tone: 'professional',
    includeMarketAnalysis: true,
    includeRiskAssessment: false,
    includeNegotiationTactics: false,
    includeClientEducation: true,
    jurisdiction: 'CA',
  })

  const [progressState, setProgressState] =
    useState<WorkflowProgressState | null>(null)
  const [progressTracker, setProgressTracker] =
    useState<WorkflowProgressTracker | null>(null)
  const [result, setResult] = useState<DocumentPackageResult | null>(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>({
    current: 'overview',
    showDetails: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize progress tracker
  useEffect(() => {
    if (isGenerating && !progressTracker) {
      const tracker = new WorkflowProgressTracker(
        `workflow-${Date.now()}`,
        'document_generation',
        createInitialPhases()
      )

      tracker.registerProgressCallback(state => {
        setProgressState(state)
      })

      setProgressTracker(tracker)
    }
  }, [isGenerating, progressTracker])

  const createInitialPhases = (): WorkflowPhaseInfo[] => {
    return [
      {
        phaseId: 'initialization',
        phaseName: 'Initialization',
        description: 'Setting up workflow and analyzing requirements',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: 0,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: [],
        parallelExecutions: [],
        criticalPath: [],
      },
      {
        phaseId: 'dependency_resolution',
        phaseName: 'Dependency Resolution',
        description:
          'Resolving document dependencies and creating generation plan',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: 0,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: [],
        parallelExecutions: [],
        criticalPath: [],
      },
      {
        phaseId: 'content_generation',
        phaseName: 'Content Generation',
        description: 'Generating documents using specialized AI agents',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: 0,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: [],
        parallelExecutions: [],
        criticalPath: [],
      },
      {
        phaseId: 'quality_assurance',
        phaseName: 'Quality Assurance',
        description: 'Validating content quality and consistency',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: 0,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: [],
        parallelExecutions: [],
        criticalPath: [],
      },
      {
        phaseId: 'finalization',
        phaseName: 'Finalization',
        description: 'Finalizing documents and preparing package',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: 0,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: [],
        parallelExecutions: [],
        criticalPath: [],
      },
    ]
  }

  const generateDocuments = async () => {
    if (!agentProfile || !clientProfile) {
      setError('Missing required profile information')
      return
    }

    setError('')
    setResult(null)
    setIsGenerating(true)

    try {
      // Initialize progress tracker
      const documents = getSelectedDocuments()
      const dependencies = getDocumentDependencies()

      if (progressTracker) {
        progressTracker.initializeWorkflow(documents, dependencies)
      }

      // Generate context for document generation
      const context: DocumentGenerationContext = {
        offer: undefined,
        negotiation,
        property: {
          address: offer?.propertyDetails?.address || 'Property Address',
          price: offer?.propertyDetails?.listPrice || 500000,
          type: offer?.propertyDetails?.propertyType || 'Single Family Home',
          features: [],
          condition: 'Good',
          daysOnMarket: 30,
        },
        client: {
          name: `${clientProfile.personalInfo.firstName} ${clientProfile.personalInfo.lastName}`,
          role: clientProfile.clientType === 'buyer' ? 'buyer' : 'seller',
          experienceLevel: 'experienced',
          goals: ['Find the perfect home'],
          concerns: ['Market conditions', 'Pricing'],
          timeline: clientProfile.preferences.timeframe || '3-6 months',
        },
        agent: {
          name: agentProfile.name,
          company: agentProfile.company,
          license: agentProfile.license,
          contact: agentProfile.contact,
          experience: agentProfile.experience,
          specialties: agentProfile.specialties,
        },
        market: {
          location: {
            city: clientProfile.personalInfo.city,
            state: clientProfile.personalInfo.state,
          },
          trend: 'warm',
          inventory: 'balanced',
        },
        marketData: {
          averagePrice: 500000,
          medianPrice: 475000,
          pricePerSqft: 250,
          daysOnMarket: 30,
          salesVolume: 150,
          monthlyAppreciation: 0.8,
          yearlyAppreciation: 5.2,
          listingCount: 1200,
          newListings: 50,
          closedSales: 120,
          priceReduction: 0.15,
        },
        preferences: {
          tone: generationOptions.tone,
          complexity: generationOptions.complexity,
          includeMarketAnalysis: generationOptions.includeMarketAnalysis,
          includeRiskAssessment: generationOptions.includeRiskAssessment,
          includeNegotiationTactics:
            generationOptions.includeNegotiationTactics,
          includeClientEducation: generationOptions.includeClientEducation,
          jurisdiction: generationOptions.jurisdiction,
        },
      }

      const options: DocumentGenerationOptions = {
        format: 'markdown',
        tone: generationOptions.tone,
        complexity: generationOptions.complexity,
        includeMarketAnalysis: generationOptions.includeMarketAnalysis,
        includeRiskAssessment: generationOptions.includeRiskAssessment,
        includeNegotiationTactics: generationOptions.includeNegotiationTactics,
        includeClientEducation: generationOptions.includeClientEducation,
        jurisdiction: generationOptions.jurisdiction,
      }

      const requirements: DocumentRequirements = {
        documents: documents as DocumentType[],
        priority: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customInstructions: '',
        qualityThreshold: 85,
      }

      const request: DocumentPackageRequest = {
        type: selectedTemplate as DocumentPackageType,
        context,
        options,
        requirements,
      }

      // Generate documents with progress tracking
      const packageResult =
        await DocumentOrchestrationService.generateDocumentPackage(request)

      if (progressTracker) {
        progressTracker.completeWorkflow(packageResult)
      }

      setResult(packageResult)
      onDocumentGenerated(packageResult)
    } catch (err) {
      console.error('Document generation error:', err)
      setError(
        err instanceof Error ? err.message : 'Document generation failed'
      )

      if (progressTracker) {
        progressTracker.addError({
          message:
            err instanceof Error ? err.message : 'Document generation failed',
          severity: 'high',
          recoverable: true,
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const getSelectedDocuments = (): string[] => {
    const templates = {
      buyer_offer: [
        'cover_letter',
        'explanation_memo',
        'offer_analysis',
        'market_analysis',
      ],
      seller_counter: [
        'cover_letter',
        'explanation_memo',
        'negotiation_strategy',
        'market_analysis',
      ],
      client_education: [
        'explanation_memo',
        'market_analysis',
        'client_summary',
      ],
      competitive_analysis: [
        'competitive_comparison',
        'negotiation_strategy',
        'offer_analysis',
      ],
    }

    return (
      templates[selectedTemplate as keyof typeof templates] ||
      templates.buyer_offer
    )
  }

  const getDocumentDependencies = (): Record<string, string[]> => {
    return {
      cover_letter: [],
      explanation_memo: [],
      negotiation_strategy: ['offer_analysis'],
      offer_analysis: [],
      market_analysis: [],
      risk_assessment: ['offer_analysis'],
      client_summary: ['offer_analysis', 'market_analysis'],
      competitive_comparison: ['market_analysis'],
    }
  }

  const getActivityIcon = (type: ActivityInfo['type']): React.ReactNode => {
    const icons = {
      workflow_start: <Sparkles className="w-4 h-4" />,
      phase_start: <BarChart3 className="w-4 h-4" />,
      agent_start: <Bot className="w-4 h-4" />,
      tool_use: <Tool className="w-4 h-4" />,
      decision: <Brain className="w-4 h-4" />,
      generation: <FileText className="w-4 h-4" />,
      validation: <FileCheck className="w-4 h-4" />,
      completion: <CheckCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />,
    }

    return icons[type] || <CircleDot className="w-4 h-4" />
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: 'text-gray-500',
      in_progress: 'text-blue-500',
      completed: 'text-green-500',
      failed: 'text-red-500',
      thinking: 'text-yellow-500',
      tool_use: 'text-orange-500',
      generating: 'text-purple-500',
    }

    return colors[status as keyof typeof colors] || 'text-gray-500'
  }

  const renderOverview = () => {
    if (!progressState) return null

    return (
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Progress
            </h3>
            <span className="text-sm text-gray-500">
              {progressState.progress.percentage.toFixed(1)}% Complete
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progressState.progress.currentPhase}</span>
              <span>
                {progressState.progress.currentPhaseIndex + 1} of{' '}
                {progressState.progress.totalPhases} phases
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressState.progress.percentage}%` }}
              />
            </div>

            {progressState.progress.estimatedTimeRemaining && (
              <div className="text-sm text-gray-500">
                Estimated time remaining:{' '}
                {Math.ceil(
                  progressState.progress.estimatedTimeRemaining / 60000
                )}{' '}
                minutes
              </div>
            )}
          </div>
        </div>

        {/* Current Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Activity
          </h3>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(progressState.currentActivity.type)}
            </div>
            <div className="flex-grow">
              <div className="font-medium text-gray-900">
                {progressState.currentActivity.title}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {progressState.currentActivity.description}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(
                  progressState.currentActivity.timestamp
                ).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phase Progress
          </h3>

          <div className="space-y-3">
            {progressState.phases.map((phase, index) => (
              <div key={phase.phaseId} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {phase.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : phase.status === 'in_progress' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : phase.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CircleDot className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-900">
                    {phase.phaseName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {phase.description}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {phase.progress.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAgentActivity = () => {
    if (!progressState) return null

    return (
      <div className="space-y-6">
        {/* Active Agents */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Agents
          </h3>

          {progressState.activeAgents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No agents currently active
            </div>
          ) : (
            <div className="space-y-4">
              {progressState.activeAgents.map(agent => (
                <div
                  key={agent.agentId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {agent.agentName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {agent.currentTask}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}
                    >
                      {agent.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Agent Reasoning */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                      <Brain className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          Current Thinking
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {agent.reasoning.currentThought}
                        </div>
                        {agent.reasoning.considerations.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 font-medium">
                              Considerations:
                            </div>
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              {agent.reasoning.considerations.map(
                                (consideration, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    {consideration}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Confidence:{' '}
                          {(agent.reasoning.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Tool */}
                  {agent.currentTool && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Tool className="w-4 h-4 text-orange-500" />
                        <div className="font-medium text-gray-900 text-sm">
                          Using {agent.currentTool.toolName}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {agent.currentTool.reasoning || 'Processing...'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Agents
          </h3>

          {progressState.agentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No agents completed yet
            </div>
          ) : (
            <div className="space-y-3">
              {progressState.agentHistory.map(agent => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {agent.agentName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {agent.currentTask}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {agent.processingTime &&
                      `${(agent.processingTime / 1000).toFixed(1)}s`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDocumentProgress = () => {
    if (!progressState) return null

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Document Progress
          </h3>

          <div className="space-y-4">
            {progressState.documentProgress.map(doc => (
              <div
                key={doc.documentType}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {doc.documentType.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Assigned to {doc.assignedAgent}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}
                  >
                    {doc.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{doc.progress.currentStep}</span>
                    <span>{doc.progress.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${doc.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Dependencies */}
                {doc.dependencies.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Dependencies:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.dependencies.map(dep => (
                        <div
                          key={dep}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.dependenciesResolved.includes(dep)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {dep.replace('_', ' ')}
                          {doc.dependenciesResolved.includes(dep) && (
                            <Check className="w-3 h-3 ml-1 inline" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generation Steps */}
                {doc.generationSteps.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Generation Steps:
                    </div>
                    <div className="space-y-2">
                      {doc.generationSteps.map(step => (
                        <div
                          key={step.stepId}
                          className="flex items-center space-x-2"
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : step.status === 'in_progress' ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : step.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <CircleDot className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-700">
                            {step.stepName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderActivityFeed = () => {
    if (!progressState) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Feed
        </h3>

        {progressState.recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activities yet
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {progressState.recentActivities.map(activity => (
              <div
                key={activity.activityId}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-900 text-sm">
                    {activity.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.priority === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : activity.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : activity.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {activity.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderDependencyGraph = () => {
    if (!progressState) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dependency Graph
        </h3>

        <div className="space-y-4">
          {/* Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressState.dependencyGraph.nodes.map(node => (
              <div
                key={node.id}
                className={`p-4 rounded-lg border-2 ${
                  node.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : node.status === 'in_progress'
                      ? 'border-blue-500 bg-blue-50'
                      : node.status === 'failed'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 capitalize">
                    {node.documentType.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {node.progress.toFixed(0)}%
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Agent: {node.agent}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      node.status === 'completed'
                        ? 'bg-green-500'
                        : node.status === 'in_progress'
                          ? 'bg-blue-500'
                          : node.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Dependency Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-medium text-green-800 mb-2">Resolved</div>
              <div className="text-sm text-green-700">
                {progressState.dependencyGraph.resolved.length} documents
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="font-medium text-yellow-800 mb-2">Pending</div>
              <div className="text-sm text-yellow-700">
                {progressState.dependencyGraph.pending.length} documents
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="font-medium text-red-800 mb-2">Blocked</div>
              <div className="text-sm text-red-700">
                {progressState.dependencyGraph.blocked.length} documents
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (viewMode.current) {
      case 'overview':
        return renderOverview()
      case 'agents':
        return renderAgentActivity()
      case 'documents':
        return renderDocumentProgress()
      case 'activity':
        return renderActivityFeed()
      case 'dependencies':
        return renderDependencyGraph()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Documents for {clientProfile.personalInfo.firstName}{' '}
              {clientProfile.personalInfo.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              AI-powered document generation with real-time progress tracking
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={generateDocuments} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Documents'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {isGenerating && progressState && (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'agents', label: 'Agents', icon: Bot },
              { key: 'documents', label: 'Documents', icon: FileText },
              { key: 'dependencies', label: 'Dependencies', icon: Network },
              { key: 'activity', label: 'Activity', icon: MessageCircle },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() =>
                  setViewMode({
                    ...viewMode,
                    current: tab.key as ViewMode['current'],
                  })
                }
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode.current === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isGenerating && progressState ? (
        renderContent()
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Generate Documents
          </h3>
          <p className="text-gray-600 mb-6">
            Click "Generate Documents" to start the AI-powered document
            generation process
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  What You'll See
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real-time agent reasoning</li>
                  <li>• Workflow progress tracking</li>
                  <li>• Document generation steps</li>
                  <li>• Quality assurance checks</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  AI Agents Working
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Document Generator</li>
                  <li>• Offer Analyzer</li>
                  <li>• Market Analyst</li>
                  <li>• Negotiation Strategist</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="text-red-800">
            <div className="font-medium">Generation Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Documents
          </h3>
          <div className="text-sm text-gray-600">
            Successfully generated {result.documents.length} documents
          </div>
          {/* Add document preview/download functionality here */}
        </div>
      )}
    </div>
  )
}
