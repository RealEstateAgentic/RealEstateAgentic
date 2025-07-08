/**
 * Main screen of the Real Estate Agentic application
 * Provides a clean welcome interface with quick access to key features
 */

import { Building } from 'lucide-react'

interface MainScreenProps {
  navigate?: (path: string) => void
}

export function MainScreen({ navigate }: MainScreenProps) {
  const handleRepairEstimator = () => {
    navigate?.('/repair-estimator')
  }

  return (
    <div className="text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building className="size-12 text-teal-400" />
            <h1 className="text-5xl font-bold text-teal-400">
              Real Estate Agentic
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            AI-powered tools for smarter real estate investment decisions
          </p>
        </div>
      </div>
    </div>
  )
}
