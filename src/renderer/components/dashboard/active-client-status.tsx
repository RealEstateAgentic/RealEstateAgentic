import { Users, FileText, Calendar, CheckCircle } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function ActiveClientStatus() {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Client Status</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon
          return (
            <button
              key={index}
              className={`${card.color} ${card.textColor} rounded-lg p-4 text-left transition-transform hover:scale-105 hover:shadow-lg`}
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
  )
} 