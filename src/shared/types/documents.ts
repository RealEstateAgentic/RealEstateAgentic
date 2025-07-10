/**
 * TypeScript interfaces for document management and PDF generation
 * Used across the document generation and management system
 */

export interface Document {
  id: string
  agentId: string
  clientId: string
  relatedId: string // offerId, negotiationId, etc.
  relatedType: 'offer' | 'negotiation' | 'property' | 'client' | 'agent'

  // Document Info
  title: string
  type: DocumentType
  category: DocumentCategory
  status: DocumentStatus

  // Content
  content: string
  htmlContent: string
  metadata: DocumentMetadata

  // Generation
  generatedBy: 'ai' | 'agent' | 'template' | 'manual'
  template?: DocumentTemplate
  generationParams?: GenerationParameters

  // Versions
  version: number
  versions: DocumentVersion[]

  // PDF
  pdfUrl?: string
  pdfSize?: number
  pdfPages?: number

  // Permissions
  permissions: DocumentPermissions

  // Timestamps
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string
  expiresAt?: string
}

export interface DocumentMetadata {
  wordCount: number
  readingTime: number
  tone: 'professional' | 'friendly' | 'persuasive' | 'formal' | 'casual'
  language: string

  // Document properties
  headerImage?: string
  footerText?: string
  branding?: BrandingConfig

  // Content analysis
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  complexity: 'simple' | 'moderate' | 'complex'

  // SEO/Search
  tags: string[]
  keywords: string[]
  summary: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  type: DocumentType
  category: DocumentCategory

  // Template Content
  templateContent: string
  variables: TemplateVariable[]
  sections: TemplateSection[]

  // Styling
  styling: DocumentStyling

  // Configuration
  isActive: boolean
  isDefault: boolean

  // Usage
  usageCount: number
  rating: number

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object'
  required: boolean
  defaultValue?: any
  description: string
  validation?: VariableValidation
}

export interface VariableValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  options?: string[]
  min?: number
  max?: number
}

export interface TemplateSection {
  id: string
  name: string
  order: number
  required: boolean
  content: string
  variables: string[]
  conditions?: SectionCondition[]
}

export interface SectionCondition {
  variable: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  logic: 'and' | 'or'
}

export interface DocumentStyling {
  fontFamily: string
  fontSize: number
  lineHeight: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  colors: {
    primary: string
    secondary: string
    text: string
    background: string
  }
  layout: 'single_column' | 'two_column' | 'letterhead'
  pageSize: 'a4' | 'letter' | 'legal'
}

export interface BrandingConfig {
  agentName: string
  brokerageName: string
  logo?: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  contactInfo: {
    phone: string
    email: string
    address: string
    website?: string
  }
}

export interface DocumentVersion {
  version: number
  content: string
  htmlContent: string
  changes: string[]
  createdBy: string
  createdAt: string
  comment?: string
}

export interface DocumentPermissions {
  ownerId: string
  canView: string[]
  canEdit: string[]
  canShare: string[]
  canDelete: string[]
  isPublic: boolean
  shareLink?: string
  shareExpiration?: string
}

export interface GenerationParameters {
  aiModel?: string
  temperature?: number
  maxTokens?: number
  tone?: string
  length?: 'short' | 'medium' | 'long'
  focus?: string[]
  context?: GenerationContext
  constraints?: string[]
}

export interface GenerationContext {
  propertyDetails?: PropertyContext
  clientDetails?: ClientContext
  marketData?: MarketContext
  offerDetails?: OfferContext
  negotiationDetails?: NegotiationContext
}

export interface PropertyContext {
  address: string
  price: number
  sqft: number
  beds: number
  baths: number
  features: string[]
  condition: string
  yearBuilt: number
}

export interface ClientContext {
  name: string
  role: 'buyer' | 'seller'
  preferences: string[]
  timeline: string
  budget: number
  motivation: string
}

export interface MarketContext {
  marketType: string
  averagePrice: number
  daysOnMarket: number
  trends: string[]
  competition: string
}

export interface OfferContext {
  price: number
  terms: string[]
  contingencies: string[]
  timeline: string
  strengths: string[]
  weaknesses: string[]
}

export interface NegotiationContext {
  stage: string
  history: string[]
  objectives: string[]
  constraints: string[]
  strategy: string
}

export interface DocumentLibrary {
  id: string
  agentId: string
  name: string
  description: string

  // Organization
  folders: DocumentFolder[]
  documents: Document[]

  // Settings
  defaultTemplate?: string
  autoGenerate: boolean

  // Statistics
  totalDocuments: number
  totalSize: number

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface DocumentFolder {
  id: string
  name: string
  parentId?: string
  color?: string
  icon?: string
  order: number

  // Permissions
  permissions: DocumentPermissions

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface DocumentShare {
  id: string
  documentId: string
  agentId: string

  // Share details
  shareType: 'link' | 'email' | 'client_portal'
  sharedWith: string[]

  // Permissions
  permissions: {
    canView: boolean
    canDownload: boolean
    canComment: boolean
    canEdit: boolean
  }

  // Settings
  requiresAuth: boolean
  expirationDate?: string
  passwordProtected: boolean

  // Tracking
  views: ShareView[]
  downloads: ShareDownload[]

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface ShareView {
  viewerId?: string
  ipAddress: string
  userAgent: string
  timestamp: string
  duration: number
}

export interface ShareDownload {
  downloaderId?: string
  ipAddress: string
  userAgent: string
  timestamp: string
  fileSize: number
}

export interface DocumentAnalytics {
  documentId: string
  agentId: string

  // Usage stats
  totalViews: number
  totalDownloads: number
  totalShares: number

  // Performance
  averageReadingTime: number
  completionRate: number

  // Effectiveness
  clientFeedback: DocumentFeedback[]
  successRate: number

  // Time-based analytics
  dailyStats: DailyStats[]
  weeklyStats: WeeklyStats[]

  // Metadata
  lastUpdated: string
}

export interface DocumentFeedback {
  id: string
  clientId: string
  rating: number
  comments: string
  helpful: boolean
  timestamp: string
}

export interface DailyStats {
  date: string
  views: number
  downloads: number
  shares: number
}

export interface WeeklyStats {
  week: string
  views: number
  downloads: number
  shares: number
  newDocuments: number
}

export interface PDFGenerationOptions {
  format: 'a4' | 'letter' | 'legal'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: string
    right: string
    bottom: string
    left: string
  }

  // Header/Footer
  displayHeaderFooter: boolean
  headerTemplate?: string
  footerTemplate?: string

  // Quality
  printBackground: boolean
  scale: number

  // Page options
  pageRanges?: string
  ignoreInvalidPageRanges: boolean

  // Metadata
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
}

export interface PDFGenerationResult {
  success: boolean
  pdfUrl?: string
  pdfSize?: number
  pdfPages?: number
  generationTime: number
  error?: string
}

// API Request/Response Types
export interface CreateDocumentRequest {
  title: string
  type: DocumentType
  category: DocumentCategory
  relatedId: string
  relatedType: string
  templateId?: string
  generationParams?: GenerationParameters
  content?: string
}

export interface UpdateDocumentRequest {
  documentId: string
  updates: Partial<Document>
}

export interface GenerateDocumentRequest {
  templateId: string
  variables: Record<string, any>
  generationParams?: GenerationParameters
}

export interface CreateDocumentTemplateRequest {
  name: string
  description: string
  type: DocumentType
  category: DocumentCategory
  templateContent: string
  variables: TemplateVariable[]
  styling: DocumentStyling
}

export interface GeneratePDFRequest {
  documentId: string
  options?: PDFGenerationOptions
}

export interface ShareDocumentRequest {
  documentId: string
  shareType: 'link' | 'email' | 'client_portal'
  sharedWith?: string[]
  permissions: DocumentShare['permissions']
  settings?: {
    requiresAuth?: boolean
    expirationDate?: string
    passwordProtected?: boolean
  }
}

// Response Types
export interface DocumentResponse {
  success: boolean
  data?: Document
  error?: string
}

export interface DocumentTemplateResponse {
  success: boolean
  data?: DocumentTemplate
  error?: string
}

export interface PDFResponse {
  success: boolean
  data?: PDFGenerationResult
  error?: string
}

export interface DocumentShareResponse {
  success: boolean
  data?: DocumentShare
  error?: string
}

// Utility Types
export type DocumentType =
  | 'cover_letter'
  | 'explanation_memo'
  | 'counter_strategy'
  | 'appraisal_response'
  | 'negotiation_summary'
  | 'market_analysis'
  | 'property_report'
  | 'client_presentation'
  | 'contract_addendum'
  | 'disclosure_form'
  | 'other'

export type DocumentCategory =
  | 'offers'
  | 'negotiations'
  | 'market_analysis'
  | 'client_communications'
  | 'legal_documents'
  | 'marketing_materials'
  | 'reports'
  | 'templates'
  | 'other'

export type DocumentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'final'
  | 'sent'
  | 'archived'

// Constants
export const DOCUMENT_TYPES = {
  COVER_LETTER: 'cover_letter',
  EXPLANATION_MEMO: 'explanation_memo',
  COUNTER_STRATEGY: 'counter_strategy',
  APPRAISAL_RESPONSE: 'appraisal_response',
  NEGOTIATION_SUMMARY: 'negotiation_summary',
  MARKET_ANALYSIS: 'market_analysis',
  PROPERTY_REPORT: 'property_report',
  CLIENT_PRESENTATION: 'client_presentation',
  CONTRACT_ADDENDUM: 'contract_addendum',
  DISCLOSURE_FORM: 'disclosure_form',
  OTHER: 'other',
} as const

export const DOCUMENT_CATEGORIES = {
  OFFERS: 'offers',
  NEGOTIATIONS: 'negotiations',
  MARKET_ANALYSIS: 'market_analysis',
  CLIENT_COMMUNICATIONS: 'client_communications',
  LEGAL_DOCUMENTS: 'legal_documents',
  MARKETING_MATERIALS: 'marketing_materials',
  REPORTS: 'reports',
  TEMPLATES: 'templates',
  OTHER: 'other',
} as const

export const DOCUMENT_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  FINAL: 'final',
  SENT: 'sent',
  ARCHIVED: 'archived',
} as const
