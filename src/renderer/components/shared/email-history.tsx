import { useState, useEffect } from 'react'
import { 
  Mail, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '../ui/button'
import { gmailAuth } from '../../services/gmail-auth'

interface EmailMessage {
  id: string
  sender: string
  senderEmail: string
  timestamp: string
  content: string
  isFromClient: boolean
}

interface EmailThread {
  id: string
  subject: string
  snippet: string
  messageCount: number
  lastMessage: string
  lastTimestamp: string
  participants: string[]
  messages: EmailMessage[]
}

interface EmailHistoryProps {
  clientEmail: string
  clientName: string
  className?: string
}

export function EmailHistory({ clientEmail, clientName, className = '' }: EmailHistoryProps) {
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedThread, setExpandedThread] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadEmailHistory = async () => {
    try {
      setError(null)
      
      // Check if user is authenticated with Gmail
      if (!gmailAuth.isAuthenticated()) {
        setError('Gmail not authenticated. Please authenticate to view email history.')
        return
      }

      const threads = await gmailAuth.getEmailHistory(clientEmail, 25)
      setEmailThreads(threads)
      
    } catch (err: any) {
      console.error('Error loading email history:', err)
      
      // Handle insufficient scope error specifically
      if (err.message.includes('403') || err.message.includes('insufficient') || err.message.includes('PERMISSION_DENIED')) {
        setError('Gmail access requires additional permissions. Please re-authenticate to grant email reading access.')
      } else {
        setError(err.message || 'Failed to load email history')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadEmailHistory()
  }, [clientEmail])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEmailHistory()
  }

  const handleAuthenticateGmail = async () => {
    try {
      setLoading(true)
      
      // Clear existing tokens to force fresh authentication with new scopes
      gmailAuth.logout()
      
      const result = await gmailAuth.authenticate()
      if (result.success) {
        await loadEmailHistory()
      } else {
        setError('Gmail authentication failed')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleThread = (threadId: string) => {
    setExpandedThread(expandedThread === threadId ? null : threadId)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return `${content.substring(0, maxLength)}...`
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Email History</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading email history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Email History</h3>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="size-5 text-red-600 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Unable to load email history</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {(error.includes('not authenticated') || error.includes('additional permissions') || error.includes('re-authenticate')) && (
                <Button 
                  size="sm" 
                  className="mt-2 bg-red-600 hover:bg-red-700" 
                  onClick={handleAuthenticateGmail}
                >
                  {error.includes('additional permissions') ? 'Re-authenticate Gmail' : 'Authenticate Gmail'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (emailThreads.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Email History</h3>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-center py-8">
          <Mail className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No email history found</p>
          <p className="text-sm text-gray-400 mt-1">
            No emails found between you and {clientName}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Email History</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{emailThreads.length} conversations</span>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {emailThreads.map((thread) => (
          <div key={thread.id} className="border border-gray-200 rounded-lg">
            {/* Thread Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleThread(thread.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleThread(thread.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm text-gray-800 line-clamp-1">
                      {thread.subject}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <MessageCircle className="size-3 mr-1" />
                      {thread.messageCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {thread.snippet}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="size-3 mr-1" />
                    <span>Last message: {thread.lastMessage}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedThread === thread.id ? (
                    <ChevronUp className="size-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Thread Messages */}
            {expandedThread === thread.id && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  {thread.messages.map((message, index) => (
                    <div key={message.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.isFromClient 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <User className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-gray-800">
                                {message.sender || message.senderEmail}
                              </span>
                              {message.isFromClient && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                  Client
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {message.content.length > 300 ? (
                              <>
                                {truncateContent(message.content, 300)}
                                <button className="text-blue-600 hover:text-blue-800 ml-1">
                                  Show more
                                </button>
                              </>
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}