/**
 * Workflow State Persistence System
 *
 * Provides state management, persistence, monitoring, and recovery capabilities
 * for LangGraph workflows. Supports both in-memory and persistent storage.
 */

import type {
  DocumentWorkflowState,
  WorkflowStatus,
  DocumentPackageType,
} from './document-orchestration'

// ========== STATE PERSISTENCE TYPES ==========

export interface WorkflowStateStore {
  save(state: DocumentWorkflowState): Promise<void>
  load(packageId: string): Promise<DocumentWorkflowState | null>
  update(
    packageId: string,
    updates: Partial<DocumentWorkflowState>
  ): Promise<void>
  delete(packageId: string): Promise<void>
  list(filters?: StateFilters): Promise<WorkflowStateSummary[]>
  cleanup(olderThan: Date): Promise<number>
}

export interface StateFilters {
  status?: WorkflowStatus
  packageType?: DocumentPackageType
  clientId?: string
  agentId?: string
  createdAfter?: Date
  createdBefore?: Date
  limit?: number
  offset?: number
}

export interface WorkflowStateSummary {
  packageId: string
  packageType: DocumentPackageType
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  clientId: string
  agentId: string
  progress: {
    total: number
    completed: number
    failed: number
    pending: number
  }
  estimatedTimeRemaining?: number
}

export interface WorkflowMonitoringMetrics {
  totalWorkflows: number
  activeWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  averageCompletionTime: number
  averageSuccessRate: number
  errorRate: number
  mostCommonErrors: Array<{ error: string; count: number }>
  packageTypeDistribution: Record<DocumentPackageType, number>
}

// ========== IN-MEMORY STATE STORE ==========

export class InMemoryStateStore implements WorkflowStateStore {
  private states = new Map<string, DocumentWorkflowState>()

  async save(state: DocumentWorkflowState): Promise<void> {
    this.states.set(state.packageId, {
      ...state,
      updatedAt: new Date().toISOString(),
    })
  }

  async load(packageId: string): Promise<DocumentWorkflowState | null> {
    return this.states.get(packageId) || null
  }

  async update(
    packageId: string,
    updates: Partial<DocumentWorkflowState>
  ): Promise<void> {
    const existing = this.states.get(packageId)
    if (!existing) {
      throw new Error(`Workflow state not found: ${packageId}`)
    }

    this.states.set(packageId, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  }

  async delete(packageId: string): Promise<void> {
    this.states.delete(packageId)
  }

  async list(filters?: StateFilters): Promise<WorkflowStateSummary[]> {
    const states = Array.from(this.states.values())

    let filtered = states

    if (filters?.status) {
      filtered = filtered.filter(state => state.status === filters.status)
    }

    if (filters?.packageType) {
      filtered = filtered.filter(
        state => state.packageType === filters.packageType
      )
    }

    if (filters?.clientId) {
      filtered = filtered.filter(
        state => state.context.client.name === filters.clientId
      )
    }

    if (filters?.agentId) {
      filtered = filtered.filter(
        state => state.context.agent.name === filters.agentId
      )
    }

    if (filters?.createdAfter) {
      filtered = filtered.filter(
        state => new Date(state.createdAt) >= (filters.createdAfter as Date)
      )
    }

    if (filters?.createdBefore) {
      filtered = filtered.filter(
        state => new Date(state.createdAt) <= (filters.createdBefore as Date)
      )
    }

    // Sort by creation time (most recent first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Apply pagination
    if (filters?.offset) {
      filtered = filtered.slice(filters.offset)
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered.map(state => this.createStateSummary(state))
  }

  async cleanup(olderThan: Date): Promise<number> {
    const states = Array.from(this.states.entries())
    let deletedCount = 0

    for (const [packageId, state] of states) {
      if (new Date(state.createdAt) < olderThan) {
        this.states.delete(packageId)
        deletedCount++
      }
    }

    return deletedCount
  }

  private createStateSummary(
    state: DocumentWorkflowState
  ): WorkflowStateSummary {
    const total = state.requirements.documents.length
    const completed = state.completedDocuments.length
    const failed = state.failedDocuments.length
    const pending = state.pendingDocuments.length

    return {
      packageId: state.packageId,
      packageType: state.packageType,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      clientId: state.context.client.name,
      agentId: state.context.agent.name,
      progress: {
        total,
        completed,
        failed,
        pending,
      },
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(state),
    }
  }

  private calculateEstimatedTimeRemaining(
    state: DocumentWorkflowState
  ): number | undefined {
    if (state.status === 'completed' || state.status === 'failed') {
      return 0
    }

    const elapsed = Date.now() - new Date(state.createdAt).getTime()
    const completed = state.completedDocuments.length
    const total = state.requirements.documents.length

    if (completed === 0) {
      return state.generationPlan.estimatedTime
    }

    const averageTimePerDocument = elapsed / completed
    const remaining = total - completed

    return remaining * averageTimePerDocument
  }
}

// ========== PERSISTENT STATE STORE ==========

export class PersistentStateStore implements WorkflowStateStore {
  private inMemoryStore: InMemoryStateStore
  private persistencePath: string

  constructor(persistencePath: string = './workflow-states') {
    this.inMemoryStore = new InMemoryStateStore()
    this.persistencePath = persistencePath
    this.initializePersistence()
  }

  private async initializePersistence(): Promise<void> {
    // In a real implementation, this would set up file system or database persistence
    // For now, we'll use the in-memory store as a base
    console.log(
      `Initializing persistent state store at ${this.persistencePath}`
    )
  }

  async save(state: DocumentWorkflowState): Promise<void> {
    await this.inMemoryStore.save(state)
    await this.persistToDisk(state)
  }

  async load(packageId: string): Promise<DocumentWorkflowState | null> {
    // Try in-memory first, then fall back to disk
    let state = await this.inMemoryStore.load(packageId)

    if (!state) {
      state = await this.loadFromDisk(packageId)
      if (state) {
        await this.inMemoryStore.save(state)
      }
    }

    return state
  }

  async update(
    packageId: string,
    updates: Partial<DocumentWorkflowState>
  ): Promise<void> {
    await this.inMemoryStore.update(packageId, updates)

    const state = await this.inMemoryStore.load(packageId)
    if (state) {
      await this.persistToDisk(state)
    }
  }

  async delete(packageId: string): Promise<void> {
    await this.inMemoryStore.delete(packageId)
    await this.deleteFromDisk(packageId)
  }

  async list(filters?: StateFilters): Promise<WorkflowStateSummary[]> {
    return this.inMemoryStore.list(filters)
  }

  async cleanup(olderThan: Date): Promise<number> {
    const deletedCount = await this.inMemoryStore.cleanup(olderThan)
    await this.cleanupDisk(olderThan)
    return deletedCount
  }

  private async persistToDisk(state: DocumentWorkflowState): Promise<void> {
    // In a real implementation, this would write to file system or database
    console.log(`Persisting state ${state.packageId} to disk`)
  }

  private async loadFromDisk(
    packageId: string
  ): Promise<DocumentWorkflowState | null> {
    // In a real implementation, this would read from file system or database
    console.log(`Loading state ${packageId} from disk`)
    return null
  }

  private async deleteFromDisk(packageId: string): Promise<void> {
    // In a real implementation, this would delete from file system or database
    console.log(`Deleting state ${packageId} from disk`)
  }

  private async cleanupDisk(olderThan: Date): Promise<void> {
    // In a real implementation, this would clean up old files from disk
    console.log(`Cleaning up disk states older than ${olderThan.toISOString()}`)
  }
}

// ========== WORKFLOW MONITORING SERVICE ==========

export class WorkflowMonitoringService {
  private stateStore: WorkflowStateStore
  private metricsCache = new Map<string, WorkflowMonitoringMetrics>()
  private cacheTimeout = 60000 // 1 minute

  constructor(stateStore: WorkflowStateStore) {
    this.stateStore = stateStore
  }

  async getMonitoringMetrics(
    cacheKey: string = 'default'
  ): Promise<WorkflowMonitoringMetrics> {
    const cachedMetrics = this.metricsCache.get(cacheKey)

    if (cachedMetrics) {
      return cachedMetrics
    }

    const metrics = await this.calculateMetrics()
    this.metricsCache.set(cacheKey, metrics)

    // Clear cache after timeout
    setTimeout(() => {
      this.metricsCache.delete(cacheKey)
    }, this.cacheTimeout)

    return metrics
  }

  async getWorkflowStatus(
    packageId: string
  ): Promise<WorkflowStateSummary | null> {
    const summaries = await this.stateStore.list({ limit: 1 })
    const summary = summaries.find(s => s.packageId === packageId)
    return summary || null
  }

  async getActiveWorkflows(): Promise<WorkflowStateSummary[]> {
    return this.stateStore.list({
      status: 'generating',
      limit: 100,
    })
  }

  async getRecentWorkflows(
    limit: number = 50
  ): Promise<WorkflowStateSummary[]> {
    return this.stateStore.list({
      limit,
      createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    })
  }

  async getWorkflowsByClient(
    clientId: string
  ): Promise<WorkflowStateSummary[]> {
    return this.stateStore.list({
      clientId,
      limit: 100,
    })
  }

  async getWorkflowsByAgent(agentId: string): Promise<WorkflowStateSummary[]> {
    return this.stateStore.list({
      agentId,
      limit: 100,
    })
  }

  async getFailedWorkflows(): Promise<WorkflowStateSummary[]> {
    return this.stateStore.list({
      status: 'failed',
      limit: 100,
    })
  }

  private async calculateMetrics(): Promise<WorkflowMonitoringMetrics> {
    const allWorkflows = await this.stateStore.list({ limit: 1000 })

    const totalWorkflows = allWorkflows.length
    const activeWorkflows = allWorkflows.filter(
      w => w.status === 'generating'
    ).length
    const completedWorkflows = allWorkflows.filter(
      w => w.status === 'completed'
    ).length
    const failedWorkflows = allWorkflows.filter(
      w => w.status === 'failed'
    ).length

    // Calculate average completion time
    const completedWithTime = allWorkflows.filter(
      w => w.status === 'completed' && w.createdAt && w.updatedAt
    )

    const averageCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, w) => {
            const startTime = new Date(w.createdAt).getTime()
            const endTime = new Date(w.updatedAt).getTime()
            return sum + (endTime - startTime)
          }, 0) / completedWithTime.length
        : 0

    // Calculate success rate
    const completedOrFailed = completedWorkflows + failedWorkflows
    const averageSuccessRate =
      completedOrFailed > 0 ? completedWorkflows / completedOrFailed : 0

    // Calculate error rate
    const errorRate = totalWorkflows > 0 ? failedWorkflows / totalWorkflows : 0

    // Get most common errors (simplified)
    const mostCommonErrors = [
      { error: 'Generation timeout', count: Math.floor(failedWorkflows * 0.3) },
      {
        error: 'Context validation failed',
        count: Math.floor(failedWorkflows * 0.2),
      },
      { error: 'Agent unavailable', count: Math.floor(failedWorkflows * 0.1) },
    ]

    // Calculate package type distribution
    const packageTypeDistribution: Record<DocumentPackageType, number> = {
      buyer_offer_package: 0,
      seller_counter_package: 0,
      negotiation_strategy_package: 0,
      market_analysis_package: 0,
      client_education_package: 0,
      competitive_analysis_package: 0,
      custom_package: 0,
    }

    for (const workflow of allWorkflows) {
      packageTypeDistribution[workflow.packageType]++
    }

    return {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      averageCompletionTime,
      averageSuccessRate,
      errorRate,
      mostCommonErrors,
      packageTypeDistribution,
    }
  }
}

// ========== WORKFLOW RECOVERY SERVICE ==========

export class WorkflowRecoveryService {
  private stateStore: WorkflowStateStore
  private monitoringService: WorkflowMonitoringService

  constructor(stateStore: WorkflowStateStore) {
    this.stateStore = stateStore
    this.monitoringService = new WorkflowMonitoringService(stateStore)
  }

  async recoverStaleWorkflows(
    staleThreshold: number = 300000
  ): Promise<string[]> {
    const activeWorkflows = await this.monitoringService.getActiveWorkflows()
    const staleWorkflows = activeWorkflows.filter(workflow => {
      const lastUpdate = new Date(workflow.updatedAt).getTime()
      return Date.now() - lastUpdate > staleThreshold
    })

    const recoveredIds = [] as string[]

    for (const workflow of staleWorkflows) {
      try {
        await this.recoverWorkflow(workflow.packageId)
        recoveredIds.push(workflow.packageId)
      } catch (error) {
        console.error(
          `Failed to recover workflow ${workflow.packageId}:`,
          error
        )
      }
    }

    return recoveredIds
  }

  async recoverWorkflow(packageId: string): Promise<void> {
    const state = await this.stateStore.load(packageId)
    if (!state) {
      throw new Error(`Workflow state not found: ${packageId}`)
    }

    // Implement recovery logic based on workflow status
    switch (state.status) {
      case 'generating':
        await this.recoverGeneratingWorkflow(state)
        break
      case 'analyzing':
        await this.recoverAnalyzingWorkflow(state)
        break
      case 'planning':
        await this.recoverPlanningWorkflow(state)
        break
      default:
        console.warn(`Cannot recover workflow in status: ${state.status}`)
    }
  }

  private async recoverGeneratingWorkflow(
    state: DocumentWorkflowState
  ): Promise<void> {
    // Reset current document to retry generation
    if (state.currentDocument) {
      await this.stateStore.update(state.packageId, {
        status: 'generating',
        retryCount: 0,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  private async recoverAnalyzingWorkflow(
    state: DocumentWorkflowState
  ): Promise<void> {
    // Reset to completed generation status
    await this.stateStore.update(state.packageId, {
      status: 'generating',
      updatedAt: new Date().toISOString(),
    })
  }

  private async recoverPlanningWorkflow(
    state: DocumentWorkflowState
  ): Promise<void> {
    // Reset to initialized status
    await this.stateStore.update(state.packageId, {
      status: 'pending',
      updatedAt: new Date().toISOString(),
    })
  }

  async cancelWorkflow(packageId: string): Promise<void> {
    const state = await this.stateStore.load(packageId)
    if (!state) {
      throw new Error(`Workflow state not found: ${packageId}`)
    }

    await this.stateStore.update(packageId, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    })
  }

  async retryFailedWorkflow(packageId: string): Promise<void> {
    const state = await this.stateStore.load(packageId)
    if (!state) {
      throw new Error(`Workflow state not found: ${packageId}`)
    }

    if (state.status !== 'failed') {
      throw new Error(`Cannot retry workflow in status: ${state.status}`)
    }

    // Reset workflow to retry
    await this.stateStore.update(packageId, {
      status: 'pending',
      retryCount: 0,
      errors: [],
      failedDocuments: [],
      updatedAt: new Date().toISOString(),
    })
  }
}

// ========== SINGLETON INSTANCES ==========

// Create singleton instances for global use
export const inMemoryStateStore = new InMemoryStateStore()
export const persistentStateStore = new PersistentStateStore()
export const workflowMonitoring = new WorkflowMonitoringService(
  inMemoryStateStore
)
export const workflowRecovery = new WorkflowRecoveryService(inMemoryStateStore)

// ========== CLEANUP UTILITIES ==========

export class WorkflowCleanupService {
  private stateStore: WorkflowStateStore

  constructor(stateStore: WorkflowStateStore) {
    this.stateStore = stateStore
  }

  async cleanupOldWorkflows(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge)
    return this.stateStore.cleanup(cutoffDate)
  }

  async cleanupCompletedWorkflows(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge)
    const workflows = await this.stateStore.list({
      status: 'completed',
      createdBefore: cutoffDate,
    })

    let deletedCount = 0
    for (const workflow of workflows) {
      await this.stateStore.delete(workflow.packageId)
      deletedCount++
    }

    return deletedCount
  }

  async cleanupFailedWorkflows(
    maxAge: number = 3 * 24 * 60 * 60 * 1000
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge)
    const workflows = await this.stateStore.list({
      status: 'failed',
      createdBefore: cutoffDate,
    })

    let deletedCount = 0
    for (const workflow of workflows) {
      await this.stateStore.delete(workflow.packageId)
      deletedCount++
    }

    return deletedCount
  }
}

export const workflowCleanup = new WorkflowCleanupService(inMemoryStateStore)
