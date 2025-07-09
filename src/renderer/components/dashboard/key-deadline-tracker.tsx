import { Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function KeyDeadlineTracker() {
  const { keyDeadlines } = dummyData

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="size-4 text-red-500" />
      case 'high': return <AlertCircle className="size-4 text-orange-500" />
      case 'medium': return <Clock className="size-4 text-yellow-500" />
      case 'low': return <Clock className="size-4 text-green-500" />
      default: return <Clock className="size-4 text-gray-500" />
    }
  }

  const formatDaysRemaining = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `in ${days} days`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Deadline Tracker</h3>
      
      <div className="space-y-3">
        {keyDeadlines.map((deadline) => (
          <button
            key={deadline.id}
            className={`w-full p-4 rounded-lg border transition-all hover:shadow-md ${getUrgencyColor(deadline.urgency)}`}
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
  )
} 