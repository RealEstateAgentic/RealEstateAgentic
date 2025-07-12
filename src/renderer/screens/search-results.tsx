/**
 * Search Results Screen
 * Displays search results in a list view with navigation to appropriate portals
 */

import { useState, useEffect } from 'react'
import { 
  Search, 
  User, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  ArrowRight,
  ChevronRight,
  Home,
  Users,
  Clock,
  Filter
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { dummyData } from '../data/dummy-data'
import type { AgentProfile } from '../../shared/types'

interface SearchResultsProps {
  navigate: (path: string) => void
  currentUser?: AgentProfile | null
  userType?: 'agent' | null
}

interface SearchResult {
  id: string
  type: 'client' | 'document' | 'event' | 'communication'
  title: string
  subtitle: string
  description: string
  portal: 'buyers' | 'sellers' | 'home'
  clientId?: number
  documentId?: string
  eventId?: number
  clientStage?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  date?: string
  metadata?: Record<string, any>
}

export function SearchResultsScreen({ navigate, currentUser, userType }: SearchResultsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    // Get search query from URL
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q')
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const results: SearchResult[] = []
    const searchTerm = query.toLowerCase()

    // Search through buyer clients
    dummyData.buyerClients.forEach(client => {
      if (
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm) ||
        client.location.toLowerCase().includes(searchTerm) ||
        client.notes.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: `buyer-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: `Buyer • ${client.stage.replace('_', ' ')}`,
          description: `${client.budget} • ${client.location}`,
          portal: 'buyers',
          clientId: client.id,
          clientStage: client.stage,
          priority: client.priority as 'Low' | 'Medium' | 'High' | 'Critical',
          date: client.dateAdded,
          metadata: {
            email: client.email,
            phone: client.phone,
            budget: client.budget,
            location: client.location
          }
        })
      }
    })

    // Search through seller clients (using mock data structure)
    const mockSellerClients = [
      {
        id: 1,
        name: "Thompson Family",
        email: "thompson.family@email.com",
        phone: "(555) 111-2222",
        stage: "new_lead",
        subStatus: "awaiting_survey",
        propertyAddress: "789 Pine Ave",
        propertyType: "Single Family",
        bedrooms: 3,
        bathrooms: 2,
        timeline: "3-6 months",
        reasonForSelling: "Relocating",
        leadSource: "Website Form",
        priority: "High",
        dateAdded: "2024-01-10",
        lastContact: "2024-01-14",
        notes: "Motivated sellers, open to negotiations"
      },
      {
        id: 2,
        name: "Martinez Property LLC",
        email: "martinez.property@email.com",
        phone: "(555) 222-3333",
        stage: "pre_listing",
        subStatus: "preparing_cma",
        propertyAddress: "456 Oak Street",
        propertyType: "Condo",
        bedrooms: 2,
        bathrooms: 1,
        timeline: "ASAP",
        reasonForSelling: "Investment liquidation",
        leadSource: "Referral",
        priority: "Medium",
        dateAdded: "2024-01-08",
        lastContact: "2024-01-13",
        notes: "Investment property, needs staging"
      }
    ]

    mockSellerClients.forEach(client => {
      if (
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm) ||
        client.propertyAddress.toLowerCase().includes(searchTerm) ||
        client.notes.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: `seller-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: `Seller • ${client.stage.replace('_', ' ')}`,
          description: `${client.propertyAddress} • ${client.propertyType}`,
          portal: 'sellers',
          clientId: client.id,
          clientStage: client.stage,
          priority: client.priority as 'Low' | 'Medium' | 'High' | 'Critical',
          date: client.dateAdded,
          metadata: {
            email: client.email,
            phone: client.phone,
            propertyAddress: client.propertyAddress,
            propertyType: client.propertyType
          }
        })
      }
    })

    // Search through documents (AI analyses)
    dummyData.recentAIAnalyses.forEach(analysis => {
      if (
        analysis.type.toLowerCase().includes(searchTerm) ||
        analysis.property.toLowerCase().includes(searchTerm) ||
        analysis.client.toLowerCase().includes(searchTerm)
      ) {
        const clientPortal = dummyData.buyerClients.find(c => c.name === analysis.client) ? 'buyers' : 'sellers'
        const client = dummyData.buyerClients.find(c => c.name === analysis.client) || 
                     mockSellerClients.find(c => c.name === analysis.client)
        
        results.push({
          id: `doc-${analysis.id}`,
          type: 'document',
          title: analysis.type,
          subtitle: `Document • ${analysis.client}`,
          description: `${analysis.property} • ${analysis.completedDate}`,
          portal: clientPortal,
          clientId: client?.id,
          documentId: analysis.id.toString(),
          date: analysis.completedDate,
          metadata: {
            property: analysis.property,
            client: analysis.client,
            status: analysis.status
          }
        })
      }
    })

    // Search through calendar events
    dummyData.calendarEvents.forEach(event => {
      if (
        event.title.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.type.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          subtitle: `Event • ${event.type}`,
          description: `${event.location} • ${event.time}`,
          portal: 'home',
          eventId: event.id,
          date: event.date,
          metadata: {
            time: event.time,
            location: event.location,
            type: event.type
          }
        })
      }
    })

    // Search through communications
    dummyData.clientCommunications.forEach(comm => {
      if (
        comm.clientName.toLowerCase().includes(searchTerm) ||
        comm.message.toLowerCase().includes(searchTerm) ||
        comm.type.toLowerCase().includes(searchTerm)
      ) {
        const clientPortal = dummyData.buyerClients.find(c => c.name === comm.clientName) ? 'buyers' : 'sellers'
        const client = dummyData.buyerClients.find(c => c.name === comm.clientName) || 
                     mockSellerClients.find(c => c.name === comm.clientName)
        
        results.push({
          id: `comm-${comm.id}`,
          type: 'communication',
          title: comm.message,
          subtitle: `${comm.type.toUpperCase()} • ${comm.clientName}`,
          description: new Date(comm.timestamp).toLocaleString(),
          portal: clientPortal,
          clientId: client?.id,
          priority: comm.priority as 'Low' | 'Medium' | 'High' | 'Critical',
          date: comm.timestamp,
          metadata: {
            type: comm.type,
            clientName: comm.clientName,
            timestamp: comm.timestamp
          }
        })
      }
    })

    // Sort results by relevance and date
    results.sort((a, b) => {
      // First sort by priority if it exists
      if (a.priority && b.priority) {
        const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
      }
      
      // Then by date (newest first)
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    })

    setSearchResults(results)
    setIsLoading(false)
  }

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'client':
        // Navigate to portal and open client modal
        const portalPath = result.portal === 'buyers' ? '/buyers-portal' : '/sellers-portal'
        navigate(`${portalPath}?clientId=${result.clientId}`)
        break
      
      case 'document':
        // Navigate to portal, open client modal, go to content tab, and open document
        const docPortalPath = result.portal === 'buyers' ? '/buyers-portal' : '/sellers-portal'
        navigate(`${docPortalPath}?clientId=${result.clientId}&tab=content&documentId=${result.documentId}`)
        break
      
      case 'event':
        // Navigate to home dashboard
        navigate('/')
        break
      
      case 'communication':
        // Navigate to portal and open client modal
        const commPortalPath = result.portal === 'buyers' ? '/buyers-portal' : '/sellers-portal'
        navigate(`${commPortalPath}?clientId=${result.clientId}&tab=email_history`)
        break
      
      default:
        break
    }
  }

  const getFilteredResults = () => {
    if (selectedFilter === 'all') return searchResults
    return searchResults.filter(result => result.type === selectedFilter)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="size-5" />
      case 'document':
        return <FileText className="size-5" />
      case 'event':
        return <Calendar className="size-5" />
      case 'communication':
        return <Mail className="size-5" />
      default:
        return <Search className="size-5" />
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600'
      case 'High':
        return 'text-orange-600'
      case 'Medium':
        return 'text-blue-600'
      case 'Low':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getResultTypeCount = (type: string) => {
    return searchResults.filter(result => result.type === type).length
  }

  const filteredResults = getFilteredResults()

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Search Results</h1>
            <p className="text-gray-600 mt-1">
              {isLoading ? 'Searching...' : `${filteredResults.length} results for "${searchQuery}"`}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)]">
        {/* Sidebar - Filters */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="size-4" />
            Filter Results
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilter === 'all' 
                  ? 'bg-[#3B7097] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Results ({searchResults.length})
            </button>
            <button
              onClick={() => setSelectedFilter('client')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilter === 'client' 
                  ? 'bg-[#3B7097] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Clients ({getResultTypeCount('client')})
            </button>
            <button
              onClick={() => setSelectedFilter('document')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilter === 'document' 
                  ? 'bg-[#3B7097] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Documents ({getResultTypeCount('document')})
            </button>
            <button
              onClick={() => setSelectedFilter('event')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilter === 'event' 
                  ? 'bg-[#3B7097] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events ({getResultTypeCount('event')})
            </button>
            <button
              onClick={() => setSelectedFilter('communication')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilter === 'communication' 
                  ? 'bg-[#3B7097] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Communications ({getResultTypeCount('communication')})
            </button>
          </div>
        </div>

        {/* Main Results Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7097] mx-auto mb-4"></div>
                <p className="text-gray-600">Searching...</p>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Search className="size-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-md ${
                          result.type === 'client' ? 'bg-blue-100 text-blue-600' :
                          result.type === 'document' ? 'bg-green-100 text-green-600' :
                          result.type === 'event' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {result.title}
                            </h3>
                            {result.priority && (
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(result.priority)} bg-gray-100`}>
                                {result.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {result.subtitle}
                          </p>
                          <p className="text-sm text-gray-500">
                            {result.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-400 ml-4">
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 