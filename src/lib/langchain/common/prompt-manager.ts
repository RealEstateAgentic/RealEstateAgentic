/**
 * LangChain Prompt Template Management System
 *
 * Centralized system for managing, versioning, and caching prompt templates
 * across all LangChain agents. Provides dynamic loading, template validation,
 * and performance optimization.
 */

import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts'
import {
  NEGOTIATION_PROMPT_TEMPLATES,
  NEGOTIATION_SYSTEM_TEMPLATES,
  formatNegotiationContext,
} from '../prompts/negotiation-prompts'
import {
  ANALYSIS_PROMPT_TEMPLATES,
  ANALYSIS_SYSTEM_TEMPLATES,
  formatAnalysisContext,
} from '../prompts/analysis-prompts'
import {
  DOCUMENT_PROMPT_TEMPLATES,
  DOCUMENT_SYSTEM_TEMPLATES,
  formatCoverLetterContext,
  formatMemoContext,
} from '../prompts/document-prompts'

// ========== PROMPT TEMPLATE TYPES ==========

export interface PromptTemplate {
  id: string
  name: string
  description: string
  version: string
  category: PromptCategory
  type: PromptType
  template: ChatPromptTemplate
  systemTemplate?: SystemMessagePromptTemplate
  variables: string[]
  metadata: PromptMetadata
  createdAt: string
  updatedAt: string
}

export type PromptCategory =
  | 'negotiation'
  | 'analysis'
  | 'document'
  | 'market'
  | 'general'

export type PromptType = 'chat' | 'system' | 'human' | 'combined'

export interface PromptMetadata {
  author: string
  tags: string[]
  usageCount: number
  performance: PerformanceMetrics
  validationRules: ValidationRule[]
}

export interface PerformanceMetrics {
  averageTokens: number
  averageResponseTime: number
  successRate: number
  lastUsed: string
}

export interface ValidationRule {
  type: 'required_variable' | 'max_length' | 'format' | 'content'
  value: any
  message: string
}

export interface PromptCacheEntry {
  template: ChatPromptTemplate
  variables: string[]
  lastAccessed: string
  accessCount: number
}

export interface PromptManagerOptions {
  enableCaching: boolean
  cacheMaxSize: number
  cacheExpirationMs: number
  enableMetrics: boolean
  enableValidation: boolean
  defaultVersion: string
}

// ========== PROMPT MANAGER CLASS ==========

export class PromptManager {
  private templates: Map<string, PromptTemplate>
  private cache: Map<string, PromptCacheEntry>
  private options: PromptManagerOptions
  private validators: Map<string, (template: PromptTemplate) => boolean>
  private formatters: Map<string, (context: any) => string>

  constructor(
    options: PromptManagerOptions = {
      enableCaching: true,
      cacheMaxSize: 100,
      cacheExpirationMs: 3600000, // 1 hour
      enableMetrics: true,
      enableValidation: true,
      defaultVersion: '1.0.0',
    }
  ) {
    this.templates = new Map()
    this.cache = new Map()
    this.options = options
    this.validators = new Map()
    this.formatters = new Map()

    this.initializeTemplates()
    this.initializeValidators()
    this.initializeFormatters()
  }

  // ========== INITIALIZATION ==========

  private initializeTemplates(): void {
    // Load negotiation templates
    this.loadNegotiationTemplates()

    // Load analysis templates
    this.loadAnalysisTemplates()

    // Load document templates
    this.loadDocumentTemplates()
  }

  private loadNegotiationTemplates(): void {
    Object.entries(NEGOTIATION_PROMPT_TEMPLATES).forEach(([key, template]) => {
      const promptTemplate: PromptTemplate = {
        id: `negotiation-${key.toLowerCase()}`,
        name: key.replace(/_/g, ' ').toLowerCase(),
        description: `Negotiation prompt template for ${key.replace(/_/g, ' ').toLowerCase()}`,
        version: this.options.defaultVersion,
        category: 'negotiation',
        type: 'chat',
        template,
        systemTemplate: NEGOTIATION_SYSTEM_TEMPLATES.STRATEGIC_ADVISOR,
        variables: this.extractVariables(template),
        metadata: {
          author: 'system',
          tags: ['negotiation', 'real-estate', 'strategy'],
          usageCount: 0,
          performance: {
            averageTokens: 0,
            averageResponseTime: 0,
            successRate: 1.0,
            lastUsed: new Date().toISOString(),
          },
          validationRules: [
            {
              type: 'required_variable',
              value: ['context', 'aggressiveness', 'riskTolerance'],
              message: 'Required variables must be provided',
            },
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.templates.set(promptTemplate.id, promptTemplate)
    })
  }

  private loadAnalysisTemplates(): void {
    Object.entries(ANALYSIS_PROMPT_TEMPLATES).forEach(([key, template]) => {
      const promptTemplate: PromptTemplate = {
        id: `analysis-${key.toLowerCase()}`,
        name: key.replace(/_/g, ' ').toLowerCase(),
        description: `Analysis prompt template for ${key.replace(/_/g, ' ').toLowerCase()}`,
        version: this.options.defaultVersion,
        category: 'analysis',
        type: 'chat',
        template,
        systemTemplate: ANALYSIS_SYSTEM_TEMPLATES.ANALYTICAL,
        variables: this.extractVariables(template),
        metadata: {
          author: 'system',
          tags: ['analysis', 'real-estate', 'offers'],
          usageCount: 0,
          performance: {
            averageTokens: 0,
            averageResponseTime: 0,
            successRate: 1.0,
            lastUsed: new Date().toISOString(),
          },
          validationRules: [
            {
              type: 'required_variable',
              value: ['context', 'perspective', 'depth'],
              message: 'Required variables must be provided',
            },
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.templates.set(promptTemplate.id, promptTemplate)
    })
  }

  private loadDocumentTemplates(): void {
    Object.entries(DOCUMENT_PROMPT_TEMPLATES).forEach(([key, template]) => {
      const promptTemplate: PromptTemplate = {
        id: `document-${key.toLowerCase()}`,
        name: key.replace(/_/g, ' ').toLowerCase(),
        description: `Document prompt template for ${key.replace(/_/g, ' ').toLowerCase()}`,
        version: this.options.defaultVersion,
        category: 'document',
        type: 'chat',
        template,
        systemTemplate: DOCUMENT_SYSTEM_TEMPLATES.PROFESSIONAL,
        variables: this.extractVariables(template),
        metadata: {
          author: 'system',
          tags: ['document', 'real-estate', 'writing'],
          usageCount: 0,
          performance: {
            averageTokens: 0,
            averageResponseTime: 0,
            successRate: 1.0,
            lastUsed: new Date().toISOString(),
          },
          validationRules: [
            {
              type: 'required_variable',
              value: ['context', 'tone', 'length'],
              message: 'Required variables must be provided',
            },
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.templates.set(promptTemplate.id, promptTemplate)
    })
  }

  private initializeValidators(): void {
    this.validators.set('required_variable', (template: PromptTemplate) => {
      const requiredVars = template.metadata.validationRules
        .filter(rule => rule.type === 'required_variable')
        .flatMap(rule => rule.value)

      return requiredVars.every(variable =>
        template.variables.includes(variable)
      )
    })

    this.validators.set('max_length', (template: PromptTemplate) => {
      const maxLengthRules = template.metadata.validationRules.filter(
        rule => rule.type === 'max_length'
      )

      if (maxLengthRules.length === 0) return true

      const templateString = template.template.toString()
      return maxLengthRules.every(rule => templateString.length <= rule.value)
    })
  }

  private initializeFormatters(): void {
    this.formatters.set('negotiation', formatNegotiationContext)
    this.formatters.set('analysis', formatAnalysisContext)
    this.formatters.set('cover_letter', formatCoverLetterContext)
    this.formatters.set('memo', formatMemoContext)
  }

  // ========== TEMPLATE MANAGEMENT ==========

  getTemplate(id: string): PromptTemplate | undefined {
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.cache.get(id)
      if (cached) {
        cached.lastAccessed = new Date().toISOString()
        cached.accessCount++
        return this.templates.get(id)
      }
    }

    const template = this.templates.get(id)
    if (template) {
      this.updateMetrics(template)

      // Cache the template
      if (this.options.enableCaching) {
        this.cacheTemplate(id, template)
      }
    }

    return template
  }

  getTemplateByName(
    name: string,
    category?: PromptCategory
  ): PromptTemplate | undefined {
    for (const template of this.templates.values()) {
      if (
        template.name === name &&
        (!category || template.category === category)
      ) {
        return this.getTemplate(template.id)
      }
    }
    return undefined
  }

  getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    )
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  // ========== TEMPLATE CREATION AND UPDATES ==========

  createTemplate(templateData: Partial<PromptTemplate>): string {
    const id = templateData.id || `custom-${Date.now()}`

    const template: PromptTemplate = {
      id,
      name: templateData.name || 'Custom Template',
      description: templateData.description || 'Custom prompt template',
      version: templateData.version || this.options.defaultVersion,
      category: templateData.category || 'general',
      type: templateData.type || 'chat',
      template: templateData.template || ChatPromptTemplate.fromMessages([]),
      systemTemplate: templateData.systemTemplate,
      variables: templateData.variables || [],
      metadata: {
        author: templateData.metadata?.author || 'user',
        tags: templateData.metadata?.tags || [],
        usageCount: 0,
        performance: {
          averageTokens: 0,
          averageResponseTime: 0,
          successRate: 1.0,
          lastUsed: new Date().toISOString(),
        },
        validationRules: templateData.metadata?.validationRules || [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (this.options.enableValidation) {
      this.validateTemplate(template)
    }

    this.templates.set(id, template)
    return id
  }

  updateTemplate(id: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.templates.get(id)
    if (!template) return false

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    if (this.options.enableValidation) {
      this.validateTemplate(updatedTemplate)
    }

    this.templates.set(id, updatedTemplate)

    // Clear cache for this template
    if (this.options.enableCaching) {
      this.cache.delete(id)
    }

    return true
  }

  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id)

    if (deleted && this.options.enableCaching) {
      this.cache.delete(id)
    }

    return deleted
  }

  // ========== TEMPLATE FORMATTING ==========

  formatTemplate(id: string, context: any): string {
    const template = this.getTemplate(id)
    if (!template) {
      throw new Error(`Template ${id} not found`)
    }

    const formatter = this.formatters.get(template.category)
    if (formatter) {
      return formatter(context)
    }

    // Default JSON formatting
    return JSON.stringify(context, null, 2)
  }

  async renderTemplate(
    id: string,
    variables: Record<string, any>
  ): Promise<string> {
    const template = this.getTemplate(id)
    if (!template) {
      throw new Error(`Template ${id} not found`)
    }

    try {
      const rendered = await template.template.format(variables)

      // Update performance metrics
      if (this.options.enableMetrics) {
        this.updatePerformanceMetrics(template, rendered.length, true)
      }

      return rendered
    } catch (error) {
      if (this.options.enableMetrics) {
        this.updatePerformanceMetrics(template, 0, false)
      }
      throw error
    }
  }

  // ========== VALIDATION ==========

  validateTemplate(template: PromptTemplate): boolean {
    if (!this.options.enableValidation) return true

    for (const rule of template.metadata.validationRules) {
      const validator = this.validators.get(rule.type)
      if (validator && !validator(template)) {
        throw new Error(`Template validation failed: ${rule.message}`)
      }
    }

    return true
  }

  // ========== PERFORMANCE METRICS ==========

  private updateMetrics(template: PromptTemplate): void {
    if (!this.options.enableMetrics) return

    template.metadata.usageCount++
    template.metadata.performance.lastUsed = new Date().toISOString()
  }

  private updatePerformanceMetrics(
    template: PromptTemplate,
    tokens: number,
    success: boolean
  ): void {
    const performance = template.metadata.performance
    const usageCount = template.metadata.usageCount

    // Update average tokens
    performance.averageTokens =
      (performance.averageTokens * (usageCount - 1) + tokens) / usageCount

    // Update success rate
    performance.successRate =
      (performance.successRate * (usageCount - 1) + (success ? 1 : 0)) /
      usageCount
  }

  // ========== CACHING ==========

  private cacheTemplate(id: string, template: PromptTemplate): void {
    if (this.cache.size >= this.options.cacheMaxSize) {
      // Remove oldest cache entry
      const oldestEntry = Array.from(this.cache.entries()).sort(
        (a, b) =>
          new Date(a[1].lastAccessed).getTime() -
          new Date(b[1].lastAccessed).getTime()
      )[0]

      if (oldestEntry) {
        this.cache.delete(oldestEntry[0])
      }
    }

    this.cache.set(id, {
      template: template.template,
      variables: template.variables,
      lastAccessed: new Date().toISOString(),
      accessCount: 1,
    })
  }

  clearCache(): void {
    this.cache.clear()
  }

  // ========== UTILITY METHODS ==========

  private extractVariables(template: ChatPromptTemplate): string[] {
    try {
      const templateStr = template.toString()
      const variableRegex = /\{([^}]+)\}/g
      const variables: string[] = []
      let match

      while ((match = variableRegex.exec(templateStr)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1])
        }
      }

      return variables
    } catch (error) {
      return []
    }
  }

  getTemplateMetrics(): {
    totalTemplates: number
    categoryCounts: Record<PromptCategory, number>
    cacheHitRate: number
    averageUsage: number
  } {
    const templates = Array.from(this.templates.values())
    const categoryCounts = templates.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1
        return acc
      },
      {} as Record<PromptCategory, number>
    )

    const totalUsage = templates.reduce(
      (sum, template) => sum + template.metadata.usageCount,
      0
    )

    const cacheHitRate =
      this.cache.size > 0
        ? Array.from(this.cache.values()).reduce(
            (sum, entry) => sum + entry.accessCount,
            0
          ) / this.cache.size
        : 0

    return {
      totalTemplates: templates.length,
      categoryCounts,
      cacheHitRate,
      averageUsage: templates.length > 0 ? totalUsage / templates.length : 0,
    }
  }

  // ========== TEMPLATE SEARCH ==========

  searchTemplates(query: string, category?: PromptCategory): PromptTemplate[] {
    const templates = category
      ? this.getTemplatesByCategory(category)
      : this.getAllTemplates()

    const lowercaseQuery = query.toLowerCase()

    return templates.filter(
      template =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.metadata.tags.some(tag =>
          tag.toLowerCase().includes(lowercaseQuery)
        )
    )
  }

  // ========== EXPORT/IMPORT ==========

  exportTemplates(category?: PromptCategory): string {
    const templates = category
      ? this.getTemplatesByCategory(category)
      : this.getAllTemplates()

    return JSON.stringify(templates, null, 2)
  }

  importTemplates(templatesJson: string): number {
    try {
      const templates = JSON.parse(templatesJson)
      let imported = 0

      for (const templateData of templates) {
        try {
          this.createTemplate(templateData)
          imported++
        } catch (error) {
          console.warn(`Failed to import template ${templateData.id}:`, error)
        }
      }

      return imported
    } catch (error) {
      throw new Error(`Failed to import templates: ${error}`)
    }
  }
}

// ========== SINGLETON INSTANCE ==========

export const promptManager = new PromptManager()

// ========== UTILITY FUNCTIONS ==========

export const getPromptTemplate = (id: string) => promptManager.getTemplate(id)

export const renderPrompt = (id: string, variables: Record<string, any>) =>
  promptManager.renderTemplate(id, variables)

export const searchPrompts = (query: string, category?: PromptCategory) =>
  promptManager.searchTemplates(query, category)

export const createCustomPrompt = (templateData: Partial<PromptTemplate>) =>
  promptManager.createTemplate(templateData)

export const getPromptMetrics = () => promptManager.getTemplateMetrics()

export default promptManager
