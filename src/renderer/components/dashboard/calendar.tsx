import { useState, useEffect } from 'react'
import { X, MapPin, Clock, Calendar as CalendarIcon, Tag, Plus, AlertCircle, CheckCircle, Edit, Wifi, WifiOff, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'
import { googleCalendar } from '../../services/google-calendar'
import { gmailAuth } from '../../services/gmail-auth'

export function Calendar() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // Check authentication status and load events on mount
  useEffect(() => {
    checkAuthAndLoadEvents()
  }, [])

  const checkAuthAndLoadEvents = async () => {
    const authenticated = gmailAuth.isAuthenticated()
    setIsConnected(authenticated)
    
    if (authenticated) {
      await loadCalendarEvents()
    } else {
      // Use dummy data as fallback when not connected
      setEvents(dummyData.calendarEvents)
    }
  }

  const loadCalendarEvents = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Match the exact date range shown in our calendar display
      const today = new Date()
      const firstDay = new Date(today)
      firstDay.setHours(0, 0, 0, 0)
      
      const lastDay = new Date(today)
      lastDay.setDate(today.getDate() + 6) // 7 days total (0-6)
      lastDay.setHours(23, 59, 59, 999)
      
      console.log('📅 Fetching events from:', firstDay.toISOString(), 'to:', lastDay.toISOString())
      
      const googleEvents = await googleCalendar.getEvents(
        firstDay.toISOString(),
        lastDay.toISOString()
      )
      
      console.log('📅 Google Calendar events received:', googleEvents.length, googleEvents)
      
      const formattedEvents = googleEvents.map(event => 
        googleCalendar.formatEventForDisplay(event)
      )
      
      console.log('📅 Formatted events:', formattedEvents)
      
      setEvents(formattedEvents)
    } catch (err) {
      console.error('Failed to load calendar events:', err)
      setError('Failed to load calendar events')
      // Fallback to dummy data on error
      setEvents(dummyData.calendarEvents)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectCalendar = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await gmailAuth.authenticate()
      
      if (result.success) {
        setIsConnected(true)
        await loadCalendarEvents()
      } else {
        setError(result.error || 'Failed to connect to Google Calendar')
      }
    } catch (err) {
      console.error('Calendar connection failed:', err)
      setError('Failed to connect to Google Calendar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnectCalendar = () => {
    gmailAuth.logout()
    setIsConnected(false)
    setEvents(dummyData.calendarEvents) // Fallback to dummy data
  }
  
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

  // Updated color coding system using proper UI design rules palette
  const getEventTypeColor = (type: string, priority?: string, clientType?: string) => {
    // Priority-based coloring for deadlines
    if (type === 'deadline') {
      return priority === 'high' ? 'bg-[#c05e51]/20 text-black border border-[#c05e51]/40' : 'bg-[#F6E2BC]/60 text-black border border-[#F6E2BC]'
    }
    
    // Client-based coloring for events
    if (clientType === 'buyer') {
      return 'bg-[#75BDE0]/20 text-black border border-[#75BDE0]/40' // Sky Blue: Buyer Events
    } else if (clientType === 'seller') {
      return 'bg-[#A9D09E]/20 text-black border border-[#A9D09E]/40' // Sage Green: Seller Events
    }
    
    // Legacy types for backward compatibility
    switch (type) {
      case 'showing': return 'bg-[#75BDE0]/20 text-black border border-[#75BDE0]/40' // Buyer events
      case 'consultation': return 'bg-[#A9D09E]/20 text-black border border-[#A9D09E]/40' // Seller events
      case 'closing': return 'bg-[#c05e51]/20 text-black border border-[#c05e51]/40' // High priority deadline
      case 'inspection': return 'bg-[#F6E2BC]/60 text-black border border-[#F6E2BC]' // Medium priority deadline
      case 'listing': return 'bg-[#A9D09E]/20 text-black border border-[#A9D09E]/40' // Seller events
      case 'custom': return 'bg-[#3B7097]/20 text-black border border-[#3B7097]/40' // Primary accent
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
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
    
    // Convert 12-hour time format to 24-hour format for HTML time input
    const convertTo24Hour = (time12h: string): string => {
      if (!time12h || time12h === 'All Day') return '09:00'
      
      const [time, modifier] = time12h.split(' ')
      if (!time || !modifier) return '09:00'
      
      let [hours, minutes] = time.split(':')
      if (!hours || !minutes) return '09:00'
      
      let hour = parseInt(hours)
      if (isNaN(hour)) return '09:00'
      
      if (modifier.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12
      } else if (modifier.toUpperCase() === 'AM' && hour === 12) {
        hour = 0
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`
    }
    
    setFormData({
      title: event.title,
      date: event.date,
      time: convertTo24Hour(event.time),
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

  const handleDeleteEvent = async (event: any) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      setIsLoading(true)
      
      if (isConnected && event.googleEventId) {
        // Delete from Google Calendar
        await googleCalendar.deleteEvent(event.googleEventId)
        
        // Wait a moment for Google Calendar to process the deletion, then reload
        setTimeout(async () => {
          await loadCalendarEvents()
        }, 1000)
      } else {
        // Delete from local dummy data
        const updatedEvents = events.filter(e => e.id !== event.id)
        setEvents(updatedEvents)
        
        // Also remove from dummy data for persistence
        const dummyIndex = dummyData.calendarEvents.findIndex(e => e.id === event.id)
        if (dummyIndex !== -1) {
          dummyData.calendarEvents.splice(dummyIndex, 1)
        }
      }
      
      closeModal()
    } catch (err) {
      console.error('Failed to delete event:', err)
      setError('Failed to delete event')
    } finally {
      setIsLoading(false)
    }
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

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsLoading(true)
      
      if (isConnected) {
        // Create event in Google Calendar
        // Create DateTime string in local timezone format without UTC conversion
        const [year, month, day] = formData.date.split('-')
        const [hours, minutes] = formData.time.split(':')
        
        // Create ISO string manually to avoid timezone conversion
        const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}:00`
        const endHour = (parseInt(hours) + 1).toString().padStart(2, '0')
        const endDateTime = `${year}-${month}-${day}T${endHour}:${minutes}:00`
        
        console.log('📅 Creating event:', {
          formDate: formData.date,
          formTime: formData.time,
          startDateTime,
          endDateTime
        })
        
        await googleCalendar.createEvent({
          title: formData.title,
          description: formData.description,
          startDateTime,
          endDateTime,
          location: formData.description || undefined,
          clientType: formData.clientType || undefined,
          clientId: formData.clientId || undefined
        })
        
        // Wait a moment for Google Calendar to process the creation, then reload
        setTimeout(async () => {
          await loadCalendarEvents()
        }, 1000)
      } else {
        // Fallback: create in dummy data
        const formatTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':')
          const hour = parseInt(hours)
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return `${displayHour}:${minutes} ${ampm}`
        }

        const newEvent = {
          id: Date.now(),
          title: formData.title,
          date: formData.date,
          time: formatTime(formData.time),
          type: formData.eventType,
          location: formData.description || 'TBD',
          clientType: formData.clientType || '',
          clientId: formData.clientId || '',
          priority: formData.priority
        }

        setEvents([...events, newEvent])
        dummyData.calendarEvents.push(newEvent)
      }
      
      closeCreateModal()
    } catch (err) {
      console.error('Failed to save event:', err)
      setError('Failed to save event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!formData.title || !formData.date || !formData.time || !selectedEvent) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsLoading(true)
      
      if (isConnected && selectedEvent.googleEventId) {
        // Update event in Google Calendar
        // Create DateTime string in local timezone format without UTC conversion
        const [year, month, day] = formData.date.split('-')
        const [hours, minutes] = formData.time.split(':')
        
        // Create ISO string manually to avoid timezone conversion
        const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}:00`
        const endHour = (parseInt(hours) + 1).toString().padStart(2, '0')
        const endDateTime = `${year}-${month}-${day}T${endHour}:${minutes}:00`
        
        await googleCalendar.updateEvent(selectedEvent.googleEventId, {
          title: formData.title,
          description: formData.description,
          startDateTime,
          endDateTime,
          location: formData.description || undefined,
          clientType: formData.clientType || undefined,
          clientId: formData.clientId || undefined
        })
        
        // Wait a moment for Google Calendar to process the update, then reload
        setTimeout(async () => {
          await loadCalendarEvents()
        }, 1000)
      } else {
        // Fallback: update in dummy data
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
          clientType: formData.clientType || '',
          clientId: formData.clientId || '',
          priority: formData.priority
        }

        setEvents(events.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        ))
        
        const index = dummyData.calendarEvents.findIndex(e => e.id === selectedEvent.id)
        if (index !== -1) {
          dummyData.calendarEvents[index] = updatedEvent
        }
      }
      
      closeEditModal()
    } catch (err) {
      console.error('Failed to update event:', err)
      setError('Failed to update event')
    } finally {
      setIsLoading(false)
    }
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-800">This Week's Calendar</h3>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="size-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected to Google Calendar</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Using demo data</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isConnected ? (
                <Button
                  onClick={handleConnectCalendar}
                  disabled={isLoading}
                  className="bg-[#3B7097] hover:bg-[#3B7097]/90 text-white text-sm px-3 py-1.5 h-auto"
                >
                  {isLoading ? 'Connecting...' : 'Connect Calendar'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnectCalendar}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-2 py-1.5 h-auto"
                >
                  Disconnect
                </Button>
              )}
              <Button
                onClick={handleAddEvent}
                disabled={isLoading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 h-auto"
              >
                <Plus className="size-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
        
        {/* Calendar Content - Full Height */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-7 gap-4 h-full">
            {days.map((day, index) => (
              <div key={index} className="text-center flex flex-col h-full">
                <div className={`p-3 rounded-t-lg border-b-2 flex-shrink-0 ${
                  isToday(day) ? 'bg-[#3B7097] text-white border-[#3B7097]' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  <div className="text-sm font-semibold">
                    {formatDate(day)}
                  </div>
                </div>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-0 bg-gray-50/50 rounded-b-lg">
                  {isLoading ? (
                    <div className="text-xs text-gray-400 italic py-4">Loading...</div>
                  ) : getEventsForDate(day).length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-8 text-center">No events</div>
                  ) : (
                    getEventsForDate(day).map((event) => (
                      <div 
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`p-3 rounded-lg text-sm ${getEventTypeColor(event.type, event.priority, event.clientType)} cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
                      >
                        <div className="font-semibold flex items-center justify-between mb-1">
                          <span className="text-xs">{event.time}</span>
                          {event.priority === 'high' && (
                            <AlertCircle className="size-3 text-[#c05e51]" />
                          )}
                        </div>
                        <div className="font-medium leading-tight text-sm">{event.title}</div>
                        {event.location && (
                          <div className="text-xs text-gray-600 mt-1 truncate">{event.location}</div>
                        )}
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
                  title="Edit Event"
                >
                  <Edit className="size-5" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete Event"
                >
                  <Trash2 className="size-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
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
                  <span className="px-2 py-1 bg-[#c05e51]/20 text-[#c05e51] text-xs rounded font-medium border border-[#c05e51]/40">
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