/**
 * Client Card Component for Sellers Portal V2
 * Displays individual client information within kanban columns
 */

import { MapPin, Phone, Mail, Home, Calendar } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

interface ClientCardProps {
  client: {
    id: number
    name: string
    email: string
    phone: string
    stage: string
    subStatus: string
    propertyAddress: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    timeline: string
    reasonForSelling: string
    leadSource: string
    dateAdded: string
    lastContact: string | null
    notes: string
    nextEvent?: string
  }
  onClick: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Get next event for this client
  const getNextEvent = () => {
    const clientEvents = dummyData.calendarEvents.filter(
      event =>
        event.clientType === 'seller' && event.clientId === client.id.toString()
    )
    const today = new Date()
    const upcomingEvents = clientEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return upcomingEvents.length > 0 ? upcomingEvents[0] : null
  }

  const nextEvent = getNextEvent()

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Client Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold text-gray-800">{client.name}</h4>
        </div>
      </div>

      {/* Property Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start space-x-2">
          <MapPin className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 leading-tight">
            {client.propertyAddress}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Home className="size-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {client.propertyType}
            {client.bedrooms > 0 && client.bathrooms > 0 && (
              <span className="ml-1">
                • {client.bedrooms}bd/{client.bathrooms}ba
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Timeline & Motivation */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="size-4 text-gray-500" />
          <span className="text-sm text-gray-600">{client.timeline}</span>
        </div>
        <div className="text-xs text-gray-500">{client.reasonForSelling}</div>
      </div>

      {/* Contact Information */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <a
            href={`tel:${client.phone}`}
            onClick={e => e.stopPropagation()}
            className="text-gray-400 hover:text-[#3B7097] transition-colors"
          >
            <Phone className="size-4" />
          </a>
          <a
            href={`mailto:${client.email}`}
            onClick={e => e.stopPropagation()}
            className="text-gray-400 hover:text-[#3B7097] transition-colors"
          >
            <Mail className="size-4" />
          </a>
        </div>
        <div className="text-xs text-gray-500">
          Added {formatDate(client.dateAdded)}
        </div>
      </div>

      {/* Next Event */}
      {nextEvent && (
        <div className="text-xs text-gray-500 pt-1">
          <div className="flex items-center space-x-1">
            <Calendar className="size-3" />
            <span>Next: {nextEvent.title}</span>
          </div>
          <div className="text-xs text-gray-400 ml-4">
            {new Date(nextEvent.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            at {nextEvent.time}
          </div>
        </div>
      )}
    </div>
  )
}
