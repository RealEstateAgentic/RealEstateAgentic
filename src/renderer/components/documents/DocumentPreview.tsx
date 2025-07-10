/**
 * Document Preview and Editing Interface
 *
 * Comprehensive interface for previewing and editing generated documents with
 * real-time editing capabilities, formatting tools, collaboration features,
 * version control, and seamless integration with the document generation system.
 */

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import {
  createDocument,
  updateDocument,
  getDocument,
} from '../../../lib/firebase/collections/documents'
import type { Document, DocumentVersion } from '../../../shared/types/documents'
import type { AgentProfile, ClientProfile } from '../../../shared/types'

// ========== DOCUMENT PREVIEW TYPES ==========

interface DocumentPreviewProps {
  documentId?: string
  initialContent?: string
  documentType: string
  agentProfile: AgentProfile
  clientProfile?: ClientProfile
  onSave: (content: string, metadata: any) => void
  onClose: () => void
  readOnly?: boolean
}

interface EditorToolbarProps {
  onFormat: (format: string) => void
  onInsert: (type: string) => void
  onAction: (action: string) => void
  readOnly: boolean
}

interface DocumentMetadata {
  wordCount: number
  paragraphCount: number
  readingTime: number
  lastSaved: Date
  version: string
  status: 'draft' | 'review' | 'final'
}

interface FormatOption {
  type: 'bold' | 'italic' | 'underline' | 'heading' | 'list' | 'quote'
  label: string
  icon: string
  shortcut: string
}

interface InsertOption {
  type: 'signature' | 'date' | 'property_info' | 'client_info' | 'agent_info'
  label: string
  icon: string
  template: string
}

// ========== EDITOR TOOLBAR COMPONENT ==========

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onFormat,
  onInsert,
  onAction,
  readOnly,
}) => {
  const formatOptions: FormatOption[] = [
    { type: 'bold', label: 'Bold', icon: '𝐁', shortcut: 'Ctrl+B' },
    { type: 'italic', label: 'Italic', icon: '𝐼', shortcut: 'Ctrl+I' },
    { type: 'underline', label: 'Underline', icon: '𝐔', shortcut: 'Ctrl+U' },
    { type: 'heading', label: 'Heading', icon: 'H', shortcut: 'Ctrl+H' },
    { type: 'list', label: 'List', icon: '•', shortcut: 'Ctrl+L' },
    { type: 'quote', label: 'Quote', icon: '"', shortcut: 'Ctrl+Q' },
  ]

  const insertOptions: InsertOption[] = [
    {
      type: 'signature',
      label: 'Signature',
      icon: '✍️',
      template: '[Agent Signature]',
    },
    { type: 'date', label: 'Date', icon: '📅', template: '[Date]' },
    {
      type: 'property_info',
      label: 'Property Info',
      icon: '🏠',
      template: '[Property Information]',
    },
    {
      type: 'client_info',
      label: 'Client Info',
      icon: '👤',
      template: '[Client Information]',
    },
    {
      type: 'agent_info',
      label: 'Agent Info',
      icon: '🏢',
      template: '[Agent Information]',
    },
  ]

  if (readOnly) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Read-only mode</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => onAction('print')} size="sm" variant="outline">
            🖨️ Print
          </Button>
          <Button
            onClick={() => onAction('export')}
            size="sm"
            variant="outline"
          >
            📤 Export
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-1">
        {/* Format buttons */}
        <div className="flex items-center space-x-1 mr-4">
          {formatOptions.map(option => (
            <button
              key={option.type}
              onClick={() => onFormat(option.type)}
              className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              title={`${option.label} (${option.shortcut})`}
            >
              {option.icon}
            </button>
          ))}
        </div>

        {/* Insert dropdown */}
        <div className="relative">
          <select
            onChange={e => {
              if (e.target.value) {
                onInsert(e.target.value)
                e.target.value = ''
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Insert...</option>
            {insertOptions.map(option => (
              <option key={option.type} value={option.type}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onAction('ai_improve')}
          size="sm"
          variant="outline"
          className="text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          ✨ AI Improve
        </Button>
        <Button
          onClick={() => onAction('save')}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          💾 Save
        </Button>
      </div>
    </div>
  )
}

// ========== DOCUMENT METADATA PANEL ==========

interface DocumentMetadataPanelProps {
  metadata: DocumentMetadata
  onStatusChange: (status: string) => void
  onVersionCreate: () => void
  versions: DocumentVersion[]
  onVersionSelect: (version: DocumentVersion) => void
}

const DocumentMetadataPanel: React.FC<DocumentMetadataPanelProps> = ({
  metadata,
  onStatusChange,
  onVersionCreate,
  versions,
  onVersionSelect,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'review':
        return 'bg-blue-100 text-blue-800'
      case 'final':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Document Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Word Count:</span>
            <span className="font-medium">{metadata.wordCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Paragraphs:</span>
            <span className="font-medium">{metadata.paragraphCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reading Time:</span>
            <span className="font-medium">{metadata.readingTime} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Saved:</span>
            <span className="font-medium">
              {metadata.lastSaved.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">{metadata.version}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Status</h4>
        <select
          value={metadata.status}
          onChange={e => onStatusChange(e.target.value)}
          className={`w-full px-3 py-2 text-sm rounded-md border ${getStatusColor(metadata.status)}`}
        >
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="final">Final</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Versions</h4>
          <Button onClick={onVersionCreate} size="sm" variant="outline">
            Create Version
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {versions.map(version => (
            <div
              key={version.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
              onClick={() => onVersionSelect(version)}
            >
              <div>
                <div className="font-medium text-sm">{version.name}</div>
                <div className="text-xs text-gray-600">
                  {new Date(version.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-xs text-gray-500">v{version.version}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ========== COLLABORATION PANEL ==========

interface CollaborationPanelProps {
  agentProfile: AgentProfile
  clientProfile?: ClientProfile
  onShareDocument: (permissions: any) => void
  onAddComment: (comment: string, selection: any) => void
  comments: any[]
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  agentProfile,
  clientProfile,
  onShareDocument,
  onAddComment,
  comments,
}) => {
  const [newComment, setNewComment] = useState('')
  const [sharePermissions, setSharePermissions] = useState({
    client: 'view',
    broker: 'comment',
    public: 'none',
  })

  const addComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), { start: 0, end: 0 })
      setNewComment('')
    }
  }

  const shareDocument = () => {
    onShareDocument(sharePermissions)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Collaboration</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with Client
            </label>
            <select
              value={sharePermissions.client}
              onChange={e =>
                setSharePermissions(prev => ({
                  ...prev,
                  client: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No access</option>
              <option value="view">View only</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with Broker
            </label>
            <select
              value={sharePermissions.broker}
              onChange={e =>
                setSharePermissions(prev => ({
                  ...prev,
                  broker: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No access</option>
              <option value="view">View only</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
          </div>

          <Button onClick={shareDocument} size="sm" className="w-full">
            Update Sharing
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((comment, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{comment.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={addComment}
            disabled={!newComment.trim()}
            size="sm"
            className="mt-2"
          >
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========== MAIN DOCUMENT PREVIEW COMPONENT ==========

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentId,
  initialContent = '',
  documentType,
  agentProfile,
  clientProfile,
  onSave,
  onClose,
  readOnly = false,
}) => {
  const [content, setContent] = useState(initialContent)
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    wordCount: 0,
    paragraphCount: 0,
    readingTime: 0,
    lastSaved: new Date(),
    version: '1.0',
    status: 'draft',
  })
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMetadata, setShowMetadata] = useState(true)
  const [showCollaboration, setShowCollaboration] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Update metadata when content changes
  useEffect(() => {
    const words = content.split(/\s+/).filter(word => word.length > 0)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)

    setMetadata(prev => ({
      ...prev,
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      readingTime: Math.ceil(words.length / 200), // 200 words per minute
    }))

    // Auto-save after 2 seconds of inactivity
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [content])

  // Load document if documentId is provided
  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  const loadDocument = async () => {
    if (!documentId) return

    try {
      const document = await getDocument(documentId)
      setContent(document.content)
      setMetadata(prev => ({
        ...prev,
        status: document.status,
        version: document.version,
        lastSaved: new Date(document.updatedAt),
      }))
      // Load versions and comments if available
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    }
  }

  const handleSave = async () => {
    if (readOnly) return

    setSaving(true)
    setError('')

    try {
      const updatedMetadata = {
        ...metadata,
        lastSaved: new Date(),
      }

      await onSave(content, updatedMetadata)
      setMetadata(updatedMetadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const handleFormat = (format: string) => {
    if (readOnly || !editorRef.current) return

    const textarea = editorRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let formattedText = selectedText
    let newContent = content

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
      case 'heading':
        formattedText = `# ${selectedText}`
        break
      case 'list':
        formattedText = `• ${selectedText}`
        break
      case 'quote':
        formattedText = `> ${selectedText}`
        break
    }

    newContent =
      content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)

    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length
      )
    }, 0)
  }

  const handleInsert = (type: string) => {
    if (readOnly || !editorRef.current) return

    const insertTemplates = {
      signature:
        '\n\n_________________________\n[Agent Name]\n[Title]\n[Brokerage]\n[Phone] | [Email]',
      date: new Date().toLocaleDateString(),
      property_info: `\nProperty: [Property Address]\nPrice: [Purchase Price]\nType: [Property Type]\nFeatures: [Key Features]`,
      client_info: `\nClient: [Client Name]\nRole: [Buyer/Seller]\nPhone: [Client Phone]\nEmail: [Client Email]`,
      agent_info: `\nAgent: ${agentProfile.personalInfo.firstName} ${agentProfile.personalInfo.lastName}\nBrokerage: ${agentProfile.licenseInfo.brokerageName}\nPhone: ${agentProfile.personalInfo.phone}\nEmail: ${agentProfile.email}`,
    }

    const template = insertTemplates[type as keyof typeof insertTemplates] || ''
    const textarea = editorRef.current
    const start = textarea.selectionStart
    const newContent =
      content.substring(0, start) + template + content.substring(start)

    setContent(newContent)

    // Position cursor after inserted text
    setTimeout(() => {
      textarea.setSelectionRange(
        start + template.length,
        start + template.length
      )
    }, 0)
  }

  const handleAction = async (action: string) => {
    switch (action) {
      case 'save':
        await handleSave()
        break
      case 'ai_improve':
        // TODO: Implement AI improvement
        console.log('AI improvement not implemented yet')
        break
      case 'print':
        window.print()
        break
      case 'export':
        // TODO: Implement export functionality
        console.log('Export not implemented yet')
        break
    }
  }

  const handleStatusChange = (status: string) => {
    setMetadata(prev => ({
      ...prev,
      status: status as 'draft' | 'review' | 'final',
    }))
  }

  const handleVersionCreate = () => {
    const newVersion: DocumentVersion = {
      id: `v${versions.length + 1}`,
      name: `Version ${versions.length + 1}`,
      version: `${versions.length + 1}.0`,
      content,
      createdAt: new Date(),
      createdBy: agentProfile.id,
    }
    setVersions(prev => [...prev, newVersion])
  }

  const handleVersionSelect = (version: DocumentVersion) => {
    setContent(version.content)
    setMetadata(prev => ({ ...prev, version: version.version }))
  }

  const handleShareDocument = (permissions: any) => {
    console.log('Sharing document with permissions:', permissions)
    // TODO: Implement document sharing
  }

  const handleAddComment = (comment: string, selection: any) => {
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      author: `${agentProfile.personalInfo.firstName} ${agentProfile.personalInfo.lastName}`,
      createdAt: new Date(),
      selection,
    }
    setComments(prev => [...prev, newComment])
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {documentType
                .replace('_', ' ')
                .replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
            <p className="text-sm text-gray-600">
              {saving
                ? 'Saving...'
                : `Last saved: ${metadata.lastSaved.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowMetadata(!showMetadata)}
              variant="outline"
              size="sm"
            >
              📊 Info
            </Button>
            <Button
              onClick={() => setShowCollaboration(!showCollaboration)}
              variant="outline"
              size="sm"
            >
              👥 Share
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              ✕ Close
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar
          onFormat={handleFormat}
          onInsert={handleInsert}
          onAction={handleAction}
          readOnly={readOnly}
        />

        {/* Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="max-w-4xl mx-auto">
            <textarea
              ref={editorRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              readOnly={readOnly}
              className="w-full h-full min-h-[600px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
              placeholder={readOnly ? '' : 'Start typing your document...'}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
        {showMetadata && (
          <div className="p-4">
            <DocumentMetadataPanel
              metadata={metadata}
              onStatusChange={handleStatusChange}
              onVersionCreate={handleVersionCreate}
              versions={versions}
              onVersionSelect={handleVersionSelect}
            />
          </div>
        )}

        {showCollaboration && (
          <div className="p-4">
            <CollaborationPanel
              agentProfile={agentProfile}
              clientProfile={clientProfile}
              onShareDocument={handleShareDocument}
              onAddComment={handleAddComment}
              comments={comments}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ========== DOCUMENT SELECTOR COMPONENT ==========

interface DocumentSelectorProps {
  documents: any[]
  onDocumentSelect: (document: any) => void
  onCreateNew: () => void
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  onDocumentSelect,
  onCreateNew,
}) => {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.type === filter
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.content.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'cover_letter':
        return '📝'
      case 'explanation_memo':
        return '📋'
      case 'negotiation_strategy':
        return '🎯'
      case 'offer_analysis':
        return '📊'
      case 'market_analysis':
        return '📈'
      default:
        return '📄'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
          + New Document
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="cover_letter">Cover Letters</option>
          <option value="explanation_memo">Explanation Memos</option>
          <option value="negotiation_strategy">Negotiation Strategies</option>
          <option value="offer_analysis">Offer Analysis</option>
          <option value="market_analysis">Market Analysis</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredDocuments.map(document => (
          <div
            key={document.id}
            className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onDocumentSelect(document)}
          >
            <div className="text-2xl mr-4">
              {getDocumentIcon(document.type)}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{document.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {document.metadata.wordCount} words •{' '}
                {document.metadata.readingTime} min read
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Updated {new Date(document.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  document.metadata.status === 'final'
                    ? 'bg-green-100 text-green-800'
                    : document.metadata.status === 'review'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {document.metadata.status}
              </span>
              <span className="text-xs text-gray-500">
                v{document.metadata.version}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {documents.length === 0
              ? 'No documents yet'
              : 'No documents match your filter'}
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Document
          </Button>
        </div>
      )}
    </div>
  )
}

export default DocumentPreview
