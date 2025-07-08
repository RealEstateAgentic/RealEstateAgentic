/**
 * IPC Handlers for PDF Generation
 * Handles communication between renderer and main process
 * for PDF generation using Puppeteer
 */

import { ipcMain, shell } from 'electron'
import { generatePDFFromHTML, createCompleteHTMLDocument } from '../utils/pdf-generator'

/**
 * Setup all PDF-related IPC handlers
 */
export function setupPDFHandlers(): void {
  /**
   * Handle PDF generation from HTML content
   * Channel: 'pdf:generate'
   */
  ipcMain.handle('pdf:generate', async (event, data: {
    htmlContent: string
    title: string
    filename: string
    additionalStyles?: string
  }) => {
    try {
      const { htmlContent, title, filename, additionalStyles } = data
      
      // Create complete HTML document with styles
      const completeHTML = createCompleteHTMLDocument(
        htmlContent,
        title,
        additionalStyles
      )
      
      // Generate PDF and get file path
      const filePath = await generatePDFFromHTML(completeHTML, {
        filename,
        format: 'A4',
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        },
        printBackground: true
      })
      
      return {
        success: true,
        filePath,
        message: 'PDF generated successfully'
      }
    } catch (error: any) {
      console.error('PDF generation failed:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  })

  /**
   * Handle opening generated PDF file
   * Channel: 'pdf:openFile'
   */
  ipcMain.handle('pdf:openFile', async (event, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to open PDF:', error)
      return {
        success: false,
        error: error.message || 'Failed to open PDF'
      }
    }
  })

  /**
   * Handle showing PDF file in folder
   * Channel: 'pdf:showInFolder'
   */
  ipcMain.handle('pdf:showInFolder', async (event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to show PDF in folder:', error)
      return {
        success: false,
        error: error.message || 'Failed to show PDF in folder'
      }
    }
  })
}

/**
 * Remove all PDF-related IPC handlers
 */
export function removePDFHandlers(): void {
  ipcMain.removeHandler('pdf:generate')
  ipcMain.removeHandler('pdf:openFile')
  ipcMain.removeHandler('pdf:showInFolder')
} 