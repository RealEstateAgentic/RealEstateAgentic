/**
 * Buyers Portal screen for managing all buyer clients
 * Features a Kanban-style board with different stages
 */

import { useState } from 'react'
import { KanbanColumn } from '../components/buyers-portal/kanban-column'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { ClientCommunicationFeed } from '../components/buyers-portal/client-communication-feed'
import { Button } from '../components/ui/button'
import { Archive } from 'lucide-react'
import { dummyData } from '../data/dummy-data'

interface BuyersPortalScreenProps {
  navigate?: (path: string) => void
}

export function BuyersPortalScreen({ navigate }: BuyersPortalScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [buyerClients, setBuyerClients] = useState(dummyData.buyerClients)
  const [archivedClients, setArchivedClients] = useState(dummyData.archivedBuyerClients)

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
      archivedFromStage: getStageName(client.stage)
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

  const kanbanStages = [
    { id: 'new_leads', title: 'New Leads', stage: 'new_leads' },
    { id: 'active_search', title: 'Active Search', stage: 'active_search' },
    { id: 'under_contract', title: 'Under Contract', stage: 'under_contract' },
    { id: 'closed', title: 'Closed', stage: 'closed' }
  ]

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex">
        {/* Main Kanban Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buyers Portal</h1>
            <p className="text-gray-600">Manage all buyer clients through their journey</p>
          </div>
          
          <div className="flex gap-6 min-w-max">
            {kanbanStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                title={stage.title}
                stage={stage.stage}
                clients={buyerClients}
                onClientClick={handleClientClick}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 border-l border-gray-200 flex flex-col">
          <div className="flex-1">
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
    </div>
  )
} 