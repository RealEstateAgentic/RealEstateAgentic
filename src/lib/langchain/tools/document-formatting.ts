/**
 * Document Formatting and Template Tools for LangChain
 *
 * LangChain tools for document generation, formatting, and templating in real estate contexts
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// ========== DOCUMENT FORMATTING TOOLS ==========

/**
 * HTML Document Generator Tool
 */
export class HTMLDocumentGeneratorTool extends Tool {
  name = 'html_document_generator'
  description = 'Generate HTML documents from structured data and templates'

  schema = z.object({
    documentType: z
      .enum([
        'cover_letter',
        'explanation_memo',
        'offer_analysis',
        'market_report',
        'property_summary',
      ])
      .describe('Type of document to generate'),
    title: z.string().describe('Document title'),
    content: z
      .object({
        header: z
          .object({
            agentName: z.string().describe('Agent name'),
            agentTitle: z.string().optional().describe('Agent title'),
            brokerage: z.string().optional().describe('Brokerage name'),
            contact: z
              .object({
                phone: z.string().optional().describe('Phone number'),
                email: z.string().optional().describe('Email address'),
                website: z.string().optional().describe('Website URL'),
              })
              .optional()
              .describe('Contact information'),
            logo: z.string().optional().describe('Logo URL or base64 data'),
          })
          .describe('Document header information'),
        body: z
          .object({
            introduction: z
              .string()
              .optional()
              .describe('Introduction paragraph'),
            mainContent: z.string().describe('Main document content'),
            keyPoints: z
              .array(z.string())
              .optional()
              .describe('Key points or bullet items'),
            sections: z
              .array(
                z.object({
                  title: z.string().describe('Section title'),
                  content: z.string().describe('Section content'),
                })
              )
              .optional()
              .describe('Document sections'),
            conclusion: z.string().optional().describe('Conclusion paragraph'),
          })
          .describe('Document body content'),
        footer: z
          .object({
            disclaimer: z.string().optional().describe('Legal disclaimer'),
            signature: z.string().optional().describe('Signature line'),
            date: z.string().optional().describe('Document date'),
          })
          .optional()
          .describe('Document footer'),
      })
      .describe('Document content structure'),
    styling: z
      .object({
        theme: z
          .enum(['professional', 'modern', 'elegant', 'minimal'])
          .optional()
          .describe('Document theme'),
        primaryColor: z
          .string()
          .optional()
          .describe('Primary color (hex code)'),
        secondaryColor: z
          .string()
          .optional()
          .describe('Secondary color (hex code)'),
        fontFamily: z
          .enum(['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'])
          .optional()
          .describe('Font family'),
        fontSize: z
          .enum(['small', 'medium', 'large'])
          .optional()
          .describe('Font size'),
        layout: z
          .enum(['single_column', 'two_column', 'letterhead'])
          .optional()
          .describe('Document layout'),
      })
      .optional()
      .describe('Document styling options'),
    metadata: z
      .object({
        author: z.string().optional().describe('Document author'),
        created: z.string().optional().describe('Creation date'),
        subject: z.string().optional().describe('Document subject'),
        keywords: z.array(z.string()).optional().describe('Document keywords'),
      })
      .optional()
      .describe('Document metadata'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const {
        documentType,
        title,
        content,
        styling = {},
        metadata = {},
      } = input

      // Generate CSS styles
      const css = this.generateCSS(styling)

      // Generate HTML structure
      const html = this.generateHTML(
        documentType,
        title,
        content,
        css,
        metadata
      )

      // Calculate document stats
      const stats = this.calculateDocumentStats(html)

      return JSON.stringify({
        success: true,
        document: {
          type: documentType,
          title,
          html,
          css,
          stats,
        },
        metadata: {
          ...metadata,
          generated: new Date().toISOString(),
          wordCount: stats.wordCount,
          size: stats.size,
        },
        suggestions: this.generateSuggestions(documentType, content),
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private generateCSS(styling: any): string {
    const theme = styling.theme || 'professional'
    const primaryColor = styling.primaryColor || '#2563eb'
    const secondaryColor = styling.secondaryColor || '#64748b'
    const fontFamily = styling.fontFamily || 'Arial'
    const fontSize = this.getFontSize(styling.fontSize || 'medium')

    const themes = {
      professional: {
        headerBg: primaryColor,
        headerText: '#ffffff',
        bodyBg: '#ffffff',
        bodyText: '#333333',
        accentBg: '#f8fafc',
        borderColor: '#e2e8f0',
      },
      modern: {
        headerBg: '#000000',
        headerText: '#ffffff',
        bodyBg: '#ffffff',
        bodyText: '#1a1a1a',
        accentBg: '#f5f5f5',
        borderColor: '#e0e0e0',
      },
      elegant: {
        headerBg: '#8b5cf6',
        headerText: '#ffffff',
        bodyBg: '#fefefe',
        bodyText: '#4a4a4a',
        accentBg: '#faf5ff',
        borderColor: '#e9d5ff',
      },
      minimal: {
        headerBg: '#ffffff',
        headerText: '#000000',
        bodyBg: '#ffffff',
        bodyText: '#333333',
        accentBg: '#f9f9f9',
        borderColor: '#cccccc',
      },
    }

    const colors = themes[theme as keyof typeof themes]

    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${fontFamily}, sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.6;
          color: ${colors.bodyText};
          background-color: ${colors.bodyBg};
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .document-header {
          background-color: ${colors.headerBg};
          color: ${colors.headerText};
          padding: 30px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 0;
        }
        
        .document-header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .agent-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        
        .agent-details h2 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        
        .agent-details p {
          margin-bottom: 3px;
          opacity: 0.9;
        }
        
        .contact-info {
          text-align: right;
        }
        
        .contact-info p {
          margin-bottom: 3px;
        }
        
        .document-body {
          background-color: ${colors.bodyBg};
          padding: 30px;
          border: 1px solid ${colors.borderColor};
          border-radius: 0 0 8px 8px;
        }
        
        .introduction {
          font-size: ${fontSize + 2}px;
          margin-bottom: 25px;
          padding: 20px;
          background-color: ${colors.accentBg};
          border-radius: 6px;
          border-left: 4px solid ${primaryColor};
        }
        
        .main-content {
          margin-bottom: 25px;
        }
        
        .key-points {
          margin-bottom: 25px;
        }
        
        .key-points h3 {
          color: ${primaryColor};
          margin-bottom: 15px;
          font-size: ${fontSize + 4}px;
        }
        
        .key-points ul {
          padding-left: 20px;
        }
        
        .key-points li {
          margin-bottom: 8px;
          padding-left: 5px;
        }
        
        .section {
          margin-bottom: 25px;
          padding: 20px;
          border: 1px solid ${colors.borderColor};
          border-radius: 6px;
        }
        
        .section h3 {
          color: ${primaryColor};
          margin-bottom: 15px;
          font-size: ${fontSize + 4}px;
          border-bottom: 2px solid ${colors.borderColor};
          padding-bottom: 10px;
        }
        
        .conclusion {
          margin-top: 30px;
          padding: 20px;
          background-color: ${colors.accentBg};
          border-radius: 6px;
          border-left: 4px solid ${secondaryColor};
        }
        
        .document-footer {
          margin-top: 30px;
          padding: 20px;
          border-top: 1px solid ${colors.borderColor};
          color: ${secondaryColor};
          font-size: ${fontSize - 2}px;
        }
        
        .signature-line {
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .signature-line .date {
          text-align: right;
        }
        
        .disclaimer {
          margin-top: 20px;
          font-size: ${fontSize - 3}px;
          color: ${secondaryColor};
          font-style: italic;
        }
        
        .logo {
          max-height: 60px;
          max-width: 200px;
        }
        
        @media print {
          body {
            padding: 0;
            max-width: none;
          }
          
          .document-header,
          .document-body {
            border-radius: 0;
          }
        }
      </style>
    `
  }

  private generateHTML(
    documentType: string,
    title: string,
    content: any,
    css: string,
    metadata: any
  ): string {
    const { header, body, footer } = content

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        ${metadata.author ? `<meta name="author" content="${metadata.author}">` : ''}
        ${metadata.subject ? `<meta name="subject" content="${metadata.subject}">` : ''}
        ${metadata.keywords ? `<meta name="keywords" content="${metadata.keywords.join(', ')}">` : ''}
        ${css}
      </head>
      <body>
        <div class="document-header">
          <h1>${title}</h1>
          <div class="agent-info">
            <div class="agent-details">
              <h2>${header.agentName}</h2>
              ${header.agentTitle ? `<p>${header.agentTitle}</p>` : ''}
              ${header.brokerage ? `<p>${header.brokerage}</p>` : ''}
            </div>
            <div class="contact-info">
              ${header.contact?.phone ? `<p>Phone: ${header.contact.phone}</p>` : ''}
              ${header.contact?.email ? `<p>Email: ${header.contact.email}</p>` : ''}
              ${header.contact?.website ? `<p>Web: ${header.contact.website}</p>` : ''}
              ${header.logo ? `<img src="${header.logo}" alt="Logo" class="logo">` : ''}
            </div>
          </div>
        </div>
        
        <div class="document-body">
          ${body.introduction ? `<div class="introduction">${body.introduction}</div>` : ''}
          
          <div class="main-content">
            ${body.mainContent}
          </div>
          
          ${
            body.keyPoints
              ? `
            <div class="key-points">
              <h3>Key Points</h3>
              <ul>
                ${body.keyPoints.map(point => `<li>${point}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          
          ${
            body.sections
              ? body.sections
                  .map(
                    section => `
            <div class="section">
              <h3>${section.title}</h3>
              <div>${section.content}</div>
            </div>
          `
                  )
                  .join('')
              : ''
          }
          
          ${body.conclusion ? `<div class="conclusion">${body.conclusion}</div>` : ''}
        </div>
        
        ${
          footer
            ? `
          <div class="document-footer">
            ${
              footer.signature
                ? `
              <div class="signature-line">
                <div>${footer.signature}</div>
                <div class="date">${footer.date || new Date().toLocaleDateString()}</div>
              </div>
            `
                : ''
            }
            ${footer.disclaimer ? `<div class="disclaimer">${footer.disclaimer}</div>` : ''}
          </div>
        `
            : ''
        }
      </body>
      </html>
    `
  }

  private getFontSize(size: string): number {
    const sizes = {
      small: 12,
      medium: 14,
      large: 16,
    }
    return sizes[size as keyof typeof sizes] || 14
  }

  private calculateDocumentStats(html: string) {
    const textContent = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wordCount = textContent
      .split(' ')
      .filter(word => word.length > 0).length
    const charCount = textContent.length
    const size = new Blob([html]).size

    return {
      wordCount,
      charCount,
      size,
      estimatedReadTime: Math.ceil(wordCount / 200), // 200 words per minute
    }
  }

  private generateSuggestions(documentType: string, content: any): string[] {
    const suggestions = []

    if (content.body.mainContent.length < 200) {
      suggestions.push(
        'Consider adding more detailed content to improve document value'
      )
    }

    if (!content.body.keyPoints || content.body.keyPoints.length === 0) {
      suggestions.push('Adding key points can improve document readability')
    }

    if (!content.body.introduction) {
      suggestions.push('An introduction can help set context for the reader')
    }

    if (!content.body.conclusion) {
      suggestions.push('A conclusion can reinforce key messages')
    }

    if (!content.footer?.disclaimer && documentType !== 'cover_letter') {
      suggestions.push('Consider adding a disclaimer for legal protection')
    }

    return suggestions
  }
}

/**
 * PDF Document Generator Tool
 */
export class PDFDocumentGeneratorTool extends Tool {
  name = 'pdf_document_generator'
  description =
    'Generate PDF documents from HTML content with proper formatting'

  schema = z.object({
    htmlContent: z.string().describe('HTML content to convert to PDF'),
    options: z
      .object({
        format: z
          .enum(['A4', 'Letter', 'Legal'])
          .optional()
          .describe('Page format'),
        orientation: z
          .enum(['portrait', 'landscape'])
          .optional()
          .describe('Page orientation'),
        margins: z
          .object({
            top: z
              .string()
              .optional()
              .describe('Top margin (e.g., "1in", "2cm")'),
            right: z.string().optional().describe('Right margin'),
            bottom: z.string().optional().describe('Bottom margin'),
            left: z.string().optional().describe('Left margin'),
          })
          .optional()
          .describe('Page margins'),
        headerTemplate: z.string().optional().describe('Header template HTML'),
        footerTemplate: z.string().optional().describe('Footer template HTML'),
        displayHeaderFooter: z
          .boolean()
          .optional()
          .describe('Display header and footer'),
        scale: z.number().optional().describe('Scale factor (0.1 to 2.0)'),
        printBackground: z
          .boolean()
          .optional()
          .describe('Print background colors'),
      })
      .optional()
      .describe('PDF generation options'),
    metadata: z
      .object({
        title: z.string().optional().describe('PDF title'),
        author: z.string().optional().describe('PDF author'),
        subject: z.string().optional().describe('PDF subject'),
        keywords: z.string().optional().describe('PDF keywords'),
        creator: z.string().optional().describe('PDF creator'),
      })
      .optional()
      .describe('PDF metadata'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { htmlContent, options = {}, metadata = {} } = input

      // Generate PDF configuration
      const pdfConfig = this.generatePDFConfig(options, metadata)

      // Prepare HTML for PDF generation
      const processedHTML = this.prepareHTMLForPDF(htmlContent, options)

      // Generate PDF info (simulated - in real implementation would use puppeteer or similar)
      const pdfInfo = this.generatePDFInfo(processedHTML, pdfConfig)

      return JSON.stringify({
        success: true,
        pdf: {
          config: pdfConfig,
          html: processedHTML,
          info: pdfInfo,
        },
        instructions: [
          'This tool generates PDF configuration and prepared HTML',
          'In production, use this with a PDF generation library like puppeteer',
          'The processed HTML is optimized for PDF rendering',
        ],
        nextSteps: [
          'Pass the config to puppeteer.pdf() or similar PDF library',
          'Use the processed HTML as input for PDF generation',
          'Apply the metadata to the generated PDF file',
        ],
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private generatePDFConfig(options: any, metadata: any) {
    return {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      margin: {
        top: options.margins?.top || '1in',
        right: options.margins?.right || '1in',
        bottom: options.margins?.bottom || '1in',
        left: options.margins?.left || '1in',
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      printBackground: options.printBackground !== false,
      scale: options.scale || 1,
      metadata: {
        title: metadata.title || 'Real Estate Document',
        author: metadata.author || 'Real Estate Agent',
        subject: metadata.subject || 'Property Information',
        keywords: metadata.keywords || 'real estate, property, analysis',
        creator: metadata.creator || 'Real Estate Agentic Platform',
      },
    }
  }

  private prepareHTMLForPDF(html: string, options: any): string {
    // Add PDF-specific CSS
    const pdfCSS = `
      <style>
        @page {
          margin: ${options.margins?.top || '1in'} ${options.margins?.right || '1in'} ${options.margins?.bottom || '1in'} ${options.margins?.left || '1in'};
          size: ${options.format || 'A4'} ${options.orientation || 'portrait'};
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
        
        .print-only {
          display: block;
        }
        
        .screen-only {
          display: none;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .header {
          margin-bottom: 30px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    `

    // Insert PDF CSS into HTML
    const htmlWithPDFCSS = html.replace('</head>', `${pdfCSS}</head>`)

    // Add page breaks for long content
    return this.addPageBreaks(htmlWithPDFCSS)
  }

  private addPageBreaks(html: string): string {
    // Add page break classes to sections if they don't exist
    return html.replace(
      /<div class="section">/g,
      '<div class="section no-break">'
    )
  }

  private generatePDFInfo(html: string, config: any) {
    const textContent = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wordCount = textContent
      .split(' ')
      .filter(word => word.length > 0).length
    const estimatedPages = Math.ceil(wordCount / 300) // ~300 words per page

    return {
      estimatedPages,
      wordCount,
      format: config.format,
      orientation: config.orientation,
      size: new Blob([html]).size,
      processingTime: new Date().toISOString(),
    }
  }
}

/**
 * Document Template Manager Tool
 */
export class DocumentTemplateManagerTool extends Tool {
  name = 'document_template_manager'
  description =
    'Manage and customize document templates for various real estate documents'

  schema = z.object({
    action: z
      .enum(['create', 'update', 'retrieve', 'list'])
      .describe('Action to perform'),
    templateId: z
      .string()
      .optional()
      .describe('Template ID for update/retrieve actions'),
    template: z
      .object({
        name: z.string().describe('Template name'),
        type: z
          .enum([
            'cover_letter',
            'explanation_memo',
            'offer_analysis',
            'market_report',
            'property_summary',
            'negotiation_strategy',
          ])
          .describe('Document type'),
        description: z.string().optional().describe('Template description'),
        structure: z
          .object({
            sections: z
              .array(
                z.object({
                  id: z.string().describe('Section ID'),
                  title: z.string().describe('Section title'),
                  required: z.boolean().describe('Whether section is required'),
                  placeholder: z.string().describe('Placeholder text'),
                  type: z
                    .enum(['text', 'list', 'table', 'image'])
                    .describe('Section content type'),
                  variables: z
                    .array(z.string())
                    .optional()
                    .describe('Template variables'),
                })
              )
              .describe('Template sections'),
            variables: z
              .array(
                z.object({
                  name: z.string().describe('Variable name'),
                  type: z
                    .enum(['string', 'number', 'date', 'boolean', 'array'])
                    .describe('Variable type'),
                  required: z
                    .boolean()
                    .describe('Whether variable is required'),
                  default: z.any().optional().describe('Default value'),
                  description: z.string().describe('Variable description'),
                })
              )
              .describe('Template variables'),
          })
          .describe('Template structure'),
        styling: z
          .object({
            theme: z.string().optional().describe('Template theme'),
            colors: z
              .object({
                primary: z.string().optional().describe('Primary color'),
                secondary: z.string().optional().describe('Secondary color'),
                accent: z.string().optional().describe('Accent color'),
              })
              .optional()
              .describe('Color scheme'),
            fonts: z
              .object({
                heading: z.string().optional().describe('Heading font'),
                body: z.string().optional().describe('Body font'),
                size: z.string().optional().describe('Font size'),
              })
              .optional()
              .describe('Font settings'),
          })
          .optional()
          .describe('Template styling'),
      })
      .optional()
      .describe('Template data for create/update actions'),
    filters: z
      .object({
        type: z.string().optional().describe('Filter by document type'),
        category: z.string().optional().describe('Filter by category'),
        tags: z.array(z.string()).optional().describe('Filter by tags'),
      })
      .optional()
      .describe('Filters for list action'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { action, templateId, template, filters } = input

      switch (action) {
        case 'create':
          if (!template) {
            throw new Error('Template data is required for create action')
          }
          return this.createTemplate(template)

        case 'update':
          if (!templateId || !template) {
            throw new Error(
              'Template ID and data are required for update action'
            )
          }
          return this.updateTemplate(templateId, template)

        case 'retrieve':
          if (!templateId) {
            throw new Error('Template ID is required for retrieve action')
          }
          return this.retrieveTemplate(templateId)

        case 'list':
          return this.listTemplates(filters)

        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }

  private createTemplate(template: any): string {
    const templateId = this.generateTemplateId()
    const createdTemplate = {
      id: templateId,
      ...template,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      version: 1,
    }

    // Validate template structure
    const validation = this.validateTemplate(createdTemplate)
    if (!validation.isValid) {
      return JSON.stringify({
        success: false,
        error: `Template validation failed: ${validation.errors.join(', ')}`,
      })
    }

    return JSON.stringify({
      success: true,
      template: createdTemplate,
      message: 'Template created successfully',
      usage: this.generateUsageInstructions(createdTemplate),
    })
  }

  private updateTemplate(templateId: string, template: any): string {
    const updatedTemplate = {
      id: templateId,
      ...template,
      updated: new Date().toISOString(),
      version: (template.version || 1) + 1,
    }

    // Validate template structure
    const validation = this.validateTemplate(updatedTemplate)
    if (!validation.isValid) {
      return JSON.stringify({
        success: false,
        error: `Template validation failed: ${validation.errors.join(', ')}`,
      })
    }

    return JSON.stringify({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully',
      usage: this.generateUsageInstructions(updatedTemplate),
    })
  }

  private retrieveTemplate(templateId: string): string {
    // In a real implementation, this would fetch from a database
    const template = this.getDefaultTemplate(templateId)

    return JSON.stringify({
      success: true,
      template,
      usage: this.generateUsageInstructions(template),
    })
  }

  private listTemplates(filters: any = {}): string {
    // In a real implementation, this would query a database
    const templates = this.getDefaultTemplates()

    // Apply filters
    let filteredTemplates = templates
    if (filters.type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === filters.type)
    }
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(
        t => t.category === filters.category
      )
    }
    if (filters.tags) {
      filteredTemplates = filteredTemplates.filter(t =>
        filters.tags.some((tag: string) => t.tags?.includes(tag))
      )
    }

    return JSON.stringify({
      success: true,
      templates: filteredTemplates.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        description: t.description,
        created: t.created,
        updated: t.updated,
        version: t.version,
      })),
      count: filteredTemplates.length,
      filters: filters,
    })
  }

  private validateTemplate(template: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors = []

    if (!template.name) {
      errors.push('Template name is required')
    }

    if (!template.type) {
      errors.push('Template type is required')
    }

    if (
      !template.structure?.sections ||
      template.structure.sections.length === 0
    ) {
      errors.push('Template must have at least one section')
    }

    // Validate sections
    template.structure?.sections?.forEach((section: any, index: number) => {
      if (!section.id) {
        errors.push(`Section ${index + 1} must have an ID`)
      }
      if (!section.title) {
        errors.push(`Section ${index + 1} must have a title`)
      }
      if (!section.type) {
        errors.push(`Section ${index + 1} must have a type`)
      }
    })

    // Validate variables
    template.structure?.variables?.forEach((variable: any, index: number) => {
      if (!variable.name) {
        errors.push(`Variable ${index + 1} must have a name`)
      }
      if (!variable.type) {
        errors.push(`Variable ${index + 1} must have a type`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private generateTemplateId(): string {
    return (
      'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    )
  }

  private generateUsageInstructions(template: any): string[] {
    const instructions = []

    instructions.push(
      `Use this template by calling the html_document_generator tool with documentType: "${template.type}"`
    )

    if (template.structure?.variables?.length > 0) {
      instructions.push('Required variables:')
      template.structure.variables.forEach((variable: any) => {
        if (variable.required) {
          instructions.push(
            `- ${variable.name} (${variable.type}): ${variable.description}`
          )
        }
      })
    }

    if (template.structure?.sections?.length > 0) {
      instructions.push('Template sections:')
      template.structure.sections.forEach((section: any) => {
        instructions.push(
          `- ${section.title} (${section.required ? 'required' : 'optional'})`
        )
      })
    }

    return instructions
  }

  private getDefaultTemplate(templateId: string): any {
    const templates = this.getDefaultTemplates()
    return templates.find(t => t.id === templateId) || templates[0]
  }

  private getDefaultTemplates(): any[] {
    return [
      {
        id: 'cover_letter_default',
        name: 'Standard Cover Letter',
        type: 'cover_letter',
        description:
          'Professional cover letter template for real estate offers',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        version: 1,
        structure: {
          sections: [
            {
              id: 'introduction',
              title: 'Introduction',
              required: true,
              placeholder: 'Introduce yourself and your client',
              type: 'text',
              variables: ['agentName', 'clientName', 'propertyAddress'],
            },
            {
              id: 'client_background',
              title: 'Client Background',
              required: true,
              placeholder: "Describe your client's qualifications",
              type: 'text',
              variables: ['clientBackground', 'financialQualification'],
            },
            {
              id: 'offer_details',
              title: 'Offer Details',
              required: true,
              placeholder: 'Summarize the offer terms',
              type: 'text',
              variables: ['offerPrice', 'terms', 'timeline'],
            },
            {
              id: 'closing',
              title: 'Closing',
              required: true,
              placeholder: 'Professional closing statement',
              type: 'text',
              variables: ['nextSteps', 'contact'],
            },
          ],
          variables: [
            {
              name: 'agentName',
              type: 'string',
              required: true,
              description: 'Real estate agent name',
            },
            {
              name: 'clientName',
              type: 'string',
              required: true,
              description: 'Client name',
            },
            {
              name: 'propertyAddress',
              type: 'string',
              required: true,
              description: 'Property address',
            },
            {
              name: 'offerPrice',
              type: 'number',
              required: true,
              description: 'Offer price',
            },
          ],
        },
      },
      {
        id: 'market_report_default',
        name: 'Market Analysis Report',
        type: 'market_report',
        description: 'Comprehensive market analysis report template',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        version: 1,
        structure: {
          sections: [
            {
              id: 'executive_summary',
              title: 'Executive Summary',
              required: true,
              placeholder: 'High-level market overview',
              type: 'text',
            },
            {
              id: 'market_trends',
              title: 'Market Trends',
              required: true,
              placeholder: 'Current market trends and analysis',
              type: 'text',
            },
            {
              id: 'price_analysis',
              title: 'Price Analysis',
              required: true,
              placeholder: 'Price trends and comparisons',
              type: 'table',
            },
            {
              id: 'recommendations',
              title: 'Recommendations',
              required: true,
              placeholder: 'Strategic recommendations',
              type: 'list',
            },
          ],
          variables: [
            {
              name: 'location',
              type: 'string',
              required: true,
              description: 'Market location',
            },
            {
              name: 'timeframe',
              type: 'string',
              required: true,
              description: 'Analysis timeframe',
            },
          ],
        },
      },
    ]
  }
}

// ========== DOCUMENT FORMATTING TOOLS REGISTRY ==========

/**
 * Document Formatting Tools Registry
 */
export const documentFormattingTools = {
  htmlDocumentGenerator: new HTMLDocumentGeneratorTool(),
  pdfDocumentGenerator: new PDFDocumentGeneratorTool(),
  documentTemplateManager: new DocumentTemplateManagerTool(),
}

/**
 * Get all document formatting tools as an array
 */
export const getAllDocumentFormattingTools = (): Tool[] => {
  return Object.values(documentFormattingTools)
}

/**
 * Get document formatting tools by category
 */
export const getDocumentFormattingToolsByCategory = (
  category: 'generation' | 'templates' | 'conversion'
) => {
  switch (category) {
    case 'generation':
      return [documentFormattingTools.htmlDocumentGenerator]
    case 'templates':
      return [documentFormattingTools.documentTemplateManager]
    case 'conversion':
      return [documentFormattingTools.pdfDocumentGenerator]
    default:
      return []
  }
}
