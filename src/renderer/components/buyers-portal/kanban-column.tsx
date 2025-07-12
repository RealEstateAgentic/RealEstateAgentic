import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
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
    dateAdded?: string
    favoritedProperties?: string[]
    viewedProperties?: string[]
    contractProperty?: string
    contractDate?: string
    closingDate?: string
    soldPrice?: string
  }>
  onClientClick: (client: any) => void
  navigate?: (path: string) => void
  isLoading?: boolean
  hasError?: string | null
}

interface DraggableClientCardProps {
  client: any
  onClick: () => void
  navigate?: (path: string) => void
}

function DraggableClientCard({
  client,
  onClick,
  navigate,
}: DraggableClientCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: client.id.toString(),
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-gray-200 cursor-grab active:cursor-grabbing"
        onMouseDown={e => e.stopPropagation()}
      >
        <GripVertical className="size-4 text-gray-400" />
      </div>

      <ClientCard
        client={client}
        onClick={onClick}
        navigate={navigate}
        isDragging={isDragging}
      />
    </div>
  )
}

export function KanbanColumn({
  title,
  stage,
  clients,
  onClientClick,
  navigate,
  isLoading,
  hasError,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  const getColumnColor = (stage: string) => {
    switch (stage) {
      case 'new_leads':
        return 'bg-[#75BDE0]/10 border-[#75BDE0]/30'
      case 'active_search':
        return 'bg-[#F6E2BC]/30 border-[#F6E2BC]/50'
      case 'under_contract':
        return 'bg-[#c05e51]/10 border-[#c05e51]/30'
      case 'closed':
        return 'bg-[#A9D09E]/10 border-[#A9D09E]/30'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getColumnHeaderColor = (stage: string) => {
    switch (stage) {
      case 'new_leads':
        return 'text-gray-800'
      case 'active_search':
        return 'text-gray-800'
      case 'under_contract':
        return 'text-gray-800'
      case 'closed':
        return 'text-gray-800'
      default:
        return 'text-gray-800'
    }
  }

  const stageClients = clients
    .filter(client => client.stage === stage)
    .sort(
      (a, b) =>
        new Date(b.dateAdded || '').getTime() -
        new Date(a.dateAdded || '').getTime()
    )

  return (
    <div
      className={`flex-1 min-w-80 rounded-lg border-2 ${getColumnColor(stage)} ${isOver ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3
            className={`font-semibold text-lg ${getColumnHeaderColor(stage)}`}
          >
            {title}
          </h3>
          <div
            className={`px-2 py-1 rounded-full text-sm font-medium ${getColumnHeaderColor(stage)} bg-white`}
          >
            {stageClients.length}
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="p-4 space-y-4 min-h-96 max-h-screen overflow-y-auto"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7097] mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">{hasError}</p>
          </div>
        )}

        {/* Client Cards */}
        {!isLoading &&
          !hasError &&
          stageClients.length > 0 &&
          stageClients.map(client => (
            <DraggableClientCard
              key={client.id}
              client={client}
              onClick={() => onClientClick(client)}
              navigate={navigate}
            />
          ))}

        {/* Empty State */}
        {!isLoading && !hasError && stageClients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No clients in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
