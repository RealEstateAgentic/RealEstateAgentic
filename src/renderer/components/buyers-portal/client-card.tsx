import { Phone, Mail, MapPin, Calendar, DollarSign, Send, Loader2, Shield, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { gmailAuth } from '../../services/gmail-auth'
import { dummyData } from '../../data/dummy-data'

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
  const [isSending, setIsSending] = useState(false)
  const [isGmailConnected, setIsGmailConnected] = useState(gmailAuth.isAuthenticated())
  

  const handleSendSurvey = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    
    if (isSending) return // Prevent multiple clicks
    
    setIsSending(true)
    
    try {
      console.log('Sending survey to:', client.name, client.email)
      
      // Check if Gmail is authenticated
      if (!gmailAuth.isAuthenticated()) {
        console.log('🔑 Gmail not authenticated, starting OAuth flow...')
        
        const authResult = await gmailAuth.authenticate()
        
        if (!authResult.success) {
          throw new Error(`Gmail authentication failed: ${authResult.error}`)
        }
        
        setIsGmailConnected(true)
        console.log('✅ Gmail authenticated:', authResult.userEmail)
      }
      
      // Import and use the automation service with Gmail API
      const { startBuyerWorkflowWithGmail } = await import('../../services/automation')
      
      const result = await startBuyerWorkflowWithGmail({
        agentId: 'agent-1', // TODO: Get actual agent ID
        buyerEmail: client.email,
        buyerName: client.name,
        buyerPhone: client.phone,
        senderEmail: gmailAuth.getUserEmail() || undefined
      })
      
      if (result.success) {
        alert(`✅ Survey sent successfully to ${client.name} from your Gmail account!\n\nForm URL: ${result.formUrl}`)
        console.log('Survey sent successfully:', result)
      } else {
        throw new Error('Failed to send survey')
      }
    } catch (error: unknown) {
      console.error('Error sending survey:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`❌ Failed to send survey to ${client.name}.\n\nError: ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  // Get next event for this client
  const getNextEvent = () => {
    const clientEvents = dummyData.calendarEvents.filter((event: any) => 
      event.clientType === 'buyer' && event.clientId === client.id.toString()
    )
    const today = new Date()
    const upcomingEvents = clientEvents.filter((event: any) => {
      const eventDate = new Date(event.date)
      return eventDate >= today
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return upcomingEvents.length > 0 ? upcomingEvents[0] : null
  }

  const nextEvent = getNextEvent()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-[#c05e51] bg-[#c05e51]/10'
      case 'high': return 'border-[#c05e51] bg-[#c05e51]/10'
      case 'medium': return 'border-[#F6E2BC] bg-[#F6E2BC]/40'
      case 'low': return 'border-[#A9D09E] bg-[#A9D09E]/10'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getSubStatusColor = (subStatus: string) => {
    switch (subStatus) {
      case 'to_initiate_contact': return 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30'
      case 'awaiting_survey': return 'bg-[#F6E2BC]/60 text-gray-800 border border-[#F6E2BC]'
      case 'review_survey': return 'bg-[#75BDE0]/20 text-gray-800 border border-[#75BDE0]/30'
      case 'scheduling_showings': return 'bg-[#A9D09E]/20 text-gray-800 border border-[#A9D09E]/30'
      case 'needs_new_listings': return 'bg-[#F6E2BC]/60 text-gray-800 border border-[#F6E2BC]'
      case 'preparing_offer': return 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30'
      case 'inspection_period': return 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30'
      case 'awaiting_appraisal': return 'bg-[#75BDE0]/20 text-gray-800 border border-[#75BDE0]/30'
      case 'financing_contingency': return 'bg-[#F6E2BC]/60 text-gray-800 border border-[#F6E2BC]'
      case 'negotiating_repairs': return 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30'
      case 'post_closing_checklist': return 'bg-[#A9D09E]/20 text-gray-800 border border-[#A9D09E]/30'
      case 'nurture_campaign_active': return 'bg-[#A9D09E]/20 text-gray-800 border border-[#A9D09E]/30'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
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

      {/* Send Survey Button for New Leads */}
      {client.stage === 'new_leads' && (
        <div className="mb-3 space-y-2">
          <button
            onClick={handleSendSurvey}
            disabled={isSending}
            className="flex items-center gap-2 px-3 py-2 bg-[#3B7097] hover:bg-[#3B7097]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isGmailConnected ? 'Sending...' : 'Connecting Gmail...'}
              </>
            ) : (
              <>
                {isGmailConnected ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <Shield className="size-4" />
                )}
                Send Survey {isGmailConnected ? 'via Gmail' : '(Connect Gmail)'}
              </>
            )}
          </button>
          
          {isGmailConnected && gmailAuth.getUserEmail() && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Mail className="size-3" />
              Connected: {gmailAuth.getUserEmail()}
            </div>
          )}
        </div>
      )}

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
      <div className="space-y-1 mb-3 text-xs text-gray-500">
        <div className="flex items-center">
          <Phone className="size-3 mr-1" />
          {client.phone}
        </div>
        <div className="flex items-center">
          <Mail className="size-3 mr-1" />
          {client.email.split('@')[0]}
        </div>
      </div>

      {/* Date Added and Lead Source */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="size-3 mr-1" />
          Added: {formatDate(client.dateAdded)}
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

      {/* Next Event */}
      {nextEvent && (
        <div className="text-xs text-gray-500 pt-1">
          <div className="flex items-center space-x-1">
            <Calendar className="size-3" />
            <span>Next: {nextEvent.title}</span>
          </div>
          <div className="text-xs text-gray-400 ml-4">
            {new Date(nextEvent.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} at {nextEvent.time}
          </div>
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