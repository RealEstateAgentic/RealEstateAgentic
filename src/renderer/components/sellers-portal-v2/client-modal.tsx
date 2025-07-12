/**
 * Client Modal Component for Sellers Portal V2
 * Implements the detailed modal with tabs and stage-specific functionality
 * Modal occupies 85% of window height/width as specified
 */

import { useState, useEffect } from 'react'
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Plus,
  Home,
  Clock,
  Archive,
  ArrowRight,
  RotateCcw,
  History,
  FolderOpen,
  CalendarDays,
  Upload,
  Eye,
  Edit,
  MessageCircle,
  User,
  Send,
  CheckCircle,
  AlertCircle,
  Settings,
  Star,
  TrendingUp,
  Users,
  Save,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../ui/button'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import { dummyData } from '../../data/dummy-data'
import { LeadScoringDisplay } from '../shared/lead-scoring-display'
import {
  getClientDocuments,
  deleteDocument,
} from '../../../lib/firebase/collections/documents'
import { EmailHistory } from '../shared/email-history'

interface ClientModalProps {
  client: {
    id: number
    name: string
    email: string
    phone: string
    stage: string
    subStatus: string
    propertyAddress: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    timeline: string
    reasonForSelling: string
    leadSource: string
    priority: string
    dateAdded: string
    lastContact: string | null
    notes: string
    initialTab?: string
    initialDocumentId?: string
  }
  onClose: () => void
  onArchive?: (client: any) => void
  onProgress?: (client: any) => void
  onUnarchive?: (client: any) => void
  isArchiveMode?: boolean
  currentUser?: any
}

export function ClientModal({
  client,
  onClose,
  onArchive,
  onProgress,
  onUnarchive,
  isArchiveMode = false,
  currentUser,
}: ClientModalProps) {
  const [activeTab, setActiveTab] = useState(
    client.initialTab || 'ai_lead_scoring'
  )
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    tags: '',
  })
  const [editableDetails, setEditableDetails] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone,
    propertyAddress: client.propertyAddress,
    propertyType: client.propertyType,
    bedrooms: client.bedrooms,
    bathrooms: client.bathrooms,
    timeline: client.timeline,
    reasonForSelling: client.reasonForSelling,
    leadSource: client.leadSource,
    priority: client.priority,
    notes: client.notes,
  })
  // Documents state for seller
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [deletingAllDocuments, setDeletingAllDocuments] = useState(false)

  // Load documents for this client
  const loadClientDocuments = async () => {
    setLoadingDocuments(true)
    try {
      const clientId = createClientId(
        client.name.trim().split(' ')[0] || 'Client',
        client.name.trim().split(' ').slice(1).join(' ') || 'Name'
      )

      console.log('🔍 Loading documents for client:', clientId)

      // Try querying with category filter first (same as DocumentGenerator)
      let result = await getClientDocuments(clientId, {
        category: 'client_communications',
        limit: 10,
      })

      console.log('📄 Document query result (with category):', result)

      // If no results with category, try without category filter
      if (!result.success || !result.data || result.data.length === 0) {
        console.log('🔍 Trying query without category filter...')
        result = await getClientDocuments(clientId, {
          limit: 10,
        })
        console.log('📄 Document query result (without category):', result)
      }

      if (result.success && result.data) {
        console.log('✅ Found', result.data.length, 'documents for client')
        setDocuments(result.data)
      } else {
        console.log('⚠️ No documents found:', result.error)
        setDocuments([])
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error)
      setDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Create a client ID (same format as DocumentGenerator)
  const createClientId = (firstName: string, lastName: string): string => {
    const sanitize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    return `${sanitize(firstName)}-${sanitize(lastName)}` || 'unknown-client'
  }

  // Delete all documents for this client
  const handleDeleteAllDocuments = async () => {
    if (!documents.length) return

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${documents.length} documents for ${client.name}? This action cannot be undone.`
    )

    if (!confirmed) return

    setDeletingAllDocuments(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const doc of documents) {
        try {
          const result = await deleteDocument(doc.id)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to delete document ${doc.id}:`, result.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error deleting document ${doc.id}:`, error)
        }
      }

      if (successCount > 0) {
        setDocuments([])
        alert(
          `Successfully deleted ${successCount} documents${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        )
      } else {
        alert('Failed to delete any documents. Please try again.')
      }
    } catch (error) {
      console.error('Error in delete all operation:', error)
      alert('An error occurred while deleting documents. Please try again.')
    } finally {
      setDeletingAllDocuments(false)
    }
  }

  // Load documents when component mounts or when active tab changes to documents
  useEffect(() => {
    if (activeTab === 'documents') {
      loadClientDocuments()
    }
  }, [activeTab, client.id])

  // Handle initial document opening
  useEffect(() => {
    if (client.initialDocumentId && activeTab === 'documents') {
      const doc = documents.find(
        d => d.id === Number.parseInt(client.initialDocumentId || '0', 10)
      )
      if (doc) {
        setSelectedDocument({
          ...doc,
          content:
            'This is the document content that would be displayed in a scrollable modal.',
        })
      }
    }
  }, [client.initialDocumentId, activeTab, documents])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getProgressButtonText = (stage: string) => {
    switch (stage) {
      case 'new_lead':
        return 'Progress to Pre-Listing'
      case 'pre_listing':
        return 'Progress to Active Listing'
      case 'active_listing':
        return 'Progress to Under Contract'
      case 'under_contract':
        return 'Progress to Closed'
      default:
        return null
    }
  }

  const getPreviousStageText = (stage: string) => {
    switch (stage) {
      case 'pre_listing':
        return 'Return to New Lead'
      case 'active_listing':
        return 'Return to Pre-Listing'
      case 'under_contract':
        return 'Return to Active Listing'
      case 'closed':
        return 'Return to Under Contract'
      default:
        return null
    }
  }

  const shouldShowProgressButton = (stage: string) => {
    return stage !== 'closed'
  }

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new_lead':
        return 'New Lead'
      case 'pre_listing':
        return 'Pre-Listing'
      case 'active_listing':
        return 'Active Listing'
      case 'under_contract':
        return 'Under Contract'
      case 'closed':
        return 'Closed'
      default:
        return stage
    }
  }

  const handleArchive = () => {
    if (onArchive) {
      onArchive(client)
    }
  }

  const handleProgress = () => {
    if (onProgress) {
      onProgress(client)
    }
  }

  const handleUnarchive = () => {
    if (onUnarchive) {
      onUnarchive(client)
    }
  }

  const handleReturnToPreviousStage = () => {
    console.log('Return to previous stage clicked for client:', client.id)
  }

  const handleUploadDocument = () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      alert('Please select a file and provide a title')
      return
    }

    const newDocument = {
      id: Date.now(),
      title: uploadForm.title,
      type: uploadForm.file.type.split('/')[1].toUpperCase(),
      size: `${(uploadForm.file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      description: uploadForm.description,
      tags: uploadForm.tags,
    }

    setDocuments([...documents, newDocument])
    setIsUploadModalOpen(false)
    setUploadForm({ file: null, title: '', description: '', tags: '' })
  }

  const handleUploadButtonClick = () => {
    setIsUploadModalOpen(true)
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument({
      ...document,
      content: `This is the content of "${document.title}". In a real application, this would display the actual document content in a scrollable format.`,
    })
  }

  const handleDownloadDocument = (document: any) => {
    // Simulate download
    console.log('Downloading document:', document.title)
    alert(`Downloading ${document.title}`)
  }

  const handleSaveDetails = () => {
    console.log('Saving client details:', editableDetails)
    // In a real app, this would save to database
    setIsEditingDetails(false)
  }

  const handleCancelEditDetails = () => {
    setEditableDetails({
      name: client.name,
      email: client.email,
      phone: client.phone,
      propertyAddress: client.propertyAddress,
      propertyType: client.propertyType,
      bedrooms: client.bedrooms,
      bathrooms: client.bathrooms,
      timeline: client.timeline,
      reasonForSelling: client.reasonForSelling,
      leadSource: client.leadSource,
      priority: client.priority,
      notes: client.notes,
    })
    setIsEditingDetails(false)
  }

  // Handler for Generate Documents button
  const handleGenerateDocuments = () => {
    if (!currentUser) {
      alert('Please make sure you are logged in to generate documents.')
      return
    }

    if (!currentUser.displayName) {
      alert(
        'Agent profile is incomplete. Please update your profile before generating documents.'
      )
      return
    }

    setShowDocumentGenerator(true)
  }

  // Create adapter for AgentProfile to match DocumentGenerator expectations
  const createAgentProfileAdapter = (): any => {
    if (!currentUser) return null

    try {
      // Parse agent name
      const nameParts = (currentUser.displayName || '').trim().split(' ')
      const firstName = nameParts[0] || 'Agent'
      const lastName = nameParts.slice(1).join(' ') || 'Name'

      return {
        ...currentUser,
        personalInfo: {
          firstName,
          lastName,
          phone: currentUser.phoneNumber || 'Unknown Phone',
        },
        licenseInfo: {
          brokerageName: currentUser.brokerage || 'Unknown Brokerage',
          yearsExperience: currentUser.yearsExperience || 0,
          licenseNumber: currentUser.licenseNumber || 'Unknown License',
        },
      }
    } catch (error) {
      console.error('Error creating agent profile adapter:', error)
      return {
        ...currentUser,
        personalInfo: {
          firstName: 'Agent',
          lastName: 'Name',
          phone: 'Unknown Phone',
        },
        licenseInfo: {
          brokerageName: 'Unknown Brokerage',
          yearsExperience: 0,
          licenseNumber: 'Unknown License',
        },
      }
    }
  }

  // Create client profile for Document Generator
  const createClientProfile = () => {
    const nameParts = client.name.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Name'

    return {
      personalInfo: {
        firstName,
        lastName,
        city: 'Unknown City',
        state: 'Unknown State',
        zipCode: 'Unknown Zip',
      },
      clientType: 'seller',
      preferences: {
        timeframe: client.timeline || '3-6 months',
      },
    }
  }

  const handleDocumentGenerated = (result: any) => {
    console.log('Document generated:', result)
    // Keep the modal open for user to review generated documents
  }

  const handleCancelDocumentGeneration = () => {
    setShowDocumentGenerator(false)
  }

  // Define which tabs should be visible based on client stage
  const getVisibleTabs = () => {
    // Removed Offers tab from Active Listing stage per Phase 5 Task 5.3
    // Removed Contingencies tab - no longer needed

    const alwaysVisibleTabs = [
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen }, // Renamed from 'content'
      // Removed 'email_history' tab as requested
    ]

    return [...alwaysVisibleTabs]
  }

  // Updated stage actions with removed buttons per requirements
  const getStageActions = () => {
    switch (client.stage) {
      case 'new_lead':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
              <Send className="size-4 mr-2" />
              Send Survey
            </Button>
            <Button variant="outline">
              <Download className="size-4 mr-2" />
              Download Meeting Materials
            </Button>
          </div>
        )
      case 'pre_listing':
        return (
          <div className="flex flex-wrap gap-2">
            {/* Removed "Schedule Listing Appointment" button per Task 4.2 */}
            <Button
              onClick={handleGenerateDocuments}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              <FileText className="size-4 mr-2" />
              Generate Documents
            </Button>
          </div>
        )
      case 'active_listing':
        return (
          <div className="flex flex-wrap gap-2">
            {/* Removed "Add Showing Notes" button per Phase 5 Task 5.1 */}
            <Button
              onClick={handleGenerateDocuments}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              <FileText className="size-4 mr-2" />
              Generate Documents
            </Button>
          </div>
        )
      case 'under_contract':
        return (
          <div className="flex flex-wrap gap-2">
            {/* Removed "Draft Negotiation Response" button */}
            {/* Removed "Edit Contingencies" button */}
          </div>
        )
      case 'closed':
        return (
          <div className="flex flex-wrap gap-2">
            {/* Removed "Archive Client" button per Phase 7 Task 7.1 */}
            {/* All action buttons have been removed for closed stage */}
          </div>
        )
      default:
        return null
    }
  }

  const getStageSpecificContent = () => {
    switch (client.stage) {
      case 'new_lead':
        return (
          <div className="space-y-4">
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">Survey Status</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Survey Status:</strong>{' '}
                  {client.subStatus === 'awaiting_survey'
                    ? 'Pending'
                    : 'Completed'}
                </div>
                <div>
                  <strong>Lead Source:</strong> {client.leadSource}
                </div>
                <div>
                  <strong>Priority:</strong> {client.priority}
                </div>
                <div>
                  <strong>Date Added:</strong> {formatDate(client.dateAdded)}
                </div>
              </div>
            </div>
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">AI Briefing</h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'to_initiate_contact' &&
                  'Ready for initial consultation call. Seller profile indicates potential for listing.'}
                {client.subStatus === 'awaiting_survey' &&
                  'Survey sent to seller. Follow up recommended if no response within 48 hours.'}
                {client.subStatus === 'review_survey' &&
                  'Survey completed. Review responses and prepare personalized seller consultation.'}
                {client.subStatus === 'awaiting_signing' &&
                  'Seller is ready to sign listing agreement. Schedule signing appointment.'}
              </p>
            </div>
          </div>
        )
      case 'pre_listing':
        return (
          <div className="space-y-6 min-h-full">
            <div className="bg-[#A9D09E]/10 p-6 rounded-lg border border-[#A9D09E]/30 flex-1">
              <h4 className="font-medium text-gray-800 mb-4">CMA Status</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>CMA Status:</strong>{' '}
                  {client.subStatus === 'preparing_cma'
                    ? 'In Progress'
                    : 'Completed'}
                </div>
                <div>
                  <strong>Market Analysis:</strong> Comparative analysis of 5
                  similar properties
                </div>
                <div>
                  <strong>Suggested List Price:</strong> $425,000 - $450,000
                </div>
                <div className="pt-4 space-y-2">
                  <div>
                    <strong>Comparable Properties:</strong>
                  </div>
                  <div className="text-xs text-gray-600">
                    • 456 Oak Street - $445,000 (15 days on market)
                  </div>
                  <div className="text-xs text-gray-600">
                    • 789 Pine Avenue - $430,000 (22 days on market)
                  </div>
                  <div className="text-xs text-gray-600">
                    • 321 Maple Drive - $465,000 (8 days on market)
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#F6E2BC]/30 p-6 rounded-lg border border-[#F6E2BC]/50 flex-1">
              <h4 className="font-medium text-gray-800 mb-4">
                Listing Preparation
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Property Photos</span>
                  <span className="text-orange-600">Scheduled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Listing Agreement</span>
                  <span className="text-green-600">Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MLS Preparation</span>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="pt-4 space-y-2">
                  <div>
                    <strong>Next Steps:</strong>
                  </div>
                  <div className="text-xs text-gray-600">
                    • Schedule professional photography
                  </div>
                  <div className="text-xs text-gray-600">
                    • Complete staging recommendations
                  </div>
                  <div className="text-xs text-gray-600">
                    • Finalize MLS description and details
                  </div>
                  <div className="text-xs text-gray-600">
                    • Set listing price and strategy
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'active_listing':
        return (
          <div className="space-y-4">
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Showing Feedback Hub
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Recent showing feedback from buyer's agents
              </p>
              <div className="space-y-2 text-sm">
                <div className="bg-white p-2 rounded border">
                  <div className="font-medium">
                    Showing 1/12 - Positive feedback
                  </div>
                  <div className="text-gray-600">
                    Buyers loved the kitchen updates
                  </div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-medium">
                    Showing 1/10 - Neutral feedback
                  </div>
                  <div className="text-gray-600">
                    Buyers concerned about backyard size
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-3">
                Listing Performance
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#3B7097]">247</div>
                  <div className="text-xs text-gray-600">Online Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#A9D09E]">12</div>
                  <div className="text-xs text-gray-600">Saves</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#c05e51]">8</div>
                  <div className="text-xs text-gray-600">Showings</div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'under_contract':
        return (
          <div className="space-y-4">
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Contract Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Contract Price:</strong> $435,000
                </div>
                <div>
                  <strong>Buyer Agent:</strong> Jane Smith, ABC Realty
                </div>
                <div>
                  <strong>Closing Date:</strong> February 15, 2024
                </div>
                <div>
                  <strong>Contract Date:</strong> January 5, 2024
                </div>
              </div>
            </div>
            <div className="bg-[#F6E2BC]/30 p-4 rounded-lg border border-[#F6E2BC]/50">
              <h4 className="font-medium text-gray-800 mb-2">
                Transaction Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Inspection Period</span>
                  <span className="text-orange-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Appraisal</span>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Financing</span>
                  <span className="text-gray-600">Pending</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'closed':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Closing Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Final Sale Price:</strong> $432,000
                </div>
                <div>
                  <strong>Closing Date:</strong> February 12, 2024
                </div>
                <div>
                  <strong>Days on Market:</strong> 18 days
                </div>
                <div>
                  <strong>Commission:</strong> $12,960
                </div>
              </div>
            </div>
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Post-Closing Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Keys Transferred</span>
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Final Walkthrough</span>
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Utilities Transferred</span>
                  <CheckCircle className="size-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="text-gray-500">
              No stage-specific content available.
            </div>
          </div>
        )
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Documents and Content
              </h3>
              <div className="flex space-x-2">
                <Button
                  onClick={loadClientDocuments}
                  variant="outline"
                  size="sm"
                  disabled={loadingDocuments}
                >
                  <RefreshCw
                    className={`size-4 mr-2 ${loadingDocuments ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                {documents.length > 0 && (
                  <Button
                    onClick={handleDeleteAllDocuments}
                    variant="outline"
                    size="sm"
                    disabled={deletingAllDocuments}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="size-4 mr-2" />
                    {deletingAllDocuments ? 'Deleting...' : 'Delete All'}
                  </Button>
                )}
                <Button
                  onClick={handleUploadButtonClick}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 h-auto"
                >
                  <Upload className="size-4 mr-1" />
                  Upload Content
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    Loading documents...
                  </span>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map(document => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="size-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-800">
                            {document.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {document.type} • {document.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="size-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(document)}
                        >
                          <Download className="size-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Documents will appear here when uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Widget C: Recent Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MessageCircle className="size-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-800">
                  Recent Notes & Insights
                </h3>
              </div>
              <div className="space-y-3 max-h-32 overflow-y-auto">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{client.notes}</p>
                  <span className="text-xs text-gray-500 mt-1">
                    Manual Note • {formatDate(client.dateAdded)}
                  </span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    AI Insight: Property appears to be well-maintained based on
                    initial consultation.
                  </p>
                  <span className="text-xs text-gray-500 mt-1">
                    AI Generated • 2 days ago
                  </span>
                </div>
              </div>
            </div>

            {/* Widget D: Next Event */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Calendar className="size-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Next Event</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-blue-800 mb-1">
                    Listing Consultation
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    {client.propertyAddress}
                  </p>
                  <div className="flex items-center justify-center text-sm text-blue-600">
                    <Calendar className="size-4 mr-1" />
                    <span>Tomorrow at 2:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="text-gray-500">Select a tab to view content.</div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Document View Modal */}
      {selectedDocument && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedDocument.title}
                </h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedDocument.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upload Document</h2>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={e =>
                      setUploadForm({
                        ...uploadForm,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={e =>
                      setUploadForm({ ...uploadForm, title: e.target.value })
                    }
                    placeholder="Enter document title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={e =>
                      setUploadForm({
                        ...uploadForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of the document"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={e =>
                      setUploadForm({ ...uploadForm, tags: e.target.value })
                    }
                    placeholder="e.g., contract, inspection, photos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setIsUploadModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadDocument}
                    className="flex-1 bg-[#3B7097] hover:bg-[#3B7097]/90"
                  >
                    Upload Document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Client Details</h2>
                <button
                  onClick={handleCancelEditDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editableDetails.name}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editableDetails.email}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editableDetails.phone}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address
                  </label>
                  <input
                    type="text"
                    value={editableDetails.propertyAddress}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        propertyAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      value={editableDetails.propertyType}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          propertyType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="Single Family">Single Family</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Condo">Condo</option>
                      <option value="Multi-Family">Multi-Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={editableDetails.bedrooms}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          bedrooms: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={editableDetails.bathrooms}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          bathrooms: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline
                    </label>
                    <select
                      value={editableDetails.timeline}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          timeline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={editableDetails.priority}
                      onChange={e =>
                        setEditableDetails({
                          ...editableDetails,
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Selling
                  </label>
                  <input
                    type="text"
                    value={editableDetails.reasonForSelling}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        reasonForSelling: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editableDetails.notes}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleCancelEditDetails}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDetails}
                    className="flex-1 bg-[#3B7097] hover:bg-[#3B7097]/90"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="bg-white rounded-lg w-[85vw] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditingDetails ? editableDetails.name : client.name}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <span>{getStageName(client.stage)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>
                  {isEditingDetails
                    ? editableDetails.propertyAddress
                    : client.propertyAddress}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <Calendar className="size-4" />
                <span>Date Added: {formatDate(client.dateAdded)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <a
                href={`tel:${isEditingDetails ? editableDetails.phone : client.phone}`}
                className="text-gray-500 hover:text-[#3B7097]"
              >
                <Phone className="size-5" />
              </a>
              <a
                href={`mailto:${isEditingDetails ? editableDetails.email : client.email}`}
                className="text-gray-500 hover:text-[#3B7097]"
              >
                <Mail className="size-5" />
              </a>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {getVisibleTabs().map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#3B7097] text-[#3B7097]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon && <tab.icon className="size-4" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex flex-wrap gap-2">
            {/* Stage-specific actions */}
            {getStageActions()}

            {/* Edit Details Button - Always present */}
            <Button
              onClick={() => setIsEditingDetails(true)}
              variant="outline"
              className="border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
            >
              <Edit className="size-4 mr-2" />
              Edit Details
            </Button>

            {/* Archive/Unarchive Logic */}
            {isArchiveMode ? (
              <Button
                onClick={handleUnarchive}
                className="bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="size-4 mr-2" />
                Unarchive
              </Button>
            ) : (
              <Button
                onClick={handleArchive}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Archive className="size-4 mr-2" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Document Generator Modal */}
      {showDocumentGenerator && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Generate Documents for {client.name}
                </h2>
                <button
                  onClick={handleCancelDocumentGeneration}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
              <DocumentGenerator
                agentProfile={createAgentProfileAdapter()}
                clientProfile={createClientProfile()}
                onDocumentGenerated={handleDocumentGenerated}
                onCancel={handleCancelDocumentGeneration}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
