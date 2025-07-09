/**
 * Main LangChain Integration Export
 *
 * Unified interface for all LangChain workflow functionality.
 * This is the main entry point for LangChain integration across the application.
 */

// ========== MODEL CONFIGURATION ==========

export {
  createModel,
  createModelByName,
  createStreamingModel,
  createDocumentModel,
  createAnalysisModel,
  createNegotiationModel,
  initializeModelConfig,
  getDefaultConfig,
  validateAPIKey,
  isConfigValid,
  initializeLangChainFromEnv,
  createRealEstateSystemPrompt,
  estimateTokens,
  isWithinTokenLimit,
  splitTextForModel,
  performHealthCheck,
  LANGCHAIN_MODELS,
} from './common/model-config'

export type {
  LangChainModelConfig,
  LangChainClientConfig,
} from './common/model-config'

// ========== AGENT FACTORY ==========

export {
  createAgent,
  createNegotiationAgent,
  createOfferAnalysisAgent,
  createDocumentGenerationAgent,
  createMarketAnalysisAgent,
  executeAgent,
  createStreamingAgent,
  validateAgentConfig,
  getRecommendedConfig,
  estimateTokens as estimateAgentTokens,
  createAgentBatch,
  performAgentHealthCheck,
  createAgentSafely,
  executeAgentWithTimeout,
  createAgentWithRetry,
} from './common/agent-factory'

export type {
  AgentFactoryConfig,
  AgentFactoryResult,
  AgentExecutionOptions,
} from './common/agent-factory'

// ========== MEMORY MANAGEMENT ==========

export {
  InMemoryConversationStorage,
  ConversationMemoryManager,
  createConversationMemory,
  createWorkflowMemory,
  convertToLangChainMessages,
} from './memory/conversation-memory'

export type {
  ConversationMemoryConfig,
  MemoryStorageOptions,
  ConversationMemoryResult,
} from './memory/conversation-memory'

// ========== CONTEXT MEMORY ==========
// Note: Context memory will be implemented in future tasks

// ========== SHARED TYPES ==========

export type {
  // Core workflow types
  BaseWorkflowContext,
  BaseWorkflowResult,
  BaseWorkflowConfig,
  BaseAgentState,
  AgentExecutionContext,
  AgentExecutionResult,
  // Negotiation workflow types
  NegotiationWorkflowContext,
  NegotiationScenario,
  NegotiationClient,
  NegotiationProperty,
  MarketConditions,
  NegotiationWorkflowResult,
  // Offer analysis workflow types
  OfferAnalysisWorkflowContext,
  AnalysisProperty,
  AnalysisMarket,
  AnalysisSeller,
  AnalysisType,
  OfferAnalysisWorkflowResult,
  // Document generation workflow types
  DocumentGenerationWorkflowContext,
  DocumentType,
  DocumentClient,
  DocumentProperty,
  DocumentAgent,
  DocumentGenerationWorkflowResult,
  // Market analysis workflow types
  MarketAnalysisWorkflowContext,
  MarketLocation,
  MarketAnalysisType,
  MarketTimeframe,
  MarketDataPoint,
  MarketAnalysisWorkflowResult,
  // Workflow orchestration types
  WorkflowOrchestrationContext,
  WorkflowDefinition,
  WorkflowDependency,
  WorkflowOrchestrationResult,
  // Memory types
  MemoryContext,
  MemoryStorage,
  // Tool types
  ToolExecutionContext,
  ToolExecutionResult,
  // Streaming types
  StreamingEventType,
  StreamingEvent,
  StreamingCallback,
  // Configuration types
  LangChainGlobalConfig,
  // Re-exported LangChain types
  BaseMessage,
  ChatOpenAI,
  Tool,
  StateGraph,
} from './types'

// ========== WORKFLOW IMPLEMENTATIONS ==========
// Note: Individual workflow agents will be implemented in task 3.0
// Note: LangGraph workflows will be implemented in task 4.0
// Note: Shared tools will be implemented in task 2.0

// ========== UTILITY FUNCTIONS ==========

/**
 * Initialize the entire LangChain integration system
 */
export const initializeLangChain = async (config?: {
  apiKey?: string
  defaultModel?: string
  memoryProvider?: 'memory' | 'firebase' | 'redis'
  memoryConfig?: Record<string, any>
  enableStreaming?: boolean
  enableMemory?: boolean
}): Promise<void> => {
  // Initialize model configuration
  if (config?.apiKey) {
    initializeModelConfig({
      apiKey: config.apiKey,
      defaultModel: config.defaultModel || 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      maxRetries: 3,
    })
  } else {
    initializeLangChainFromEnv()
  }

  // TODO: Initialize memory providers when implemented
  // TODO: Initialize tool registry when implemented
  // TODO: Setup streaming handlers when implemented

  console.log('LangChain integration initialized successfully')
}

/**
 * Perform comprehensive health check of all LangChain components
 */
export const performComprehensiveHealthCheck = async (): Promise<{
  models: boolean
  agents: boolean
  memory: boolean
  tools: boolean
  workflows: boolean
  overall: boolean
}> => {
  const results = {
    models: false,
    agents: false,
    memory: false,
    tools: false,
    workflows: false,
    overall: false,
  }

  try {
    // Check model configuration
    results.models = await performHealthCheck()

    // Check agent factory
    results.agents = await performAgentHealthCheck()

    // Check memory management
    results.memory = true // Memory is always available (in-memory storage)

    // TODO: Check tools when implemented
    results.tools = true

    // TODO: Check workflows when implemented
    results.workflows = true

    results.overall =
      results.models &&
      results.agents &&
      results.memory &&
      results.tools &&
      results.workflows

    return results
  } catch (error) {
    console.error('Health check failed:', error)
    return results
  }
}

/**
 * Get current LangChain integration status
 */
export const getLangChainStatus = (): {
  initialized: boolean
  modelConfig: boolean
  agentFactory: boolean
  memoryManager: boolean
  toolRegistry: boolean
  workflows: boolean
} => {
  return {
    initialized: true,
    modelConfig: true,
    agentFactory: true,
    memoryManager: true,
    toolRegistry: false, // Will be true after task 2.0
    workflows: false, // Will be true after task 4.0
  }
}

/**
 * Create a complete workflow context for LangChain operations
 */
export const createWorkflowContext = (
  workflowId: string,
  sessionId?: string,
  userId?: string,
  metadata?: Record<string, any>
): BaseWorkflowContext => {
  return {
    workflowId,
    timestamp: new Date(),
    sessionId,
    userId,
    metadata,
  }
}

/**
 * Quick setup for common real estate workflows
 */
export const createRealEstateWorkflow = async (
  workflowType: 'negotiation' | 'analysis' | 'document' | 'market',
  tools: Tool[] = [],
  config?: {
    sessionId?: string
    userId?: string
    streaming?: boolean
    memory?: boolean
    temperature?: number
    maxTokens?: number
  }
) => {
  const context = createWorkflowContext(
    `${workflowType}-${Date.now()}`,
    config?.sessionId,
    config?.userId
  )

  const agentConfig = {
    ...getRecommendedConfig(workflowType),
    streaming: config?.streaming,
    temperature: config?.temperature,
    maxTokens: config?.maxTokens,
  }

  let agent
  switch (workflowType) {
    case 'negotiation':
      agent = await createNegotiationAgent(tools, agentConfig)
      break
    case 'analysis':
      agent = await createOfferAnalysisAgent(tools, agentConfig)
      break
    case 'document':
      agent = await createDocumentGenerationAgent(tools, agentConfig)
      break
    case 'market':
      agent = await createMarketAnalysisAgent(tools, agentConfig)
      break
    default:
      throw new Error(`Unknown workflow type: ${workflowType}`)
  }

  let memory
  if (config?.memory && config?.sessionId) {
    memory = await createWorkflowMemory(
      config.sessionId,
      context.workflowId,
      config.userId
    )
  }

  return {
    context,
    agent,
    memory,
    execute: async (input: string) => {
      const result = await executeAgent(agent.agent, {
        input,
        context,
        streaming: config?.streaming,
      })

      // Save to memory if enabled
      if (memory) {
        await memory.addMessage(
          config.sessionId!,
          context.workflowId,
          new (await import('@langchain/core/messages')).HumanMessage(input),
          config.userId
        )
        await memory.addMessage(
          config.sessionId!,
          context.workflowId,
          new (await import('@langchain/core/messages')).AIMessage(
            result.result
          ),
          config.userId
        )
      }

      return result
    },
  }
}

// ========== VERSION INFO ==========

export const LANGCHAIN_INTEGRATION_VERSION = '1.0.0'
export const SUPPORTED_LANGCHAIN_VERSION = '^0.3.0'
export const SUPPORTED_OPENAI_VERSION = '^5.8.3'

// ========== DEFAULT EXPORTS ==========

export default {
  // Core functions
  initializeLangChain,
  performComprehensiveHealthCheck,
  getLangChainStatus,
  createWorkflowContext,
  createRealEstateWorkflow,

  // Model configuration
  models: {
    create: createModel,
    createByName: createModelByName,
    createStreaming: createStreamingModel,
    createDocument: createDocumentModel,
    createAnalysis: createAnalysisModel,
    createNegotiation: createNegotiationModel,
    initialize: initializeModelConfig,
    healthCheck: performHealthCheck,
    configs: LANGCHAIN_MODELS,
  },

  // Agent factory
  agents: {
    create: createAgent,
    createNegotiation: createNegotiationAgent,
    createOfferAnalysis: createOfferAnalysisAgent,
    createDocumentGeneration: createDocumentGenerationAgent,
    createMarketAnalysis: createMarketAnalysisAgent,
    execute: executeAgent,
    healthCheck: performAgentHealthCheck,
  },

  // Memory management
  memory: {
    createConversation: createConversationMemory,
    createWorkflow: createWorkflowMemory,
    convertMessages: convertToLangChainMessages,
  },

  // Version info
  version: LANGCHAIN_INTEGRATION_VERSION,
  supportedVersions: {
    langchain: SUPPORTED_LANGCHAIN_VERSION,
    openai: SUPPORTED_OPENAI_VERSION,
  },
}
