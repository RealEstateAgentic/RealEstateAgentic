/**
 * Enhanced Workflow Progress Tracking System
 *
 * Provides detailed progress tracking for document generation workflows,
 * including agent reasoning, dependency resolution, and real-time status updates.
 */

import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { AgentAction, AgentFinish } from '@langchain/core/agents'
import type { LLMResult } from '@langchain/core/language_models/llm'
import type { StreamingMessage } from './streaming'

// ========== WORKFLOW PROGRESS TYPES ==========

export interface WorkflowProgressState {
  workflowId: string
  workflowType:
    | 'document_generation'
    | 'document_pipeline'
    | 'document_orchestration'
  status: WorkflowStatus
  startTime: string
  endTime?: string

  // Overall workflow progress
  progress: {
    percentage: number
    currentPhase: string
    totalPhases: number
    currentPhaseIndex: number
    estimatedTimeRemaining?: number
  }

  // Agent activity tracking
  activeAgents: AgentActivityInfo[]
  agentHistory: AgentActivityInfo[]

  // Document generation tracking
  documentProgress: DocumentProgressInfo[]
  dependencyGraph: DependencyGraphInfo

  // Workflow phases
  phases: WorkflowPhaseInfo[]
  currentPhase?: WorkflowPhaseInfo

  // Real-time activity
  currentActivity: ActivityInfo
  recentActivities: ActivityInfo[]

  // Error tracking
  errors: WorkflowError[]
  warnings: WorkflowWarning[]
}

export interface AgentActivityInfo {
  agentId: string
  agentType: 'document' | 'analysis' | 'negotiation' | 'market'
  agentName: string
  status: 'idle' | 'thinking' | 'tool_use' | 'generating' | 'complete' | 'error'
  currentTask?: string
  currentDocumentType?: string

  // Agent reasoning
  reasoning: {
    currentThought: string
    decisionPoint?: string
    considerations: string[]
    confidence: number
  }

  // Tool usage
  toolsUsed: ToolUsageInfo[]
  currentTool?: ToolUsageInfo

  // Timing
  startTime: string
  endTime?: string
  processingTime?: number

  // Context
  context: {
    documentType?: string
    dependencies?: string[]
    input?: any
    output?: any
  }
}

export interface DocumentProgressInfo {
  documentType: string
  documentId?: string
  status:
    | 'pending'
    | 'dependencies_waiting'
    | 'in_progress'
    | 'validating'
    | 'completed'
    | 'failed'
  assignedAgent: string

  // Progress details
  progress: {
    percentage: number
    currentStep: string
    totalSteps: number
    currentStepIndex: number
  }

  // Dependencies
  dependencies: string[]
  dependenciesResolved: string[]
  blockedBy: string[]

  // Generation details
  generationSteps: GenerationStepInfo[]
  currentStep?: GenerationStepInfo

  // Quality tracking
  qualityChecks: QualityCheckInfo[]

  // Timing
  startTime?: string
  endTime?: string
  estimatedCompletion?: string
}

export interface GenerationStepInfo {
  stepId: string
  stepName: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  agentReasoning?: string
  toolsUsed?: string[]
  startTime?: string
  endTime?: string
  output?: any
}

export interface DependencyGraphInfo {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  resolved: string[]
  pending: string[]
  blocked: string[]
  cycleDetected?: boolean
}

export interface DependencyNode {
  id: string
  documentType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  agent: string
  progress: number
}

export interface DependencyEdge {
  from: string
  to: string
  type: 'depends_on' | 'blocks' | 'enhances'
  resolved: boolean
}

export interface WorkflowPhaseInfo {
  phaseId: string
  phaseName: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'

  // Phase progress
  progress: {
    percentage: number
    documentsInPhase: number
    documentsCompleted: number
    documentsInProgress: number
  }

  // Phase details
  documentsInPhase: string[]
  parallelExecutions: string[]
  criticalPath: string[]

  // Timing
  startTime?: string
  endTime?: string
  estimatedDuration?: number
}

export interface ActivityInfo {
  activityId: string
  timestamp: string
  type:
    | 'workflow_start'
    | 'phase_start'
    | 'agent_start'
    | 'tool_use'
    | 'decision'
    | 'generation'
    | 'validation'
    | 'completion'
    | 'error'
  agentId?: string
  documentType?: string

  // Activity details
  title: string
  description: string
  details?: any

  // Visual indicators
  icon: string
  color: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface ToolUsageInfo {
  toolId: string
  toolName: string
  toolType:
    | 'calculation'
    | 'data_fetch'
    | 'validation'
    | 'formatting'
    | 'analysis'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'

  // Tool details
  input?: any
  output?: any
  reasoning?: string

  // Timing
  startTime: string
  endTime?: string
  executionTime?: number
}

export interface QualityCheckInfo {
  checkId: string
  checkName: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'warning'
  score?: number
  issues?: string[]
  suggestions?: string[]

  // Check details
  criteria: string[]
  results: any

  // Timing
  startTime: string
  endTime?: string
}

export interface WorkflowError {
  errorId: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  agentId?: string
  documentType?: string

  // Error details
  message: string
  code?: string
  details?: any
  stackTrace?: string

  // Recovery
  recoverable: boolean
  retryCount?: number
  recoveryAction?: string
}

export interface WorkflowWarning {
  warningId: string
  timestamp: string
  type: 'performance' | 'quality' | 'dependency' | 'timeout'
  agentId?: string
  documentType?: string

  // Warning details
  message: string
  recommendation?: string
  impact?: string
}

export type WorkflowStatus =
  | 'initializing'
  | 'planning'
  | 'executing'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled'

// ========== WORKFLOW PROGRESS TRACKER ==========

export class WorkflowProgressTracker extends BaseCallbackHandler {
  private progressState: WorkflowProgressState
  private callbacks: Map<string, (state: WorkflowProgressState) => void>
  private activityCounter: number = 0

  constructor(
    workflowId: string,
    workflowType: WorkflowProgressState['workflowType'],
    initialPhases: WorkflowPhaseInfo[] = []
  ) {
    super()

    this.progressState = {
      workflowId,
      workflowType,
      status: 'initializing',
      startTime: new Date().toISOString(),

      progress: {
        percentage: 0,
        currentPhase: initialPhases[0]?.phaseName || 'Initialization',
        totalPhases: initialPhases.length,
        currentPhaseIndex: 0,
      },

      activeAgents: [],
      agentHistory: [],

      documentProgress: [],
      dependencyGraph: {
        nodes: [],
        edges: [],
        resolved: [],
        pending: [],
        blocked: [],
      },

      phases: initialPhases,
      currentPhase: initialPhases[0],

      currentActivity: {
        activityId: 'init',
        timestamp: new Date().toISOString(),
        type: 'workflow_start',
        title: 'Initializing Workflow',
        description: 'Setting up document generation workflow',
        icon: '🚀',
        color: 'blue',
        priority: 'high',
      },
      recentActivities: [],

      errors: [],
      warnings: [],
    }

    this.callbacks = new Map()
  }

  // ========== CALLBACK REGISTRATION ==========

  registerProgressCallback(
    callback: (state: WorkflowProgressState) => void
  ): void {
    this.callbacks.set('progress', callback)
  }

  unregisterProgressCallback(): void {
    this.callbacks.delete('progress')
  }

  // ========== WORKFLOW MANAGEMENT ==========

  initializeWorkflow(
    documents: string[],
    dependencies: Record<string, string[]>
  ): void {
    // Initialize document progress
    this.progressState.documentProgress = documents.map(docType => ({
      documentType: docType,
      status: 'pending',
      assignedAgent: this.getAgentForDocument(docType),
      progress: {
        percentage: 0,
        currentStep: 'Waiting for dependencies',
        totalSteps: this.getStepsForDocument(docType),
        currentStepIndex: 0,
      },
      dependencies: dependencies[docType] || [],
      dependenciesResolved: [],
      blockedBy: [],
      generationSteps: this.createGenerationSteps(docType),
      qualityChecks: this.createQualityChecks(docType),
    }))

    // Initialize dependency graph
    this.progressState.dependencyGraph = this.createDependencyGraph(
      documents,
      dependencies
    )

    // Update status
    this.progressState.status = 'planning'
    this.addActivity({
      type: 'workflow_start',
      title: 'Workflow Initialized',
      description: `Initialized generation for ${documents.length} documents`,
      icon: '📋',
      color: 'green',
      priority: 'medium',
    })

    this.emitProgress()
  }

  startPhase(phaseIndex: number): void {
    if (phaseIndex >= this.progressState.phases.length) return

    const phase = this.progressState.phases[phaseIndex]
    phase.status = 'in_progress'
    phase.startTime = new Date().toISOString()

    this.progressState.currentPhase = phase
    this.progressState.progress.currentPhase = phase.phaseName
    this.progressState.progress.currentPhaseIndex = phaseIndex

    this.addActivity({
      type: 'phase_start',
      title: `Started Phase: ${phase.phaseName}`,
      description: phase.description,
      icon: '🎯',
      color: 'blue',
      priority: 'high',
    })

    this.emitProgress()
  }

  completePhase(phaseIndex: number): void {
    if (phaseIndex >= this.progressState.phases.length) return

    const phase = this.progressState.phases[phaseIndex]
    phase.status = 'completed'
    phase.endTime = new Date().toISOString()
    phase.progress.percentage = 100

    this.addActivity({
      type: 'completion',
      title: `Completed Phase: ${phase.phaseName}`,
      description: `All documents in phase completed successfully`,
      icon: '✅',
      color: 'green',
      priority: 'medium',
    })

    // Update overall progress
    const completedPhases = this.progressState.phases.filter(
      p => p.status === 'completed'
    ).length
    this.progressState.progress.percentage =
      (completedPhases / this.progressState.phases.length) * 100

    this.emitProgress()
  }

  // ========== AGENT MANAGEMENT ==========

  startAgent(
    agentId: string,
    agentType: AgentActivityInfo['agentType'],
    documentType?: string
  ): void {
    const agent: AgentActivityInfo = {
      agentId,
      agentType,
      agentName: this.getAgentName(agentType),
      status: 'thinking',
      currentTask: documentType ? `Generating ${documentType}` : 'Processing',
      currentDocumentType: documentType,

      reasoning: {
        currentThought: 'Analyzing requirements and context',
        considerations: [],
        confidence: 0.8,
      },

      toolsUsed: [],

      startTime: new Date().toISOString(),

      context: {
        documentType,
        dependencies: documentType ? this.getDependencies(documentType) : [],
      },
    }

    // Add to active agents
    this.progressState.activeAgents.push(agent)

    this.addActivity({
      type: 'agent_start',
      agentId,
      documentType,
      title: `${agent.agentName} Started`,
      description: `Started ${documentType ? `generating ${documentType}` : 'processing'}`,
      icon: '🤖',
      color: 'purple',
      priority: 'medium',
    })

    this.emitProgress()
  }

  updateAgentReasoning(
    agentId: string,
    reasoning: Partial<AgentActivityInfo['reasoning']>
  ): void {
    const agent = this.progressState.activeAgents.find(
      a => a.agentId === agentId
    )
    if (agent) {
      agent.reasoning = { ...agent.reasoning, ...reasoning }
      agent.status = 'thinking'

      this.addActivity({
        type: 'decision',
        agentId,
        title: `${agent.agentName} Reasoning`,
        description: reasoning.currentThought || 'Analyzing options',
        icon: '💭',
        color: 'yellow',
        priority: 'low',
      })

      this.emitProgress()
    }
  }

  updateAgentToolUse(agentId: string, toolInfo: ToolUsageInfo): void {
    const agent = this.progressState.activeAgents.find(
      a => a.agentId === agentId
    )
    if (agent) {
      agent.status = 'tool_use'
      agent.currentTool = toolInfo
      agent.toolsUsed.push(toolInfo)

      this.addActivity({
        type: 'tool_use',
        agentId,
        title: `Using ${toolInfo.toolName}`,
        description: `${agent.agentName} is using ${toolInfo.toolName}`,
        icon: '🔧',
        color: 'orange',
        priority: 'medium',
      })

      this.emitProgress()
    }
  }

  completeAgent(agentId: string, result?: any): void {
    const agentIndex = this.progressState.activeAgents.findIndex(
      a => a.agentId === agentId
    )
    if (agentIndex >= 0) {
      const agent = this.progressState.activeAgents[agentIndex]
      agent.status = 'complete'
      agent.endTime = new Date().toISOString()
      agent.processingTime =
        new Date().getTime() - new Date(agent.startTime).getTime()
      agent.context.output = result

      // Move to history
      this.progressState.agentHistory.push(agent)
      this.progressState.activeAgents.splice(agentIndex, 1)

      this.addActivity({
        type: 'completion',
        agentId,
        title: `${agent.agentName} Completed`,
        description: `Successfully completed ${agent.currentTask}`,
        icon: '✅',
        color: 'green',
        priority: 'medium',
      })

      this.emitProgress()
    }
  }

  // ========== DOCUMENT PROGRESS MANAGEMENT ==========

  startDocumentGeneration(documentType: string): void {
    const docProgress = this.progressState.documentProgress.find(
      d => d.documentType === documentType
    )
    if (docProgress) {
      docProgress.status = 'in_progress'
      docProgress.startTime = new Date().toISOString()
      docProgress.progress.currentStep = 'Initializing generation'
      docProgress.progress.currentStepIndex = 0

      this.addActivity({
        type: 'generation',
        documentType,
        title: `Generating ${documentType}`,
        description: `Started generation of ${documentType}`,
        icon: '📝',
        color: 'blue',
        priority: 'high',
      })

      this.emitProgress()
    }
  }

  updateDocumentStep(
    documentType: string,
    stepIndex: number,
    stepInfo?: Partial<GenerationStepInfo>
  ): void {
    const docProgress = this.progressState.documentProgress.find(
      d => d.documentType === documentType
    )
    if (docProgress && stepIndex < docProgress.generationSteps.length) {
      const step = docProgress.generationSteps[stepIndex]

      if (stepInfo) {
        Object.assign(step, stepInfo)
      }

      docProgress.currentStep = step
      docProgress.progress.currentStep = step.stepName
      docProgress.progress.currentStepIndex = stepIndex
      docProgress.progress.percentage =
        ((stepIndex + 1) / docProgress.generationSteps.length) * 100

      this.addActivity({
        type: 'generation',
        documentType,
        title: `${documentType}: ${step.stepName}`,
        description: step.description,
        icon: '⚡',
        color: 'cyan',
        priority: 'low',
      })

      this.emitProgress()
    }
  }

  completeDocument(documentType: string, result?: any): void {
    const docProgress = this.progressState.documentProgress.find(
      d => d.documentType === documentType
    )
    if (docProgress) {
      docProgress.status = 'completed'
      docProgress.endTime = new Date().toISOString()
      docProgress.progress.percentage = 100
      docProgress.progress.currentStep = 'Completed'

      // Update dependency graph
      this.progressState.dependencyGraph.resolved.push(documentType)
      const pendingIndex =
        this.progressState.dependencyGraph.pending.indexOf(documentType)
      if (pendingIndex >= 0) {
        this.progressState.dependencyGraph.pending.splice(pendingIndex, 1)
      }

      this.addActivity({
        type: 'completion',
        documentType,
        title: `${documentType} Completed`,
        description: `Successfully generated ${documentType}`,
        icon: '📄',
        color: 'green',
        priority: 'high',
      })

      this.emitProgress()
    }
  }

  // ========== LANGCHAIN CALLBACK METHODS ==========

  async handleChainStart(
    chain: { name: string },
    inputs: any,
    runId: string
  ): Promise<void> {
    const agentId = `agent-${runId}`
    const agentType = this.inferAgentType(chain.name)

    this.startAgent(agentId, agentType)

    // Extract document type from inputs if available
    const documentType = this.extractDocumentType(inputs)
    if (documentType) {
      this.startDocumentGeneration(documentType)
    }
  }

  async handleChainEnd(outputs: any, runId: string): Promise<void> {
    const agentId = `agent-${runId}`
    this.completeAgent(agentId, outputs)
  }

  async handleToolStart(
    tool: { name: string },
    input: string,
    runId: string
  ): Promise<void> {
    const agentId = `agent-${runId}`
    const toolInfo: ToolUsageInfo = {
      toolId: `tool-${runId}`,
      toolName: tool.name,
      toolType: this.inferToolType(tool.name),
      status: 'in_progress',
      input,
      startTime: new Date().toISOString(),
    }

    this.updateAgentToolUse(agentId, toolInfo)
  }

  async handleToolEnd(output: string, runId: string): Promise<void> {
    const agentId = `agent-${runId}`
    const agent = this.progressState.activeAgents.find(
      a => a.agentId === agentId
    )

    if (agent && agent.currentTool) {
      agent.currentTool.status = 'completed'
      agent.currentTool.output = output
      agent.currentTool.endTime = new Date().toISOString()
      agent.currentTool.executionTime =
        new Date().getTime() - new Date(agent.currentTool.startTime).getTime()

      this.emitProgress()
    }
  }

  async handleText(text: string, runId: string): Promise<void> {
    const agentId = `agent-${runId}`

    // Extract reasoning from text if it contains thought patterns
    if (text.includes('Thought:') || text.includes('Reasoning:')) {
      this.updateAgentReasoning(agentId, {
        currentThought: text.replace(/^(Thought:|Reasoning:)\s*/i, '').trim(),
      })
    }
  }

  // ========== HELPER METHODS ==========

  private addActivity(activity: Partial<ActivityInfo>): void {
    const fullActivity: ActivityInfo = {
      activityId: `activity-${++this.activityCounter}`,
      timestamp: new Date().toISOString(),
      type: 'workflow_start',
      title: 'Activity',
      description: 'Workflow activity',
      icon: '🔄',
      color: 'gray',
      priority: 'medium',
      ...activity,
    }

    this.progressState.currentActivity = fullActivity
    this.progressState.recentActivities.unshift(fullActivity)

    // Keep only last 50 activities
    if (this.progressState.recentActivities.length > 50) {
      this.progressState.recentActivities =
        this.progressState.recentActivities.slice(0, 50)
    }
  }

  private emitProgress(): void {
    // Update overall progress
    const completedDocs = this.progressState.documentProgress.filter(
      d => d.status === 'completed'
    ).length
    const totalDocs = this.progressState.documentProgress.length

    if (totalDocs > 0) {
      this.progressState.progress.percentage = (completedDocs / totalDocs) * 100
    }

    // Update timestamp
    this.progressState.endTime = new Date().toISOString()

    // Emit to callbacks
    const callback = this.callbacks.get('progress')
    if (callback) {
      callback({ ...this.progressState })
    }
  }

  private getAgentForDocument(documentType: string): string {
    const mapping: Record<string, string> = {
      cover_letter: 'document',
      explanation_memo: 'document',
      client_summary: 'document',
      offer_analysis: 'analysis',
      risk_assessment: 'analysis',
      competitive_comparison: 'analysis',
      negotiation_strategy: 'negotiation',
      market_analysis: 'market',
    }

    return mapping[documentType] || 'document'
  }

  private getAgentName(agentType: AgentActivityInfo['agentType']): string {
    const names: Record<string, string> = {
      document: 'Document Generator',
      analysis: 'Offer Analyzer',
      negotiation: 'Negotiation Strategist',
      market: 'Market Analyst',
    }

    return names[agentType] || 'AI Agent'
  }

  private getStepsForDocument(documentType: string): number {
    const steps: Record<string, number> = {
      cover_letter: 5,
      explanation_memo: 4,
      client_summary: 3,
      offer_analysis: 6,
      risk_assessment: 5,
      competitive_comparison: 7,
      negotiation_strategy: 6,
      market_analysis: 8,
    }

    return steps[documentType] || 5
  }

  private createGenerationSteps(documentType: string): GenerationStepInfo[] {
    const baseSteps: GenerationStepInfo[] = [
      {
        stepId: 'context_analysis',
        stepName: 'Context Analysis',
        description: 'Analyzing context and requirements',
        status: 'pending',
      },
      {
        stepId: 'content_planning',
        stepName: 'Content Planning',
        description: 'Planning document structure and content',
        status: 'pending',
      },
      {
        stepId: 'generation',
        stepName: 'Content Generation',
        description: 'Generating document content',
        status: 'pending',
      },
      {
        stepId: 'formatting',
        stepName: 'Formatting',
        description: 'Formatting and styling the document',
        status: 'pending',
      },
      {
        stepId: 'validation',
        stepName: 'Validation',
        description: 'Validating quality and completeness',
        status: 'pending',
      },
    ]

    // Add document-specific steps
    if (documentType === 'offer_analysis') {
      baseSteps.splice(2, 0, {
        stepId: 'market_research',
        stepName: 'Market Research',
        description: 'Researching market conditions and comparables',
        status: 'pending',
      })
    }

    return baseSteps
  }

  private createQualityChecks(documentType: string): QualityCheckInfo[] {
    return [
      {
        checkId: 'completeness',
        checkName: 'Completeness Check',
        status: 'pending',
        criteria: [
          'All required sections present',
          'Sufficient detail provided',
        ],
        results: {},
        startTime: new Date().toISOString(),
      },
      {
        checkId: 'accuracy',
        checkName: 'Accuracy Check',
        status: 'pending',
        criteria: [
          'Information is factually correct',
          'Calculations are accurate',
        ],
        results: {},
        startTime: new Date().toISOString(),
      },
      {
        checkId: 'clarity',
        checkName: 'Clarity Check',
        status: 'pending',
        criteria: [
          'Content is clear and understandable',
          'Professional tone maintained',
        ],
        results: {},
        startTime: new Date().toISOString(),
      },
    ]
  }

  private createDependencyGraph(
    documents: string[],
    dependencies: Record<string, string[]>
  ): DependencyGraphInfo {
    const nodes: DependencyNode[] = documents.map(doc => ({
      id: doc,
      documentType: doc,
      status: 'pending',
      agent: this.getAgentForDocument(doc),
      progress: 0,
    }))

    const edges: DependencyEdge[] = []

    for (const [doc, deps] of Object.entries(dependencies)) {
      for (const dep of deps) {
        edges.push({
          from: dep,
          to: doc,
          type: 'depends_on',
          resolved: false,
        })
      }
    }

    return {
      nodes,
      edges,
      resolved: [],
      pending: documents.slice(),
      blocked: [],
    }
  }

  private getDependencies(documentType: string): string[] {
    const dependencies: Record<string, string[]> = {
      negotiation_strategy: ['offer_analysis'],
      risk_assessment: ['offer_analysis'],
      client_summary: ['offer_analysis', 'market_analysis'],
      competitive_comparison: ['market_analysis'],
    }

    return dependencies[documentType] || []
  }

  private inferAgentType(chainName: string): AgentActivityInfo['agentType'] {
    const name = chainName.toLowerCase()

    if (name.includes('document')) return 'document'
    if (name.includes('analysis') || name.includes('offer')) return 'analysis'
    if (name.includes('negotiation')) return 'negotiation'
    if (name.includes('market')) return 'market'

    return 'document'
  }

  private inferToolType(toolName: string): ToolUsageInfo['toolType'] {
    const name = toolName.toLowerCase()

    if (name.includes('calc') || name.includes('math')) return 'calculation'
    if (name.includes('data') || name.includes('fetch')) return 'data_fetch'
    if (name.includes('validate') || name.includes('check')) return 'validation'
    if (name.includes('format') || name.includes('style')) return 'formatting'
    if (name.includes('analyze') || name.includes('research')) return 'analysis'

    return 'analysis'
  }

  private extractDocumentType(inputs: any): string | undefined {
    if (inputs && typeof inputs === 'object') {
      return inputs.documentType || inputs.type || inputs.document_type
    }
    return undefined
  }

  // ========== PUBLIC METHODS ==========

  getProgressState(): WorkflowProgressState {
    return { ...this.progressState }
  }

  addError(error: Partial<WorkflowError>): void {
    const fullError: WorkflowError = {
      errorId: `error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'medium',
      message: 'An error occurred',
      recoverable: true,
      ...error,
    }

    this.progressState.errors.push(fullError)

    this.addActivity({
      type: 'error',
      title: 'Error Occurred',
      description: fullError.message,
      icon: '❌',
      color: 'red',
      priority: 'critical',
    })

    this.emitProgress()
  }

  addWarning(warning: Partial<WorkflowWarning>): void {
    const fullWarning: WorkflowWarning = {
      warningId: `warning-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'performance',
      message: 'A warning occurred',
      ...warning,
    }

    this.progressState.warnings.push(fullWarning)

    this.addActivity({
      type: 'error',
      title: 'Warning',
      description: fullWarning.message,
      icon: '⚠️',
      color: 'yellow',
      priority: 'medium',
    })

    this.emitProgress()
  }

  completeWorkflow(result?: any): void {
    this.progressState.status = 'completed'
    this.progressState.endTime = new Date().toISOString()
    this.progressState.progress.percentage = 100

    this.addActivity({
      type: 'completion',
      title: 'Workflow Completed',
      description: 'All documents generated successfully',
      icon: '🎉',
      color: 'green',
      priority: 'high',
    })

    this.emitProgress()
  }
}
