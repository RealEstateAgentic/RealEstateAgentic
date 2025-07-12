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
  source: string
}

export function NewLeads() {
  const [leads, setLeads] = useState<Lead[]>(dummyData.newLeads)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [processingLead, setProcessingLead] = useState<number | null>(null)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800'
      case 'seller':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLead(null)
  }

  return (
    <div className="relative">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Leads</h2>
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLead(lead)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleStartOnboarding(lead)}
                  disabled={processingLead === lead.id}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {processingLead === lead.id ? 'Processing...' : 'Start Onboarding'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for viewing lead details */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Lead Details - {selectedLead.name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.phone}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.source}</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStartOnboarding(selectedLead)}
                    disabled={processingLead === selectedLead.id}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingLead === selectedLead.id ? 'Processing...' : 'Start Onboarding'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
