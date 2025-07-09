/**
 * Buyer Archive screen for managing archived buyer clients
 * Features a list view with unarchive functionality
 */

import { useState } from 'react'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { Button } from '../components/ui/button'
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, RotateCcw } from 'lucide-react'
import { dummyData } from '../data/dummy-data'

interface BuyersArchiveScreenProps {
  navigate?: (path: string) => void
}

export function BuyersArchiveScreen({ navigate }: BuyersArchiveScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [archivedClients, setArchivedClients] = useState(dummyData.archivedBuyerClients)

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
  }

  const handleUnarchive = (client: any) => {
    // Remove from archived clients
    const updatedArchivedClients = archivedClients.filter(c => c.id !== client.id)
    setArchivedClients(updatedArchivedClients)
    
    // Close modal first
    setSelectedClient(null)
    
    // Remove archive-specific properties
    const { archivedDate, archivedFromStage, ...restoredClient } = client
    
    // In a real implementation, you would restore to the main buyerClients array
    // For demo purposes, we'll just log the action
    console.log('Unarchiving client:', restoredClient, 'back to stage:', client.archivedFromStage)
  }

  const handleBack = () => {
    if (navigate) {
      navigate('/buyers-portal')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Sort archived clients by archived date (most recent first)
  const sortedArchivedClients = archivedClients.sort((a, b) => 
    new Date(b.archivedDate).getTime() - new Date(a.archivedDate).getTime()
  )

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Back to Buyers Portal
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Buyer Archive</h1>
          <p className="text-gray-600">Manage archived buyer clients</p>
        </div>

        {/* Archived Clients List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Archived Clients ({sortedArchivedClients.length})
            </h2>
            
            {sortedArchivedClients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No archived clients</p>
                <p className="text-sm">Archived clients will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedArchivedClients.map((client) => (
                  <div
                    key={client.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{client.name}</h3>
                        <span className="px-2 py-1 bg-[#c05e51]/10 text-[#c05e51] rounded text-xs font-medium">
                          Archived from: {client.archivedFromStage}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="size-3 mr-1" />
                          {client.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="size-3 mr-1" />
                          {client.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="size-3 mr-1" />
                          {client.budget}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="size-3 mr-1" />
                          {client.location}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Archived on: {formatDate(client.archivedDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={handleCloseModal}
          isArchiveMode={true}
          onUnarchive={handleUnarchive}
        />
      )}
    </div>
  )
} 