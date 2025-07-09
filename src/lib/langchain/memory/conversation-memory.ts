/**
 * Conversation Memory Management for LangChain Workflows
 *
 * Provides persistent conversation history and context management
 * for LangChain agents and workflows.
 */

import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { BufferMemory, ConversationSummaryBufferMemory } from 'langchain/memory'
import type { ChatOpenAI } from '@langchain/openai'
import { createModelByName } from '../common/model-config'
import type { MemoryContext, MemoryStorage } from '../types'

// ========== MEMORY TYPES ==========

/**
 * Conversation memory configuration
 */
export interface ConversationMemoryConfig {
  maxTokens?: number
  maxMessages?: number
  summaryModel?: ChatOpenAI
  returnMessages?: boolean
  humanPrefix?: string
  aiPrefix?: string
  memoryKey?: string
  inputKey?: string
  outputKey?: string
}

/**
 * Memory storage options
 */
export interface MemoryStorageOptions {
  provider: 'memory' | 'firebase' | 'redis'
  config?: Record<string, any>
}

/**
 * Conversation memory result
 */
export interface ConversationMemoryResult {
  messages: BaseMessage[]
  summary?: string
  tokenCount: number
  messageCount: number
  truncated: boolean
}

// ========== IN-MEMORY STORAGE ==========

/**
 * Simple in-memory storage for conversation history
 */
export class InMemoryConversationStorage implements MemoryStorage {
  private storage: Map<string, MemoryContext> = new Map()

  async store(context: MemoryContext): Promise<void> {
    const key = this.createKey(context.sessionId, context.workflowId)
    this.storage.set(key, { ...context })
  }

  async retrieve(
    sessionId: string,
    workflowId: string
  ): Promise<MemoryContext | null> {
    const key = this.createKey(sessionId, workflowId)
    const context = this.storage.get(key)
    return context ? { ...context } : null
  }

  async clear(sessionId: string): Promise<void> {
    const keysToDelete = Array.from(this.storage.keys()).filter(key =>
      key.startsWith(`${sessionId}:`)
    )
    for (const key of keysToDelete) {
      this.storage.delete(key)
    }
  }

  async update(
    sessionId: string,
    workflowId: string,
    data: Partial<MemoryContext>
  ): Promise<void> {
    const key = this.createKey(sessionId, workflowId)
    const existing = this.storage.get(key)
    if (existing) {
      this.storage.set(key, { ...existing, ...data })
    }
  }

  private createKey(sessionId: string, workflowId: string): string {
    return `${sessionId}:${workflowId}`
  }

  // Utility methods
  getAllSessions(): string[] {
    const sessions = new Set<string>()
    for (const key of this.storage.keys()) {
      const sessionId = key.split(':')[0]
      sessions.add(sessionId)
    }
    return Array.from(sessions)
  }

  getSessionWorkflows(sessionId: string): string[] {
    const workflows = new Set<string>()
    for (const key of this.storage.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        const workflowId = key.split(':')[1]
        workflows.add(workflowId)
      }
    }
    return Array.from(workflows)
  }
}

// ========== CONVERSATION MEMORY MANAGER ==========

/**
 * Conversation memory manager for LangChain workflows
 */
export class ConversationMemoryManager {
  private storage: MemoryStorage
  private config: ConversationMemoryConfig
  private summaryModel: ChatOpenAI

  constructor(
    storage: MemoryStorage = new InMemoryConversationStorage(),
    config: ConversationMemoryConfig = {}
  ) {
    this.storage = storage
    this.config = {
      maxTokens: 4000,
      maxMessages: 50,
      returnMessages: true,
      humanPrefix: 'Human',
      aiPrefix: 'AI',
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output',
      ...config,
    }
    this.summaryModel =
      config.summaryModel || createModelByName('QUICK_RESPONSE')
  }

  /**
   * Add a message to conversation history
   */
  async addMessage(
    sessionId: string,
    workflowId: string,
    message: BaseMessage,
    userId?: string
  ): Promise<void> {
    const context = (await this.storage.retrieve(sessionId, workflowId)) || {
      sessionId,
      workflowId,
      userId,
      conversationHistory: [],
      contextData: {},
    }

    context.conversationHistory.push(message)

    // Manage memory size
    if (
      this.config.maxMessages &&
      context.conversationHistory.length > this.config.maxMessages
    ) {
      context.conversationHistory = context.conversationHistory.slice(
        -this.config.maxMessages
      )
    }

    await this.storage.store(context)
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    sessionId: string,
    workflowId: string
  ): Promise<ConversationMemoryResult> {
    const context = await this.storage.retrieve(sessionId, workflowId)

    if (!context) {
      return {
        messages: [],
        tokenCount: 0,
        messageCount: 0,
        truncated: false,
      }
    }

    const messages = context.conversationHistory
    const tokenCount = this.estimateTokens(messages)
    const truncated = this.config.maxMessages
      ? messages.length >= this.config.maxMessages
      : false

    return {
      messages,
      tokenCount,
      messageCount: messages.length,
      truncated,
    }
  }

  /**
   * Create a LangChain BufferMemory instance
   */
  async createBufferMemory(
    sessionId: string,
    workflowId: string
  ): Promise<BufferMemory> {
    const history = await this.getConversationHistory(sessionId, workflowId)

    const memory = new BufferMemory({
      memoryKey: this.config.memoryKey,
      inputKey: this.config.inputKey,
      outputKey: this.config.outputKey,
      returnMessages: this.config.returnMessages,
      humanPrefix: this.config.humanPrefix,
      aiPrefix: this.config.aiPrefix,
    })

    // Load existing history
    for (const message of history.messages) {
      if (message instanceof HumanMessage) {
        await memory.saveContext(
          { [this.config.inputKey!]: message.content },
          { [this.config.outputKey!]: '' }
        )
      } else if (message instanceof AIMessage) {
        await memory.saveContext(
          { [this.config.inputKey!]: '' },
          { [this.config.outputKey!]: message.content }
        )
      }
    }

    return memory
  }

  /**
   * Create a LangChain ConversationSummaryBufferMemory instance
   */
  async createSummaryBufferMemory(
    sessionId: string,
    workflowId: string
  ): Promise<ConversationSummaryBufferMemory> {
    const history = await this.getConversationHistory(sessionId, workflowId)

    const memory = new ConversationSummaryBufferMemory({
      llm: this.summaryModel,
      maxTokenLimit: this.config.maxTokens,
      memoryKey: this.config.memoryKey,
      inputKey: this.config.inputKey,
      outputKey: this.config.outputKey,
      returnMessages: this.config.returnMessages,
      humanPrefix: this.config.humanPrefix,
      aiPrefix: this.config.aiPrefix,
    })

    // Load existing history
    for (const message of history.messages) {
      if (message instanceof HumanMessage) {
        await memory.saveContext(
          { [this.config.inputKey!]: message.content },
          { [this.config.outputKey!]: '' }
        )
      } else if (message instanceof AIMessage) {
        await memory.saveContext(
          { [this.config.inputKey!]: '' },
          { [this.config.outputKey!]: message.content }
        )
      }
    }

    return memory
  }

  /**
   * Clear conversation history
   */
  async clearConversation(
    sessionId: string,
    workflowId?: string
  ): Promise<void> {
    if (workflowId) {
      await this.storage.update(sessionId, workflowId, {
        conversationHistory: [],
        contextData: {},
      })
    } else {
      await this.storage.clear(sessionId)
    }
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(
    sessionId: string,
    workflowId: string
  ): Promise<string> {
    const history = await this.getConversationHistory(sessionId, workflowId)

    if (history.messages.length === 0) {
      return 'No conversation history available.'
    }

    const conversationText = history.messages
      .map(msg => `${msg.constructor.name}: ${msg.content}`)
      .join('\n')

    const prompt = `Please provide a concise summary of the following conversation:

${conversationText}

Summary:`

    const response = await this.summaryModel.invoke(prompt)
    return response.content.toString()
  }

  /**
   * Search conversation history
   */
  async searchConversation(
    sessionId: string,
    workflowId: string,
    query: string
  ): Promise<BaseMessage[]> {
    const history = await this.getConversationHistory(sessionId, workflowId)

    return history.messages.filter(message =>
      message.content.toString().toLowerCase().includes(query.toLowerCase())
    )
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(
    sessionId: string,
    workflowId: string
  ): Promise<{
    messageCount: number
    tokenCount: number
    humanMessages: number
    aiMessages: number
    systemMessages: number
    firstMessage?: Date
    lastMessage?: Date
  }> {
    const history = await this.getConversationHistory(sessionId, workflowId)

    const stats = {
      messageCount: history.messages.length,
      tokenCount: history.tokenCount,
      humanMessages: 0,
      aiMessages: 0,
      systemMessages: 0,
      firstMessage: undefined as Date | undefined,
      lastMessage: undefined as Date | undefined,
    }

    for (const message of history.messages) {
      if (message instanceof HumanMessage) {
        stats.humanMessages++
      } else if (message instanceof AIMessage) {
        stats.aiMessages++
      } else if (message instanceof SystemMessage) {
        stats.systemMessages++
      }
    }

    return stats
  }

  /**
   * Estimate token count for messages
   */
  private estimateTokens(messages: BaseMessage[]): number {
    const totalText = messages.map(msg => msg.content).join(' ')
    return Math.ceil(totalText.length / 4)
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Create conversation memory manager with default configuration
 */
export const createConversationMemory = (
  storage?: MemoryStorage,
  config?: ConversationMemoryConfig
): ConversationMemoryManager => {
  return new ConversationMemoryManager(storage, config)
}

/**
 * Create conversation memory for specific workflow
 */
export const createWorkflowMemory = async (
  sessionId: string,
  workflowId: string,
  userId?: string,
  config?: ConversationMemoryConfig
): Promise<ConversationMemoryManager> => {
  const memory = createConversationMemory(undefined, config)

  // Initialize with empty context if needed
  const context = await memory.getConversationHistory(sessionId, workflowId)
  if (context.messageCount === 0 && userId) {
    await memory.addMessage(
      sessionId,
      workflowId,
      new SystemMessage(`Session started for user: ${userId}`),
      userId
    )
  }

  return memory
}

/**
 * Helper to convert message history to LangChain format
 */
export const convertToLangChainMessages = (
  messages: BaseMessage[]
): BaseMessage[] => {
  return messages.map(msg => {
    if (
      msg instanceof HumanMessage ||
      msg instanceof AIMessage ||
      msg instanceof SystemMessage
    ) {
      return msg
    }

    // Convert plain objects to proper message instances
    const content =
      typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content)

    if (msg.constructor.name === 'HumanMessage') {
      return new HumanMessage(content)
    } else if (msg.constructor.name === 'AIMessage') {
      return new AIMessage(content)
    } else {
      return new SystemMessage(content)
    }
  })
}

// ========== EXPORTS ==========

export type {
  ConversationMemoryConfig,
  MemoryStorageOptions,
  ConversationMemoryResult,
}
