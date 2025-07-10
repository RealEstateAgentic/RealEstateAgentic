/**
 * Comprehensive Workflow State Management System
 *
 * Centralized state management for all LangGraph workflows with persistence,
 * synchronization, state transitions, and cross-workflow communication.
 */

import {
  WorkflowStateStore,
  InMemoryStateStore,
  PersistentStateStore,
  WorkflowMonitoringService,
  WorkflowRecoveryService,
} from './state-persistence'
import type {
  DocumentWorkflowState,
  WorkflowStatus,
  DocumentPackageType,
  DocumentGenerationContext,
  DocumentGenerationOptions,
} from './document-orchestration'
import type { NegotiationPipelineState } from './negotiation-pipeline'
import { ConditionalRoutingEngine } from './conditional-routing'

// ========== STATE MANAGEMENT TYPES ==========

export interface WorkflowStateManager {
  // State operations
  createWorkflowState<T extends WorkflowState>(
    type: WorkflowType,
    initialData: T
  ): Promise<string>
  getWorkflowState<T extends WorkflowState>(
    workflowId: string
  ): Promise<T | null>
  updateWorkflowState<T extends WorkflowState>(
    workflowId: string,
    updates: Partial<T>
  ): Promise<void>
  deleteWorkflowState(workflowId: string): Promise<void>

  // State transitions
  transitionState(
    workflowId: string,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
  ): Promise<boolean>
  validateStateTransition(
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
  ): boolean

  // State synchronization
  synchronizeStates(workflowIds: string[]): Promise<void>
  mergeStates(
    primaryWorkflowId: string,
    secondaryWorkflowId: string
  ): Promise<void>

  // State queries
  findWorkflowsByStatus(status: WorkflowStatus): Promise<WorkflowState[]>
  findWorkflowsByType(type: WorkflowType): Promise<WorkflowState[]>
  findWorkflowsByContext(
    context: Partial<DocumentGenerationContext>
  ): Promise<WorkflowState[]>

  // State events
  subscribeToStateChanges(
    workflowId: string,
    callback: StateChangeCallback
  ): void
  unsubscribeFromStateChanges(
    workflowId: string,
    callback: StateChangeCallback
  ): void

  // State cleanup
  cleanupOldStates(maxAge: number): Promise<number>
  archiveCompletedStates(): Promise<number>
}

export type WorkflowType = 'document' | 'negotiation' | 'pipeline' | 'analysis'

export type WorkflowState =
  | DocumentWorkflowState
  | NegotiationPipelineState
  | PipelineState
  | AnalysisState

export interface PipelineState {
  pipelineId: string
  type: 'pipeline'
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  context: DocumentGenerationContext
  options: DocumentGenerationOptions
  progress: {
    completedSteps: number
    totalSteps: number
    currentStep: string
  }
  results: any[]
  errors: any[]
}

export interface AnalysisState {
  analysisId: string
  type: 'analysis'
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  analysisType: string
  context: any
  results: any
  errors: any[]
}

export interface StateChangeEvent {
  workflowId: string
  workflowType: WorkflowType
  previousStatus: WorkflowStatus
  newStatus: WorkflowStatus
  timestamp: number
  changes: Record<string, any>
  triggeredBy: string
}

export type StateChangeCallback = (event: StateChangeEvent) => void

export interface StateTransitionRule {
  from: WorkflowStatus
  to: WorkflowStatus
  conditions?: (state: WorkflowState) => boolean
  actions?: (state: WorkflowState) => Promise<void>
}

export interface StateSynchronizationConfig {
  enableRealTimeSync: boolean
  syncIntervalMs: number
  conflictResolutionStrategy: 'last_write_wins' | 'merge' | 'manual'
  maxRetries: number
}

export interface StateManagerConfig {
  storeType: 'memory' | 'persistent'
  persistencePath?: string
  monitoring: {
    enabled: boolean
    metricsInterval: number
    alertThresholds: {
      failureRate: number
      avgExecutionTime: number
    }
  }
  synchronization: StateSynchronizationConfig
  cleanup: {
    enabled: boolean
    maxAge: number
    cleanupInterval: number
  }
}

// ========== STATE TRANSITION RULES ==========

export const DEFAULT_STATE_TRANSITIONS: StateTransitionRule[] = [
  // Document workflow transitions
  { from: 'pending', to: 'planning' },
  { from: 'planning', to: 'generating' },
  { from: 'generating', to: 'analyzing' },
  { from: 'analyzing', to: 'completed' },
  { from: 'generating', to: 'failed' },
  { from: 'analyzing', to: 'failed' },

  // Recovery transitions
  { from: 'failed', to: 'pending' },
  { from: 'generating', to: 'pending' },
  { from: 'analyzing', to: 'generating' },

  // Cancellation transitions
  { from: 'pending', to: 'cancelled' },
  { from: 'planning', to: 'cancelled' },
  { from: 'generating', to: 'cancelled' },
  { from: 'analyzing', to: 'cancelled' },
]

// ========== COMPREHENSIVE STATE MANAGER ==========

export class ComprehensiveStateManager implements WorkflowStateManager {
  private stateStore: WorkflowStateStore
  private monitoringService: WorkflowMonitoringService
  private recoveryService: WorkflowRecoveryService
  private routingEngine: ConditionalRoutingEngine
  private config: StateManagerConfig

  // State management
  private stateSubscriptions: Map<string, StateChangeCallback[]> = new Map()
  private stateTransitions: StateTransitionRule[] = DEFAULT_STATE_TRANSITIONS
  private activeStates: Map<string, WorkflowState> = new Map()

  // Synchronization
  private syncTimer?: NodeJS.Timeout
  private syncQueue: Set<string> = new Set()

  constructor(config: StateManagerConfig) {
    this.config = config
    this.initializeStateStore()
    this.initializeServices()
    this.startSynchronization()
    this.startCleanup()
  }

  private initializeStateStore(): void {
    if (this.config.storeType === 'persistent') {
      this.stateStore = new PersistentStateStore(this.config.persistencePath)
    } else {
      this.stateStore = new InMemoryStateStore()
    }
  }

  private initializeServices(): void {
    this.monitoringService = new WorkflowMonitoringService(this.stateStore)
    this.recoveryService = new WorkflowRecoveryService(this.stateStore)
    this.routingEngine = new ConditionalRoutingEngine()
  }

  private startSynchronization(): void {
    if (this.config.synchronization.enableRealTimeSync) {
      this.syncTimer = setInterval(() => {
        this.performSynchronization()
      }, this.config.synchronization.syncIntervalMs)
    }
  }

  private startCleanup(): void {
    if (this.config.cleanup.enabled) {
      setInterval(() => {
        this.performCleanup()
      }, this.config.cleanup.cleanupInterval)
    }
  }

  // ========== STATE OPERATIONS ==========

  async createWorkflowState<T extends WorkflowState>(
    type: WorkflowType,
    initialData: T
  ): Promise<string> {
    const workflowId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const state: WorkflowState = {
      ...initialData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.stateStore.save(state as any)
    this.activeStates.set(workflowId, state)

    // Emit state change event
    this.emitStateChange(workflowId, type, 'pending', state.status, 'system')

    return workflowId
  }

  async getWorkflowState<T extends WorkflowState>(
    workflowId: string
  ): Promise<T | null> {
    // Check active states first
    const activeState = this.activeStates.get(workflowId)
    if (activeState) {
      return activeState as T
    }

    // Fall back to persistent store
    const storedState = await this.stateStore.load(workflowId)
    if (storedState) {
      this.activeStates.set(workflowId, storedState)
      return storedState as T
    }

    return null
  }

  async updateWorkflowState<T extends WorkflowState>(
    workflowId: string,
    updates: Partial<T>
  ): Promise<void> {
    const currentState = await this.getWorkflowState<T>(workflowId)
    if (!currentState) {
      throw new Error(`Workflow state not found: ${workflowId}`)
    }

    const previousStatus = currentState.status
    const updatedState = {
      ...currentState,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Validate state transition if status changed
    if (updates.status && updates.status !== previousStatus) {
      const canTransition = this.validateStateTransition(
        previousStatus,
        updates.status
      )
      if (!canTransition) {
        throw new Error(
          `Invalid state transition from ${previousStatus} to ${updates.status}`
        )
      }
    }

    await this.stateStore.update(workflowId, updatedState)
    this.activeStates.set(workflowId, updatedState)

    // Add to sync queue
    this.syncQueue.add(workflowId)

    // Emit state change event
    if (updates.status && updates.status !== previousStatus) {
      this.emitStateChange(
        workflowId,
        this.getWorkflowType(updatedState),
        previousStatus,
        updates.status,
        'update'
      )
    }
  }

  async deleteWorkflowState(workflowId: string): Promise<void> {
    await this.stateStore.delete(workflowId)
    this.activeStates.delete(workflowId)
    this.syncQueue.delete(workflowId)

    // Clean up subscriptions
    this.stateSubscriptions.delete(workflowId)
  }

  // ========== STATE TRANSITIONS ==========

  async transitionState(
    workflowId: string,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
  ): Promise<boolean> {
    const state = await this.getWorkflowState(workflowId)
    if (!state) {
      return false
    }

    if (state.status !== fromStatus) {
      return false
    }

    if (!this.validateStateTransition(fromStatus, toStatus)) {
      return false
    }

    // Find transition rule
    const transitionRule = this.stateTransitions.find(
      rule => rule.from === fromStatus && rule.to === toStatus
    )

    // Execute transition conditions
    if (transitionRule?.conditions && !transitionRule.conditions(state)) {
      return false
    }

    // Execute transition actions
    if (transitionRule?.actions) {
      await transitionRule.actions(state)
    }

    // Update state
    await this.updateWorkflowState(workflowId, { status: toStatus })

    return true
  }

  validateStateTransition(
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
  ): boolean {
    return this.stateTransitions.some(
      rule => rule.from === fromStatus && rule.to === toStatus
    )
  }

  // ========== STATE SYNCHRONIZATION ==========

  async synchronizeStates(workflowIds: string[]): Promise<void> {
    for (const workflowId of workflowIds) {
      const activeState = this.activeStates.get(workflowId)
      if (activeState) {
        await this.stateStore.update(workflowId, activeState)
      }
    }
  }

  async mergeStates(
    primaryWorkflowId: string,
    secondaryWorkflowId: string
  ): Promise<void> {
    const primaryState = await this.getWorkflowState(primaryWorkflowId)
    const secondaryState = await this.getWorkflowState(secondaryWorkflowId)

    if (!primaryState || !secondaryState) {
      throw new Error('Cannot merge states: one or both workflows not found')
    }

    // Merge logic depends on workflow type
    const mergedState = this.performStateMerge(primaryState, secondaryState)

    await this.updateWorkflowState(primaryWorkflowId, mergedState)
    await this.deleteWorkflowState(secondaryWorkflowId)
  }

  private performStateMerge(
    primary: WorkflowState,
    secondary: WorkflowState
  ): Partial<WorkflowState> {
    // Basic merge strategy - can be enhanced based on workflow type
    return {
      ...primary,
      updatedAt: new Date().toISOString(),
      // Merge specific fields based on workflow type
      ...this.mergeWorkflowSpecificFields(primary, secondary),
    }
  }

  private mergeWorkflowSpecificFields(
    primary: WorkflowState,
    secondary: WorkflowState
  ): any {
    // Document workflow specific merge
    if ('completedDocuments' in primary && 'completedDocuments' in secondary) {
      return {
        completedDocuments: [
          ...primary.completedDocuments,
          ...secondary.completedDocuments,
        ],
        errors: [...primary.errors, ...secondary.errors],
      }
    }

    return {}
  }

  // ========== STATE QUERIES ==========

  async findWorkflowsByStatus(
    status: WorkflowStatus
  ): Promise<WorkflowState[]> {
    const summaries = await this.stateStore.list({ status })
    const states: WorkflowState[] = []

    for (const summary of summaries) {
      const state = await this.getWorkflowState(summary.packageId)
      if (state) {
        states.push(state)
      }
    }

    return states
  }

  async findWorkflowsByType(type: WorkflowType): Promise<WorkflowState[]> {
    const allStates = Array.from(this.activeStates.values())
    return allStates.filter(state => this.getWorkflowType(state) === type)
  }

  async findWorkflowsByContext(
    context: Partial<DocumentGenerationContext>
  ): Promise<WorkflowState[]> {
    const allStates = Array.from(this.activeStates.values())
    return allStates.filter(state => this.matchesContext(state, context))
  }

  private matchesContext(
    state: WorkflowState,
    context: Partial<DocumentGenerationContext>
  ): boolean {
    if (!('context' in state)) return false

    const stateContext = state.context as DocumentGenerationContext

    // Check client match
    if (context.client && stateContext.client.name !== context.client.name) {
      return false
    }

    // Check property match
    if (
      context.property &&
      stateContext.property.address !== context.property.address
    ) {
      return false
    }

    return true
  }

  // ========== STATE EVENTS ==========

  subscribeToStateChanges(
    workflowId: string,
    callback: StateChangeCallback
  ): void {
    if (!this.stateSubscriptions.has(workflowId)) {
      this.stateSubscriptions.set(workflowId, [])
    }

    this.stateSubscriptions.get(workflowId)!.push(callback)
  }

  unsubscribeFromStateChanges(
    workflowId: string,
    callback: StateChangeCallback
  ): void {
    const callbacks = this.stateSubscriptions.get(workflowId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emitStateChange(
    workflowId: string,
    workflowType: WorkflowType,
    previousStatus: WorkflowStatus,
    newStatus: WorkflowStatus,
    triggeredBy: string
  ): void {
    const event: StateChangeEvent = {
      workflowId,
      workflowType,
      previousStatus,
      newStatus,
      timestamp: Date.now(),
      changes: { status: newStatus },
      triggeredBy,
    }

    const callbacks = this.stateSubscriptions.get(workflowId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in state change callback:', error)
        }
      })
    }
  }

  // ========== STATE CLEANUP ==========

  async cleanupOldStates(maxAge: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge)
    return this.stateStore.cleanup(cutoffDate)
  }

  async archiveCompletedStates(): Promise<number> {
    const completedStates = await this.findWorkflowsByStatus('completed')
    let archivedCount = 0

    for (const state of completedStates) {
      const workflowId = this.getWorkflowId(state)
      if (workflowId) {
        // Archive logic - could move to separate archive store
        await this.deleteWorkflowState(workflowId)
        archivedCount++
      }
    }

    return archivedCount
  }

  // ========== HELPER METHODS ==========

  private getWorkflowType(state: WorkflowState): WorkflowType {
    if ('packageType' in state) return 'document'
    if ('negotiationId' in state) return 'negotiation'
    if ('pipelineId' in state) return 'pipeline'
    if ('analysisId' in state) return 'analysis'
    return 'document' // default
  }

  private getWorkflowId(state: WorkflowState): string | null {
    if ('packageId' in state) return state.packageId
    if ('negotiationId' in state) return state.negotiationId
    if ('pipelineId' in state) return state.pipelineId
    if ('analysisId' in state) return state.analysisId
    return null
  }

  private async performSynchronization(): Promise<void> {
    if (this.syncQueue.size === 0) return

    const workflowIds = Array.from(this.syncQueue)
    this.syncQueue.clear()

    try {
      await this.synchronizeStates(workflowIds)
    } catch (error) {
      console.error('Synchronization failed:', error)
      // Re-add failed syncs to queue
      workflowIds.forEach(id => this.syncQueue.add(id))
    }
  }

  private async performCleanup(): Promise<void> {
    try {
      await this.cleanupOldStates(this.config.cleanup.maxAge)
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  // ========== MONITORING AND METRICS ==========

  async getStateMetrics(): Promise<StateManagerMetrics> {
    const monitoringMetrics =
      await this.monitoringService.getMonitoringMetrics()

    return {
      totalStates: this.activeStates.size,
      stateDistribution: this.getStateDistribution(),
      transitionMetrics: this.getTransitionMetrics(),
      syncMetrics: {
        queueSize: this.syncQueue.size,
        lastSyncTime: Date.now(),
        syncErrors: 0,
      },
      monitoringMetrics,
    }
  }

  private getStateDistribution(): Record<WorkflowStatus, number> {
    const distribution: Record<WorkflowStatus, number> = {
      pending: 0,
      planning: 0,
      generating: 0,
      analyzing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }

    for (const state of this.activeStates.values()) {
      distribution[state.status] = (distribution[state.status] || 0) + 1
    }

    return distribution
  }

  private getTransitionMetrics(): TransitionMetrics {
    return {
      totalTransitions: 0,
      successfulTransitions: 0,
      failedTransitions: 0,
      averageTransitionTime: 0,
      mostCommonTransitions: [],
    }
  }

  // ========== ADVANCED FEATURES ==========

  async createStateSnapshot(workflowId: string): Promise<StateSnapshot> {
    const state = await this.getWorkflowState(workflowId)
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`)
    }

    return {
      workflowId,
      snapshotId: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      metadata: {
        version: '1.0.0',
        createdBy: 'system',
      },
    }
  }

  async restoreFromSnapshot(snapshot: StateSnapshot): Promise<void> {
    await this.stateStore.save(snapshot.state)
    this.activeStates.set(snapshot.workflowId, snapshot.state)
  }

  async getStateHistory(workflowId: string): Promise<StateHistoryEntry[]> {
    // Implementation would depend on historical tracking
    return []
  }

  // ========== SHUTDOWN ==========

  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    // Final synchronization
    await this.performSynchronization()

    // Clear active states
    this.activeStates.clear()
    this.stateSubscriptions.clear()
    this.syncQueue.clear()
  }
}

// ========== SUPPORTING TYPES ==========

export interface StateManagerMetrics {
  totalStates: number
  stateDistribution: Record<WorkflowStatus, number>
  transitionMetrics: TransitionMetrics
  syncMetrics: {
    queueSize: number
    lastSyncTime: number
    syncErrors: number
  }
  monitoringMetrics: any
}

export interface TransitionMetrics {
  totalTransitions: number
  successfulTransitions: number
  failedTransitions: number
  averageTransitionTime: number
  mostCommonTransitions: Array<{
    from: WorkflowStatus
    to: WorkflowStatus
    count: number
  }>
}

export interface StateSnapshot {
  workflowId: string
  snapshotId: string
  timestamp: number
  state: WorkflowState
  metadata: {
    version: string
    createdBy: string
  }
}

export interface StateHistoryEntry {
  timestamp: number
  previousState: WorkflowState
  newState: WorkflowState
  trigger: string
  changes: Record<string, any>
}

// ========== SINGLETON INSTANCE ==========

export const createStateManager = (
  config: StateManagerConfig
): ComprehensiveStateManager => {
  return new ComprehensiveStateManager(config)
}

// Default configuration
export const defaultStateManagerConfig: StateManagerConfig = {
  storeType: 'memory',
  monitoring: {
    enabled: true,
    metricsInterval: 60000,
    alertThresholds: {
      failureRate: 0.1,
      avgExecutionTime: 300000,
    },
  },
  synchronization: {
    enableRealTimeSync: true,
    syncIntervalMs: 10000,
    conflictResolutionStrategy: 'last_write_wins',
    maxRetries: 3,
  },
  cleanup: {
    enabled: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },
}

export const globalStateManager = createStateManager(defaultStateManagerConfig)
