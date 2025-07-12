/**
 * LangChain Tools Registry and Management System
 *
 * Centralized registry for all LangChain tools with management capabilities
 */

import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// Import all tool modules
import {
  firebaseTools,
  getAllFirebaseTools,
  getFirebaseToolsByCategory,
} from './firebase'
import {
  marketDataTools,
  getAllMarketDataTools,
  getMarketDataToolsByCategory,
} from './market-data'
import {
  calculationTools,
  getAllCalculationTools,
  getCalculationToolsByCategory,
} from './calculations'
import {
  propertyAnalysisTools,
  getAllPropertyAnalysisTools,
  getPropertyAnalysisToolsByCategory,
} from './property-analysis'
import {
  documentFormattingTools,
  getAllDocumentFormattingTools,
  getDocumentFormattingToolsByCategory,
} from './document-formatting'
import {
  validationErrorTools,
  getAllValidationErrorTools,
  getValidationErrorToolsByCategory,
} from './validation-error'

// ========== TOOL REGISTRY TYPES ==========

export interface ToolMetadata {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  version: string
  author: string
  tags: string[]
  dependencies: string[]
  compatibility: {
    langchain: string
    nodejs: string
  }
  usage: {
    frequency: 'high' | 'medium' | 'low'
    complexity: 'simple' | 'moderate' | 'complex'
    performance: 'fast' | 'moderate' | 'slow'
  }
  examples: Array<{
    title: string
    description: string
    input: Record<string, any>
    expectedOutput: string
  }>
  lastUpdated: string
  status: 'active' | 'deprecated' | 'experimental'
}

export interface ToolRegistryConfig {
  enableCache: boolean
  cacheTimeout: number
  logExecution: boolean
  validateTools: boolean
  enableMetrics: boolean
  defaultTimeout: number
  maxConcurrentExecutions: number
}

export interface ToolExecutionMetrics {
  toolName: string
  executionCount: number
  totalExecutionTime: number
  averageExecutionTime: number
  successRate: number
  lastExecuted: string
  errorCount: number
  commonErrors: string[]
}

// ========== TOOL CATEGORIES ==========

export const TOOL_CATEGORIES = {
  FIREBASE: 'firebase',
  MARKET_DATA: 'market_data',
  CALCULATIONS: 'calculations',
  PROPERTY_ANALYSIS: 'property_analysis',
  DOCUMENT_FORMATTING: 'document_formatting',
  VALIDATION_ERROR: 'validation_error',
} as const

export type ToolCategory =
  (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES]

// ========== TOOL REGISTRY CLASS ==========

/**
 * Centralized Tool Registry and Management System
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map()
  private metadata: Map<string, ToolMetadata> = new Map()
  private metrics: Map<string, ToolExecutionMetrics> = new Map()
  private config: ToolRegistryConfig
  private cache: Map<string, { result: any; timestamp: number }> = new Map()

  constructor(config: Partial<ToolRegistryConfig> = {}) {
    this.config = {
      enableCache: true,
      cacheTimeout: 300000, // 5 minutes
      logExecution: true,
      validateTools: true,
      enableMetrics: true,
      defaultTimeout: 30000, // 30 seconds
      maxConcurrentExecutions: 10,
      ...config,
    }

    this.initializeRegistry()
  }

  /**
   * Initialize the registry with all available tools
   */
  private initializeRegistry(): void {
    // Register Firebase tools
    this.registerToolCategory('firebase', getAllFirebaseTools(), {
      description:
        'Firebase integration tools for data persistence and real-time operations',
      version: '1.0.0',
      author: 'AIgent Pro Platform',
      compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
    })

    // Register Market Data tools
    this.registerToolCategory('market_data', getAllMarketDataTools(), {
      description: 'Market analysis and property valuation tools',
      version: '1.0.0',
      author: 'AIgent Pro Platform',
      compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
    })

    // Register Calculation tools
    this.registerToolCategory('calculations', getAllCalculationTools(), {
      description: 'Financial calculations and formatting utilities',
      version: '1.0.0',
      author: 'AIgent Pro Platform',
      compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
    })

    // Register Property Analysis tools
    this.registerToolCategory(
      'property_analysis',
      getAllPropertyAnalysisTools(),
      {
        description:
          'Property condition assessment and investment analysis tools',
        version: '1.0.0',
        author: 'AIgent Pro Platform',
        compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
      }
    )

    // Register Document Formatting tools
    this.registerToolCategory(
      'document_formatting',
      getAllDocumentFormattingTools(),
      {
        description: 'Document generation and formatting tools',
        version: '1.0.0',
        author: 'AIgent Pro Platform',
        compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
      }
    )

    // Register Validation and Error tools
    this.registerToolCategory(
      'validation_error',
      getAllValidationErrorTools(),
      {
        description: 'Data validation and error handling tools',
        version: '1.0.0',
        author: 'AIgent Pro Platform',
        compatibility: { langchain: '^0.1.0', nodejs: '^18.0.0' },
      }
    )
  }

  /**
   * Register a category of tools with metadata
   */
  private registerToolCategory(
    category: string,
    tools: Tool[],
    categoryMetadata: Partial<ToolMetadata>
  ): void {
    tools.forEach(tool => {
      const metadata: ToolMetadata = {
        id: `${category}_${tool.name}`,
        name: tool.name,
        description: tool.description,
        category,
        version: categoryMetadata.version || '1.0.0',
        author: categoryMetadata.author || 'Unknown',
        tags: this.generateTags(tool.name, category),
        dependencies: [],
        compatibility: categoryMetadata.compatibility || {
          langchain: '^0.1.0',
          nodejs: '^18.0.0',
        },
        usage: this.determineUsageMetrics(tool.name, category),
        examples: this.generateExamples(tool.name, category),
        lastUpdated: new Date().toISOString(),
        status: 'active',
      }

      this.tools.set(tool.name, tool)
      this.metadata.set(tool.name, metadata)
      this.initializeMetrics(tool.name)
    })
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    switch (category) {
      case TOOL_CATEGORIES.FIREBASE:
        return getAllFirebaseTools()
      case TOOL_CATEGORIES.MARKET_DATA:
        return getAllMarketDataTools()
      case TOOL_CATEGORIES.CALCULATIONS:
        return getAllCalculationTools()
      case TOOL_CATEGORIES.PROPERTY_ANALYSIS:
        return getAllPropertyAnalysisTools()
      case TOOL_CATEGORIES.DOCUMENT_FORMATTING:
        return getAllDocumentFormattingTools()
      case TOOL_CATEGORIES.VALIDATION_ERROR:
        return getAllValidationErrorTools()
      default:
        return []
    }
  }

  /**
   * Get tools by subcategory
   */
  getToolsBySubcategory(category: ToolCategory, subcategory: string): Tool[] {
    switch (category) {
      case TOOL_CATEGORIES.FIREBASE:
        return getFirebaseToolsByCategory(subcategory as any)
      case TOOL_CATEGORIES.MARKET_DATA:
        return getMarketDataToolsByCategory(subcategory as any)
      case TOOL_CATEGORIES.CALCULATIONS:
        return getCalculationToolsByCategory(subcategory as any)
      case TOOL_CATEGORIES.PROPERTY_ANALYSIS:
        return getPropertyAnalysisToolsByCategory(subcategory as any)
      case TOOL_CATEGORIES.DOCUMENT_FORMATTING:
        return getDocumentFormattingToolsByCategory(subcategory as any)
      case TOOL_CATEGORIES.VALIDATION_ERROR:
        return getValidationErrorToolsByCategory(subcategory as any)
      default:
        return []
    }
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Search tools by name or description
   */
  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.tools.entries())
      .filter(
        ([name, tool]) =>
          name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery)
      )
      .map(([, tool]) => tool)
  }

  /**
   * Get tool metadata
   */
  getToolMetadata(name: string): ToolMetadata | undefined {
    return this.metadata.get(name)
  }

  /**
   * Get all tool metadata
   */
  getAllToolMetadata(): ToolMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * Execute a tool with context and metrics tracking
   */
  async executeTool(
    toolName: string,
    input: any,
    context?: Partial<ToolExecutionContext>
  ): Promise<ToolExecutionResult> {
    const startTime = performance.now()
    const tool = this.getTool(toolName)

    if (!tool) {
      const result: ToolExecutionResult = {
        toolName,
        success: false,
        result: null,
        error: `Tool '${toolName}' not found`,
        executionTime: 0,
      }

      if (this.config.logExecution) {
        console.error(`Tool execution failed: ${result.error}`)
      }

      return result
    }

    try {
      // Check cache
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(toolName, input)
        const cached = this.cache.get(cacheKey)

        if (
          cached &&
          Date.now() - cached.timestamp < this.config.cacheTimeout
        ) {
          return {
            toolName,
            success: true,
            result: cached.result,
            executionTime: 0,
          }
        }
      }

      // Execute tool
      const result = (await Promise.race([
        tool.call(input),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Tool execution timeout')),
            this.config.defaultTimeout
          )
        ),
      ])) as string

      const executionTime = performance.now() - startTime
      const toolResult: ToolExecutionResult = {
        toolName,
        success: true,
        result,
        executionTime,
      }

      // Cache result
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(toolName, input)
        this.cache.set(cacheKey, { result, timestamp: Date.now() })
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(toolName, executionTime, true)
      }

      // Log execution
      if (this.config.logExecution) {
        console.log(
          `Tool '${toolName}' executed successfully in ${executionTime.toFixed(2)}ms`
        )
      }

      return toolResult
    } catch (error: any) {
      const executionTime = performance.now() - startTime
      const toolResult: ToolExecutionResult = {
        toolName,
        success: false,
        result: null,
        error: error.message,
        executionTime,
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(toolName, executionTime, false, error.message)
      }

      // Log error
      if (this.config.logExecution) {
        console.error(`Tool '${toolName}' execution failed: ${error.message}`)
      }

      return toolResult
    }
  }

  /**
   * Get tool execution metrics
   */
  getToolMetrics(toolName: string): ToolExecutionMetrics | undefined {
    return this.metrics.get(toolName)
  }

  /**
   * Get all tool metrics
   */
  getAllToolMetrics(): ToolExecutionMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalTools: number
    toolsByCategory: Record<string, number>
    totalExecutions: number
    averageExecutionTime: number
    successRate: number
  } {
    const totalTools = this.tools.size
    const toolsByCategory: Record<string, number> = {}
    let totalExecutions = 0
    let totalExecutionTime = 0
    let totalSuccesses = 0

    // Count tools by category
    this.metadata.forEach(metadata => {
      toolsByCategory[metadata.category] =
        (toolsByCategory[metadata.category] || 0) + 1
    })

    // Calculate execution statistics
    this.metrics.forEach(metrics => {
      totalExecutions += metrics.executionCount
      totalExecutionTime += metrics.totalExecutionTime
      totalSuccesses += Math.round(
        metrics.executionCount * (metrics.successRate / 100)
      )
    })

    return {
      totalTools,
      toolsByCategory,
      totalExecutions,
      averageExecutionTime:
        totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
      successRate:
        totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 100,
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.clear()
    this.tools.forEach((_, toolName) => {
      this.initializeMetrics(toolName)
    })
  }

  /**
   * Validate all tools
   */
  async validateTools(): Promise<{
    valid: string[]
    invalid: Array<{ name: string; error: string }>
  }> {
    const valid: string[] = []
    const invalid: Array<{ name: string; error: string }> = []

    for (const [name, tool] of this.tools.entries()) {
      try {
        // Basic validation - check if tool has required properties
        if (!tool.name || !tool.description) {
          invalid.push({
            name,
            error: 'Missing required properties (name or description)',
          })
          continue
        }

        // Try to call with invalid input to see if it handles errors gracefully
        try {
          await tool.call({})
        } catch (error) {
          // This is expected for most tools with empty input
        }

        valid.push(name)
      } catch (error: any) {
        invalid.push({ name, error: error.message })
      }
    }

    return { valid, invalid }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private generateCacheKey(toolName: string, input: any): string {
    return `${toolName}_${JSON.stringify(input)}`
  }

  private initializeMetrics(toolName: string): void {
    this.metrics.set(toolName, {
      toolName,
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      successRate: 100,
      lastExecuted: '',
      errorCount: 0,
      commonErrors: [],
    })
  }

  private updateMetrics(
    toolName: string,
    executionTime: number,
    success: boolean,
    error?: string
  ): void {
    const metrics = this.metrics.get(toolName)
    if (!metrics) return

    metrics.executionCount++
    metrics.totalExecutionTime += executionTime
    metrics.averageExecutionTime =
      metrics.totalExecutionTime / metrics.executionCount
    metrics.lastExecuted = new Date().toISOString()

    if (success) {
      metrics.successRate =
        ((metrics.executionCount - metrics.errorCount) /
          metrics.executionCount) *
        100
    } else {
      metrics.errorCount++
      metrics.successRate =
        ((metrics.executionCount - metrics.errorCount) /
          metrics.executionCount) *
        100

      if (error && !metrics.commonErrors.includes(error)) {
        metrics.commonErrors.push(error)
        // Keep only the 5 most recent unique errors
        if (metrics.commonErrors.length > 5) {
          metrics.commonErrors = metrics.commonErrors.slice(-5)
        }
      }
    }
  }

  private generateTags(toolName: string, category: string): string[] {
    const tags = [category]

    if (toolName.includes('calculate')) tags.push('calculation')
    if (toolName.includes('validate')) tags.push('validation')
    if (toolName.includes('format')) tags.push('formatting')
    if (toolName.includes('generate')) tags.push('generation')
    if (toolName.includes('analyze')) tags.push('analysis')
    if (toolName.includes('market')) tags.push('market')
    if (toolName.includes('property')) tags.push('property')
    if (toolName.includes('document')) tags.push('document')
    if (toolName.includes('firebase')) tags.push('database')
    if (toolName.includes('error')) tags.push('error-handling')

    return tags
  }

  private determineUsageMetrics(
    toolName: string,
    category: string
  ): ToolMetadata['usage'] {
    // Default values - in production, these could be based on actual usage data
    let frequency: 'high' | 'medium' | 'low' = 'medium'
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
    let performance: 'fast' | 'moderate' | 'slow' = 'moderate'

    // Firebase tools are frequently used
    if (category === 'firebase') {
      frequency = 'high'
      performance = 'fast'
    }

    // Calculation tools are simple and fast
    if (category === 'calculations') {
      complexity = 'simple'
      performance = 'fast'
    }

    // Document formatting might be complex and slower
    if (category === 'document_formatting') {
      complexity = 'complex'
      performance = 'slow'
    }

    // Market analysis can be complex
    if (category === 'market_data') {
      complexity = 'complex'
    }

    return { frequency, complexity, performance }
  }

  private generateExamples(
    toolName: string,
    category: string
  ): ToolMetadata['examples'] {
    // Generate basic examples - in production, these would be more detailed
    const examples: ToolMetadata['examples'] = []

    if (category === 'firebase' && toolName.includes('create')) {
      examples.push({
        title: 'Create new record',
        description: 'Create a new record in Firebase',
        input: { data: { example: 'value' } },
        expectedOutput: 'Success response with created record ID',
      })
    }

    if (category === 'calculations' && toolName.includes('mortgage')) {
      examples.push({
        title: 'Calculate mortgage payment',
        description: 'Calculate monthly mortgage payment',
        input: { loanAmount: 300000, interestRate: 4.5, termYears: 30 },
        expectedOutput: 'Monthly payment calculation with breakdown',
      })
    }

    if (category === 'validation' && toolName.includes('property')) {
      examples.push({
        title: 'Validate property data',
        description: 'Validate property information for completeness',
        input: {
          propertyData: {
            address: '123 Main St',
            price: 500000,
            bedrooms: 3,
            bathrooms: 2,
          },
        },
        expectedOutput: 'Validation results with any errors or warnings',
      })
    }

    return examples
  }
}

// ========== SINGLETON REGISTRY INSTANCE ==========

/**
 * Default tool registry instance
 */
export const toolRegistry = new ToolRegistry()

// ========== CONVENIENCE FUNCTIONS ==========

/**
 * Get a tool by name from the default registry
 */
export function getTool(name: string): Tool | undefined {
  return toolRegistry.getTool(name)
}

/**
 * Get tools by category from the default registry
 */
export function getToolsByCategory(category: ToolCategory): Tool[] {
  return toolRegistry.getToolsByCategory(category)
}

/**
 * Search tools in the default registry
 */
export function searchTools(query: string): Tool[] {
  return toolRegistry.searchTools(query)
}

/**
 * Execute a tool using the default registry
 */
export async function executeTool(
  toolName: string,
  input: any,
  context?: Partial<ToolExecutionContext>
): Promise<ToolExecutionResult> {
  return toolRegistry.executeTool(toolName, input, context)
}

/**
 * Get all available tools from the default registry
 */
export function getAllTools(): Tool[] {
  return toolRegistry.getAllTools()
}

/**
 * Get registry statistics
 */
export function getRegistryStats() {
  return toolRegistry.getRegistryStats()
}

// ========== EXPORTS ==========

// Export all tools organized by category
export {
  // Firebase tools
  firebaseTools,
  getAllFirebaseTools,
  getFirebaseToolsByCategory,
  // Market data tools
  marketDataTools,
  getAllMarketDataTools,
  getMarketDataToolsByCategory,
  // Calculation tools
  calculationTools,
  getAllCalculationTools,
  getCalculationToolsByCategory,
  // Property analysis tools
  propertyAnalysisTools,
  getAllPropertyAnalysisTools,
  getPropertyAnalysisToolsByCategory,
  // Document formatting tools
  documentFormattingTools,
  getAllDocumentFormattingTools,
  getDocumentFormattingToolsByCategory,
  // Validation and error tools
  validationErrorTools,
  getAllValidationErrorTools,
  getValidationErrorToolsByCategory,
}

// Export types
export type {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolMetadata,
  ToolRegistryConfig,
  ToolExecutionMetrics,
}

// Default export
export default toolRegistry
