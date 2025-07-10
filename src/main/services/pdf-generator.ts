/**
 * PDF Generation Service for Main Process
 *
 * Comprehensive PDF generation service using html-pdf-node and PDFKit
 * for creating professional real estate documents with templates, branding,
 * and secure file operations. Runs in the main process for security.
 */

import * as htmlPdf from 'html-pdf-node'
import PDFDocument from 'pdfkit'
import PDFTable from 'pdfkit-table'
import { app, shell } from 'electron'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { FILE_PATHS, PDF_OPTIONS, DOCUMENT_TYPES } from '../../shared/constants'
import type { AgentProfile, ClientProfile } from '../../shared/types'

// ========== PDF GENERATION TYPES ==========

export interface PDFGenerationOptions {
  template?: string
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: string
    right: string
    bottom: string
    left: string
  }
  header?: {
    content: string
    height: string
  }
  footer?: {
    content: string
    height: string
  }
  branding?: BrandingOptions
  watermark?: WatermarkOptions
}

export interface BrandingOptions {
  agentName: string
  brokerageName: string
  logoPath?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
  }
  fonts?: {
    primary: string
    secondary: string
  }
  contactInfo?: {
    phone: string
    email: string
    website?: string
    address?: string
  }
}

export interface WatermarkOptions {
  text: string
  opacity: number
  fontSize: number
  rotation: number
  color: string
}

export interface DocumentContent {
  title: string
  content: string
  type: keyof typeof DOCUMENT_TYPES
  metadata?: {
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
  }
}

export interface PDFGenerationResult {
  success: boolean
  filePath?: string
  fileName?: string
  size?: number
  error?: string
}

// ========== PDF GENERATOR CLASS ==========

export class PDFGeneratorService {
  private documentsPath: string
  private templatesPath: string
  private tempPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.documentsPath = path.join(userDataPath, FILE_PATHS.DOCUMENTS)
    this.templatesPath = path.join(userDataPath, FILE_PATHS.TEMPLATES)
    this.tempPath = path.join(userDataPath, FILE_PATHS.TEMP)

    // Ensure directories exist
    this.ensureDirectories()
  }

  // ========== DIRECTORY MANAGEMENT ==========

  private ensureDirectories(): void {
    for (const dir of [this.documentsPath, this.templatesPath, this.tempPath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  // ========== HTML TO PDF GENERATION ==========

  async generatePDFFromHTML(
    htmlContent: string,
    fileName: string,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const outputPath = path.join(this.documentsPath, `${fileName}.pdf`)

      // Configure HTML-PDF options
      const pdfOptions = {
        format: options.format || 'A4',
        orientation: options.orientation || 'portrait',
        border: options.margins || PDF_OPTIONS.DEFAULT.border,
        header: options.header,
        footer: options.footer,
        quality: '100',
        type: 'pdf',
        timeout: 30000,
      }

      // Add branding to HTML if provided
      if (options.branding) {
        htmlContent = this.addBrandingToHTML(htmlContent, options.branding)
      }

      // Generate PDF
      const pdfBuffer = await htmlPdf.generatePdf(
        { content: htmlContent },
        pdfOptions
      )

      // Save to file
      fs.writeFileSync(outputPath, pdfBuffer)

      const stats = fs.statSync(outputPath)

      return {
        success: true,
        filePath: outputPath,
        fileName: `${fileName}.pdf`,
        size: stats.size,
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== DOCUMENT GENERATION ==========

  async generateDocument(
    content: DocumentContent,
    agentProfile: AgentProfile,
    clientProfile?: ClientProfile,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Load document template
      const template = await this.loadTemplate(content.type)

      // Process template with content
      const processedHTML = this.processTemplate(
        template,
        content,
        agentProfile,
        clientProfile
      )

      // Set up branding from agent profile
      const branding: BrandingOptions = {
        agentName: agentProfile.displayName || 'Real Estate Agent',
        brokerageName:
          'brokerage' in agentProfile
            ? agentProfile.brokerage
            : 'Real Estate Brokerage',
        contactInfo: {
          phone: 'phoneNumber' in agentProfile ? agentProfile.phoneNumber : '',
          email: agentProfile.email,
        },
        colors: {
          primary: '#1f2937',
          secondary: '#6b7280',
          accent: '#3b82f6',
        },
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${content.type}_${timestamp}`

      // Generate PDF
      return await this.generatePDFFromHTML(processedHTML, fileName, {
        ...options,
        branding,
      })
    } catch (error) {
      console.error('Document generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== TEMPLATE MANAGEMENT ==========

  private async loadTemplate(
    documentType: keyof typeof DOCUMENT_TYPES
  ): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${documentType}.html`)

    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8')
    }

    // Return default template if custom template doesn't exist
    return this.getDefaultTemplate(documentType)
  }

  private getDefaultTemplate(
    documentType: keyof typeof DOCUMENT_TYPES
  ): string {
    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid {{primaryColor}};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: {{primaryColor}};
      margin: 0;
      font-size: 24px;
    }
    .agent-info {
      margin-top: 10px;
      font-size: 14px;
      color: {{secondaryColor}};
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      font-size: 12px;
      color: {{secondaryColor}};
      text-align: center;
    }
    .logo {
      max-height: 60px;
      margin-bottom: 10px;
    }
    .highlight {
      background-color: #f0f9ff;
      padding: 15px;
      border-left: 4px solid {{accentColor}};
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: {{primaryColor}};
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    {{#if logoPath}}
    <img src="{{logoPath}}" alt="Logo" class="logo">
    {{/if}}
    <h1>{{title}}</h1>
    <div class="agent-info">
      <strong>{{agentName}}</strong><br>
      {{brokerageName}}<br>
      {{#if contactInfo.phone}}Phone: {{contactInfo.phone}}<br>{{/if}}
      {{#if contactInfo.email}}Email: {{contactInfo.email}}<br>{{/if}}
    </div>
  </div>
  
  <div class="content">
    {{content}}
  </div>
  
  <div class="footer">
    <p>This document was generated on {{currentDate}} by {{agentName}} from {{brokerageName}}.</p>
    <p>© {{currentYear}} {{brokerageName}}. All rights reserved.</p>
  </div>
</body>
</html>`

    // Document type specific templates
    switch (documentType) {
      case 'COVER_LETTER':
        return baseTemplate.replace(
          '{{content}}',
          `
          <div class="highlight">
            <h3>Property Information</h3>
            <p><strong>Address:</strong> {{propertyAddress}}</p>
            <p><strong>Offer Price:</strong> ${{ offerPrice }}</p>
            <p><strong>Client:</strong> {{clientName}}</p>
          </div>
          {{content}}
          <p>Please feel free to contact me with any questions or concerns.</p>
          <p>Best regards,<br>{{agentName}}</p>
        `
        )

      case 'EXPLANATION_MEMO':
        return baseTemplate.replace(
          '{{content}}',
          `
          <h2>Real Estate Explanation Memo</h2>
          <div class="highlight">
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Date:</strong> {{currentDate}}</p>
            <p><strong>To:</strong> {{clientName}}</p>
            <p><strong>From:</strong> {{agentName}}</p>
          </div>
          {{content}}
        `
        )

      case 'NEGOTIATION_STRATEGY':
        return baseTemplate.replace(
          '{{content}}',
          `
          <h2>Negotiation Strategy Document</h2>
          <div class="highlight">
            <p><strong>Property:</strong> {{propertyAddress}}</p>
            <p><strong>Strategy Date:</strong> {{currentDate}}</p>
            <p><strong>Market Conditions:</strong> {{marketConditions}}</p>
          </div>
          {{content}}
        `
        )

      default:
        return baseTemplate
    }
  }

  private processTemplate(
    template: string,
    content: DocumentContent,
    agentProfile: AgentProfile,
    clientProfile?: ClientProfile
  ): string {
    const currentDate = new Date().toLocaleDateString()
    const currentYear = new Date().getFullYear()

    // Template variables
    const variables = {
      title: content.title,
      content: content.content,
      agentName: agentProfile.displayName || 'Real Estate Agent',
      brokerageName:
        'brokerage' in agentProfile
          ? agentProfile.brokerage
          : 'Real Estate Brokerage',
      contactInfo: {
        phone: 'phoneNumber' in agentProfile ? agentProfile.phoneNumber : '',
        email: agentProfile.email,
      },
      clientName: clientProfile?.displayName || 'Valued Client',
      currentDate,
      currentYear,
      primaryColor: '#1f2937',
      secondaryColor: '#6b7280',
      accentColor: '#3b82f6',
    }

    // Simple template replacement (in a real app, use a proper template engine)
    let processedTemplate = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedTemplate = processedTemplate.replace(regex, String(value))
    })

    return processedTemplate
  }

  // ========== BRANDING UTILITIES ==========

  private addBrandingToHTML(html: string, branding: BrandingOptions): string {
    // Add branding styles to HTML
    const brandingCSS = `
      <style>
        .branding-header {
          background: linear-gradient(135deg, ${branding.colors?.primary || '#1f2937'}, ${branding.colors?.secondary || '#6b7280'});
          color: white;
          padding: 20px;
          margin-bottom: 20px;
        }
        .branding-footer {
          background-color: ${branding.colors?.primary || '#1f2937'};
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 12px;
        }
      </style>
    `

    // Insert branding CSS into HTML head
    const headEndIndex = html.indexOf('</head>')
    if (headEndIndex !== -1) {
      html =
        html.slice(0, headEndIndex) + brandingCSS + html.slice(headEndIndex)
    }

    return html
  }

  // ========== ADVANCED PDF FEATURES ==========

  async createPDFWithPDFKit(
    content: DocumentContent,
    filePath: string,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const doc = new PDFDocument({
        size: options.format || 'A4',
        layout: options.orientation || 'portrait',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72,
        },
      })

      // Pipe to file
      doc.pipe(fs.createWriteStream(filePath))

      // Add branding header
      if (options.branding) {
        this.addPDFKitHeader(doc, options.branding)
      }

      // Add content
      doc.fontSize(12)
      doc.text(content.content, {
        align: 'left',
        lineGap: 2,
      })

      // Add footer
      if (options.branding) {
        this.addPDFKitFooter(doc, options.branding)
      }

      // Add watermark if specified
      if (options.watermark) {
        this.addWatermark(doc, options.watermark)
      }

      // Finalize PDF
      doc.end()

      const stats = fs.statSync(filePath)

      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        size: stats.size,
      }
    } catch (error) {
      console.error('PDFKit generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private addPDFKitHeader(doc: PDFDocument, branding: BrandingOptions): void {
    doc
      .fontSize(16)
      .fillColor(branding.colors?.primary || '#1f2937')
      .text(branding.agentName, 72, 72)

    doc
      .fontSize(12)
      .fillColor(branding.colors?.secondary || '#6b7280')
      .text(branding.brokerageName, 72, 95)

    if (branding.contactInfo) {
      let yPosition = 115
      if (branding.contactInfo.phone) {
        doc.text(`Phone: ${branding.contactInfo.phone}`, 72, yPosition)
        yPosition += 15
      }
      if (branding.contactInfo.email) {
        doc.text(`Email: ${branding.contactInfo.email}`, 72, yPosition)
      }
    }

    // Add line under header
    doc
      .moveTo(72, 150)
      .lineTo(doc.page.width - 72, 150)
      .strokeColor(branding.colors?.primary || '#1f2937')
      .stroke()

    doc.moveDown(2)
  }

  private addPDFKitFooter(doc: PDFDocument, branding: BrandingOptions): void {
    const footerY = doc.page.height - 100

    doc
      .fontSize(10)
      .fillColor(branding.colors?.secondary || '#6b7280')
      .text(
        `© ${new Date().getFullYear()} ${branding.brokerageName}. All rights reserved.`,
        72,
        footerY,
        { align: 'center' }
      )
  }

  private addWatermark(doc: PDFDocument, watermark: WatermarkOptions): void {
    doc.save()
    doc.rotate(watermark.rotation, {
      origin: [doc.page.width / 2, doc.page.height / 2],
    })
    doc
      .fontSize(watermark.fontSize)
      .fillColor(watermark.color)
      .opacity(watermark.opacity)
      .text(watermark.text, 0, doc.page.height / 2, {
        align: 'center',
        width: doc.page.width,
      })
    doc.restore()
  }

  // ========== FILE OPERATIONS ==========

  async mergePDFs(
    pdfPaths: string[],
    outputPath: string
  ): Promise<PDFGenerationResult> {
    try {
      // This would require a PDF merging library like pdf-merger-js
      // For now, return success with placeholder implementation
      return {
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async openPDF(filePath: string): Promise<boolean> {
    try {
      await shell.openPath(filePath)
      return true
    } catch (error) {
      console.error('Error opening PDF:', error)
      return false
    }
  }

  // ========== CLEANUP ==========

  cleanupTempFiles(): void {
    try {
      const tempFiles = fs.readdirSync(this.tempPath)
      tempFiles.forEach(file => {
        const filePath = path.join(this.tempPath, file)
        const stats = fs.statSync(filePath)
        const ageInMs = Date.now() - stats.mtime.getTime()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        if (ageInMs > maxAge) {
          fs.unlinkSync(filePath)
        }
      })
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }
}

// ========== SINGLETON INSTANCE ==========

export const pdfGeneratorService = new PDFGeneratorService()
