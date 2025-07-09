/**
 * Sellers Portal screen for managing all seller clients
 * Features a Kanban-style board with different stages
 */

interface SellersPortalScreenProps {
  navigate?: (path: string) => void
}

export function SellersPortalScreen({}: SellersPortalScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Sellers Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage all seller clients through their journey from appointment to closing. 
            This will feature a Kanban-style board with stages for Appointment Set, Listed, Under Contract, and Closed.
          </p>
          <div className="mt-8 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              🚧 This page is under construction and will be built later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 