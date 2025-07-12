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
  Upload,
  User,
  FolderOpen,
  CalendarDays,
  Eye,
  Edit,
  MessageCircle,
  TrendingUp,
  History,
  Send,
  CheckCircle,
  AlertCircle,
  Settings,
  Star,
  Users,
  Save,
  Loader2,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../ui/button'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import { LeadScoringDisplay } from '../shared/lead-scoring-display'
import { EmailHistory } from '../shared/email-history'
import type { AgentProfile } from '../../../shared/types'
import { dummyData } from '../../data/dummy-data'
import { gmailAuth } from '../../services/gmail-auth'
<<<<<<< HEAD
import {
  getClientDocuments,
  deleteDocument,
} from '../../../lib/firebase/collections/documents'
=======
import { useFormData, extractFormField, getFieldLabel } from '../../hooks/useFormData'
>>>>>>> 650f207 (feat: integrate JotForm client information with real-time question mapping)

// Define ClientProfile interface locally since it's not in shared types
interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  clientType: 'buyer' | 'seller'
  personalInfo: {
    firstName: string
    lastName: string
    city: string
    state: string
    zipCode: string
  }
  preferences: {
    timeframe: string
    budget?: string
    location?: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ClientModalProps {
  client: any
  onClose: () => void
  onArchive: (clientId: number) => void
  onProgress: (clientId: number, newStage: string) => void
  onUnarchive?: (clientId: number) => void
  isArchiveMode?: boolean
  currentUser?: AgentProfile | null
  navigate?: (path: string) => void
}

export function ClientModal({
  client,
  onClose,
  onArchive,
  onProgress,
  onUnarchive,
  isArchiveMode = false,
  currentUser,
  navigate,
}: ClientModalProps) {
  const [activeTab, setActiveTab] = useState(
    client.initialTab || 'ai_lead_scoring'
  )
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSendingSurvey, setIsSendingSurvey] = useState(false)
  const [editableDetails, setEditableDetails] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone,
    budget: client.budget,
    location: client.location,
    priority: client.priority,
    notes: client.notes,
  })

<<<<<<< HEAD
  // Documents state for buyer
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [deletingAllDocuments, setDeletingAllDocuments] = useState(false)

  // Load documents for this client
  const loadClientDocuments = async () => {
    setLoadingDocuments(true)
    try {
      const firstName = client.name.trim().split(' ')[0] || 'Client'
      const lastName =
        client.name.trim().split(' ').slice(1).join(' ') || 'Name'
      const clientId = createClientId(firstName, lastName)

      console.log('🔍 Loading documents for client:')
      console.log('  - Full name:', client.name)
      console.log('  - First name:', firstName)
      console.log('  - Last name:', lastName)
      console.log('  - Generated client ID:', clientId)

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
=======
  // Fetch form data and GPT analysis
  const { formData, aiSummary, submissionDate, loading: formLoading, error: formError, formQuestions } = useFormData(client.email, 'buyer')

  // Sample documents for buyer
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Buyer Survey Results',
      type: 'PDF',
      size: '2.1 MB',
      uploadDate: '2024-01-10',
      description: 'Initial buyer questionnaire responses',
      tags: 'survey, initial'
    },
    {
      id: 2,
      title: 'Generated Briefing',
      type: 'PDF',
      size: '1.5 MB',
      uploadDate: '2024-01-08',
      description: 'AI-generated client briefing document',
      tags: 'briefing, ai-generated'
>>>>>>> 650f207 (feat: integrate JotForm client information with real-time question mapping)
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
      case 'new_leads':
        return 'Progress to Active Search'
      case 'active_search':
        return 'Progress to Under Contract'
      case 'under_contract':
        return 'Progress to Closed'
      default:
        return null
    }
  }

  const getPreviousStageText = (stage: string) => {
    switch (stage) {
      case 'active_search':
        return 'Return to New Leads'
      case 'under_contract':
        return 'Return to Active Search'
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
      case 'new_leads':
        return 'New Leads'
      case 'active_search':
        return 'Active Search'
      case 'under_contract':
        return 'Under Contract'
      case 'closed':
        return 'Closed'
      default:
        return stage.replace('_', ' ')
    }
  }

  const handleArchive = () => {
    if (onArchive) {
      onArchive(client.id)
    }
  }

  const handleProgress = () => {
    if (onProgress) {
      onProgress(client.id, client.stage)
    }
  }

  const handleUnarchive = () => {
    if (onUnarchive) {
      onUnarchive(client.id)
    }
  }

  const handleGenerateDocuments = () => {
    setShowDocumentGenerator(true)
  }

  const handleSendSurvey = async () => {
    if (isSendingSurvey) return

    setIsSendingSurvey(true)

    try {
      console.log('Sending survey to:', client.name, client.email)

      // Check if Gmail is authenticated
      if (!gmailAuth.isAuthenticated()) {
        console.log('🔑 Gmail not authenticated, starting OAuth flow...')

        const authResult = await gmailAuth.authenticate()

        if (!authResult.success) {
          throw new Error(`Gmail authentication failed: ${authResult.error}`)
        }

        console.log('✅ Gmail authenticated:', authResult.userEmail)
      }

      // Import and use the automation service with Gmail API
      const { startBuyerWorkflowWithGmail } = await import(
        '../../services/automation'
      )

      const result = await startBuyerWorkflowWithGmail({
        agentId: 'agent-1', // TODO: Get actual agent ID
        buyerEmail: client.email,
        buyerName: client.name,
        buyerPhone: client.phone,
        senderEmail: gmailAuth.getUserEmail() || undefined,
      })

      if (result.success) {
        alert(
          `✅ Survey sent successfully to ${client.name} from your Gmail account!\n\nForm URL: ${result.formUrl}`
        )
        console.log('Survey sent successfully:', result)
      } else {
        throw new Error('Failed to send survey')
      }
    } catch (error) {
      console.error('Error sending survey:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      alert(
        `❌ Failed to send survey to ${client.name}.\n\nError: ${errorMessage}`
      )
    } finally {
      setIsSendingSurvey(false)
    }
  }

  const handleRepairEstimator = () => {
    if (navigate) {
      navigate('/repair-estimator')
    }
  }

  const createAgentProfileAdapter = (): any => {
    if (!currentUser) return null

    try {
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

  const handleDocumentGenerated = (result: any) => {
    console.log('Document generated:', result)
    setShowDocumentGenerator(false)
  }

  const handleCancelDocumentGeneration = () => {
    setShowDocumentGenerator(false)
  }

  const handleSaveDetails = () => {
    // In a real application, this would update the client data
    setIsEditingDetails(false)
  }

  const handleCancelEditDetails = () => {
    setEditableDetails({
      name: client.name,
      email: client.email,
      phone: client.phone,
      budget: client.budget,
      location: client.location,
      priority: client.priority,
      notes: client.notes,
    })
    setIsEditingDetails(false)
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument({
      ...document,
      content:
        'This is the document content that would be displayed in a scrollable modal.',
    })
  }

  const handleDownloadDocument = (document: any) => {
    console.log('Downloading document:', document.title)
  }

  const createClientProfile = (): ClientProfile => {
    const firstName = client.name.trim().split(' ')[0] || 'Client'
    const lastName = client.name.trim().split(' ').slice(1).join(' ') || 'Name'

    console.log('🔗 Creating client profile for DocumentGenerator:')
    console.log('  - First name:', firstName)
    console.log('  - Last name:', lastName)
    console.log('  - Expected client ID:', createClientId(firstName, lastName))

    return {
      id: client.id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      clientType: 'buyer',
      personalInfo: {
        firstName,
        lastName,
        city: 'Unknown City',
        state: 'Unknown State',
        zipCode: 'Unknown Zip',
      },
      preferences: {
        timeframe: 'Not specified',
        budget: client.budget,
        location: client.location,
      },
      notes: client.notes,
      createdAt: client.dateAdded,
      updatedAt: client.lastContact || client.dateAdded,
    }
  }

  const getVisibleTabs = () => {
    // Removed Contingencies tab - no longer needed

    const alwaysVisibleTabs = [
      { id: 'form_details', label: 'Form Details', icon: FileText },
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen },
<<<<<<< HEAD
=======
      { id: 'email_history', label: 'Email History', icon: History },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
>>>>>>> 650f207 (feat: integrate JotForm client information with real-time question mapping)
    ]

    return [...alwaysVisibleTabs]
  }

  const getStageActions = () => {
    switch (client.stage) {
      case 'new_leads':
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSendSurvey}
              disabled={isSendingSurvey}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              <Send className="size-4 mr-2" />
              {isSendingSurvey ? 'Sending...' : 'Send Survey'}
            </Button>
            <Button variant="outline">
              <Download className="size-4 mr-2" />
              Download Meeting Materials
            </Button>
          </div>
        )
      case 'active_search':
        return (
          <div className="flex flex-wrap gap-2">
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
            <Button
              onClick={handleRepairEstimator}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              Repair Estimator
            </Button>
            <Button
              onClick={handleGenerateDocuments}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              <FileText className="size-4 mr-2" />
              Generate Documents
            </Button>
          </div>
        )
      case 'closed':
        return (
          <div className="flex flex-wrap gap-2">
            {/* No buttons for closed stage per requirements */}
          </div>
        )
      default:
        return null
    }
  }

  const getStageSpecificContent = () => {
    switch (client.stage) {
      case 'new_leads':
        return (
          <div className="space-y-4">
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Lead Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Source:</strong> {client.leadSource}
                </div>
                <div>
                  <strong>Priority:</strong> {client.priority}
                </div>
                <div>
                  <strong>Date Added:</strong> {formatDate(client.dateAdded)}
                </div>
                <div>
                  <strong>Last Contact:</strong>{' '}
                  {formatDate(client.lastContact)}
                </div>
              </div>
            </div>
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">AI Briefing</h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'to_initiate_contact' &&
                  'Schedule initial consultation call'}
                {client.subStatus === 'awaiting_survey' &&
                  'Send buyer survey form'}
                {client.subStatus === 'review_survey' &&
                  'Review submitted survey and prepare briefing'}
              </p>
            </div>
          </div>
        )
      case 'active_search':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Property Search
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Favorited Properties:</strong>{' '}
                  {client.favoritedProperties?.length || 0}
                </div>
                <div>
                  <strong>Viewed Properties:</strong>{' '}
                  {client.viewedProperties?.length || 0}
                </div>
                <div>
                  <strong>Status:</strong> {client.subStatus.replace('_', ' ')}
                </div>
              </div>
            </div>
            {client.favoritedProperties &&
              client.favoritedProperties.length > 0 && (
                <div className="bg-[#F6E2BC]/50 p-4 rounded-lg border border-[#F6E2BC]">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Favorited Properties
                  </h4>
                  <div className="space-y-1">
                    {client.favoritedProperties.map((property, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        • {property}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )
      case 'under_contract':
        return (
          <div className="space-y-4">
            {/* Transaction Timeline */}
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Contract Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Property:</strong> {client.contractProperty}
                </div>
                <div>
                  <strong>Contract Date:</strong>{' '}
                  {formatDate(client.contractDate)}
                </div>
                <div>
                  <strong>Inspection Date:</strong>{' '}
                  {formatDate(client.inspectionDate)}
                </div>
                <div>
                  <strong>Appraisal Date:</strong>{' '}
                  {formatDate(client.appraisalDate)}
                </div>
                <div>
                  <strong>Closing Date:</strong>{' '}
                  {formatDate(client.closingDate)}
                </div>
              </div>
            </div>

            {/* Option Period Deadline */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <Clock className="size-4 mr-2" />
                Option Period Deadline
              </h4>
              <p className="text-sm text-red-700">
                Option period expires:{' '}
                <strong>{formatDate(client.inspectionDate)}</strong>
              </p>
            </div>

            {/* Inspection Hub */}
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">Inspection Hub</h4>
              <p className="text-sm text-gray-600 mb-3">
                Manage inspection reports and repair estimates
              </p>
              <Button
                onClick={handleUploadInspectionReport}
                className="bg-[#3B7097] hover:bg-[#3B7097]/90"
              >
                <Upload className="size-4 mr-2" />
                Upload Inspection Report
              </Button>
            </div>

            {/* Key Contacts Widget */}
            <div className="bg-[#F6E2BC]/10 p-4 rounded-lg border border-[#F6E2BC]/30">
              <h4 className="font-medium text-gray-800 mb-3">Key Contacts</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
<<<<<<< HEAD
                  <div>
                    <div className="font-medium text-sm">Lender</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <User className="size-3 mr-1" />
                    Add
                  </Button>
=======
                  <span className="text-sm font-medium text-gray-700">Looking for:</span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'propertyType') || extractFormField(formData, 'looking_for') || 'Single Family Home'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Zipcode(s):</span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'location') || extractFormField(formData, 'zipcode') || client.location || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Property Type Desired:</span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'propertyType') || extractFormField(formData, 'property_type') || 'Single Family'}
                  </span>
>>>>>>> 650f207 (feat: integrate JotForm client information with real-time question mapping)
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      Title/Escrow Officer
                    </div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <User className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      Co-operating Agent
                    </div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <User className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Stage Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Current Stage:</strong> {getStageName(client.stage)}
                </div>
                <div>
                  <strong>Status:</strong> {client.subStatus.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  // Duplicate getVisibleTabs function removed - using the one defined earlier

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Client Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {client.notes || 'No notes available'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Client Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Lead Source:</strong> {client.leadSource}
                </div>
                <div>
                  <strong>Priority:</strong> {client.priority}
                </div>
                <div>
                  <strong>Date Added:</strong> {formatDate(client.dateAdded)}
                </div>
                <div>
                  <strong>Last Contact:</strong>{' '}
                  {formatDate(client.lastContact)}
                </div>
              </div>
            </div>
          </div>
        )

      case 'stage_details':
        return getStageSpecificContent()

      case 'ai_lead_scoring':
        return (
          <LeadScoringDisplay
            clientEmail={client.email}
            clientName={client.name}
          />
        )

      case 'offers':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Client Offers</h3>
            </div>
            <div className="space-y-3">
              {/* Sample offer data - in real app this would come from database */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      123 Main Street
                    </h4>
                    <p className="text-sm text-gray-600">
                      Offer Price: $450,000
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: March 15, 2024
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pending
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-center py-4">
                No additional offers found for this client.
              </div>
            </div>
          </div>
        )

<<<<<<< HEAD
      case 'contingencies':
=======
      case 'form_details':
        return (
          <div className="space-y-6">
            {formLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading form data...</span>
              </div>
            ) : formError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="size-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Error loading form data</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{formError}</p>
              </div>
            ) : Object.keys(formData).length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="size-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">No form data available</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  This client hasn't completed the buyer questionnaire yet.
                </p>
              </div>
            ) : (
              <>
                {/* Form Data Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FileText className="size-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Completed Form Responses</h3>
                  </div>
                  {submissionDate && (
                    <p className="text-sm text-gray-500 mb-4">
                      Submitted on {new Date(submissionDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="space-y-6">
                    {/* Contact Information Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData)
                          .filter(([key]) => ['2', '3', '4'].includes(key))
                          .map(([key, value]) => {
                            if (!value || typeof value !== 'object' || !value.answer) return null;
                            const displayLabel = getFieldLabel(key, 'buyer', formQuestions);
                            return (
                              <div key={key} className="flex justify-between items-start py-2">
                                <dt className="text-sm font-medium text-gray-600 w-1/2">{displayLabel}:</dt>
                                <dd className="text-sm text-gray-900 w-1/2 text-right font-medium">{value.answer}</dd>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Financial & Property Preferences */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Property & Financial Preferences
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData)
                          .filter(([key]) => !['2', '3', '4'].includes(key))
                          .map(([key, value]) => {
                            if (!value || typeof value !== 'object' || !value.answer) return null;
                            const displayLabel = getFieldLabel(key, 'buyer', formQuestions);
                            return (
                              <div key={key} className="flex justify-between items-start py-2">
                                <dt className="text-sm font-medium text-gray-600 w-1/2">{displayLabel}:</dt>
                                <dd className="text-sm text-gray-900 w-1/2 text-right font-medium">{value.answer}</dd>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Summary Section */}
                {aiSummary && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="size-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">AI Analysis Summary</h3>
                    </div>
                    <div className="prose max-w-none">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 whitespace-pre-wrap">{aiSummary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 'documents':
>>>>>>> 650f207 (feat: integrate JotForm client information with real-time question mapping)
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">
                Transaction Contingencies
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Track and manage all major contingencies for this transaction.
              </p>
              <h4 className="font-medium text-gray-800 mb-2">
                Closed Transaction
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Property:</strong> {client.contractProperty}
                </div>
                <div>
                  <strong>Sale Price:</strong> {client.soldPrice}
                </div>
                <div>
                  <strong>Closing Date:</strong>{' '}
                  {formatDate(client.closingDate)}
                </div>
                <div>
                  <strong>Status:</strong> {client.subStatus.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Post-Closing Tasks
              </h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'post_closing_checklist' &&
                  'Complete post-closing checklist and schedule follow-up'}
                {client.subStatus === 'nurture_campaign_active' &&
                  'Client in nurture campaign, potential referral source'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="inspection" className="rounded" />
                  <label htmlFor="inspection" className="text-sm font-medium">
                    Inspection Contingency
                  </label>
                </div>
                <span className="text-xs text-gray-500">
                  Due: {formatDate(client.inspectionDate)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="appraisal" className="rounded" />
                  <label htmlFor="appraisal" className="text-sm font-medium">
                    Appraisal Contingency
                  </label>
                </div>
                <span className="text-xs text-gray-500">
                  Due: {formatDate(client.appraisalDate)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="loan" className="rounded" />
                  <label htmlFor="loan" className="text-sm font-medium">
                    Loan Contingency
                  </label>
                </div>
                <span className="text-xs text-gray-500">
                  Due: {formatDate(client.closingDate)}
                </span>
              </div>
            </div>
          </div>
        )

      case 'content':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Document Repository</h3>
              <Button size="sm" variant="outline">
                <Plus className="size-4 mr-2" />
                Upload Document
              </Button>
            </div>
            <div className="space-y-3">
              {/* Sample document data */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="size-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">
                      Pre-approval Letter - ABC Bank.pdf
                    </div>
                    <div className="text-xs text-gray-500">
                      Uploaded 2 days ago
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleViewDocument({
                        id: 1,
                        title: 'Pre-approval Letter - ABC Bank.pdf',
                        type: 'pdf',
                        uploadedDate: '2 days ago',
                        content:
                          'This is a sample pre-approval letter content. In a real application, this would display the actual document content or embed a PDF viewer.',
                      })
                    }
                  >
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownloadDocument({
                        id: 1,
                        title: 'Pre-approval Letter - ABC Bank.pdf',
                      })
                    }
                  >
                    <Download className="size-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRenameDocument({
                        id: 1,
                        title: 'Pre-approval Letter - ABC Bank.pdf',
                      })
                    }
                  >
                    <Edit className="size-3 mr-1" />
                    Rename
                  </Button>
                </div>
              </div>

              {/* Additional sample document */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="size-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">
                      Property Wish List - Notes.docx
                    </div>
                    <div className="text-xs text-gray-500">
                      Uploaded 1 week ago
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleViewDocument({
                        id: 2,
                        title: 'Property Wish List - Notes.docx',
                        type: 'docx',
                        uploadedDate: '1 week ago',
                        content:
                          "Client's property wish list and preferences:\n\n• 3-4 bedrooms\n• 2+ bathrooms\n• Updated kitchen\n• Large backyard\n• Good school district\n• Near public transportation\n• Parking space\n• Modern appliances included",
                      })
                    }
                  >
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownloadDocument({
                        id: 2,
                        title: 'Property Wish List - Notes.docx',
                      })
                    }
                  >
                    <Download className="size-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRenameDocument({
                        id: 2,
                        title: 'Property Wish List - Notes.docx',
                      })
                    }
                  >
                    <Edit className="size-3 mr-1" />
                    Rename
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-500 text-center py-4">
                No additional documents found.
              </div>
            </div>
          </div>
        )

      case 'email_history':
        return (
          <EmailHistory clientEmail={client.email} clientName={client.name} />
        )

      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
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
                <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                  <Upload className="size-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {doc.title}
                      </h4>
                      <span className="text-xs text-gray-500">{doc.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {doc.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{doc.metadata?.wordCount || 0} words</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewDocument(doc)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="size-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDownloadDocument(doc)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No documents found for this client
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Generate documents or upload files to get started
                </p>
              </div>
            )}
          </div>
        )

      case 'email_history':
        return (
          <EmailHistory 
            clientEmail={client.email} 
            clientName={client.name}
            className="bg-white"
          />
        )

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
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
                <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                  <Upload className="size-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {doc.title}
                      </h4>
                      <span className="text-xs text-gray-500">{doc.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {doc.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{doc.metadata?.wordCount || 0} words</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewDocument(doc)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="size-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDownloadDocument(doc)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No documents found for this client
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Generate documents or upload files to get started
                </p>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Document Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDocument.title}
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="flex items-center">
                <Mail className="size-4 text-gray-400 mr-2" />
                <span className="text-sm">{client.email}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="size-4 text-gray-400 mr-2" />
                <span className="text-sm">{client.budget}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="size-4 text-gray-400 mr-2" />
                <span className="text-sm">{client.location}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {getVisibleTabs().map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 text-sm font-medium border-b-2 ${
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
          <div className="p-6">{renderTabContent()}</div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start">
              {/* Stage-specific actions */}
              <div className="flex-1">{getStageActions()}</div>

              {/* Archive/Progress buttons or Unarchive button */}
              <div className="flex gap-2 ml-4">
                {isArchiveMode ? (
                  // Archive mode: Show only Unarchive button
                  <Button
                    onClick={handleUnarchive}
                    className="bg-[#A9D09E] hover:bg-[#A9D09E]/90 text-white"
                  >
                    <RotateCcw className="size-4 mr-2" />
                    Unarchive
                  </Button>
                ) : (
                  // Normal mode: Show Archive and Progress buttons
                  <>
                    {shouldShowProgressButton(client.stage) && (
                      <Button
                        onClick={handleProgress}
                        className="bg-[#3B7097] hover:bg-[#3B7097]/90 text-white"
                      >
                        <ArrowRight className="size-4 mr-2" />
                        {getProgressButtonText(client.stage)}
                      </Button>
                    )}

                    <Button
                      onClick={handleArchive}
                      variant="outline"
                      className="border-[#c05e51] text-[#c05e51] hover:bg-[#c05e51]/10"
                    >
                      <Archive className="size-4 mr-2" />
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Generator Modal */}
      {showDocumentGenerator && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
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

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Client Details</h3>
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
                <div className="grid grid-cols-2 gap-4">
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
                    Budget
                  </label>
                  <input
                    type="text"
                    value={editableDetails.budget}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        budget: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editableDetails.location}
                    onChange={e =>
                      setEditableDetails({
                        ...editableDetails,
                        location: e.target.value,
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

      {/* Main Modal - Updated to match seller modal size and structure */}
      <div className="bg-white rounded-lg w-[85vw] h-[85vh] flex flex-col">
        {/* Header - Updated to match seller modal header structure */}
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
                <span>{client.location}</span>
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

        {/* Tabs - Updated to match seller modal tabs */}
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
    </div>
  )
}
