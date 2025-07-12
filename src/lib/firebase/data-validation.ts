/**
 * Data Validation Utilities for AIgent Pro Application
 * Provides validation functions for real estate data structures
 */

import type {
  // Offer types
  Offer,
  OfferComparison,
  CounterOffer,
  OfferDocument,
  OfferWorkflow,
  // Negotiation types
  Negotiation,
  NegotiationStrategy,
  AppraisalScenario,
  NegotiationDocument,
  MarketAnalysis,
  RiskAssessment,
  // Document types
  Document,
  DocumentTemplate,
  DocumentLibrary,
  DocumentShare,
  DocumentAnalytics,
  // Market data types
  MarketData,
  Comparable,
  MarketTrend,
  MarketForecast,
  MarketAlert,
  MarketReport,
  // Base types
  UserRole,
  OfferStatus,
  NegotiationStatus,
  DocumentStatus,
  DocumentCategory,
  PropertyType,
  FinancingType,
  InspectionType,
  ContingencyType,
  NegotiationPhase,
  StrategyType,
  RiskLevel,
  MarketTrendType,
  ForecastType,
  AlertType,
  ReportType,
} from '../../shared/types/offers'
import type { DocumentType } from '../../shared/types/documents'
import type { MarketDataType } from '../../shared/types/market-data'

// ========== VALIDATION RESULT TYPES ==========

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export interface ValidationContext {
  userRole: UserRole
  existingData?: any
  isUpdate?: boolean
  skipOptional?: boolean
}

// ========== VALIDATION UTILITIES ==========

/**
 * Base validation utilities
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex =
      /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
    return phoneRegex.test(phone)
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime())
  }

  static isValidDateString(dateString: string): boolean {
    const date = new Date(dateString)
    return this.isValidDate(date)
  }

  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0 && isFinite(amount)
  }

  static isValidPercentage(percentage: number): boolean {
    return (
      typeof percentage === 'number' && percentage >= 0 && percentage <= 100
    )
  }

  static isValidString(value: any, minLength = 1, maxLength = 1000): boolean {
    return (
      typeof value === 'string' &&
      value.length >= minLength &&
      value.length <= maxLength
    )
  }

  static isValidArray(value: any, minLength = 0, maxLength = 100): boolean {
    return (
      Array.isArray(value) &&
      value.length >= minLength &&
      value.length <= maxLength
    )
  }

  static isValidEnum<T extends string>(
    value: string,
    validValues: T[]
  ): value is T {
    return validValues.includes(value as T)
  }

  static isValidUuid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  static isValidAddress(address: any): boolean {
    return (
      typeof address === 'object' &&
      this.isValidString(address.street) &&
      this.isValidString(address.city) &&
      this.isValidString(address.state) &&
      this.isValidString(address.zipCode)
    )
  }

  static isValidCoordinates(coordinates: any): boolean {
    return (
      typeof coordinates === 'object' &&
      typeof coordinates.latitude === 'number' &&
      typeof coordinates.longitude === 'number' &&
      coordinates.latitude >= -90 &&
      coordinates.latitude <= 90 &&
      coordinates.longitude >= -180 &&
      coordinates.longitude <= 180
    )
  }
}

// ========== OFFER VALIDATION ==========

export class OfferValidator {
  static validate(
    offer: Partial<Offer>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!offer.agentId) {
      errors.push({
        field: 'agentId',
        message: 'Agent ID is required',
        code: 'MISSING_AGENT_ID',
        severity: 'error',
      })
    }

    if (!offer.clientId) {
      errors.push({
        field: 'clientId',
        message: 'Client ID is required',
        code: 'MISSING_CLIENT_ID',
        severity: 'error',
      })
    }

    if (!offer.propertyId) {
      errors.push({
        field: 'propertyId',
        message: 'Property ID is required',
        code: 'MISSING_PROPERTY_ID',
        severity: 'error',
      })
    }

    if (
      !offer.type ||
      !ValidationUtils.isValidEnum(offer.type, ['buyer', 'seller'])
    ) {
      errors.push({
        field: 'type',
        message: 'Valid offer type is required',
        code: 'INVALID_OFFER_TYPE',
        severity: 'error',
      })
    }

    if (
      !offer.status ||
      !ValidationUtils.isValidEnum(offer.status, [
        'draft',
        'submitted',
        'accepted',
        'rejected',
        'countered',
        'expired',
      ])
    ) {
      errors.push({
        field: 'status',
        message: 'Valid offer status is required',
        code: 'INVALID_STATUS',
        severity: 'error',
      })
    }

    // Financial validation
    if (
      !offer.purchasePrice ||
      !ValidationUtils.isValidAmount(offer.purchasePrice)
    ) {
      errors.push({
        field: 'purchasePrice',
        message: 'Valid purchase price is required',
        code: 'INVALID_PURCHASE_PRICE',
        severity: 'error',
      })
    }

    if (
      !offer.earnestMoney ||
      !ValidationUtils.isValidAmount(offer.earnestMoney)
    ) {
      errors.push({
        field: 'earnestMoney',
        message: 'Valid earnest money amount is required',
        code: 'INVALID_EARNEST_MONEY',
        severity: 'error',
      })
    }

    if (
      !offer.downPayment ||
      !ValidationUtils.isValidAmount(offer.downPayment)
    ) {
      errors.push({
        field: 'downPayment',
        message: 'Valid down payment amount is required',
        code: 'INVALID_DOWN_PAYMENT',
        severity: 'error',
      })
    }

    if (!offer.loanAmount || !ValidationUtils.isValidAmount(offer.loanAmount)) {
      errors.push({
        field: 'loanAmount',
        message: 'Valid loan amount is required',
        code: 'INVALID_LOAN_AMOUNT',
        severity: 'error',
      })
    }

    // Date validation
    if (!offer.offerDate || !ValidationUtils.isValidDate(offer.offerDate)) {
      errors.push({
        field: 'offerDate',
        message: 'Valid offer date is required',
        code: 'INVALID_OFFER_DATE',
        severity: 'error',
      })
    }

    if (
      !offer.expirationDate ||
      !ValidationUtils.isValidDate(offer.expirationDate)
    ) {
      errors.push({
        field: 'expirationDate',
        message: 'Valid expiration date is required',
        code: 'INVALID_EXPIRATION_DATE',
        severity: 'error',
      })
    }

    if (!offer.closingDate || !ValidationUtils.isValidDate(offer.closingDate)) {
      errors.push({
        field: 'closingDate',
        message: 'Valid closing date is required',
        code: 'INVALID_CLOSING_DATE',
        severity: 'error',
      })
    }

    // Business logic validation
    if (offer.purchasePrice && offer.downPayment && offer.loanAmount) {
      const expectedLoanAmount = offer.purchasePrice - offer.downPayment
      if (Math.abs(offer.loanAmount - expectedLoanAmount) > 100) {
        warnings.push({
          field: 'loanAmount',
          message: 'Loan amount should equal purchase price minus down payment',
          code: 'LOAN_AMOUNT_MISMATCH',
        })
      }
    }

    if (offer.offerDate && offer.expirationDate) {
      if (offer.expirationDate <= offer.offerDate) {
        errors.push({
          field: 'expirationDate',
          message: 'Expiration date must be after offer date',
          code: 'INVALID_DATE_RANGE',
          severity: 'error',
        })
      }
    }

    if (offer.earnestMoney && offer.purchasePrice) {
      const earnestPercentage = (offer.earnestMoney / offer.purchasePrice) * 100
      if (earnestPercentage < 1) {
        warnings.push({
          field: 'earnestMoney',
          message: 'Earnest money is typically 1-3% of purchase price',
          code: 'LOW_EARNEST_MONEY',
        })
      }
    }

    // Optional fields validation
    if (
      offer.contingencies &&
      !ValidationUtils.isValidArray(offer.contingencies, 0, 20)
    ) {
      errors.push({
        field: 'contingencies',
        message: 'Invalid contingencies array',
        code: 'INVALID_CONTINGENCIES',
        severity: 'error',
      })
    }

    if (
      offer.inspections &&
      !ValidationUtils.isValidArray(offer.inspections, 0, 10)
    ) {
      errors.push({
        field: 'inspections',
        message: 'Invalid inspections array',
        code: 'INVALID_INSPECTIONS',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateFinancialDetails(offer: Partial<Offer>): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Down payment validation
    if (offer.downPayment && offer.purchasePrice) {
      const downPaymentPercentage =
        (offer.downPayment / offer.purchasePrice) * 100
      if (downPaymentPercentage < 5) {
        warnings.push({
          field: 'downPayment',
          message: 'Down payment less than 5% may require PMI',
          code: 'LOW_DOWN_PAYMENT',
        })
      }
      if (downPaymentPercentage > 50) {
        warnings.push({
          field: 'downPayment',
          message: 'Down payment over 50% is unusual',
          code: 'HIGH_DOWN_PAYMENT',
        })
      }
    }

    // Loan-to-value ratio
    if (offer.loanAmount && offer.purchasePrice) {
      const ltvRatio = (offer.loanAmount / offer.purchasePrice) * 100
      if (ltvRatio > 80) {
        warnings.push({
          field: 'loanAmount',
          message: 'LTV ratio over 80% may require PMI',
          code: 'HIGH_LTV',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

// ========== NEGOTIATION VALIDATION ==========

export class NegotiationValidator {
  static validate(
    negotiation: Partial<Negotiation>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!negotiation.agentId) {
      errors.push({
        field: 'agentId',
        message: 'Agent ID is required',
        code: 'MISSING_AGENT_ID',
        severity: 'error',
      })
    }

    if (!negotiation.clientId) {
      errors.push({
        field: 'clientId',
        message: 'Client ID is required',
        code: 'MISSING_CLIENT_ID',
        severity: 'error',
      })
    }

    if (!negotiation.offerId) {
      errors.push({
        field: 'offerId',
        message: 'Offer ID is required',
        code: 'MISSING_OFFER_ID',
        severity: 'error',
      })
    }

    if (!negotiation.propertyId) {
      errors.push({
        field: 'propertyId',
        message: 'Property ID is required',
        code: 'MISSING_PROPERTY_ID',
        severity: 'error',
      })
    }

    if (
      !negotiation.type ||
      !ValidationUtils.isValidEnum(negotiation.type, [
        'buyer_negotiation',
        'seller_negotiation',
      ])
    ) {
      errors.push({
        field: 'type',
        message: 'Valid negotiation type is required',
        code: 'INVALID_NEGOTIATION_TYPE',
        severity: 'error',
      })
    }

    if (
      !negotiation.status ||
      !ValidationUtils.isValidEnum(negotiation.status, [
        'active',
        'completed',
        'stalled',
        'cancelled',
      ])
    ) {
      errors.push({
        field: 'status',
        message: 'Valid negotiation status is required',
        code: 'INVALID_STATUS',
        severity: 'error',
      })
    }

    // Timeline validation
    if (
      negotiation.timeline &&
      !ValidationUtils.isValidArray(negotiation.timeline, 0, 50)
    ) {
      errors.push({
        field: 'timeline',
        message: 'Invalid timeline array',
        code: 'INVALID_TIMELINE',
        severity: 'error',
      })
    }

    // Strategy validation
    if (
      negotiation.strategies &&
      !ValidationUtils.isValidArray(negotiation.strategies, 0, 20)
    ) {
      errors.push({
        field: 'strategies',
        message: 'Invalid strategies array',
        code: 'INVALID_STRATEGIES',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateStrategy(
    strategy: Partial<NegotiationStrategy>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (
      !strategy.type ||
      !ValidationUtils.isValidString(strategy.type, 1, 50)
    ) {
      errors.push({
        field: 'type',
        message: 'Valid strategy type is required',
        code: 'MISSING_STRATEGY_TYPE',
        severity: 'error',
      })
    }

    if (
      !strategy.description ||
      !ValidationUtils.isValidString(strategy.description, 1, 1000)
    ) {
      errors.push({
        field: 'description',
        message: 'Valid strategy description is required',
        code: 'MISSING_DESCRIPTION',
        severity: 'error',
      })
    }

    if (
      strategy.effectiveness &&
      !ValidationUtils.isValidPercentage(strategy.effectiveness)
    ) {
      errors.push({
        field: 'effectiveness',
        message: 'Effectiveness must be a percentage (0-100)',
        code: 'INVALID_EFFECTIVENESS',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

// ========== DOCUMENT VALIDATION ==========

export class DocumentValidator {
  static validate(
    document: Partial<Document>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!document.agentId) {
      errors.push({
        field: 'agentId',
        message: 'Agent ID is required',
        code: 'MISSING_AGENT_ID',
        severity: 'error',
      })
    }

    if (!document.clientId) {
      errors.push({
        field: 'clientId',
        message: 'Client ID is required',
        code: 'MISSING_CLIENT_ID',
        severity: 'error',
      })
    }

    if (
      !document.title ||
      !ValidationUtils.isValidString(document.title, 1, 200)
    ) {
      errors.push({
        field: 'title',
        message: 'Valid document title is required (1-200 characters)',
        code: 'INVALID_TITLE',
        severity: 'error',
      })
    }

    if (
      !document.type ||
      !ValidationUtils.isValidString(document.type, 1, 50)
    ) {
      errors.push({
        field: 'type',
        message: 'Valid document type is required',
        code: 'MISSING_TYPE',
        severity: 'error',
      })
    }

    if (
      !document.category ||
      !ValidationUtils.isValidString(document.category, 1, 50)
    ) {
      errors.push({
        field: 'category',
        message: 'Valid document category is required',
        code: 'MISSING_CATEGORY',
        severity: 'error',
      })
    }

    if (
      !document.status ||
      !ValidationUtils.isValidEnum(document.status, [
        'draft',
        'review',
        'approved',
        'final',
        'sent',
        'archived',
      ])
    ) {
      errors.push({
        field: 'status',
        message: 'Valid document status is required',
        code: 'INVALID_STATUS',
        severity: 'error',
      })
    }

    // Content validation
    if (
      document.content &&
      !ValidationUtils.isValidString(document.content, 0, 100000)
    ) {
      errors.push({
        field: 'content',
        message: 'Document content too long (max 100,000 characters)',
        code: 'CONTENT_TOO_LONG',
        severity: 'error',
      })
    }

    // File validation
    if (document.fileUrl && !ValidationUtils.isValidUrl(document.fileUrl)) {
      errors.push({
        field: 'fileUrl',
        message: 'Valid file URL is required',
        code: 'INVALID_FILE_URL',
        severity: 'error',
      })
    }

    if (
      document.fileSize &&
      (typeof document.fileSize !== 'number' || document.fileSize <= 0)
    ) {
      errors.push({
        field: 'fileSize',
        message: 'Valid file size is required',
        code: 'INVALID_FILE_SIZE',
        severity: 'error',
      })
    }

    if (document.fileSize && document.fileSize > 50 * 1024 * 1024) {
      // 50MB
      warnings.push({
        field: 'fileSize',
        message: 'File size over 50MB may cause performance issues',
        code: 'LARGE_FILE_SIZE',
      })
    }

    // Permissions validation
    if (document.permissions) {
      if (!ValidationUtils.isValidArray(document.permissions.canView, 0, 100)) {
        errors.push({
          field: 'permissions.canView',
          message: 'Invalid canView permissions array',
          code: 'INVALID_PERMISSIONS',
          severity: 'error',
        })
      }
      if (!ValidationUtils.isValidArray(document.permissions.canEdit, 0, 100)) {
        errors.push({
          field: 'permissions.canEdit',
          message: 'Invalid canEdit permissions array',
          code: 'INVALID_PERMISSIONS',
          severity: 'error',
        })
      }
      if (
        !ValidationUtils.isValidArray(document.permissions.canDelete, 0, 100)
      ) {
        errors.push({
          field: 'permissions.canDelete',
          message: 'Invalid canDelete permissions array',
          code: 'INVALID_PERMISSIONS',
          severity: 'error',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateTemplate(
    template: Partial<DocumentTemplate>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (
      !template.name ||
      !ValidationUtils.isValidString(template.name, 1, 100)
    ) {
      errors.push({
        field: 'name',
        message: 'Valid template name is required (1-100 characters)',
        code: 'INVALID_NAME',
        severity: 'error',
      })
    }

    if (
      !template.category ||
      !ValidationUtils.isValidString(template.category, 1, 50)
    ) {
      errors.push({
        field: 'category',
        message: 'Valid template category is required',
        code: 'MISSING_CATEGORY',
        severity: 'error',
      })
    }

    if (
      !template.content ||
      !ValidationUtils.isValidString(template.content, 1, 50000)
    ) {
      errors.push({
        field: 'content',
        message: 'Valid template content is required (1-50,000 characters)',
        code: 'INVALID_CONTENT',
        severity: 'error',
      })
    }

    if (
      template.variables &&
      !ValidationUtils.isValidArray(template.variables, 0, 50)
    ) {
      errors.push({
        field: 'variables',
        message: 'Invalid template variables array',
        code: 'INVALID_VARIABLES',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

// ========== MARKET DATA VALIDATION ==========

export class MarketDataValidator {
  static validate(
    marketData: Partial<MarketData>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!marketData.propertyId) {
      errors.push({
        field: 'propertyId',
        message: 'Property ID is required',
        code: 'MISSING_PROPERTY_ID',
        severity: 'error',
      })
    }

    if (
      !marketData.address ||
      !ValidationUtils.isValidAddress(marketData.address)
    ) {
      errors.push({
        field: 'address',
        message: 'Valid property address is required',
        code: 'INVALID_ADDRESS',
        severity: 'error',
      })
    }

    if (
      !marketData.propertyType ||
      !ValidationUtils.isValidString(marketData.propertyType, 1, 50)
    ) {
      errors.push({
        field: 'propertyType',
        message: 'Valid property type is required',
        code: 'MISSING_PROPERTY_TYPE',
        severity: 'error',
      })
    }

    if (!marketData.price || !ValidationUtils.isValidAmount(marketData.price)) {
      errors.push({
        field: 'price',
        message: 'Valid price is required',
        code: 'INVALID_PRICE',
        severity: 'error',
      })
    }

    if (
      !marketData.squareFootage ||
      !ValidationUtils.isValidAmount(marketData.squareFootage)
    ) {
      errors.push({
        field: 'squareFootage',
        message: 'Valid square footage is required',
        code: 'INVALID_SQUARE_FOOTAGE',
        severity: 'error',
      })
    }

    if (
      marketData.bedrooms &&
      (typeof marketData.bedrooms !== 'number' ||
        marketData.bedrooms < 0 ||
        marketData.bedrooms > 20)
    ) {
      errors.push({
        field: 'bedrooms',
        message: 'Valid bedroom count is required (0-20)',
        code: 'INVALID_BEDROOMS',
        severity: 'error',
      })
    }

    if (
      marketData.bathrooms &&
      (typeof marketData.bathrooms !== 'number' ||
        marketData.bathrooms < 0 ||
        marketData.bathrooms > 20)
    ) {
      errors.push({
        field: 'bathrooms',
        message: 'Valid bathroom count is required (0-20)',
        code: 'INVALID_BATHROOMS',
        severity: 'error',
      })
    }

    // Date validation
    if (
      marketData.listingDate &&
      !ValidationUtils.isValidDate(marketData.listingDate)
    ) {
      errors.push({
        field: 'listingDate',
        message: 'Valid listing date is required',
        code: 'INVALID_LISTING_DATE',
        severity: 'error',
      })
    }

    if (
      marketData.soldDate &&
      !ValidationUtils.isValidDate(marketData.soldDate)
    ) {
      errors.push({
        field: 'soldDate',
        message: 'Valid sold date is required',
        code: 'INVALID_SOLD_DATE',
        severity: 'error',
      })
    }

    // Business logic validation
    if (marketData.listingDate && marketData.soldDate) {
      if (marketData.soldDate <= marketData.listingDate) {
        errors.push({
          field: 'soldDate',
          message: 'Sold date must be after listing date',
          code: 'INVALID_DATE_RANGE',
          severity: 'error',
        })
      }
    }

    if (marketData.price && marketData.squareFootage) {
      const pricePerSqFt = marketData.price / marketData.squareFootage
      if (pricePerSqFt < 50) {
        warnings.push({
          field: 'price',
          message: 'Price per square foot seems low',
          code: 'LOW_PRICE_PER_SQFT',
        })
      }
      if (pricePerSqFt > 1000) {
        warnings.push({
          field: 'price',
          message: 'Price per square foot seems high',
          code: 'HIGH_PRICE_PER_SQFT',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateComparable(
    comparable: Partial<Comparable>,
    context: ValidationContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!comparable.subjectPropertyId) {
      errors.push({
        field: 'subjectPropertyId',
        message: 'Subject property ID is required',
        code: 'MISSING_SUBJECT_PROPERTY',
        severity: 'error',
      })
    }

    if (!comparable.compPropertyId) {
      errors.push({
        field: 'compPropertyId',
        message: 'Comparable property ID is required',
        code: 'MISSING_COMP_PROPERTY',
        severity: 'error',
      })
    }

    if (
      !comparable.distance ||
      !ValidationUtils.isValidAmount(comparable.distance)
    ) {
      errors.push({
        field: 'distance',
        message: 'Valid distance is required',
        code: 'INVALID_DISTANCE',
        severity: 'error',
      })
    }

    if (comparable.distance && comparable.distance > 5) {
      warnings.push({
        field: 'distance',
        message: 'Comparable over 5 miles may not be representative',
        code: 'DISTANT_COMPARABLE',
      })
    }

    if (
      !comparable.similarity ||
      !ValidationUtils.isValidPercentage(comparable.similarity)
    ) {
      errors.push({
        field: 'similarity',
        message: 'Valid similarity percentage is required',
        code: 'INVALID_SIMILARITY',
        severity: 'error',
      })
    }

    if (comparable.similarity && comparable.similarity < 70) {
      warnings.push({
        field: 'similarity',
        message: 'Comparable with low similarity may not be useful',
        code: 'LOW_SIMILARITY',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

// ========== COMPOSITE VALIDATION ==========

export class CompositeValidator {
  static validateCompleteOffer(
    offer: Partial<Offer>,
    context: ValidationContext
  ): ValidationResult {
    const baseValidation = OfferValidator.validate(offer, context)
    const financialValidation = OfferValidator.validateFinancialDetails(offer)

    return {
      isValid: baseValidation.isValid && financialValidation.isValid,
      errors: [...baseValidation.errors, ...financialValidation.errors],
      warnings: [...baseValidation.warnings, ...financialValidation.warnings],
    }
  }

  static validateNegotiationWithStrategies(
    negotiation: Partial<Negotiation>,
    strategies: Partial<NegotiationStrategy>[],
    context: ValidationContext
  ): ValidationResult {
    const negotiationValidation = NegotiationValidator.validate(
      negotiation,
      context
    )

    const strategyValidations = strategies.map(strategy =>
      NegotiationValidator.validateStrategy(strategy, context)
    )

    const allErrors = [
      ...negotiationValidation.errors,
      ...strategyValidations.flatMap(v => v.errors),
    ]

    const allWarnings = [
      ...negotiationValidation.warnings,
      ...strategyValidations.flatMap(v => v.warnings),
    ]

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    }
  }

  static validateDocumentWithTemplate(
    document: Partial<Document>,
    template: Partial<DocumentTemplate>,
    context: ValidationContext
  ): ValidationResult {
    const documentValidation = DocumentValidator.validate(document, context)
    const templateValidation = DocumentValidator.validateTemplate(
      template,
      context
    )

    return {
      isValid: documentValidation.isValid && templateValidation.isValid,
      errors: [...documentValidation.errors, ...templateValidation.errors],
      warnings: [
        ...documentValidation.warnings,
        ...templateValidation.warnings,
      ],
    }
  }
}

// ========== VALIDATION MIDDLEWARE ==========

export const withValidation = <T>(
  validator: (data: T, context: ValidationContext) => ValidationResult,
  context: ValidationContext
) => {
  return (data: T): T => {
    const result = validator(data, context)

    if (!result.isValid) {
      const errorMessages = result.errors
        .map(e => `${e.field}: ${e.message}`)
        .join(', ')
      throw new Error(`Validation failed: ${errorMessages}`)
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn('Validation warnings:', result.warnings)
    }

    return data
  }
}

// ========== EXPORT VALIDATORS ==========

export {
  OfferValidator,
  NegotiationValidator,
  DocumentValidator,
  MarketDataValidator,
  CompositeValidator,
  ValidationUtils,
}

export default {
  OfferValidator,
  NegotiationValidator,
  DocumentValidator,
  MarketDataValidator,
  CompositeValidator,
  ValidationUtils,
  withValidation,
}
