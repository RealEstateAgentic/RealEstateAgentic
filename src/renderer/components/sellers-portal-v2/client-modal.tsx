/**
 * Client Modal Component for Sellers Portal V2
 * Implements the detailed modal with tabs and stage-specific functionality
 * Modal occupies 85% of window height/width as specified
 */

import { useState } from 'react'
import { 
  X, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Download, Plus, 
  Home, Clock, Archive, ArrowRight, RotateCcw, History, FolderOpen, 
  CalendarDays, Upload, Eye, Edit, MessageCircle, User, Send, 
  CheckCircle, AlertCircle, Settings, Star, TrendingUp, Users
} from 'lucide-react'
import { Button } from '../ui/button'
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
  }
  onClose: () => void
  onArchive?: (client: any) => void
  onProgress?: (client: any) => void
  onUnarchive?: (client: any) => void
  isArchiveMode?: boolean
}

export function ClientModal({ 
  client, 
  onClose, 
  onArchive, 
  onProgress, 
  onUnarchive, 
  isArchiveMode = false 
}: ClientModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEmailThread, setSelectedEmailThread] = useState<any>(null)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

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
    // TODO: Implement stage rollback functionality
    console.log('Return to previous stage clicked for client:', client.id)
  }

  // Define which tabs should be visible based on client stage
  const getVisibleTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: null },
      { id: 'stage_details', label: 'Stage Details', icon: null },
      { id: 'ai_lead_scoring', label: 'AI Lead Scoring', icon: TrendingUp },
      { id: 'summary', label: 'Summary', icon: null },
    ]

    const stageSpecificTabs = []
    
    // Add Offers tab only for Active Listing stage
    if (client.stage === 'active_listing') {
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
              <Calendar className="size-4 mr-2" />
              Schedule Onboarding Appointment
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
            <Button className="bg-[#A9D09E] hover:bg-[#A9D09E]/90">
              <FileText className="size-4 mr-2" />
              Generate Listing Description
            </Button>
            <Button variant="outline">
              <Calendar className="size-4 mr-2" />
              Schedule Listing Appointment
            </Button>
          </div>
        )
      case 'active_listing':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
              <TrendingUp className="size-4 mr-2" />
              Generate Weekly Seller Report
            </Button>
            <Button variant="outline">
              <MessageCircle className="size-4 mr-2" />
              Log Showing Feedback
            </Button>
          </div>
        )
      case 'under_contract':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#c05e51] hover:bg-[#c05e51]/90">
              <Edit className="size-4 mr-2" />
              Draft Negotiation Response
            </Button>
          </div>
        )
      case 'closed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#A9D09E] hover:bg-[#A9D09E]/90">
              <Star className="size-4 mr-2" />
              Suggest Thank You Gift
            </Button>
            <Button variant="outline">
              <Mail className="size-4 mr-2" />
              Start Post-Closing Follow-up
            </Button>
            <Button variant="outline">
              <Users className="size-4 mr-2" />
              Request Referral
            </Button>
            <Button variant="outline">
              <Download className="size-4 mr-2" />
              Generate Closing Packet
            </Button>
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
          <div className="space-y-4">
            {/* Listing Prep Checklist */}
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-3">Listing Prep Checklist</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm">Sign Listing Agreement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="size-4 text-yellow-500" />
                  <span className="text-sm">Schedule Photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="size-4 text-gray-400" />
                  <span className="text-sm">Complete Disclosures</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="size-4 text-gray-400" />
                  <span className="text-sm">Staging Consultation</span>
                </div>
              </div>
            </div>

            {/* Vendor Management Hub */}
            <div className="bg-[#F6E2BC]/10 p-4 rounded-lg border border-[#F6E2BC]/30">
              <h4 className="font-medium text-gray-800 mb-3">Vendor Management Hub</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Photographer</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Stager</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'active_listing':
        return (
          <div className="space-y-4">
            {/* Showing Feedback Hub */}
            <div className="bg-[#75BDE0]/10 p-4 rounded-lg border border-[#75BDE0]/30">
              <h4 className="font-medium text-gray-800 mb-2">Showing Feedback Hub</h4>
              <p className="text-sm text-gray-600 mb-3">Log feedback from buyer's agents</p>
              <Button size="sm" className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                <Plus className="size-3 mr-1" />
                Add Feedback
              </Button>
            </div>

            {/* Listing Performance Widget */}
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

            {/* Comparable Market Activity */}
            <div className="bg-[#F6E2BC]/10 p-4 rounded-lg border border-[#F6E2BC]/30">
              <h4 className="font-medium text-gray-800 mb-3">Comparable Market Activity</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>456 Pine St - Under Contract</span>
                  <span className="text-gray-500">2 days ago</span>
                </div>
                <div className="flex justify-between">
                  <span>789 Oak Ave - Price Reduction</span>
                  <span className="text-gray-500">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'under_contract':
        return (
          <div className="space-y-4">
            {/* Transaction Timeline */}
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-3">Transaction Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span><strong>Option Period Ends:</strong></span>
                  <span className="text-red-600 font-medium">July 25, 2025 (in 3 days)</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Financing Contingency Deadline:</strong></span>
                  <span className="text-yellow-600 font-medium">August 1, 2025 (in 10 days)</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Closing Date:</strong></span>
                  <span className="text-green-600 font-medium">August 15, 2025</span>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-[#F6E2BC]/10 p-4 rounded-lg border border-[#F6E2BC]/30">
              <h4 className="font-medium text-gray-800 mb-3">Key Contacts</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Buyer's Agent</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="size-3 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Lender</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="size-3 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Title Officer</div>
                    <div className="text-xs text-gray-500">Not assigned</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="size-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'closed':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-3">Final Transaction History</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Closing Date:</strong> {formatDate(client.dateAdded)}</div>
                <div><strong>Final Sale Price:</strong> $450,000</div>
                <div><strong>Net Proceeds:</strong> $423,500</div>
                <div><strong>Days on Market:</strong> 15 days</div>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
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
                  <span className="text-sm text-gray-900">{client.propertyAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Property Type:</span>
                  <span className="text-sm text-gray-900">{client.propertyType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Bed/Bath:</span>
                  <span className="text-sm text-gray-900">{client.bedrooms}bd/{client.bathrooms}ba</span>
                </div>
              </div>
            </div>

            {/* Widget B: Seller Motivation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="size-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Seller Motivation</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Timeline:</span>
                  <span className="text-sm text-gray-900">{client.timeline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reason for Selling:</span>
                  <span className="text-sm text-gray-900">{client.reasonForSelling}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Priority:</span>
                  <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium border ${
                    client.priority === 'High' ? 'bg-[#c05e51]/10 text-[#c05e51] border-[#c05e51]/20' :
                    client.priority === 'Medium' ? 'bg-[#F6E2BC]/30 text-[#8B7355] border-[#F6E2BC]/50' :
                    'bg-[#A9D09E]/20 text-[#5a7c50] border-[#A9D09E]/40'
                  }`}>
                    {client.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Widget C: Recent Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MessageCircle className="size-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Recent Notes & Insights</h3>
              </div>
              <div className="space-y-3 max-h-32 overflow-y-auto">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{client.notes}</p>
                  <span className="text-xs text-gray-500 mt-1">Manual Note • {formatDate(client.dateAdded)}</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">AI Insight: Property appears to be well-maintained based on initial consultation.</p>
                  <span className="text-xs text-gray-500 mt-1">AI Generated • 2 days ago</span>
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
                  <h4 className="text-lg font-semibold text-blue-800 mb-1">Listing Consultation</h4>
                  <p className="text-sm text-blue-700 mb-2">{client.propertyAddress}</p>
                  <div className="flex items-center justify-center text-sm text-blue-600">
                    <Calendar className="size-4 mr-1" />
                    <span>Tomorrow at 2:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'stage_details':
        return getStageSpecificContent()
      case 'summary':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Client Summary Preview</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Property Overview</h4>
                  <p className="text-sm text-gray-600">
                    {client.propertyType} located at {client.propertyAddress}. 
                    Property features {client.bedrooms} bedrooms and {client.bathrooms} bathrooms.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Seller Motivation</h4>
                  <p className="text-sm text-gray-600">
                    Client's primary motivation: {client.reasonForSelling}. 
                    Timeline: {client.timeline}. Priority level: {client.priority}.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Lead Information</h4>
                  <p className="text-sm text-gray-600">
                    Lead source: {client.leadSource}. Added on {formatDate(client.dateAdded)}.
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline">
                  <Eye className="size-4 mr-2" />
                  See Full Summary
                </Button>
                <Button variant="outline">
                  <Download className="size-4 mr-2" />
                  Download Full Summary
                </Button>
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
      case 'offers':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Received Offers</h3>
              <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
                <TrendingUp className="size-4 mr-2" />
                Analyze Offers
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center py-8">
                <DollarSign className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No offers received yet</p>
                <p className="text-sm text-gray-400 mt-2">Offers will appear here when received</p>
              </div>
            </div>
          </div>
        )
      case 'contingencies':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Buyer Contingencies</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="size-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-gray-800">Inspection Contingency</div>
                      <div className="text-sm text-gray-600">Expires in 3 days</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="size-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-800">Appraisal Contingency</div>
                      <div className="text-sm text-gray-600">Expires in 10 days</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="size-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-800">Financing Contingency</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Complete</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'content':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Documents & Content</h3>
              <Button variant="outline">
                <Upload className="size-4 mr-2" />
                Upload Content
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="size-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-800">Seller Survey Results</div>
                      <div className="text-sm text-gray-600">PDF • 2.3 MB</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="size-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="size-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-800">Generated Briefing</div>
                      <div className="text-sm text-gray-600">PDF • 1.8 MB</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="size-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="size-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-800">Generated Presentation (Gamma)</div>
                      <div className="text-sm text-gray-600">Presentation • 5.2 MB</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="size-4 mr-1" />
                      Download
                    </Button>
                  </div>
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
          />
        )
      case 'calendar':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Calendar Events</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Coming Events</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="size-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-800">Listing Consultation</div>
                          <div className="text-sm text-gray-600">Tomorrow at 2:00 PM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Past Events</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="size-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-800">Initial Consultation</div>
                          <div className="text-sm text-gray-600">1 week ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal - 85% of viewport */}
      <div className="bg-white rounded-lg w-[85vw] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{client.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{client.propertyAddress}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <a href={`tel:${client.phone}`} className="text-gray-500 hover:text-[#3B7097]">
                <Phone className="size-5" />
              </a>
              <a href={`mailto:${client.email}`} className="text-gray-500 hover:text-[#3B7097]">
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
            
            {/* Always present upload button */}
            <Button variant="outline">
              <Upload className="size-4 mr-2" />
              Upload Content
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
    </div>
  )
} 