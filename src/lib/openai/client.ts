/**
 * OpenAI API Client for Real Estate Agentic Application
 *
 * Provides a configured OpenAI client for document generation, analysis,
 * and AI-powered features in the offer preparation and negotiation system.
 */

import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'

// ========== CONFIGURATION ==========

export interface OpenAIConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  defaultModel?: string
  temperature?: number
  maxTokens?: number
}

export interface AIModelConfig {
  name: string
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// Pre-configured models for different use cases
export const AI_MODELS: Record<string, AIModelConfig> = {
  // Document generation - balanced creativity and structure
  DOCUMENT_GENERATION: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },

  // Analysis and strategy - focused on accuracy
  ANALYSIS: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.3,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },

  // Review and improvement - detail-oriented
  REVIEW: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 3000,
    temperature: 0.4,
    topP: 0.85,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,
  },

  // Quick responses - fast and efficient
  QUICK_RESPONSE: {
    name: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.5,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },

  // Complex reasoning - maximum capability
  COMPLEX_REASONING: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.2,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
}

// ========== CLIENT CONFIGURATION ==========

class OpenAIClient {
  private client: OpenAI
  private config: OpenAIConfig

  constructor(config: OpenAIConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      defaultModel: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      dangerouslyAllowBrowser: true, // Allow browser usage for Electron renderer process
    })
  }

  /**
   * Generate a chat completion using the specified model configuration
   */
  async generateCompletion(
    messages: ChatCompletionMessageParam[],
    modelConfig: AIModelConfig = AI_MODELS.DOCUMENT_GENERATION,
    options: {
      systemPrompt?: string
      userContext?: Record<string, any>
      tools?: any[]
      toolChoice?: any
      responseFormat?: any
    } = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      // Add system prompt if provided
      const finalMessages: ChatCompletionMessageParam[] = options.systemPrompt
        ? [{ role: 'system', content: options.systemPrompt }, ...messages]
        : messages

      // Add user context if provided
      if (options.userContext) {
        const contextMessage = `Context: ${JSON.stringify(options.userContext, null, 2)}`
        finalMessages.push({ role: 'user', content: contextMessage })
      }

      const completion = await this.client.chat.completions.create({
        model: modelConfig.name,
        messages: finalMessages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty,
        tools: options.tools,
        tool_choice: options.toolChoice,
        response_format: options.responseFormat,
      })

      return completion
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw new Error(
        `OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate text completion with simplified interface
   */
  async generateText(
    prompt: string,
    modelConfig: AIModelConfig = AI_MODELS.DOCUMENT_GENERATION,
    options: {
      systemPrompt?: string
      userContext?: Record<string, any>
    } = {}
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt },
    ]

    const completion = await this.generateCompletion(
      messages,
      modelConfig,
      options
    )
    return completion.choices[0]?.message?.content || ''
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(
    prompt: string,
    schema: any,
    modelConfig: AIModelConfig = AI_MODELS.ANALYSIS,
    options: {
      systemPrompt?: string
      userContext?: Record<string, any>
    } = {}
  ): Promise<T> {
    const completion = await this.generateCompletion(
      [{ role: 'user', content: prompt }],
      modelConfig,
      {
        ...options,
        responseFormat: { type: 'json_object' },
      }
    )

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    try {
      return JSON.parse(content) as T
    } catch (error) {
      console.error('Failed to parse JSON response:', content)
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  /**
   * Generate text with conversation history
   */
  async generateWithHistory(
    messages: ChatCompletionMessageParam[],
    modelConfig: AIModelConfig = AI_MODELS.DOCUMENT_GENERATION,
    options: {
      systemPrompt?: string
      userContext?: Record<string, any>
    } = {}
  ): Promise<string> {
    const completion = await this.generateCompletion(
      messages,
      modelConfig,
      options
    )
    return completion.choices[0]?.message?.content || ''
  }

  /**
   * Get token count estimation (simplified)
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if text exceeds model token limit
   */
  isWithinTokenLimit(text: string, modelConfig: AIModelConfig): boolean {
    const estimatedTokens = this.estimateTokens(text)
    return estimatedTokens <= modelConfig.maxTokens
  }

  /**
   * Split text into chunks that fit within token limits
   */
  splitTextForModel(text: string, modelConfig: AIModelConfig): string[] {
    const maxTokens = modelConfig.maxTokens
    const estimatedTokens = this.estimateTokens(text)

    if (estimatedTokens <= maxTokens) {
      return [text]
    }

    const chunks: string[] = []
    const maxChunkLength = maxTokens * 4 // Convert tokens back to characters

    let currentIndex = 0
    while (currentIndex < text.length) {
      const chunk = text.substring(currentIndex, currentIndex + maxChunkLength)
      chunks.push(chunk)
      currentIndex += maxChunkLength
    }

    return chunks
  }

  /**
   * Health check for OpenAI API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await this.generateText(
        'Say "OK" if you can hear me.',
        AI_MODELS.QUICK_RESPONSE
      )
      return completion.toLowerCase().includes('ok')
    } catch (error) {
      console.error('OpenAI health check failed:', error)
      return false
    }
  }
}

// ========== SINGLETON INSTANCE ==========

let openAIClient: OpenAIClient | null = null

export const initializeOpenAI = (config: OpenAIConfig): OpenAIClient => {
  openAIClient = new OpenAIClient(config)
  return openAIClient
}

export const getOpenAIClient = (): OpenAIClient => {
  if (!openAIClient) {
    throw new Error(
      'OpenAI client not initialized. Call initializeOpenAI first.'
    )
  }
  return openAIClient
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Initialize OpenAI client from environment variables
 */
export const initializeFromEnv = (): OpenAIClient => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const config: OpenAIConfig = {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: process.env.OPENAI_TIMEOUT
      ? Number.parseInt(process.env.OPENAI_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.OPENAI_MAX_RETRIES
      ? Number.parseInt(process.env.OPENAI_MAX_RETRIES, 10)
      : 3,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4-turbo-preview',
    temperature: process.env.OPENAI_TEMPERATURE
      ? Number.parseFloat(process.env.OPENAI_TEMPERATURE)
      : 0.7,
    maxTokens: process.env.OPENAI_MAX_TOKENS
      ? Number.parseInt(process.env.OPENAI_MAX_TOKENS, 10)
      : 4000,
  }

  return initializeOpenAI(config)
}

/**
 * Create a prompt with consistent formatting
 */
export const createPrompt = (
  instruction: string,
  context?: Record<string, any>,
  examples?: string[],
  constraints?: string[]
): string => {
  let prompt = `${instruction}\n\n`

  if (context) {
    prompt += `Context:\n${JSON.stringify(context, null, 2)}\n\n`
  }

  if (examples && examples.length > 0) {
    prompt += `Examples:\n${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}\n\n`
  }

  if (constraints && constraints.length > 0) {
    prompt += `Constraints:\n${constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }

  return prompt.trim()
}

/**
 * Create a system prompt for real estate document generation
 */
export const createRealEstateSystemPrompt = (
  userRole: 'agent' | 'buyer' | 'seller',
  documentType: string,
  jurisdiction?: string
): string => {
  const basePrompt = `You are an expert real estate assistant specialized in ${documentType} documents. `

  const roleContext = {
    agent:
      'You are helping a real estate agent prepare professional documents for their clients.',
    buyer:
      'You are helping a buyer prepare documents for their property purchase.',
    seller:
      'You are helping a seller prepare documents for their property sale.',
  }[userRole]

  const jurisdictionContext = jurisdiction
    ? `All documents must comply with ${jurisdiction} real estate laws and regulations. `
    : 'Ensure all documents follow standard real estate practices and include appropriate legal disclaimers. '

  return `${basePrompt}${roleContext} ${jurisdictionContext}Always prioritize accuracy, legal compliance, and professional presentation. Include clear explanations for any technical terms or complex clauses.`
}

/**
 * Validate API key format
 */
export const validateAPIKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-') && apiKey.length > 20
}

/**
 * Error handling utilities
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public type?: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export const handleOpenAIError = (error: any): never => {
  if (error.status === 401) {
    throw new OpenAIError('Invalid API key', 401, 'authentication_error', error)
  } else if (error.status === 429) {
    throw new OpenAIError('Rate limit exceeded', 429, 'rate_limit_error', error)
  } else if (error.status === 500) {
    throw new OpenAIError('OpenAI server error', 500, 'server_error', error)
  } else {
    throw new OpenAIError(
      `OpenAI API error: ${error.message || 'Unknown error'}`,
      error.status,
      'api_error',
      error
    )
  }
}

// ========== EXPORT ==========

export { OpenAIClient, type ChatCompletionMessageParam }
export default OpenAIClient
