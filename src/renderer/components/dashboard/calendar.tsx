import { dummyData } from '../../data/dummy-data'

export function Calendar() {
  const events = dummyData.calendarEvents
  
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
      case 'closing': return 'bg-[#3B7097] text-white'
      case 'inspection': return 'bg-[#F6E2BC] text-gray-800'
      case 'listing': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week</h3>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={index} className="text-center">
            <div className={`p-2 rounded-t-lg border-b ${
              isToday(day) ? 'bg-[#3B7097] text-white' : 'bg-gray-50 text-gray-700'
            }`}>
              <div className="text-xs font-medium">
                {formatDate(day)}
              </div>
            </div>
            <div className="min-h-[120px] p-2 space-y-1">
              {getEventsForDate(day).map((event) => (
                <div 
                  key={event.id}
                  className={`p-1 rounded text-xs ${getEventTypeColor(event.type)}`}
                >
                  <div className="font-medium">{event.time}</div>
                  <div className="truncate">{event.title}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 