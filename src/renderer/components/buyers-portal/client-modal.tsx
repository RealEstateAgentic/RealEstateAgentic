import { useState } from 'react'
import { X, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Download, Plus, Home, Clock, Archive, ArrowRight, RotateCcw, History, FolderOpen, CalendarDays, Upload, Eye, Edit, MessageCircle, User } from 'lucide-react'
import { Button } from '../ui/button'

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
}

export function ClientModal({ client, onClose, onArchive, onProgress, onUnarchive, isArchiveMode = false }: ClientModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEmailThread, setSelectedEmailThread] = useState<any>(null)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  const formatDate = (dateString: string | null) => {
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

  const handleSendSurvey = () => {
    // TODO: Implement LangChain workflow for sending survey
    console.log('Send Survey clicked for client:', client.id)
  }

  const handleUploadOffer = () => {
    // TODO: Implement offer upload workflow
    console.log('Upload Offer clicked for client:', client.id)
  }

  const handleGenerateClosingPacket = () => {
    // TODO: Implement closing packet generation from Content tab
    console.log('Generate Closing Packet clicked for client:', client.id)
  }

  const handleReturnToPreviousStage = () => {
    // TODO: Implement stage rollback functionality
    console.log('Return to previous stage clicked for client:', client.id)
  }

  const handleUploadInspectionReport = () => {
    // TODO: Navigate to repair-estimator page
    console.log('Navigate to repair-estimator page')
  }

  const handleEmailThreadClick = (emailThread: any) => {
    setSelectedEmailThread(emailThread)
  }

  const handleCloseEmailThread = () => {
    setSelectedEmailThread(null)
  }

  const handleSeeFullSummary = () => {
    setShowFullSummary(true)
  }

  const handleCloseFullSummary = () => {
    setShowFullSummary(false)
  }

  const handleDownloadFullSummary = () => {
    // TODO: Implement download functionality
    console.log('Download full summary for client:', client.id)
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
  }

  const handleCloseDocument = () => {
    setSelectedDocument(null)
  }

  const handleDownloadDocument = (document: any) => {
    // TODO: Implement document download
    console.log('Download document:', document.id)
  }

  const handleRenameDocument = (document: any) => {
    // TODO: Implement document rename functionality
    console.log('Rename document:', document.id)
  }

  const getStageActions = () => {
    switch (client.stage) {
      case 'new_leads':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#A9D09E] hover:bg-[#A9D09E]/90">
              <FileText className="size-4 mr-2" />
              Download Meeting Materials
            </Button>
            <Button variant="outline">
              <Plus className="size-4 mr-2" />
              Add Client Details
            </Button>
          </div>
        )
      case 'active_search':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
              <FileText className="size-4 mr-2" />
              Generate Offer Cover Letter
            </Button>
            <Button variant="outline">
              <Home className="size-4 mr-2" />
              Compare Properties
            </Button>
            <Button variant="outline">
              <Plus className="size-4 mr-2" />
              Add Client Details
            </Button>
          </div>
        )
      case 'under_contract':
        return (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Download className="size-4 mr-2" />
              Generate Cost Analysis
            </Button>
            <Button variant="outline">
              <FileText className="size-4 mr-2" />
              Draft Repair Request
            </Button>
          </div>
        )
      case 'closed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#A9D09E] hover:bg-[#A9D09E]/90">
              <FileText className="size-4 mr-2" />
              Suggest Thank You Gift
            </Button>
            <Button variant="outline">
              <Mail className="size-4 mr-2" />
              Start Post-Closing Follow-up
            </Button>
            <Button variant="outline">
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
              <h4 className="font-medium text-gray-800 mb-2">Survey Results</h4>
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
                {client.subStatus === 'to_initiate_contact' && 'Ready for initial consultation call. Client profile indicates high engagement potential.'}
                {client.subStatus === 'awaiting_survey' && 'Survey sent to client. Follow up recommended if no response within 48 hours.'}
                {client.subStatus === 'review_survey' && 'Survey completed. Review responses and prepare personalized buyer consultation.'}
              </p>
            </div>
          </div>
        )
      case 'under_contract':
        return (
          <div className="space-y-4">
            {/* Transaction Timeline */}
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">Transaction Timeline</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Property:</strong> {client.contractProperty}</div>
                <div><strong>Contract Date:</strong> {formatDate(client.contractDate)}</div>
                <div><strong>Inspection Date:</strong> {formatDate(client.inspectionDate)}</div>
                <div><strong>Appraisal Date:</strong> {formatDate(client.appraisalDate)}</div>
                <div><strong>Closing Date:</strong> {formatDate(client.closingDate)}</div>
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
      <div className="bg-white rounded-lg w-[85vw] h-[85vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{client.name}</h2>
            <p className="text-sm text-gray-500">{client.stage.replace('_', ' ').toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Client Vitals */}
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-1 px-6 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#3B7097] text-[#3B7097]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon && <tab.icon className="size-4 mr-2" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            {/* Stage-specific actions */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {/* Original stage actions */}
                {getStageActions()}
                
                {/* Additional workflow buttons based on stage */}
                {client.stage === 'new_leads' && (
                  <Button 
                    onClick={handleSendSurvey}
                    className="bg-[#3B7097] hover:bg-[#3B7097]/90"
                  >
                    <Mail className="size-4 mr-2" />
                    {client.subStatus === 'awaiting_survey' ? 'Resend Survey' : 'Send Survey'}
                  </Button>
                )}
                
                {client.stage === 'active_search' && (
                  <Button 
                    onClick={handleUploadOffer}
                    className="bg-[#A9D09E] hover:bg-[#A9D09E]/90"
                  >
                    <Upload className="size-4 mr-2" />
                    Upload Offer
                  </Button>
                )}
                
                {client.stage === 'closed' && (
                  <Button 
                    onClick={handleGenerateClosingPacket}
                    className="bg-[#3B7097] hover:bg-[#3B7097]/90"
                  >
                    <FileText className="size-4 mr-2" />
                    Generate Closing Packet
                  </Button>
                )}
              </div>
            </div>
            
            {/* Archive/Progress buttons or Unarchive button */}
            <div className="flex flex-wrap gap-2">
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
                  
                  {/* Return to Previous Stage Button (all stages except New Leads) */}
                  {client.stage !== 'new_leads' && (
                    <Button
                      onClick={handleReturnToPreviousStage}
                      variant="outline"
                      className="border-[#75BDE0] text-[#75BDE0] hover:bg-[#75BDE0]/10"
                    >
                      <RotateCcw className="size-4 mr-2" />
                      {getPreviousStageText(client.stage)}
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

      {/* Email Thread Modal - Secondary Pop-up */}
      {selectedEmailThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[70vw] h-[70vh] mx-4 flex flex-col">
            {/* Email Thread Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedEmailThread.subject}</h2>
                <p className="text-sm text-gray-500">{selectedEmailThread.messageCount} messages</p>
              </div>
              <button
                onClick={handleCloseEmailThread}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Email Thread Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedEmailThread.messages.map((message: any, index: number) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-sm">{message.sender}</div>
                        <div className="text-xs text-gray-500">{message.senderEmail}</div>
                      </div>
                      <div className="text-xs text-gray-500">{message.timestamp}</div>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Thread Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseEmailThread}>
                  Close
                </Button>
                <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                  <Mail className="size-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Summary Modal - Secondary Pop-up */}
      {showFullSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[70vw] h-[70vh] mx-4 flex flex-col">
            {/* Full Summary Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Complete Client Summary</h2>
                <p className="text-sm text-gray-500">{client.name}</p>
              </div>
              <button
                onClick={handleCloseFullSummary}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Full Summary Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Executive Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {client.name} is a {client.priority.toLowerCase()} priority buyer lead from {client.leadSource} with a budget of {client.budget} looking for properties in {client.location}. Currently in the {getStageName(client.stage)} stage with strong engagement indicators.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Communication Analysis</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Preferred communication method: Email and phone calls</li>
                    <li>• Response time: Typically within 2-4 hours during business days</li>
                    <li>• Engagement level: High - actively participating in property searches</li>
                    <li>• Last meaningful interaction: {formatDate(client.lastContact)}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Property Preferences</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Budget range: {client.budget}</li>
                    <li>• Preferred areas: {client.location}</li>
                    <li>• Property type: Single-family homes preferred</li>
                    <li>• Key requirements: Updated kitchen, good school district, parking</li>
                    {client.favoritedProperties && client.favoritedProperties.length > 0 && (
                      <li>• Properties favorited: {client.favoritedProperties.length} listings</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Timeline & Urgency</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Target move-in date: Within 3-6 months</li>
                    <li>• Financing: Pre-approved with ABC Bank</li>
                    <li>• Availability for showings: Flexible, prefers weekends</li>
                    <li>• Decision timeline: Ready to make offers on suitable properties</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Schedule regular check-ins every 3-5 days</li>
                    <li>• Focus on properties with updated kitchens and good schools</li>
                    <li>• Prepare market analysis for preferred neighborhoods</li>
                    <li>• Consider expanding search radius if inventory is limited</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Full Summary Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseFullSummary}>
                  Close
                </Button>
                <Button 
                  onClick={handleDownloadFullSummary}
                  className="bg-[#3B7097] hover:bg-[#3B7097]/90"
                >
                  <Download className="size-4 mr-2" />
                  Download Summary
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal - Secondary Pop-up */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[70vw] h-[70vh] mx-4 flex flex-col">
            {/* Document Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedDocument.title}</h2>
                <p className="text-sm text-gray-500">Uploaded {selectedDocument.uploadedDate}</p>
              </div>
              <button
                onClick={handleCloseDocument}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Document Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedDocument.content}
                </div>
              </div>
            </div>

            {/* Document Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDocument}>
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDocument)}
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleRenameDocument(selectedDocument)}
                >
                  <Edit className="size-4 mr-2" />
                  Rename
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 