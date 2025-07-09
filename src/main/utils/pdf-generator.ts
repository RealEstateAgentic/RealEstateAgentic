/**
 * PDF Generator Utility for Main Process
 * Converts HTML content to PDF using Puppeteer
 * Runs in Node.js environment with full system access
 */

import puppeteer, { Browser } from 'puppeteer'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface PDFOptions {
  filename: string
  format?: 'A4' | 'A3' | 'Letter'
  margin?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
  printBackground?: boolean
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
}

/**
 * Generate PDF from HTML content using Puppeteer
 * Returns the file path where PDF was saved
 */
export async function generatePDFFromHTML(
  htmlContent: string, 
  options: PDFOptions
): Promise<string> {
  let browser: Browser | null = null
  
  try {
    console.log('Starting PDF generation with Puppeteer in main process')
    
    // Launch browser with optimized settings for Electron
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security'
      ]
    })
    
    const page = await browser.newPage()
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    })
    
    // Set content and wait for all resources to load
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    })
    
    // Wait a bit more for any dynamic content or fonts to load
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Determine save path - use Downloads folder or app data
    const downloadsPath = app.getPath('downloads')
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${options.filename.replace('.pdf', '')}-${timestamp}.pdf`
    const outputPath = path.join(downloadsPath, filename)
    
    // Generate PDF with specified options
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
        ...options.margin
      },
      printBackground: options.printBackground ?? true,
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      preferCSSPageSize: true
    })
    
    // Save PDF to file
    fs.writeFileSync(outputPath, pdfBuffer)
    
    console.log(`PDF generated successfully: ${outputPath}`)
    return outputPath
    
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    throw new Error(`PDF generation failed: ${error?.message || 'Unknown error'}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Create complete HTML document with embedded styles
 * This ensures the PDF has all necessary styling
 */
export function createCompleteHTMLDocument(
  content: string, 
  title: string = 'Document',
  additionalStyles?: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          /* Reset and base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* PDF Container styles */
          .pdf-container {
            max-width: 100%;
            margin: 0;
            padding: 30px;
            background: white;
            color: #333;
          }
          
          /* Heading styles for PDF */
          h1 {
            font-size: 2.5rem;
            font-weight: bold;
            color: #0d9488;
            margin-bottom: 1.5rem;
            page-break-after: avoid;
          }
          
          h2 {
            font-size: 2rem;
            font-weight: bold;
            color: #0f766e;
            margin-top: 2rem;
            margin-bottom: 1rem;
            page-break-after: avoid;
          }
          
          h3 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #374151;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            page-break-after: avoid;
          }
          
          /* Table styles for PDF */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            page-break-inside: avoid;
            border: 2px solid #6b7280;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          th, td {
            border: 1px solid #6b7280;
            padding: 12px 16px;
            text-align: left;
            font-size: 0.9rem;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.8rem;
          }
          
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          tr:hover {
            background-color: #f3f4f6;
          }
          
          td:last-child, th:last-child {
            text-align: right;
          }
          
          /* Prose styles for PDF */
          p {
            margin-bottom: 1rem;
            color: #4b5563;
            line-height: 1.7;
          }
          
          ul, ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
          }
          
          li {
            margin-bottom: 0.5rem;
            color: #4b5563;
          }
          
          blockquote {
            border-left: 4px solid #0d9488;
            background-color: #f0fdfa;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-style: italic;
            color: #4b5563;
          }
          
          code {
            background-color: #f3f4f6;
            color: #0d9488;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 0.9em;
          }
          
          pre {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
          }
          
          hr {
            border: none;
            border-top: 1px solid #d1d5db;
            margin: 2rem 0;
          }
          
          /* Page break utilities */
          .page-break {
            page-break-before: always;
          }
          
          .no-page-break {
            page-break-inside: avoid;
          }
          
          /* Custom styles */
          ${additionalStyles || ''}
        </style>
      </head>
      <body>
        <div class="pdf-container">
          ${content}
        </div>
      </body>
    </html>
  `
} 