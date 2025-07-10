/**
 * LangChain Streaming Service
 *
 * Provides streaming capabilities for long-running LangChain agent workflows
 * with real-time updates, progress tracking, and error handling.
 */

import type { ChatOpenAI } from '@langchain/openai'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { AgentAction, AgentFinish } from '@langchain/core/agents'
import type { LLMResult } from '@langchain/core/language_models/llm'
import type { Document } from '@langchain/core/documents'
import type { Serialized } from '@langchain/core/load/serializable'
import type { ChainValues } from '@langchain/core/utils/types'

// ========== STREAMING TYPES ==========

export interface StreamingMessage {
  id: string
  timestamp: string
  type: 'progress' | 'tool_call' | 'agent_action' | 'result' | 'error'
  content: any
  metadata?: any
}

export interface StreamingProgress {
  step: number
  totalSteps: number
  currentAction: string
  description: string
  percentage: number
  estimatedTimeRemaining?: number
}

export interface StreamingOptions {
  enableProgress: boolean
  enableToolUpdates: boolean
  enableIntermediateResults: boolean
  progressUpdateInterval: number
  maxRetries: number
  timeoutMs: number
}

export interface StreamingSession {
  id: string
  agentType: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'error' | 'cancelled'
  messages: StreamingMessage[]
  progress?: StreamingProgress
  result?: any
  error?: string
}

// ========== STREAMING CALLBACK HANDLER ==========

export class StreamingCallbackHandler extends BaseCallbackHandler {
  private sessionId: string
  private callbacks: Map<string, (message: StreamingMessage) => void>
  private options: StreamingOptions
  private startTime: number
  private stepCount: number
  private currentStep: number

  constructor(
    sessionId: string,
    options: StreamingOptions = {
      enableProgress: true,
      enableToolUpdates: true,
      enableIntermediateResults: true,
      progressUpdateInterval: 1000,
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes
    }
  ) {
    super()
    this.sessionId = sessionId
    this.options = options
    this.callbacks = new Map()
    this.startTime = Date.now()
    this.stepCount = 0
    this.currentStep = 0
  }

  // ========== CALLBACK REGISTRATION ==========

  registerCallback(
    eventType: string,
    callback: (message: StreamingMessage) => void
  ): void {
    this.callbacks.set(eventType, callback)
  }

  unregisterCallback(eventType: string): void {
    this.callbacks.delete(eventType)
  }

  // ========== LANGCHAIN CALLBACK METHODS ==========

  async handleLLMStart(
    llm: { name: string },
    prompts: string[],
    runId: string,
    parentRunId?: string
  ): Promise<void> {
    this.emitMessage({
      type: 'progress',
      content: {
        action: 'llm_start',
        modelName: llm.name,
        promptCount: prompts.length,
      },
    })
  }

  async handleLLMEnd(output: LLMResult, runId: string): Promise<void> {
    this.emitMessage({
      type: 'progress',
      content: {
        action: 'llm_end',
        tokenUsage: output.llmOutput?.tokenUsage,
        generations: output.generations.length,
      },
    })
  }

  async handleLLMError(err: Error, runId: string): Promise<void> {
    this.emitMessage({
      type: 'error',
      content: {
        action: 'llm_error',
        error: err.message,
        stack: err.stack,
      },
    })
  }

  async handleChainStart(
    chain: { name: string },
    inputs: any,
    runId: string
  ): Promise<void> {
    this.stepCount++
    this.emitMessage({
      type: 'progress',
      content: {
        action: 'chain_start',
        chainName: chain.name,
        step: this.stepCount,
      },
    })
  }

  async handleChainEnd(outputs: any, runId: string): Promise<void> {
    this.currentStep++
    this.emitMessage({
      type: 'progress',
      content: {
        action: 'chain_end',
        step: this.currentStep,
        totalSteps: this.stepCount,
        percentage: (this.currentStep / this.stepCount) * 100,
      },
    })
  }

  async handleChainError(err: Error, runId: string): Promise<void> {
    this.emitMessage({
      type: 'error',
      content: {
        action: 'chain_error',
        error: err.message,
        stack: err.stack,
      },
    })
  }

  async handleToolStart(
    tool: { name: string },
    input: string,
    runId: string
  ): Promise<void> {
    if (this.options.enableToolUpdates) {
      this.emitMessage({
        type: 'tool_call',
        content: {
          action: 'tool_start',
          toolName: tool.name,
          input: input,
        },
      })
    }
  }

  async handleToolEnd(output: string, runId: string): Promise<void> {
    if (this.options.enableToolUpdates) {
      this.emitMessage({
        type: 'tool_call',
        content: {
          action: 'tool_end',
          output: output,
        },
      })
    }
  }

  async handleToolError(err: Error, runId: string): Promise<void> {
    this.emitMessage({
      type: 'error',
      content: {
        action: 'tool_error',
        error: err.message,
        stack: err.stack,
      },
    })
  }

  async handleAgentAction(action: AgentAction, runId: string): Promise<void> {
    this.emitMessage({
      type: 'agent_action',
      content: {
        action: 'agent_action',
        tool: action.tool,
        toolInput: action.toolInput,
        log: action.log,
      },
    })
  }

  async handleAgentEnd(action: AgentFinish, runId: string): Promise<void> {
    this.emitMessage({
      type: 'result',
      content: {
        action: 'agent_end',
        output: action.returnValues,
        log: action.log,
      },
    })
  }

  async handleText(text: string, runId: string): Promise<void> {
    if (this.options.enableIntermediateResults) {
      this.emitMessage({
        type: 'progress',
        content: {
          action: 'text_update',
          text: text,
        },
      })
    }
  }

  // ========== HELPER METHODS ==========

  private emitMessage(message: Partial<StreamingMessage>): void {
    const fullMessage: StreamingMessage = {
      id: `${this.sessionId}-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type: message.type || 'progress',
      content: message.content || {},
      metadata: {
        sessionId: this.sessionId,
        elapsedTime: Date.now() - this.startTime,
        ...message.metadata,
      },
    }

    // Emit to registered callbacks
    const callback = this.callbacks.get(message.type || 'progress')
    if (callback) {
      callback(fullMessage)
    }

    // Emit to all callbacks
    const allCallback = this.callbacks.get('all')
    if (allCallback) {
      allCallback(fullMessage)
    }
  }

  getProgress(): StreamingProgress {
    const elapsedTime = Date.now() - this.startTime
    const estimatedTotal =
      this.currentStep > 0
        ? (elapsedTime / this.currentStep) * this.stepCount
        : 0
    const estimatedRemaining = estimatedTotal - elapsedTime

    return {
      step: this.currentStep,
      totalSteps: this.stepCount,
      currentAction: 'Processing...',
      description: `Step ${this.currentStep} of ${this.stepCount}`,
      percentage:
        this.stepCount > 0 ? (this.currentStep / this.stepCount) * 100 : 0,
      estimatedTimeRemaining:
        estimatedRemaining > 0 ? estimatedRemaining : undefined,
    }
  }
}

// ========== STREAMING SERVICE ==========

export class StreamingService {
  private sessions: Map<string, StreamingSession>
  private callbacks: Map<string, StreamingCallbackHandler>

  constructor() {
    this.sessions = new Map()
    this.callbacks = new Map()
  }

  // ========== SESSION MANAGEMENT ==========

  createSession(
    agentType: string,
    options?: StreamingOptions
  ): { sessionId: string; handler: StreamingCallbackHandler } {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const session: StreamingSession = {
      id: sessionId,
      agentType,
      startTime: new Date().toISOString(),
      status: 'running',
      messages: [],
    }

    const handler = new StreamingCallbackHandler(sessionId, options)

    // Register handler to collect messages
    handler.registerCallback('all', message => {
      session.messages.push(message)
      session.progress = handler.getProgress()
    })

    this.sessions.set(sessionId, session)
    this.callbacks.set(sessionId, handler)

    return { sessionId, handler }
  }

  getSession(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId)
  }

  completeSession(sessionId: string, result: any): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'completed'
      session.endTime = new Date().toISOString()
      session.result = result
    }
  }

  errorSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'error'
      session.endTime = new Date().toISOString()
      session.error = error
    }
  }

  cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'cancelled'
      session.endTime = new Date().toISOString()
    }
  }

  // ========== STREAMING METHODS ==========

  async streamAgentExecution<T>(
    sessionId: string,
    agent: any,
    input: any,
    onProgress?: (message: StreamingMessage) => void
  ): Promise<T> {
    const session = this.sessions.get(sessionId)
    const handler = this.callbacks.get(sessionId)

    if (!session || !handler) {
      throw new Error(`Session ${sessionId} not found`)
    }

    try {
      // Register progress callback
      if (onProgress) {
        handler.registerCallback('all', onProgress)
      }

      // Configure agent with streaming
      const streamingAgent = agent.configure({
        callbacks: [handler],
        metadata: { sessionId },
      })

      // Execute agent with streaming
      const result = await streamingAgent.invoke(input)

      this.completeSession(sessionId, result)
      return result
    } catch (error) {
      this.errorSession(
        sessionId,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // ========== WEBSOCKET SUPPORT ==========

  setupWebSocketStreaming(ws: any, sessionId: string): void {
    const handler = this.callbacks.get(sessionId)
    if (!handler) {
      ws.send(
        JSON.stringify({
          type: 'error',
          content: { error: 'Session not found' },
        })
      )
      return
    }

    handler.registerCallback('all', message => {
      if (ws.readyState === 1) {
        // WebSocket.OPEN
        ws.send(JSON.stringify(message))
      }
    })

    ws.on('close', () => {
      handler.unregisterCallback('all')
    })
  }

  // ========== SERVER-SENT EVENTS SUPPORT ==========

  setupSSEStreaming(res: any, sessionId: string): void {
    const handler = this.callbacks.get(sessionId)
    if (!handler) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          content: { error: 'Session not found' },
        })}\n\n`
      )
      return
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    handler.registerCallback('all', message => {
      res.write(`data: ${JSON.stringify(message)}\n\n`)
    })

    // Handle client disconnect
    res.on('close', () => {
      handler.unregisterCallback('all')
    })
  }

  // ========== CLEANUP ==========

  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.callbacks.delete(sessionId)
  }

  cleanupOldSessions(maxAgeMs: number = 3600000): void {
    // 1 hour default
    const now = Date.now()

    for (const [sessionId, session] of this.sessions) {
      const sessionTime = new Date(session.startTime).getTime()
      if (now - sessionTime > maxAgeMs) {
        this.cleanupSession(sessionId)
      }
    }
  }

  // ========== UTILITY METHODS ==========

  getAllSessions(): StreamingSession[] {
    return Array.from(this.sessions.values())
  }

  getActiveSessions(): StreamingSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'running'
    )
  }

  getSessionsByAgent(agentType: string): StreamingSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.agentType === agentType
    )
  }
}

// ========== STREAMING UTILITIES ==========

export class StreamingAgentWrapper {
  private streamingService: StreamingService
  private agent: any
  private agentType: string

  constructor(agent: any, agentType: string) {
    this.streamingService = new StreamingService()
    this.agent = agent
    this.agentType = agentType
  }

  async executeWithStreaming(
    input: any,
    onProgress?: (message: StreamingMessage) => void,
    options?: StreamingOptions
  ): Promise<{ result: any; sessionId: string }> {
    const { sessionId, handler } = this.streamingService.createSession(
      this.agentType,
      options
    )

    const result = await this.streamingService.streamAgentExecution(
      sessionId,
      this.agent,
      input,
      onProgress
    )

    return { result, sessionId }
  }

  getStreamingService(): StreamingService {
    return this.streamingService
  }
}

// ========== REACT HOOKS (for frontend integration) ==========

export const createStreamingHook = () => {
  return {
    useStreamingAgent: (agentType: string, input: any) => {
      // This would be implemented in the frontend
      // Returns: { result, loading, error, progress, messages }
    },

    useStreamingSession: (sessionId: string) => {
      // This would be implemented in the frontend
      // Returns: { session, messages, progress }
    },
  }
}

// ========== EXPORT SINGLETON ==========

export const streamingService = new StreamingService()

export default {
  StreamingService,
  StreamingCallbackHandler,
  StreamingAgentWrapper,
  streamingService,
}
