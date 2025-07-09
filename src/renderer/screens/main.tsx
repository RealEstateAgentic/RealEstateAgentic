/**
 * Main screen of the Real Estate Agentic application
 * Dashboard with all key widgets for real estate agents
 */

import { UrgentTodos } from '../components/dashboard/urgent-todos'
import { Calendar } from '../components/dashboard/calendar'
import { KeyDeadlineTracker } from '../components/dashboard/key-deadline-tracker'
import { RecentAIAnalyses } from '../components/dashboard/recent-ai-analyses'
import { MarketSnapshot } from '../components/dashboard/market-snapshot'
import { CombinedClientStatus } from '../components/dashboard/combined-client-status'

export function MainScreen() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Top Row - Calendar and Key Deadline Tracker */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-8 flex">
            <Calendar />
          </div>
          <div className="col-span-4 flex">
            <KeyDeadlineTracker />
          </div>
        </div>

        {/* Second Row - Urgent To-Dos and Combined Client Status */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-7 flex">
            <UrgentTodos />
          </div>
          <div className="col-span-5 flex">
            <CombinedClientStatus />
          </div>
        </div>

        {/* Bottom Row - Recent AI Analyses and Market Snapshot */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 flex">
            <RecentAIAnalyses />
          </div>
          <div className="col-span-5 flex">
            <MarketSnapshot />
          </div>
        </div>
      </div>
    </div>
  )
}
