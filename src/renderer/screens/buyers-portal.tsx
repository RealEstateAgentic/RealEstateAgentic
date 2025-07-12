/**
 * Buyers Portal screen for managing all buyer clients
 * Features a Kanban-style board with different stages
 */

import { useState, useEffect } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { KanbanColumn } from '../components/buyers-portal/kanban-column'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { ClientCard } from '../components/buyers-portal/client-card'
import { ClientCommunicationFeed } from '../components/buyers-portal/client-communication-feed'
import { Button } from '../components/ui/button'
import {
  Archive,
  FileText,
  Users,
  DollarSign,
  Plus,
  X,
  Upload,
} from 'lucide-react'
import { dummyData } from '../data/dummy-data'
import { firebaseCollections } from '../services/firebase/collections'
import { uploadClientDocuments } from '../../lib/firebase/storage'

import type { AgentProfile } from '../../shared/types'
import { OfferForm } from '../components/offers/OfferForm'
import { NegotiationDashboard } from '../components/negotiations/NegotiationDashboard'
import { DocumentGenerator } from '../components/documents/DocumentGenerator'

interface BuyersPortalScreenProps {
  navigate?: (path: string) => void
  currentUser?: AgentProfile | null
  userType?: 'agent' | 'buyer' | 'seller' | null
}

export function BuyersPortalScreen({
  navigate,
  currentUser,
  userType,
}: BuyersPortalScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [buyerClients, setBuyerClients] = useState<any[]>([])
  const [archivedClients, setArchivedClients] = useState<any[]>([])
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    leadSource: '',
    priority: 'Medium',
    notes: '',
    documents: [] as File[],
  })

  // Set up real-time listener for buyer clients
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false)
      return
    }

    console.log('Setting up real-time listener for buyers')
    const unsubscribe = firebaseCollections.getBuyersRealTime(
      currentUser.uid,
      buyers => {
        console.log('Received real-time buyers update:', buyers.length)
        setBuyerClients(buyers)
        setIsLoading(false)
        setHasError(null)
      },
      error => {
        console.error('Real-time buyers error:', error)
        setHasError('Failed to load buyers—please refresh')
        setIsLoading(false)
      }
    )

    return () => {
      console.log('Cleaning up buyers real-time listener')
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
      const client = buyerClients.find(c => c.id === Number.parseInt(clientId))
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
  }, [buyerClients])

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
  }

  const handleNewLeadClick = () => {
    setShowNewLeadModal(true)
  }

  const handleBuyerArchive = () => {
    if (navigate) {
      navigate('/buyers-archive')
    }
  }

  const handleArchive = async (client: any) => {
    if (!currentUser?.uid) {
      setHasError('User not authenticated')
      return
    }

    try {
      await firebaseCollections.archiveBuyer(client.id, client.stage)
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
        await firebaseCollections.updateBuyer(client.id, {
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

  const getNextStage = (currentStage: string): string | null => {
    switch (currentStage) {
      case 'new_leads':
        return 'active_search'
      case 'active_search':
        return 'under_contract'
      case 'under_contract':
        return 'closed'
      case 'closed':
        return null
      default:
        return null
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
    const client = buyerClients.find(c => c.id.toString() === activeClientId)

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
      await firebaseCollections.updateBuyer(client.id, {
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

  const getDefaultSubStatus = (stage: string) => {
    switch (stage) {
      case 'new_leads':
        return 'to_initiate_contact'
      case 'active_search':
        return 'searching'
      case 'under_contract':
        return 'pending_inspection'
      case 'closed':
        return 'completed'
      default:
        return 'unknown'
    }
  }

  const handleCloseNewLeadModal = () => {
    setShowNewLeadModal(false)
    setNewLeadForm({
      name: '',
      email: '',
      phone: '',
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
      const buyerData = {
        agentId: currentUser.uid,
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        leadSource: newLeadForm.leadSource || '',
        notes: newLeadForm.notes || '',
        stage: 'new_leads',
        subStatus: 'to_initiate_contact',
        priority: newLeadForm.priority,
        dateAdded: new Date().toISOString(),
        lastContact: null,
        isArchived: false,
        archivedDate: null,
        archivedFromStage: null,
        uploadedDocuments: [],
      }

      // Create buyer first
      const newBuyer = await firebaseCollections.createBuyer(buyerData)

      // Upload documents if any
      if (newLeadForm.documents.length > 0) {
        const uploadResults = await uploadClientDocuments(
          newBuyer.id,
          'buyer',
          newLeadForm.documents
        )

        // Update buyer with document metadata
        const documentMetadata = uploadResults.map(result => ({
          name: result.fileName,
          url: result.url,
          type: result.contentType,
          size: result.size,
          uploadDate: result.uploadedAt.toISOString(),
        }))

        await firebaseCollections.updateBuyer(newBuyer.id, {
          uploadedDocuments: documentMetadata,
        })
      }

      handleCloseNewLeadModal()
    } catch (error) {
      console.error('Error creating buyer:', error)
      setHasError('Failed to create buyer. Please try again.')
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

  const kanbanStages = [
    { id: 'new_leads', title: 'New Leads', stage: 'new_leads' },
    { id: 'active_search', title: 'Active Search', stage: 'active_search' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' },
  ]

  const activeClient = activeId
    ? buyerClients.find(c => c.id.toString() === activeId)
    : null

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Buyers Portal
              </h1>
              <p className="text-gray-600">
                Manage all buyer clients through their journey
              </p>
            </div>

            {/* Action Buttons - Top Right */}
            <div className="flex space-x-4">
              <Button
                onClick={handleNewLeadClick}
                className="bg-[#3B7097] hover:bg-[#3B7097]/90 text-white"
              >
                <Plus className="size-4 mr-2" />
                Add New Buyer Lead
              </Button>
              <Button
                onClick={handleBuyerArchive}
                variant="outline"
                className="border-[#3B7097] text-[#3B7097] hover:bg-[#3B7097]/10"
              >
                <Archive className="size-4 mr-2" />
                Buyer Archive
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
            <div className="flex gap-6 min-w-max">
              {kanbanStages.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  title={stage.title}
                  stage={stage.stage}
                  clients={buyerClients}
                  onClientClick={handleClientClick}
                  navigate={navigate}
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
                  navigate={navigate}
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
          currentUser={currentUser}
          navigate={navigate}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Buyer Lead</h2>
              <button
                onClick={handleCloseNewLeadModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {hasError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{hasError}</p>
              </div>
            )}

            <form onSubmit={handleSubmitNewLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newLeadForm.email}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={newLeadForm.phone}
                  onChange={e =>
                    setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <input
                  type="text"
                  value={newLeadForm.leadSource}
                  onChange={e =>
                    setNewLeadForm(prev => ({
                      ...prev,
                      leadSource: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Website, Referral, Social Media"
                />
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

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseNewLeadModal}
                  disabled={isCreating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-[#3B7097] hover:bg-[#3B7097]/90"
                >
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
