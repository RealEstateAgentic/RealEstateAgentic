/**
 * Markdown Renderer Component
 * Renders markdown content to HTML using the marked library
 * Provides a styled container with placeholder content for testing
 */

import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { FileText, Eye, Download, ArrowLeft } from 'lucide-react'

interface MarkdownRendererProps {
  markdownContent?: string
  className?: string
  showPreview?: boolean
  onBack?: () => void
}

/**
 * Default placeholder markdown content for demonstration
 */
const defaultMarkdownContent = `# Property Repair Estimate

## Overview
This document provides a comprehensive breakdown of estimated repair costs for the property inspection.

### Key Findings
- **Foundation**: Minor cracks requiring attention
- **Roof**: Several loose shingles identified
- **Plumbing**: Kitchen faucet replacement needed
- **Electrical**: Update outlet in bathroom

## Cost Breakdown

### High Priority Repairs
| Item | Description | Estimated Cost |
|------|-------------|----------------|
| Foundation Repair | Seal minor cracks | $1,500 |
| Roof Maintenance | Replace 12 shingles | $800 |
| Plumbing | Kitchen faucet replacement | $350 |

### Medium Priority Repairs
- **Paint Touch-ups**: $600
- **Window Caulking**: $200
- **Gutter Cleaning**: $150

### Low Priority Repairs
- Deck staining: $400
- Landscape maintenance: $300

## Total Estimated Cost: $4,300

> **Note**: These are preliminary estimates based on visual inspection. 
> Final costs may vary based on contractor quotes and material pricing.

## Next Steps
1. Get contractor quotes for high-priority items
2. Schedule repairs in order of priority
3. Budget for unexpected issues (add 10-15% buffer)

---

*Report generated on: ${new Date().toLocaleDateString()}*`

/**
 * Markdown renderer component that converts markdown to HTML
 * Uses marked library for parsing and rendering
 */
export function MarkdownRenderer({ 
  markdownContent = defaultMarkdownContent, 
  className = '',
  showPreview = true,
  onBack
}: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    })
  }, [])
  useEffect(() => {
    const processMarkdown = async () => {
      if (!markdownContent) return
      
      setIsLoading(true)
      try {
        const html = await marked.parse(markdownContent)
        setHtmlContent(html)
      } catch (error) {
        console.error('Error parsing markdown:', error)
        setHtmlContent('<p>Error rendering markdown content</p>')
      } finally {
        setIsLoading(false)
      }
    }

    processMarkdown()
  }, [markdownContent])

  /**
   * Export current markdown content as PDF using IPC
   */
  const exportToPDF = async () => {
    if (!htmlContent) return
    
    setIsExporting(true)
    
    try {
      // Use IPC to generate PDF in main process
      const result = await window.App.pdf.generate({
        htmlContent,
        title: 'Property Repair Estimate',
        filename: 'repair-estimate.pdf',
        additionalStyles: `
          /* Additional custom styles for PDF */
          .pdf-container {
            max-width: 100%;
            margin: 0;
            padding: 30px;
          }
        `
      })
      
      if (result.success) {
        console.log('PDF generated successfully:', result.filePath)
        
        // Show success notification with options
        const userChoice = confirm(
          `PDF generated successfully!\n\nClick OK to open the PDF, or Cancel to show it in folder.`
        )
        
        if (userChoice) {
          await window.App.pdf.openFile(result.filePath ?? '')
        } else {
          await window.App.pdf.showInFolder(result.filePath ?? '')
        }
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }
      
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      alert(`Failed to export PDF: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  if (!showPreview) return null

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="size-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#3B7097]" />
            <h3 className="text-lg font-semibold text-gray-900">Generated Report</h3>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-gray-600" />
              <span className="text-sm text-gray-600">Live Preview</span>
            </div>
            <button
              onClick={exportToPDF}
              disabled={isExporting || !htmlContent}
              className="flex items-center gap-2 px-3 py-1 bg-[#3B7097] hover:bg-[#3B7097]/90 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
            >
              <Download className="size-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7097]"></div>
              <span className="ml-3 text-gray-600">Rendering markdown...</span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div 
                className="prose prose-slate max-w-none text-gray-900
                  [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-[#3B7097] [&_h1]:mb-6 [&_h1]:mt-0
                  [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-[#3B7097] [&_h2]:mb-4 [&_h2]:mt-8
                  [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-3 [&_h3]:mt-6
                  [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mb-2 [&_h4]:mt-4
                  [&_h5]:text-lg [&_h5]:font-semibold [&_h5]:text-gray-700 [&_h5]:mb-2 [&_h5]:mt-4
                  [&_h6]:text-base [&_h6]:font-semibold [&_h6]:text-gray-600 [&_h6]:mb-2 [&_h6]:mt-4
                  [&_p]:text-gray-800 [&_p]:leading-relaxed [&_p]:mb-4
                  [&_strong]:text-gray-900 [&_strong]:font-semibold
                  [&_ul]:text-gray-800 [&_ol]:text-gray-800
                  [&_li]:text-gray-800 [&_li]:marker:text-[#3B7097] [&_li]:mb-1
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#3B7097] [&_blockquote]:bg-[#F6E2BC]/30 [&_blockquote]:p-4 [&_blockquote]:rounded-r-lg
                  [&_blockquote]:text-gray-800 [&_blockquote]:italic [&_blockquote]:my-4
                  [&_code]:text-[#3B7097] [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                  [&_pre]:bg-gray-100 [&_pre]:border [&_pre]:border-gray-300 [&_pre]:p-4 [&_pre]:rounded [&_pre]:my-4
                  [&_hr]:border-gray-300 [&_hr]:my-8
                  [&_a]:text-[#3B7097] [&_a]:no-underline [&_a]:hover:text-[#3B7097]/80 [&_a]:hover:underline
                  [&_em]:text-gray-700 [&_em]:italic
                  [&_table]:w-full [&_table]:border-collapse [&_table]:border-2 [&_table]:border-gray-300 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:my-6 [&_table]:shadow-lg [&_table]:shadow-gray-200
                  [&_thead]:bg-gray-100
                  [&_th]:bg-gray-100 [&_th]:border [&_th]:border-gray-300 [&_th]:px-6 [&_th]:py-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:text-sm [&_th]:uppercase [&_th]:tracking-wider
                  [&_tbody]:bg-white
                  [&_td]:border [&_td]:border-gray-300 [&_td]:px-6 [&_td]:py-4 [&_td]:text-gray-800 [&_td]:font-medium
                  [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-200
                  [&_tbody_tr:nth-child(even)]:bg-gray-50
                  [&_tbody_tr:hover]:bg-gray-100
                  [&_td:last-child]:text-right [&_th:last-child]:text-right"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 