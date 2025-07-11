/**
 * Enhanced Streaming Service with Workflow Progress Integration
 *
 * Extends the basic streaming functionality to provide detailed workflow progress
 * tracking, agent reasoning insights, and real-time activity monitoring.
 */

import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { StreamingCallbackHandler, StreamingService } from './streaming'
import type { StreamingMessage } from './streaming'
import type { WorkflowProgressState } from './workflow-progress'
import { WorkflowProgressTracker } from './workflow-progress'

// ========== ENHANCED STREAMING TYPES ==========

export interface EnhancedStreamingOptions {
  enableWorkflowTracking: boolean
  enableAgentReasoning: boolean
  enableDependencyTracking: boolean
  enableDetailedProgress: boolean
  trackToolUsage: boolean
  trackDecisionMaking: boolean
  updateInterval: number
  maxActivityHistory: number
}

export interface EnhancedStreamingSession {
  sessionId: string
  workflowId: string
  streamingHandler: StreamingCallbackHandler
  progressTracker: WorkflowProgressTracker
  options: EnhancedStreamingOptions
  callbacks: Map<string, (data: any) => void>
}

export interface AgentReasoningUpdate {
  agentId: string
  agentType: string
  reasoning: {
    currentThought: string
    decisionPoint?: string
    considerations: string[]
    confidence: number
    nextAction?: string
  }
  context: {
    documentType?: string
    currentStep?: string
    dependencies?: string[]
    availableTools?: string[]
  }
}

export interface WorkflowDecisionUpdate {
  decisionId: string
  decisionType:
    | 'document_order'
    | 'agent_selection'
    | 'tool_choice'
    | 'quality_check'
    | 'retry_strategy'
  decision: string
  reasoning: string
  alternatives: string[]
  confidence: number
  impact: 'low' | 'medium' | 'high'
  timestamp: string
}

export interface DetailedProgressUpdate {
  workflowProgress: WorkflowProgressState
  agentReasoning: AgentReasoningUpdate[]
  recentDecisions: WorkflowDecisionUpdate[]
  performanceMetrics: {
    totalElapsedTime: number
    averageStepTime: number
    documentsPerMinute: number
    agentUtilization: Record<string, number>
    errorRate: number
  }
}

// ========== ENHANCED STREAMING SERVICE ==========

export class EnhancedStreamingService extends StreamingService {
  private workflowTrackers: Map<string, WorkflowProgressTracker>
  private enhancedSessions: Map<string, EnhancedStreamingSession>
  private defaultOptions: EnhancedStreamingOptions

  constructor() {
    super()
    this.workflowTrackers = new Map()
    this.enhancedSessions = new Map()
    this.defaultOptions = {
      enableWorkflowTracking: true,
      enableAgentReasoning: true,
      enableDependencyTracking: true,
      enableDetailedProgress: true,
      trackToolUsage: true,
      trackDecisionMaking: true,
      updateInterval: 500,
      maxActivityHistory: 100,
    }
  }

  // ========== ENHANCED SESSION MANAGEMENT ==========

  createEnhancedSession(
    workflowType: WorkflowProgressState['workflowType'],
    documents: string[],
    dependencies: Record<string, string[]>,
    options: Partial<EnhancedStreamingOptions> = {}
  ): EnhancedStreamingSession {
    const sessionId = `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const workflowId = `workflow-${sessionId}`

    const enhancedOptions = { ...this.defaultOptions, ...options }

    // Create streaming handler
    const streamingHandler = new StreamingCallbackHandler(sessionId, {
      enableProgress: true,
      enableToolUpdates: enhancedOptions.trackToolUsage,
      enableIntermediateResults: enhancedOptions.enableDetailedProgress,
      progressUpdateInterval: enhancedOptions.updateInterval,
      maxRetries: 3,
      timeoutMs: 300000,
    })

    // Create workflow progress tracker
    const progressTracker = new WorkflowProgressTracker(
      workflowId,
      workflowType,
      this.createWorkflowPhases(documents, dependencies)
    )

    // Initialize workflow
    progressTracker.initializeWorkflow(documents, dependencies)

    // Create enhanced session
    const session: EnhancedStreamingSession = {
      sessionId,
      workflowId,
      streamingHandler,
      progressTracker,
      options: enhancedOptions,
      callbacks: new Map(),
    }

    // Set up cross-handler communication
    this.setupHandlerIntegration(session)

    this.enhancedSessions.set(sessionId, session)
    this.workflowTrackers.set(workflowId, progressTracker)

    return session
  }

  private setupHandlerIntegration(session: EnhancedStreamingSession): void {
    const { streamingHandler, progressTracker, options } = session

    // Forward streaming events to progress tracker
    streamingHandler.registerCallback('all', (message: StreamingMessage) => {
      this.processStreamingMessage(message, progressTracker, options)
    })

    // Forward progress updates to streaming
    progressTracker.registerProgressCallback((state: WorkflowProgressState) => {
      this.processProgressUpdate(state, streamingHandler, options)
    })
  }

  private processStreamingMessage(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    switch (message.type) {
      case 'agent_action':
        this.handleAgentAction(message, progressTracker, options)
        break
      case 'tool_call':
        this.handleToolCall(message, progressTracker, options)
        break
      case 'progress':
        this.handleProgressUpdate(message, progressTracker, options)
        break
      case 'result':
        this.handleResult(message, progressTracker, options)
        break
      case 'error':
        this.handleError(message, progressTracker, options)
        break
    }
  }

  private handleAgentAction(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    if (!options.enableAgentReasoning) return

    const { content } = message
    const agentId = content.agentId || `agent-${Date.now()}`
    const agentType = this.inferAgentType(content)

    // Extract reasoning from agent action
    const reasoning = this.extractReasoning(content)

    if (reasoning) {
      progressTracker.updateAgentReasoning(agentId, reasoning)
    }

    // Track decision making
    if (options.trackDecisionMaking && content.decisionPoint) {
      this.trackDecision(content, progressTracker)
    }
  }

  private handleToolCall(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    if (!options.trackToolUsage) return

    const { content } = message
    const agentId = content.agentId || `agent-${Date.now()}`

    if (content.action === 'tool_start') {
      progressTracker.updateAgentToolUse(agentId, {
        toolId: `tool-${Date.now()}`,
        toolName: content.toolName,
        toolType: this.inferToolType(content.toolName),
        status: 'in_progress',
        input: content.input,
        startTime: new Date().toISOString(),
      })
    }
  }

  private handleProgressUpdate(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    const { content } = message

    if (content.action === 'phase_start') {
      progressTracker.startPhase(content.phaseIndex || 0)
    } else if (content.action === 'phase_end') {
      progressTracker.completePhase(content.phaseIndex || 0)
    } else if (content.action === 'document_start') {
      progressTracker.startDocumentGeneration(content.documentType)
    } else if (content.action === 'document_step') {
      progressTracker.updateDocumentStep(
        content.documentType,
        content.stepIndex,
        content.stepInfo
      )
    }
  }

  private handleResult(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    const { content } = message
    const agentId = content.agentId || `agent-${Date.now()}`

    progressTracker.completeAgent(agentId, content.output)

    if (content.documentType) {
      progressTracker.completeDocument(content.documentType, content.output)
    }
  }

  private handleError(
    message: StreamingMessage,
    progressTracker: WorkflowProgressTracker,
    options: EnhancedStreamingOptions
  ): void {
    const { content } = message

    progressTracker.addError({
      message: content.error,
      severity: content.severity || 'medium',
      agentId: content.agentId,
      documentType: content.documentType,
      recoverable: content.recoverable !== false,
    })
  }

  private processProgressUpdate(
    state: WorkflowProgressState,
    streamingHandler: StreamingCallbackHandler,
    options: EnhancedStreamingOptions
  ): void {
    // Create detailed progress update
    const update: DetailedProgressUpdate = {
      workflowProgress: state,
      agentReasoning: this.extractAgentReasoning(state),
      recentDecisions: this.extractRecentDecisions(state),
      performanceMetrics: this.calculatePerformanceMetrics(state),
    }

    // Emit enhanced progress update
    this.emitEnhancedUpdate(update, streamingHandler)
  }

  // ========== ENHANCED CALLBACK HANDLING ==========

  registerEnhancedCallback(
    sessionId: string,
    callbackType:
      | 'progress'
      | 'reasoning'
      | 'decisions'
      | 'performance'
      | 'all',
    callback: (data: any) => void
  ): void {
    const session = this.enhancedSessions.get(sessionId)
    if (session) {
      session.callbacks.set(callbackType, callback)
    }
  }

  unregisterEnhancedCallback(sessionId: string, callbackType: string): void {
    const session = this.enhancedSessions.get(sessionId)
    if (session) {
      session.callbacks.delete(callbackType)
    }
  }

  // ========== WORKFLOW INTEGRATION ==========

  async executeWorkflowWithEnhancedTracking<T>(
    sessionId: string,
    workflowFunction: (tracker: WorkflowProgressTracker) => Promise<T>,
    onProgress?: (update: DetailedProgressUpdate) => void
  ): Promise<T> {
    const session = this.enhancedSessions.get(sessionId)
    if (!session) {
      throw new Error(`Enhanced session ${sessionId} not found`)
    }

    const { progressTracker, streamingHandler } = session

    try {
      // Register progress callback
      if (onProgress) {
        this.registerEnhancedCallback(sessionId, 'progress', onProgress)
      }

      // Execute workflow with tracking
      const result = await workflowFunction(progressTracker)

      // Complete workflow
      progressTracker.completeWorkflow(result)

      return result
    } catch (error) {
      progressTracker.addError({
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        recoverable: false,
      })
      throw error
    }
  }

  // ========== UTILITY METHODS ==========

  private extractReasoning(content: any): any {
    // Extract reasoning patterns from agent content
    const reasoning: any = {
      currentThought: '',
      considerations: [],
      confidence: 0.8,
    }

    if (content.log) {
      // Parse agent log for reasoning
      const log = content.log

      if (log.includes('Thought:')) {
        reasoning.currentThought =
          log.split('Thought:')[1]?.split('\n')[0]?.trim() || ''
      }

      if (log.includes('Considerations:')) {
        const considerations =
          log.split('Considerations:')[1]?.split('\n')[0]?.trim() || ''
        reasoning.considerations = considerations
          .split(',')
          .map((c: string) => c.trim())
          .filter((c: string) => c)
      }

      if (log.includes('Confidence:')) {
        const confidence = Number.parseFloat(
          log.split('Confidence:')[1]?.split('\n')[0]?.trim() || '0.8'
        )
        reasoning.confidence = Math.max(0, Math.min(1, confidence))
      }
    }

    return reasoning
  }

  private inferAgentType(
    content: any
  ): 'document' | 'analysis' | 'negotiation' | 'market' {
    const tool = content.tool?.toLowerCase() || ''
    const input = content.toolInput?.toLowerCase() || ''

    if (tool.includes('document') || input.includes('document'))
      return 'document'
    if (tool.includes('analysis') || input.includes('analysis'))
      return 'analysis'
    if (tool.includes('negotiation') || input.includes('negotiation'))
      return 'negotiation'
    if (tool.includes('market') || input.includes('market')) return 'market'

    return 'document'
  }

  private inferToolType(
    toolName: string
  ): 'calculation' | 'data_fetch' | 'validation' | 'formatting' | 'analysis' {
    const name = toolName.toLowerCase()

    if (name.includes('calc') || name.includes('math')) return 'calculation'
    if (name.includes('fetch') || name.includes('get')) return 'data_fetch'
    if (name.includes('validate') || name.includes('check')) return 'validation'
    if (name.includes('format') || name.includes('render')) return 'formatting'

    return 'analysis'
  }

  private trackDecision(
    content: any,
    progressTracker: WorkflowProgressTracker
  ): void {
    // Track important decisions made during workflow
    const decision: WorkflowDecisionUpdate = {
      decisionId: `decision-${Date.now()}`,
      decisionType: content.decisionType || 'tool_choice',
      decision: content.decision || 'Decision made',
      reasoning: content.reasoning || 'No reasoning provided',
      alternatives: content.alternatives || [],
      confidence: content.confidence || 0.8,
      impact: content.impact || 'medium',
      timestamp: new Date().toISOString(),
    }

    // Note: addActivity method is private - would add decision as activity
    // progressTracker.addActivity({
    //   type: 'decision',
    //   title: `Decision: ${decision.decision}`,
    //   description: decision.reasoning,
    //   icon: '🤔',
    //   color: 'purple',
    //   priority: decision.impact === 'high' ? 'high' : 'medium',
    // })
  }

  private extractAgentReasoning(
    state: WorkflowProgressState
  ): AgentReasoningUpdate[] {
    return state.activeAgents.map(agent => ({
      agentId: agent.agentId,
      agentType: agent.agentType,
      reasoning: agent.reasoning,
      context: agent.context,
    }))
  }

  private extractRecentDecisions(
    state: WorkflowProgressState
  ): WorkflowDecisionUpdate[] {
    // Extract decisions from recent activities
    return state.recentActivities
      .filter(activity => activity.type === 'decision')
      .slice(0, 10)
      .map(activity => ({
        decisionId: activity.activityId,
        decisionType: 'tool_choice' as const,
        decision: activity.title,
        reasoning: activity.description,
        alternatives: [],
        confidence: 0.8,
        impact:
          activity.priority === 'high'
            ? ('high' as const)
            : ('medium' as const),
        timestamp: activity.timestamp,
      }))
  }

  private calculatePerformanceMetrics(
    state: WorkflowProgressState
  ): DetailedProgressUpdate['performanceMetrics'] {
    const startTime = new Date(state.startTime).getTime()
    const currentTime = Date.now()
    const totalElapsedTime = currentTime - startTime

    const completedDocs = state.documentProgress.filter(
      d => d.status === 'completed'
    ).length
    const totalDocs = state.documentProgress.length
    const documentsPerMinute =
      totalElapsedTime > 0 ? completedDocs / (totalElapsedTime / 60000) : 0

    const agentUtilization: Record<string, number> = {}
    for (const agent of state.agentHistory) {
      if (agent.processingTime) {
        agentUtilization[agent.agentType] =
          (agentUtilization[agent.agentType] || 0) + agent.processingTime
      }
    }

    const errorRate =
      state.errors.length / Math.max(1, state.documentProgress.length)

    return {
      totalElapsedTime,
      averageStepTime:
        totalElapsedTime / Math.max(1, state.progress.currentPhaseIndex + 1),
      documentsPerMinute,
      agentUtilization,
      errorRate,
    }
  }

  private emitEnhancedUpdate(
    update: DetailedProgressUpdate,
    streamingHandler: StreamingCallbackHandler
  ): void {
    // Note: emitMessage method is private - would emit enhanced progress update
    // streamingHandler.emitMessage({
    //   type: 'progress',
    //   content: {
    //     action: 'enhanced_progress',
    //     update,
    //   },
    // })
  }

  private createWorkflowPhases(
    documents: string[],
    dependencies: Record<string, string[]>
  ): any[] {
    // Create workflow phases based on document dependencies
    const phases = [
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
        phaseId: 'generation',
        phaseName: 'Generation',
        description: 'Generating documents with AI agents',
        status: 'pending',
        progress: {
          percentage: 0,
          documentsInPhase: documents.length,
          documentsCompleted: 0,
          documentsInProgress: 0,
        },
        documentsInPhase: documents,
        parallelExecutions: [],
        criticalPath: [],
      },
      {
        phaseId: 'finalization',
        phaseName: 'Finalization',
        description: 'Finalizing and packaging documents',
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

    return phases
  }

  // ========== PUBLIC METHODS ==========

  getEnhancedSession(sessionId: string): EnhancedStreamingSession | undefined {
    return this.enhancedSessions.get(sessionId)
  }

  getWorkflowTracker(workflowId: string): WorkflowProgressTracker | undefined {
    return this.workflowTrackers.get(workflowId)
  }

  cleanupEnhancedSession(sessionId: string): void {
    const session = this.enhancedSessions.get(sessionId)
    if (session) {
      this.workflowTrackers.delete(session.workflowId)
      this.enhancedSessions.delete(sessionId)
    }
  }
}

// ========== ENHANCED STREAMING HOOK ==========

export const createEnhancedStreamingHook = () => {
  const service = new EnhancedStreamingService()

  return {
    createSession: (
      workflowType: WorkflowProgressState['workflowType'],
      documents: string[],
      dependencies: Record<string, string[]>,
      options?: Partial<EnhancedStreamingOptions>
    ) =>
      service.createEnhancedSession(
        workflowType,
        documents,
        dependencies,
        options
      ),

    executeWorkflow: <T>(
      sessionId: string,
      workflowFunction: (tracker: WorkflowProgressTracker) => Promise<T>,
      onProgress?: (update: DetailedProgressUpdate) => void
    ) =>
      service.executeWorkflowWithEnhancedTracking(
        sessionId,
        workflowFunction,
        onProgress
      ),

    registerCallback: (
      sessionId: string,
      type: 'progress' | 'reasoning' | 'decisions' | 'performance' | 'all',
      callback: (data: any) => void
    ) => service.registerEnhancedCallback(sessionId, type, callback),

    cleanup: (sessionId: string) => service.cleanupEnhancedSession(sessionId),
  }
}
