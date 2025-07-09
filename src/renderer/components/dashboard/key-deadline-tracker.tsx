import { Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function KeyDeadlineTracker() {
  const { keyDeadlines } = dummyData

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-[#c05e51]/10 border-[#c05e51]/30 text-gray-800'
      case 'high': return 'bg-[#c05e51]/10 border-[#c05e51]/30 text-gray-800'
      case 'medium': return 'bg-[#F6E2BC]/60 border-[#F6E2BC] text-gray-800'
      case 'low': return 'bg-[#A9D09E]/20 border-[#A9D09E]/30 text-gray-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="size-4 text-[#c05e51]" />
      case 'high': return <AlertCircle className="size-4 text-[#c05e51]" />
      case 'medium': return <Clock className="size-4 text-gray-700" />
      case 'low': return <Clock className="size-4 text-[#A9D09E]" />
      default: return <Clock className="size-4 text-gray-500" />
    }
  }

  const formatDaysRemaining = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `in ${days} days`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Key Deadline Tracker</h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-3">
          {keyDeadlines.map((deadline) => (
            <button
              key={deadline.id}
              className={`w-full p-4 rounded-lg border transition-all hover:shadow-md flex-shrink-0 ${getUrgencyColor(deadline.urgency)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getUrgencyIcon(deadline.urgency)}
                  <div className="text-left">
                    <div className="font-medium text-sm">
                      {deadline.type} - {deadline.client}
                    </div>
                    <div className="text-xs opacity-75">
                      {deadline.property}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatDaysRemaining(deadline.daysRemaining)}
                  </div>
                  <div className="text-xs opacity-75">
                    {deadline.urgency}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 