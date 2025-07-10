/**
 * Comprehensive Workflow Error Handling and Recovery System
 *
 * Advanced error handling for LangGraph workflows including circuit breakers,
 * retry strategies, fallback mechanisms, error classification, and automatic
 * recovery procedures.
 */

import { EventEmitter } from 'events'
import { ComprehensiveStateManager } from './state-manager'
import { ComprehensiveWorkflowMonitor } from './monitoring'
import type { WorkflowStatus } from './document-orchestration'

// ========== ERROR HANDLING TYPES ==========

export interface ErrorHandler {
  // Error classification
  classifyError(error: Error, context: ErrorContext): ErrorClassification

  // Error recovery
  handleError(
    error: WorkflowError,
    context: ErrorContext
  ): Promise<ErrorHandlingResult>
  createRecoveryPlan(error: WorkflowError, context: ErrorContext): RecoveryPlan
  executeRecovery(plan: RecoveryPlan): Promise<RecoveryResult>

  // Circuit breaker
  checkCircuitBreaker(
    workflowType: string,
    operation: string
  ): CircuitBreakerState
  recordSuccess(workflowType: string, operation: string): void
  recordFailure(workflowType: string, operation: string): void

  // Retry management
  shouldRetry(error: WorkflowError, attempt: number): boolean
  calculateRetryDelay(attempt: number, strategy: RetryStrategy): number

  // Fallback mechanisms
  getFallbackOption(
    error: WorkflowError,
    context: ErrorContext
  ): FallbackOption | null
  executeFallback(option: FallbackOption): Promise<FallbackResult>

  // Error reporting
  reportError(error: WorkflowError, context: ErrorContext): void
  getErrorSummary(timeframe: number): ErrorSummary
}

export interface ErrorContext {
  workflowId: string
  workflowType: string
  currentStep: string
  executionTime: number
  retryCount: number
  maxRetries: number
  previousErrors: WorkflowError[]
  state: any
  configuration: any
}

export interface WorkflowError {
  id: string
  type: ErrorType
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  originalError?: Error
  stackTrace?: string
  timestamp: number
  context: ErrorContext
  recoverable: boolean
  retryable: boolean
  metadata: Record<string, any>
}

export type ErrorType =
  | 'timeout'
  | 'rate_limit'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'service_unavailable'
  | 'resource_exhausted'
  | 'configuration'
  | 'data_corruption'
  | 'business_logic'
  | 'unknown'

export type ErrorCategory =
  | 'transient'
  | 'permanent'
  | 'configuration'
  | 'resource'
  | 'external'
  | 'internal'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorClassification {
  type: ErrorType
  category: ErrorCategory
  severity: ErrorSeverity
  recoverable: boolean
  retryable: boolean
  estimatedRecoveryTime: number
  recommendedAction: string
  confidence: number
}

export interface ErrorHandlingResult {
  success: boolean
  action: ErrorAction
  message: string
  retryAfter?: number
  fallbackUsed?: boolean
  recoveryPlan?: RecoveryPlan
  metadata: Record<string, any>
}

export type ErrorAction =
  | 'retry'
  | 'fallback'
  | 'abort'
  | 'escalate'
  | 'skip'
  | 'recover'
  | 'wait'

export interface RecoveryPlan {
  planId: string
  workflowId: string
  error: WorkflowError
  steps: RecoveryStep[]
  estimatedTime: number
  successProbability: number
  fallbackOptions: FallbackOption[]
}

export interface RecoveryStep {
  stepId: string
  name: string
  description: string
  action: RecoveryAction
  parameters: Record<string, any>
  dependencies: string[]
  timeout: number
  retryable: boolean
}

export type RecoveryAction =
  | 'restart_workflow'
  | 'restart_step'
  | 'reset_state'
  | 'clear_cache'
  | 'switch_provider'
  | 'reduce_complexity'
  | 'increase_timeout'
  | 'reallocate_resources'
  | 'notify_admin'

export interface RecoveryResult {
  success: boolean
  executedSteps: string[]
  failedSteps: string[]
  finalAction: ErrorAction
  message: string
  newState?: any
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half_open'
  failureCount: number
  successCount: number
  lastFailureTime: number
  nextAttemptTime: number
  threshold: number
}

export interface RetryStrategy {
  type: 'exponential' | 'linear' | 'fixed' | 'custom'
  baseDelay: number
  maxDelay: number
  multiplier: number
  jitter: boolean
  maxAttempts: number
}

export interface FallbackOption {
  id: string
  name: string
  description: string
  type: FallbackType
  configuration: Record<string, any>
  estimatedQuality: number
  estimatedTime: number
  cost: number
  limitations: string[]
}

export type FallbackType =
  | 'simplified_workflow'
  | 'cached_result'
  | 'default_template'
  | 'human_intervention'
  | 'alternative_service'
  | 'degraded_mode'

export interface FallbackResult {
  success: boolean
  output: any
  quality: number
  executionTime: number
  limitations: string[]
  message: string
}

export interface ErrorSummary {
  timeframe: number
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  recoveryRate: number
  averageRecoveryTime: number
  topErrors: ErrorStatistic[]
  trends: ErrorTrend[]
}

export interface ErrorStatistic {
  type: ErrorType
  count: number
  percentage: number
  averageRecoveryTime: number
  successRate: number
}

export interface ErrorTrend {
  type: ErrorType
  direction: 'increasing' | 'decreasing' | 'stable'
  change: number
  confidence: number
}

// ========== ERROR HANDLING CONFIGURATION ==========

export interface ErrorHandlingConfig {
  retryStrategies: Record<string, RetryStrategy>
  circuitBreakers: {
    enabled: boolean
    failureThreshold: number
    recoveryTimeout: number
    halfOpenMaxAttempts: number
  }
  fallbackOptions: {
    enabled: boolean
    maxQualityDegradation: number
    preferredTypes: FallbackType[]
  }
  classification: {
    rules: ErrorClassificationRule[]
    confidence: {
      threshold: number
      fallbackToManual: boolean
    }
  }
  recovery: {
    enabled: boolean
    maxRecoveryTime: number
    maxRecoveryAttempts: number
    parallelRecovery: boolean
  }
  monitoring: {
    enabled: boolean
    alertThresholds: {
      errorRate: number
      criticalErrors: number
      recoveryFailureRate: number
    }
  }
}

export interface ErrorClassificationRule {
  pattern: string | RegExp
  errorType: ErrorType
  category: ErrorCategory
  severity: ErrorSeverity
  recoverable: boolean
  retryable: boolean
  confidence: number
}

// ========== COMPREHENSIVE ERROR HANDLER ==========

export class ComprehensiveErrorHandler
  extends EventEmitter
  implements ErrorHandler
{
  private config: ErrorHandlingConfig
  private stateManager: ComprehensiveStateManager
  private monitor: ComprehensiveWorkflowMonitor

  // Circuit breakers
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()

  // Error tracking
  private errorHistory: WorkflowError[] = []
  private recoveryHistory: Map<string, RecoveryResult[]> = new Map()

  // Fallback registry
  private fallbackRegistry: Map<string, FallbackOption[]> = new Map()

  // Classification rules
  private classificationRules: ErrorClassificationRule[]

  constructor(
    config: ErrorHandlingConfig,
    stateManager: ComprehensiveStateManager,
    monitor: ComprehensiveWorkflowMonitor
  ) {
    super()
    this.config = config
    this.stateManager = stateManager
    this.monitor = monitor
    this.classificationRules = config.classification.rules

    this.initializeFallbackOptions()
    this.startBackgroundTasks()
  }

  private initializeFallbackOptions(): void {
    // Register default fallback options for different workflow types
    this.registerFallbackOption('document', {
      id: 'simple-template',
      name: 'Simple Template Fallback',
      description: 'Use a simplified document template',
      type: 'default_template',
      configuration: { complexity: 'simple', quality: 'basic' },
      estimatedQuality: 0.6,
      estimatedTime: 5000,
      cost: 0.1,
      limitations: ['Reduced customization', 'Basic formatting'],
    })

    this.registerFallbackOption('negotiation', {
      id: 'standard-strategy',
      name: 'Standard Negotiation Strategy',
      description: 'Use a standard negotiation approach',
      type: 'default_template',
      configuration: { strategy: 'standard', complexity: 'basic' },
      estimatedQuality: 0.7,
      estimatedTime: 3000,
      cost: 0.05,
      limitations: ['Generic recommendations', 'No customization'],
    })
  }

  private startBackgroundTasks(): void {
    // Circuit breaker maintenance
    setInterval(() => {
      this.maintainCircuitBreakers()
    }, 30000) // Every 30 seconds

    // Error cleanup
    setInterval(() => {
      this.cleanupOldErrors()
    }, 300000) // Every 5 minutes
  }

  // ========== ERROR CLASSIFICATION ==========

  classifyError(error: Error, context: ErrorContext): ErrorClassification {
    let bestMatch: ErrorClassification | null = null
    let highestConfidence = 0

    // Try to match against classification rules
    for (const rule of this.classificationRules) {
      const confidence = this.evaluateRule(rule, error, context)

      if (
        confidence > highestConfidence &&
        confidence >= this.config.classification.confidence.threshold
      ) {
        highestConfidence = confidence
        bestMatch = {
          type: rule.errorType,
          category: rule.category,
          severity: rule.severity,
          recoverable: rule.recoverable,
          retryable: rule.retryable,
          estimatedRecoveryTime: this.estimateRecoveryTime(
            rule.errorType,
            rule.category
          ),
          recommendedAction: this.getRecommendedAction(
            rule.errorType,
            rule.category
          ),
          confidence: confidence,
        }
      }
    }

    // Fallback classification if no rules match
    if (!bestMatch) {
      bestMatch = this.createFallbackClassification(error, context)
    }

    return bestMatch
  }

  private evaluateRule(
    rule: ErrorClassificationRule,
    error: Error,
    context: ErrorContext
  ): number {
    let confidence = 0

    // Pattern matching
    if (typeof rule.pattern === 'string') {
      if (error.message.toLowerCase().includes(rule.pattern.toLowerCase())) {
        confidence += 0.7
      }
    } else if (rule.pattern instanceof RegExp) {
      if (rule.pattern.test(error.message)) {
        confidence += 0.8
      }
    }

    // Context-based adjustments
    if (context.retryCount > 0 && rule.retryable) {
      confidence += 0.1
    }

    if (context.executionTime > 300000 && rule.errorType === 'timeout') {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0)
  }

  private createFallbackClassification(
    error: Error,
    context: ErrorContext
  ): ErrorClassification {
    return {
      type: 'unknown',
      category: 'internal',
      severity: 'medium',
      recoverable: true,
      retryable: context.retryCount < context.maxRetries,
      estimatedRecoveryTime: 30000,
      recommendedAction: 'retry',
      confidence: 0.5,
    }
  }

  private estimateRecoveryTime(
    type: ErrorType,
    category: ErrorCategory
  ): number {
    const baseTime = 10000 // 10 seconds

    const typeMultipliers: Record<ErrorType, number> = {
      timeout: 2.0,
      rate_limit: 5.0,
      authentication: 1.5,
      authorization: 1.5,
      validation: 1.0,
      network: 3.0,
      service_unavailable: 4.0,
      resource_exhausted: 3.0,
      configuration: 1.0,
      data_corruption: 6.0,
      business_logic: 1.0,
      unknown: 2.0,
    }

    const categoryMultipliers: Record<ErrorCategory, number> = {
      transient: 1.0,
      permanent: 10.0,
      configuration: 1.5,
      resource: 2.0,
      external: 3.0,
      internal: 1.5,
    }

    return (
      baseTime *
      (typeMultipliers[type] || 1.0) *
      (categoryMultipliers[category] || 1.0)
    )
  }

  private getRecommendedAction(
    type: ErrorType,
    category: ErrorCategory
  ): string {
    if (category === 'transient') return 'retry'
    if (category === 'permanent') return 'abort'
    if (type === 'rate_limit') return 'wait'
    if (type === 'timeout') return 'retry'
    if (type === 'configuration') return 'escalate'

    return 'fallback'
  }

  // ========== ERROR HANDLING ==========

  async handleError(
    error: WorkflowError,
    context: ErrorContext
  ): Promise<ErrorHandlingResult> {
    this.errorHistory.push(error)

    // Check circuit breaker
    const circuitState = this.checkCircuitBreaker(
      context.workflowType,
      context.currentStep
    )
    if (circuitState.state === 'open') {
      return {
        success: false,
        action: 'abort',
        message: 'Circuit breaker open - too many failures',
        metadata: { circuitState },
      }
    }

    // Determine handling strategy
    const classification = this.classifyError(
      error.originalError || new Error(error.message),
      context
    )

    if (
      classification.retryable &&
      this.shouldRetry(error, context.retryCount)
    ) {
      const delay = this.calculateRetryDelay(
        context.retryCount,
        this.getRetryStrategy(context.workflowType)
      )

      return {
        success: false,
        action: 'retry',
        message: `Retrying after ${delay}ms`,
        retryAfter: delay,
        metadata: { classification, attempt: context.retryCount + 1 },
      }
    }

    if (classification.recoverable) {
      const recoveryPlan = this.createRecoveryPlan(error, context)
      const recoveryResult = await this.executeRecovery(recoveryPlan)

      if (recoveryResult.success) {
        return {
          success: true,
          action: 'recover',
          message: 'Successfully recovered from error',
          recoveryPlan,
          metadata: { recoveryResult },
        }
      }
    }

    // Try fallback
    const fallbackOption = this.getFallbackOption(error, context)
    if (fallbackOption) {
      const fallbackResult = await this.executeFallback(fallbackOption)

      if (fallbackResult.success) {
        return {
          success: true,
          action: 'fallback',
          message: 'Using fallback option',
          fallbackUsed: true,
          metadata: { fallbackOption, fallbackResult },
        }
      }
    }

    // Last resort
    if (classification.severity === 'critical') {
      return {
        success: false,
        action: 'escalate',
        message: 'Critical error requires manual intervention',
        metadata: { classification },
      }
    }

    return {
      success: false,
      action: 'abort',
      message: 'Unable to handle error - aborting workflow',
      metadata: { classification },
    }
  }

  // ========== RECOVERY MANAGEMENT ==========

  createRecoveryPlan(
    error: WorkflowError,
    context: ErrorContext
  ): RecoveryPlan {
    const steps: RecoveryStep[] = []

    // Determine recovery steps based on error type
    switch (error.type) {
      case 'timeout':
        steps.push({
          stepId: 'increase-timeout',
          name: 'Increase Timeout',
          description: 'Increase timeout for the current operation',
          action: 'increase_timeout',
          parameters: { newTimeout: context.configuration.timeout * 2 },
          dependencies: [],
          timeout: 5000,
          retryable: false,
        })
        break

      case 'resource_exhausted':
        steps.push({
          stepId: 'clear-cache',
          name: 'Clear Cache',
          description: 'Clear memory cache to free resources',
          action: 'clear_cache',
          parameters: {},
          dependencies: [],
          timeout: 10000,
          retryable: true,
        })
        steps.push({
          stepId: 'reduce-complexity',
          name: 'Reduce Complexity',
          description: 'Reduce workflow complexity to use fewer resources',
          action: 'reduce_complexity',
          parameters: { complexity: 'simple' },
          dependencies: ['clear-cache'],
          timeout: 5000,
          retryable: false,
        })
        break

      case 'service_unavailable':
        steps.push({
          stepId: 'switch-provider',
          name: 'Switch Provider',
          description: 'Switch to alternative service provider',
          action: 'switch_provider',
          parameters: { provider: 'fallback' },
          dependencies: [],
          timeout: 15000,
          retryable: true,
        })
        break

      default:
        steps.push({
          stepId: 'restart-step',
          name: 'Restart Step',
          description: 'Restart the failed step',
          action: 'restart_step',
          parameters: { step: context.currentStep },
          dependencies: [],
          timeout: 30000,
          retryable: true,
        })
    }

    return {
      planId: `recovery-${Date.now()}`,
      workflowId: context.workflowId,
      error,
      steps,
      estimatedTime: steps.reduce((sum, step) => sum + step.timeout, 0),
      successProbability: this.calculateSuccessProbability(error, context),
      fallbackOptions: this.fallbackRegistry.get(context.workflowType) || [],
    }
  }

  async executeRecovery(plan: RecoveryPlan): Promise<RecoveryResult> {
    const executedSteps: string[] = []
    const failedSteps: string[] = []

    try {
      for (const step of plan.steps) {
        // Check dependencies
        const depsExecuted = step.dependencies.every(dep =>
          executedSteps.includes(dep)
        )
        if (!depsExecuted) {
          failedSteps.push(step.stepId)
          continue
        }

        const stepResult = await this.executeRecoveryStep(step)

        if (stepResult.success) {
          executedSteps.push(step.stepId)
        } else {
          failedSteps.push(step.stepId)

          if (!step.retryable) {
            break
          }
        }
      }

      const success = failedSteps.length === 0

      // Record recovery attempt
      if (!this.recoveryHistory.has(plan.workflowId)) {
        this.recoveryHistory.set(plan.workflowId, [])
      }

      const result: RecoveryResult = {
        success,
        executedSteps,
        failedSteps,
        finalAction: success ? 'recover' : 'abort',
        message: success
          ? 'Recovery completed successfully'
          : 'Recovery failed',
        newState: success ? await this.createRecoveredState(plan) : undefined,
      }

      this.recoveryHistory.get(plan.workflowId)!.push(result)

      return result
    } catch (error) {
      return {
        success: false,
        executedSteps,
        failedSteps: plan.steps.map(s => s.stepId),
        finalAction: 'abort',
        message: `Recovery execution failed: ${error}`,
      }
    }
  }

  private async executeRecoveryStep(
    step: RecoveryStep
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (step.action) {
        case 'clear_cache':
          // Implementation would clear relevant caches
          await this.clearWorkflowCache()
          return { success: true, message: 'Cache cleared' }

        case 'increase_timeout':
          // Implementation would update timeout configuration
          await this.updateTimeout(step.parameters.newTimeout)
          return { success: true, message: 'Timeout increased' }

        case 'reduce_complexity':
          // Implementation would reduce workflow complexity
          await this.reduceComplexity(step.parameters.complexity)
          return { success: true, message: 'Complexity reduced' }

        case 'switch_provider':
          // Implementation would switch service providers
          await this.switchProvider(step.parameters.provider)
          return { success: true, message: 'Provider switched' }

        case 'restart_step':
          // Implementation would restart the specified step
          await this.restartStep(step.parameters.step)
          return { success: true, message: 'Step restarted' }

        default:
          return {
            success: false,
            message: `Unknown recovery action: ${step.action}`,
          }
      }
    } catch (error) {
      return { success: false, message: `Recovery step failed: ${error}` }
    }
  }

  private calculateSuccessProbability(
    error: WorkflowError,
    context: ErrorContext
  ): number {
    let probability = 0.7 // Base probability

    // Adjust based on error type
    const typeAdjustments: Record<ErrorType, number> = {
      timeout: 0.8,
      rate_limit: 0.9,
      authentication: 0.3,
      authorization: 0.2,
      validation: 0.9,
      network: 0.7,
      service_unavailable: 0.6,
      resource_exhausted: 0.8,
      configuration: 0.4,
      data_corruption: 0.1,
      business_logic: 0.5,
      unknown: 0.5,
    }

    probability *= typeAdjustments[error.type] || 0.5

    // Adjust based on retry count
    probability *= Math.max(0.1, 1 - context.retryCount * 0.2)

    return Math.max(0.1, Math.min(0.9, probability))
  }

  private async createRecoveredState(plan: RecoveryPlan): Promise<any> {
    // Implementation would create a recovered state based on the recovery plan
    return {
      recoveredAt: Date.now(),
      recoveryPlan: plan.planId,
      status: 'recovered' as WorkflowStatus,
    }
  }

  // ========== CIRCUIT BREAKER ==========

  checkCircuitBreaker(
    workflowType: string,
    operation: string
  ): CircuitBreakerState {
    const key = `${workflowType}:${operation}`

    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        threshold: this.config.circuitBreakers.failureThreshold,
      })
    }

    const breaker = this.circuitBreakers.get(key)!

    // Check if we should transition states
    const now = Date.now()

    if (breaker.state === 'open' && now >= breaker.nextAttemptTime) {
      breaker.state = 'half_open'
      breaker.successCount = 0
    }

    return { ...breaker }
  }

  recordSuccess(workflowType: string, operation: string): void {
    const key = `${workflowType}:${operation}`
    const breaker = this.circuitBreakers.get(key)

    if (breaker) {
      breaker.successCount++

      if (
        breaker.state === 'half_open' &&
        breaker.successCount >= this.config.circuitBreakers.halfOpenMaxAttempts
      ) {
        breaker.state = 'closed'
        breaker.failureCount = 0
      }
    }
  }

  recordFailure(workflowType: string, operation: string): void {
    const key = `${workflowType}:${operation}`
    const breaker = this.circuitBreakers.get(key)

    if (breaker) {
      breaker.failureCount++
      breaker.lastFailureTime = Date.now()

      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = 'open'
        breaker.nextAttemptTime =
          Date.now() + this.config.circuitBreakers.recoveryTimeout
      }
    }
  }

  // ========== RETRY MANAGEMENT ==========

  shouldRetry(error: WorkflowError, attempt: number): boolean {
    const strategy = this.getRetryStrategy(error.context.workflowType)

    if (attempt >= strategy.maxAttempts) {
      return false
    }

    // Don't retry permanent errors
    if (error.category === 'permanent') {
      return false
    }

    // Don't retry critical errors unless specifically marked as retryable
    if (error.severity === 'critical' && !error.retryable) {
      return false
    }

    return error.retryable
  }

  calculateRetryDelay(attempt: number, strategy: RetryStrategy): number {
    let delay: number

    switch (strategy.type) {
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(strategy.multiplier, attempt)
        break
      case 'linear':
        delay = strategy.baseDelay + strategy.multiplier * attempt
        break
      case 'fixed':
        delay = strategy.baseDelay
        break
      default:
        delay = strategy.baseDelay
    }

    // Apply jitter if enabled
    if (strategy.jitter) {
      delay *= 0.5 + Math.random() * 0.5
    }

    // Respect maximum delay
    delay = Math.min(delay, strategy.maxDelay)

    return Math.round(delay)
  }

  private getRetryStrategy(workflowType: string): RetryStrategy {
    return (
      this.config.retryStrategies[workflowType] ||
      this.config.retryStrategies.default || {
        type: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,
        jitter: true,
        maxAttempts: 3,
      }
    )
  }

  // ========== FALLBACK MECHANISMS ==========

  getFallbackOption(
    error: WorkflowError,
    context: ErrorContext
  ): FallbackOption | null {
    const options = this.fallbackRegistry.get(context.workflowType) || []

    // Filter options based on error and context
    const viableOptions = options.filter(option => {
      // Check if fallback is appropriate for this error type
      if (error.severity === 'critical' && option.type === 'degraded_mode') {
        return false
      }

      // Check quality requirements
      const maxDegradation = this.config.fallbackOptions.maxQualityDegradation
      if (option.estimatedQuality < 1 - maxDegradation) {
        return false
      }

      return true
    })

    // Return best option (highest quality)
    return (
      viableOptions.sort(
        (a, b) => b.estimatedQuality - a.estimatedQuality
      )[0] || null
    )
  }

  async executeFallback(option: FallbackOption): Promise<FallbackResult> {
    try {
      switch (option.type) {
        case 'simplified_workflow':
          return await this.executeSimplifiedWorkflow(option)
        case 'cached_result':
          return await this.useCachedResult(option)
        case 'default_template':
          return await this.useDefaultTemplate(option)
        case 'degraded_mode':
          return await this.enterDegradedMode(option)
        default:
          throw new Error(`Unknown fallback type: ${option.type}`)
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        quality: 0,
        executionTime: 0,
        limitations: ['Fallback execution failed'],
        message: `Fallback failed: ${error}`,
      }
    }
  }

  registerFallbackOption(workflowType: string, option: FallbackOption): void {
    if (!this.fallbackRegistry.has(workflowType)) {
      this.fallbackRegistry.set(workflowType, [])
    }
    this.fallbackRegistry.get(workflowType)!.push(option)
  }

  // ========== ERROR REPORTING ==========

  reportError(error: WorkflowError, context: ErrorContext): void {
    this.emit('error-reported', { error, context })

    // Send to monitoring system
    this.monitor.trackWorkflowError(context.workflowId, {
      errorId: error.id,
      type: error.type as any,
      severity: error.severity as any,
      message: error.message,
      step: context.currentStep,
      stackTrace: error.stackTrace,
      context: error.context,
      timestamp: error.timestamp,
      retryCount: context.retryCount,
      recovered: false,
    })
  }

  getErrorSummary(timeframe: number): ErrorSummary {
    const cutoffTime = Date.now() - timeframe
    const recentErrors = this.errorHistory.filter(
      error => error.timestamp >= cutoffTime
    )

    const errorsByType: Record<ErrorType, number> = {} as any
    const errorsByCategory: Record<ErrorCategory, number> = {} as any
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any

    for (const error of recentErrors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1
      errorsByCategory[error.category] =
        (errorsByCategory[error.category] || 0) + 1
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1
    }

    const recoveredErrors = recentErrors.filter(error => {
      const recoveries =
        this.recoveryHistory.get(error.context.workflowId) || []
      return recoveries.some(recovery => recovery.success)
    })

    return {
      timeframe,
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      recoveryRate:
        recentErrors.length > 0
          ? recoveredErrors.length / recentErrors.length
          : 0,
      averageRecoveryTime: this.calculateAverageRecoveryTime(recoveredErrors),
      topErrors: this.getTopErrors(recentErrors),
      trends: this.calculateErrorTrends(recentErrors),
    }
  }

  // ========== HELPER METHODS ==========

  private async clearWorkflowCache(): Promise<void> {
    // Implementation would clear workflow-specific caches
  }

  private async updateTimeout(newTimeout: number): Promise<void> {
    // Implementation would update timeout configuration
  }

  private async reduceComplexity(complexity: string): Promise<void> {
    // Implementation would reduce workflow complexity
  }

  private async switchProvider(provider: string): Promise<void> {
    // Implementation would switch service providers
  }

  private async restartStep(step: string): Promise<void> {
    // Implementation would restart the specified step
  }

  private async executeSimplifiedWorkflow(
    option: FallbackOption
  ): Promise<FallbackResult> {
    return {
      success: true,
      output: { type: 'simplified', data: 'Simplified workflow result' },
      quality: option.estimatedQuality,
      executionTime: option.estimatedTime,
      limitations: option.limitations,
      message: 'Simplified workflow executed successfully',
    }
  }

  private async useCachedResult(
    option: FallbackOption
  ): Promise<FallbackResult> {
    return {
      success: true,
      output: { type: 'cached', data: 'Cached result' },
      quality: option.estimatedQuality,
      executionTime: option.estimatedTime,
      limitations: option.limitations,
      message: 'Cached result used successfully',
    }
  }

  private async useDefaultTemplate(
    option: FallbackOption
  ): Promise<FallbackResult> {
    return {
      success: true,
      output: { type: 'template', data: 'Default template result' },
      quality: option.estimatedQuality,
      executionTime: option.estimatedTime,
      limitations: option.limitations,
      message: 'Default template used successfully',
    }
  }

  private async enterDegradedMode(
    option: FallbackOption
  ): Promise<FallbackResult> {
    return {
      success: true,
      output: { type: 'degraded', data: 'Degraded mode result' },
      quality: option.estimatedQuality,
      executionTime: option.estimatedTime,
      limitations: option.limitations,
      message: 'Degraded mode activated successfully',
    }
  }

  private maintainCircuitBreakers(): void {
    const now = Date.now()

    for (const [key, breaker] of this.circuitBreakers) {
      // Reset half-open circuits that have been successful
      if (
        breaker.state === 'half_open' &&
        breaker.successCount >= this.config.circuitBreakers.halfOpenMaxAttempts
      ) {
        breaker.state = 'closed'
        breaker.failureCount = 0
      }

      // Clean up old circuit breakers
      if (
        now - breaker.lastFailureTime >
        this.config.circuitBreakers.recoveryTimeout * 10
      ) {
        this.circuitBreakers.delete(key)
      }
    }
  }

  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours
    this.errorHistory = this.errorHistory.filter(
      error => error.timestamp >= cutoffTime
    )

    // Clean up old recovery history
    for (const [workflowId, recoveries] of this.recoveryHistory) {
      const recentRecoveries = recoveries.filter(
        recovery =>
          // Assuming recovery has a timestamp property
          Date.now() - (recovery as any).timestamp < cutoffTime
      )

      if (recentRecoveries.length === 0) {
        this.recoveryHistory.delete(workflowId)
      } else {
        this.recoveryHistory.set(workflowId, recentRecoveries)
      }
    }
  }

  private calculateAverageRecoveryTime(
    recoveredErrors: WorkflowError[]
  ): number {
    if (recoveredErrors.length === 0) return 0

    const totalTime = recoveredErrors.reduce((sum, error) => {
      const recoveries =
        this.recoveryHistory.get(error.context.workflowId) || []
      const successfulRecovery = recoveries.find(r => r.success)
      return sum + (successfulRecovery ? 30000 : 0) // Placeholder time
    }, 0)

    return totalTime / recoveredErrors.length
  }

  private getTopErrors(errors: WorkflowError[]): ErrorStatistic[] {
    const errorCounts = new Map<ErrorType, number>()

    for (const error of errors) {
      errorCounts.set(error.type, (errorCounts.get(error.type) || 0) + 1)
    }

    return Array.from(errorCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / errors.length) * 100,
        averageRecoveryTime: 30000, // Placeholder
        successRate: 0.8, // Placeholder
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculateErrorTrends(errors: WorkflowError[]): ErrorTrend[] {
    // Simplified trend calculation
    return [
      {
        type: 'timeout',
        direction: 'stable',
        change: 0,
        confidence: 0.8,
      },
    ]
  }

  // ========== SHUTDOWN ==========

  async shutdown(): Promise<void> {
    this.removeAllListeners()
    this.circuitBreakers.clear()
    this.errorHistory.length = 0
    this.recoveryHistory.clear()
    this.fallbackRegistry.clear()
  }
}

// ========== CONVENIENCE FUNCTIONS ==========

export const createErrorHandler = (
  config: ErrorHandlingConfig,
  stateManager: ComprehensiveStateManager,
  monitor: ComprehensiveWorkflowMonitor
): ComprehensiveErrorHandler => {
  return new ComprehensiveErrorHandler(config, stateManager, monitor)
}

export const defaultErrorHandlingConfig: ErrorHandlingConfig = {
  retryStrategies: {
    default: {
      type: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: true,
      maxAttempts: 3,
    },
    document: {
      type: 'exponential',
      baseDelay: 2000,
      maxDelay: 60000,
      multiplier: 2,
      jitter: true,
      maxAttempts: 5,
    },
    negotiation: {
      type: 'linear',
      baseDelay: 1000,
      maxDelay: 15000,
      multiplier: 1000,
      jitter: false,
      maxAttempts: 3,
    },
  },
  circuitBreakers: {
    enabled: true,
    failureThreshold: 5,
    recoveryTimeout: 60000,
    halfOpenMaxAttempts: 3,
  },
  fallbackOptions: {
    enabled: true,
    maxQualityDegradation: 0.3,
    preferredTypes: [
      'simplified_workflow',
      'default_template',
      'cached_result',
    ],
  },
  classification: {
    rules: [
      {
        pattern: /timeout/i,
        errorType: 'timeout',
        category: 'transient',
        severity: 'medium',
        recoverable: true,
        retryable: true,
        confidence: 0.9,
      },
      {
        pattern: /rate.?limit/i,
        errorType: 'rate_limit',
        category: 'transient',
        severity: 'medium',
        recoverable: true,
        retryable: true,
        confidence: 0.95,
      },
      {
        pattern: /unauthorized|forbidden/i,
        errorType: 'authorization',
        category: 'permanent',
        severity: 'high',
        recoverable: false,
        retryable: false,
        confidence: 0.9,
      },
    ],
    confidence: {
      threshold: 0.7,
      fallbackToManual: true,
    },
  },
  recovery: {
    enabled: true,
    maxRecoveryTime: 300000,
    maxRecoveryAttempts: 3,
    parallelRecovery: false,
  },
  monitoring: {
    enabled: true,
    alertThresholds: {
      errorRate: 0.1,
      criticalErrors: 5,
      recoveryFailureRate: 0.3,
    },
  },
}
