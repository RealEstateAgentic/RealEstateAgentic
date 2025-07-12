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
} from 'lucide-react'
import { Button } from '../ui/button'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import { LeadScoringDisplay } from '../shared/lead-scoring-display'
import type { AgentProfile } from '../../../shared/types'
import { dummyData } from '../../data/dummy-data'
import { gmailAuth } from '../../services/gmail-auth'

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
  const [activeTab, setActiveTab] = useState(client.initialTab || 'summary')
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

  // Sample documents for buyer
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Buyer Survey Results',
      type: 'PDF',
      size: '2.1 MB',
      uploadDate: '2024-01-10',
      description: 'Initial buyer questionnaire responses',
      tags: 'survey, initial',
    },
    {
      id: 2,
      title: 'Generated Briefing',
      type: 'PDF',
      size: '1.5 MB',
      uploadDate: '2024-01-08',
      description: 'AI-generated client briefing document',
      tags: 'briefing, ai-generated',
    },
  ])

  useEffect(() => {
    if (client.initialDocumentId && activeTab === 'documents') {
      const doc = documents.find(
        d => d.id === parseInt(client.initialDocumentId || '0')
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
    const baseTabs = [{ id: 'summary', label: 'Summary', icon: null }]

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
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen },
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

  // Get next event for this client
  const getNextEvent = () => {
    const clientEvents = dummyData.calendarEvents.filter(
      event =>
        event.clientType === 'buyer' && event.clientId === client.id.toString()
    )
    const today = new Date()
    const upcomingEvents = clientEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return upcomingEvents.length > 0 ? upcomingEvents[0] : null
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
                    Single Family Home
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Zipcode(s):
                  </span>
                  <span className="text-sm text-gray-900">
                    {client.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Property Type Desired:
                  </span>
                  <span className="text-sm text-gray-900">Single Family</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Bed/Bath:
                  </span>
                  <span className="text-sm text-gray-900">3bd/2ba</span>
                </div>
              </div>
            </div>

            {/* Widget B: Buyer Motivation */}
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
                    Timeline:
                  </span>
                  <span className="text-sm text-gray-900">Next 3-6 months</span>
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
                    Expected Price Range:
                  </span>
                  <span className="text-sm text-gray-900">{client.budget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Priority:
                  </span>
                  <span className="text-sm text-gray-900">
                    {client.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Widget C: Recent Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MessageCircle className="size-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Recent Notes</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  {client.notes || 'No notes available'}
                </div>
              </div>
            </div>

            {/* Widget D: Next Event */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Calendar className="size-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Next Event</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const nextEvent = getNextEvent()
                  if (nextEvent) {
                    return (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {nextEvent.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(nextEvent.date)} at {nextEvent.time}
                        </div>
                        <div className="text-sm text-gray-500">
                          {nextEvent.location}
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="text-sm text-gray-500">
                        No upcoming events scheduled
                      </div>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Price
                  </label>
                  {isEditingContingencies ? (
                    <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Agent
                  </label>
                  {isEditingContingencies ? (
                    <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Date
                  </label>
                  {isEditingContingencies ? (
                    <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Date
                  </label>
                  {isEditingContingencies ? (
                    <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
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

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Documents and Content
              </h3>
              <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                <Upload className="size-4 mr-2" />
                Upload Document
              </Button>
            </div>

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
                    {doc.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{doc.size}</span>
                    <span>{formatDate(doc.uploadDate)}</span>
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
          </div>
        )

      case 'calendar':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Calendar Events
            </h3>
            <div className="space-y-4">
              {(() => {
                const clientEvents = dummyData.calendarEvents.filter(
                  event =>
                    event.clientType === 'buyer' &&
                    event.clientId === client.id.toString()
                )

                if (clientEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="size-12 mx-auto mb-4 text-gray-400" />
                      <p>No events scheduled for this client</p>
                    </div>
                  )
                }

                return clientEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {event.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.date)} at {event.time}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {event.priority}
                      </span>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedDocument.content}
                </p>
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
              <>
                <Button
                  onClick={handleArchive}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Archive className="size-4 mr-2" />
                  Archive
                </Button>

                {/* Progress Button */}
                {shouldShowProgressButton(client.stage) && (
                  <Button
                    onClick={handleProgress}
                    className="bg-[#A9D09E] hover:bg-[#A9D09E]/90"
                  >
                    <ArrowRight className="size-4 mr-2" />
                    {getProgressButtonText(client.stage)}
                  </Button>
                )}

                {/* Return to Previous Stage Button */}
                {getPreviousStageText(client.stage) && (
                  <Button
                    onClick={() => {}} // Implement previous stage logic
                    variant="outline"
                  >
                    <RotateCcw className="size-4 mr-2" />
                    {getPreviousStageText(client.stage)}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
