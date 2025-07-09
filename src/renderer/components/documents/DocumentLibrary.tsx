/**
 * Document Library Component
 *
 * Comprehensive document management interface for real estate agents
 * with PDF generation, template management, file operations, and
 * document versioning capabilities. Integrates with Electron main process
 * for secure file operations.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../lib/firebase/hooks'
import { DOCUMENT_TYPES, DOCUMENT_STATUS } from '../../../shared/constants'
import { Button } from '../ui/button'
import {
  AlertCircle,
  Download,
  Edit,
  Eye,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  FileCheck,
  Clock,
  Share2,
  Filter,
  Grid,
  List,
  RefreshCw,
  Star,
  Tag,
  Calendar,
  User,
  Archive,
} from 'lucide-react'

// ========== TYPE DEFINITIONS ==========

interface DocumentItem {
  id: string
  title: string
  type: keyof typeof DOCUMENT_TYPES
  status: keyof typeof DOCUMENT_STATUS
  filePath: string
  createdAt: string
  updatedAt: string
  size: number
  version: number
  author: string
  tags: string[]
  isFavorite: boolean
  clientName?: string
  propertyAddress?: string
  metadata?: Record<string, any>
}

interface DocumentFilter {
  type: keyof typeof DOCUMENT_TYPES | 'all'
  status: keyof typeof DOCUMENT_STATUS | 'all'
  dateRange: string
  author: string
  tags: string[]
  searchTerm: string
}

interface ViewMode {
  type: 'grid' | 'list'
  sortBy: 'date' | 'name' | 'type' | 'status'
  sortOrder: 'asc' | 'desc'
}

// ========== MAIN COMPONENT ==========

export const DocumentLibrary: React.FC = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentItem[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'documents' | 'templates' | 'shared'
  >('documents')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(
    null
  )

  // Filter and view state
  const [filter, setFilter] = useState<DocumentFilter>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    author: 'all',
    tags: [],
    searchTerm: '',
  })

  const [viewMode, setViewMode] = useState<ViewMode>({
    type: 'grid',
    sortBy: 'date',
    sortOrder: 'desc',
  })

  // ========== DOCUMENT OPERATIONS ==========

  const loadDocuments = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const userDataPath = await window.App.system.getUserDataPath()
      const documentsPath = `${userDataPath}/documents`

      const result = await window.App.documents.list(documentsPath)

      if (result.success && result.documents) {
        // Load document metadata for each file
        const documentPromises = result.documents.map(
          async (fileName: string) => {
            try {
              const filePath = `${documentsPath}/${fileName}`
              const metadata = await window.App.documents.load(
                `${filePath}.json`
              )

              if (metadata.success) {
                return {
                  id: fileName.replace('.pdf', ''),
                  filePath,
                  ...metadata.document,
                }
              }

              // Fallback for files without metadata
              return {
                id: fileName.replace('.pdf', ''),
                title: fileName.replace('.pdf', ''),
                type: 'COVER_LETTER' as keyof typeof DOCUMENT_TYPES,
                status: 'DRAFT' as keyof typeof DOCUMENT_STATUS,
                filePath,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                size: 0,
                version: 1,
                author: user.displayName || user.email,
                tags: [],
                isFavorite: false,
              }
            } catch (error) {
              console.error('Error loading document metadata:', error)
              return null
            }
          }
        )

        const loadedDocuments = (await Promise.all(documentPromises)).filter(
          doc => doc !== null
        ) as DocumentItem[]

        setDocuments(loadedDocuments)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setError('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const createDocument = useCallback(
    async (
      title: string,
      type: keyof typeof DOCUMENT_TYPES,
      content: string,
      metadata?: Record<string, any>
    ) => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const agentProfile = {
          displayName: user.displayName || 'Real Estate Agent',
          email: user.email,
          brokerage: 'Real Estate Brokerage',
          phoneNumber: '(555) 123-4567',
        }

        const documentContent = {
          title,
          content,
          type,
          metadata: {
            ...metadata,
            author: user.displayName || user.email,
            creator: 'Real Estate Agentic',
          },
        }

        const result = await window.App.pdf.generateDocument(
          documentContent,
          agentProfile,
          metadata?.clientProfile
        )

        if (result.success && result.filePath) {
          const newDocument: DocumentItem = {
            id: `${Date.now()}`,
            title,
            type,
            status: 'DRAFT',
            filePath: result.filePath,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            size: result.size || 0,
            version: 1,
            author: user.displayName || user.email,
            tags: [],
            isFavorite: false,
            ...metadata,
          }

          // Save document metadata
          await window.App.documents.save(
            newDocument,
            `${result.filePath}.json`
          )

          setDocuments(prev => [...prev, newDocument])
          setShowCreateDialog(false)

          // Track document creation
          await window.App.analytics.trackDocumentView(newDocument.id, {
            action: 'created',
            type: newDocument.type,
          })
        } else {
          throw new Error(result.error || 'Failed to generate document')
        }
      } catch (error) {
        console.error('Error creating document:', error)
        setError('Failed to create document')
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      const document = documents.find(doc => doc.id === documentId)
      if (!document) return

      setIsLoading(true)
      setError(null)

      try {
        // Delete PDF file
        await window.App.documents.delete(document.filePath)

        // Delete metadata file
        await window.App.documents.delete(`${document.filePath}.json`)

        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setSelectedDocuments(prev => {
          const newSet = new Set(prev)
          newSet.delete(documentId)
          return newSet
        })
      } catch (error) {
        console.error('Error deleting document:', error)
        setError('Failed to delete document')
      } finally {
        setIsLoading(false)
      }
    },
    [documents]
  )

  const openDocument = useCallback(async (document: DocumentItem) => {
    try {
      const opened = await window.App.pdf.openPDF(document.filePath)
      if (opened) {
        await window.App.analytics.trackDocumentView(document.id, {
          action: 'opened',
          type: document.type,
        })
      }
    } catch (error) {
      console.error('Error opening document:', error)
      setError('Failed to open document')
    }
  }, [])

  const downloadDocument = useCallback(async (document: DocumentItem) => {
    try {
      const options = {
        title: 'Save Document',
        defaultPath: `${document.title}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      }

      const result = await window.App.files.showSaveDialog(options)

      if (result.success && result.filePath) {
        // Copy file to selected location
        const fileContent = await window.App.files.read(document.filePath)
        if (fileContent.success) {
          await window.App.files.save(result.filePath, fileContent.data)

          await window.App.analytics.trackDocumentDownload(document.id, {
            action: 'downloaded',
            type: document.type,
          })
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      setError('Failed to download document')
    }
  }, [])

  const toggleFavorite = useCallback(
    async (documentId: string) => {
      const document = documents.find(doc => doc.id === documentId)
      if (!document) return

      try {
        const updatedDocument = {
          ...document,
          isFavorite: !document.isFavorite,
        }

        await window.App.documents.save(
          updatedDocument,
          `${document.filePath}.json`
        )

        setDocuments(prev =>
          prev.map(doc => (doc.id === documentId ? updatedDocument : doc))
        )
      } catch (error) {
        console.error('Error toggling favorite:', error)
        setError('Failed to update favorite status')
      }
    },
    [documents]
  )

  // ========== FILTERING AND SORTING ==========

  const applyFilters = useCallback(() => {
    let filtered = [...documents]

    // Apply filters
    if (filter.type !== 'all') {
      filtered = filtered.filter(doc => doc.type === filter.type)
    }

    if (filter.status !== 'all') {
      filtered = filtered.filter(doc => doc.status === filter.status)
    }

    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase()
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.clientName?.toLowerCase().includes(searchLower) ||
          doc.propertyAddress?.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filter.tags.length > 0) {
      filtered = filtered.filter(doc =>
        filter.tags.every(tag => doc.tags.includes(tag))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (viewMode.sortBy) {
        case 'name':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'date':
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
      }

      if (viewMode.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      }
    })

    setFilteredDocuments(filtered)
  }, [documents, filter, viewMode])

  // ========== EFFECTS ==========

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // ========== DOCUMENT CARDS ==========

  const DocumentCard: React.FC<{ document: DocumentItem }> = ({ document }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">
            {document.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => toggleFavorite(document.id)}
            className={`p-1 rounded-full hover:bg-gray-100 ${
              document.isFavorite ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Star className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={selectedDocuments.has(document.id)}
              onChange={e => {
                const newSet = new Set(selectedDocuments)
                if (e.target.checked) {
                  newSet.add(document.id)
                } else {
                  newSet.delete(document.id)
                }
                setSelectedDocuments(newSet)
              }}
              className="rounded border-gray-300"
            />
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
        {document.title}
      </h3>

      <div className="space-y-1 text-sm text-gray-600 mb-3">
        {document.clientName && (
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{document.clientName}</span>
          </div>
        )}
        {document.propertyAddress && (
          <div className="flex items-center space-x-1">
            <FolderOpen className="w-4 h-4" />
            <span className="line-clamp-1">{document.propertyAddress}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              document.status === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800'
                : document.status === 'REVIEW'
                  ? 'bg-blue-100 text-blue-800'
                  : document.status === 'FINAL'
                    ? 'bg-green-100 text-green-800'
                    : document.status === 'SHARED'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
            }`}
          >
            {document.status}
          </span>
          <span className="text-xs text-gray-500">v{document.version}</span>
        </div>
        <span className="text-xs text-gray-500">
          {Math.round(document.size / 1024)} KB
        </span>
      </div>

      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {document.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              +{document.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDocument(document)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadDocument(document)}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewDocument(document)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => deleteDocument(document.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // ========== RENDER ==========

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-600 mt-1">
            Manage your real estate documents, templates, and PDFs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowUploadDialog(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Document</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'templates', label: 'Templates', icon: FileCheck },
          { id: 'shared', label: 'Shared', icon: Share2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filter.searchTerm}
            onChange={e =>
              setFilter(prev => ({ ...prev, searchTerm: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={filter.type}
          onChange={e =>
            setFilter(prev => ({ ...prev, type: e.target.value as any }))
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={filter.status}
          onChange={e =>
            setFilter(prev => ({ ...prev, status: e.target.value as any }))
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          {Object.entries(DOCUMENT_STATUS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(prev => ({ ...prev, type: 'grid' }))}
            className={`p-2 rounded-lg ${
              viewMode.type === 'grid'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(prev => ({ ...prev, type: 'list' }))}
            className={`p-2 rounded-lg ${
              viewMode.type === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <Button
          onClick={loadDocuments}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.size > 0 && (
        <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {selectedDocuments.size} documents selected
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
            <Button size="sm" variant="outline">
              <Tag className="w-4 h-4 mr-1" />
              Tag
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                selectedDocuments.forEach(id => deleteDocument(id))
                setSelectedDocuments(new Set())
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Document Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0
              ? "You haven't created any documents yet."
              : 'No documents match your current filters.'}
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Document</span>
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode.type === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}

      {/* Create Document Dialog */}
      {showCreateDialog && (
        <CreateDocumentDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={createDocument}
        />
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadDocumentDialog
          onClose={() => setShowUploadDialog(false)}
          onUpload={loadDocuments}
        />
      )}

      {/* Preview Dialog */}
      {previewDocument && (
        <DocumentPreviewDialog
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  )
}

// ========== DIALOGS ==========

const CreateDocumentDialog: React.FC<{
  onClose: () => void
  onSubmit: (
    title: string,
    type: keyof typeof DOCUMENT_TYPES,
    content: string,
    metadata?: any
  ) => void
}> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<keyof typeof DOCUMENT_TYPES>('COVER_LETTER')
  const [content, setContent] = useState('')
  const [clientName, setClientName] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(title, type, content, { clientName, propertyAddress })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Create New Document</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter document title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              value={type}
              onChange={e =>
                setType(e.target.value as keyof typeof DOCUMENT_TYPES)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Client name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Address
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Property address..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="Document content..."
              required
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <Button type="submit" className="flex-1">
              Create Document
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const UploadDocumentDialog: React.FC<{
  onClose: () => void
  onUpload: () => void
}> = ({ onClose, onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // Handle file drop logic here
    onUpload()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Upload Document</h2>

        <div
          onDrop={handleDrop}
          onDragOver={e => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop your files here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOC, DOCX files up to 10MB
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-6">
          <Button className="flex-1">Choose Files</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

const DocumentPreviewDialog: React.FC<{
  document: DocumentItem
  onClose: () => void
}> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{document.title}</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Type:</strong> {document.type.replace('_', ' ')}
            </div>
            <div>
              <strong>Status:</strong> {document.status}
            </div>
            <div>
              <strong>Created:</strong>{' '}
              {new Date(document.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Modified:</strong>{' '}
              {new Date(document.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-center text-gray-600">
            PDF preview will be displayed here
          </p>
        </div>
      </div>
    </div>
  )
}

export default DocumentLibrary
