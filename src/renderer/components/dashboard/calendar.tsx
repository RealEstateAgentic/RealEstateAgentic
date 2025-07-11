import { useState } from 'react'
import { X, MapPin, Clock, Calendar as CalendarIcon, Tag, Plus, AlertCircle, CheckCircle, Edit } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'

export function Calendar() {
  const [events, setEvents] = useState(dummyData.calendarEvents)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    clientType: '',
    clientId: '',
    priority: 'low',
    eventType: 'custom'
  })
  
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

  // Updated color coding system as per requirements
  const getEventTypeColor = (type: string, priority?: string, clientType?: string) => {
    // Priority-based coloring for deadlines
    if (type === 'deadline') {
      return priority === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
    }
    
    // Client-based coloring for events
    if (clientType === 'buyer') {
      return 'bg-blue-500 text-white' // Blue: Buyer Events
    } else if (clientType === 'seller') {
      return 'bg-green-500 text-white' // Green: Seller Events
    }
    
    // Legacy types for backward compatibility
    switch (type) {
      case 'showing': return 'bg-blue-500 text-white' // Default to buyer events
      case 'consultation': return 'bg-green-500 text-white' // Default to seller events
      case 'closing': return 'bg-red-500 text-white' // High priority deadline
      case 'inspection': return 'bg-yellow-500 text-white' // Low priority deadline
      case 'listing': return 'bg-green-500 text-white' // Seller events
      case 'custom': return 'bg-gray-500 text-white'
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
      case 'deadline': return 'Deadline'
      case 'custom': return 'Custom Event'
      default: return 'Event'
    }
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time.replace(/[APM\s]/g, ''), // Convert to 24-hour format
      description: event.location || '',
      clientType: event.clientType || '',
      clientId: event.clientId || '',
      priority: event.priority || 'low',
      eventType: event.type || 'custom'
    })
    setIsEditModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedEvent(null)
    setFormData({
      title: '',
      date: '',
      time: '',
      description: '',
      clientType: '',
      clientId: '',
      priority: 'low',
      eventType: 'custom'
    })
  }

  const handleAddEvent = () => {
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormData({
      title: '',
      date: '',
      time: '',
      description: '',
      clientType: '',
      clientId: '',
      priority: 'low',
      eventType: 'custom'
    })
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEvent = () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in all required fields')
      return
    }

    // Convert 24-hour time to 12-hour format for display
    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    }

    const newEvent = {
      id: Date.now(), // Use timestamp for unique ID
      title: formData.title,
      date: formData.date,
      time: formatTime(formData.time),
      type: formData.eventType,
      location: formData.description || 'TBD',
      clientType: formData.clientType || null,
      clientId: formData.clientId || null,
      priority: formData.priority
    }

    setEvents([...events, newEvent])
    
    // Also add to dummy data for persistence across component re-renders
    dummyData.calendarEvents.push(newEvent)
    
    closeCreateModal()
  }

  const handleUpdateEvent = () => {
    if (!formData.title || !formData.date || !formData.time || !selectedEvent) {
      alert('Please fill in all required fields')
      return
    }

    // Convert 24-hour time to 12-hour format for display
    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    }

    const updatedEvent = {
      ...selectedEvent,
      title: formData.title,
      date: formData.date,
      time: formatTime(formData.time),
      type: formData.eventType,
      location: formData.description || 'TBD',
      clientType: formData.clientType || null,
      clientId: formData.clientId || null,
      priority: formData.priority
    }

    // Update in local state
    setEvents(events.map(event => 
      event.id === selectedEvent.id ? updatedEvent : event
    ))
    
    // Update in dummy data for persistence
    const index = dummyData.calendarEvents.findIndex(e => e.id === selectedEvent.id)
    if (index !== -1) {
      dummyData.calendarEvents[index] = updatedEvent
    }
    
    closeEditModal()
  }

  const getClientOptions = () => {
    if (formData.clientType === 'buyer') {
      return dummyData.buyerClients.map(client => ({
        id: client.id,
        name: client.name
      }))
    } else if (formData.clientType === 'seller') {
      return dummyData.sellerClients.map(client => ({
        id: client.id,
        name: client.name
      }))
    }
    return []
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

  const renderEventForm = (isEdit = false) => (
    <div className="space-y-4">
      {/* Event Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleFormChange('title', e.target.value)}
          placeholder="e.g., Final Walkthrough"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
        />
      </div>

      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type
        </label>
        <select
          value={formData.eventType}
          onChange={(e) => handleFormChange('eventType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
        >
          <option value="custom">Custom Event</option>
          <option value="showing">Property Showing</option>
          <option value="consultation">Client Consultation</option>
          <option value="closing">Property Closing</option>
          <option value="inspection">Property Inspection</option>
          <option value="listing">Listing Activity</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority *
        </label>
        <select
          value={formData.priority}
          onChange={(e) => handleFormChange('priority', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
        >
          <option value="low">Low Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleFormChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => handleFormChange('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Add detailed notes, location information, or context..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
        />
      </div>

      {/* Client Association */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Type
          </label>
          <select
            value={formData.clientType}
            onChange={(e) => handleFormChange('clientType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
          >
            <option value="">No client association</option>
            <option value="buyer">Buyer Client</option>
            <option value="seller">Seller Client</option>
          </select>
        </div>

        {formData.clientType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleFormChange('clientId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
            >
              <option value="">Choose a client...</option>
              {getClientOptions().map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          onClick={isEdit ? closeEditModal : closeCreateModal}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleUpdateEvent : handleSaveEvent}
          className="flex-1 bg-[#3B7097] hover:bg-[#3B7097]/90"
        >
          {isEdit ? 'Update Event' : 'Save Event'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">This Week's Calendar</h3>
            <Button
              onClick={handleAddEvent}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 h-auto"
            >
              <Plus className="size-4 mr-1" />
              Add Event
            </Button>
          </div>
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
                        className={`p-2 rounded text-xs ${getEventTypeColor(event.type, event.priority, event.clientType)} mb-1 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-medium flex items-center justify-between">
                          <span>{event.time}</span>
                          {event.priority === 'high' && (
                            <AlertCircle className="size-3" />
                          )}
                        </div>
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit className="size-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="size-6" />
                </button>
              </div>
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
                <span className={`px-3 py-1 rounded text-sm font-medium ${getEventTypeColor(selectedEvent.type, selectedEvent.priority, selectedEvent.clientType)}`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </span>
                {selectedEvent.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                    High Priority
                  </span>
                )}
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
              <div className="flex items-center space-x-3">
                <MapPin className="size-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Location</div>
                  <div className="text-sm text-gray-600">{selectedEvent.location}</div>
                </div>
              </div>

              {/* Client Information */}
              {selectedEvent.clientType && (
                <div className="flex items-center space-x-3">
                  <Tag className="size-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">Client</div>
                    <div className="text-sm text-gray-600 capitalize">{selectedEvent.clientType} Client</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Event</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>
            
            <div className="p-6">
              {renderEventForm(false)}
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Edit Event</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>
            
            <div className="p-6">
              {renderEventForm(true)}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 