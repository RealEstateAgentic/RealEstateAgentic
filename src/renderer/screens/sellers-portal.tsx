/**
 * Sellers Portal screen for managing all seller clients
 * Features a Kanban-style board with different stages
 */

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Archive, FileText, Users, DollarSign, Plus, Home } from 'lucide-react'

import type { AgentProfile, ClientProfile } from '../../shared/types'
import { NegotiationDashboard } from '../components/negotiations/NegotiationDashboard'

interface SellersPortalScreenProps {
  navigate?: (path: string) => void
  currentUser?: AgentProfile | ClientProfile | null
  userType?: 'agent' | 'buyer' | 'seller' | null
}

export function SellersPortalScreen({
  navigate,
  currentUser,
  userType,
}: SellersPortalScreenProps) {
  const [activeView, setActiveView] = useState<
    'kanban' | 'offers' | 'negotiations' | 'documents'
  >('kanban')
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  // Mock seller clients data
  const [sellerClients, setSellerClients] = useState([
    {
      id: 1,
      name: 'Johnson Family',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      stage: 'appointment_set',
      property: {
        address: '123 Oak Street',
        price: 450000,
        type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
      },
      timeline: 'Next 3 months',
      motivation: 'Upgrading to larger home',
      urgency: 'Medium',
    },
    {
      id: 2,
      name: 'Chen Family',
      email: 'michael.chen@email.com',
      phone: '(555) 987-6543',
      stage: 'listed',
      property: {
        address: '456 Pine Avenue',
        price: 675000,
        type: 'Townhouse',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2200,
      },
      timeline: 'ASAP',
      motivation: 'Relocating for work',
      urgency: 'High',
    },
    {
      id: 3,
      name: 'Martinez Family',
      email: 'elena.martinez@email.com',
      phone: '(555) 456-7890',
      stage: 'under_contract',
      property: {
        address: '789 Elm Drive',
        price: 520000,
        type: 'Condo',
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1400,
      },
      timeline: 'Next 2 months',
      motivation: 'Downsizing',
      urgency: 'Low',
    },
    {
      id: 4,
      name: 'Williams Family',
      email: 'david.williams@email.com',
      phone: '(555) 321-0987',
      stage: 'closed',
      property: {
        address: '321 Maple Court',
        price: 380000,
        type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1600,
      },
      timeline: 'Completed',
      motivation: 'Moving to retirement community',
      urgency: 'Completed',
    },
  ])

  const handleViewChange = (
    view: 'kanban' | 'offers' | 'negotiations' | 'documents'
  ) => {
    setActiveView(view)
  }

  const handleCreateOffer = () => {
    setShowOfferForm(true)
  }

  const handleOfferSuccess = (offer: any) => {
    setShowOfferForm(false)
    setSelectedOffer(offer)
  }

  const handleNegotiationSelect = (negotiation: any) => {
    // Handle negotiation selection
  }

  const handleCreateNegotiation = () => {
    // Handle creating new negotiation
  }

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
  }

  const kanbanStages = [
    {
      id: 'appointment_set',
      title: 'Appointment Set',
      stage: 'appointment_set',
    },
    { id: 'listed', title: 'Listed', stage: 'listed' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' },
  ]

  const getClientsForStage = (stage: string) => {
    return sellerClients.filter(client => client.stage === stage)
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'appointment_set':
        return 'bg-yellow-100 border-yellow-300'
      case 'listed':
        return 'bg-blue-100 border-blue-300'
      case 'under_contract':
        return 'bg-orange-100 border-orange-300'
      case 'closed':
        return 'bg-green-100 border-green-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Sellers Portal</h1>
            <p className="text-gray-600">
              Manage all seller clients through their journey from appointment
              to closing
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleViewChange('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Listing Management
              </button>
              <button
                onClick={() => handleViewChange('offers')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'offers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Counter-Offers
              </button>
              <button
                onClick={() => handleViewChange('negotiations')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'negotiations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Negotiations
              </button>
              <button
                onClick={() => handleViewChange('documents')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'documents'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Documents
              </button>
            </nav>
          </div>

          {/* Content based on active view */}
          {activeView === 'kanban' && (
            <div className="flex gap-6 min-w-max">
              {kanbanStages.map(stage => (
                <div key={stage.id} className="w-80 flex-shrink-0">
                  <div
                    className={`rounded-lg border-2 ${getStageColor(stage.stage)} p-4`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">
                        {stage.title}
                      </h3>
                      <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm">
                        {getClientsForStage(stage.stage).length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {getClientsForStage(stage.stage).map(client => (
                        <button
                          key={client.id}
                          className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow w-full text-left"
                          onClick={() => handleClientClick(client)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">
                              {client.name}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(client.urgency)}`}
                            >
                              {client.urgency}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {client.property.address}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            ${client.property.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {client.property.bedrooms}bd •{' '}
                            {client.property.bathrooms}ba •{' '}
                            {client.property.sqft} sqft
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeView === 'offers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Seller Counter-Offers</h2>
                <Button
                  onClick={handleCreateOffer}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Counter-Offer
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">
                  No counter-offers yet. Create your first counter-offer to get
                  started.
                </p>
              </div>
            </div>
          )}

          {activeView === 'negotiations' && currentUser && (
            <NegotiationDashboard
              userProfile={currentUser}
              userType={userType === 'agent' ? 'agent' : 'client'}
              onNegotiationSelect={handleNegotiationSelect}
              onCreateNegotiation={handleCreateNegotiation}
            />
          )}

          {activeView === 'documents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Document Generation</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">
                  Document generation requires both agent and client profiles.
                  Please select a client from the Listing Management board
                  first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 border-l border-gray-200 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Johnson Family</p>
                <p>Appointment scheduled for tomorrow</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Chen Family</p>
                <p>Property listed successfully</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Martinez Family</p>
                <p>Offer accepted, going under contract</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{selectedClient.name}</h2>
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">
                      Contact Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedClient.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedClient.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">
                      Timeline & Motivation
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedClient.timeline}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedClient.motivation}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Property Details
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">
                      {selectedClient.property.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedClient.property.type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedClient.property.bedrooms} bed •{' '}
                      {selectedClient.property.bathrooms} bath •{' '}
                      {selectedClient.property.sqft} sqft
                    </p>
                    <p className="text-lg font-semibold text-green-600 mt-2">
                      ${selectedClient.property.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter-Offer Form Modal */}
      {showOfferForm && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Create Seller Counter-Offer
              </h2>
              <div className="text-gray-600 mb-4">
                <p>
                  Create a counter-offer for a seller client. This will
                  integrate with the completed offer management system.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowOfferForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleOfferSuccess({ id: Date.now(), type: 'seller' })
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Counter-Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
