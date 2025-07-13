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
import {
  getClientDocuments,
  deleteDocument,
} from '../../../lib/firebase/collections/documents'
import {
  useFormData,
  extractFormField,
  getFieldLabel,
} from '../../hooks/useFormData'

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
  const [isEditingContingencies, setIsEditingContingencies] = useState(false)
  const [contingencyDates, setContingencyDates] = useState({
    inspection: '2024-01-15',
    appraisal: '2024-01-25',
    finance: '2024-02-01',
  })
  const [contingencyDetails, setContingencyDetails] = useState('')
  const [contractDetails, setContractDetails] = useState({
    contractPrice: '',
    sellerAgent: '',
    closingDate: '',
    contractDate: '',
  })
  const [editableDetails, setEditableDetails] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone,
    budget: client.budget,
    location: client.location,
    priority: client.priority,
    notes: client.notes,
  })

  // Documents state for buyer
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [deletingAllDocuments, setDeletingAllDocuments] = useState(false)

  // Fetch form data and GPT analysis
  const {
    formData,
    aiSummary,
    submissionDate,
    loading: formLoading,
    error: formError,
    formQuestions,
  } = useFormData(client.email, 'buyer')

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
    }
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

  const handleSaveContingencies = () => {
    console.log('Saving contingency dates:', contingencyDates)
    console.log('Additional details:', contingencyDetails)
    console.log('Contract details:', contractDetails)

    // Task 6.5: Auto-create calendar events from contingency dates
    try {
      // Create calendar events for each contingency deadline
      const events = [
        {
          title: 'Inspection Period Deadline',
          date: contingencyDates.inspection,
          time: '17:00', // 5:00 PM
          description: `Inspection period deadline for buyer ${client.name}`,
          clientType: 'buyer',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'inspection_deadline',
        },
        {
          title: 'Appraisal Deadline',
          date: contingencyDates.appraisal,
          time: '17:00',
          description: `Appraisal deadline for buyer ${client.name}`,
          clientType: 'buyer',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'appraisal_deadline',
        },
        {
          title: 'Financing Deadline',
          date: contingencyDates.finance,
          time: '17:00',
          description: `Financing deadline for buyer ${client.name}`,
          clientType: 'buyer',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'financing_deadline',
        },
      ]

      console.log(
        'Auto-created calendar events for contingency deadlines:',
        events
      )
      // In a real application, these would be saved to the calendar system
    } catch (error) {
      console.error('Error creating calendar events:', error)
    }

    setIsEditingContingencies(false)
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

  const handleSeeFullSummary = () => {
    console.log('See full summary clicked')
  }

  const handleDownloadFullSummary = () => {
    console.log('Download full summary clicked')
  }

  const handleEmailThreadClick = (thread: any) => {
    console.log('Email thread clicked:', thread)
  }

  const createClientProfile = (): ClientProfile => {
    const nameParts = client.name.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Name'

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
    const baseTabs = [
      { id: 'ai_lead_scoring', label: 'AI Lead Scoring', icon: TrendingUp },
      { id: 'summary', label: 'Summary', icon: null },
    ]

    const stageSpecificTabs = []

    // Add Contingencies tab only for Under Contract stage
    if (client.stage === 'under_contract') {
      stageSpecificTabs.push({
        id: 'contingencies',
        label: 'Contingencies',
        icon: Clock,
      })
    }

    const alwaysVisibleTabs = [
      { id: 'form_details', label: 'Form Details', icon: FileText },
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen },
      { id: 'email_history', label: 'Email History', icon: History },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    ]

    return [...baseTabs, ...stageSpecificTabs, ...alwaysVisibleTabs]
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
            <Button
              onClick={() => setIsEditingContingencies(true)}
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
            >
              <Edit className="size-4 mr-2" />
              Edit Contingencies
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
              <h4 className="font-medium text-gray-800 mb-2">Survey Status</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Survey Status:</strong> Pending
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
          </div>
        )
      case 'active_search':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Search Progress
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Properties Viewed:</strong> 5
                </div>
                <div>
                  <strong>Favorites:</strong> 2
                </div>
                <div>
                  <strong>Offers Made:</strong> 1
                </div>
              </div>
            </div>
          </div>
        )
      case 'under_contract':
        return (
          <div className="space-y-4">
            <div className="bg-[#F6E2BC]/30 p-4 rounded-lg border border-[#F6E2BC]/50">
              <h4 className="font-medium text-gray-800 mb-2">
                Contract Status
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Contract Price:</strong> $435,000
                </div>
                <div>
                  <strong>Closing Date:</strong> {formatDate('2024-02-15')}
                </div>
                <div>
                  <strong>Contract Date:</strong> {formatDate('2024-01-05')}
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
                  <strong>Final Purchase Price:</strong> $432,000
                </div>
                <div>
                  <strong>Closing Date:</strong> {formatDate('2024-02-12')}
                </div>
                <div>
                  <strong>Days to Close:</strong> 38 days
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
      case 'summary':
        if (client.stage === 'closed') {
          // Phase 7: Closed stage specific design matching seller implementation
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purchase Summary Widget */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Home className="size-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    Purchase Summary
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Final Purchase Price:
                    </span>
                    <span className="text-sm text-gray-900">$432,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Closing Date:
                    </span>
                    <span className="text-sm text-gray-900">
                      February 12, 2024
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Days to Close:
                    </span>
                    <span className="text-sm text-gray-900">45 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Property Address:
                    </span>
                    <span className="text-sm text-gray-900">
                      123 Elm Street
                    </span>
                  </div>
                </div>
              </div>

              {/* Buyer Motivation Widget - updated for closed */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="size-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    Buyer Motivation
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Original Timeline:
                    </span>
                    <span className="text-sm text-gray-900">
                      Next 3-6 months
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Reason for Buying:
                    </span>
                    <span className="text-sm text-gray-900">
                      First-time buyer
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Original Budget:
                    </span>
                    <span className="text-sm text-gray-900">
                      {client.budget}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Priority Level:
                    </span>
                    <span className="text-sm text-gray-900">
                      {client.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Notes Widget */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <MessageCircle className="size-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Final Notes</h3>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    {client.notes ||
                      'Successful home purchase completed. Client expressed satisfaction with the process and property selection.'}
                  </div>
                </div>
              </div>

              {/* Post-Closing Status Widget */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="size-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    Post-Closing Status
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Keys Received
                    </span>
                    <CheckCircle className="size-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Final Walkthrough
                    </span>
                    <CheckCircle className="size-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Utilities Connected
                    </span>
                    <CheckCircle className="size-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Move-in Ready
                    </span>
                    <CheckCircle className="size-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // Regular summary for other stages
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget A: Client Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Home className="size-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Client Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Looking for:
                  </span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'propertyType') ||
                      extractFormField(formData, 'looking_for') ||
                      'Single Family Home'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Zipcode(s):
                  </span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'location') ||
                      extractFormField(formData, 'zipcode') ||
                      client.location ||
                      'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Property Type Desired:
                  </span>
                  <span className="text-sm text-gray-900">
                    {extractFormField(formData, 'propertyType') ||
                      extractFormField(formData, 'property_type') ||
                      'Single Family'}
                  </span>
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

      case 'ai_lead_scoring':
        return (
          <LeadScoringDisplay
            clientEmail={client.email}
            clientName={client.name}
          />
        )

      case 'contingencies':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Buyer Contingencies
              </h3>
              {isEditingContingencies && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveContingencies}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="size-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => setIsEditingContingencies(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Contract Details Section */}
            <div className="mb-6 p-4 bg-[#3B7097]/5 rounded-lg border border-[#3B7097]/20">
              <h4 className="font-semibold text-gray-800 mb-4">
                Contract Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contract-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contract Price
                  </label>
                  {isEditingContingencies ? (
                    <input
                      id="contract-price"
                      type="text"
                      value={contractDetails.contractPrice}
                      onChange={e =>
                        setContractDetails({
                          ...contractDetails,
                          contractPrice: e.target.value,
                        })
                      }
                      placeholder="e.g., $435,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  ) : (
                    <div className="text-sm text-gray-800 font-medium">
                      {contractDetails.contractPrice || (
                        <span className="text-gray-500 italic">
                          Not entered
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="seller-agent"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Seller Agent
                  </label>
                  {isEditingContingencies ? (
                    <input
                      id="seller-agent"
                      type="text"
                      value={contractDetails.sellerAgent}
                      onChange={e =>
                        setContractDetails({
                          ...contractDetails,
                          sellerAgent: e.target.value,
                        })
                      }
                      placeholder="e.g., Jane Smith, ABC Realty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  ) : (
                    <div className="text-sm text-gray-800 font-medium">
                      {contractDetails.sellerAgent || (
                        <span className="text-gray-500 italic">
                          Not entered
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="closing-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Closing Date
                  </label>
                  {isEditingContingencies ? (
                    <input
                      id="closing-date"
                      type="date"
                      value={contractDetails.closingDate}
                      onChange={e =>
                        setContractDetails({
                          ...contractDetails,
                          closingDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  ) : (
                    <div className="text-sm text-gray-800 font-medium">
                      {contractDetails.closingDate ? (
                        formatDate(contractDetails.closingDate)
                      ) : (
                        <span className="text-gray-500 italic">Not set</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contract-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contract Date
                  </label>
                  {isEditingContingencies ? (
                    <input
                      id="contract-date"
                      type="date"
                      value={contractDetails.contractDate}
                      onChange={e =>
                        setContractDetails({
                          ...contractDetails,
                          contractDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  ) : (
                    <div className="text-sm text-gray-800 font-medium">
                      {contractDetails.contractDate ? (
                        formatDate(contractDetails.contractDate)
                      ) : (
                        <span className="text-gray-500 italic">Not set</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contingencies Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="size-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-gray-800">
                      Inspection Contingency
                    </div>
                    {isEditingContingencies ? (
                      <input
                        type="date"
                        value={contingencyDates.inspection}
                        onChange={e =>
                          setContingencyDates({
                            ...contingencyDates,
                            inspection: e.target.value,
                          })
                        }
                        className="text-sm border rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        Due: {formatDate(contingencyDates.inspection)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-yellow-600">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="size-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-800">
                      Appraisal Contingency
                    </div>
                    {isEditingContingencies ? (
                      <input
                        type="date"
                        value={contingencyDates.appraisal}
                        onChange={e =>
                          setContingencyDates({
                            ...contingencyDates,
                            appraisal: e.target.value,
                          })
                        }
                        className="text-sm border rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        Due: {formatDate(contingencyDates.appraisal)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="size-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-800">
                      Finance Contingency
                    </div>
                    {isEditingContingencies ? (
                      <input
                        type="date"
                        value={contingencyDates.finance}
                        onChange={e =>
                          setContingencyDates({
                            ...contingencyDates,
                            finance: e.target.value,
                          })
                        }
                        className="text-sm border rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        Due: {formatDate(contingencyDates.finance)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Complete
                </span>
              </div>

              {/* Additional details field */}
              {isEditingContingencies && (
                <div className="mt-4">
                  <label
                    htmlFor="additional-details"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Additional Details
                  </label>
                  <textarea
                    id="additional-details"
                    value={contingencyDetails}
                    onChange={e => setContingencyDetails(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter any additional contingency details or notes..."
                  />
                </div>
              )}

              {contingencyDetails && !isEditingContingencies && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    Additional Details:
                  </div>
                  <div className="text-sm text-gray-600">
                    {contingencyDetails}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

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
                  <span className="text-red-800 font-medium">
                    Error loading form data
                  </span>
                </div>
                <p className="text-red-700 text-sm mt-1">{formError}</p>
              </div>
            ) : Object.keys(formData).length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="size-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    No form data available
                  </span>
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
                    <h3 className="font-semibold text-gray-800">
                      Completed Form Responses
                    </h3>
                  </div>
                  {submissionDate && (
                    <p className="text-sm text-gray-500 mb-4">
                      Submitted on{' '}
                      {new Date(submissionDate).toLocaleDateString()}
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
                            if (
                              !value ||
                              typeof value !== 'object' ||
                              !value.answer
                            )
                              return null
                            const displayLabel = getFieldLabel(
                              key,
                              'buyer',
                              formQuestions
                            )
                            return (
                              <div
                                key={key}
                                className="flex justify-between items-start py-2"
                              >
                                <dt className="text-sm font-medium text-gray-600 w-1/2">
                                  {displayLabel}:
                                </dt>
                                <dd className="text-sm text-gray-900 w-1/2 text-right font-medium">
                                  {value.answer}
                                </dd>
                              </div>
                            )
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
                            if (
                              !value ||
                              typeof value !== 'object' ||
                              !value.answer
                            )
                              return null
                            const displayLabel = getFieldLabel(
                              key,
                              'buyer',
                              formQuestions
                            )
                            return (
                              <div
                                key={key}
                                className="flex justify-between items-start py-2"
                              >
                                <dt className="text-sm font-medium text-gray-600 w-1/2">
                                  {displayLabel}:
                                </dt>
                                <dd className="text-sm text-gray-900 w-1/2 text-right font-medium">
                                  {value.answer}
                                </dd>
                              </div>
                            )
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
                      <h3 className="font-semibold text-gray-800">
                        AI Analysis Summary
                      </h3>
                    </div>
                    <div className="prose max-w-none">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {aiSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 'documents':
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
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

      case 'calendar':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">
                Client Timeline
              </h3>
            </div>

            {/* Coming Events */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Coming Events</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="size-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Property Showing</div>
                    <div className="text-xs text-gray-600">
                      Tomorrow, 2:00 PM - 456 Oak Avenue
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-center py-2">
                  No additional upcoming events.
                </div>
              </div>
            </div>

            {/* Past Events */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Past Events</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="size-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">
                      Initial Consultation
                    </div>
                    <div className="text-xs text-gray-600">
                      March 10, 2024, 10:00 AM
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-center py-2">
                  No additional past events.
                </div>
              </div>
            </div>
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
        return <div>Content not found</div>
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
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                {selectedDocument.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentGenerator && currentUser ? (
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
      ) : (
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {client.name}
              </h2>
              <p className="text-sm text-gray-500">
                {client.stage.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Client Vitals */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <Phone className="size-4 text-gray-400 mr-2" />
                <span className="text-sm">{client.phone}</span>
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
                <>
                  <Button
                    onClick={handleArchive}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Archive className="size-4 mr-2" />
                    Archive
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
