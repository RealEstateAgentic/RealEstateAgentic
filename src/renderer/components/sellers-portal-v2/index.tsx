/**
 * Sellers Portal V2 - Main Component
 * Implements the Kanban-style board with five stages as specified in the requirements
 */

import { useState, useEffect } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { ClientModal } from './client-modal'
import { ClientCard } from './client-card'
import { ClientCommunicationFeed } from './client-communication-feed'
import { Button } from '../ui/button'
import { Archive, Plus, X, Upload } from 'lucide-react'
import { firebaseCollections } from '../../services/firebase/collections'
import { uploadClientDocuments } from '../../../lib/firebase/storage'

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

/**
 * Get the next stage in the seller workflow
 */
function getNextStage(currentStage: string): string | null {
  switch (currentStage) {
    case 'new_lead':
      return 'pre_listing'
    case 'pre_listing':
      return 'active_listing'
    case 'active_listing':
      return 'under_contract'
    case 'under_contract':
      return 'closed'
    case 'closed':
      return null
    default:
      return null
  }
}

/**
 * Get default sub-status for a given stage
 */
function getDefaultSubStatus(stage: string): string {
  switch (stage) {
    case 'new_lead':
      return 'to_initiate_contact'
    case 'pre_listing':
      return 'preparing_cma'
    case 'active_listing':
      return 'accepting_showings'
    case 'under_contract':
      return 'awaiting_inspection'
    case 'closed':
      return 'post_closing_checklist'
    default:
      return 'unknown'
  }
}

export function SellersPortalV2({
  navigate,
  currentUser,
  userType,
}: SellersPortalV2Props) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [sellerClients, setSellerClients] = useState<any[]>([])
  const [archivedClients, setArchivedClients] = useState<any[]>([])
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    propertyAddress: '',
    leadSource: '',
    priority: 'Medium',
    notes: '',
    documents: [] as File[],
  })

  // Set up real-time listener for seller clients
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false)
      return
    }

    console.log('Setting up real-time listener for sellers')
    const unsubscribe = firebaseCollections.getSellersRealTime(
      currentUser.uid,
      sellers => {
        console.log('Received real-time sellers update:', sellers.length)
        setSellerClients(sellers)
        setIsLoading(false)
        setHasError(null)
      },
      error => {
        console.error('Real-time sellers error:', error)
        setHasError('Failed to load sellers—please refresh')
        setIsLoading(false)
      }
    )

    return () => {
      console.log('Cleaning up sellers real-time listener')
      unsubscribe()
    }
  }, [currentUser?.uid])

  // Handle URL parameters for direct client access and new lead action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clientId = params.get('clientId')
    const tab = params.get('tab')
    const documentId = params.get('documentId')
    const action = params.get('action')

    if (clientId) {
      const client = sellerClients.find(c => c.id === Number.parseInt(clientId))
      if (client) {
        setSelectedClient({
          ...client,
          initialTab: tab,
          initialDocumentId: documentId,
        })
      }
    }

    // Handle new lead action from dashboard
    if (action === 'newLead') {
      setShowNewLeadModal(true)
      // Clear the URL parameter to avoid reopening modal on refresh
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [sellerClients])

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

  const handleNewLeadClick = () => {
    setShowNewLeadModal(true)
  }

  const handleSellerArchive = () => {
    if (navigate) {
      navigate('/sellers-archive')
    }
  }

  const handleArchive = async (client: any) => {
    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      return
    }

    try {
      await firebaseCollections.archiveSeller(client.id, client.stage)
    } catch (error) {
      console.error('Error archiving client:', error)
      setHasError('Failed to archive client. Please try again.')
    }
    setSelectedClient(null)
  }

  const handleProgress = async (client: any) => {
    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      return
    }

    try {
      const nextStage = getNextStage(client.stage)
      if (nextStage) {
        await firebaseCollections.updateSeller(client.id, {
          stage: nextStage,
          subStatus: getDefaultSubStatus(nextStage),
        })
      }
    } catch (error) {
      console.error('Error progressing client:', error)
      setHasError('Failed to progress client. Please try again.')
    }
    setSelectedClient(null)
  }

  const getDefaultSubStatus = (stage: string) => {
    switch (stage) {
      case 'new_lead':
        return 'to_initiate_contact'
      case 'pre_listing':
        return 'preparing_cma'
      case 'active_listing':
        return 'active'
      case 'under_contract':
        return 'pending_inspection'
      case 'closed':
        return 'completed'
      default:
        return 'unknown'
    }
  }

  const handleUnarchive = async (client: any) => {
    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      return
    }

    try {
      await firebaseCollections.updateSeller(client.id, {
        isArchived: false,
        archivedDate: null,
        archivedFromStage: null,
      })
    } catch (error) {
      console.error('Error unarchiving client:', error)
      setHasError('Failed to unarchive client. Please try again.')
    }
    setSelectedClient(null)
  }

  const handleCloseNewLeadModal = () => {
    setShowNewLeadModal(false)
    setNewLeadForm({
      name: '',
      email: '',
      phone: '',
      propertyAddress: '',
      leadSource: '',
      priority: 'Medium',
      notes: '',
      documents: [],
    })
  }

  const handleSubmitNewLead = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newLeadForm.name || !newLeadForm.email || !newLeadForm.phone) {
      setHasError('Please fill in all required fields')
      return
    }

    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      return
    }

    setIsCreating(true)
    setHasError(null)

    try {
      const sellerData = {
        agentId: currentUser.uid,
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        propertyAddress: newLeadForm.propertyAddress || '',
        leadSource: newLeadForm.leadSource || '',
        notes: newLeadForm.notes || '',
        stage: 'new_lead',
        subStatus: 'to_initiate_contact',
        priority: newLeadForm.priority,
        dateAdded: new Date().toISOString(),
        lastContact: null,
        isArchived: false,
        archivedDate: null,
        archivedFromStage: null,
        uploadedDocuments: [],
      }

      // Create seller first
      const newSeller = await firebaseCollections.createSeller(sellerData)

      // Upload documents if any
      if (newLeadForm.documents.length > 0) {
        const uploadResults = await uploadClientDocuments(
          newSeller.id,
          'seller',
          newLeadForm.documents
        )

        // Update seller with document metadata
        const documentMetadata = uploadResults.map(result => ({
          name: result.fileName,
          url: result.url,
          type: result.contentType,
          size: result.size,
          uploadDate: result.uploadedAt.toISOString(),
        }))

        await firebaseCollections.updateSeller(newSeller.id, {
          uploadedDocuments: documentMetadata,
        })
      }

      handleCloseNewLeadModal()
    } catch (error) {
      console.error('Error creating seller:', error)
      setHasError('Failed to create seller. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setNewLeadForm(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(files)],
      }))
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeClientId = active.id as string
    const newStage = over.id as string

    // Find the client being dragged
    const client = sellerClients.find(c => c.id.toString() === activeClientId)

    if (!client || client.stage === newStage) {
      setActiveId(null)
      return
    }

    // Update the client stage
    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      setActiveId(null)
      return
    }

    try {
      await firebaseCollections.updateSeller(client.id, {
        stage: newStage,
        subStatus: getDefaultSubStatus(newStage),
      })
    } catch (error) {
      console.error('Error updating client stage:', error)
      setHasError('Failed to update client stage. Please try again.')
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeClient = activeId
    ? sellerClients.find(c => c.id.toString() === activeId)
    : null

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Sellers Portal
              </h1>
              <p className="text-gray-600">
                Manage all seller clients through their journey from lead to
                closing
              </p>
            </div>

            {/* Action Buttons - Top Right */}
            <div className="flex space-x-4">
              <Button
                onClick={handleNewLeadClick}
                className="bg-[#3B7097] hover:bg-[#3B7097]/90 text-white"
              >
                <Plus className="size-4 mr-2" />
                Add New Seller Lead
              </Button>
              <Button
                onClick={handleSellerArchive}
                variant="outline"
                className="border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
              >
                <Archive className="size-4 mr-2" />
                Seller Archive
              </Button>
            </div>
          </div>

          {/* Kanban Board - Full Width with Vertical Scrolling */}
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 w-full">
              {kanbanStages.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  title={stage.title}
                  stage={stage.stage}
                  clients={sellerClients}
                  onClientClick={handleClientClick}
                  isLoading={isLoading}
                  hasError={hasError}
                />
              ))}
            </div>

            <DragOverlay>
              {activeClient && (
                <ClientCard
                  client={activeClient}
                  onClick={() => {}}
                  isDragging={true}
                />
              )}
            </DragOverlay>
          </DndContext>
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
          currentUser={currentUser}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Seller Lead</h3>
              <button
                onClick={handleCloseNewLeadModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewLead} className="space-y-4">
              {hasError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {hasError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newLeadForm.name}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newLeadForm.email}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newLeadForm.phone}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  value={newLeadForm.propertyAddress}
                  onChange={e =>
                    setNewLeadForm(prev => ({
                      ...prev,
                      propertyAddress: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter property address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select
                  value={newLeadForm.leadSource}
                  onChange={e =>
                    setNewLeadForm(prev => ({
                      ...prev,
                      leadSource: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={newLeadForm.priority}
                  onChange={e =>
                    setNewLeadForm(prev => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newLeadForm.notes}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this lead..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documents (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newLeadForm.documents.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {newLeadForm.documents.length} file(s) selected
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseNewLeadModal}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? 'Creating...' : 'Add Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
