import { useState } from 'react'
import { X, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Download, Plus, Home, Clock } from 'lucide-react'
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
  }
  onClose: () => void
}

export function ClientModal({ client, onClose }: ClientModalProps) {
  const [activeTab, setActiveTab] = useState('summary')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStageActions = () => {
    switch (client.stage) {
      case 'new_leads':
        return (
          <div className="flex gap-2">
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
          <div className="flex gap-2">
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
          <div className="flex gap-2">
            <Button className="bg-[#3B7097] hover:bg-[#3B7097]/90">
              <FileText className="size-4 mr-2" />
              Upload Inspection Report
            </Button>
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
          <div className="flex gap-2">
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
              <h4 className="font-medium text-gray-800 mb-2">Lead Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Source:</strong> {client.leadSource}</div>
                <div><strong>Priority:</strong> {client.priority}</div>
                <div><strong>Date Added:</strong> {formatDate(client.dateAdded)}</div>
                <div><strong>Last Contact:</strong> {formatDate(client.lastContact)}</div>
              </div>
            </div>
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'to_initiate_contact' && 'Schedule initial consultation call'}
                {client.subStatus === 'awaiting_survey' && 'Send buyer survey form'}
                {client.subStatus === 'review_survey' && 'Review submitted survey and prepare briefing'}
              </p>
            </div>
          </div>
        )
      case 'active_search':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">Property Search</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Favorited Properties:</strong> {client.favoritedProperties?.length || 0}</div>
                <div><strong>Viewed Properties:</strong> {client.viewedProperties?.length || 0}</div>
                <div><strong>Status:</strong> {client.subStatus.replace('_', ' ')}</div>
              </div>
            </div>
            {client.favoritedProperties && client.favoritedProperties.length > 0 && (
              <div className="bg-[#F6E2BC]/50 p-4 rounded-lg border border-[#F6E2BC]">
                <h4 className="font-medium text-gray-800 mb-2">Favorited Properties</h4>
                <div className="space-y-1">
                  {client.favoritedProperties.map((property, index) => (
                    <div key={index} className="text-sm text-gray-700">• {property}</div>
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
              <h4 className="font-medium text-gray-800 mb-2">Contract Details</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Property:</strong> {client.contractProperty}</div>
                <div><strong>Contract Date:</strong> {formatDate(client.contractDate)}</div>
                <div><strong>Inspection Date:</strong> {formatDate(client.inspectionDate)}</div>
                <div><strong>Appraisal Date:</strong> {formatDate(client.appraisalDate)}</div>
                <div><strong>Closing Date:</strong> {formatDate(client.closingDate)}</div>
              </div>
            </div>
            <div className="bg-[#c05e51]/10 p-4 rounded-lg border border-[#c05e51]/30">
              <h4 className="font-medium text-gray-800 mb-2">Critical Deadlines</h4>
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="size-4 mr-2" />
                <span>Current Status: {client.subStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )
      case 'closed':
        return (
          <div className="space-y-4">
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">Closed Transaction</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Property:</strong> {client.contractProperty}</div>
                <div><strong>Sale Price:</strong> {client.soldPrice}</div>
                <div><strong>Closing Date:</strong> {formatDate(client.closingDate)}</div>
                <div><strong>Status:</strong> {client.subStatus.replace('_', ' ')}</div>
              </div>
            </div>
            <div className="bg-[#A9D09E]/10 p-4 rounded-lg border border-[#A9D09E]/30">
              <h4 className="font-medium text-gray-800 mb-2">Post-Closing Tasks</h4>
              <p className="text-sm text-gray-700">
                {client.subStatus === 'post_closing_checklist' && 'Complete post-closing checklist and schedule follow-up'}
                {client.subStatus === 'nurture_campaign_active' && 'Client in nurture campaign, potential referral source'}
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
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
                <h3 className="font-medium text-gray-800 mb-2">Client Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {client.notes || 'No notes available'}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Client Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Lead Source:</strong> {client.leadSource}</div>
                  <div><strong>Priority:</strong> {client.priority}</div>
                  <div><strong>Date Added:</strong> {formatDate(client.dateAdded)}</div>
                  <div><strong>Last Contact:</strong> {formatDate(client.lastContact)}</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'details' && getStageSpecificContent()}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {getStageActions()}
        </div>
      </div>
    </div>
  )
} 