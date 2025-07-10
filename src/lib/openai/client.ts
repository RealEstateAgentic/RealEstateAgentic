/**
 * OpenAI API Client for Real Estate Agentic Application
 *
 * This file provides a configured LangChain OpenAI client. It is designed as a
 * singleton to ensure a single, consistent client instance is used throughout the
 * application.
 */

import { ChatOpenAI } from '@langchain/openai'
import { type BaseMessage } from '@langchain/core/messages'
import { type Runnable } from '@langchain/core/runnables'
import { type StructuredToolInterface } from '@langchain/core/tools'

// ========== MODEL CONFIGURATION ==========

export const AI_MODELS = {
  DOCUMENT_GENERATION: { name: 'gpt-4-turbo-preview', temperature: 0.7 },
  ANALYSIS: { name: 'gpt-4-turbo-preview', temperature: 0.3 },
  QUICK_RESPONSE: { name: 'gpt-3.5-turbo', temperature: 0.5 },
} as const

// ========== CLIENT IMPLEMENTATION ==========

export interface OpenAIConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
}

class OpenAIClient {
  public readonly client: ChatOpenAI

  constructor(config: OpenAIConfig) {
    this.client = new ChatOpenAI({
      apiKey: config.apiKey,
      modelName: AI_MODELS.ANALYSIS.name, // Default model
      temperature: AI_MODELS.ANALYSIS.temperature,
      maxRetries: config.maxRetries,
      timeout: config.timeout,
      configuration: {
        baseURL: config.baseURL,
      },
    })
  }

  /**
   * Creates a new model instance with specific tools bound to it.
   * This is the primary way to interact with the model when tools are needed.
   */
  public withTools(
    tools: StructuredToolInterface[]
  ): Runnable<BaseMessage[], BaseMessage> {
    return this.client.bind({ tools })
  }
}

// ========== SINGLETON INSTANCE ==========

let openAIClientInstance: OpenAIClient | null = null

export const initializeOpenAI = (config: OpenAIConfig): OpenAIClient => {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required')
  }
  openAIClientInstance = new OpenAIClient(config)
  return openAIClientInstance
}

export const getOpenAIClient = (): OpenAIClient | null => {
  return openAIClientInstance
}

export const initializeFromEnv = (): OpenAIClient => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('API key not found in environment variables.')
  }

  const config: OpenAIConfig = {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: process.env.OPENAI_TIMEOUT
      ? parseInt(process.env.OPENAI_TIMEOUT, 10)
      : 120000, // Increased from 30000 to 120000 ms (2 minutes)
    maxRetries: process.env.OPENAI_MAX_RETRIES
      ? parseInt(process.env.OPENAI_MAX_RETRIES, 10)
      : 2, // Re-enable retries now that the process is more stable
  }

  return initializeOpenAI(config)
}

/**
 * Creates a standardized prompt string from various components.
 */
export const createPrompt = (
  instruction: string,
  context?: Record<string, any>,
  examples?: string[],
  constraints?: string[]
): string => {
  let prompt = `${instruction}\\n\\n`

  if (context) {
    prompt += `Context:\\n${JSON.stringify(context, null, 2)}\\n\\n`
  }

  if (examples && examples.length > 0) {
    prompt += `Examples:\\n${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\\n')}\\n\\n`
  }

  if (constraints && constraints.length > 0) {
    prompt += `Constraints:\\n${constraints.map((c, i) => `${i + 1}. ${c}`).join('\\n')}\\n\\n`
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

  return `${basePrompt}${roleContext}${jurisdictionContext}Always prioritize accuracy, legal compliance, and professional presentation. Include clear explanations for any technical terms or complex clauses.`
}
