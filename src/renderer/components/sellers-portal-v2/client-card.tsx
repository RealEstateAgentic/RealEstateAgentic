/**
 * Client Card Component for Sellers Portal V2
 * Displays individual client information within kanban columns
 */

import { 
  MapPin, 
  Phone, 
  Mail, 
  Home, 
  Calendar, 
  Send, 
  Loader2, 
  FileText 
} from 'lucide-react'
import { useState } from 'react'
import { gmailAuth } from '../../services/gmail-auth'
import { DocumentGenerator } from '../documents/DocumentGenerator'

interface ClientCardProps {
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
      const { startSellerWorkflowWithGmail } = await import(
        '../../services/automation'
      )

      const result = await startSellerWorkflowWithGmail({
        agentId: 'agent-1', // TODO: Get actual agent ID
        sellerEmail: client.email,
        sellerName: client.name,
        sellerPhone: client.phone,
        propertyAddress: client.propertyAddress,
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
    // This would be properly implemented with current user data
    return {
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

  const createClientProfile = () => {
    const nameParts = client.name.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Name'

    return {
      firstName,
      lastName,
      email: client.email,
      phone: client.phone,
      address: client.propertyAddress,
      propertyType: client.propertyType,
      bedrooms: client.bedrooms,
      bathrooms: client.bathrooms,
      timeline: client.timeline,
      reasonForSelling: client.reasonForSelling,
      leadSource: client.leadSource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

        {/* Send Survey Button for New Lead */}
        {client.stage === 'new_lead' && (
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

        {/* Generate Documents Button for Pre-listing and Active Listing */}
        {(client.stage === 'pre_listing' || client.stage === 'active_listing') && (
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

        {/* Property Information */}
        <div className="space-y-2 mb-3">
          <div className="flex items-start space-x-2">
            <MapPin className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-tight">
              {client.propertyAddress}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Home className="size-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {client.propertyType}
              {client.bedrooms > 0 && client.bathrooms > 0 && (
                <span className="ml-1">
                  • {client.bedrooms}bd/{client.bathrooms}ba
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Timeline & Motivation */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="size-4 text-gray-500" />
            <span className="text-sm text-gray-600">{client.timeline}</span>
          </div>
          <div className="text-xs text-gray-500">{client.reasonForSelling}</div>
        </div>

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
        <DocumentGenerator
          isOpen={showDocumentGenerator}
          onClose={handleCancelDocumentGeneration}
          onDocumentGenerated={handleDocumentGenerated}
          agentProfile={createAgentProfileAdapter()}
          clientProfile={createClientProfile()}
        />
      )}
    </>
  )
}
