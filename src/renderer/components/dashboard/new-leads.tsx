import { useState } from 'react'
import { X, Phone, Mail, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'
import {
  startBuyerWorkflow,
  startSellerWorkflow,
} from '../../services/automation'

// Define the Lead interface based on the dummy data structure
interface Lead {
  id: number
  name: string
  email: string
  phone: string
  type: 'buyer' | 'seller'
  priority: 'high' | 'medium' | 'low'
  source: string
}

export function NewLeads() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [leads] = useState(dummyData.newLeads as Lead[])
  const [processingLead, setProcessingLead] = useState<number | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30'
      case 'medium':
        return 'bg-[#F6E2BC]/60 text-gray-800 border border-[#F6E2BC]'
      case 'low':
        return 'bg-[#A9D09E]/20 text-gray-800 border border-[#A9D09E]/30'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'buyer'
      ? 'bg-[#75BDE0] text-white'
      : 'bg-[#A9D09E] text-white'
  }

  const handleStartOnboarding = async (lead: Lead) => {
    setProcessingLead(lead.id)
    try {
      // Get current user info - in a real app this would come from auth context
      const currentUser = { uid: 'current-agent-id' } // TODO: Get from auth context

      let result: { success: boolean; message?: string }
      if (lead.type === 'buyer') {
        result = await startBuyerWorkflow({
          agentId: currentUser.uid,
          buyerEmail: lead.email,
          buyerName: lead.name,
          buyerPhone: lead.phone,
        })
      } else {
        result = await startSellerWorkflow({
          agentId: currentUser.uid,
          sellerEmail: lead.email,
          sellerName: lead.name,
          sellerPhone: lead.phone,
          propertyAddress: '', // TODO: Get from lead data if available
        })
      }

      if (result.success) {
        alert(`Onboarding workflow started successfully for ${lead.name}! 
        
✅ Client profile created
✅ Qualification form generated  
✅ Email sent with form link
✅ Workflow tracking initiated

The client will receive an automated email with their personalized qualification form. You'll be notified when they complete it and AI analysis is ready.`)

        // In a real app, you would:
        // 1. Remove the lead from the new leads list
        // 2. Add them to the appropriate portal (buyers/sellers)
        // 3. Update the UI to reflect the change
      } else {
        throw new Error(result.message || 'Failed to start workflow')
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
      alert(
        `Failed to start onboarding for ${lead.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setProcessingLead(null)
      setIsModalOpen(false)
    }
  }

  return (
    <>
      {/* New Leads Button - designed to fit within parent container */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[#3B7097] hover:bg-[#3B7097]/90 text-white font-medium py-4 relative"
      >
        New Leads
        {leads.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {leads.length}
          </span>
        )}
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">New Leads</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {lead.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(lead.type)}`}
                        >
                          {lead.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(lead.priority)}`}
                        >
                          {lead.priority} priority
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {lead.source}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="size-4" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="size-4" />
                      {lead.email}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleStartOnboarding(lead)}
                      className="bg-[#A9D09E] hover:bg-[#A9D09E]/90 text-white"
                      disabled={processingLead === lead.id}
                    >
                      <Calendar className="size-4 mr-2" />
                      {processingLead === lead.id
                        ? 'Starting...'
                        : 'Start Onboarding'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
