import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}
// ========== FIREBASE TYPES ==========

// Define Firebase types locally to avoid early initialization
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  createdAt: string
}

export interface Property {
  id?: string
  userId: string
  address: string
  propertyType: 'house' | 'apartment' | 'commercial' | 'land'
  purchasePrice: number
  squareFootage: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  description?: string
  photos?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface FileUploadResult {
  url: string
  path: string
  fileName: string
  size: number
  contentType: string
  uploadedAt: Date
}

// ========== PROPERTY TYPES ==========

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  COMMERCIAL: 'commercial',
  LAND: 'land',
} as const

export type PropertyType = (typeof PROPERTY_TYPES)[keyof typeof PROPERTY_TYPES]

export const PROPERTY_TYPE_INFO: Record<
  PropertyType,
  { name: string; description: string }
> = {
  [PROPERTY_TYPES.HOUSE]: {
    name: 'House',
    description: 'Single-family residential property',
  },
  [PROPERTY_TYPES.APARTMENT]: {
    name: 'Apartment',
    description: 'Multi-unit residential property',
  },
  [PROPERTY_TYPES.COMMERCIAL]: {
    name: 'Commercial',
    description: 'Commercial or business property',
  },
  [PROPERTY_TYPES.LAND]: {
    name: 'Land',
    description: 'Vacant land or lot',
  },
}
/**
 * PDF API types for IPC communication
 */
export interface PDFGenerateData {
  htmlContent: string
  title: string
  filename: string
  additionalStyles?: string
}

export interface PDFGenerateResult {
  success: boolean
  filePath?: string
  message?: string
  error?: string
}

export interface PDFFileResult {
  success: boolean
  error?: string
}

/**
 * App API exposed to renderer process
 */
export interface AppAPI {
  sayHelloFromBridge(): void
  username: string | undefined
  pdf: {
    generate(data: PDFGenerateData): Promise<PDFGenerateResult>
    openFile(filePath: string): Promise<PDFFileResult>
    showInFolder(filePath: string): Promise<PDFFileResult>
  }
}

/**
 * Global window type extension
 */
declare global {
  interface Window {
    App: AppAPI
  }
}
