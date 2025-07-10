/**
 * Sellers Archive Screen
 * Displays archived seller clients and allows unarchiving
 */

import { useState } from 'react'
import { ClientModal } from '../components/sellers-portal-v2/client-modal'
import { Button } from '../components/ui/button'
import { ArrowLeft, Calendar, MapPin, Phone, Mail, RotateCcw } from 'lucide-react'
import type { AgentProfile, ClientProfile } from '../../shared/types'

interface SellersArchiveScreenProps {
  navigate?: (path: string) => void
  currentUser?: AgentProfile | ClientProfile | null
  userType?: 'agent' | 'buyer' | 'seller' | null
}

export function SellersArchiveScreen({
  navigate,
  currentUser,
  userType,
}: SellersArchiveScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [archivedClients, setArchivedClients] = useState([
    {
      id: 101,
      name: 'Davis Family',
      email: 'jennifer.davis@email.com',
      phone: '(555) 111-2222',
      stage: 'new_lead',
      subStatus: 'to_initiate_contact',
      propertyAddress: '555 Cherry Lane, Irving, TX 75061',
      propertyType: 'Single Family',
      bedrooms: 4,
      bathrooms: 3,
      timeline: 'Next 6 months',
      reasonForSelling: 'Upgrading',
      leadSource: 'Referral',
      priority: 'Low',
      dateAdded: '2024-01-15T10:00:00Z',
      lastContact: null,
      notes: 'Not ready to sell yet, follow up in 3 months',
      archivedDate: '2024-01-20T14:30:00Z',
      archivedFromStage: 'New Lead',
    },
    {
      id: 102,
      name: 'Rodriguez Family',
      email: 'carlos.rodriguez@email.com',
      phone: '(555) 333-4444',
      stage: 'pre_listing',
      subStatus: 'preparing_cma',
      propertyAddress: '777 Sunset Boulevard, Grand Prairie, TX 75050',
      propertyType: 'Townhouse',
      bedrooms: 3,
      bathrooms: 2,
      timeline: 'Undecided',
      reasonForSelling: 'Job relocation',
      leadSource: 'Website',
      priority: 'Medium',
      dateAdded: '2024-01-10T09:00:00Z',
      lastContact: '2024-01-12T16:00:00Z',
      notes: 'Job relocation fell through, no longer selling',
      archivedDate: '2024-01-18T11:15:00Z',
      archivedFromStage: 'Pre-Listing',
    },
  ])

  const handleBackToPortal = () => {
    if (navigate) {
      navigate('/sellers-portal')
    }
  }

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

    // Close modal
    setSelectedClient(null)

    // In a real app, you would also add this client back to the main portal
    // For now, we'll just show a success message
    alert(`${client.name} has been unarchived and returned to the main portal`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToPortal}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="size-4" />
                <span>Back to Sellers Portal</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Seller Archive</h1>
                <p className="text-gray-600">
                  Manage archived seller clients • {archivedClients.length} total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {archivedClients.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-gray-400 mb-4">
                  <svg className="size-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Archived Clients</h3>
                <p className="text-gray-600">
                  Archived seller clients will appear here. Use the Archive button in client modals to archive clients.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {client.archivedFromStage}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="size-4" />
                          <span>{client.propertyAddress}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="size-4" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="size-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="size-4" />
                          <span>Archived: {formatDate(client.archivedDate)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <strong>Reason for Selling:</strong> {client.reasonForSelling}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Timeline:</strong> {client.timeline}
                      </div>
                      {client.notes && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {client.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnarchive(client)
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <RotateCcw className="size-4 mr-2" />
                        Unarchive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={handleCloseModal}
          onUnarchive={handleUnarchive}
          isArchiveMode={true}
        />
      )}
    </div>
  )
} 