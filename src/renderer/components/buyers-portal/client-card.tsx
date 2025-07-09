import { Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react'

interface ClientCardProps {
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
    closingDate?: string
    soldPrice?: string
  }
  onClick: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-[#3B7097] bg-[#3B7097]/10'
      case 'high': return 'border-[#75BDE0] bg-[#75BDE0]/10'
      case 'medium': return 'border-[#A9D09E] bg-[#A9D09E]/10'
      case 'low': return 'border-[#F6E2BC] bg-[#F6E2BC]/20'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getSubStatusColor = (subStatus: string) => {
    switch (subStatus) {
      case 'to_initiate_contact': return 'bg-[#3B7097]/20 text-[#3B7097]'
      case 'awaiting_survey': return 'bg-[#F6E2BC]/60 text-gray-800'
      case 'review_survey': return 'bg-[#75BDE0]/20 text-[#75BDE0]'
      case 'scheduling_showings': return 'bg-[#A9D09E]/20 text-[#A9D09E]'
      case 'needs_new_listings': return 'bg-[#F6E2BC]/60 text-gray-800'
      case 'preparing_offer': return 'bg-[#A9D09E]/20 text-[#A9D09E]'
      case 'inspection_period': return 'bg-[#3B7097]/20 text-[#3B7097]'
      case 'awaiting_appraisal': return 'bg-[#75BDE0]/20 text-[#75BDE0]'
      case 'financing_contingency': return 'bg-[#A9D09E]/20 text-[#A9D09E]'
      case 'negotiating_repairs': return 'bg-[#F6E2BC]/60 text-gray-800'
      case 'post_closing_checklist': return 'bg-[#A9D09E]/20 text-[#A9D09E]'
      case 'nurture_campaign_active': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSubStatus = (subStatus: string) => {
    return subStatus.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(client.priority)}`}
    >
      {/* Client Name and Status */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">{client.name}</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getSubStatusColor(client.subStatus)}`}>
          {formatSubStatus(client.subStatus)}
        </span>
      </div>

      {/* Budget and Location */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="size-3 mr-1" />
          {client.budget}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="size-3 mr-1" />
          {client.location}
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center">
          <Phone className="size-3 mr-1" />
          {client.phone}
        </div>
        <div className="flex items-center">
          <Mail className="size-3 mr-1" />
          {client.email.split('@')[0]}
        </div>
      </div>

      {/* Last Contact */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="size-3 mr-1" />
          Last: {formatDate(client.lastContact)}
        </div>
        <div className="text-xs text-gray-400">
          {client.leadSource}
        </div>
      </div>

      {/* Contract Property (if applicable) */}
      {client.contractProperty && (
        <div className="mt-2 p-2 bg-[#75BDE0]/10 rounded text-xs">
          <span className="font-medium text-[#3B7097]">Contract:</span>
          <span className="text-[#3B7097] ml-1">{client.contractProperty}</span>
        </div>
      )}

      {/* Notes preview */}
      {client.notes && (
        <div className="mt-2 text-xs text-gray-600 line-clamp-2">
          {client.notes}
        </div>
      )}
    </div>
  )
} 