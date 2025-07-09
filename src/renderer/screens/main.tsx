/**
 * Main screen of the Real Estate Agentic application
 * Dashboard with all key widgets for real estate agents
 */

import { UrgentTodos } from '../components/dashboard/urgent-todos'
import { Calendar } from '../components/dashboard/calendar'
import { NewLeads } from '../components/dashboard/new-leads'
import { ActiveClientStatus } from '../components/dashboard/active-client-status'
import { KeyDeadlineTracker } from '../components/dashboard/key-deadline-tracker'
import { RecentAIAnalyses } from '../components/dashboard/recent-ai-analyses'
import { MarketSnapshot } from '../components/dashboard/market-snapshot'

interface MainScreenProps {
  navigate?: (path: string) => void
}

export function MainScreen({}: MainScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Top Row - Urgent Todos and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="lg:col-span-1">
            <UrgentTodos />
          </div>
          <div className="lg:col-span-1">
            <Calendar />
          </div>
        </div>

        {/* Middle Row - New Leads, Active Client Status, Key Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <NewLeads />
          </div>
          <div className="lg:col-span-1">
            <ActiveClientStatus />
          </div>
          <div className="lg:col-span-1">
            <KeyDeadlineTracker />
          </div>
        </div>

        {/* Bottom Row - Recent AI Analyses and Market Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentAIAnalyses />
          </div>
          <div className="lg:col-span-1">
            <MarketSnapshot />
          </div>
        </div>
      </div>
    </div>
  )
}
