import { Phone, Mail, MapPin, Calendar, DollarSign, Send, Loader2, Shield, ShieldCheck, Home, AlertCircle } from 'lucide-react'
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
    } catch (error) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  // Updated priority color function to match seller cards
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-[#c05e51]/10 text-[#c05e51] border border-[#c05e51]/20'
      case 'Medium':
        return 'bg-[#F6E2BC]/30 text-[#8B7355] border border-[#F6E2BC]/50'
      case 'Low':
        return 'bg-[#A9D09E]/20 text-[#5a7c50] border border-[#A9D09E]/40'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Client Header - matches seller card structure */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold text-gray-800">{client.name}</h4>
          {client.priority === 'High' && (
            <AlertCircle className="size-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
            {client.priority}
          </span>
        </div>
      </div>

      {/* Send Survey Button for New Leads */}
      {client.stage === 'new_leads' && (
        <div className="mb-3">
          <button
            onClick={handleSendSurvey}
            disabled={isSending}
            className="flex items-center gap-2 px-3 py-2 bg-[#3B7097] hover:bg-[#3B7097]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send Survey
              </>
            )}
          </button>
        </div>
      )}

      {/* Property Search Information - analogous to seller property info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2">
          <DollarSign className="size-4 text-gray-500" />
          <span className="text-sm text-gray-700">{client.budget}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="size-4 text-gray-500" />
          <span className="text-sm text-gray-700">{client.location}</span>
        </div>
      </div>

      {/* Timeline & Lead Source */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="size-4 text-gray-500" />
          <span className="text-sm text-gray-600">Added: {formatDate(client.dateAdded)}</span>
        </div>
        <div className="text-xs text-gray-500">
          Source: {client.leadSource}
        </div>
      </div>

      {/* Next Event - replaces Last Contact */}
      {nextEvent && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="size-4 text-gray-500" />
            <span className="text-sm text-gray-600">Next: {nextEvent.title}</span>
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(nextEvent.date)} at {nextEvent.time}
          </div>
        </div>
      )}

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