/**
 * Main screen of the AIgent Pro application
 * Displays the agent dashboard with all key features
 */

import { Calendar } from '../components/dashboard/calendar'

interface MainScreenProps {
  navigate?: (path: string) => void
}

export function MainScreen({ navigate }: MainScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="h-full px-4 py-4">
        {/* Calendar - Full Width with Minimal Margins */}
        <div className="h-full">
          <Calendar />
        </div>
      </div>
    </div>
  )
}
