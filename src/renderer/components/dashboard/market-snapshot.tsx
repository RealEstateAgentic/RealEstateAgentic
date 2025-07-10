import { TrendingUp, TrendingDown, Home, Calendar, List } from 'lucide-react'
import { dummyData } from '../../data/dummy-data'

export function MarketSnapshot() {
  const { marketSnapshot } = dummyData

  const marketMetrics = [
    {
      label: 'Median Sale Price',
      value: marketSnapshot.medianSalePrice,
      icon: Home,
      change: marketSnapshot.priceChange,
      isPositive: marketSnapshot.priceChange.startsWith('+')
    },
    {
      label: 'Avg Days on Market',
      value: marketSnapshot.averageDaysOnMarket,
      icon: Calendar,
      change: null,
      isPositive: null
    },
    {
      label: 'New Listings',
      value: marketSnapshot.newListingsThisWeek,
      icon: List,
      change: 'This Week',
      isPositive: null
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Market Snapshot</h3>
          <div className="text-sm text-gray-500">
            Zip {marketSnapshot.zipCode}
          </div>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {marketMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#F6E2BC] rounded-lg">
                    <Icon className="size-4 text-gray-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {metric.label}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-800">
                    {metric.value}
                  </div>
                  {metric.change && (
                    <div className="flex items-center space-x-1 text-xs">
                      {metric.isPositive === true && (
                        <TrendingUp className="size-3 text-green-500" />
                      )}
                      {metric.isPositive === false && (
                        <TrendingDown className="size-3 text-red-500" />
                      )}
                      <span className={`${
                        metric.isPositive === true ? 'text-green-600' : 
                        metric.isPositive === false ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          <div className="pt-3 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Inventory Level
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                marketSnapshot.inventoryLevel === 'Low' ? 'bg-[#c05e51]/10 text-gray-800 border border-[#c05e51]/30' :
                marketSnapshot.inventoryLevel === 'Medium' ? 'bg-[#F6E2BC]/60 text-gray-800 border border-[#F6E2BC]' :
                'bg-[#A9D09E]/20 text-gray-800 border border-[#A9D09E]/30'
              }`}>
                {marketSnapshot.inventoryLevel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 