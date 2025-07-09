import { useState } from 'react'
import { X, MapPin, Clock, Calendar as CalendarIcon, Tag } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function Calendar() {
  const events = dummyData.calendarEvents
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Generate 7 days starting from today
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'showing': return 'bg-[#75BDE0] text-white'
      case 'consultation': return 'bg-[#A9D09E] text-white'
      case 'closing': return 'bg-[#c05e51] text-white'
      case 'inspection': return 'bg-[#F6E2BC] text-gray-800'
      case 'listing': return 'bg-[#A9D09E]/30 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'showing': return 'Property Showing'
      case 'consultation': return 'Client Consultation'
      case 'closing': return 'Property Closing'
      case 'inspection': return 'Property Inspection'
      case 'listing': return 'Listing Activity'
      default: return 'Event'
    }
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">This Week's Calendar</h3>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 h-full">
            {days.map((day, index) => (
              <div key={index} className="text-center flex flex-col h-full">
                <div className={`p-2 rounded-t-lg border-b flex-shrink-0 ${
                  isToday(day) ? 'bg-[#3B7097] text-white' : 'bg-gray-50 text-gray-700'
                }`}>
                  <div className="text-xs font-medium">
                    {formatDate(day)}
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-0">
                  {getEventsForDate(day).length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-4">No events</div>
                  ) : (
                    getEventsForDate(day).map((event) => (
                      <div 
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`p-2 rounded text-xs ${getEventTypeColor(event.type)} mb-1 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-medium">{event.time}</div>
                        <div className="truncate leading-tight">{event.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Event Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Event Title */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedEvent.title}
                </h3>
              </div>

              {/* Event Type Badge */}
              <div className="flex items-center space-x-2">
                <Tag className="size-4 text-gray-500" />
                <span className={`px-3 py-1 rounded text-sm font-medium ${getEventTypeColor(selectedEvent.type)}`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </span>
              </div>

              {/* Date and Time */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="size-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {formatEventDate(selectedEvent.date)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="size-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedEvent.time}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start space-x-3">
                <MapPin className="size-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-700 mb-1">Location</div>
                  <div className="text-sm text-gray-600">{selectedEvent.location}</div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Event Notes</h4>
                <p className="text-sm text-gray-600">
                  {selectedEvent.type === 'showing' && "Property showing appointment with potential buyers. Ensure property is prepared and all utilities are working."}
                  {selectedEvent.type === 'consultation' && "Client consultation meeting. Prepare client files and relevant market data for discussion."}
                  {selectedEvent.type === 'closing' && "Property closing ceremony. Ensure all documents are prepared and parties are notified."}
                  {selectedEvent.type === 'inspection' && "Property inspection appointment. Coordinate with inspector and ensure property access."}
                  {selectedEvent.type === 'listing' && "Listing-related activity. Prepare marketing materials and property information."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={closeModal}
                  className="flex-1 bg-[#3B7097] hover:bg-[#3B7097]/90 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    console.log('Edit event:', selectedEvent.id)
                    closeModal()
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 