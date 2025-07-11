/**
 * Groq API Client for Real Estate Agentic Application
 *
 * Provides a configured Groq client for document generation, analysis,
 * and AI-powered features in the offer preparation and negotiation system.
 */

import Groq from 'groq-sdk'
import type {
  ChatCompletionMessageParam,
  ChatCompletion,
} from 'groq-sdk/resources/chat/completions'

// ========== CONFIGURATION ==========

export interface GroqConfig {
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
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

// Pre-configured models for different use cases
export const AI_MODELS: Record<string, AIModelConfig> = {
  // Document generation - balanced creativity and structure
  DOCUMENT_GENERATION: {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },

  // Analysis and strategy - focused on accuracy
  ANALYSIS: {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 2000,
    temperature: 0.3,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },

  // Review and improvement - detail-oriented
  REVIEW: {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 3000,
    temperature: 0.4,
    topP: 0.85,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,
  },

  // Quick responses - fast and efficient
  QUICK_RESPONSE: {
    name: 'llama-3.1-8b-instant',
    maxTokens: 1000,
    temperature: 0.5,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },

  // Complex reasoning - maximum capability
  COMPLEX_REASONING: {
    name: 'deepseek-r1-distill-llama-70b',
    maxTokens: 4000,
    temperature: 0.6,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
}

// ========== CLIENT CONFIGURATION ==========

class GroqClient {
  private client: Groq
  private config: GroqConfig

  constructor(config: GroqConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      defaultModel: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    }

    this.client = new Groq({
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
      responseFormat?: any
    } = {}
  ): Promise<ChatCompletion> {
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
        response_format: options.responseFormat,
      })

      return completion
    } catch (error) {
      console.error('Groq API Error:', error)
      throw new Error(
        `Groq API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      throw new Error('No content received from Groq')
    }

    try {
      return JSON.parse(content) as T
    } catch (error) {
      console.error('Failed to parse JSON response:', content)
      throw new Error('Invalid JSON response from Groq')
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
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.generateText('Hello', AI_MODELS.QUICK_RESPONSE)
      return true
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  /**
   * Get model information
   */
  getModelInfo(modelName: string) {
    const model = Object.values(AI_MODELS).find(m => m.name === modelName)
    return model || AI_MODELS.DOCUMENT_GENERATION
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return Object.entries(AI_MODELS).map(([key, config]) => ({
      key,
      name: config.name,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    }))
  }
}

// ========== SINGLETON INSTANCE ==========

let groqClient: GroqClient | null = null

export const initializeGroq = (config: GroqConfig): GroqClient => {
  groqClient = new GroqClient(config)
  return groqClient
}

export const getGroqClient = (): GroqClient => {
  if (!groqClient) {
    throw new Error('Groq client not initialized. Call initializeGroq first.')
  }
  return groqClient
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Initialize Groq client from environment variables
 */
export const initializeFromEnv = (): GroqClient => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required')
  }

  const config: GroqConfig = {
    apiKey,
    baseURL: process.env.GROQ_BASE_URL,
    timeout: process.env.GROQ_TIMEOUT
      ? Number.parseInt(process.env.GROQ_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.GROQ_MAX_RETRIES
      ? Number.parseInt(process.env.GROQ_MAX_RETRIES, 10)
      : 3,
    defaultModel: process.env.GROQ_DEFAULT_MODEL || 'llama-3.3-70b-versatile',
    temperature: process.env.GROQ_TEMPERATURE
      ? Number.parseFloat(process.env.GROQ_TEMPERATURE)
      : 0.7,
    maxTokens: process.env.GROQ_MAX_TOKENS
      ? Number.parseInt(process.env.GROQ_MAX_TOKENS, 10)
      : 4000,
  }

  return initializeGroq(config)
}

/**
 * Test the Groq connection
 */
export const testGroqConnection = async (): Promise<boolean> => {
  try {
    const client = getGroqClient()
    return await client.validateApiKey()
  } catch (error) {
    console.error('Groq connection test failed:', error)
    return false
  }
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
 * Helper function to estimate token count (approximate)
 */
export const estimateTokenCount = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

// ========== EXPORTS ==========

export { GroqClient }
export default {
  initializeGroq,
  getGroqClient,
  initializeFromEnv,
  testGroqConnection,
}
