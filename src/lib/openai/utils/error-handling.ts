/**
 * OpenAI Error Handling and Retry Logic
 *
 * Comprehensive error handling system for OpenAI API calls with:
 * - Exponential backoff retry strategy
 * - Circuit breaker pattern for service protection
 * - Rate limiting and quota management
 * - Graceful degradation and fallback mechanisms
 * - Detailed error categorization and reporting
 */

import type { OpenAI } from 'openai'

// ========== ERROR TYPES ==========

export interface OpenAIError {
  type: OpenAIErrorType
  message: string
  code?: string
  statusCode?: number
  retryable: boolean
  retryAfter?: number
  context?: Record<string, any>
  timestamp: Date
  attempts: number
}

export type OpenAIErrorType =
  | 'rate_limit'
  | 'quota_exceeded'
  | 'authentication'
  | 'invalid_request'
  | 'service_unavailable'
  | 'timeout'
  | 'network_error'
  | 'parsing_error'
  | 'token_limit'
  | 'content_filter'
  | 'model_unavailable'
  | 'unknown'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBase: number
  jitter: boolean
  retryableErrors: OpenAIErrorType[]
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  halfOpenMaxCalls: number
}

export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute: number
  requestsPerHour: number
  tokensPerHour: number
}

export interface ErrorHandlingConfig {
  retry: RetryConfig
  circuitBreaker: CircuitBreakerConfig
  rateLimit: RateLimitConfig
  enableFallbacks: boolean
  logErrors: boolean
  reportMetrics: boolean
}

// ========== DEFAULT CONFIGURATIONS ==========

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: [
    'rate_limit',
    'service_unavailable',
    'timeout',
    'network_error',
    'model_unavailable',
  ],
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  monitoringPeriod: 300000,
  halfOpenMaxCalls: 3,
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  requestsPerMinute: 60,
  tokensPerMinute: 90000,
  requestsPerHour: 3000,
  tokensPerHour: 250000,
}

export const DEFAULT_ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  retry: DEFAULT_RETRY_CONFIG,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_CONFIG,
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  enableFallbacks: true,
  logErrors: true,
  reportMetrics: true,
}

// ========== ERROR CLASSIFICATION ==========

export class OpenAIErrorClassifier {
  static classifyError(error: any): OpenAIError {
    const timestamp = new Date()
    let type: OpenAIErrorType = 'unknown'
    let retryable = false
    let retryAfter: number | undefined

    // Handle OpenAI SDK errors
    if (error?.status || error?.statusCode) {
      const statusCode = error.status || error.statusCode

      switch (statusCode) {
        case 429:
          type = 'rate_limit'
          retryable = true
          retryAfter = this.extractRetryAfter(error)
          break
        case 401:
          type = 'authentication'
          retryable = false
          break
        case 400:
          type = 'invalid_request'
          retryable = false
          break
        case 403:
          type = 'quota_exceeded'
          retryable = false
          break
        case 500:
        case 502:
        case 503:
        case 504:
          type = 'service_unavailable'
          retryable = true
          break
        default:
          type = 'unknown'
          retryable = statusCode >= 500
      }
    }

    // Handle specific error types
    if (error?.code) {
      switch (error.code) {
        case 'context_length_exceeded':
          type = 'token_limit'
          retryable = false
          break
        case 'content_filter':
          type = 'content_filter'
          retryable = false
          break
        case 'model_not_found':
          type = 'model_unavailable'
          retryable = true
          break
        case 'insufficient_quota':
          type = 'quota_exceeded'
          retryable = false
          break
      }
    }

    // Handle network errors
    if (error?.name === 'NetworkError' || error?.code === 'ECONNREFUSED') {
      type = 'network_error'
      retryable = true
    }

    // Handle timeout errors
    if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
      type = 'timeout'
      retryable = true
    }

    // Handle parsing errors
    if (error?.name === 'SyntaxError' || error?.message?.includes('JSON')) {
      type = 'parsing_error'
      retryable = false
    }

    return {
      type,
      message: error?.message || 'Unknown error occurred',
      code: error?.code,
      statusCode: error?.status || error?.statusCode,
      retryable,
      retryAfter,
      context: {
        originalError: error,
        userAgent: 'AIgentPro/1.0',
      },
      timestamp,
      attempts: 1,
    }
  }

  private static extractRetryAfter(error: any): number | undefined {
    // Check for Retry-After header
    if (error?.headers?.['retry-after']) {
      const retryAfter = Number.parseInt(error.headers['retry-after'], 10)
      return Number.isNaN(retryAfter) ? undefined : retryAfter * 1000
    }

    // Check for rate limit reset time
    if (error?.headers?.['x-ratelimit-reset']) {
      const resetTime = Number.parseInt(error.headers['x-ratelimit-reset'], 10)
      return Number.isNaN(resetTime)
        ? undefined
        : Math.max(0, resetTime - Date.now())
    }

    return undefined
  }
}

// ========== RETRY MECHANISM ==========

export class RetryManager {
  private config: RetryConfig

  constructor(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = config
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'OpenAI API call'
  ): Promise<T> {
    let lastError: OpenAIError | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        const result = await operation()

        // Log successful retry recovery
        if (attempt > 1) {
          console.log(`${context} succeeded on attempt ${attempt}`)
        }

        return result
      } catch (error) {
        const classifiedError = OpenAIErrorClassifier.classifyError(error)
        classifiedError.attempts = attempt
        lastError = classifiedError

        // Check if we should retry
        if (
          attempt > this.config.maxRetries ||
          !this.shouldRetry(classifiedError)
        ) {
          throw classifiedError
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, classifiedError)

        console.warn(
          `${context} failed (attempt ${attempt}/${this.config.maxRetries + 1}): ${classifiedError.message}. Retrying in ${delay}ms...`
        )

        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private shouldRetry(error: OpenAIError): boolean {
    return error.retryable && this.config.retryableErrors.includes(error.type)
  }

  private calculateDelay(attempt: number, error: OpenAIError): number {
    // Use retry-after header if available
    if (error.retryAfter) {
      return Math.min(error.retryAfter, this.config.maxDelay)
    }

    // Calculate exponential backoff
    let delay =
      this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt - 1)

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay += Math.random() * delay * 0.1
    }

    return Math.min(delay, this.config.maxDelay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ========== CIRCUIT BREAKER ==========

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private halfOpenCalls = 0
  private config: CircuitBreakerConfig

  constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.config = config
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN
        this.halfOpenCalls = 0
        console.log('Circuit breaker moving to HALF_OPEN state')
      } else {
        throw new Error('Circuit breaker is OPEN - requests are being rejected')
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        throw new Error('Circuit breaker HALF_OPEN limit reached')
      }
      this.halfOpenCalls++
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.successCount++

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.halfOpenMaxCalls) {
        this.state = CircuitBreakerState.CLOSED
        this.failureCount = 0
        this.successCount = 0
        console.log('Circuit breaker moving to CLOSED state')
      }
    } else {
      this.failureCount = 0
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN
      console.log('Circuit breaker moving to OPEN state from HALF_OPEN')
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
      console.log(
        'Circuit breaker moving to OPEN state due to failure threshold'
      )
    }
  }

  getState(): CircuitBreakerState {
    return this.state
  }

  getMetrics(): {
    state: CircuitBreakerState
    failureCount: number
    successCount: number
    lastFailureTime: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// ========== RATE LIMITER ==========

export class RateLimiter {
  private requestsPerMinute: number[] = []
  private tokensPerMinute: number[] = []
  private requestsPerHour: number[] = []
  private tokensPerHour: number[] = []
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG) {
    this.config = config
  }

  async checkRateLimit(estimatedTokens: number): Promise<void> {
    const now = Date.now()

    // Clean old entries
    this.cleanOldEntries(now)

    // Check minute limits
    if (this.requestsPerMinute.length >= this.config.requestsPerMinute) {
      throw new Error('Rate limit exceeded: too many requests per minute')
    }

    const minuteTokens = this.tokensPerMinute.reduce(
      (sum, tokens) => sum + tokens,
      0
    )
    if (minuteTokens + estimatedTokens > this.config.tokensPerMinute) {
      throw new Error('Rate limit exceeded: too many tokens per minute')
    }

    // Check hour limits
    if (this.requestsPerHour.length >= this.config.requestsPerHour) {
      const oldestRequest = Math.min(...this.requestsPerHour)
      const waitTime = 3600000 - (now - oldestRequest)
      throw new Error(
        `Rate limit exceeded: too many requests per hour. Wait ${Math.ceil(waitTime / 1000)} seconds`
      )
    }

    const hourTokens = this.tokensPerHour.reduce(
      (sum, tokens) => sum + tokens,
      0
    )
    if (hourTokens + estimatedTokens > this.config.tokensPerHour) {
      throw new Error('Rate limit exceeded: too many tokens per hour')
    }
  }

  recordRequest(actualTokens: number): void {
    const now = Date.now()

    this.requestsPerMinute.push(now)
    this.tokensPerMinute.push(actualTokens)
    this.requestsPerHour.push(now)
    this.tokensPerHour.push(actualTokens)
  }

  private cleanOldEntries(now: number): void {
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - 3600000

    // Clean minute entries
    this.requestsPerMinute = this.requestsPerMinute.filter(
      time => time > oneMinuteAgo
    )
    this.tokensPerMinute = this.tokensPerMinute.filter(
      (_, index) => this.requestsPerMinute[index] !== undefined
    )

    // Clean hour entries
    this.requestsPerHour = this.requestsPerHour.filter(
      time => time > oneHourAgo
    )
    this.tokensPerHour = this.tokensPerHour.filter(
      (_, index) => this.requestsPerHour[index] !== undefined
    )
  }

  getUsage(): {
    requestsPerMinute: number
    tokensPerMinute: number
    requestsPerHour: number
    tokensPerHour: number
  } {
    const now = Date.now()
    this.cleanOldEntries(now)

    return {
      requestsPerMinute: this.requestsPerMinute.length,
      tokensPerMinute: this.tokensPerMinute.reduce(
        (sum, tokens) => sum + tokens,
        0
      ),
      requestsPerHour: this.requestsPerHour.length,
      tokensPerHour: this.tokensPerHour.reduce(
        (sum, tokens) => sum + tokens,
        0
      ),
    }
  }
}

// ========== MAIN ERROR HANDLER ==========

export class OpenAIErrorHandler {
  private retryManager: RetryManager
  private circuitBreaker: CircuitBreaker
  private rateLimiter: RateLimiter
  private config: ErrorHandlingConfig
  private metrics: Map<string, number> = new Map()

  constructor(config: ErrorHandlingConfig = DEFAULT_ERROR_HANDLING_CONFIG) {
    this.config = config
    this.retryManager = new RetryManager(config.retry)
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker)
    this.rateLimiter = new RateLimiter(config.rateLimit)
  }

  async executeWithProtection<T>(
    operation: () => Promise<T>,
    context: string = 'OpenAI API call',
    estimatedTokens: number = 1000
  ): Promise<T> {
    // Check rate limits
    await this.rateLimiter.checkRateLimit(estimatedTokens)

    // Execute with circuit breaker and retry logic
    const result = await this.circuitBreaker.execute(async () => {
      return await this.retryManager.executeWithRetry(operation, context)
    })

    // Record successful request
    this.rateLimiter.recordRequest(estimatedTokens)
    this.recordMetric('success')

    return result
  }

  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = 'OpenAI API call',
    estimatedTokens: number = 1000
  ): Promise<T> {
    if (!this.config.enableFallbacks) {
      return this.executeWithProtection(
        primaryOperation,
        context,
        estimatedTokens
      )
    }

    try {
      return await this.executeWithProtection(
        primaryOperation,
        context,
        estimatedTokens
      )
    } catch (error) {
      console.warn(`Primary operation failed, attempting fallback: ${error}`)
      this.recordMetric('fallback_used')

      try {
        return await fallbackOperation()
      } catch (fallbackError) {
        console.error(`Fallback operation also failed: ${fallbackError}`)
        this.recordMetric('fallback_failed')
        throw error // Throw original error
      }
    }
  }

  private recordMetric(metric: string): void {
    if (!this.config.reportMetrics) return

    const current = this.metrics.get(metric) || 0
    this.metrics.set(metric, current + 1)
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics()
  }

  getRateLimitUsage() {
    return this.rateLimiter.getUsage()
  }

  reset(): void {
    this.metrics.clear()
    this.rateLimiter = new RateLimiter(this.config.rateLimit)
  }
}

// ========== FALLBACK STRATEGIES ==========

export class FallbackStrategies {
  /**
   * Fallback for text generation - use simpler model or cached response
   */
  static async textGenerationFallback(
    originalPrompt: string,
    context: string
  ): Promise<string> {
    // Try to use a cached response or template
    const templateResponse = this.getTemplateResponse(context)
    if (templateResponse) {
      return templateResponse
    }

    // Return a minimal but functional response
    return `Unable to generate custom content at this time. Please try again later or contact support for assistance with: ${context}`
  }

  /**
   * Fallback for JSON generation - return minimal structure
   */
  static async jsonGenerationFallback<T>(
    schema: any,
    context: string
  ): Promise<T> {
    // Return minimal valid JSON structure
    if (schema.type === 'object' && schema.properties) {
      const result: any = {}

      for (const [key, prop] of Object.entries(schema.properties as any)) {
        if (prop.type === 'string') {
          result[key] = `Generated ${key}`
        } else if (prop.type === 'number') {
          result[key] = 0
        } else if (prop.type === 'boolean') {
          result[key] = false
        } else if (prop.type === 'array') {
          result[key] = []
        } else {
          result[key] = null
        }
      }

      return result as T
    }

    return {} as T
  }

  private static getTemplateResponse(context: string): string | null {
    const templates: Record<string, string> = {
      cover_letter:
        'Thank you for considering our offer. We are excited about the opportunity to purchase your property and believe our offer represents fair market value. We are committed to a smooth closing process and look forward to hearing from you.',
      market_analysis:
        'Based on current market conditions, the property is positioned competitively. Market trends suggest stable values with normal transaction timelines.',
      negotiation_strategy:
        'Recommended approach: Present a fair offer based on comparable sales, maintain flexibility on closing timeline, and be prepared to negotiate on price and terms.',
      offer_analysis:
        'The offer appears to be within market range. Key considerations include financing terms, closing timeline, and contingency structure.',
    }

    for (const [key, template] of Object.entries(templates)) {
      if (context.toLowerCase().includes(key)) {
        return template
      }
    }

    return null
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Estimate token count for a text string
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Create a protected OpenAI client wrapper
 */
export function createProtectedClient(
  client: OpenAI,
  config?: Partial<ErrorHandlingConfig>
): {
  generateText: (
    prompt: string,
    model: string,
    options?: any
  ) => Promise<string>
  generateJSON: <T>(
    prompt: string,
    schema: any,
    model: string,
    options?: any
  ) => Promise<T>
  errorHandler: OpenAIErrorHandler
} {
  const errorHandler = new OpenAIErrorHandler({
    ...DEFAULT_ERROR_HANDLING_CONFIG,
    ...config,
  })

  return {
    generateText: async (
      prompt: string,
      model: string,
      options?: any
    ): Promise<string> => {
      const estimatedTokens = estimateTokenCount(prompt) + 500 // Add response estimate

      return errorHandler.executeWithFallback(
        async () => {
          const response = await client.chat.completions.create({
            model,
            messages: [
              {
                role: 'system',
                content:
                  options?.systemPrompt || 'You are a helpful assistant.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: options?.maxTokens || 2000,
            temperature: options?.temperature || 0.7,
          })

          return response.choices[0]?.message?.content || ''
        },
        async () => {
          return FallbackStrategies.textGenerationFallback(
            prompt,
            'text generation'
          )
        },
        'Text generation',
        estimatedTokens
      )
    },

    generateJSON: async <T>(
      prompt: string,
      schema: any,
      model: string,
      options?: any
    ): Promise<T> => {
      const estimatedTokens = estimateTokenCount(prompt) + 500

      return errorHandler.executeWithFallback(
        async () => {
          const response = await client.chat.completions.create({
            model,
            messages: [
              {
                role: 'system',
                content:
                  options?.systemPrompt ||
                  'You are a helpful assistant. Respond with valid JSON only.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: options?.maxTokens || 2000,
            temperature: options?.temperature || 0.7,
          })

          const content = response.choices[0]?.message?.content || '{}'
          return JSON.parse(content)
        },
        async () => {
          return FallbackStrategies.jsonGenerationFallback<T>(
            schema,
            'JSON generation'
          )
        },
        'JSON generation',
        estimatedTokens
      )
    },

    errorHandler,
  }
}

// ========== HEALTH CHECK ==========

export async function performHealthCheck(client: OpenAI): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  errors: string[]
}> {
  const startTime = Date.now()
  const errors: string[] = []

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "OK" if you can hear me.' }],
      max_tokens: 10,
    })

    const latency = Date.now() - startTime

    if (response.choices[0]?.message?.content?.toLowerCase().includes('ok')) {
      return { status: 'healthy', latency, errors }
    } else {
      errors.push('Unexpected response from OpenAI')
      return { status: 'degraded', latency, errors }
    }
  } catch (error) {
    const latency = Date.now() - startTime
    errors.push(`Health check failed: ${error}`)
    return { status: 'unhealthy', latency, errors }
  }
}

// ========== EXPORTS ==========

export {
  OpenAIErrorHandler,
  RetryManager,
  CircuitBreaker,
  RateLimiter,
  OpenAIErrorClassifier,
  FallbackStrategies,
  CircuitBreakerState,
}

export default OpenAIErrorHandler
