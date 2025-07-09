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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Market Snapshot</h3>
        <div className="text-sm text-gray-500">
          Zip {marketSnapshot.zipCode}
        </div>
      </div>
      
      <div className="space-y-4">
        {marketMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="flex items-center justify-between">
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
        
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Inventory Level
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              marketSnapshot.inventoryLevel === 'Low' ? 'bg-red-100 text-red-800' :
              marketSnapshot.inventoryLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {marketSnapshot.inventoryLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 