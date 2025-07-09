/**
 * Learn Portal screen for agent education and training
 * Features educational modules and GPT On-Demand Coach
 */

interface LearnPortalScreenProps {
  navigate?: (path: string) => void
}

export function LearnPortalScreen({}: LearnPortalScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Learn Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access agent education modules, simulations, and the GPT On-Demand Coach. 
            This will be a future build-on feature for continuous learning and improvement.
          </p>
          <div className="mt-8 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              🚧 This is a future build-on feature and will be developed later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 