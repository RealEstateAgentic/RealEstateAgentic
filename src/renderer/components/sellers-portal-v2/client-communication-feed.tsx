/**
 * Client Communication Feed Component for Sellers Portal V2
 * Displays recent communications across all seller clients in the sidebar
 */

import { MessageCircle, Phone, Mail, Calendar, User, Clock } from 'lucide-react'

// Mock communication data for sellers
const mockCommunications = [
  {
    id: 1,
    clientName: 'Johnson Family',
    type: 'email',
    subject: 'Survey Response Received',
    preview: 'Thank you for the detailed survey. We are very interested in listing our home...',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    clientName: 'Chen Family',
    type: 'phone',
    subject: 'Listing Consultation Call',
    preview: 'Discussed pricing strategy and timeline for listing preparation',
    timestamp: '4 hours ago',
    read: true,
  },
  {
    id: 3,
    clientName: 'Martinez Family',
    type: 'email',
    subject: 'Showing Feedback',
    preview: 'Three showings today with positive feedback. One potential offer...',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: 4,
    clientName: 'Williams Family',
    type: 'message',
    subject: 'Inspection Update',
    preview: 'Inspection completed successfully. Minor items noted in report...',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: 5,
    clientName: 'Thompson Family',
    type: 'email',
    subject: 'Closing Documents',
    preview: 'All closing documents have been signed and submitted to title company...',
    timestamp: '3 days ago',
    read: true,
  },
]

export function ClientCommunicationFeed() {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="size-4 text-blue-500" />
      case 'phone':
        return <Phone className="size-4 text-green-500" />
      case 'message':
        return <MessageCircle className="size-4 text-purple-500" />
      case 'calendar':
        return <Calendar className="size-4 text-orange-500" />
      default:
        return <User className="size-4 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return timestamp
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Client Communication Feed</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {mockCommunications.map((comm) => (
          <div 
            key={comm.id} 
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
              comm.read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(comm.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {comm.clientName}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Clock className="size-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(comm.timestamp)}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {comm.subject}
                </p>
                
                <p className="text-xs text-gray-600 leading-tight line-clamp-2">
                  {comm.preview}
                </p>
              </div>
            </div>
            
            {!comm.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto mt-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full text-center text-sm text-[#3B7097] hover:text-[#3B7097]/80 font-medium">
          View All Communications
        </button>
      </div>
    </div>
  )
} 