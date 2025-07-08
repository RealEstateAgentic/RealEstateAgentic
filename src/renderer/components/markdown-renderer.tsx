/**
 * Markdown Renderer Component
 * Renders markdown content to HTML using the marked library
 * Provides a styled container with placeholder content for testing
 */

import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { FileText, Eye } from 'lucide-react'

interface MarkdownRendererProps {
  content?: string
  className?: string
  showPreview?: boolean
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
  content = defaultMarkdownContent, 
  className = '',
  showPreview = true 
}: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    })
  }, [])
  useEffect(() => {
    const processMarkdown = async () => {
      if (!content) return
      
      setIsLoading(true)
      try {
        const html = await marked.parse(content)
        setHtmlContent(html)
      } catch (error) {
        console.error('Error parsing markdown:', error)
        setHtmlContent('<p>Error rendering markdown content</p>')
      } finally {
        setIsLoading(false)
      }
    }

    processMarkdown()
  }, [content])

  if (!showPreview) return null

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-gray-100">Markdown Preview</h3>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Eye className="size-4 text-gray-400" />
            <span className="text-sm text-gray-400">Live Preview</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
              <span className="ml-3 text-gray-400">Rendering markdown...</span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div 
                className="prose prose-invert max-w-none
                  [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-teal-400 [&_h1]:mb-6 [&_h1]:mt-0
                  [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-teal-300 [&_h2]:mb-4 [&_h2]:mt-8
                  [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-100 [&_h3]:mb-3 [&_h3]:mt-6
                  [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-gray-200 [&_h4]:mb-2 [&_h4]:mt-4
                  [&_h5]:text-lg [&_h5]:font-semibold [&_h5]:text-gray-300 [&_h5]:mb-2 [&_h5]:mt-4
                  [&_h6]:text-base [&_h6]:font-semibold [&_h6]:text-gray-400 [&_h6]:mb-2 [&_h6]:mt-4
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-strong:text-gray-100 prose-strong:font-semibold
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:text-gray-300 prose-li:marker:text-teal-400
                  prose-blockquote:border-l-4 prose-blockquote:border-teal-400 prose-blockquote:bg-gray-800 prose-blockquote:p-4 prose-blockquote:rounded-r-lg
                  prose-blockquote:text-gray-300 prose-blockquote:italic
                  prose-code:text-teal-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
                  prose-hr:border-gray-700 prose-hr:my-8
                  prose-a:text-teal-400 prose-a:no-underline hover:prose-a:text-teal-300 hover:prose-a:underline
                  [&_table]:w-full [&_table]:border-collapse [&_table]:border-2 [&_table]:border-gray-600 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:my-6 [&_table]:shadow-lg [&_table]:shadow-black/20
                  [&_thead]:bg-gray-800
                  [&_th]:bg-gray-800 [&_th]:border [&_th]:border-gray-600 [&_th]:px-6 [&_th]:py-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-100 [&_th]:text-sm [&_th]:uppercase [&_th]:tracking-wider
                  [&_tbody]:bg-gray-900
                  [&_td]:border [&_td]:border-gray-600 [&_td]:px-6 [&_td]:py-4 [&_td]:text-gray-300 [&_td]:font-medium
                  [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-200
                  [&_tbody_tr:nth-child(even)]:bg-gray-800/30
                  [&_tbody_tr:hover]:bg-gray-700/50
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