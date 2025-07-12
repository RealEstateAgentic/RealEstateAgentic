/**
 * Sellers Portal V2 - Main Component
 * Implements the Kanban-style board with five stages as specified in the requirements
 */

import { useState } from 'react'
import { KanbanColumn } from './kanban-column'
import { ClientModal } from './client-modal'
import { ClientCommunicationFeed } from './client-communication-feed'
import { Button } from '../ui/button'
import { Archive, Plus, X, Upload } from 'lucide-react'
import { firebaseCollections } from '../../services/firebase/collections'

// Mock data for seller clients - following the 5 stages from requirements
const mockSellerClients = [
  {
    id: 1,
    name: 'Johnson Family',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    stage: 'new_lead',
    subStatus: 'to_initiate_contact',
    propertyAddress: '123 Oak Street, Dallas, TX 75201',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    timeline: 'Next 3 months',
    reasonForSelling: 'Upgrading to larger home',
    leadSource: 'Referral',
    priority: 'Medium',
    dateAdded: new Date().toISOString(),
    lastContact: null,
    notes: 'Family looking to upgrade due to growing needs',
  },
  {
    id: 2,
    name: 'Chen Family',
    email: 'michael.chen@email.com',
    phone: '(555) 987-6543',
    stage: 'pre_listing',
    subStatus: 'preparing_cma',
    propertyAddress: '456 Pine Avenue, Plano, TX 75023',
    propertyType: 'Townhouse',
    bedrooms: 4,
    bathrooms: 3,
    timeline: 'ASAP',
    reasonForSelling: 'Relocating for work',
    leadSource: 'Website',
    priority: 'High',
    dateAdded: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    notes: 'Urgent relocation, very motivated seller',
  },
  {
    id: 3,
    name: 'Martinez Family',
    email: 'elena.martinez@email.com',
    phone: '(555) 456-7890',
    stage: 'active_listing',
    subStatus: 'accepting_showings',
    propertyAddress: '789 Elm Drive, Richardson, TX 75081',
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    timeline: 'Next 2 months',
    reasonForSelling: 'Downsizing',
    leadSource: 'Open House',
    priority: 'Medium',
    dateAdded: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    notes: 'Empty nesters looking to downsize',
  },
  {
    id: 4,
    name: 'Williams Family',
    email: 'david.williams@email.com',
    phone: '(555) 321-0987',
    stage: 'under_contract',
    subStatus: 'awaiting_inspection',
    propertyAddress: '321 Maple Court, Garland, TX 75040',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    timeline: 'Under Contract',
    reasonForSelling: 'Moving to retirement community',
    leadSource: 'Referral',
    priority: 'High',
    dateAdded: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    notes: 'Smooth transaction, very cooperative sellers',
  },
  {
    id: 5,
    name: 'Thompson Family',
    email: 'jessica.thompson@email.com',
    phone: '(555) 654-3210',
    stage: 'closed',
    subStatus: 'post_closing_checklist',
    propertyAddress: '654 Birch Lane, Mesquite, TX 75149',
    propertyType: 'Single Family',
    bedrooms: 4,
    bathrooms: 3,
    timeline: 'Closed',
    reasonForSelling: 'Job relocation',
    leadSource: 'Social Media',
    priority: 'Low',
    dateAdded: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    notes: 'Successful closing, very satisfied clients',
  },
]

interface SellersPortalV2Props {
  navigate?: (path: string) => void
  currentUser?: any
  userType?: string
}

export function SellersPortalV2({ navigate, currentUser, userType }: SellersPortalV2Props) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [sellerClients, setSellerClients] = useState(mockSellerClients)
  const [archivedClients, setArchivedClients] = useState<any[]>([])
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [hasError, setHasError] = useState<string | null>(null)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    propertyAddress: '',
    leadSource: '',
    notes: '',
    documents: [] as File[]
  })

  // Define the 5 stages from requirements
  const kanbanStages = [
    { id: 'new_lead', title: 'New Lead', stage: 'new_lead' },
    { id: 'pre_listing', title: 'Pre-Listing', stage: 'pre_listing' },
    { id: 'active_listing', title: 'Active Listing', stage: 'active_listing' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' },
  ]

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
  }

  const handleArchive = async (client: any) => {
    try {
      // Update client as archived in Firebase
      await firebaseCollections.updateSeller(client.id, {
        isArchived: true,
        archivedDate: new Date().toISOString(),
        archivedFromStage: getStageName(client.stage)
      })

      // Remove from active clients
      const updatedSellerClients = sellerClients.filter(c => c.id !== client.id)
      setSellerClients(updatedSellerClients)

      // Add to archived clients with additional properties
      const archivedClient = {
        ...client,
        archivedDate: new Date().toISOString(),
        archivedFromStage: getStageName(client.stage),
      }
      setArchivedClients([archivedClient, ...archivedClients])

      // Close modal
      setSelectedClient(null)
    } catch (error) {
      console.error('Error archiving seller:', error)
      alert('Failed to archive client. Please try again.')
      throw error
    }
  }

  const handleProgress = async (client: any) => {
    const nextStage = getNextStage(client.stage)
    if (nextStage) {
      try {
        // Update client's stage in Firebase
        await firebaseCollections.updateSeller(client.id, { stage: nextStage })
        
        // Update local state
        const updatedSellerClients = sellerClients.map(c =>
          c.id === client.id ? { ...c, stage: nextStage } : c
        )
        setSellerClients(updatedSellerClients)

        // Update selected client to reflect changes
        setSelectedClient({ ...client, stage: nextStage })
      } catch (error) {
        console.error('Error updating seller stage:', error)
        alert('Failed to update client stage. Please try again.')
        throw error
      }
    }
  }

  const handleUnarchive = (client: any) => {
    // Remove from archived clients
    const updatedArchivedClients = archivedClients.filter(c => c.id !== client.id)
    setArchivedClients(updatedArchivedClients)

    // Add back to active clients, removing archive-specific properties
    const { archivedDate, archivedFromStage, ...activeClient } = client
    setSellerClients([...sellerClients, activeClient])

    // Close modal
    setSelectedClient(null)
  }

  const getNextStage = (currentStage: string) => {
    switch (currentStage) {
      case 'new_lead':
        return 'pre_listing'
      case 'pre_listing':
        return 'active_listing'
      case 'active_listing':
        return 'under_contract'
      case 'under_contract':
        return 'closed'
      default:
        return null
    }
  }

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new_lead':
        return 'New Lead'
      case 'pre_listing':
        return 'Pre-Listing'
      case 'active_listing':
        return 'Active Listing'
      case 'under_contract':
        return 'Under Contract'
      case 'closed':
        return 'Closed'
      default:
        return stage
    }
  }

  const handleSellerArchive = () => {
    if (navigate) {
      navigate('/sellers-archive')
    }
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
      propertyAddress: '',
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

  const handleSubmitNewLead = async () => {
    // Validate required fields
    if (!newLeadForm.name || !newLeadForm.email || !newLeadForm.phone || !newLeadForm.propertyAddress) {
      alert('Please fill in all required fields (Name, Email, Phone, Property Address)')
      return
    }

    if (!currentUser?.uid) {
      alert('Agent information is required to create a client')
      return
    }

    setIsCreating(true)
    setHasError(null)

    try {
      // Map form data to SellerData interface
      const sellerData = {
        agentId: currentUser.uid,
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        propertyAddress: newLeadForm.propertyAddress,
        leadSource: newLeadForm.leadSource || 'Manual Entry',
        notes: newLeadForm.notes || 'Manually added lead',
        stage: 'new_lead',
        subStatus: 'to_initiate_contact',
        priority: 'Medium',
        dateAdded: new Date().toISOString(),
        lastContact: null,
        isArchived: false,
        archivedDate: null,
        archivedFromStage: null,
        uploadedDocuments: newLeadForm.documents.map((file, index) => ({
          name: file.name,
          url: '', // Stub for now - will be implemented later
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString()
        }))
      }

      // Create seller in Firebase
      const createdSeller = await firebaseCollections.createSeller(sellerData)
      
      // Add to local state for immediate UI update
      const newClient = {
        ...createdSeller,
        propertyType: 'TBD',
        bedrooms: 0,
        bathrooms: 0,
        timeline: 'TBD',
        reasonForSelling: 'TBD'
      }
      
      setSellerClients(prev => [...prev, newClient as any])

      // Close modal and reset form
      handleCloseNewLeadModal()

      // Show success message
      alert(`New seller lead "${newLeadForm.name}" has been added to the New Lead column!`)
    } catch (error) {
      console.error('Error creating seller:', error)
      setHasError('Failed to create seller. Please try again.')
      throw error
    } finally {
      setIsCreating(false)
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
              Manage all seller clients through their journey from lead to closing
            </p>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-6 min-w-max">
            {kanbanStages.map(stage => (
              <KanbanColumn
                key={stage.id}
                title={stage.title}
                stage={stage.stage}
                clients={sellerClients}
                onClientClick={handleClientClick}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-6 border-l border-gray-200 flex flex-col">
          <div className="flex-1">
            {/* Add New Seller Lead Button */}
            <div className="mb-6">
              <Button
                onClick={handleNewLeadClick}
                variant="outline"
                className="w-full border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
              >
                <Plus className="size-4 mr-2" />
                Add New Seller Lead
              </Button>
            </div>

            {/* Client Communication Feed */}
            <ClientCommunicationFeed />
          </div>

          {/* Seller Archive Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSellerArchive}
              variant="outline"
              className="w-full border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
            >
              <Archive className="size-4 mr-2" />
              Seller Archive
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
          onUnarchive={handleUnarchive}
          isArchiveMode={archivedClients.some(c => c.id === selectedClient.id)}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Add New Seller Lead</h2>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.propertyAddress}
                    onChange={(e) => handleNewLeadFormChange('propertyAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
                    placeholder="Enter property address"
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
                    <option value="Zillow">Zillow</option>
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
                        Drag and drop files here, or click to select
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

                  {/* Show uploaded documents */}
                  {newLeadForm.documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newLeadForm.documents.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
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

              {/* Error Display */}
              {hasError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{hasError}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseNewLeadModal}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitNewLead}
                  className="bg-[#3B7097] hover:bg-[#3B7097]/90"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Add Lead'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 