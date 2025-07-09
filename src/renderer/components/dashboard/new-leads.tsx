import { useState } from 'react'
import { X, Phone, Mail, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'

export function NewLeads() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [leads] = useState(dummyData.newLeads)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'buyer' ? 'bg-[#75BDE0] text-white' : 'bg-[#A9D09E] text-white'
  }

  const handleStartOnboarding = (leadName: string) => {
    console.log(`Starting onboarding for ${leadName}`)
    // This would normally trigger the onboarding workflow
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#3B7097] hover:bg-[#3B7097]/90 text-white font-medium py-6 relative"
        >
          New Leads
          {leads.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {leads.length}
            </span>
          )}
        </Button>
      </div>

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
              {leads.map((lead) => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{lead.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(lead.type)}`}>
                          {lead.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(lead.priority)}`}>
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
                      onClick={() => handleStartOnboarding(lead.name)}
                      className="bg-[#A9D09E] hover:bg-[#A9D09E]/90 text-white"
                    >
                      <Calendar className="size-4 mr-2" />
                      Start Onboarding
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