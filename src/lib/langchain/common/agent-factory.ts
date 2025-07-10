/**
 * Centralized Agent Factory for LangChain Workflows
 *
 * Provides a unified way to create and configure LangChain agents
 * with consistent patterns across all workflows.
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { Tool } from '@langchain/core/tools'
import { BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'

import {
  createModelByName,
  createModel,
  createRealEstateSystemPrompt,
  LANGCHAIN_MODELS,
  type LangChainModelConfig,
  type LangChainClientConfig,
} from './model-config'

import type {
  BaseAgentState,
  BaseWorkflowConfig,
  AgentExecutionContext,
  AgentExecutionResult,
  BaseWorkflowContext,
  StreamingCallback,
} from '../types'

// ========== AGENT FACTORY TYPES ==========

/**
 * Agent configuration options
 */
export interface AgentFactoryConfig {
  name: string
  description: string
  model: ChatOpenAI | string
  tools: Tool[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  streaming?: boolean
  timeout?: number
  maxRetries?: number
  memory?: boolean
  callbacks?: StreamingCallback[]
}

/**
 * Agent factory result
 */
export interface AgentFactoryResult {
  agent: AgentExecutor
  config: AgentFactoryConfig
  metadata: {
    createdAt: Date
    modelUsed: string
    toolsCount: number
    hasMemory: boolean
  }
}

/**
 * Agent execution options
 */
export interface AgentExecutionOptions {
  input: string | BaseMessage[]
  context?: BaseWorkflowContext
  config?: Partial<BaseWorkflowConfig>
  streaming?: boolean
  callbacks?: StreamingCallback[]
  maxIterations?: number
  returnIntermediateSteps?: boolean
}

// ========== AGENT FACTORY FUNCTIONS ==========

const defaultConfig: Partial<AgentFactoryConfig> = {
  temperature: 0.7,
  maxTokens: 4000,
  streaming: false,
  timeout: 30000,
  maxRetries: 3,
  memory: true,
}

/**
 * Create a general-purpose agent with custom configuration
 */
export const createAgent = async (
  config: AgentFactoryConfig
): Promise<AgentFactoryResult> => {
  const finalConfig = { ...defaultConfig, ...config }

  // Get or create model
  const model =
    typeof finalConfig.model === 'string'
      ? createModelByName(finalConfig.model as keyof typeof LANGCHAIN_MODELS)
      : (finalConfig.model as ChatOpenAI)

  // Create system prompt
  const systemPrompt =
    finalConfig.systemPrompt ||
    `You are ${finalConfig.name}. ${finalConfig.description}`

  // Create prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ])

  // Create agent
  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools: finalConfig.tools,
    prompt,
  })

  // Create agent executor
  const executor = new AgentExecutor({
    agent,
    tools: finalConfig.tools,
    maxIterations: 10,
    returnIntermediateSteps: true,
    handleParsingErrors: true,
  })

  return {
    agent: executor,
    config: finalConfig,
    metadata: {
      createdAt: new Date(),
      modelUsed: model.modelName,
      toolsCount: finalConfig.tools.length,
      hasMemory: finalConfig.memory || false,
    },
  }
}

/**
 * Create a negotiation strategy agent
 */
export const createNegotiationAgent = async (
  tools: Tool[],
  options?: Partial<AgentFactoryConfig>
): Promise<AgentFactoryResult> => {
  const config: AgentFactoryConfig = {
    name: 'Negotiation Strategy Agent',
    description: 'Expert in real estate negotiation strategy and tactics',
    model: 'COMPLEX_REASONING',
    tools,
    systemPrompt: createRealEstateSystemPrompt(
      'agent',
      'negotiation strategy',
      options?.systemPrompt
    ),
    temperature: 0.3,
    maxTokens: 8000,
    streaming: true,
    ...options,
  }

  return createAgent(config)
}

/**
 * Create an offer analysis agent
 */
export const createOfferAnalysisAgent = async (
  tools: Tool[],
  options?: Partial<AgentFactoryConfig>
): Promise<AgentFactoryResult> => {
  const config: AgentFactoryConfig = {
    name: 'Offer Analysis Agent',
    description: 'Expert in analyzing real estate offers and market conditions',
    model: 'ANALYSIS',
    tools,
    systemPrompt: createRealEstateSystemPrompt(
      'agent',
      'offer analysis',
      options?.systemPrompt
    ),
    temperature: 0.2,
    maxTokens: 4000,
    streaming: false,
    ...options,
  }

  return createAgent(config)
}

/**
 * Create a document generation agent
 */
export const createDocumentGenerationAgent = async (
  tools: Tool[],
  options?: Partial<AgentFactoryConfig>
): Promise<AgentFactoryResult> => {
  const config: AgentFactoryConfig = {
    name: 'Document Generation Agent',
    description: 'Expert in generating professional real estate documents',
    model: 'DOCUMENT_GENERATION',
    tools,
    systemPrompt: createRealEstateSystemPrompt(
      'agent',
      'document generation',
      options?.systemPrompt
    ),
    temperature: 0.7,
    maxTokens: 6000,
    streaming: true,
    ...options,
  }

  return createAgent(config)
}

/**
 * Create a market analysis agent
 */
export const createMarketAnalysisAgent = async (
  tools: Tool[],
  options?: Partial<AgentFactoryConfig>
): Promise<AgentFactoryResult> => {
  const config: AgentFactoryConfig = {
    name: 'Market Analysis Agent',
    description: 'Expert in real estate market analysis and trends',
    model: 'ANALYSIS',
    tools,
    systemPrompt: createRealEstateSystemPrompt(
      'agent',
      'market analysis',
      options?.systemPrompt
    ),
    temperature: 0.4,
    maxTokens: 5000,
    streaming: false,
    ...options,
  }

  return createAgent(config)
}

/**
 * Execute an agent with consistent error handling and logging
 */
export const executeAgent = async (
  agent: AgentExecutor,
  options: AgentExecutionOptions
): Promise<AgentExecutionResult> => {
  const startTime = Date.now()
  const workflowId = options.context?.workflowId || `execution-${Date.now()}`

  try {
    // Prepare input
    const input = Array.isArray(options.input)
      ? options.input
      : [{ role: 'human', content: options.input }]

    // Execute agent
    const result = await agent.invoke({
      input:
        typeof options.input === 'string'
          ? options.input
          : options.input[0].content,
      chat_history: Array.isArray(options.input)
        ? options.input.slice(0, -1)
        : [],
    })

    const endTime = Date.now()
    const executionTime = endTime - startTime

    return {
      workflowId,
      status: 'success',
      result: result.output,
      messages: [
        ...(Array.isArray(options.input) ? options.input : []),
        { role: 'assistant', content: result.output },
      ],
      toolCalls: result.intermediateSteps || [],
      finalState: {
        messages: [],
        tools: agent.tools,
        model: agent.agent.llm as ChatOpenAI,
        metadata: {
          executionTime,
          intermediateSteps: result.intermediateSteps?.length || 0,
        },
      },
      metadata: {
        executionTime,
        tokensUsed: estimateTokens(result.output),
        modelUsed: (agent.agent.llm as ChatOpenAI).modelName,
      },
    }
  } catch (error) {
    const endTime = Date.now()
    const executionTime = endTime - startTime

    return {
      workflowId,
      status: 'failed',
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: Array.isArray(options.input) ? options.input : [],
      toolCalls: [],
      finalState: {
        messages: [],
        tools: agent.tools,
        model: agent.agent.llm as ChatOpenAI,
        metadata: {
          executionTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      metadata: {
        executionTime,
        tokensUsed: 0,
        modelUsed: (agent.agent.llm as ChatOpenAI).modelName,
      },
    }
  }
}

/**
 * Create an agent with streaming support
 */
export const createStreamingAgent = async (
  config: AgentFactoryConfig,
  callback: StreamingCallback
): Promise<AgentFactoryResult> => {
  const streamingConfig = {
    ...config,
    streaming: true,
    callbacks: [...(config.callbacks || []), callback],
  }

  return createAgent(streamingConfig)
}

/**
 * Validate agent configuration
 */
export const validateAgentConfig = (config: AgentFactoryConfig): boolean => {
  if (!config.name || !config.description) {
    return false
  }

  if (!config.model) {
    return false
  }

  if (!config.tools || config.tools.length === 0) {
    return false
  }

  return true
}

/**
 * Get recommended configuration for workflow type
 */
export const getRecommendedConfig = (
  workflowType: string
): Partial<AgentFactoryConfig> => {
  const configs = {
    negotiation: {
      model: 'COMPLEX_REASONING',
      temperature: 0.3,
      maxTokens: 8000,
      streaming: true,
    },
    analysis: {
      model: 'ANALYSIS',
      temperature: 0.2,
      maxTokens: 4000,
      streaming: false,
    },
    document: {
      model: 'DOCUMENT_GENERATION',
      temperature: 0.7,
      maxTokens: 6000,
      streaming: true,
    },
    market: {
      model: 'ANALYSIS',
      temperature: 0.4,
      maxTokens: 5000,
      streaming: false,
    },
  }

  return configs[workflowType] || {}
}

/**
 * Estimate token usage (simplified)
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4)
}

/**
 * Create batch of agents for parallel execution
 */
export const createAgentBatch = async (
  configs: AgentFactoryConfig[]
): Promise<AgentFactoryResult[]> => {
  const results = await Promise.all(configs.map(config => createAgent(config)))

  return results
}

/**
 * Health check for agent factory
 */
export const performAgentHealthCheck = async (): Promise<boolean> => {
  try {
    // Create a simple test agent
    const testAgent = await createAgent({
      name: 'Test Agent',
      description: 'Simple test agent for health check',
      model: 'QUICK_RESPONSE',
      tools: [],
      systemPrompt: 'You are a test agent. Respond with "OK" to any input.',
    })

    // Test execution
    const result = await executeAgent(testAgent.agent, {
      input: 'Health check',
      maxIterations: 1,
    })

    return (
      result.status === 'success' && result.result?.toLowerCase().includes('ok')
    )
  } catch (error) {
    console.error('Agent factory health check failed:', error)
    return false
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Create agent with error handling wrapper
 */
export const createAgentSafely = async (
  config: AgentFactoryConfig
): Promise<AgentFactoryResult | null> => {
  try {
    if (!validateAgentConfig(config)) {
      throw new Error('Invalid agent configuration')
    }

    return await createAgent(config)
  } catch (error) {
    console.error('Failed to create agent:', error)
    return null
  }
}

/**
 * Execute agent with timeout
 */
export const executeAgentWithTimeout = async (
  agent: AgentExecutor,
  options: AgentExecutionOptions,
  timeoutMs: number = 30000
): Promise<AgentExecutionResult> => {
  const timeoutPromise = new Promise<AgentExecutionResult>((_, reject) => {
    setTimeout(() => reject(new Error('Agent execution timeout')), timeoutMs)
  })

  const executionPromise = executeAgent(agent, options)

  return Promise.race([executionPromise, timeoutPromise])
}

/**
 * Create agent with automatic retry logic
 */
export const createAgentWithRetry = async (
  config: AgentFactoryConfig,
  maxRetries: number = 3
): Promise<AgentFactoryResult> => {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createAgent(config)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      if (i === maxRetries - 1) break

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw lastError || new Error('Failed to create agent after retries')
}

// ========== EXPORTS ==========

export type { AgentFactoryConfig, AgentFactoryResult, AgentExecutionOptions }
