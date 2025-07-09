/**
 * Shared constants for the entire application
 * Including Electron IPC channels for secure communication
 */

// Application constants
export const APP_NAME = 'Real Estate Agentic'
export const APP_VERSION = '1.0.0'

// ========== IPC CHANNELS ==========

export const IPC_CHANNELS = {
  // PDF Generation
  GENERATE_PDF: 'pdf:generate',
  GENERATE_PDF_FROM_HTML: 'pdf:generate-from-html',
  MERGE_PDFS: 'pdf:merge',

  // Document Management
  SAVE_DOCUMENT: 'document:save',
  LOAD_DOCUMENT: 'document:load',
  DELETE_DOCUMENT: 'document:delete',
  LIST_DOCUMENTS: 'document:list',

  // Document Templates
  GET_TEMPLATE: 'template:get',
  SAVE_TEMPLATE: 'template:save',
  LIST_TEMPLATES: 'template:list',

  // Document Sharing
  SHARE_DOCUMENT: 'document:share',
  GET_SHARED_DOCUMENT: 'document:get-shared',
  REVOKE_SHARE: 'document:revoke-share',

  // File Operations
  SAVE_FILE: 'file:save',
  READ_FILE: 'file:read',
  DELETE_FILE: 'file:delete',
  OPEN_FILE: 'file:open',
  SHOW_SAVE_DIALOG: 'file:show-save-dialog',
  SHOW_OPEN_DIALOG: 'file:show-open-dialog',

  // System Operations
  GET_APP_PATH: 'system:get-app-path',
  GET_USER_DATA_PATH: 'system:get-user-data-path',
  OPEN_EXTERNAL: 'system:open-external',

  // Analytics
  TRACK_DOCUMENT_VIEW: 'analytics:document-view',
  TRACK_DOCUMENT_DOWNLOAD: 'analytics:document-download',
  GET_ANALYTICS: 'analytics:get',
} as const

// Document types for PDF generation
export const DOCUMENT_TYPES = {
  COVER_LETTER: 'cover_letter',
  EXPLANATION_MEMO: 'explanation_memo',
  NEGOTIATION_STRATEGY: 'negotiation_strategy',
  OFFER_ANALYSIS: 'offer_analysis',
  MARKET_ANALYSIS: 'market_analysis',
  CLIENT_SUMMARY: 'client_summary',
  RISK_ASSESSMENT: 'risk_assessment',
  COMPETITIVE_COMPARISON: 'competitive_comparison',
} as const

// PDF generation options
export const PDF_OPTIONS = {
  DEFAULT: {
    format: 'A4' as const,
    border: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
    header: {
      height: '0.75in',
    },
    footer: {
      height: '0.75in',
    },
  },
  LETTER: {
    format: 'Letter' as const,
    border: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in',
    },
  },
} as const

// File paths
export const FILE_PATHS = {
  DOCUMENTS: 'documents',
  TEMPLATES: 'templates',
  TEMP: 'temp',
  SHARED: 'shared',
  ANALYTICS: 'analytics',
} as const

// Document sharing permissions
export const SHARE_PERMISSIONS = {
  VIEW: 'view',
  COMMENT: 'comment',
  EDIT: 'edit',
} as const

// Document status
export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  FINAL: 'final',
  SHARED: 'shared',
  ARCHIVED: 'archived',
} as const
