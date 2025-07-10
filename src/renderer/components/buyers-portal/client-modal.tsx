import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '../ui/button'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import type { AgentProfile } from '../../../shared/types'

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
  client: {
    id: number
    name: string
    email: string
    phone: string
    stage: string
    subStatus: string
    budget: string
    location: string
    leadSource: string
    priority: string
    dateAdded: string
    lastContact: string | null
    notes: string
    favoritedProperties?: string[]
    viewedProperties?: string[]
    contractProperty?: string
    contractDate?: string
    inspectionDate?: string
    appraisalDate?: string
    closingDate?: string
    soldPrice?: string
    archivedDate?: string
    archivedFromStage?: string
  }
  onClose: () => void
  onArchive?: (client: any) => void
  onProgress?: (client: any) => void
  onUnarchive?: (client: any) => void
  isArchiveMode?: boolean
  currentUser?: AgentProfile | null
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
  const [activeTab, setActiveTab] = useState('summary')
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)

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

  const handleGenerateOfferCoverLetter = () => {
    if (!currentUser) {
      alert('Please make sure you are logged in to generate documents.')
      return
    }

    // Debug logging
    console.log('Client data:', client)
    console.log('Current user data:', currentUser)

    // Validate that currentUser has required structure
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

  const handleDocumentGenerated = (result: any) => {
    console.log('Document generated:', result)
    // Don't immediately close the modal - let the user review the generated documents
    // The user can manually close the modal when they're done

    // Optional: Show a success notification or update UI to indicate completion
    // For now, just log the result and keep the modal open
  }

  const handleCancelDocumentGeneration = () => {
    setShowDocumentGenerator(false)
  }

  // Handler for Download Meeting Materials
  const handleDownloadMeetingMaterials = () => {
    if (!currentUser) {
      alert('Please make sure you are logged in to access meeting materials.')
      return
    }

    if (!currentUser.displayName) {
      alert(
        'Agent profile is incomplete. Please update your profile before generating documents.'
      )
      return
    }

    // Open document generator with client education package
    setShowDocumentGenerator(true)
  }

  // Handler for Add Client Details
  const handleAddClientDetails = () => {
    alert(
      `Opening client details editor for ${client.name}. This would navigate to a detailed client information form.`
    )
    // TODO: Navigate to client details editor or open modal
  }

  // Handler for Compare Properties
  const handleCompareProperties = () => {
    alert(
      `Opening property comparison tool for ${client.name}. This would show favorited properties side-by-side with market analysis.`
    )
    // TODO: Navigate to property comparison interface
  }

  // Handler for Upload Inspection Report
  const handleUploadInspectionReport = () => {
    alert(
      `Redirecting to repair estimator to upload inspection report for ${client.name}.`
    )
    // TODO: Navigate to repair estimator with client context
    // window.location.pathname = '/repair-estimator'
  }

  // Handler for Generate Cost Analysis
  const handleGenerateCostAnalysis = () => {
    if (!currentUser) {
      alert('Please make sure you are logged in to generate cost analysis.')
      return
    }

    if (!currentUser.displayName) {
      alert(
        'Agent profile is incomplete. Please update your profile before generating documents.'
      )
      return
    }

    // Open document generator for cost analysis
    setShowDocumentGenerator(true)
  }

  // Handler for Draft Repair Request
  const handleDraftRepairRequest = () => {
    if (!currentUser) {
      alert('Please make sure you are logged in to draft repair requests.')
      return
    }

    if (!currentUser.displayName) {
      alert(
        'Agent profile is incomplete. Please update your profile before generating documents.'
      )
      return
    }

    // Open document generator for repair request documents
    setShowDocumentGenerator(true)
  }

  // Handler for Suggest Thank You Gift
  const handleSuggestThankYouGift = () => {
    alert(
      `AI will analyze ${client.name}'s preferences and transaction details to suggest personalized thank you gifts. This feature integrates with gift recommendation services.`
    )
    // TODO: Implement AI-powered gift suggestion workflow
  }

  // Handler for Start Post-Closing Follow-up
  const handleStartPostClosingFollowup = () => {
    alert(
      `Starting automated post-closing follow-up sequence for ${client.name}. This includes satisfaction surveys, referral requests, and nurture campaigns.`
    )
    // TODO: Trigger post-closing automation workflow
  }

  // Handler for Request Referral
  const handleRequestReferral = () => {
    alert(
      `Opening referral request interface for ${client.name}. This would generate personalized referral request messages and track referral outcomes.`
    )
    // TODO: Open referral request modal or workflow
  }

  // Convert client data to ClientProfile format for DocumentGenerator
  const createClientProfile = (): ClientProfile => {
    try {
      // Safely parse client name
      const nameParts = (client.name || '').trim().split(' ')
      const firstName = nameParts[0] || 'Client'
      const lastName = nameParts.slice(1).join(' ') || 'Name'

      // Safely parse location
      const locationParts = (client.location || '').split(',')
      const city = locationParts[0]?.trim() || 'Unknown City'
      const state = locationParts[1]?.trim() || 'Unknown State'

      return {
        id: client.id.toString(),
        name: client.name || 'Unknown Client',
        email: client.email || 'unknown@email.com',
        phone: client.phone || 'Unknown Phone',
        clientType: 'buyer',
        personalInfo: {
          firstName,
          lastName,
          city,
          state,
          zipCode: '', // Not available in current client data
        },
        preferences: {
          timeframe: client.stage || 'unknown',
          budget: client.budget || 'Not specified',
          location: client.location || 'Not specified',
        },
        notes: client.notes || '',
        createdAt: client.dateAdded || new Date().toISOString(),
        updatedAt:
          client.lastContact || client.dateAdded || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error creating client profile:', error)
      // Return a safe fallback profile
      return {
        id: client.id.toString(),
        name: client.name || 'Unknown Client',
        email: client.email || 'unknown@email.com',
        phone: client.phone || 'Unknown Phone',
        clientType: 'buyer',
        personalInfo: {
          firstName: 'Client',
          lastName: 'Name',
          city: 'Unknown City',
          state: 'Unknown State',
          zipCode: '',
        },
        preferences: {
          timeframe: 'unknown',
          budget: 'Not specified',
          location: 'Not specified',
        },
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  const getStageActions = () => {
    switch (client.stage) {
      case 'new_leads':
        return (
          <div className="flex gap-2">
            <Button
              className="bg-[#A9D09E] hover:bg-[#A9D09E]/90"
              onClick={handleDownloadMeetingMaterials}
            >
              <FileText className="size-4 mr-2" />
              Download Meeting Materials
            </Button>
            <Button variant="outline" onClick={handleAddClientDetails}>
              <Plus className="size-4 mr-2" />
              Add Client Details
            </Button>
          </div>
        )
      case 'active_search':
        return (
          <div className="flex gap-2">
            <Button
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
              onClick={handleGenerateOfferCoverLetter}
            >
              <FileText className="size-4 mr-2" />
              Generate Offer Cover Letter
            </Button>
            <Button variant="outline" onClick={handleCompareProperties}>
              <Home className="size-4 mr-2" />
              Compare Properties
            </Button>
            <Button variant="outline" onClick={handleAddClientDetails}>
              <Plus className="size-4 mr-2" />
              Add Client Details
            </Button>
          </div>
        )
      case 'under_contract':
        return (
          <div className="flex gap-2">
            <Button
              className="bg-[#3B7097] hover:bg-[#3B7097]/90"
              onClick={handleUploadInspectionReport}
            >
              <FileText className="size-4 mr-2" />
              Upload Inspection Report
            </Button>
            <Button variant="outline" onClick={handleGenerateCostAnalysis}>
              <Download className="size-4 mr-2" />
              Generate Cost Analysis
            </Button>
            <Button variant="outline" onClick={handleDraftRepairRequest}>
              <FileText className="size-4 mr-2" />
              Draft Repair Request
            </Button>
          </div>
        )
      case 'closed':
        return (
          <div className="flex gap-2">
            <Button
              className="bg-[#A9D09E] hover:bg-[#A9D09E]/90"
              onClick={handleSuggestThankYouGift}
            >
              <FileText className="size-4 mr-2" />
              Suggest Thank You Gift
            </Button>
            <Button variant="outline" onClick={handleStartPostClosingFollowup}>
              <Mail className="size-4 mr-2" />
              Start Post-Closing Follow-up
            </Button>
            <Button variant="outline" onClick={handleRequestReferral}>
              <Phone className="size-4 mr-2" />
              Request Referral
            </Button>
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
              <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>
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
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">
                Critical Deadlines
              </h4>
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="size-4 mr-2" />
                <span>
                  Current Status: {client.subStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )
      case 'closed':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
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
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-[#3B7097] text-[#3B7097]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Client Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === 'details'
                    ? 'border-[#3B7097] text-[#3B7097]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stage Details
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Client Notes
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {client.notes || 'No notes available'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Client Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Lead Source:</strong> {client.leadSource}
                    </div>
                    <div>
                      <strong>Priority:</strong> {client.priority}
                    </div>
                    <div>
                      <strong>Date Added:</strong>{' '}
                      {formatDate(client.dateAdded)}
                    </div>
                    <div>
                      <strong>Last Contact:</strong>{' '}
                      {formatDate(client.lastContact)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && getStageSpecificContent()}
          </div>

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
    </div>
  )
}
