/**
 * Client Modal Component for Sellers Portal V2
 * Implements the detailed modal with tabs and stage-specific functionality
 * Modal occupies 85% of window height/width as specified
 */

import { useState, useEffect } from 'react'
import { 
  X, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Download, Plus, 
  Home, Clock, Archive, ArrowRight, RotateCcw, History, FolderOpen, 
  CalendarDays, Upload, Eye, Edit, MessageCircle, User, Send, 
  CheckCircle, AlertCircle, Settings, Star, TrendingUp, Users, Save
} from 'lucide-react'
import { Button } from '../ui/button'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import { dummyData } from '../../data/dummy-data'
import { LeadScoringDisplay } from '../shared/lead-scoring-display'
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
  currentUser
}: ClientModalProps) {
  const [activeTab, setActiveTab] = useState(client.initialTab || 'summary')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditingContingencies, setIsEditingContingencies] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    tags: ''
  })
  const [contingencyDates, setContingencyDates] = useState({
    inspection: '2024-01-15',
    appraisal: '2024-01-25',
    finance: '2024-02-01'
  })
  const [contingencyDetails, setContingencyDetails] = useState('')
  const [contractDetails, setContractDetails] = useState({
    contractPrice: '',
    buyerAgent: '',
    closingDate: '',
    contractDate: ''
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
    priority: client.priority,
    notes: client.notes
  })
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Seller Survey Results',
      type: 'PDF',
      size: '2.3 MB',
      uploadDate: '2024-01-10',
      description: 'Initial seller questionnaire responses',
      tags: 'survey, initial'
    },
    {
      id: 2,
      title: 'Generated Briefing',
      type: 'PDF',
      size: '1.8 MB',
      uploadDate: '2024-01-08',
      description: 'AI-generated client briefing document',
      tags: 'briefing, ai-generated'
    }
  ])

  // Handle initial document opening
  useEffect(() => {
    if (client.initialDocumentId && activeTab === 'documents') {
      const doc = documents.find(d => d.id === parseInt(client.initialDocumentId || '0'))
      if (doc) {
        setSelectedDocument({
          ...doc,
          content: "This is the document content that would be displayed in a scrollable modal."
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
      year: 'numeric'
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
      tags: uploadForm.tags
    }

    setDocuments([...documents, newDocument])
    setIsUploadModalOpen(false)
    setUploadForm({ file: null, title: '', description: '', tags: '' })
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument({
      ...document,
      content: `This is the content of "${document.title}". In a real application, this would display the actual document content in a scrollable format.`
    })
  }

  const handleDownloadDocument = (document: any) => {
    // Simulate download
    console.log('Downloading document:', document.title)
    alert(`Downloading ${document.title}`)
  }

  const handleSaveContingencies = () => {
    console.log('Saving contingency dates:', contingencyDates)
    console.log('Additional details:', contingencyDetails)
    console.log('Contract details:', contractDetails)
    
    // Phase 6 Task 6.4: Auto-create calendar events from contingency dates
    try {
      // Create calendar events for each contingency deadline
      const events = [
        {
          title: 'Inspection Period Deadline',
          date: contingencyDates.inspection,
          time: '17:00', // 5:00 PM
          description: `Inspection period deadline for ${client.propertyAddress}`,
          clientType: 'seller',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'inspection_deadline'
        },
        {
          title: 'Appraisal Deadline',
          date: contingencyDates.appraisal,
          time: '17:00',
          description: `Appraisal deadline for ${client.propertyAddress}`,
          clientType: 'seller',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'appraisal_deadline'
        },
        {
          title: 'Financing Deadline',
          date: contingencyDates.finance,
          time: '17:00',
          description: `Financing deadline for ${client.propertyAddress}`,
          clientType: 'seller',
          clientId: client.id.toString(),
          priority: 'high',
          eventType: 'financing_deadline'
        }
      ]
      
      console.log('Auto-created calendar events for contingency deadlines:', events)
      // In a real application, these would be saved to the calendar system
      
    } catch (error) {
      console.error('Error creating calendar events:', error)
    }
    
    setIsEditingContingencies(false)
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
      priority: client.priority,
      notes: client.notes
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
      alert('Agent profile is incomplete. Please update your profile before generating documents.')
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
    const baseTabs = [
      // Removed 'overview' and 'stage_details' tabs per Phase 2 requirements
      { id: 'ai_lead_scoring', label: 'AI Lead Scoring', icon: TrendingUp },
      { id: 'summary', label: 'Summary', icon: null },
    ]

    const stageSpecificTabs = []
    
    // Removed Offers tab from Active Listing stage per Phase 5 Task 5.3
    // Add Contingencies tab only for Under Contract stage
    if (client.stage === 'under_contract') {
      stageSpecificTabs.push({ id: 'contingencies', label: 'Contingencies', icon: Clock })
    }

    const alwaysVisibleTabs = [
      { id: 'documents', label: 'Documents and Content', icon: FolderOpen }, // Renamed from 'content'
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      // Removed 'email_history' tab as requested
    ]

    return [...baseTabs, ...stageSpecificTabs, ...alwaysVisibleTabs]
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
                <div><strong>Survey Status:</strong> {client.subStatus === 'awaiting_survey' ? 'Pending' : 'Completed'}</div>
                <div><strong>Lead Source:</strong> {client.leadSource}</div>
                <div><strong>Priority:</strong> {client.priority}</div>
                <div><strong>Date Added:</strong> {formatDate(client.dateAdded)}</div>
              </div>
            </div>
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">AI Briefing</h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'to_initiate_contact' && 'Ready for initial consultation call. Seller profile indicates potential for listing.'}
                {client.subStatus === 'awaiting_survey' && 'Survey sent to seller. Follow up recommended if no response within 48 hours.'}
                {client.subStatus === 'review_survey' && 'Survey completed. Review responses and prepare personalized seller consultation.'}
                {client.subStatus === 'awaiting_signing' && 'Seller is ready to sign listing agreement. Schedule signing appointment.'}
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
                <div><strong>CMA Status:</strong> {client.subStatus === 'preparing_cma' ? 'In Progress' : 'Completed'}</div>
                <div><strong>Market Analysis:</strong> Comparative analysis of 5 similar properties</div>
                <div><strong>Suggested List Price:</strong> $425,000 - $450,000</div>
                <div className="pt-4 space-y-2">
                  <div><strong>Comparable Properties:</strong></div>
                  <div className="text-xs text-gray-600">• 456 Oak Street - $445,000 (15 days on market)</div>
                  <div className="text-xs text-gray-600">• 789 Pine Avenue - $430,000 (22 days on market)</div>
                  <div className="text-xs text-gray-600">• 321 Maple Drive - $465,000 (8 days on market)</div>
                </div>
              </div>
            </div>
            <div className="bg-[#F6E2BC]/30 p-6 rounded-lg border border-[#F6E2BC]/50 flex-1">
              <h4 className="font-medium text-gray-800 mb-4">Listing Preparation</h4>
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
                  <div><strong>Next Steps:</strong></div>
                  <div className="text-xs text-gray-600">• Schedule professional photography</div>
                  <div className="text-xs text-gray-600">• Complete staging recommendations</div>
                  <div className="text-xs text-gray-600">• Finalize MLS description and details</div>
                  <div className="text-xs text-gray-600">• Set listing price and strategy</div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'active_listing':
        return (
          <div className="space-y-4">
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">Showing Feedback Hub</h4>
              <p className="text-sm text-gray-600 mb-3">Recent showing feedback from buyer's agents</p>
              <div className="space-y-2 text-sm">
                <div className="bg-white p-2 rounded border">
                  <div className="font-medium">Showing 1/12 - Positive feedback</div>
                  <div className="text-gray-600">Buyers loved the kitchen updates</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-medium">Showing 1/10 - Neutral feedback</div>
                  <div className="text-gray-600">Buyers concerned about backyard size</div>
                </div>
              </div>
            </div>
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-3">Listing Performance</h4>
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
              <h4 className="font-medium text-gray-800 mb-2">Contract Details</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Contract Price:</strong> $435,000</div>
                <div><strong>Buyer Agent:</strong> Jane Smith, ABC Realty</div>
                <div><strong>Closing Date:</strong> February 15, 2024</div>
                <div><strong>Contract Date:</strong> January 5, 2024</div>
              </div>
            </div>
            <div className="bg-[#F6E2BC]/30 p-4 rounded-lg border border-[#F6E2BC]/50">
              <h4 className="font-medium text-gray-800 mb-2">Transaction Timeline</h4>
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
              <h4 className="font-medium text-gray-800 mb-2">Closing Summary</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Final Sale Price:</strong> $432,000</div>
                <div><strong>Closing Date:</strong> February 12, 2024</div>
                <div><strong>Days on Market:</strong> 18 days</div>
                <div><strong>Commission:</strong> $12,960</div>
              </div>
            </div>
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">Post-Closing Status</h4>
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
            <div className="text-gray-500">No stage-specific content available.</div>
          </div>
        )
    }
  }

  // Get next event for this client from calendar data
  const getNextEvent = () => {
    const clientEvents = dummyData.calendarEvents.filter(event => 
      event.clientType === 'seller' && event.clientId === client.id.toString()
    )
    const today = new Date()
    const upcomingEvents = clientEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= today
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return upcomingEvents.length > 0 ? upcomingEvents[0] : null
  }

  const nextEvent = getNextEvent()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="h-full flex flex-col gap-6">
            {/* First Row: Property Details and Seller Motivation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Widget A: Property Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Home className="size-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Property Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Address:</span>
                    <span className="text-sm text-gray-900">{isEditingDetails ? editableDetails.propertyAddress : client.propertyAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Property Type:</span>
                    <span className="text-sm text-gray-900">{isEditingDetails ? editableDetails.propertyType : client.propertyType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Bed/Bath:</span>
                    <span className="text-sm text-gray-900">{isEditingDetails ? editableDetails.bedrooms : client.bedrooms}bd/{isEditingDetails ? editableDetails.bathrooms : client.bathrooms}ba</span>
                  </div>
                </div>
              </div>

              {/* Widget B: Seller Motivation with Price Range */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="size-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Seller Motivation</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Timeline:</span>
                    <span className="text-sm text-gray-900">{isEditingDetails ? editableDetails.timeline : client.timeline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Reason for Selling:</span>
                    <span className="text-sm text-gray-900">{isEditingDetails ? editableDetails.reasonForSelling : client.reasonForSelling}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Expected Price Range:</span>
                    <span className="text-sm text-gray-900">$425,000 - $450,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Priority:</span>
                    <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium border ${
                      (isEditingDetails ? editableDetails.priority : client.priority) === 'High' ? 'bg-[#c05e51]/10 text-[#c05e51] border-[#c05e51]/20' :
                      (isEditingDetails ? editableDetails.priority : client.priority) === 'Medium' ? 'bg-[#F6E2BC]/30 text-[#8B7355] border-[#F6E2BC]/50' :
                      'bg-[#A9D09E]/20 text-[#5a7c50] border-[#A9D09E]/40'
                    }`}>
                      {isEditingDetails ? editableDetails.priority : client.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row: Recent Notes and Next Event - Expanded to fill remaining space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Widget C: Recent Notes (Removed AI functionality) */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <MessageCircle className="size-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Recent Notes</h3>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{isEditingDetails ? editableDetails.notes : client.notes}</p>
                    <span className="text-xs text-gray-500 mt-1">Manual Note • {formatDate(client.dateAdded)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">Initial contact established. Client expressed interest in listing within the next 3 months.</p>
                    <span className="text-xs text-gray-500 mt-1">Note • 3 days ago</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">Discussed preferred listing timeframe and market conditions.</p>
                    <span className="text-xs text-gray-500 mt-1">Note • 1 week ago</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">Reviewed comparable sales in the neighborhood.</p>
                    <span className="text-xs text-gray-500 mt-1">Note • 2 weeks ago</span>
                  </div>
                </div>
              </div>

              {/* Widget D: Next Event (Connected to Calendar) */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <Calendar className="size-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Next Event</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {nextEvent ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full">
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-blue-800 mb-2">{nextEvent.title}</h4>
                        <p className="text-sm text-blue-700 mb-4">{nextEvent.location || client.propertyAddress}</p>
                        <div className="flex items-center justify-center text-sm text-blue-600">
                          <Calendar className="size-4 mr-1" />
                          <span>{new Date(nextEvent.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {nextEvent.time}</span>
                        </div>
                        {(nextEvent as any).description && (
                          <p className="text-xs text-blue-600 mt-3 opacity-75">{(nextEvent as any).description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-full">
                      <div className="text-center text-gray-500">
                        <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium mb-1">No upcoming events scheduled</p>
                        <p className="text-xs text-gray-400 mb-4">Keep your client engaged with regular touchpoints</p>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>• Schedule property consultation</p>
                          <p>• Plan market analysis meeting</p>
                          <p>• Set listing preparation timeline</p>
                        </div>
                      </div>
                    </div>
                  )}
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
              <h3 className="font-semibold text-gray-800">Buyer Contingencies</h3>
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Contract Details Section */}
              <div className="mb-6 p-4 bg-[#3B7097]/5 rounded-lg border border-[#3B7097]/20">
                <h4 className="font-semibold text-gray-800 mb-4">Contract Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Price</label>
                    {isEditingContingencies ? (
                      <input
                        type="text"
                        value={contractDetails.contractPrice}
                        onChange={(e) => setContractDetails({...contractDetails, contractPrice: e.target.value})}
                        placeholder="e.g., $435,000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                      />
                    ) : (
                      <div className="text-sm text-gray-800 font-medium">
                        {contractDetails.contractPrice || <span className="text-gray-500 italic">Not entered</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Agent</label>
                    {isEditingContingencies ? (
                      <input
                        type="text"
                        value={contractDetails.buyerAgent}
                        onChange={(e) => setContractDetails({...contractDetails, buyerAgent: e.target.value})}
                        placeholder="e.g., Jane Smith, ABC Realty"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                      />
                    ) : (
                      <div className="text-sm text-gray-800 font-medium">
                        {contractDetails.buyerAgent || <span className="text-gray-500 italic">Not entered</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                    {isEditingContingencies ? (
                      <input
                        type="date"
                        value={contractDetails.closingDate}
                        onChange={(e) => setContractDetails({...contractDetails, closingDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                      />
                    ) : (
                      <div className="text-sm text-gray-800 font-medium">
                        {contractDetails.closingDate ? formatDate(contractDetails.closingDate) : <span className="text-gray-500 italic">Not set</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Date</label>
                    {isEditingContingencies ? (
                      <input
                        type="date"
                        value={contractDetails.contractDate}
                        onChange={(e) => setContractDetails({...contractDetails, contractDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                      />
                    ) : (
                      <div className="text-sm text-gray-800 font-medium">
                        {contractDetails.contractDate ? formatDate(contractDetails.contractDate) : <span className="text-gray-500 italic">Not set</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Contingencies Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="size-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-gray-800">Inspection Contingency</div>
                      {isEditingContingencies ? (
                        <input
                          type="date"
                          value={contingencyDates.inspection}
                          onChange={(e) => setContingencyDates({...contingencyDates, inspection: e.target.value})}
                          className="text-sm border rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">Due: {formatDate(contingencyDates.inspection)}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="size-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-800">Appraisal Contingency</div>
                      {isEditingContingencies ? (
                        <input
                          type="date"
                          value={contingencyDates.appraisal}
                          onChange={(e) => setContingencyDates({...contingencyDates, appraisal: e.target.value})}
                          className="text-sm border rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">Due: {formatDate(contingencyDates.appraisal)}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="size-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-800">Finance Contingency</div>
                      {isEditingContingencies ? (
                        <input
                          type="date"
                          value={contingencyDates.finance}
                          onChange={(e) => setContingencyDates({...contingencyDates, finance: e.target.value})}
                          className="text-sm border rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">Due: {formatDate(contingencyDates.finance)}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Complete</span>
                </div>
                
                {/* Phase 6 Task 6.2: Additional details field */}
                {isEditingContingencies && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Details
                    </label>
                    <textarea
                      value={contingencyDetails}
                      onChange={(e) => setContingencyDetails(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Enter any additional contingency details or notes..."
                    />
                  </div>
                )}
                
                {!isEditingContingencies && contingencyDetails && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-800 mb-1">Additional Details:</div>
                    <div className="text-sm text-gray-600">{contingencyDetails}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Documents & Content</h3>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                variant="outline"
              >
                <Upload className="size-4 mr-2" />
                Upload Content
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="size-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-800">{document.title}</div>
                        <div className="text-sm text-gray-600">{document.type} • {document.size}</div>
                        {document.description && (
                          <div className="text-xs text-gray-500 mt-1">{document.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewDocument(document)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDownloadDocument(document)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="size-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-2">Click "Upload Content" to add documents</p>
                  </div>
                )}
                            </div>
            </div>
          </div>
        )
      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Calendar Events</h3>
              <Button
                onClick={() => {
                  const event = {
                    title: '',
                    date: '',
                    time: '',
                    description: '',
                    clientType: 'seller',
                    clientId: client.id.toString(),
                    priority: 'low',
                    eventType: 'custom'
                  }
                  console.log('Add event for seller client:', client.name)
                }}
                className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 h-auto"
              >
                <Plus className="size-4 mr-1" />
                Add Event
              </Button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Coming Events</h4>
                  <div className="space-y-2">
                    {(() => {
                      const clientEvents = dummyData.calendarEvents.filter(event => 
                        event.clientType === 'seller' && event.clientId === client.id.toString()
                      )
                      const today = new Date()
                      const upcomingEvents = clientEvents.filter(event => {
                        const eventDate = new Date(event.date)
                        return eventDate >= today
                      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      
                      if (upcomingEvents.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 text-center py-2">
                            No upcoming events scheduled.
                          </div>
                        )
                      }
                      
                      return upcomingEvents.map(event => (
                        <div 
                          key={event.id}
                          onClick={() => {
                            console.log('Edit event:', event)
                          }}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="size-5 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-800">{event.title}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}, {event.time}
                                {event.location && ` - ${event.location}`}
                              </div>
                            </div>
                          </div>
                          {event.priority === 'high' && (
                            <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              High Priority
                            </div>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Past Events</h4>
                  <div className="space-y-2">
                    {(() => {
                      const clientEvents = dummyData.calendarEvents.filter(event => 
                        event.clientType === 'seller' && event.clientId === client.id.toString()
                      )
                      const today = new Date()
                      const pastEvents = clientEvents.filter(event => {
                        const eventDate = new Date(event.date)
                        return eventDate < today
                      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      
                      if (pastEvents.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 text-center py-2">
                            No past events found.
                          </div>
                        )
                      }
                      
                      return pastEvents.map(event => (
                        <div 
                          key={event.id}
                          onClick={() => {
                            console.log('View past event:', event)
                          }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="size-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-800">{event.title}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}, {event.time}
                                {event.location && ` - ${event.location}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
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
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
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
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
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
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
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
                    onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editableDetails.name}
                      onChange={(e) => setEditableDetails({...editableDetails, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editableDetails.email}
                      onChange={(e) => setEditableDetails({...editableDetails, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editableDetails.phone}
                    onChange={(e) => setEditableDetails({...editableDetails, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
                  <input
                    type="text"
                    value={editableDetails.propertyAddress}
                    onChange={(e) => setEditableDetails({...editableDetails, propertyAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <select
                      value={editableDetails.propertyType}
                      onChange={(e) => setEditableDetails({...editableDetails, propertyType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="Single Family">Single Family</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Condo">Condo</option>
                      <option value="Multi-Family">Multi-Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <input
                      type="number"
                      value={editableDetails.bedrooms}
                      onChange={(e) => setEditableDetails({...editableDetails, bedrooms: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <input
                      type="number"
                      value={editableDetails.bathrooms}
                      onChange={(e) => setEditableDetails({...editableDetails, bathrooms: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                    <select
                      value={editableDetails.timeline}
                      onChange={(e) => setEditableDetails({...editableDetails, timeline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="ASAP">ASAP</option>
                      <option value="Next 3 months">Next 3 months</option>
                      <option value="Next 6 months">Next 6 months</option>
                      <option value="Next year">Next year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={editableDetails.priority}
                      onChange={(e) => setEditableDetails({...editableDetails, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Selling</label>
                  <input
                    type="text"
                    value={editableDetails.reasonForSelling}
                    onChange={(e) => setEditableDetails({...editableDetails, reasonForSelling: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editableDetails.notes}
                    onChange={(e) => setEditableDetails({...editableDetails, notes: e.target.value})}
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
              <h2 className="text-xl font-semibold text-gray-800">{isEditingDetails ? editableDetails.name : client.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <span>{getStageName(client.stage)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{isEditingDetails ? editableDetails.propertyAddress : client.propertyAddress}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <Calendar className="size-4" />
                <span>Date Added: {formatDate(client.dateAdded)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <a href={`tel:${isEditingDetails ? editableDetails.phone : client.phone}`} className="text-gray-500 hover:text-[#3B7097]">
                <Phone className="size-5" />
              </a>
              <a href={`mailto:${isEditingDetails ? editableDetails.email : client.email}`} className="text-gray-500 hover:text-[#3B7097]">
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
            {getVisibleTabs().map((tab) => (
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
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>

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
                    onClick={handleReturnToPreviousStage}
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