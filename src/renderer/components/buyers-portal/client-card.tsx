import {
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Send,
  Loader2,
  FileText,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { gmailAuth } from '../../services/gmail-auth'
import { DocumentGenerator } from '../documents/DocumentGenerator'
import type { AgentProfile } from '../../../shared/types'

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
    favoritedProperties?: string[]
    viewedProperties?: string[]
    contractProperty?: string
    contractDate?: string
    closingDate?: string
    soldPrice?: string
  }
  onClick: () => void
  navigate?: (path: string) => void
  isDragging?: boolean
}

export function ClientCard({
  client,
  onClick,
  navigate,
  isDragging = false,
}: ClientCardProps) {
  const [isSending, setIsSending] = useState(false)
  const [isGmailConnected, setIsGmailConnected] = useState(
    gmailAuth.isAuthenticated()
  )
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)

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
      setIsSending(false)
    }
  }

  const handleGenerateDocuments = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDocumentGenerator(true)
  }

  const handleDocumentGenerated = (result: any) => {
    console.log('Document generated:', result)
    setShowDocumentGenerator(false)
  }

  const handleCancelDocumentGeneration = () => {
    setShowDocumentGenerator(false)
  }

  const handleRepairEstimator = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigate) {
      navigate('/repair-estimator')
    }
  }

  const createAgentProfileAdapter = (): any => {
    return {
      id: 'agent-1',
      name: 'Real Estate Agent',
      email: 'agent@example.com',
      phone: '(555) 123-4567',
      personalInfo: {
        firstName: 'Real Estate',
        lastName: 'Agent',
        phone: '(555) 123-4567',
      },
      licenseInfo: {
        brokerageName: 'Sample Brokerage',
        yearsExperience: 5,
      },
    }
  }

  const createClientProfile = () => {
    const nameParts = client.name.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Name'

    return {
      id: client.id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      clientType: 'buyer' as const,
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
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
  }

  return (
    <>
      <div
        onClick={onClick}
        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? 'opacity-50 rotate-2' : ''
        }`}
      >
        {/* Client Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-800">{client.name}</h4>
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

        {/* Generate Documents Button for Active Search */}
        {client.stage === 'active_search' && (
          <div className="mb-3">
            <button
              onClick={handleGenerateDocuments}
              className="flex items-center gap-2 px-3 py-2 bg-[#3B7097] hover:bg-[#3B7097]/90 text-white text-sm rounded-md transition-colors w-full"
            >
              <FileText className="size-4" />
              Generate Documents
            </button>
          </div>
        )}

        {/* Repair Estimator Button for Under Contract */}
        {client.stage === 'under_contract' && (
          <div className="mb-3">
            <button
              onClick={handleRepairEstimator}
              className="flex items-center gap-2 px-3 py-2 bg-[#3B7097] hover:bg-[#3B7097]/90 text-white text-sm rounded-md transition-colors w-full"
            >
              <FileText className="size-4" />
              Repair Estimator
            </button>
          </div>
        )}

        {/* Property Search Information */}
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

        {/* Lead Source */}
        <div className="space-y-1 mb-3">
          <div className="text-xs text-gray-500">
            Source: {client.leadSource}
          </div>
        </div>

        {/* Contract Property (if applicable) */}
        {client.contractProperty && (
          <div className="mt-2 p-2 bg-[#75BDE0]/10 rounded text-xs">
            <span className="font-medium text-[#3B7097]">Contract:</span>
            <span className="text-[#3B7097] ml-1">
              {client.contractProperty}
            </span>
          </div>
        )}

        {/* Contact Information */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <a
              href={`tel:${client.phone}`}
              onClick={e => e.stopPropagation()}
              className="text-gray-400 hover:text-[#3B7097] transition-colors"
            >
              <Phone className="size-4" />
            </a>
            <a
              href={`mailto:${client.email}`}
              onClick={e => e.stopPropagation()}
              className="text-gray-400 hover:text-[#3B7097] transition-colors"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Document Generator Modal */}
      {showDocumentGenerator && (
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
    </>
  )
}
