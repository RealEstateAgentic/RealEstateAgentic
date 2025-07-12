/**
 * Buyers Portal screen for managing all buyer clients
 * Features a Kanban-style board with different stages
 */

import { useState, useEffect } from 'react'
import { KanbanColumn } from '../components/buyers-portal/kanban-column'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { ClientCommunicationFeed } from '../components/buyers-portal/client-communication-feed'
import { Button } from '../components/ui/button'
import { Archive, FileText, Users, DollarSign, Plus, X, Upload } from 'lucide-react'
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
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    leadSource: '',
    priority: 'Medium',
    notes: '',
    documents: [] as File[]
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
      (buyers) => {
        console.log('Received real-time buyers update:', buyers.length)
        setBuyerClients(buyers)
        setIsLoading(false)
        setHasError(null)
      },
      (error) => {
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
      const client = buyerClients.find(c => c.id === parseInt(clientId))
      if (client) {
        setSelectedClient({ ...client, initialTab: tab, initialDocumentId: documentId })
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
          subStatus: getDefaultSubStatus(nextStage)
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
      case 'new_leads': return 'active_search'
      case 'active_search': return 'under_contract'
      case 'under_contract': return 'closed'
      case 'closed': return null
      default: return null
    }
  }

  const getDefaultSubStatus = (stage: string) => {
    switch (stage) {
      case 'new_leads': return 'to_initiate_contact'
      case 'active_search': return 'searching'
      case 'under_contract': return 'pending_inspection'
      case 'closed': return 'completed'
      default: return 'unknown'
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
      documents: []
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
        uploadedDocuments: []
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
          uploadDate: result.uploadedAt.toISOString()
        }))
        
        await firebaseCollections.updateBuyer(newBuyer.id, {
          uploadedDocuments: documentMetadata
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
        documents: [...prev.documents, ...Array.from(files)]
      }))
    }
  }

  const kanbanStages = [
    { id: 'new_leads', title: 'New Leads', stage: 'new_leads' },
    { id: 'active_search', title: 'Active Search', stage: 'active_search' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' },
  ]

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Buyers Portal</h1>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Buyer Lead</h3>
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
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
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
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select
                  value={newLeadForm.leadSource}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, leadSource: e.target.value }))}
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
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, priority: e.target.value }))}
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
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, notes: e.target.value }))}
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
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
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
