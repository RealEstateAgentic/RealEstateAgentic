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
    initialTab?: string
    initialDocumentId?: string
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
  const [activeTab, setActiveTab] = useState(client.initialTab || 'summary')
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  // Handle initial document opening
  useEffect(() => {
    if (client.initialDocumentId && activeTab === 'content') {
      // Find and open the document
      const mockDocument = {
        id: client.initialDocumentId,
        title: `Document ${client.initialDocumentId}`,
        type: "pdf",
        uploadedDate: "Recently",
        content: "This document was opened from search results."
      }
      setSelectedDocument(mockDocument)
    }
  }, [client.initialDocumentId, activeTab])

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

  // Handler for See Full Summary
  const handleSeeFullSummary = () => {
    alert(
      `Opening full client summary for ${client.name}. This would show a comprehensive AI-generated summary of all client interactions and data.`
    )
    // TODO: Navigate to full summary view
  }

  // Handler for Download Full Summary
  const handleDownloadFullSummary = () => {
    alert(
      `Downloading full client summary for ${client.name}. This would generate and download a PDF report of all client data.`
    )
    // TODO: Generate and download summary PDF
  }

  // Handler for View Document
  const handleViewDocument = (document: any) => {
    alert(
      `Opening document viewer for "${document.title}". This would display the document content in a modal or new window.`
    )
    // TODO: Open document viewer modal
  }

  // Handler for Download Document
  const handleDownloadDocument = (document: any) => {
    alert(
      `Downloading "${document.title}". This would trigger the file download.`
    )
    // TODO: Trigger file download
  }

  // Handler for Rename Document
  const handleRenameDocument = (document: any) => {
    const newName = prompt(`Enter new name for "${document.title}":`, document.title)
    if (newName && newName.trim()) {
      alert(
        `Renaming "${document.title}" to "${newName}". This would update the document name in the database.`
      )
      // TODO: Update document name in database
    }
  }

  // Handler for Email Thread Click
  const handleEmailThreadClick = (thread: any) => {
    alert(
      `Opening email thread "${thread.subject}" with ${thread.messageCount} messages. This would display the full email conversation in a modal.`
    )
    // TODO: Open email thread modal
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
                Option period expires: <strong>{formatDate(client.inspectionDate)}</strong>
              </p>
            </div>

            {/* Inspection Hub */}
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">Inspection Hub</h4>
              <p className="text-sm text-gray-600 mb-3">Manage inspection reports and repair estimates</p>
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
                  <div>
                    <div className="font-medium text-sm">Lender</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <User className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Title/Escrow Officer</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <User className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Co-operating Agent</div>
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
              <h4 className="font-medium text-gray-800 mb-2">Stage Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Current Stage:</strong> {getStageName(client.stage)}</div>
                <div><strong>Status:</strong> {client.subStatus.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        )
    }
  }

  // Define which tabs should be visible based on client stage
  const getVisibleTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: null },
      { id: 'stage_details', label: 'Stage Details', icon: null },
      { id: 'summary', label: 'Summary', icon: null },
    ]

    const stageSpecificTabs = []
    
    // Add Offers tab only for Active Search stage
    if (client.stage === 'active_search') {
      stageSpecificTabs.push({ id: 'offers', label: 'Offers', icon: DollarSign })
    }
    
    // Add Contingencies tab only for Under Contract stage
    if (client.stage === 'under_contract') {
      stageSpecificTabs.push({ id: 'contingencies', label: 'Contingencies', icon: Clock })
    }

    const alwaysVisibleTabs = [
      { id: 'content', label: 'Content', icon: FolderOpen },
      { id: 'email_history', label: 'Email History', icon: History },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    ]

    return [...baseTabs, ...stageSpecificTabs, ...alwaysVisibleTabs]
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Client Profile Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li>• {client.budget} budget for home purchase in {client.location}</li>
                  <li>• {client.priority} priority lead from {client.leadSource}</li>
                  <li>• Currently in {getStageName(client.stage)} stage</li>
                  <li>• Last contacted: {formatDate(client.lastContact)}</li>
                  {client.favoritedProperties && client.favoritedProperties.length > 0 && (
                    <li>• Has favorited {client.favoritedProperties.length} properties</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )
      
      case 'stage_details':
        return getStageSpecificContent()
      
      case 'summary':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">AI-Generated Client Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-3">
                  Comprehensive summary derived from all available client data including surveys, emails, meeting transcripts, and notes.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Lead source analysis and engagement pattern</li>
                  <li>• Communication preferences and response history</li>
                  <li>• Property preferences and search criteria</li>
                  <li>• Budget considerations and financing status</li>
                  <li>• Timeline expectations and urgency factors</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleSeeFullSummary}>
                <FileText className="size-4 mr-2" />
                See Full Summary
              </Button>
              <Button variant="outline" onClick={handleDownloadFullSummary}>
                <Download className="size-4 mr-2" />
                Download Full Summary
              </Button>
            </div>
          </div>
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
                    <h4 className="font-medium text-gray-800">123 Main Street</h4>
                    <p className="text-sm text-gray-600">Offer Price: $450,000</p>
                    <p className="text-xs text-gray-500">Submitted: March 15, 2024</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-center py-4">
                No additional offers found for this client.
              </div>
            </div>
          </div>
        )
      
      case 'contingencies':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Transaction Contingencies</h3>
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
                  <label htmlFor="inspection" className="text-sm font-medium">Inspection Contingency</label>
                </div>
                <span className="text-xs text-gray-500">Due: {formatDate(client.inspectionDate)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="appraisal" className="rounded" />
                  <label htmlFor="appraisal" className="text-sm font-medium">Appraisal Contingency</label>
                </div>
                <span className="text-xs text-gray-500">Due: {formatDate(client.appraisalDate)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="loan" className="rounded" />
                  <label htmlFor="loan" className="text-sm font-medium">Loan Contingency</label>
                </div>
                <span className="text-xs text-gray-500">Due: {formatDate(client.closingDate)}</span>
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
                    <div className="text-sm font-medium">Pre-approval Letter - ABC Bank.pdf</div>
                    <div className="text-xs text-gray-500">Uploaded 2 days ago</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDocument({
                      id: 1,
                      title: "Pre-approval Letter - ABC Bank.pdf",
                      type: "pdf",
                      uploadedDate: "2 days ago",
                      content: "This is a sample pre-approval letter content. In a real application, this would display the actual document content or embed a PDF viewer."
                    })}
                  >
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadDocument({
                      id: 1,
                      title: "Pre-approval Letter - ABC Bank.pdf"
                    })}
                  >
                    <Download className="size-3 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRenameDocument({
                      id: 1,
                      title: "Pre-approval Letter - ABC Bank.pdf"
                    })}
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
                    <div className="text-sm font-medium">Property Wish List - Notes.docx</div>
                    <div className="text-xs text-gray-500">Uploaded 1 week ago</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDocument({
                      id: 2,
                      title: "Property Wish List - Notes.docx",
                      type: "docx",
                      uploadedDate: "1 week ago",
                      content: "Client's property wish list and preferences:\n\n• 3-4 bedrooms\n• 2+ bathrooms\n• Updated kitchen\n• Large backyard\n• Good school district\n• Near public transportation\n• Parking space\n• Modern appliances included"
                    })}
                  >
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadDocument({
                      id: 2,
                      title: "Property Wish List - Notes.docx"
                    })}
                  >
                    <Download className="size-3 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRenameDocument({
                      id: 2,
                      title: "Property Wish List - Notes.docx"
                    })}
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
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Email Correspondence</h3>
            </div>
            <div className="space-y-3">
              {/* Sample email thread data */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleEmailThreadClick({
                  id: 1,
                  subject: "Property Inquiry - 123 Main Street",
                  preview: "Hi, I'm very interested in scheduling a showing for this property...",
                  messageCount: 3,
                  lastMessage: "2 hours ago",
                  messages: [
                    {
                      id: 1,
                      sender: client.name,
                      senderEmail: client.email,
                      timestamp: "2024-03-15 10:30 AM",
                      content: "Hi, I'm very interested in scheduling a showing for this property at 123 Main Street. When would be a good time this week? I'm available Tuesday through Thursday afternoons. Looking forward to hearing from you!"
                    },
                    {
                      id: 2,
                      sender: "Agent",
                      senderEmail: "agent@realestate.com",
                      timestamp: "2024-03-15 11:15 AM",
                      content: "Hi! Thanks for your interest in 123 Main Street. I'd be happy to schedule a showing for you. How about Tuesday at 2:00 PM? The property has some great features I think you'll love, including the updated kitchen and large backyard."
                    },
                    {
                      id: 3,
                      sender: client.name,
                      senderEmail: client.email,
                      timestamp: "2024-03-15 11:45 AM",
                      content: "Perfect! Tuesday at 2:00 PM works great for me. Should I meet you at the property or would you prefer to meet somewhere else first? Also, is there anything specific I should prepare or bring along?"
                    }
                  ]
                })}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Property Inquiry - 123 Main Street</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Hi, I'm very interested in scheduling a showing for this property...
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <MessageCircle className="size-3 mr-1" />
                      3
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">Last message: 2 hours ago</div>
              </div>

              {/* Additional sample email thread */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleEmailThreadClick({
                  id: 2,
                  subject: "Follow-up on Property Search",
                  preview: "I wanted to follow up on our conversation about my property search criteria...",
                  messageCount: 2,
                  lastMessage: "1 day ago",
                  messages: [
                    {
                      id: 1,
                      sender: client.name,
                      senderEmail: client.email,
                      timestamp: "2024-03-14 3:30 PM",
                      content: "I wanted to follow up on our conversation about my property search criteria. After thinking about it more, I'd like to expand the search area to include neighborhoods within 15 minutes of downtown. Also, I'm now open to considering properties that need minor renovations if the price is right."
                    },
                    {
                      id: 2,
                      sender: "Agent",
                      senderEmail: "agent@realestate.com",
                      timestamp: "2024-03-14 4:45 PM",
                      content: "That's great to hear! Expanding the search area will definitely give us more options. I'll update your criteria in our system and send you some new listings that match your updated preferences. There are some really good opportunities in those neighborhoods."
                    }
                  ]
                })}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Follow-up on Property Search</div>
                    <div className="text-sm text-gray-600 mt-1">
                      I wanted to follow up on our conversation about my property search criteria...
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <MessageCircle className="size-3 mr-1" />
                      2
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">Last message: 1 day ago</div>
              </div>

              <div className="text-sm text-gray-500 text-center py-4">
                No additional email threads found.
              </div>
            </div>
          </div>
        )
      
      case 'calendar':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Client Timeline</h3>
            </div>
            
            {/* Coming Events */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Coming Events</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="size-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Property Showing</div>
                    <div className="text-xs text-gray-600">Tomorrow, 2:00 PM - 456 Oak Avenue</div>
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
                    <div className="text-sm font-medium">Initial Consultation</div>
                    <div className="text-xs text-gray-600">March 10, 2024, 10:00 AM</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-center py-2">
                  No additional past events.
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

  const visibleTabs = getVisibleTabs()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedDocument.content}
                </p>
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
