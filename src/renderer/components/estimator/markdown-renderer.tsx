/**
 * Markdown Renderer Component
 * Renders markdown content to HTML using the marked library
 */

import { useState, useEffect } from 'react'
import { marked } from 'marked'

interface MarkdownRendererProps {
  markdownContent?: string
  className?: string
}

/**
 * Markdown renderer component that converts markdown to HTML
 * Uses marked library for parsing and rendering
 */
export function MarkdownRenderer({
  markdownContent = '',
  className = '',
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

  return (
    <div className={className}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7097]"></div>
          <span className="ml-3 text-gray-600">Rendering markdown...</span>
        </div>
      ) : (
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
      )}
    </div>
  )
} 