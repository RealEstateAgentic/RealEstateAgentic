/**
 * IPC Handlers for PDF Generation
 *
 * Secure IPC handlers that interface with the PDF generation service
 * in the main process. Handles all PDF-related operations with proper
 * validation and error handling.
 */

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { pdfGeneratorService } from '../services/pdf-generator'
import { documentSharingService } from '../services/document-sharing'
import type {
  PDFGenerationOptions,
  DocumentContent,
  PDFGenerationResult,
} from '../services/pdf-generator'
import type { ShareRequest } from '../services/document-sharing'

// ========== PDF GENERATION HANDLERS ==========

export function setupPDFHandlers(): void {
  // Generate PDF from HTML content
  ipcMain.handle(
    IPC_CHANNELS.GENERATE_PDF_FROM_HTML,
    async (
      event,
      {
        htmlContent,
        fileName,
        options,
      }: {
        htmlContent: string
        fileName: string
        options?: PDFGenerationOptions
      }
    ): Promise<PDFGenerationResult> => {
      try {
        // Validate inputs
        if (!htmlContent || typeof htmlContent !== 'string') {
          return { success: false, error: 'Invalid HTML content' }
        }

        if (!fileName || typeof fileName !== 'string') {
          return { success: false, error: 'Invalid file name' }
        }

        // Sanitize filename
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_')

        return await pdfGeneratorService.generatePDFFromHTML(
          htmlContent,
          sanitizedFileName,
          options || {}
        )
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Generate document with templates
  ipcMain.handle(
    IPC_CHANNELS.GENERATE_PDF,
    async (
      event,
      {
        content,
        agentProfile,
        clientProfile,
        options,
      }: {
        content: DocumentContent
        agentProfile: any
        clientProfile?: any
        options?: PDFGenerationOptions
      }
    ): Promise<PDFGenerationResult> => {
      try {
        // Validate inputs
        if (!content || !content.title || !content.content) {
          return { success: false, error: 'Invalid document content' }
        }

        if (!agentProfile || !agentProfile.email) {
          return { success: false, error: 'Invalid agent profile' }
        }

        return await pdfGeneratorService.generateDocument(
          content,
          agentProfile,
          clientProfile,
          options || {}
        )
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Merge multiple PDFs
  ipcMain.handle(
    IPC_CHANNELS.MERGE_PDFS,
    async (
      event,
      {
        pdfPaths,
        outputPath,
      }: {
        pdfPaths: string[]
        outputPath: string
      }
    ): Promise<PDFGenerationResult> => {
      try {
        if (!Array.isArray(pdfPaths) || pdfPaths.length === 0) {
          return { success: false, error: 'Invalid PDF paths' }
        }

        if (!outputPath || typeof outputPath !== 'string') {
          return { success: false, error: 'Invalid output path' }
        }

        return await pdfGeneratorService.mergePDFs(pdfPaths, outputPath)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Open PDF file
  ipcMain.handle(
    'pdf:open',
    async (event, filePath: string): Promise<boolean> => {
      try {
        if (!filePath || typeof filePath !== 'string') {
          return false
        }

        return await pdfGeneratorService.openPDF(filePath)
      } catch (error) {
        console.error('Error opening PDF:', error)
        return false
      }
    }
  )

  // Cleanup temp files
  ipcMain.handle('pdf:cleanup', async (): Promise<boolean> => {
    try {
      pdfGeneratorService.cleanupTempFiles()
      return true
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
      return false
    }
  })
}

// ========== SHARING HANDLERS ==========

export function setupSharingHandlers(): void {
  // Create share link
  ipcMain.handle(
    IPC_CHANNELS.SHARE_DOCUMENT,
    async (
      event,
      {
        shareRequest,
        sharedBy,
      }: {
        shareRequest: ShareRequest
        sharedBy: string
      }
    ) => {
      try {
        const result = await documentSharingService.createShare(
          shareRequest,
          sharedBy
        )
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Access shared document
  ipcMain.handle(
    IPC_CHANNELS.GET_SHARED_DOCUMENT,
    async (
      event,
      {
        shareId,
        accessedBy,
        action,
        password,
        metadata,
      }: {
        shareId: string
        accessedBy: string
        action: 'view' | 'download' | 'print'
        password?: string
        metadata?: Record<string, any>
      }
    ) => {
      try {
        const result = await documentSharingService.accessShare(
          shareId,
          accessedBy,
          action,
          password,
          metadata
        )
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Revoke share
  ipcMain.handle(IPC_CHANNELS.REVOKE_SHARE, async (event, shareId: string) => {
    try {
      const result = await documentSharingService.revokeShare(shareId)
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Get user's active shares
  ipcMain.handle('sharing:get-active-shares', async (event, userId: string) => {
    try {
      const shares = await documentSharingService.getActiveShares(userId)
      return { success: true, shares }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Get share analytics
  ipcMain.handle('sharing:get-analytics', async (event, shareId: string) => {
    try {
      const analytics = await documentSharingService.getAnalytics(shareId)
      return { success: true, analytics }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Cleanup expired shares
  ipcMain.handle('sharing:cleanup', async () => {
    try {
      await documentSharingService.performCleanup()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
}

// ========== DOCUMENT MANAGEMENT HANDLERS ==========

export function setupDocumentHandlers(): void {
  // Save document
  ipcMain.handle(
    IPC_CHANNELS.SAVE_DOCUMENT,
    async (
      event,
      {
        document,
        filePath,
      }: {
        document: any
        filePath: string
      }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')

        // Validate inputs
        if (!document || !filePath) {
          return { success: false, error: 'Invalid document or file path' }
        }

        // Ensure directory exists
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // Save document
        fs.writeFileSync(filePath, JSON.stringify(document, null, 2))

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Load document
  ipcMain.handle(
    IPC_CHANNELS.LOAD_DOCUMENT,
    async (
      event,
      filePath: string
    ): Promise<{
      success: boolean
      document?: any
      error?: string
    }> => {
      try {
        const fs = await import('node:fs')

        if (!filePath || typeof filePath !== 'string') {
          return { success: false, error: 'Invalid file path' }
        }

        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'Document not found' }
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        const document = JSON.parse(content)

        return { success: true, document }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Delete document
  ipcMain.handle(
    IPC_CHANNELS.DELETE_DOCUMENT,
    async (
      event,
      filePath: string
    ): Promise<{
      success: boolean
      error?: string
    }> => {
      try {
        const fs = await import('node:fs')

        if (!filePath || typeof filePath !== 'string') {
          return { success: false, error: 'Invalid file path' }
        }

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // List documents
  ipcMain.handle(
    IPC_CHANNELS.LIST_DOCUMENTS,
    async (
      event,
      directoryPath: string
    ): Promise<{
      success: boolean
      documents?: string[]
      error?: string
    }> => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')

        if (!directoryPath || typeof directoryPath !== 'string') {
          return { success: false, error: 'Invalid directory path' }
        }

        if (!fs.existsSync(directoryPath)) {
          return { success: true, documents: [] }
        }

        const files = fs.readdirSync(directoryPath)
        const documents = files.filter(
          file =>
            path.extname(file).toLowerCase() === '.pdf' ||
            path.extname(file).toLowerCase() === '.json'
        )

        return { success: true, documents }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )
}

// ========== TEMPLATE HANDLERS ==========

export function setupTemplateHandlers(): void {
  // Get template
  ipcMain.handle(
    IPC_CHANNELS.GET_TEMPLATE,
    async (
      event,
      templateName: string
    ): Promise<{
      success: boolean
      template?: string
      error?: string
    }> => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const { app } = await import('electron')

        if (!templateName || typeof templateName !== 'string') {
          return { success: false, error: 'Invalid template name' }
        }

        const userDataPath = app.getPath('userData')
        const templatesPath = path.join(userDataPath, 'templates')
        const templatePath = path.join(templatesPath, `${templateName}.html`)

        if (!fs.existsSync(templatePath)) {
          return { success: false, error: 'Template not found' }
        }

        const template = fs.readFileSync(templatePath, 'utf-8')

        return { success: true, template }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // Save template
  ipcMain.handle(
    IPC_CHANNELS.SAVE_TEMPLATE,
    async (
      event,
      {
        templateName,
        content,
      }: {
        templateName: string
        content: string
      }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const { app } = await import('electron')

        if (!templateName || !content) {
          return { success: false, error: 'Invalid template name or content' }
        }

        const userDataPath = app.getPath('userData')
        const templatesPath = path.join(userDataPath, 'templates')

        // Ensure templates directory exists
        if (!fs.existsSync(templatesPath)) {
          fs.mkdirSync(templatesPath, { recursive: true })
        }

        const templatePath = path.join(templatesPath, `${templateName}.html`)
        fs.writeFileSync(templatePath, content)

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // List templates
  ipcMain.handle(
    IPC_CHANNELS.LIST_TEMPLATES,
    async (): Promise<{
      success: boolean
      templates?: string[]
      error?: string
    }> => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const { app } = await import('electron')

        const userDataPath = app.getPath('userData')
        const templatesPath = path.join(userDataPath, 'templates')

        if (!fs.existsSync(templatesPath)) {
          return { success: true, templates: [] }
        }

        const files = fs.readdirSync(templatesPath)
        const templates = files
          .filter(file => path.extname(file).toLowerCase() === '.html')
          .map(file => path.basename(file, '.html'))

        return { success: true, templates }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )
}
