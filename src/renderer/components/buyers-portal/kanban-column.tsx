import { ClientCard } from './client-card'

interface KanbanColumnProps {
  title: string
  stage: string
  clients: Array<{
    id: number
    name: string
    email: string
    phone: string
    stage: string
    subStatus: string
    budget: string
    location: string
    leadSource: string
    priority: string
    dateAdded: string
    lastContact: string | null
    notes: string
    favoritedProperties?: string[]
    viewedProperties?: string[]
    contractProperty?: string
    contractDate?: string
    closingDate?: string
    soldPrice?: string
  }>
  onClientClick: (client: any) => void
}

export function KanbanColumn({ title, stage, clients, onClientClick }: KanbanColumnProps) {
  const getColumnColor = (stage: string) => {
    switch (stage) {
      case 'new_leads': return 'bg-[#75BDE0]/10 border-[#75BDE0]/30'
      case 'active_search': return 'bg-[#A9D09E]/10 border-[#A9D09E]/30'
      case 'under_contract': return 'bg-[#3B7097]/10 border-[#3B7097]/30'
      case 'closed': return 'bg-[#F6E2BC]/30 border-[#F6E2BC]/50'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getColumnHeaderColor = (stage: string) => {
    switch (stage) {
      case 'new_leads': return 'text-[#75BDE0]'
      case 'active_search': return 'text-[#A9D09E]'
      case 'under_contract': return 'text-[#3B7097]'
      case 'closed': return 'text-gray-700'
      default: return 'text-gray-800'
    }
  }

  const stageClients = clients.filter(client => client.stage === stage)

  return (
    <div className={`flex-1 min-w-80 rounded-lg border-2 ${getColumnColor(stage)}`}>
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-lg ${getColumnHeaderColor(stage)}`}>
            {title}
          </h3>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getColumnHeaderColor(stage)} bg-white`}>
            {stageClients.length}
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-4 space-y-4 min-h-96 max-h-screen overflow-y-auto">
        {stageClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No clients in this stage</p>
          </div>
        ) : (
          stageClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => onClientClick(client)}
            />
          ))
        )}
      </div>
    </div>
  )
} 