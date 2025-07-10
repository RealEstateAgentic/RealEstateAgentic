/**
 * LangChain OpenAI Model Configuration
 *
 * Unified configuration system for OpenAI models in LangChain workflows.
 * Adapts the existing OpenAI client pattern to work with LangChain's ChatOpenAI.
 */

import { ChatOpenAI } from '@langchain/openai'
import type { ChatOpenAICallOptions } from '@langchain/openai'

// ========== CONFIGURATION TYPES ==========

export interface LangChainModelConfig {
  name: string
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  streaming?: boolean
  timeout?: number
  maxRetries?: number
}

export interface LangChainClientConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  defaultModel?: string
  temperature?: number
  maxTokens?: number
}

// ========== PRE-CONFIGURED MODELS ==========

export const LANGCHAIN_MODELS: Record<string, LangChainModelConfig> = {
  // Document generation - balanced creativity and structure
  DOCUMENT_GENERATION: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    streaming: true,
    timeout: 30000,
    maxRetries: 3,
  },

  // Analysis and strategy - focused on accuracy
  ANALYSIS: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.3,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: false,
    timeout: 30000,
    maxRetries: 3,
  },

  // Review and improvement - detail-oriented
  REVIEW: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 3000,
    temperature: 0.4,
    topP: 0.85,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,
    streaming: false,
    timeout: 30000,
    maxRetries: 3,
  },

  // Quick responses - fast and efficient
  QUICK_RESPONSE: {
    name: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.5,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: false,
    timeout: 15000,
    maxRetries: 2,
  },

  // Complex reasoning - maximum capability
  COMPLEX_REASONING: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 8000,
    temperature: 0.2,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: true,
    timeout: 60000,
    maxRetries: 3,
  },

  // Real-time streaming - optimized for streaming workflows
  STREAMING: {
    name: 'gpt-4-turbo-preview',
    maxTokens: 3000,
    temperature: 0.6,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    streaming: true,
    timeout: 45000,
    maxRetries: 2,
  },
}

// ========== MODEL FACTORY ==========

let defaultConfig: LangChainClientConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 30000,
  maxRetries: 3,
  defaultModel: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 4000,
}

/**
 * Create a configured ChatOpenAI instance
 */
export const createModel = (
  modelConfig: LangChainModelConfig,
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  const config = { ...defaultConfig, ...clientConfig }

  return new ChatOpenAI({
    openAIApiKey: config.apiKey,
    modelName: modelConfig.name,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    topP: modelConfig.topP,
    frequencyPenalty: modelConfig.frequencyPenalty,
    presencePenalty: modelConfig.presencePenalty,
    streaming: modelConfig.streaming,
    timeout: modelConfig.timeout,
    maxRetries: modelConfig.maxRetries,
  })
}

/**
 * Create a model by name from pre-configured models
 */
export const createModelByName = (
  modelName: keyof typeof LANGCHAIN_MODELS,
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  const modelConfig = LANGCHAIN_MODELS[modelName]
  if (!modelConfig) {
    throw new Error(`Model configuration not found: ${modelName}`)
  }
  return createModel(modelConfig, clientConfig)
}

/**
 * Create a streaming model optimized for real-time responses
 */
export const createStreamingModel = (
  modelConfig?: Partial<LangChainModelConfig>,
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  const config = {
    ...LANGCHAIN_MODELS.STREAMING,
    ...modelConfig,
    streaming: true, // Force streaming to true
  }
  return createModel(config, clientConfig)
}

/**
 * Create a model for document generation workflows
 */
export const createDocumentModel = (
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  return createModelByName('DOCUMENT_GENERATION', clientConfig)
}

/**
 * Create a model for analysis workflows
 */
export const createAnalysisModel = (
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  return createModelByName('ANALYSIS', clientConfig)
}

/**
 * Create a model for negotiation workflows
 */
export const createNegotiationModel = (
  clientConfig?: Partial<LangChainClientConfig>
): ChatOpenAI => {
  return createModelByName('COMPLEX_REASONING', clientConfig)
}

/**
 * Initialize default client configuration
 */
export const initializeModelConfig = (config: LangChainClientConfig): void => {
  defaultConfig = { ...defaultConfig, ...config }
}

/**
 * Get default configuration
 */
export const getDefaultConfig = (): LangChainClientConfig => {
  return { ...defaultConfig }
}

/**
 * Validate API key format
 */
export const validateAPIKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-') && apiKey.length > 20
}

/**
 * Check if configuration is valid
 */
export const isConfigValid = (
  config?: Partial<LangChainClientConfig>
): boolean => {
  const finalConfig = { ...defaultConfig, ...config }
  return validateAPIKey(finalConfig.apiKey)
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Initialize from environment variables
 */
export const initializeLangChainFromEnv = (): void => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const config: LangChainClientConfig = {
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

  initializeModelConfig(config)
}

/**
 * Create a system prompt for real estate workflows
 */
export const createRealEstateSystemPrompt = (
  userRole: 'agent' | 'buyer' | 'seller',
  workflowType: string,
  jurisdiction?: string
): string => {
  const basePrompt = `You are an expert real estate assistant specialized in ${workflowType} workflows. `

  const roleContext = {
    agent:
      'You are helping a real estate agent serve their clients with professional workflow execution.',
    buyer: 'You are helping a buyer navigate their property purchase workflow.',
    seller: 'You are helping a seller manage their property sale workflow.',
  }[userRole]

  const jurisdictionContext = jurisdiction
    ? `All workflows must comply with ${jurisdiction} real estate laws and regulations. `
    : 'Ensure all workflows follow standard real estate practices and include appropriate legal considerations. '

  return `${basePrompt}${roleContext} ${jurisdictionContext}Always prioritize accuracy, legal compliance, and professional execution. Provide clear explanations for any technical terms or complex processes.`
}

/**
 * Estimate token count for text (simplified approximation)
 */
export const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

/**
 * Check if text fits within model token limits
 */
export const isWithinTokenLimit = (
  text: string,
  modelConfig: LangChainModelConfig
): boolean => {
  const estimatedTokens = estimateTokens(text)
  return estimatedTokens <= modelConfig.maxTokens
}

/**
 * Split text into chunks that fit model token limits
 */
export const splitTextForModel = (
  text: string,
  modelConfig: LangChainModelConfig
): string[] => {
  const maxTokens = modelConfig.maxTokens
  const estimatedTokens = estimateTokens(text)

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

// ========== HEALTH CHECK ==========

/**
 * Perform health check on LangChain OpenAI integration
 */
export const performHealthCheck = async (
  clientConfig?: Partial<LangChainClientConfig>
): Promise<boolean> => {
  try {
    const model = createModelByName('QUICK_RESPONSE', clientConfig)
    const response = await model.invoke('Say "OK" if you can hear me.')
    return response.content.toString().toLowerCase().includes('ok')
  } catch (error) {
    console.error('LangChain OpenAI health check failed:', error)
    return false
  }
}

// ========== EXPORTS ==========

export { ChatOpenAI, type ChatOpenAICallOptions }
