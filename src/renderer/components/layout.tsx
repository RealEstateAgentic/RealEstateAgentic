/**
 * Layout component that provides the main application structure
 * Includes navigation bar and wraps page content
 */

import { ReactNode } from 'react'
import { Wrench } from 'lucide-react'
import { Button } from './ui/button'

interface LayoutProps {
  children: ReactNode
  navigate: (path: string) => void
}

function Navigation({ navigate }: { navigate: (path: string) => void }) {
  const handleRepairEstimator = () => {
    navigate('/repair-estimator')
  }

  const handleHome = () => {
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <button 
          onClick={handleHome}
          className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors"
        >
          Real Estate Agentic
        </button>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRepairEstimator}
            className="flex items-center gap-2"
          >
            <Wrench className="size-4" />
            Repair Estimator
          </Button>
        </div>
      </div>
    </nav>
  )
}

export function Layout({ children, navigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <Navigation navigate={navigate} />
      <main>
        {children}
      </main>
    </div>
  )
} 