import { Users, FileText, Calendar, CheckCircle } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'
import { NewLeads } from './new-leads'

export function CombinedClientStatus() {
  const { activeClients } = dummyData

  const statusCards = [
    {
      label: 'Active Buyers',
      value: activeClients.activeBuyers,
      icon: Users,
      color: 'bg-[#75BDE0]',
      textColor: 'text-white'
    },
    {
      label: 'Active Sellers',
      value: activeClients.activeSellers,
      icon: FileText,
      color: 'bg-[#A9D09E]',
      textColor: 'text-white'
    },
    {
      label: 'Under Contract',
      value: activeClients.underContract,
      icon: Calendar,
      color: 'bg-[#3B7097]',
      textColor: 'text-white'
    },
    {
      label: 'Closing This Week',
      value: activeClients.closingThisWeek,
      icon: CheckCircle,
      color: 'bg-[#F6E2BC]',
      textColor: 'text-gray-800'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
      {/* Fixed Header with New Leads */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0 space-y-4">
        {/* New Leads Button */}
        <NewLeads />
        
        {/* Active Client Status Title */}
        <h3 className="text-lg font-semibold text-gray-800">Active Client Status</h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon
            return (
              <button
                key={index}
                className={`${card.color} ${card.textColor} rounded-lg p-4 text-left transition-transform hover:scale-105 hover:shadow-lg flex-shrink-0`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-sm opacity-90">{card.label}</div>
                  </div>
                  <Icon className="size-8 opacity-80" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 