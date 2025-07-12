/**
 * Add New Leads Component for Dashboard
 * Replaces the Market Snapshot with buttons to add new buyer and seller leads
 */

import { Users, UserPlus, Home, TrendingUp } from 'lucide-react'
import { Button } from '../ui/button'

interface AddNewLeadsProps {
  navigate?: (path: string) => void
}

export function AddNewLeads({ navigate }: AddNewLeadsProps) {
  const handleAddBuyerLead = () => {
    if (navigate) {
      navigate('/buyers-portal?action=newLead')
    }
  }

  const handleAddSellerLead = () => {
    if (navigate) {
      navigate('/sellers-portal?action=newLead')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-[#3B7097]/10 rounded-lg">
            <UserPlus className="size-5 text-[#3B7097]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Add New Leads</h3>
            <p className="text-sm text-gray-600">Create new client leads</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Add New Buyer Lead Button */}
        <Button
          onClick={handleAddBuyerLead}
          className="w-full bg-[#3B7097] hover:bg-[#3B7097]/90 text-white flex items-center justify-center gap-3 py-4 h-auto"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <Home className="size-5" />
          </div>
          <div className="text-left">
            <div className="font-medium">Add New Buyer Lead</div>
            <div className="text-sm opacity-90">Create a new buyer client</div>
          </div>
        </Button>

        {/* Add New Seller Lead Button */}
        <Button
          onClick={handleAddSellerLead}
          className="w-full bg-[#A9D09E] hover:bg-[#A9D09E]/90 text-gray-900 flex items-center justify-center gap-3 py-4 h-auto"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <TrendingUp className="size-5" />
          </div>
          <div className="text-left">
            <div className="font-medium">Add New Seller Lead</div>
            <div className="text-sm opacity-75">Create a new seller client</div>
          </div>
        </Button>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Active Buyers</div>
              <div className="text-lg font-semibold text-[#3B7097]">12</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Sellers</div>
              <div className="text-lg font-semibold text-[#A9D09E]">8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 