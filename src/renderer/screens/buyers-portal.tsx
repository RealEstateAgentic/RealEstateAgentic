/**
 * Buyers Portal screen for managing all buyer clients
 * Features a Kanban-style board with different stages
 */

import { useState } from 'react'
import { KanbanColumn } from '../components/buyers-portal/kanban-column'
import { ClientModal } from '../components/buyers-portal/client-modal'
import { ClientCommunicationFeed } from '../components/buyers-portal/client-communication-feed'
import { dummyData } from '../data/dummy-data'

interface BuyersPortalScreenProps {
  navigate?: (path: string) => void
}

export function BuyersPortalScreen({}: BuyersPortalScreenProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const { buyerClients } = dummyData

  const handleClientClick = (client: any) => {
    setSelectedClient(client)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
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
        <div className="w-80 p-6 border-l border-gray-200">
          <ClientCommunicationFeed />
        </div>
      </div>

      {/* Client Modal */}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
} 