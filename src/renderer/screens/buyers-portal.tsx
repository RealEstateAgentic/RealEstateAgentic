/**
 * Buyers Portal screen for managing all buyer clients
 * Features a Kanban-style board with different stages
 */

import { useState } from 'react'
import { KanbanColumn } from '../components/buyers-portal/kanban-column'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { ClientCommunicationFeed } from '../components/buyers-portal/client-communication-feed'
import { Button } from '../components/ui/button'
import { Archive, FileText, Users, DollarSign, Plus, X, Upload } from 'lucide-react'
import { dummyData } from '../data/dummy-data'

import type { AgentProfile, ClientProfile } from '../../shared/types'
import { OfferForm } from '../components/offers/OfferForm'
import { NegotiationDashboard } from '../components/negotiations/NegotiationDashboard'
import { DocumentGenerator } from '../components/documents/DocumentGenerator'

interface BuyersPortalScreenProps {
  navigate?: (path: string) => void
  currentUser?: AgentProfile | ClientProfile | null
  userType?: 'agent' | 'buyer' | 'seller' | null
}

export function BuyersPortalScreen({
  navigate,
  currentUser,
  userType,
}: BuyersPortalScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [buyerClients, setBuyerClients] = useState(dummyData.buyerClients)
  const [archivedClients, setArchivedClients] = useState(
    dummyData.archivedBuyerClients
  )
  const [activeView, setActiveView] = useState<
    'kanban' | 'offers' | 'negotiations' | 'documents'
  >('kanban')
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    leadSource: '',
    notes: '',
    documents: [] as File[]
  })

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
  }

  const handleArchive = (client: any) => {
    // Remove from active clients
    const updatedBuyerClients = buyerClients.filter(c => c.id !== client.id)
    setBuyerClients(updatedBuyerClients)

    // Add to archived clients with additional properties
    const archivedClient = {
      ...client,
      archivedDate: new Date().toISOString(),
      archivedFromStage: getStageName(client.stage),
    }
    setArchivedClients([archivedClient, ...archivedClients])

    // Close modal
    setSelectedClient(null)
  }

  const handleProgress = (client: any) => {
    const nextStage = getNextStage(client.stage)
    if (nextStage) {
      // Update client's stage
      const updatedBuyerClients = buyerClients.map(c =>
        c.id === client.id ? { ...c, stage: nextStage } : c
      )
      setBuyerClients(updatedBuyerClients)

      // Update selected client to reflect changes
      setSelectedClient({ ...client, stage: nextStage })
    }
  }

  const getNextStage = (currentStage: string) => {
    switch (currentStage) {
      case 'new_leads':
        return 'active_search'
      case 'active_search':
        return 'under_contract'
      case 'under_contract':
        return 'closed'
      default:
        return null
    }
  }

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new_leads':
        return 'New Leads'
      case 'active_search':
        return 'Active Search'
      case 'under_contract':
        return 'Under Contract'
      case 'closed':
        return 'Closed'
      default:
        return stage
    }
  }

  const handleBuyerArchive = () => {
    if (navigate) {
      navigate('/buyers-archive')
    }
  }

  const handleCreateOffer = () => {
    setShowOfferForm(true)
  }

  const handleOfferSuccess = (offer: any) => {
    setShowOfferForm(false)
    setSelectedOffer(offer)
    // In a real app, you'd refresh the offers list
  }

  const handleViewChange = (
    view: 'kanban' | 'offers' | 'negotiations' | 'documents'
  ) => {
    setActiveView(view)
  }

  const handleNegotiationSelect = (negotiation: any) => {
    // Handle negotiation selection
  }

  const handleCreateNegotiation = () => {
    // Handle creating new negotiation
  }

  const handleNewLeadClick = () => {
    setShowNewLeadModal(true)
  }

  const handleCloseNewLeadModal = () => {
    setShowNewLeadModal(false)
    setNewLeadForm({
      name: '',
      email: '',
      phone: '',
      leadSource: '',
      notes: '',
      documents: []
    })
  }

  const handleNewLeadFormChange = (field: string, value: string) => {
    setNewLeadForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setNewLeadForm(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(files)]
      }))
    }
  }

  const handleRemoveDocument = (index: number) => {
    setNewLeadForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const handleSubmitNewLead = () => {
    // Validate required fields
    if (!newLeadForm.name || !newLeadForm.email || !newLeadForm.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)')
      return
    }

    // Generate new client ID
    const newClientId = Math.max(...buyerClients.map(c => c.id)) + 1

    // Create new client object
    const newClient = {
      id: newClientId,
      name: newLeadForm.name,
      email: newLeadForm.email,
      phone: newLeadForm.phone,
      stage: 'new_leads',
      subStatus: 'to_initiate_contact',
      budget: 'TBD',
      location: 'TBD',
      leadSource: newLeadForm.leadSource || 'Manual Entry',
      priority: 'Medium',
      dateAdded: new Date().toISOString(),
      lastContact: null,
      notes: newLeadForm.notes || 'Manually added lead',
      favoritedProperties: [],
      viewedProperties: [],
      // Documents would be stored in the Content tab in a real application
      uploadedDocuments: newLeadForm.documents.map((file, index) => ({
        id: index + 1,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
      }))
    }

    // Add to buyer clients
    setBuyerClients(prev => [...prev, newClient])

    // Close modal and reset form
    handleCloseNewLeadModal()

    // Show success message
    alert(`New lead "${newLeadForm.name}" has been added to the New Leads column!`)
  }

  const kanbanStages = [
    { id: 'new_leads', title: 'New Leads', stage: 'new_leads' },
    { id: 'active_search', title: 'Active Search', stage: 'active_search' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' },
  ]

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buyers Portal</h1>
            <p className="text-gray-600">
              Manage all buyer clients through their journey
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
                <Users className="w-4 h-4 inline mr-2" />
                Client Management
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
                Offers
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
                <KanbanColumn
                  key={stage.id}
                  title={stage.title}
                  stage={stage.stage}
                  clients={buyerClients}
                  onClientClick={handleClientClick}
                />
              ))}
            </div>
          )}

          {activeView === 'offers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Buyer Offers</h2>
                <Button
                  onClick={handleCreateOffer}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Offer
                </Button>
              </div>

              {/* Offers list would go here */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">
                  No offers yet. Create your first offer to get started.
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

          {activeView === 'documents' && currentUser && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Document Generation</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">
                  Document generation requires both agent and client profiles.
                  Please select a client from the Kanban board first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 border-l border-gray-200 flex flex-col">
          <div className="flex-1">
            {/* Add New Buyer Lead Button */}
            <div className="mb-6">
              <Button
                onClick={handleNewLeadClick}
                variant="outline"
                className="w-full border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
              >
                <Plus className="size-4 mr-2" />
                Add New Buyer Lead
              </Button>
            </div>

            <ClientCommunicationFeed />
          </div>

          {/* Buyer Archive Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleBuyerArchive}
              variant="outline"
              className="w-full border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
            >
              <Archive className="size-4 mr-2" />
              Buyer Archive
            </Button>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={handleCloseModal}
          onArchive={handleArchive}
          onProgress={handleProgress}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Add New Buyer Lead</h2>
                <button
                  onClick={handleCloseNewLeadModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.name}
                    onChange={(e) => handleNewLeadFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => handleNewLeadFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newLeadForm.phone}
                    onChange={(e) => handleNewLeadFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newLeadForm.leadSource}
                    onChange={(e) => handleNewLeadFormChange('leadSource', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                  >
                    <option value="">Select lead source</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Open House">Open House</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newLeadForm.notes}
                    onChange={(e) => handleNewLeadFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                    placeholder="Add any additional notes about this lead..."
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop files here, or click to browse
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer bg-[#3B7097] text-white px-4 py-2 rounded-md text-sm hover:bg-[#3B7097]/90"
                      >
                        Choose Files
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {newLeadForm.documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newLeadForm.documents.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            onClick={() => handleRemoveDocument(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleCloseNewLeadModal}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitNewLead}
                  className="bg-[#3B7097] hover:bg-[#3B7097]/90"
                >
                  Add Lead
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Form Modal */}
      {showOfferForm && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create Buyer Offer</h2>
              <div className="text-gray-600 mb-4">
                <p>
                  Create a new offer for a buyer client. This will integrate
                  with the completed offer management system.
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
                    // Simulate offer creation
                    handleOfferSuccess({ id: Date.now(), type: 'buyer' })
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
