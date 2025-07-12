/**
 * Kanban Column Component for Sellers Portal V2
 * Displays clients in a specific stage column
 */

import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { ClientCard } from './client-card'

interface KanbanColumnProps {
  title: string
  stage: string
  clients: any[]
  onClientClick: (client: any) => void
  isLoading?: boolean
  hasError?: string | null
}

interface DraggableClientCardProps {
  client: any
  onClick: () => void
}

function DraggableClientCard({ client, onClick }: DraggableClientCardProps) {
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

      <ClientCard client={client} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

export function KanbanColumn({
  title,
  stage,
  clients,
  onClientClick,
  isLoading,
  hasError,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  // Filter clients for this stage and sort by dateAdded descending (newest first)
  const stageClients = clients
    .filter(client => client.stage === stage)
    .sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    )

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
      <div
        className={`rounded-lg border-2 ${getStageColor(stage)} ${isOver ? 'ring-2 ring-blue-500' : ''} p-4`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
            {stageClients.length}
          </span>
        </div>

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
        {!isLoading && !hasError && (
          <div ref={setNodeRef} className="space-y-3">
            {stageClients.map(client => (
              <DraggableClientCard
                key={client.id}
                client={client}
                onClick={() => onClientClick(client)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasError && stageClients.length === 0 && (
          <div ref={setNodeRef} className="text-center py-8">
            <p className="text-gray-500 text-sm">No clients in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
