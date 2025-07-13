/**
 * Google Calendar Service
 * Handles Google Calendar API operations
 */

import { gmailAuth } from './gmail-auth'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  extendedProperties?: {
    private?: {
      clientType?: string
      clientId?: string
      agentId?: string
    }
  }
}

export interface CreateEventRequest {
  title: string
  description?: string
  startDateTime: string
  endDateTime: string
  location?: string
  clientType?: string
  clientId?: string
}

class GoogleCalendarService {
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3'
  
  /**
   * Check if user is authenticated for calendar access
   */
  public isAuthenticated(): boolean {
    return gmailAuth.isAuthenticated()
  }

  /**
   * Get events from the user's primary calendar for a date range
   */
  public async getEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const accessToken = await gmailAuth.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }

    // Default to current week if no range specified
    if (!timeMin) {
      const now = new Date()
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    }
    
    if (!timeMax) {
      const weekLater = new Date()
      weekLater.setDate(weekLater.getDate() + 7)
      timeMax = weekLater.toISOString()
    }

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50'
    })

    const response = await fetch(`${this.baseUrl}/calendars/primary/events?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  /**
   * Create a new event in the user's primary calendar
   */
  public async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    const accessToken = await gmailAuth.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }

    // Calculate end time if not provided (default to 1 hour)
    const startTime = new Date(eventData.startDateTime)
    const endTime = new Date(eventData.endDateTime || new Date(startTime.getTime() + 60 * 60 * 1000))
    
    // Get local timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: timeZone
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: timeZone
      },
      extendedProperties: {
        private: {
          clientType: eventData.clientType,
          clientId: eventData.clientId,
          agentId: gmailAuth.getUserEmail() || 'unknown',
          createdBy: 'real-estate-app'
        }
      }
    }

    const response = await fetch(`${this.baseUrl}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update an existing calendar event
   */
  public async updateEvent(eventId: string, eventData: Partial<CreateEventRequest>): Promise<CalendarEvent> {
    const accessToken = await gmailAuth.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }

    // Get existing event first
    const existingEvent = await this.getEvent(eventId)
    
    const updatedEvent = {
      ...existingEvent,
      summary: eventData.title || existingEvent.summary,
      description: eventData.description || existingEvent.description,
      location: eventData.location || existingEvent.location,
    }

    // Update start/end times if provided
    if (eventData.startDateTime) {
      updatedEvent.start = {
        dateTime: eventData.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    if (eventData.endDateTime) {
      updatedEvent.end = {
        dateTime: eventData.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    // Update client association if provided
    if (eventData.clientType || eventData.clientId) {
      updatedEvent.extendedProperties = {
        ...updatedEvent.extendedProperties,
        private: {
          ...updatedEvent.extendedProperties?.private,
          clientType: eventData.clientType,
          clientId: eventData.clientId
        }
      }
    }

    const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedEvent)
    })

    if (!response.ok) {
      throw new Error(`Failed to update calendar event: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete a calendar event
   */
  public async deleteEvent(eventId: string): Promise<void> {
    const accessToken = await gmailAuth.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }

    const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok && response.status !== 410) { // 410 = already deleted
      throw new Error(`Failed to delete calendar event: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * Get a specific calendar event
   */
  public async getEvent(eventId: string): Promise<CalendarEvent> {
    const accessToken = await gmailAuth.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }

    const response = await fetch(`${this.baseUrl}/calendars/primary/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar event: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Format Google Calendar event for our app's display
   */
  public formatEventForDisplay(event: CalendarEvent) {
    const startDateTime = event.start.dateTime || event.start.date
    const startDate = new Date(startDateTime!)
    
    // Format date in local timezone to avoid UTC conversion issues
    const year = startDate.getFullYear()
    const month = String(startDate.getMonth() + 1).padStart(2, '0')
    const day = String(startDate.getDate()).padStart(2, '0')
    const localDate = `${year}-${month}-${day}`
    
    return {
      id: event.id,
      title: (event as any).summary || event.title || 'Untitled Event',
      date: localDate,
      time: event.start.dateTime ? 
        startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : 'All Day',
      type: this.inferEventType(event),
      location: event.location || 'TBD',
      description: (event as any).description,
      clientType: event.extendedProperties?.private?.clientType || null,
      clientId: event.extendedProperties?.private?.clientId || null,
      googleEventId: event.id
    }
  }

  /**
   * Infer event type from title/description for color coding
   */
  private inferEventType(event: CalendarEvent): string {
    const title = ((event as any).summary || event.title || '').toLowerCase()
    const description = ((event as any).description || '').toLowerCase()
    const combined = `${title} ${description}`

    if (combined.includes('showing') || combined.includes('show')) return 'showing'
    if (combined.includes('consultation') || combined.includes('meeting')) return 'consultation'
    if (combined.includes('closing') || combined.includes('close')) return 'closing'
    if (combined.includes('inspection') || combined.includes('inspect')) return 'inspection'
    if (combined.includes('listing') || combined.includes('list')) return 'listing'
    
    return 'custom'
  }
}

export const googleCalendar = new GoogleCalendarService()