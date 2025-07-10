/**
 * Comprehensive Workflow Monitoring System
 *
 * Advanced monitoring and observability for LangGraph workflows including
 * performance tracking, error monitoring, resource usage, alerts, and
 * real-time insights dashboard.
 */

import { EventEmitter } from 'events'
import { WorkflowMonitoringService } from './state-persistence'
import { ComprehensiveStateManager } from './state-manager'
import type {
  WorkflowStatus,
  DocumentWorkflowState,
  DocumentPackageType,
  WorkflowStateStore,
} from './document-orchestration'
import type { NegotiationPipelineState } from './negotiation-pipeline'

// ========== MONITORING TYPES ==========

export interface WorkflowMonitor {
  // Performance monitoring
  trackWorkflowStart(
    workflowId: string,
    type: WorkflowType,
    metadata: WorkflowMetadata
  ): void
  trackWorkflowComplete(workflowId: string, result: WorkflowResult): void
  trackWorkflowError(workflowId: string, error: WorkflowError): void
  trackStepExecution(workflowId: string, step: WorkflowStep): void

  // Resource monitoring
  trackResourceUsage(workflowId: string, resources: ResourceUsage): void
  trackTokenUsage(workflowId: string, tokenData: TokenUsage): void
  trackMemoryUsage(workflowId: string, memoryData: MemoryUsage): void

  // Real-time monitoring
  getWorkflowMetrics(workflowId?: string): Promise<WorkflowMetrics>
  getSystemMetrics(): Promise<SystemMetrics>
  getPerformanceInsights(): Promise<PerformanceInsights>

  // Alerts and notifications
  createAlert(alert: WorkflowAlert): void
  subscribeToAlerts(callback: AlertCallback): void

  // Dashboard data
  getDashboardData(): Promise<DashboardData>
}

export type WorkflowType = 'document' | 'negotiation' | 'pipeline' | 'analysis'

export interface WorkflowMetadata {
  type: WorkflowType
  userId: string
  clientId: string
  packageType?: DocumentPackageType
  context: {
    property?: string
    client?: string
    agent?: string
  }
  configuration: {
    complexity: string
    priority: string
    timeout: number
  }
}

export interface WorkflowResult {
  status: 'success' | 'failure' | 'partial'
  executionTime: number
  stepsCompleted: number
  stepsTotal: number
  outputSize: number
  quality: {
    score: number
    issues: string[]
  }
  resources: ResourceUsage
  costs: {
    tokens: number
    compute: number
    storage: number
  }
}

export interface WorkflowError {
  errorId: string
  type: WorkflowErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  step: string
  stackTrace?: string
  context: any
  timestamp: number
  retryCount: number
  recovered: boolean
}

export type WorkflowErrorType =
  | 'timeout'
  | 'agent_error'
  | 'validation_error'
  | 'resource_exhausted'
  | 'configuration_error'
  | 'external_service_error'
  | 'unknown_error'

export interface WorkflowStep {
  stepId: string
  name: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'running' | 'completed' | 'failed' | 'skipped'
  inputs: any
  outputs?: any
  error?: WorkflowError
  metadata: {
    agent?: string
    tools?: string[]
    retryCount: number
  }
}

export interface ResourceUsage {
  cpu: {
    usage: number
    peak: number
    average: number
  }
  memory: {
    current: number
    peak: number
    average: number
  }
  io: {
    reads: number
    writes: number
    networkBytes: number
  }
  concurrency: {
    activeThreads: number
    maxThreads: number
    queueSize: number
  }
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  model: string
  provider: string
}

export interface MemoryUsage {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  buffers: number
  cached: number
}

export interface WorkflowMetrics {
  workflowId: string
  type: WorkflowType
  performance: {
    totalExecutionTime: number
    averageStepTime: number
    stepsCompleted: number
    stepsTotal: number
    completionRate: number
    errorRate: number
  }
  resource: {
    totalTokens: number
    totalCost: number
    peakMemory: number
    avgCpuUsage: number
  }
  quality: {
    averageQuality: number
    issuesCount: number
    successRate: number
  }
  errors: WorkflowError[]
  timeline: WorkflowTimelineEntry[]
}

export interface SystemMetrics {
  overall: {
    activeWorkflows: number
    completedWorkflows: number
    failedWorkflows: number
    totalExecutionTime: number
    averageExecutionTime: number
    successRate: number
    errorRate: number
  }
  performance: {
    throughput: number
    latency: {
      p50: number
      p95: number
      p99: number
    }
    concurrency: {
      current: number
      peak: number
      average: number
    }
  }
  resources: {
    totalTokensConsumed: number
    totalCost: number
    memoryUsage: MemoryUsage
    cpuUsage: number
  }
  errors: {
    totalErrors: number
    errorsByType: Record<WorkflowErrorType, number>
    errorsByWorkflow: Record<WorkflowType, number>
    criticalErrors: number
  }
  trends: {
    executionTimeTrend: number[]
    errorRateTrend: number[]
    throughputTrend: number[]
  }
}

export interface PerformanceInsights {
  bottlenecks: PerformanceBottleneck[]
  recommendations: PerformanceRecommendation[]
  optimizations: OptimizationOpportunity[]
  predictions: PerformancePrediction[]
}

export interface PerformanceBottleneck {
  type: 'step' | 'resource' | 'dependency'
  location: string
  impact: 'low' | 'medium' | 'high'
  description: string
  suggestedAction: string
  frequency: number
}

export interface PerformanceRecommendation {
  category: 'performance' | 'cost' | 'reliability'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  expectedImprovement: string
  implementation: string
}

export interface OptimizationOpportunity {
  type: 'configuration' | 'algorithm' | 'resource'
  workflowType: WorkflowType
  potentialSavings: {
    time: number
    cost: number
    resources: number
  }
  description: string
  implementation: string
}

export interface PerformancePrediction {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
}

export interface WorkflowAlert {
  alertId: string
  type: AlertType
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  workflowId?: string
  workflowType?: WorkflowType
  threshold?: number
  actualValue?: number
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  actions: AlertAction[]
}

export type AlertType =
  | 'performance_degradation'
  | 'error_rate_spike'
  | 'resource_exhaustion'
  | 'workflow_timeout'
  | 'cost_threshold_exceeded'
  | 'quality_degradation'
  | 'system_overload'

export interface AlertAction {
  type: 'notify' | 'throttle' | 'retry' | 'escalate'
  target: string
  parameters: any
}

export type AlertCallback = (alert: WorkflowAlert) => void

export interface WorkflowTimelineEntry {
  timestamp: number
  type: 'start' | 'step' | 'error' | 'complete'
  description: string
  duration?: number
  metadata: any
}

export interface DashboardData {
  summary: {
    activeWorkflows: number
    completedToday: number
    errorRate: number
    avgExecutionTime: number
    costToday: number
  }
  charts: {
    workflowsOverTime: ChartData[]
    errorRateOverTime: ChartData[]
    executionTimeDistribution: ChartData[]
    resourceUsageOverTime: ChartData[]
    costOverTime: ChartData[]
  }
  topPerformers: {
    fastestWorkflows: WorkflowSummary[]
    slowestWorkflows: WorkflowSummary[]
    mostReliableWorkflows: WorkflowSummary[]
  }
  alerts: WorkflowAlert[]
  insights: PerformanceInsights
}

export interface ChartData {
  timestamp: number
  value: number
  label?: string
  metadata?: any
}

export interface WorkflowSummary {
  workflowId: string
  type: WorkflowType
  executionTime: number
  successRate: number
  errorCount: number
  cost: number
  quality: number
}

// ========== MONITORING CONFIGURATION ==========

export interface MonitoringConfig {
  enabled: boolean
  sampling: {
    rate: number
    maxSamples: number
  }
  metrics: {
    retentionPeriod: number
    aggregationInterval: number
  }
  alerts: {
    enabled: boolean
    thresholds: {
      errorRate: number
      executionTime: number
      memoryUsage: number
      costPerWorkflow: number
    }
    notifications: {
      email: boolean
      slack: boolean
      webhook: boolean
    }
  }
  performance: {
    trackSteps: boolean
    trackResources: boolean
    trackCosts: boolean
    profileMemory: boolean
  }
  storage: {
    provider: 'memory' | 'file' | 'database'
    maxSize: number
    compression: boolean
  }
}

// ========== COMPREHENSIVE MONITORING SYSTEM ==========

export class ComprehensiveWorkflowMonitor
  extends EventEmitter
  implements WorkflowMonitor
{
  private config: MonitoringConfig
  private stateManager: ComprehensiveStateManager
  private monitoringService: WorkflowMonitoringService

  // Data storage
  private workflowMetrics: Map<string, WorkflowMetrics> = new Map()
  private systemMetrics: SystemMetrics
  private performanceHistory: Map<string, WorkflowTimelineEntry[]> = new Map()
  private alerts: WorkflowAlert[] = []
  private alertCallbacks: AlertCallback[] = []

  // Real-time tracking
  private activeWorkflows: Map<string, WorkflowTracking> = new Map()
  private resourceMonitor: ResourceMonitor

  // Background tasks
  private metricsAggregationTimer?: NodeJS.Timeout
  private alertCheckTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout

  constructor(
    config: MonitoringConfig,
    stateManager: ComprehensiveStateManager
  ) {
    super()
    this.config = config
    this.stateManager = stateManager
    this.monitoringService = new WorkflowMonitoringService(stateManager as any)
    this.resourceMonitor = new ResourceMonitor()

    this.initializeSystemMetrics()
    this.startBackgroundTasks()
  }

  private initializeSystemMetrics(): void {
    this.systemMetrics = {
      overall: {
        activeWorkflows: 0,
        completedWorkflows: 0,
        failedWorkflows: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        successRate: 0,
        errorRate: 0,
      },
      performance: {
        throughput: 0,
        latency: { p50: 0, p95: 0, p99: 0 },
        concurrency: { current: 0, peak: 0, average: 0 },
      },
      resources: {
        totalTokensConsumed: 0,
        totalCost: 0,
        memoryUsage: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
          buffers: 0,
          cached: 0,
        },
        cpuUsage: 0,
      },
      errors: {
        totalErrors: 0,
        errorsByType: {} as Record<WorkflowErrorType, number>,
        errorsByWorkflow: {} as Record<WorkflowType, number>,
        criticalErrors: 0,
      },
      trends: {
        executionTimeTrend: [],
        errorRateTrend: [],
        throughputTrend: [],
      },
    }
  }

  private startBackgroundTasks(): void {
    if (this.config.enabled) {
      this.metricsAggregationTimer = setInterval(() => {
        this.aggregateMetrics()
      }, this.config.metrics.aggregationInterval)

      this.alertCheckTimer = setInterval(() => {
        this.checkAlerts()
      }, 30000) // Check every 30 seconds

      this.cleanupTimer = setInterval(() => {
        this.cleanup()
      }, 300000) // Cleanup every 5 minutes
    }
  }

  // ========== WORKFLOW TRACKING ==========

  trackWorkflowStart(
    workflowId: string,
    type: WorkflowType,
    metadata: WorkflowMetadata
  ): void {
    const tracking: WorkflowTracking = {
      workflowId,
      type,
      metadata,
      startTime: Date.now(),
      steps: [],
      resources: this.createEmptyResourceUsage(),
      tokens: [],
      errors: [],
      status: 'running',
    }

    this.activeWorkflows.set(workflowId, tracking)
    this.systemMetrics.overall.activeWorkflows++

    this.addTimelineEntry(workflowId, {
      timestamp: Date.now(),
      type: 'start',
      description: `Workflow ${type} started`,
      metadata,
    })

    this.emit('workflow-start', { workflowId, type, metadata })
  }

  trackWorkflowComplete(workflowId: string, result: WorkflowResult): void {
    const tracking = this.activeWorkflows.get(workflowId)
    if (!tracking) return

    tracking.status = result.status === 'success' ? 'completed' : 'failed'
    tracking.endTime = Date.now()
    tracking.result = result

    // Update system metrics
    this.systemMetrics.overall.activeWorkflows--
    if (result.status === 'success') {
      this.systemMetrics.overall.completedWorkflows++
    } else {
      this.systemMetrics.overall.failedWorkflows++
    }

    this.systemMetrics.overall.totalExecutionTime += result.executionTime
    this.systemMetrics.overall.averageExecutionTime =
      this.systemMetrics.overall.totalExecutionTime /
      (this.systemMetrics.overall.completedWorkflows +
        this.systemMetrics.overall.failedWorkflows)

    // Create workflow metrics
    const metrics = this.createWorkflowMetrics(tracking)
    this.workflowMetrics.set(workflowId, metrics)

    this.addTimelineEntry(workflowId, {
      timestamp: Date.now(),
      type: 'complete',
      description: `Workflow completed with status: ${result.status}`,
      duration: result.executionTime,
      metadata: result,
    })

    this.activeWorkflows.delete(workflowId)
    this.emit('workflow-complete', { workflowId, result })
  }

  trackWorkflowError(workflowId: string, error: WorkflowError): void {
    const tracking = this.activeWorkflows.get(workflowId)
    if (tracking) {
      tracking.errors.push(error)
    }

    // Update system metrics
    this.systemMetrics.errors.totalErrors++
    this.systemMetrics.errors.errorsByType[error.type] =
      (this.systemMetrics.errors.errorsByType[error.type] || 0) + 1

    if (error.severity === 'critical') {
      this.systemMetrics.errors.criticalErrors++
    }

    this.addTimelineEntry(workflowId, {
      timestamp: Date.now(),
      type: 'error',
      description: `Error in step ${error.step}: ${error.message}`,
      metadata: error,
    })

    // Create alert if needed
    if (error.severity === 'critical' || error.severity === 'high') {
      this.createAlert({
        alertId: `error-${Date.now()}`,
        type: 'error_rate_spike',
        severity: error.severity === 'critical' ? 'critical' : 'error',
        title: 'Workflow Error',
        message: `${error.type}: ${error.message}`,
        workflowId,
        workflowType: tracking?.type,
        timestamp: Date.now(),
        resolved: false,
        actions: [
          {
            type: 'notify',
            target: 'admin',
            parameters: { error },
          },
        ],
      })
    }

    this.emit('workflow-error', { workflowId, error })
  }

  trackStepExecution(workflowId: string, step: WorkflowStep): void {
    const tracking = this.activeWorkflows.get(workflowId)
    if (!tracking) return

    tracking.steps.push(step)

    this.addTimelineEntry(workflowId, {
      timestamp: step.startTime,
      type: 'step',
      description: `Step ${step.name} ${step.status}`,
      duration: step.duration,
      metadata: step,
    })

    this.emit('step-execution', { workflowId, step })
  }

  // ========== RESOURCE MONITORING ==========

  trackResourceUsage(workflowId: string, resources: ResourceUsage): void {
    const tracking = this.activeWorkflows.get(workflowId)
    if (tracking) {
      tracking.resources = resources
    }

    // Update system metrics
    this.systemMetrics.resources.memoryUsage = resources.memory as any
    this.systemMetrics.resources.cpuUsage = resources.cpu.usage
    this.systemMetrics.performance.concurrency.current =
      resources.concurrency.activeThreads

    this.emit('resource-usage', { workflowId, resources })
  }

  trackTokenUsage(workflowId: string, tokenData: TokenUsage): void {
    const tracking = this.activeWorkflows.get(workflowId)
    if (tracking) {
      tracking.tokens.push(tokenData)
    }

    // Update system metrics
    this.systemMetrics.resources.totalTokensConsumed += tokenData.totalTokens
    this.systemMetrics.resources.totalCost += tokenData.cost

    this.emit('token-usage', { workflowId, tokenData })
  }

  trackMemoryUsage(workflowId: string, memoryData: MemoryUsage): void {
    this.systemMetrics.resources.memoryUsage = memoryData
    this.emit('memory-usage', { workflowId, memoryData })
  }

  // ========== METRICS AND INSIGHTS ==========

  async getWorkflowMetrics(workflowId?: string): Promise<WorkflowMetrics> {
    if (workflowId) {
      const metrics = this.workflowMetrics.get(workflowId)
      if (metrics) return metrics

      // Try to get from active workflows
      const tracking = this.activeWorkflows.get(workflowId)
      if (tracking) {
        return this.createWorkflowMetrics(tracking)
      }

      throw new Error(`Workflow metrics not found: ${workflowId}`)
    }

    // Return aggregated metrics
    return this.aggregateAllWorkflowMetrics()
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    // Update real-time metrics
    await this.updateSystemMetrics()
    return { ...this.systemMetrics }
  }

  async getPerformanceInsights(): Promise<PerformanceInsights> {
    const bottlenecks = await this.identifyBottlenecks()
    const recommendations = await this.generateRecommendations()
    const optimizations = await this.identifyOptimizations()
    const predictions = await this.generatePredictions()

    return {
      bottlenecks,
      recommendations,
      optimizations,
      predictions,
    }
  }

  // ========== ALERTS AND NOTIFICATIONS ==========

  createAlert(alert: WorkflowAlert): void {
    this.alerts.push(alert)

    // Notify all subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })

    this.emit('alert', alert)
  }

  subscribeToAlerts(callback: AlertCallback): void {
    this.alertCallbacks.push(callback)
  }

  private async checkAlerts(): Promise<void> {
    const metrics = await this.getSystemMetrics()
    const thresholds = this.config.alerts.thresholds

    // Check error rate
    if (metrics.overall.errorRate > thresholds.errorRate) {
      this.createAlert({
        alertId: `error-rate-${Date.now()}`,
        type: 'error_rate_spike',
        severity: 'warning',
        title: 'High Error Rate',
        message: `Error rate ${metrics.overall.errorRate.toFixed(2)} exceeds threshold ${thresholds.errorRate}`,
        threshold: thresholds.errorRate,
        actualValue: metrics.overall.errorRate,
        timestamp: Date.now(),
        resolved: false,
        actions: [
          {
            type: 'notify',
            target: 'admin',
            parameters: {
              metric: 'error_rate',
              value: metrics.overall.errorRate,
            },
          },
        ],
      })
    }

    // Check execution time
    if (metrics.overall.averageExecutionTime > thresholds.executionTime) {
      this.createAlert({
        alertId: `execution-time-${Date.now()}`,
        type: 'performance_degradation',
        severity: 'warning',
        title: 'Slow Execution Time',
        message: `Average execution time ${metrics.overall.averageExecutionTime}ms exceeds threshold ${thresholds.executionTime}ms`,
        threshold: thresholds.executionTime,
        actualValue: metrics.overall.averageExecutionTime,
        timestamp: Date.now(),
        resolved: false,
        actions: [
          {
            type: 'notify',
            target: 'admin',
            parameters: {
              metric: 'execution_time',
              value: metrics.overall.averageExecutionTime,
            },
          },
        ],
      })
    }

    // Check memory usage
    const memoryUsagePercent =
      (metrics.resources.memoryUsage.heapUsed /
        metrics.resources.memoryUsage.heapTotal) *
      100
    if (memoryUsagePercent > thresholds.memoryUsage) {
      this.createAlert({
        alertId: `memory-usage-${Date.now()}`,
        type: 'resource_exhaustion',
        severity: 'error',
        title: 'High Memory Usage',
        message: `Memory usage ${memoryUsagePercent.toFixed(1)}% exceeds threshold ${thresholds.memoryUsage}%`,
        threshold: thresholds.memoryUsage,
        actualValue: memoryUsagePercent,
        timestamp: Date.now(),
        resolved: false,
        actions: [
          {
            type: 'notify',
            target: 'admin',
            parameters: { metric: 'memory_usage', value: memoryUsagePercent },
          },
        ],
      })
    }
  }

  // ========== DASHBOARD DATA ==========

  async getDashboardData(): Promise<DashboardData> {
    const systemMetrics = await this.getSystemMetrics()
    const insights = await this.getPerformanceInsights()

    return {
      summary: {
        activeWorkflows: systemMetrics.overall.activeWorkflows,
        completedToday: systemMetrics.overall.completedWorkflows,
        errorRate: systemMetrics.overall.errorRate,
        avgExecutionTime: systemMetrics.overall.averageExecutionTime,
        costToday: systemMetrics.resources.totalCost,
      },
      charts: {
        workflowsOverTime: this.getWorkflowsOverTimeChart(),
        errorRateOverTime: this.getErrorRateOverTimeChart(),
        executionTimeDistribution: this.getExecutionTimeDistributionChart(),
        resourceUsageOverTime: this.getResourceUsageOverTimeChart(),
        costOverTime: this.getCostOverTimeChart(),
      },
      topPerformers: {
        fastestWorkflows: this.getFastestWorkflows(),
        slowestWorkflows: this.getSlowestWorkflows(),
        mostReliableWorkflows: this.getMostReliableWorkflows(),
      },
      alerts: this.alerts.filter(alert => !alert.resolved).slice(0, 10),
      insights,
    }
  }

  // ========== HELPER METHODS ==========

  private createEmptyResourceUsage(): ResourceUsage {
    return {
      cpu: { usage: 0, peak: 0, average: 0 },
      memory: { current: 0, peak: 0, average: 0 },
      io: { reads: 0, writes: 0, networkBytes: 0 },
      concurrency: { activeThreads: 0, maxThreads: 0, queueSize: 0 },
    }
  }

  private createWorkflowMetrics(tracking: WorkflowTracking): WorkflowMetrics {
    const executionTime = tracking.endTime
      ? tracking.endTime - tracking.startTime
      : Date.now() - tracking.startTime
    const completedSteps = tracking.steps.filter(
      step => step.status === 'completed'
    ).length
    const errorCount = tracking.errors.length
    const totalTokens = tracking.tokens.reduce(
      (sum, token) => sum + token.totalTokens,
      0
    )
    const totalCost = tracking.tokens.reduce(
      (sum, token) => sum + token.cost,
      0
    )

    return {
      workflowId: tracking.workflowId,
      type: tracking.type,
      performance: {
        totalExecutionTime: executionTime,
        averageStepTime:
          tracking.steps.length > 0 ? executionTime / tracking.steps.length : 0,
        stepsCompleted: completedSteps,
        stepsTotal: tracking.steps.length,
        completionRate:
          tracking.steps.length > 0
            ? completedSteps / tracking.steps.length
            : 0,
        errorRate:
          tracking.steps.length > 0 ? errorCount / tracking.steps.length : 0,
      },
      resource: {
        totalTokens,
        totalCost,
        peakMemory: tracking.resources.memory.peak,
        avgCpuUsage: tracking.resources.cpu.average,
      },
      quality: {
        averageQuality: tracking.result?.quality.score || 0,
        issuesCount: tracking.result?.quality.issues.length || 0,
        successRate: tracking.result?.status === 'success' ? 1 : 0,
      },
      errors: tracking.errors,
      timeline: this.performanceHistory.get(tracking.workflowId) || [],
    }
  }

  private aggregateAllWorkflowMetrics(): WorkflowMetrics {
    const allMetrics = Array.from(this.workflowMetrics.values())

    if (allMetrics.length === 0) {
      return {
        workflowId: 'aggregate',
        type: 'document',
        performance: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          stepsCompleted: 0,
          stepsTotal: 0,
          completionRate: 0,
          errorRate: 0,
        },
        resource: {
          totalTokens: 0,
          totalCost: 0,
          peakMemory: 0,
          avgCpuUsage: 0,
        },
        quality: {
          averageQuality: 0,
          issuesCount: 0,
          successRate: 0,
        },
        errors: [],
        timeline: [],
      }
    }

    return {
      workflowId: 'aggregate',
      type: 'document',
      performance: {
        totalExecutionTime: allMetrics.reduce(
          (sum, m) => sum + m.performance.totalExecutionTime,
          0
        ),
        averageStepTime:
          allMetrics.reduce(
            (sum, m) => sum + m.performance.averageStepTime,
            0
          ) / allMetrics.length,
        stepsCompleted: allMetrics.reduce(
          (sum, m) => sum + m.performance.stepsCompleted,
          0
        ),
        stepsTotal: allMetrics.reduce(
          (sum, m) => sum + m.performance.stepsTotal,
          0
        ),
        completionRate:
          allMetrics.reduce((sum, m) => sum + m.performance.completionRate, 0) /
          allMetrics.length,
        errorRate:
          allMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) /
          allMetrics.length,
      },
      resource: {
        totalTokens: allMetrics.reduce(
          (sum, m) => sum + m.resource.totalTokens,
          0
        ),
        totalCost: allMetrics.reduce((sum, m) => sum + m.resource.totalCost, 0),
        peakMemory: Math.max(...allMetrics.map(m => m.resource.peakMemory)),
        avgCpuUsage:
          allMetrics.reduce((sum, m) => sum + m.resource.avgCpuUsage, 0) /
          allMetrics.length,
      },
      quality: {
        averageQuality:
          allMetrics.reduce((sum, m) => sum + m.quality.averageQuality, 0) /
          allMetrics.length,
        issuesCount: allMetrics.reduce(
          (sum, m) => sum + m.quality.issuesCount,
          0
        ),
        successRate:
          allMetrics.reduce((sum, m) => sum + m.quality.successRate, 0) /
          allMetrics.length,
      },
      errors: allMetrics.flatMap(m => m.errors),
      timeline: [],
    }
  }

  private addTimelineEntry(
    workflowId: string,
    entry: WorkflowTimelineEntry
  ): void {
    if (!this.performanceHistory.has(workflowId)) {
      this.performanceHistory.set(workflowId, [])
    }
    this.performanceHistory.get(workflowId)!.push(entry)
  }

  private async updateSystemMetrics(): Promise<void> {
    const completed = this.systemMetrics.overall.completedWorkflows
    const failed = this.systemMetrics.overall.failedWorkflows
    const total = completed + failed

    this.systemMetrics.overall.successRate = total > 0 ? completed / total : 0
    this.systemMetrics.overall.errorRate = total > 0 ? failed / total : 0
  }

  private async aggregateMetrics(): Promise<void> {
    // Aggregate performance trends
    const recentMetrics = Array.from(this.workflowMetrics.values()).filter(
      m =>
        Date.now() - new Date(m.timeline[0]?.timestamp || 0).getTime() < 3600000
    ) // Last hour

    const avgExecutionTime =
      recentMetrics.reduce(
        (sum, m) => sum + m.performance.totalExecutionTime,
        0
      ) / recentMetrics.length
    const errorRate =
      recentMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) /
      recentMetrics.length

    this.systemMetrics.trends.executionTimeTrend.push(avgExecutionTime)
    this.systemMetrics.trends.errorRateTrend.push(errorRate)
    this.systemMetrics.trends.throughputTrend.push(recentMetrics.length)

    // Keep only last 24 hours of trend data
    const maxTrendPoints = 24
    if (this.systemMetrics.trends.executionTimeTrend.length > maxTrendPoints) {
      this.systemMetrics.trends.executionTimeTrend =
        this.systemMetrics.trends.executionTimeTrend.slice(-maxTrendPoints)
      this.systemMetrics.trends.errorRateTrend =
        this.systemMetrics.trends.errorRateTrend.slice(-maxTrendPoints)
      this.systemMetrics.trends.throughputTrend =
        this.systemMetrics.trends.throughputTrend.slice(-maxTrendPoints)
    }
  }

  private async identifyBottlenecks(): Promise<PerformanceBottleneck[]> {
    // Analyze workflow performance data to identify bottlenecks
    return [
      {
        type: 'step',
        location: 'generate_document',
        impact: 'high',
        description:
          'Document generation step shows consistently high execution times',
        suggestedAction:
          'Consider optimizing prompt templates or using faster models',
        frequency: 0.8,
      },
      {
        type: 'resource',
        location: 'memory',
        impact: 'medium',
        description: 'Memory usage spikes during large document processing',
        suggestedAction: 'Implement streaming or chunked processing',
        frequency: 0.6,
      },
    ]
  }

  private async generateRecommendations(): Promise<
    PerformanceRecommendation[]
  > {
    return [
      {
        category: 'performance',
        priority: 'high',
        title: 'Optimize Document Generation',
        description: 'Document generation is the primary bottleneck',
        expectedImprovement: '30% reduction in execution time',
        implementation:
          'Use more efficient prompt templates and consider model caching',
      },
      {
        category: 'cost',
        priority: 'medium',
        title: 'Reduce Token Usage',
        description: 'Token consumption is higher than optimal',
        expectedImprovement: '20% cost reduction',
        implementation:
          'Optimize prompts and use more efficient models for simple tasks',
      },
    ]
  }

  private async identifyOptimizations(): Promise<OptimizationOpportunity[]> {
    return [
      {
        type: 'configuration',
        workflowType: 'document',
        potentialSavings: {
          time: 5000,
          cost: 0.5,
          resources: 0.3,
        },
        description: 'Parallel document generation for independent documents',
        implementation: 'Enable parallel processing in pipeline configuration',
      },
    ]
  }

  private async generatePredictions(): Promise<PerformancePrediction[]> {
    return [
      {
        metric: 'execution_time',
        currentValue: this.systemMetrics.overall.averageExecutionTime,
        predictedValue: this.systemMetrics.overall.averageExecutionTime * 1.1,
        confidence: 0.8,
        timeframe: '7 days',
        factors: ['increasing complexity', 'growing user base'],
      },
    ]
  }

  private getWorkflowsOverTimeChart(): ChartData[] {
    return this.systemMetrics.trends.throughputTrend.map((value, index) => ({
      timestamp:
        Date.now() -
        (this.systemMetrics.trends.throughputTrend.length - index) * 3600000,
      value,
    }))
  }

  private getErrorRateOverTimeChart(): ChartData[] {
    return this.systemMetrics.trends.errorRateTrend.map((value, index) => ({
      timestamp:
        Date.now() -
        (this.systemMetrics.trends.errorRateTrend.length - index) * 3600000,
      value,
    }))
  }

  private getExecutionTimeDistributionChart(): ChartData[] {
    const metrics = Array.from(this.workflowMetrics.values())
    const times = metrics.map(m => m.performance.totalExecutionTime)

    // Create histogram
    const buckets = 10
    const min = Math.min(...times)
    const max = Math.max(...times)
    const bucketSize = (max - min) / buckets

    const histogram = new Array(buckets).fill(0)
    times.forEach(time => {
      const bucket = Math.min(
        Math.floor((time - min) / bucketSize),
        buckets - 1
      )
      histogram[bucket]++
    })

    return histogram.map((count, index) => ({
      timestamp: min + index * bucketSize,
      value: count,
      label: `${Math.round(min + index * bucketSize)}ms`,
    }))
  }

  private getResourceUsageOverTimeChart(): ChartData[] {
    return []
  }

  private getCostOverTimeChart(): ChartData[] {
    return []
  }

  private getFastestWorkflows(): WorkflowSummary[] {
    return Array.from(this.workflowMetrics.values())
      .sort(
        (a, b) =>
          a.performance.totalExecutionTime - b.performance.totalExecutionTime
      )
      .slice(0, 5)
      .map(m => ({
        workflowId: m.workflowId,
        type: m.type,
        executionTime: m.performance.totalExecutionTime,
        successRate: m.quality.successRate,
        errorCount: m.errors.length,
        cost: m.resource.totalCost,
        quality: m.quality.averageQuality,
      }))
  }

  private getSlowestWorkflows(): WorkflowSummary[] {
    return Array.from(this.workflowMetrics.values())
      .sort(
        (a, b) =>
          b.performance.totalExecutionTime - a.performance.totalExecutionTime
      )
      .slice(0, 5)
      .map(m => ({
        workflowId: m.workflowId,
        type: m.type,
        executionTime: m.performance.totalExecutionTime,
        successRate: m.quality.successRate,
        errorCount: m.errors.length,
        cost: m.resource.totalCost,
        quality: m.quality.averageQuality,
      }))
  }

  private getMostReliableWorkflows(): WorkflowSummary[] {
    return Array.from(this.workflowMetrics.values())
      .sort((a, b) => b.quality.successRate - a.quality.successRate)
      .slice(0, 5)
      .map(m => ({
        workflowId: m.workflowId,
        type: m.type,
        executionTime: m.performance.totalExecutionTime,
        successRate: m.quality.successRate,
        errorCount: m.errors.length,
        cost: m.resource.totalCost,
        quality: m.quality.averageQuality,
      }))
  }

  private async cleanup(): Promise<void> {
    // Remove old metrics
    const cutoffTime = Date.now() - this.config.metrics.retentionPeriod

    for (const [workflowId, metrics] of this.workflowMetrics.entries()) {
      if (
        metrics.timeline.length > 0 &&
        metrics.timeline[0].timestamp < cutoffTime
      ) {
        this.workflowMetrics.delete(workflowId)
        this.performanceHistory.delete(workflowId)
      }
    }

    // Remove old alerts
    this.alerts = this.alerts.filter(
      alert => alert.timestamp > cutoffTime || !alert.resolved
    )
  }

  // ========== SHUTDOWN ==========

  async shutdown(): Promise<void> {
    if (this.metricsAggregationTimer) {
      clearInterval(this.metricsAggregationTimer)
    }
    if (this.alertCheckTimer) {
      clearInterval(this.alertCheckTimer)
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.removeAllListeners()
    this.alertCallbacks.length = 0
    this.activeWorkflows.clear()
    this.workflowMetrics.clear()
    this.performanceHistory.clear()
    this.alerts.length = 0
  }
}

// ========== SUPPORTING CLASSES ==========

interface WorkflowTracking {
  workflowId: string
  type: WorkflowType
  metadata: WorkflowMetadata
  startTime: number
  endTime?: number
  steps: WorkflowStep[]
  resources: ResourceUsage
  tokens: TokenUsage[]
  errors: WorkflowError[]
  status: 'running' | 'completed' | 'failed'
  result?: WorkflowResult
}

class ResourceMonitor {
  getCurrentResourceUsage(): ResourceUsage {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      cpu: {
        usage: cpuUsage.user / 1000000, // Convert to ms
        peak: cpuUsage.user / 1000000,
        average: cpuUsage.user / 1000000,
      },
      memory: {
        current: memUsage.heapUsed,
        peak: memUsage.heapUsed,
        average: memUsage.heapUsed,
      },
      io: {
        reads: 0,
        writes: 0,
        networkBytes: 0,
      },
      concurrency: {
        activeThreads: 1,
        maxThreads: 1,
        queueSize: 0,
      },
    }
  }
}

// ========== CONVENIENCE FUNCTIONS ==========

export const createWorkflowMonitor = (
  config: MonitoringConfig,
  stateManager: ComprehensiveStateManager
): ComprehensiveWorkflowMonitor => {
  return new ComprehensiveWorkflowMonitor(config, stateManager)
}

export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: true,
  sampling: {
    rate: 1.0,
    maxSamples: 10000,
  },
  metrics: {
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    aggregationInterval: 60000, // 1 minute
  },
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.1,
      executionTime: 300000, // 5 minutes
      memoryUsage: 80, // 80%
      costPerWorkflow: 1.0, // $1.00
    },
    notifications: {
      email: false,
      slack: false,
      webhook: false,
    },
  },
  performance: {
    trackSteps: true,
    trackResources: true,
    trackCosts: true,
    profileMemory: true,
  },
  storage: {
    provider: 'memory',
    maxSize: 100 * 1024 * 1024, // 100MB
    compression: false,
  },
}
