/**
 * Conditional Workflow Routing System
 *
 * Implements intelligent routing for LangGraph workflows based on context,
 * state, business rules, and dynamic conditions. Supports complex decision
 * trees and adaptive workflow execution.
 */

import type {
  DocumentWorkflowState,
  DocumentGenerationContext,
  DocumentGenerationOptions,
  DocumentType,
  GeneratedDocument,
} from './document-orchestration'

// ========== ROUTING TYPES ==========

export interface RoutingContext {
  workflowState: DocumentWorkflowState
  generationContext: DocumentGenerationContext
  options: DocumentGenerationOptions
  completedDocuments: GeneratedDocument[]
  failedDocuments: any[]
  currentPhase: string
  executionTime: number
  retryCount: number
  maxRetries: number
}

export interface RoutingCondition {
  id: string
  name: string
  description: string
  evaluator: (context: RoutingContext) => boolean | Promise<boolean>
  priority: number
  category: RoutingCategory
}

export type RoutingCategory =
  | 'error_handling'
  | 'quality_control'
  | 'performance'
  | 'business_logic'
  | 'user_preference'
  | 'context_dependent'

export interface RoutingRule {
  id: string
  name: string
  conditions: RoutingCondition[]
  action: RoutingAction
  priority: number
  enabled: boolean
  description: string
}

export interface RoutingAction {
  type: RoutingActionType
  target: string
  parameters?: Record<string, any>
  message?: string
}

export type RoutingActionType =
  | 'route_to_node'
  | 'skip_node'
  | 'retry_current'
  | 'abort_workflow'
  | 'branch_parallel'
  | 'merge_results'
  | 'fallback_mode'
  | 'escalate_error'

export interface RoutingDecision {
  ruleId: string
  ruleName: string
  action: RoutingAction
  confidence: number
  reasoning: string
  timestamp: number
  appliedConditions: string[]
}

export interface RoutingMetrics {
  totalDecisions: number
  routingDistribution: Record<string, number>
  averageDecisionTime: number
  successfulRoutes: number
  failedRoutes: number
  mostActiveRules: Array<{ ruleId: string; count: number }>
}

// ========== ROUTING CONDITIONS ==========

export class RoutingConditions {
  // Error handling conditions
  static readonly HAS_CRITICAL_ERRORS: RoutingCondition = {
    id: 'has_critical_errors',
    name: 'Has Critical Errors',
    description:
      'Workflow has encountered critical errors that require immediate attention',
    evaluator: context =>
      context.workflowState.errors.some(e => e.step === 'generate_document'),
    priority: 10,
    category: 'error_handling',
  }

  static readonly RETRY_LIMIT_REACHED: RoutingCondition = {
    id: 'retry_limit_reached',
    name: 'Retry Limit Reached',
    description: 'Maximum retry attempts have been exceeded',
    evaluator: context => context.retryCount >= context.maxRetries,
    priority: 9,
    category: 'error_handling',
  }

  static readonly RECOVERABLE_ERROR: RoutingCondition = {
    id: 'recoverable_error',
    name: 'Recoverable Error',
    description: 'Error is recoverable and retry is possible',
    evaluator: context => {
      const lastError =
        context.workflowState.errors[context.workflowState.errors.length - 1]
      return (
        lastError &&
        !lastError.error.includes('timeout') &&
        context.retryCount < context.maxRetries
      )
    },
    priority: 7,
    category: 'error_handling',
  }

  // Quality control conditions
  static readonly LOW_QUALITY_DOCUMENTS: RoutingCondition = {
    id: 'low_quality_documents',
    name: 'Low Quality Documents',
    description: 'Generated documents have quality scores below threshold',
    evaluator: context => {
      const avgQuality =
        context.completedDocuments.reduce(
          (sum, doc) => sum + doc.quality.score,
          0
        ) / context.completedDocuments.length
      return avgQuality < 0.7
    },
    priority: 6,
    category: 'quality_control',
  }

  static readonly MISSING_REQUIRED_CONTENT: RoutingCondition = {
    id: 'missing_required_content',
    name: 'Missing Required Content',
    description: 'Documents are missing required content based on options',
    evaluator: context => {
      const hasMarketAnalysis = context.completedDocuments.some(
        doc => doc.type === 'market_analysis'
      )
      return context.options.includeMarketAnalysis && !hasMarketAnalysis
    },
    priority: 8,
    category: 'quality_control',
  }

  // Performance conditions
  static readonly EXECUTION_TIMEOUT: RoutingCondition = {
    id: 'execution_timeout',
    name: 'Execution Timeout',
    description: 'Workflow execution is taking too long',
    evaluator: context => context.executionTime > 300000, // 5 minutes
    priority: 9,
    category: 'performance',
  }

  static readonly SLOW_PERFORMANCE: RoutingCondition = {
    id: 'slow_performance',
    name: 'Slow Performance',
    description: 'Workflow is executing slower than expected',
    evaluator: context => {
      const expectedTime = context.workflowState.generationPlan.estimatedTime
      return context.executionTime > expectedTime * 1.5
    },
    priority: 5,
    category: 'performance',
  }

  // Business logic conditions
  static readonly FIRST_TIME_BUYER: RoutingCondition = {
    id: 'first_time_buyer',
    name: 'First Time Buyer',
    description: 'Client is a first-time home buyer',
    evaluator: context =>
      context.generationContext.client.experienceLevel === 'first-time',
    priority: 6,
    category: 'business_logic',
  }

  static readonly HOT_MARKET: RoutingCondition = {
    id: 'hot_market',
    name: 'Hot Market',
    description: 'Market conditions are hot with high competition',
    evaluator: context => context.generationContext.market?.trend === 'hot',
    priority: 7,
    category: 'business_logic',
  }

  static readonly COMPETING_OFFERS: RoutingCondition = {
    id: 'competing_offers',
    name: 'Competing Offers',
    description: 'Multiple competing offers exist',
    evaluator: context =>
      (context.generationContext.competingOffers?.length || 0) > 0,
    priority: 8,
    category: 'business_logic',
  }

  // User preference conditions
  static readonly PRIORITIZE_SPEED: RoutingCondition = {
    id: 'prioritize_speed',
    name: 'Prioritize Speed',
    description: 'User has requested speed optimization',
    evaluator: context => context.options.prioritizeSpeed,
    priority: 5,
    category: 'user_preference',
  }

  static readonly DETAILED_COMPLEXITY: RoutingCondition = {
    id: 'detailed_complexity',
    name: 'Detailed Complexity',
    description: 'User has requested detailed complexity',
    evaluator: context => context.options.complexity === 'detailed',
    priority: 4,
    category: 'user_preference',
  }

  // Context dependent conditions
  static readonly BUYER_TRANSACTION: RoutingCondition = {
    id: 'buyer_transaction',
    name: 'Buyer Transaction',
    description: 'Transaction involves a buyer client',
    evaluator: context => context.generationContext.client.role === 'buyer',
    priority: 6,
    category: 'context_dependent',
  }

  static readonly SELLER_TRANSACTION: RoutingCondition = {
    id: 'seller_transaction',
    name: 'Seller Transaction',
    description: 'Transaction involves a seller client',
    evaluator: context => context.generationContext.client.role === 'seller',
    priority: 6,
    category: 'context_dependent',
  }

  static readonly ALL_CONDITIONS: RoutingCondition[] = [
    RoutingConditions.HAS_CRITICAL_ERRORS,
    RoutingConditions.RETRY_LIMIT_REACHED,
    RoutingConditions.RECOVERABLE_ERROR,
    RoutingConditions.LOW_QUALITY_DOCUMENTS,
    RoutingConditions.MISSING_REQUIRED_CONTENT,
    RoutingConditions.EXECUTION_TIMEOUT,
    RoutingConditions.SLOW_PERFORMANCE,
    RoutingConditions.FIRST_TIME_BUYER,
    RoutingConditions.HOT_MARKET,
    RoutingConditions.COMPETING_OFFERS,
    RoutingConditions.PRIORITIZE_SPEED,
    RoutingConditions.DETAILED_COMPLEXITY,
    RoutingConditions.BUYER_TRANSACTION,
    RoutingConditions.SELLER_TRANSACTION,
  ]
}

// ========== ROUTING RULES ==========

export class RoutingRules {
  // Error handling rules
  static readonly ABORT_ON_CRITICAL_ERROR: RoutingRule = {
    id: 'abort_on_critical_error',
    name: 'Abort on Critical Error',
    conditions: [
      RoutingConditions.HAS_CRITICAL_ERRORS,
      RoutingConditions.RETRY_LIMIT_REACHED,
    ],
    action: {
      type: 'abort_workflow',
      target: 'finalize_package',
      message: 'Workflow aborted due to critical errors',
    },
    priority: 10,
    enabled: true,
    description:
      'Abort workflow when critical errors occur and retry limit is reached',
  }

  static readonly RETRY_ON_RECOVERABLE_ERROR: RoutingRule = {
    id: 'retry_on_recoverable_error',
    name: 'Retry on Recoverable Error',
    conditions: [RoutingConditions.RECOVERABLE_ERROR],
    action: {
      type: 'retry_current',
      target: 'generate_document',
      message: 'Retrying document generation due to recoverable error',
    },
    priority: 8,
    enabled: true,
    description: 'Retry document generation when recoverable errors occur',
  }

  static readonly FALLBACK_ON_TIMEOUT: RoutingRule = {
    id: 'fallback_on_timeout',
    name: 'Fallback on Timeout',
    conditions: [RoutingConditions.EXECUTION_TIMEOUT],
    action: {
      type: 'fallback_mode',
      target: 'handle_error',
      message: 'Switching to fallback mode due to timeout',
    },
    priority: 9,
    enabled: true,
    description: 'Switch to fallback mode when execution times out',
  }

  // Quality control rules
  static readonly REGENERATE_LOW_QUALITY: RoutingRule = {
    id: 'regenerate_low_quality',
    name: 'Regenerate Low Quality Documents',
    conditions: [RoutingConditions.LOW_QUALITY_DOCUMENTS],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { qualityImprovement: true },
      message: 'Regenerating documents to improve quality',
    },
    priority: 6,
    enabled: true,
    description: 'Regenerate documents when quality is below threshold',
  }

  static readonly ADD_MISSING_CONTENT: RoutingRule = {
    id: 'add_missing_content',
    name: 'Add Missing Required Content',
    conditions: [RoutingConditions.MISSING_REQUIRED_CONTENT],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { addMissingContent: true },
      message: 'Adding missing required content',
    },
    priority: 8,
    enabled: true,
    description: 'Add missing content when required by options',
  }

  // Performance optimization rules
  static readonly OPTIMIZE_FOR_SPEED: RoutingRule = {
    id: 'optimize_for_speed',
    name: 'Optimize for Speed',
    conditions: [
      RoutingConditions.PRIORITIZE_SPEED,
      RoutingConditions.SLOW_PERFORMANCE,
    ],
    action: {
      type: 'branch_parallel',
      target: 'generate_document',
      parameters: { parallelExecution: true, simplified: true },
      message: 'Optimizing for speed with parallel execution',
    },
    priority: 7,
    enabled: true,
    description: 'Use parallel execution and simplified generation for speed',
  }

  // Business logic rules
  static readonly FIRST_TIME_BUYER_EDUCATION: RoutingRule = {
    id: 'first_time_buyer_education',
    name: 'First Time Buyer Education',
    conditions: [RoutingConditions.FIRST_TIME_BUYER],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { includeEducationalContent: true, simplifiedLanguage: true },
      message: 'Adding educational content for first-time buyer',
    },
    priority: 6,
    enabled: true,
    description: 'Add educational content when client is first-time buyer',
  }

  static readonly HOT_MARKET_URGENCY: RoutingRule = {
    id: 'hot_market_urgency',
    name: 'Hot Market Urgency',
    conditions: [
      RoutingConditions.HOT_MARKET,
      RoutingConditions.COMPETING_OFFERS,
    ],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { emphasizeUrgency: true, competitivePositioning: true },
      message: 'Emphasizing urgency due to hot market conditions',
    },
    priority: 8,
    enabled: true,
    description: 'Emphasize urgency and competitive positioning in hot markets',
  }

  static readonly BUYER_SPECIFIC_ROUTING: RoutingRule = {
    id: 'buyer_specific_routing',
    name: 'Buyer Specific Routing',
    conditions: [RoutingConditions.BUYER_TRANSACTION],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { buyerFocused: true, offerStrategy: true },
      message: 'Using buyer-focused document generation',
    },
    priority: 5,
    enabled: true,
    description: 'Route to buyer-specific document generation',
  }

  static readonly SELLER_SPECIFIC_ROUTING: RoutingRule = {
    id: 'seller_specific_routing',
    name: 'Seller Specific Routing',
    conditions: [RoutingConditions.SELLER_TRANSACTION],
    action: {
      type: 'route_to_node',
      target: 'generate_document',
      parameters: { sellerFocused: true, negotiationStrategy: true },
      message: 'Using seller-focused document generation',
    },
    priority: 5,
    enabled: true,
    description: 'Route to seller-specific document generation',
  }

  static readonly ALL_RULES: RoutingRule[] = [
    RoutingRules.ABORT_ON_CRITICAL_ERROR,
    RoutingRules.RETRY_ON_RECOVERABLE_ERROR,
    RoutingRules.FALLBACK_ON_TIMEOUT,
    RoutingRules.REGENERATE_LOW_QUALITY,
    RoutingRules.ADD_MISSING_CONTENT,
    RoutingRules.OPTIMIZE_FOR_SPEED,
    RoutingRules.FIRST_TIME_BUYER_EDUCATION,
    RoutingRules.HOT_MARKET_URGENCY,
    RoutingRules.BUYER_SPECIFIC_ROUTING,
    RoutingRules.SELLER_SPECIFIC_ROUTING,
  ]
}

// ========== ROUTING ENGINE ==========

export class ConditionalRoutingEngine {
  private rules: RoutingRule[]
  private conditions: RoutingCondition[]
  private metrics: RoutingMetrics

  constructor(
    customRules: RoutingRule[] = [],
    customConditions: RoutingCondition[] = []
  ) {
    this.rules = [...RoutingRules.ALL_RULES, ...customRules]
    this.conditions = [...RoutingConditions.ALL_CONDITIONS, ...customConditions]
    this.metrics = {
      totalDecisions: 0,
      routingDistribution: {},
      averageDecisionTime: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      mostActiveRules: [],
    }
  }

  // ========== CORE ROUTING METHODS ==========

  async evaluateRouting(
    context: RoutingContext
  ): Promise<RoutingDecision | null> {
    const startTime = Date.now()

    try {
      // Sort rules by priority (highest first)
      const sortedRules = [...this.rules]
        .filter(rule => rule.enabled)
        .sort((a, b) => b.priority - a.priority)

      // Evaluate each rule
      for (const rule of sortedRules) {
        const decision = await this.evaluateRule(rule, context)
        if (decision) {
          this.updateMetrics(decision, Date.now() - startTime, true)
          return decision
        }
      }

      this.updateMetrics(null, Date.now() - startTime, false)
      return null
    } catch (error) {
      console.error('Routing evaluation error:', error)
      this.updateMetrics(null, Date.now() - startTime, false)
      return null
    }
  }

  private async evaluateRule(
    rule: RoutingRule,
    context: RoutingContext
  ): Promise<RoutingDecision | null> {
    try {
      const satisfiedConditions: string[] = []
      let allConditionsMet = true

      // Evaluate all conditions for this rule
      for (const condition of rule.conditions) {
        const isMet = await condition.evaluator(context)
        if (isMet) {
          satisfiedConditions.push(condition.id)
        } else {
          allConditionsMet = false
          break
        }
      }

      // If all conditions are met, return the decision
      if (allConditionsMet) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          action: rule.action,
          confidence: this.calculateConfidence(rule, satisfiedConditions),
          reasoning: this.generateReasoning(rule, satisfiedConditions),
          timestamp: Date.now(),
          appliedConditions: satisfiedConditions,
        }
      }

      return null
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error)
      return null
    }
  }

  // ========== SPECIALIZED ROUTING METHODS ==========

  async routeAfterDocumentGeneration(context: RoutingContext): Promise<string> {
    const decision = await this.evaluateRouting(context)

    if (!decision) {
      // Default routing logic
      if (context.workflowState.pendingDocuments.length > 0) {
        return 'continue'
      }
      return 'complete'
    }

    return this.mapActionToRoute(decision.action)
  }

  async routeAfterValidation(context: RoutingContext): Promise<string> {
    const decision = await this.evaluateRouting(context)

    if (!decision) {
      // Default validation routing
      if (context.workflowState.pendingDocuments.length > 0) {
        return 'next_document'
      }
      return 'complete'
    }

    return this.mapActionToRoute(decision.action)
  }

  async routeAfterError(context: RoutingContext): Promise<string> {
    const decision = await this.evaluateRouting(context)

    if (!decision) {
      // Default error routing
      if (context.retryCount < context.maxRetries) {
        return 'retry'
      }
      return 'fail'
    }

    return this.mapActionToRoute(decision.action)
  }

  async routeBasedOnContext(
    context: RoutingContext,
    currentNode: string
  ): Promise<string> {
    const decision = await this.evaluateRouting(context)

    if (!decision) {
      return this.getDefaultRoute(currentNode)
    }

    return this.mapActionToRoute(decision.action)
  }

  // ========== HELPER METHODS ==========

  private calculateConfidence(
    rule: RoutingRule,
    satisfiedConditions: string[]
  ): number {
    // Higher confidence for rules with more conditions satisfied
    const conditionWeight = satisfiedConditions.length / rule.conditions.length
    const priorityWeight = rule.priority / 10

    return Math.min(1.0, (conditionWeight + priorityWeight) / 2)
  }

  private generateReasoning(
    rule: RoutingRule,
    satisfiedConditions: string[]
  ): string {
    const conditionNames = satisfiedConditions.map(id => {
      const condition = this.conditions.find(c => c.id === id)
      return condition?.name || id
    })

    return `${rule.name}: ${conditionNames.join(', ')}`
  }

  private mapActionToRoute(action: RoutingAction): string {
    switch (action.type) {
      case 'route_to_node':
        return action.target
      case 'retry_current':
        return 'retry'
      case 'abort_workflow':
        return 'fail'
      case 'fallback_mode':
        return 'fallback'
      case 'skip_node':
        return 'continue'
      case 'branch_parallel':
        return 'parallel'
      case 'merge_results':
        return 'merge'
      case 'escalate_error':
        return 'error'
      default:
        return 'continue'
    }
  }

  private getDefaultRoute(currentNode: string): string {
    const defaultRoutes: Record<string, string> = {
      generate_document: 'continue',
      validate_document: 'next_document',
      analyze_package: 'complete',
      handle_error: 'retry',
      finalize_package: 'complete',
    }

    return defaultRoutes[currentNode] || 'continue'
  }

  private updateMetrics(
    decision: RoutingDecision | null,
    executionTime: number,
    success: boolean
  ): void {
    this.metrics.totalDecisions++
    this.metrics.averageDecisionTime =
      (this.metrics.averageDecisionTime + executionTime) / 2

    if (success) {
      this.metrics.successfulRoutes++
      if (decision) {
        this.metrics.routingDistribution[decision.ruleId] =
          (this.metrics.routingDistribution[decision.ruleId] || 0) + 1
      }
    } else {
      this.metrics.failedRoutes++
    }

    // Update most active rules
    const ruleStats = Object.entries(this.metrics.routingDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ruleId, count]) => ({ ruleId, count }))

    this.metrics.mostActiveRules = ruleStats
  }

  // ========== RULE MANAGEMENT ==========

  addRule(rule: RoutingRule): void {
    this.rules.push(rule)
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = true
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = false
    }
  }

  addCondition(condition: RoutingCondition): void {
    this.conditions.push(condition)
  }

  getMetrics(): RoutingMetrics {
    return { ...this.metrics }
  }

  // ========== TESTING AND DEBUGGING ==========

  async testRule(
    ruleId: string,
    context: RoutingContext
  ): Promise<{ satisfied: boolean; conditions: Record<string, boolean> }> {
    const rule = this.rules.find(r => r.id === ruleId)
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`)
    }

    const conditionResults: Record<string, boolean> = {}
    let allSatisfied = true

    for (const condition of rule.conditions) {
      const result = await condition.evaluator(context)
      conditionResults[condition.id] = result
      if (!result) {
        allSatisfied = false
      }
    }

    return {
      satisfied: allSatisfied,
      conditions: conditionResults,
    }
  }

  async debugRouting(context: RoutingContext): Promise<{
    evaluatedRules: Array<{
      ruleId: string
      satisfied: boolean
      conditions: Record<string, boolean>
    }>
    selectedRule?: string
  }> {
    const evaluatedRules = []

    for (const rule of this.rules.filter(r => r.enabled)) {
      const result = await this.testRule(rule.id, context)
      evaluatedRules.push({
        ruleId: rule.id,
        satisfied: result.satisfied,
        conditions: result.conditions,
      })
    }

    const decision = await this.evaluateRouting(context)

    return {
      evaluatedRules,
      selectedRule: decision?.ruleId,
    }
  }
}

// ========== SINGLETON INSTANCE ==========

export const globalRoutingEngine = new ConditionalRoutingEngine()

// ========== CONVENIENCE FUNCTIONS ==========

export const createRoutingEngine = (
  customRules?: RoutingRule[],
  customConditions?: RoutingCondition[]
) => {
  return new ConditionalRoutingEngine(customRules, customConditions)
}

export const evaluateWorkflowRouting = async (
  workflowState: DocumentWorkflowState,
  generationContext: DocumentGenerationContext,
  options: DocumentGenerationOptions,
  additionalParams: Partial<RoutingContext> = {}
): Promise<RoutingDecision | null> => {
  const context: RoutingContext = {
    workflowState,
    generationContext,
    options,
    completedDocuments: workflowState.completedDocuments,
    failedDocuments: workflowState.failedDocuments,
    currentPhase: workflowState.status,
    executionTime: Date.now() - new Date(workflowState.createdAt).getTime(),
    retryCount: workflowState.retryCount,
    maxRetries: workflowState.maxRetries,
    ...additionalParams,
  }

  return globalRoutingEngine.evaluateRouting(context)
}

// ========== PREDEFINED ROUTING SCENARIOS ==========

export const createContextualRouter = (
  scenario:
    | 'buyer_focus'
    | 'seller_focus'
    | 'speed_priority'
    | 'quality_priority'
) => {
  const scenarioRules: Record<string, RoutingRule[]> = {
    buyer_focus: [
      RoutingRules.BUYER_SPECIFIC_ROUTING,
      RoutingRules.FIRST_TIME_BUYER_EDUCATION,
      RoutingRules.HOT_MARKET_URGENCY,
    ],
    seller_focus: [
      RoutingRules.SELLER_SPECIFIC_ROUTING,
      RoutingRules.HOT_MARKET_URGENCY,
    ],
    speed_priority: [
      RoutingRules.OPTIMIZE_FOR_SPEED,
      RoutingRules.FALLBACK_ON_TIMEOUT,
    ],
    quality_priority: [
      RoutingRules.REGENERATE_LOW_QUALITY,
      RoutingRules.ADD_MISSING_CONTENT,
    ],
  }

  return createRoutingEngine(scenarioRules[scenario])
}
