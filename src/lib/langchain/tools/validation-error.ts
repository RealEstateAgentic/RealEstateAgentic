/**
 * Validation and Error Handling Tools for LangChain
 *
 * LangChain tools for data validation, error checking, and quality assurance
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// ========== VALIDATION TOOLS ==========

/**
 * Property Data Validator Tool
 */
export class PropertyDataValidatorTool extends Tool {
  name = 'property_data_validator'
  description =
    'Validate property data for completeness, accuracy, and consistency'

  schema = z.object({
    propertyData: z
      .object({
        address: z.string().describe('Property address'),
        price: z.number().describe('Property price'),
        bedrooms: z.number().describe('Number of bedrooms'),
        bathrooms: z.number().describe('Number of bathrooms'),
        squareFootage: z.number().describe('Square footage'),
        yearBuilt: z.number().describe('Year built'),
        propertyType: z.string().describe('Property type'),
        lotSize: z.number().optional().describe('Lot size'),
        parking: z.number().optional().describe('Parking spaces'),
        features: z.array(z.string()).optional().describe('Property features'),
      })
      .describe('Property data to validate'),
    validationRules: z
      .object({
        strictMode: z.boolean().optional().describe('Enable strict validation'),
        checkMarketRanges: z
          .boolean()
          .optional()
          .describe('Validate against market ranges'),
        requireAllFields: z
          .boolean()
          .optional()
          .describe('Require all optional fields'),
        customRules: z
          .array(
            z.object({
              field: z.string().describe('Field to validate'),
              rule: z.string().describe('Validation rule'),
              message: z.string().describe('Error message'),
            })
          )
          .optional()
          .describe('Custom validation rules'),
      })
      .optional()
      .describe('Validation configuration'),
    marketContext: z
      .object({
        location: z.string().describe('Market location'),
        averagePrice: z.number().optional().describe('Average market price'),
        priceRange: z
          .object({
            min: z.number().describe('Minimum price'),
            max: z.number().describe('Maximum price'),
          })
          .optional()
          .describe('Expected price range'),
        typicalFeatures: z
          .array(z.string())
          .optional()
          .describe('Typical features for this market'),
      })
      .optional()
      .describe('Market context for validation'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { propertyData, validationRules = {}, marketContext } = input

      // Perform validation checks
      const validationResults = this.validatePropertyData(
        propertyData,
        validationRules,
        marketContext
      )

      // Generate validation score
      const score = this.calculateValidationScore(validationResults)

      // Provide recommendations
      const recommendations =
        this.generateValidationRecommendations(validationResults)

      return JSON.stringify({
        success: true,
        validation: {
          isValid: validationResults.errors.length === 0,
          score,
          summary: this.generateValidationSummary(validationResults, score),
        },
        results: validationResults,
        recommendations,
        dataQuality: {
          completeness: this.calculateCompleteness(propertyData),
          consistency: this.calculateConsistency(propertyData),
          accuracy: this.calculateAccuracy(propertyData, marketContext),
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private validatePropertyData(data: any, rules: any, market?: any) {
    const errors = []
    const warnings = []
    const passed = []

    // Basic field validation
    if (!data.address || data.address.trim().length === 0) {
      errors.push({
        field: 'address',
        message: 'Address is required and cannot be empty',
        severity: 'error',
      })
    } else if (data.address.length < 10) {
      warnings.push({
        field: 'address',
        message: 'Address seems incomplete (less than 10 characters)',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'address',
        message: 'Address format is valid',
      })
    }

    // Price validation
    if (!data.price || data.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Price must be a positive number',
        severity: 'error',
      })
    } else if (data.price < 10000) {
      warnings.push({
        field: 'price',
        message: 'Price seems unusually low',
        severity: 'warning',
      })
    } else if (data.price > 50000000) {
      warnings.push({
        field: 'price',
        message: 'Price seems unusually high',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'price',
        message: 'Price is within reasonable range',
      })
    }

    // Bedrooms validation
    if (!Number.isInteger(data.bedrooms) || data.bedrooms < 0) {
      errors.push({
        field: 'bedrooms',
        message: 'Bedrooms must be a non-negative integer',
        severity: 'error',
      })
    } else if (data.bedrooms === 0) {
      warnings.push({
        field: 'bedrooms',
        message: 'Studio apartment (0 bedrooms) - verify this is correct',
        severity: 'warning',
      })
    } else if (data.bedrooms > 10) {
      warnings.push({
        field: 'bedrooms',
        message: 'Unusually high number of bedrooms',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'bedrooms',
        message: 'Bedroom count is valid',
      })
    }

    // Bathrooms validation
    if (!data.bathrooms || data.bathrooms <= 0) {
      errors.push({
        field: 'bathrooms',
        message: 'Bathrooms must be a positive number',
        severity: 'error',
      })
    } else if (data.bathrooms > data.bedrooms * 2) {
      warnings.push({
        field: 'bathrooms',
        message: 'Unusually high bathroom to bedroom ratio',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'bathrooms',
        message: 'Bathroom count is reasonable',
      })
    }

    // Square footage validation
    if (!data.squareFootage || data.squareFootage <= 0) {
      errors.push({
        field: 'squareFootage',
        message: 'Square footage must be a positive number',
        severity: 'error',
      })
    } else if (data.squareFootage < 300) {
      warnings.push({
        field: 'squareFootage',
        message: 'Very small square footage - verify measurement',
        severity: 'warning',
      })
    } else if (data.squareFootage > 20000) {
      warnings.push({
        field: 'squareFootage',
        message: 'Very large square footage - verify measurement',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'squareFootage',
        message: 'Square footage is within normal range',
      })
    }

    // Year built validation
    const currentYear = new Date().getFullYear()
    if (
      !data.yearBuilt ||
      data.yearBuilt < 1800 ||
      data.yearBuilt > currentYear + 2
    ) {
      errors.push({
        field: 'yearBuilt',
        message: `Year built must be between 1800 and ${currentYear + 2}`,
        severity: 'error',
      })
    } else if (data.yearBuilt > currentYear) {
      warnings.push({
        field: 'yearBuilt',
        message: 'Future construction date - verify this is correct',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'yearBuilt',
        message: 'Year built is valid',
      })
    }

    // Property type validation
    const validTypes = [
      'single_family',
      'condo',
      'townhouse',
      'duplex',
      'apartment',
      'multi_family',
      'mobile_home',
      'land',
    ]
    if (
      !data.propertyType ||
      !validTypes.includes(data.propertyType.toLowerCase().replace(/\s+/g, '_'))
    ) {
      warnings.push({
        field: 'propertyType',
        message:
          'Property type should be standardized (e.g., single_family, condo, townhouse)',
        severity: 'warning',
      })
    } else {
      passed.push({
        field: 'propertyType',
        message: 'Property type is standardized',
      })
    }

    // Cross-field validation
    if (data.price && data.squareFootage) {
      const pricePerSqFt = data.price / data.squareFootage
      if (pricePerSqFt < 50) {
        warnings.push({
          field: 'price_per_sqft',
          message: `Very low price per square foot ($${pricePerSqFt.toFixed(2)})`,
          severity: 'warning',
        })
      } else if (pricePerSqFt > 1000) {
        warnings.push({
          field: 'price_per_sqft',
          message: `Very high price per square foot ($${pricePerSqFt.toFixed(2)})`,
          severity: 'warning',
        })
      } else {
        passed.push({
          field: 'price_per_sqft',
          message: `Price per square foot ($${pricePerSqFt.toFixed(2)}) is reasonable`,
        })
      }
    }

    // Market context validation
    if (market && market.priceRange) {
      if (
        data.price < market.priceRange.min ||
        data.price > market.priceRange.max
      ) {
        warnings.push({
          field: 'market_price',
          message: `Price is outside typical market range for ${market.location}`,
          severity: 'warning',
        })
      } else {
        passed.push({
          field: 'market_price',
          message: 'Price is within market range',
        })
      }
    }

    // Custom rules validation
    if (rules.customRules) {
      rules.customRules.forEach((rule: any) => {
        const fieldValue = data[rule.field]
        const isValid = this.evaluateCustomRule(fieldValue, rule.rule)

        if (!isValid) {
          errors.push({
            field: rule.field,
            message: rule.message,
            severity: 'error',
            custom: true,
          })
        }
      })
    }

    // Required fields check
    if (rules.requireAllFields) {
      const optionalFields = ['lotSize', 'parking', 'features']
      optionalFields.forEach(field => {
        if (!data[field]) {
          warnings.push({
            field,
            message: `${field} is missing (required in strict mode)`,
            severity: 'warning',
          })
        }
      })
    }

    return { errors, warnings, passed }
  }

  private evaluateCustomRule(value: any, rule: string): boolean {
    try {
      // Simple rule evaluation - in production, use a proper expression evaluator
      const ruleFunction = new Function('value', `return ${rule}`)
      return ruleFunction(value)
    } catch {
      return true // Don't fail on invalid rules
    }
  }

  private calculateValidationScore(results: any): number {
    const totalChecks =
      results.errors.length + results.warnings.length + results.passed.length
    if (totalChecks === 0) return 0

    const errorWeight = -2
    const warningWeight = -0.5
    const passedWeight = 1

    const score =
      ((results.errors.length * errorWeight +
        results.warnings.length * warningWeight +
        results.passed.length * passedWeight) /
        totalChecks) *
      100

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private calculateCompleteness(data: any): number {
    const allFields = [
      'address',
      'price',
      'bedrooms',
      'bathrooms',
      'squareFootage',
      'yearBuilt',
      'propertyType',
      'lotSize',
      'parking',
      'features',
    ]
    const filledFields = allFields.filter(
      field =>
        data[field] !== undefined && data[field] !== null && data[field] !== ''
    )

    return Math.round((filledFields.length / allFields.length) * 100)
  }

  private calculateConsistency(data: any): number {
    let consistencyScore = 100

    // Check bedroom to bathroom ratio
    if (data.bedrooms && data.bathrooms) {
      const ratio = data.bathrooms / data.bedrooms
      if (ratio > 2 || ratio < 0.3) consistencyScore -= 20
    }

    // Check price to square footage ratio
    if (data.price && data.squareFootage) {
      const pricePerSqFt = data.price / data.squareFootage
      if (pricePerSqFt < 50 || pricePerSqFt > 1000) consistencyScore -= 15
    }

    // Check year built consistency
    if (data.yearBuilt) {
      const age = new Date().getFullYear() - data.yearBuilt
      if (age < 0 || age > 200) consistencyScore -= 25
    }

    return Math.max(0, consistencyScore)
  }

  private calculateAccuracy(data: any, market?: any): number {
    let accuracyScore = 100

    // Market price accuracy
    if (market && market.averagePrice && data.price) {
      const deviation =
        Math.abs(data.price - market.averagePrice) / market.averagePrice
      if (deviation > 2) accuracyScore -= 30
      else if (deviation > 1) accuracyScore -= 15
    }

    // Address format accuracy
    if (data.address && data.address.length < 10) {
      accuracyScore -= 20
    }

    return Math.max(0, accuracyScore)
  }

  private generateValidationSummary(results: any, score: number): string {
    const errorCount = results.errors.length
    const warningCount = results.warnings.length
    const passedCount = results.passed.length

    if (errorCount === 0 && warningCount === 0) {
      return 'All validation checks passed successfully'
    } else if (errorCount === 0) {
      return `${passedCount} checks passed with ${warningCount} warnings`
    } else {
      return `${errorCount} critical errors and ${warningCount} warnings found`
    }
  }

  private generateValidationRecommendations(results: any): string[] {
    const recommendations = []

    if (results.errors.length > 0) {
      recommendations.push(
        'Fix critical errors before proceeding with property listing'
      )
    }

    if (results.warnings.length > 3) {
      recommendations.push(
        'Review and verify the flagged data points for accuracy'
      )
    }

    const addressErrors = results.errors.filter(
      (e: any) => e.field === 'address'
    )
    if (addressErrors.length > 0) {
      recommendations.push(
        'Ensure the property address is complete and properly formatted'
      )
    }

    const priceWarnings = results.warnings.filter((w: any) =>
      w.field.includes('price')
    )
    if (priceWarnings.length > 0) {
      recommendations.push(
        'Verify pricing information against local market data'
      )
    }

    return recommendations
  }
}

/**
 * Document Quality Checker Tool
 */
export class DocumentQualityCheckerTool extends Tool {
  name = 'document_quality_checker'
  description =
    'Check document quality, completeness, and professional standards'

  schema = z.object({
    document: z
      .object({
        type: z
          .enum([
            'cover_letter',
            'explanation_memo',
            'offer_analysis',
            'market_report',
            'negotiation_strategy',
          ])
          .describe('Document type'),
        title: z.string().describe('Document title'),
        content: z.string().describe('Document content'),
        sections: z
          .array(
            z.object({
              title: z.string().describe('Section title'),
              content: z.string().describe('Section content'),
              required: z
                .boolean()
                .optional()
                .describe('Whether section is required'),
            })
          )
          .optional()
          .describe('Document sections'),
        metadata: z
          .object({
            author: z.string().optional().describe('Document author'),
            date: z.string().optional().describe('Document date'),
            version: z.string().optional().describe('Document version'),
          })
          .optional()
          .describe('Document metadata'),
      })
      .describe('Document to check'),
    qualityStandards: z
      .object({
        minWordCount: z.number().optional().describe('Minimum word count'),
        maxWordCount: z.number().optional().describe('Maximum word count'),
        requiredSections: z
          .array(z.string())
          .optional()
          .describe('Required section titles'),
        professionalTone: z
          .boolean()
          .optional()
          .describe('Check for professional tone'),
        grammarCheck: z
          .boolean()
          .optional()
          .describe('Enable grammar checking'),
        spellCheck: z.boolean().optional().describe('Enable spell checking'),
        readabilityCheck: z
          .boolean()
          .optional()
          .describe('Check readability score'),
      })
      .optional()
      .describe('Quality standards to apply'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { document, qualityStandards = {} } = input

      // Perform quality checks
      const qualityResults = this.checkDocumentQuality(
        document,
        qualityStandards
      )

      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(qualityResults)

      // Generate improvement suggestions
      const improvements = this.generateImprovementSuggestions(
        qualityResults,
        document
      )

      return JSON.stringify({
        success: true,
        quality: {
          score: qualityScore,
          grade: this.getQualityGrade(qualityScore),
          summary: this.generateQualitySummary(qualityResults, qualityScore),
        },
        checks: qualityResults,
        improvements,
        statistics: {
          wordCount: this.countWords(document.content),
          sentenceCount: this.countSentences(document.content),
          paragraphCount: this.countParagraphs(document.content),
          readabilityScore: this.calculateReadabilityScore(document.content),
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private checkDocumentQuality(document: any, standards: any) {
    const checks = {
      structure: [],
      content: [],
      professional: [],
      technical: [],
    }

    // Structure checks
    if (!document.title || document.title.trim().length === 0) {
      checks.structure.push({
        type: 'error',
        message: 'Document must have a title',
        field: 'title',
      })
    } else if (document.title.length > 100) {
      checks.structure.push({
        type: 'warning',
        message: 'Title is very long (over 100 characters)',
        field: 'title',
      })
    } else {
      checks.structure.push({
        type: 'pass',
        message: 'Title is appropriate length',
        field: 'title',
      })
    }

    // Content length checks
    const wordCount = this.countWords(document.content)
    if (standards.minWordCount && wordCount < standards.minWordCount) {
      checks.content.push({
        type: 'error',
        message: `Content is too short (${wordCount} words, minimum ${standards.minWordCount})`,
        field: 'content_length',
      })
    } else if (standards.maxWordCount && wordCount > standards.maxWordCount) {
      checks.content.push({
        type: 'warning',
        message: `Content is very long (${wordCount} words, maximum ${standards.maxWordCount})`,
        field: 'content_length',
      })
    } else {
      checks.content.push({
        type: 'pass',
        message: `Content length is appropriate (${wordCount} words)`,
        field: 'content_length',
      })
    }

    // Required sections check
    if (standards.requiredSections && document.sections) {
      const sectionTitles = document.sections.map((s: any) =>
        s.title.toLowerCase()
      )
      standards.requiredSections.forEach((required: string) => {
        const found = sectionTitles.some(title =>
          title.includes(required.toLowerCase())
        )
        if (!found) {
          checks.structure.push({
            type: 'error',
            message: `Missing required section: ${required}`,
            field: 'sections',
          })
        } else {
          checks.structure.push({
            type: 'pass',
            message: `Required section found: ${required}`,
            field: 'sections',
          })
        }
      })
    }

    // Professional tone check
    if (standards.professionalTone) {
      const toneCheck = this.checkProfessionalTone(document.content)
      checks.professional.push(...toneCheck)
    }

    // Grammar and spelling checks (simplified)
    if (standards.grammarCheck) {
      const grammarIssues = this.basicGrammarCheck(document.content)
      checks.technical.push(...grammarIssues)
    }

    // Readability check
    if (standards.readabilityCheck) {
      const readabilityScore = this.calculateReadabilityScore(document.content)
      if (readabilityScore < 30) {
        checks.content.push({
          type: 'warning',
          message: 'Content may be difficult to read (low readability score)',
          field: 'readability',
        })
      } else if (readabilityScore > 80) {
        checks.content.push({
          type: 'pass',
          message: 'Content is highly readable',
          field: 'readability',
        })
      } else {
        checks.content.push({
          type: 'pass',
          message: 'Content readability is acceptable',
          field: 'readability',
        })
      }
    }

    return checks
  }

  private checkProfessionalTone(content: string) {
    const checks = []
    const lowerContent = content.toLowerCase()

    // Check for informal language
    const informalWords = [
      'awesome',
      'cool',
      'super',
      'crazy',
      'amazing',
      'unbelievable',
    ]
    const foundInformal = informalWords.filter(word =>
      lowerContent.includes(word)
    )

    if (foundInformal.length > 0) {
      checks.push({
        type: 'warning',
        message: `Consider replacing informal language: ${foundInformal.join(', ')}`,
        field: 'tone',
      })
    }

    // Check for appropriate salutations
    if (
      !lowerContent.includes('dear') &&
      !lowerContent.includes('hello') &&
      !lowerContent.includes('greetings')
    ) {
      checks.push({
        type: 'warning',
        message: 'Consider adding a professional greeting',
        field: 'greeting',
      })
    }

    // Check for first person usage balance
    const firstPersonCount = (content.match(/\b(I|we|my|our)\b/gi) || []).length
    const totalWords = this.countWords(content)
    const firstPersonRatio = firstPersonCount / totalWords

    if (firstPersonRatio > 0.1) {
      checks.push({
        type: 'warning',
        message:
          'High usage of first person pronouns - consider more objective language',
        field: 'tone',
      })
    }

    return checks
  }

  private basicGrammarCheck(content: string) {
    const checks = []

    // Check for basic punctuation issues
    const sentences = content.split(/[.!?]+/)
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim()
      if (trimmed.length > 0) {
        // Check if sentence starts with capital letter
        if (trimmed[0] !== trimmed[0].toUpperCase()) {
          checks.push({
            type: 'warning',
            message: `Sentence ${index + 1} should start with a capital letter`,
            field: 'capitalization',
          })
        }
      }
    })

    // Check for double spaces
    if (content.includes('  ')) {
      checks.push({
        type: 'warning',
        message: 'Found multiple consecutive spaces',
        field: 'formatting',
      })
    }

    // Check for missing spaces after periods
    if (content.match(/\.[a-zA-Z]/)) {
      checks.push({
        type: 'warning',
        message: 'Missing space after period',
        field: 'punctuation',
      })
    }

    return checks
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
      .length
  }

  private countParagraphs(text: string): number {
    return text
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim().length > 0).length
  }

  private calculateReadabilityScore(text: string): number {
    const words = this.countWords(text)
    const sentences = this.countSentences(text)
    const syllables = this.countSyllables(text)

    if (sentences === 0 || words === 0) return 0

    // Simplified Flesch Reading Ease formula
    const score =
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || []
    return words.reduce((total, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1
      return total + Math.max(1, syllableCount)
    }, 0)
  }

  private calculateQualityScore(checks: any): number {
    let totalScore = 100
    let totalChecks = 0

    Object.values(checks).forEach((categoryChecks: any) => {
      categoryChecks.forEach((check: any) => {
        totalChecks++
        if (check.type === 'error') {
          totalScore -= 10
        } else if (check.type === 'warning') {
          totalScore -= 5
        }
      })
    })

    return Math.max(0, Math.min(100, totalScore))
  }

  private getQualityGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private generateQualitySummary(checks: any, score: number): string {
    const totalErrors = Object.values(checks).reduce(
      (sum: number, categoryChecks: any) =>
        sum + categoryChecks.filter((c: any) => c.type === 'error').length,
      0
    )
    const totalWarnings = Object.values(checks).reduce(
      (sum: number, categoryChecks: any) =>
        sum + categoryChecks.filter((c: any) => c.type === 'warning').length,
      0
    )

    if (totalErrors === 0 && totalWarnings === 0) {
      return 'Document meets all quality standards'
    } else if (totalErrors === 0) {
      return `Document is good quality with ${totalWarnings} minor improvements suggested`
    } else {
      return `Document needs improvement: ${totalErrors} critical issues, ${totalWarnings} warnings`
    }
  }

  private generateImprovementSuggestions(checks: any, document: any): string[] {
    const suggestions = []

    // Structure improvements
    const structureErrors = checks.structure.filter(
      (c: any) => c.type === 'error'
    )
    if (structureErrors.length > 0) {
      suggestions.push('Fix document structure issues before finalizing')
    }

    // Content improvements
    const contentIssues = checks.content.filter(
      (c: any) => c.type === 'error' || c.type === 'warning'
    )
    if (contentIssues.length > 0) {
      suggestions.push('Review and improve content quality and length')
    }

    // Professional tone improvements
    const toneIssues = checks.professional.filter(
      (c: any) => c.type === 'warning'
    )
    if (toneIssues.length > 0) {
      suggestions.push('Enhance professional tone and language')
    }

    // Technical improvements
    const technicalIssues = checks.technical.filter(
      (c: any) => c.type === 'warning'
    )
    if (technicalIssues.length > 0) {
      suggestions.push('Proofread for grammar and formatting issues')
    }

    // Word count specific suggestions
    const wordCount = this.countWords(document.content)
    if (wordCount < 100) {
      suggestions.push(
        'Consider adding more detailed information to strengthen the document'
      )
    } else if (wordCount > 1000) {
      suggestions.push('Consider condensing content for better readability')
    }

    return suggestions
  }
}

/**
 * Error Handler Tool
 */
export class ErrorHandlerTool extends Tool {
  name = 'error_handler'
  description = 'Handle and categorize errors with suggested solutions'

  schema = z.object({
    error: z
      .object({
        message: z.string().describe('Error message'),
        code: z.string().optional().describe('Error code'),
        type: z.string().optional().describe('Error type'),
        context: z.record(z.any()).optional().describe('Error context data'),
        stackTrace: z.string().optional().describe('Stack trace'),
        source: z
          .string()
          .optional()
          .describe('Error source (e.g., API, validation, database)'),
      })
      .describe('Error information'),
    userAction: z
      .string()
      .optional()
      .describe('What the user was trying to do when error occurred'),
    systemContext: z
      .object({
        component: z
          .string()
          .optional()
          .describe('System component where error occurred'),
        operation: z.string().optional().describe('Operation being performed'),
        dataInvolved: z
          .record(z.any())
          .optional()
          .describe('Data involved in the operation'),
      })
      .optional()
      .describe('System context'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { error, userAction, systemContext } = input

      // Categorize the error
      const category = this.categorizeError(error)

      // Determine severity
      const severity = this.determineSeverity(error, category)

      // Generate user-friendly message
      const userMessage = this.generateUserMessage(error, category, userAction)

      // Provide suggested solutions
      const solutions = this.generateSolutions(error, category, systemContext)

      // Identify if this needs immediate attention
      const needsAttention = this.needsImmediateAttention(error, severity)

      return JSON.stringify({
        success: true,
        errorAnalysis: {
          category,
          severity,
          userMessage,
          technicalDetails: {
            originalMessage: error.message,
            code: error.code,
            type: error.type,
            source: error.source,
          },
        },
        solutions,
        recommendations: {
          immediateAction: needsAttention
            ? 'Contact support immediately'
            : 'Try suggested solutions',
          preventiveMeasures: this.generatePreventiveMeasures(category),
          escalation: needsAttention,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          context: systemContext,
          userAction,
        },
      })
    } catch (handlerError: any) {
      return JSON.stringify({
        success: false,
        error: `Error handler failed: ${handlerError.message}`,
        originalError: input.error,
      })
    }
  }

  private categorizeError(error: any): string {
    const message = error.message.toLowerCase()
    const code = error.code?.toLowerCase() || ''
    const type = error.type?.toLowerCase() || ''

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      code.includes('validation')
    ) {
      return 'validation'
    }

    if (
      message.includes('network') ||
      message.includes('connection') ||
      code.includes('network')
    ) {
      return 'network'
    }

    if (
      message.includes('permission') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return 'authorization'
    }

    if (
      message.includes('not found') ||
      code.includes('404') ||
      message.includes('missing')
    ) {
      return 'not_found'
    }

    if (
      message.includes('timeout') ||
      message.includes('slow') ||
      code.includes('timeout')
    ) {
      return 'performance'
    }

    if (
      message.includes('database') ||
      message.includes('sql') ||
      error.source === 'database'
    ) {
      return 'database'
    }

    if (
      message.includes('api') ||
      message.includes('service') ||
      error.source === 'api'
    ) {
      return 'api'
    }

    if (type.includes('type') || message.includes('type')) {
      return 'type_error'
    }

    return 'general'
  }

  private determineSeverity(
    error: any,
    category: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase()

    // Critical errors
    if (category === 'database' && message.includes('corruption'))
      return 'critical'
    if (message.includes('critical') || message.includes('fatal'))
      return 'critical'
    if (category === 'authorization' && message.includes('breach'))
      return 'critical'

    // High severity
    if (category === 'database') return 'high'
    if (category === 'authorization') return 'high'
    if (message.includes('fail') && !message.includes('validation'))
      return 'high'

    // Medium severity
    if (category === 'network') return 'medium'
    if (category === 'performance') return 'medium'
    if (category === 'api') return 'medium'

    // Low severity
    if (category === 'validation') return 'low'
    if (category === 'not_found') return 'low'

    return 'medium'
  }

  private generateUserMessage(
    error: any,
    category: string,
    userAction?: string
  ): string {
    const baseMessage = userAction ? `While ${userAction}, ` : ''

    switch (category) {
      case 'validation':
        return `${baseMessage}some information appears to be invalid or incomplete. Please check your input and try again.`

      case 'network':
        return `${baseMessage}there was a problem connecting to our services. Please check your internet connection and try again.`

      case 'authorization':
        return `${baseMessage}you don't have permission to perform this action. Please contact your administrator if you need access.`

      case 'not_found':
        return `${baseMessage}the requested information could not be found. It may have been moved or deleted.`

      case 'performance':
        return `${baseMessage}the operation is taking longer than expected. Please wait a moment and try again.`

      case 'database':
        return `${baseMessage}there was a problem accessing the database. Our team has been notified and is working on a solution.`

      case 'api':
        return `${baseMessage}there was a problem with an external service. Please try again in a few minutes.`

      case 'type_error':
        return `${baseMessage}there was a problem with the data format. Please verify your information and try again.`

      default:
        return `${baseMessage}an unexpected error occurred. Please try again or contact support if the problem persists.`
    }
  }

  private generateSolutions(
    error: any,
    category: string,
    systemContext?: any
  ): string[] {
    const solutions = []

    switch (category) {
      case 'validation':
        solutions.push('Check all required fields are filled correctly')
        solutions.push('Verify data formats (dates, numbers, email addresses)')
        solutions.push(
          'Remove any special characters that might be causing issues'
        )
        break

      case 'network':
        solutions.push('Check your internet connection')
        solutions.push('Try refreshing the page')
        solutions.push("Disable VPN if you're using one")
        solutions.push('Try again in a few minutes')
        break

      case 'authorization':
        solutions.push("Make sure you're logged in with the correct account")
        solutions.push('Contact your administrator for access permissions')
        solutions.push('Try logging out and logging back in')
        break

      case 'not_found':
        solutions.push("Verify the information you're looking for exists")
        solutions.push('Check spelling and formatting of search terms')
        solutions.push('Try using different search criteria')
        break

      case 'performance':
        solutions.push('Wait a moment and try again')
        solutions.push('Try with a smaller amount of data')
        solutions.push('Close other browser tabs to free up memory')
        break

      case 'database':
        solutions.push('Try again in a few minutes')
        solutions.push('Contact support if the problem persists')
        break

      case 'api':
        solutions.push('Wait a few minutes and try again')
        solutions.push('Check if the external service is experiencing issues')
        solutions.push('Contact support if the problem continues')
        break

      default:
        solutions.push('Try refreshing the page')
        solutions.push('Clear your browser cache and cookies')
        solutions.push('Try using a different browser')
        solutions.push('Contact support with the error details')
    }

    return solutions
  }

  private needsImmediateAttention(error: any, severity: string): boolean {
    return (
      severity === 'critical' ||
      error.message.toLowerCase().includes('security') ||
      error.message.toLowerCase().includes('breach') ||
      error.message.toLowerCase().includes('corruption')
    )
  }

  private generatePreventiveMeasures(category: string): string[] {
    const measures = []

    switch (category) {
      case 'validation':
        measures.push('Double-check data entry before submitting')
        measures.push('Use form validation features when available')
        break

      case 'network':
        measures.push('Ensure stable internet connection')
        measures.push('Save work frequently')
        break

      case 'authorization':
        measures.push('Keep login credentials secure')
        measures.push('Log out when finished using the system')
        break

      case 'performance':
        measures.push('Work with smaller datasets when possible')
        measures.push('Close unnecessary browser tabs')
        break

      default:
        measures.push('Save work frequently')
        measures.push('Keep the application updated')
    }

    return measures
  }
}

// ========== VALIDATION AND ERROR TOOLS REGISTRY ==========

/**
 * Validation and Error Handling Tools Registry
 */
export const validationErrorTools = {
  propertyDataValidator: new PropertyDataValidatorTool(),
  documentQualityChecker: new DocumentQualityCheckerTool(),
  errorHandler: new ErrorHandlerTool(),
}

/**
 * Get all validation and error handling tools as an array
 */
export const getAllValidationErrorTools = (): Tool[] => {
  return Object.values(validationErrorTools)
}

/**
 * Get validation and error tools by category
 */
export const getValidationErrorToolsByCategory = (
  category: 'validation' | 'quality' | 'error_handling'
) => {
  switch (category) {
    case 'validation':
      return [validationErrorTools.propertyDataValidator]
    case 'quality':
      return [validationErrorTools.documentQualityChecker]
    case 'error_handling':
      return [validationErrorTools.errorHandler]
    default:
      return []
  }
}
