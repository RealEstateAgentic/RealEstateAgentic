import { Phone, Mail, MessageSquare, Clock } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function ClientCommunicationFeed() {
  const { clientCommunications } = dummyData

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
      case 'call':
        return <Phone className="size-3 text-[#75BDE0]" />
      case 'email':
        return <Mail className="size-3 text-[#A9D09E]" />
      case 'text':
        return <MessageSquare className="size-3 text-[#3B7097]" />
      default:
        return <Clock className="size-3 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-[#3B7097]'
      case 'medium': return 'border-l-[#75BDE0]'
      case 'low': return 'border-l-[#A9D09E]'
      default: return 'border-l-gray-300'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (hours < 1) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
      <h3 className="font-semibold text-gray-800 mb-4">Client Communication Feed</h3>
      
      <div className="space-y-3">
        {clientCommunications.map((communication) => (
          <div 
            key={communication.id} 
            className={`p-3 border-l-4 bg-gray-50 rounded-r ${getPriorityColor(communication.priority)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getTypeIcon(communication.type)}
                <span className="ml-2 font-medium text-sm text-gray-800">
                  {communication.clientName}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(communication.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {communication.message}
            </p>
          </div>
        ))}
      </div>

      {clientCommunications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent communications</p>
        </div>
      )}
    </div>
  )
} 