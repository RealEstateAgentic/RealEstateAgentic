/**
 * Document Generation Pipeline
 *
 * Manages document generation with dependency resolution, parallel processing,
 * and intelligent scheduling. Coordinates multiple document types with proper
 * dependency management and error handling.
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { DocumentAgent } from '../agents/document-generation/document-agent'
import { OfferAnalysisAgent } from '../agents/offer-analysis/analysis-agent'
import { NegotiationAgent } from '../agents/negotiation/negotiation-agent'
import { MarketAnalysisAgent } from '../agents/market-analysis/market-agent'
import { StreamingCallbackHandler } from '../common/streaming'
import type {
  DocumentType,
  GeneratedDocument,
  DocumentGenerationContext,
  DocumentGenerationOptions,
} from './document-orchestration'

// ========== PIPELINE STATE TYPES ==========

export interface DocumentPipelineState {
  // Request information
  requestId: string
  documentsToGenerate: DocumentType[]
  context: DocumentGenerationContext
  options: DocumentGenerationOptions

  // Pipeline state
  dependencies: Record<string, string[]>
  generationQueue: DocumentGenerationTask[]
  activeGenerations: Map<string, DocumentGenerationTask>
  completedDocuments: Map<string, GeneratedDocument>
  failedDocuments: Map<string, DocumentGenerationError>

  // Execution state
  currentPhase: number
  phases: GenerationPhase[]
  maxConcurrency: number

  // Results
  results: GeneratedDocument[]
  errors: DocumentGenerationError[]

  // Metadata
  startTime: number
  endTime?: number
  totalTime?: number

  // Streaming
  sessionId?: string
  messages: BaseMessage[]
}

export interface DocumentGenerationTask {
  id: string
  documentType: DocumentType
  phase: number
  priority: number
  dependencies: string[]
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  retryCount: number
  maxRetries: number
  status: TaskStatus
  startTime?: number
  endTime?: number
  error?: string
}

export type TaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface GenerationPhase {
  phaseNumber: number
  name: string
  tasks: DocumentGenerationTask[]
  canRunInParallel: boolean
  maxConcurrency: number
  dependencies: string[]
  estimatedTime: number
}

export interface DocumentGenerationError {
  taskId: string
  documentType: DocumentType
  error: string
  severity: 'low' | 'medium' | 'high'
  timestamp: number
  retryCount: number
  stackTrace?: string
}

export interface PipelineConfiguration {
  maxConcurrency: number
  maxRetries: number
  retryDelay: number
  timeoutMs: number
  enableParallelGeneration: boolean
  prioritizeSpeed: boolean
  failFast: boolean
}

// ========== DOCUMENT DEPENDENCIES ==========

export const DOCUMENT_DEPENDENCIES: Record<DocumentType, string[]> = {
  // Independent documents (no dependencies)
  cover_letter: [],
  market_analysis: [],

  // Documents that depend on market analysis
  explanation_memo: ['market_analysis'],
  client_summary: ['market_analysis'],

  // Documents that depend on offer analysis
  negotiation_strategy: ['offer_analysis'],
  risk_assessment: ['offer_analysis'],

  // Documents that depend on multiple sources
  competitive_comparison: ['market_analysis', 'offer_analysis'],

  // Base analysis document
  offer_analysis: [],
}

export const DOCUMENT_PRIORITIES: Record<DocumentType, number> = {
  // High priority - foundation documents
  market_analysis: 10,
  offer_analysis: 10,

  // Medium priority - client-facing documents
  cover_letter: 8,
  explanation_memo: 7,
  client_summary: 6,

  // Lower priority - strategic documents
  negotiation_strategy: 5,
  risk_assessment: 4,
  competitive_comparison: 3,
}

// ========== PIPELINE ORCHESTRATOR ==========

export class DocumentGenerationPipeline {
  private documentAgent: DocumentAgent
  private analysisAgent: OfferAnalysisAgent
  private negotiationAgent: NegotiationAgent
  private marketAgent: MarketAnalysisAgent
  private config: PipelineConfiguration

  constructor(config: Partial<PipelineConfiguration> = {}) {
    this.documentAgent = new DocumentAgent()
    this.analysisAgent = new OfferAnalysisAgent()
    this.negotiationAgent = new NegotiationAgent()
    this.marketAgent = new MarketAnalysisAgent()

    this.config = {
      maxConcurrency: 3,
      maxRetries: 2,
      retryDelay: 1000,
      timeoutMs: 300000, // 5 minutes
      enableParallelGeneration: true,
      prioritizeSpeed: false,
      failFast: false,
      ...config,
    }
  }

  // ========== PIPELINE WORKFLOW ==========

  createPipelineWorkflow(): StateGraph<DocumentPipelineState> {
    const workflow = new StateGraph<DocumentPipelineState>({
      channels: {
        requestId: 'string',
        documentsToGenerate: 'array',
        context: 'object',
        options: 'object',
        dependencies: 'object',
        generationQueue: 'array',
        activeGenerations: 'object',
        completedDocuments: 'object',
        failedDocuments: 'object',
        currentPhase: 'number',
        phases: 'array',
        maxConcurrency: 'number',
        results: 'array',
        errors: 'array',
        startTime: 'number',
        endTime: 'number',
        totalTime: 'number',
        sessionId: 'string',
        messages: 'array',
      },
    })

    // Add workflow nodes
    workflow.addNode('initialize_pipeline', this.initializePipeline.bind(this))
    workflow.addNode(
      'create_generation_plan',
      this.createGenerationPlan.bind(this)
    )
    workflow.addNode('execute_phase', this.executePhase.bind(this))
    workflow.addNode('monitor_progress', this.monitorProgress.bind(this))
    workflow.addNode('handle_completion', this.handleCompletion.bind(this))
    workflow.addNode('handle_failure', this.handleFailure.bind(this))
    workflow.addNode('finalize_results', this.finalizeResults.bind(this))

    // Define workflow edges
    workflow.addEdge(START, 'initialize_pipeline')
    workflow.addEdge('initialize_pipeline', 'create_generation_plan')
    workflow.addEdge('create_generation_plan', 'execute_phase')

    workflow.addConditionalEdges(
      'execute_phase',
      this.routeAfterPhaseExecution.bind(this),
      {
        continue: 'monitor_progress',
        next_phase: 'execute_phase',
        complete: 'finalize_results',
        error: 'handle_failure',
      }
    )

    workflow.addConditionalEdges(
      'monitor_progress',
      this.routeAfterMonitoring.bind(this),
      {
        continue: 'execute_phase',
        complete: 'handle_completion',
        error: 'handle_failure',
      }
    )

    workflow.addEdge('handle_completion', 'finalize_results')
    workflow.addEdge('handle_failure', 'finalize_results')
    workflow.addEdge('finalize_results', END)

    return workflow
  }

  // ========== WORKFLOW NODE IMPLEMENTATIONS ==========

  async initializePipeline(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      requestId,
      sessionId,
      dependencies: { ...DOCUMENT_DEPENDENCIES },
      generationQueue: [],
      activeGenerations: new Map(),
      completedDocuments: new Map(),
      failedDocuments: new Map(),
      currentPhase: 0,
      phases: [],
      maxConcurrency: this.config.maxConcurrency,
      results: [],
      errors: [],
      startTime: Date.now(),
      messages: [],
    }
  }

  async createGenerationPlan(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    try {
      // Create tasks for each document type
      const tasks: DocumentGenerationTask[] = state.documentsToGenerate.map(
        docType => ({
          id: `task-${docType}-${Date.now()}`,
          documentType: docType,
          phase: 0, // Will be calculated
          priority: DOCUMENT_PRIORITIES[docType] || 5,
          dependencies: DOCUMENT_DEPENDENCIES[docType] || [],
          context: state.context,
          options: state.options,
          retryCount: 0,
          maxRetries: this.config.maxRetries,
          status: 'pending' as TaskStatus,
        })
      )

      // Calculate phases based on dependencies
      const phases = this.calculateExecutionPhases(tasks)

      // Assign phase numbers to tasks
      const updatedTasks = tasks.map(task => ({
        ...task,
        phase: this.getTaskPhase(task, phases),
      }))

      // Create generation queue sorted by phase and priority
      const generationQueue = [...updatedTasks].sort((a, b) => {
        if (a.phase !== b.phase) return a.phase - b.phase
        return b.priority - a.priority
      })

      return {
        phases,
        generationQueue,
        currentPhase: 0,
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            taskId: 'planning',
            documentType: 'cover_letter',
            error:
              error instanceof Error ? error.message : 'Unknown planning error',
            severity: 'high',
            timestamp: Date.now(),
            retryCount: 0,
          },
        ],
      }
    }
  }

  async executePhase(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    const currentPhase = state.phases[state.currentPhase]
    if (!currentPhase) {
      return { endTime: Date.now() }
    }

    try {
      // Get ready tasks from current phase
      const readyTasks = currentPhase.tasks.filter(
        task =>
          task.status === 'pending' &&
          this.areTaskDependenciesSatisfied(task, state)
      )

      // Limit concurrent executions
      const availableSlots =
        this.config.maxConcurrency - state.activeGenerations.size
      const tasksToStart = readyTasks.slice(0, availableSlots)

      // Start task executions
      const activeGenerations = new Map(state.activeGenerations)
      const updatedQueue = [...state.generationQueue]

      for (const task of tasksToStart) {
        task.status = 'running'
        task.startTime = Date.now()
        activeGenerations.set(task.id, task)

        // Remove from queue
        const queueIndex = updatedQueue.findIndex(t => t.id === task.id)
        if (queueIndex >= 0) {
          updatedQueue.splice(queueIndex, 1)
        }

        // Start generation (async)
        this.executeDocumentGeneration(task, state)
          .then(result => {
            this.handleTaskCompletion(task.id, result, state)
          })
          .catch(error => {
            this.handleTaskError(task.id, error, state)
          })
      }

      return {
        activeGenerations,
        generationQueue: updatedQueue,
      }
    } catch (error) {
      return {
        errors: [
          ...state.errors,
          {
            taskId: `phase-${state.currentPhase}`,
            documentType: 'cover_letter',
            error:
              error instanceof Error
                ? error.message
                : 'Unknown phase execution error',
            severity: 'high',
            timestamp: Date.now(),
            retryCount: 0,
          },
        ],
      }
    }
  }

  async monitorProgress(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    // Check for completed or failed tasks
    const activeGenerations = new Map(state.activeGenerations)
    const completedDocuments = new Map(state.completedDocuments)
    const failedDocuments = new Map(state.failedDocuments)
    const errors = [...state.errors]

    // Process completed tasks
    for (const [taskId, task] of activeGenerations) {
      if (task.status === 'completed') {
        activeGenerations.delete(taskId)
      } else if (task.status === 'failed') {
        activeGenerations.delete(taskId)

        // Check if we should retry
        if (task.retryCount < task.maxRetries) {
          task.retryCount++
          task.status = 'pending'
          task.startTime = undefined
          task.endTime = undefined

          // Add back to queue
          const generationQueue = [...state.generationQueue, task]
          return { generationQueue, activeGenerations }
        }
      }
    }

    return {
      activeGenerations,
      completedDocuments,
      failedDocuments,
      errors,
    }
  }

  async handleCompletion(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    const results = Array.from(state.completedDocuments.values())

    return {
      results,
      endTime: Date.now(),
      totalTime: Date.now() - state.startTime,
    }
  }

  async handleFailure(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    const results = Array.from(state.completedDocuments.values())

    return {
      results,
      endTime: Date.now(),
      totalTime: Date.now() - state.startTime,
    }
  }

  async finalizeResults(
    state: DocumentPipelineState
  ): Promise<Partial<DocumentPipelineState>> {
    const finalResults = state.results.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        pipelineId: state.requestId,
        generationTime: state.totalTime || 0,
      },
    }))

    return {
      results: finalResults,
    }
  }

  // ========== ROUTING FUNCTIONS ==========

  private routeAfterPhaseExecution(state: DocumentPipelineState): string {
    // Check if there are errors that should stop execution
    if (this.config.failFast && state.errors.some(e => e.severity === 'high')) {
      return 'error'
    }

    // Check if current phase is complete
    const currentPhase = state.phases[state.currentPhase]
    if (!currentPhase) {
      return 'complete'
    }

    const phaseComplete = currentPhase.tasks.every(
      task => task.status === 'completed' || task.status === 'failed'
    )

    if (phaseComplete) {
      // Move to next phase
      if (state.currentPhase < state.phases.length - 1) {
        return 'next_phase'
      } else {
        return 'complete'
      }
    }

    return 'continue'
  }

  private routeAfterMonitoring(state: DocumentPipelineState): string {
    // Check if all tasks are complete
    const allComplete =
      state.generationQueue.length === 0 && state.activeGenerations.size === 0

    if (allComplete) {
      return 'complete'
    }

    // Check for critical errors
    const criticalErrors = state.errors.filter(e => e.severity === 'high')
    if (this.config.failFast && criticalErrors.length > 0) {
      return 'error'
    }

    return 'continue'
  }

  // ========== HELPER METHODS ==========

  private calculateExecutionPhases(
    tasks: DocumentGenerationTask[]
  ): GenerationPhase[] {
    const phases: GenerationPhase[] = []
    const taskMap = new Map(tasks.map(task => [task.documentType, task]))
    const processed = new Set<string>()

    let phaseNumber = 0
    while (processed.size < tasks.length) {
      const phaseTasks: DocumentGenerationTask[] = []

      for (const task of tasks) {
        if (processed.has(task.documentType)) continue

        // Check if all dependencies are satisfied
        const depsSatisfied = task.dependencies.every(dep => processed.has(dep))
        if (depsSatisfied) {
          phaseTasks.push(task)
          processed.add(task.documentType)
        }
      }

      if (phaseTasks.length === 0) {
        throw new Error('Circular dependency detected in document generation')
      }

      phases.push({
        phaseNumber,
        name: `Phase ${phaseNumber + 1}`,
        tasks: phaseTasks,
        canRunInParallel: phaseTasks.length > 1,
        maxConcurrency: Math.min(phaseTasks.length, this.config.maxConcurrency),
        dependencies: phaseNumber > 0 ? [`Phase ${phaseNumber}`] : [],
        estimatedTime: this.estimatePhaseTime(phaseTasks),
      })

      phaseNumber++
    }

    return phases
  }

  private getTaskPhase(
    task: DocumentGenerationTask,
    phases: GenerationPhase[]
  ): number {
    for (const phase of phases) {
      if (phase.tasks.some(t => t.documentType === task.documentType)) {
        return phase.phaseNumber
      }
    }
    return 0
  }

  private areTaskDependenciesSatisfied(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): boolean {
    return task.dependencies.every(
      dep =>
        state.completedDocuments.has(dep) ||
        Array.from(state.completedDocuments.values()).some(
          doc => doc.type === dep
        )
    )
  }

  private estimatePhaseTime(tasks: DocumentGenerationTask[]): number {
    // Base estimate: 30 seconds per document
    const baseTime = 30000
    const complexityMultiplier = this.getComplexityMultiplier(tasks)
    return tasks.length * baseTime * complexityMultiplier
  }

  private getComplexityMultiplier(tasks: DocumentGenerationTask[]): number {
    // More complex documents take longer
    const complexityMap: Record<DocumentType, number> = {
      cover_letter: 0.8,
      explanation_memo: 1.2,
      negotiation_strategy: 1.5,
      offer_analysis: 1.3,
      market_analysis: 1.4,
      risk_assessment: 1.1,
      client_summary: 0.9,
      competitive_comparison: 1.6,
    }

    const avgComplexity =
      tasks.reduce(
        (sum, task) => sum + (complexityMap[task.documentType] || 1.0),
        0
      ) / tasks.length

    return avgComplexity
  }

  private async executeDocumentGeneration(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): Promise<GeneratedDocument> {
    const startTime = Date.now()

    try {
      let result: GeneratedDocument

      // Route to appropriate agent based on document type
      switch (task.documentType) {
        case 'cover_letter':
        case 'explanation_memo':
        case 'client_summary':
          result = await this.generateWithDocumentAgent(task, state)
          break

        case 'offer_analysis':
        case 'risk_assessment':
        case 'competitive_comparison':
          result = await this.generateWithAnalysisAgent(task, state)
          break

        case 'negotiation_strategy':
          result = await this.generateWithNegotiationAgent(task, state)
          break

        case 'market_analysis':
          result = await this.generateWithMarketAgent(task, state)
          break

        default:
          throw new Error(`Unknown document type: ${task.documentType}`)
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          taskId: task.id,
          phase: task.phase,
          priority: task.priority,
          executionTime: Date.now() - startTime,
        },
      }
    } catch (error) {
      throw new Error(`Failed to generate ${task.documentType}: ${error}`)
    }
  }

  private async generateWithDocumentAgent(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): Promise<GeneratedDocument> {
    const previousContent = this.getPreviousContent(state)

    const result = await this.documentAgent.generateDocument({
      type: task.documentType,
      context: task.context,
      options: task.options,
      previousContent,
    })

    return {
      id: `doc-${task.id}`,
      type: task.documentType,
      title: result.title,
      content: result.content,
      format: task.options.format,
      metadata: {
        wordCount: result.content.split(' ').length,
        readingTime: Math.ceil(result.content.split(' ').length / 200),
        complexity: task.options.complexity,
        tone: task.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'DocumentAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.8,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateWithAnalysisAgent(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): Promise<GeneratedDocument> {
    const result = await this.analysisAgent.analyzeOffer({
      offer: task.context.offer,
      property: task.context.property,
      market: task.context.market,
      marketData: task.context.marketData,
      competingOffers: task.context.competingOffers,
      analysisType:
        task.documentType === 'offer_analysis'
          ? 'comprehensive'
          : 'risk_assessment',
      options: {
        complexity: task.options.complexity,
        includeRiskAssessment: task.options.includeRiskAssessment,
        includeMarketAnalysis: task.options.includeMarketAnalysis,
      },
    })

    return {
      id: `doc-${task.id}`,
      type: task.documentType,
      title: `${task.documentType.replace('_', ' ').toUpperCase()} Analysis`,
      content: JSON.stringify(result, null, 2),
      format: task.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: task.options.complexity,
        tone: task.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'OfferAnalysisAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateWithNegotiationAgent(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): Promise<GeneratedDocument> {
    const result = await this.negotiationAgent.developStrategy({
      offer: task.context.offer,
      negotiation: task.context.negotiation,
      property: task.context.property,
      client: task.context.client,
      market: task.context.market,
      competingOffers: task.context.competingOffers,
      strategyType: 'comprehensive',
      options: {
        complexity: task.options.complexity,
        includeNegotiationTactics: task.options.includeNegotiationTactics,
        tone: task.options.tone,
      },
    })

    return {
      id: `doc-${task.id}`,
      type: task.documentType,
      title: 'Negotiation Strategy',
      content: JSON.stringify(result, null, 2),
      format: task.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: task.options.complexity,
        tone: task.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'NegotiationAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private async generateWithMarketAgent(
    task: DocumentGenerationTask,
    state: DocumentPipelineState
  ): Promise<GeneratedDocument> {
    const result = await this.marketAgent.generateMarketAnalysis({
      location: task.context.market?.location || {
        city: 'Unknown',
        state: 'Unknown',
      },
      propertyType: task.context.property.type,
      priceRange: {
        min: task.context.property.price * 0.8,
        max: task.context.property.price * 1.2,
        median: task.context.property.price,
      },
      marketConditions: {
        trend: task.context.market?.trend || 'warm',
        inventory: task.context.market?.inventory || 'balanced',
        seasonality: 'normal',
      },
      analysisType: 'comprehensive',
      options: {
        complexity: task.options.complexity,
        includeMarketAnalysis: task.options.includeMarketAnalysis,
        format: task.options.format,
      },
    })

    return {
      id: `doc-${task.id}`,
      type: task.documentType,
      title: 'Market Analysis',
      content: JSON.stringify(result, null, 2),
      format: task.options.format,
      metadata: {
        wordCount: JSON.stringify(result).split(' ').length,
        readingTime: Math.ceil(JSON.stringify(result).split(' ').length / 200),
        complexity: task.options.complexity,
        tone: task.options.tone,
        generatedAt: new Date(),
        version: '1.0.0',
        agentUsed: 'MarketAnalysisAgent',
        toolsUsed: result.toolsUsed || [],
      },
      quality: {
        score: 0.85,
        issues: [],
        suggestions: [],
      },
    }
  }

  private getPreviousContent(
    state: DocumentPipelineState
  ): Record<string, any> {
    const content: Record<string, any> = {}

    for (const [docType, document] of state.completedDocuments) {
      content[docType] = document
    }

    return content
  }

  private async handleTaskCompletion(
    taskId: string,
    result: GeneratedDocument,
    state: DocumentPipelineState
  ): Promise<void> {
    const task = state.activeGenerations.get(taskId)
    if (task) {
      task.status = 'completed'
      task.endTime = Date.now()
      state.completedDocuments.set(result.type, result)
    }
  }

  private async handleTaskError(
    taskId: string,
    error: Error,
    state: DocumentPipelineState
  ): Promise<void> {
    const task = state.activeGenerations.get(taskId)
    if (task) {
      task.status = 'failed'
      task.endTime = Date.now()
      task.error = error.message

      state.failedDocuments.set(task.documentType, {
        taskId,
        documentType: task.documentType,
        error: error.message,
        severity: 'high',
        timestamp: Date.now(),
        retryCount: task.retryCount,
        stackTrace: error.stack,
      })
    }
  }
}

// ========== PIPELINE EXECUTION SERVICE ==========

export class PipelineExecutionService {
  private pipeline: DocumentGenerationPipeline

  constructor(config?: Partial<PipelineConfiguration>) {
    this.pipeline = new DocumentGenerationPipeline(config)
  }

  async executePipeline(
    documentsToGenerate: DocumentType[],
    context: DocumentGenerationContext,
    options: DocumentGenerationOptions,
    streamingCallback?: StreamingCallbackHandler
  ): Promise<GeneratedDocument[]> {
    const workflow = this.pipeline.createPipelineWorkflow()
    const compiledWorkflow = workflow.compile()

    const initialState: DocumentPipelineState = {
      requestId: '',
      documentsToGenerate,
      context,
      options,
      dependencies: {},
      generationQueue: [],
      activeGenerations: new Map(),
      completedDocuments: new Map(),
      failedDocuments: new Map(),
      currentPhase: 0,
      phases: [],
      maxConcurrency: 3,
      results: [],
      errors: [],
      startTime: Date.now(),
      messages: [],
    }

    try {
      const result = await compiledWorkflow.invoke(initialState)
      return result.results
    } catch (error) {
      console.error('Pipeline execution failed:', error)
      return []
    }
  }

  async getPipelineMetrics(): Promise<PipelineMetrics> {
    // Implementation would track metrics across pipeline executions
    return {
      totalExecutions: 0,
      averageExecutionTime: 0,
      successRate: 0,
      averageConcurrency: 0,
      mostFrequentDocuments: [],
      errorRate: 0,
    }
  }
}

export interface PipelineMetrics {
  totalExecutions: number
  averageExecutionTime: number
  successRate: number
  averageConcurrency: number
  mostFrequentDocuments: DocumentType[]
  errorRate: number
}

// ========== EXPORTS ==========

export const createDocumentPipeline = (
  config?: Partial<PipelineConfiguration>
) => {
  return new PipelineExecutionService(config)
}

export const executePipelineForDocuments = async (
  documents: DocumentType[],
  context: DocumentGenerationContext,
  options: DocumentGenerationOptions
): Promise<GeneratedDocument[]> => {
  const pipeline = createDocumentPipeline()
  return pipeline.executePipeline(documents, context, options)
}
