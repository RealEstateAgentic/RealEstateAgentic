/**
 * Kanban Column Component for Sellers Portal V2
 * Displays clients in a specific stage column
 */

import { ClientCard } from './client-card'

interface KanbanColumnProps {
  title: string
  stage: string
  clients: any[]
  onClientClick: (client: any) => void
}

export function KanbanColumn({ title, stage, clients, onClientClick }: KanbanColumnProps) {
  // Filter clients for this stage
  const stageClients = clients.filter(client => client.stage === stage)

  // Define stage colors based on seller stages - using professional color scheme
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new_lead':
        return 'bg-[#75BDE0]/10 border-[#75BDE0]/30'
      case 'pre_listing':
        return 'bg-[#F6E2BC]/10 border-[#F6E2BC]/30'
      case 'active_listing':
        return 'bg-[#A9D09E]/10 border-[#A9D09E]/30'
      case 'under_contract':
        return 'bg-[#c05e51]/10 border-[#c05e51]/30'
      case 'closed':
        return 'bg-[#3B7097]/10 border-[#3B7097]/30'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="w-80 flex-shrink-0">
      <div className={`rounded-lg border-2 ${getStageColor(stage)} p-4`}>
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
            {stageClients.length}
          </span>
        </div>

        {/* Client Cards */}
        <div className="space-y-3">
          {stageClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => onClientClick(client)}
            />
          ))}
        </div>

        {/* Empty State */}
        {stageClients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No clients in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
} 