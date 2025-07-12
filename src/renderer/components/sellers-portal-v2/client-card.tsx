/**
 * Client Card Component for Sellers Portal V2
 * Displays individual client information within kanban columns
 */

import { MapPin, Phone, Mail, Home, Calendar } from 'lucide-react'

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
  }
  onClick: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
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
          <p className="text-sm text-gray-700 leading-tight">{client.propertyAddress}</p>
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

      {/* Contact Information */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <a
            href={`tel:${client.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-[#3B7097] transition-colors"
          >
            <Phone className="size-4" />
          </a>
          <a
            href={`mailto:${client.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-[#3B7097] transition-colors"
          >
            <Mail className="size-4" />
          </a>
        </div>
      </div>
    </div>
  )
} 