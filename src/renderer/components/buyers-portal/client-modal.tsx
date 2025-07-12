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
  const [activeTab, setActiveTab] = useState(client.initialTab || 'ai_lead_scoring')
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
    

  
    
    // Removed Contingencies tab - no longer needed

    const alwaysVisibleTabs = [
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen },
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

  const renderTabContent = () => {
    switch (activeTab) {

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
                <DollarSign className="size-4" />
                <span>Budget: {client.budget}</span>
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
