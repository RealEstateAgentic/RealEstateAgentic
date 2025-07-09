/**
 * Main screen of the Real Estate Agentic application
 * Provides a clean welcome interface with quick access to key features
 */

import { Building, Wrench, Users, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'

interface MainScreenProps {
  navigate?: (path: string) => void
}

export function MainScreen({ navigate }: MainScreenProps) {
  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path)
    if (navigate) {
      navigate(path)
    }
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 rounded-lg p-8 hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="size-8 text-teal-400" />
              <h3 className="text-xl font-semibold">Repair Estimator</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Generate detailed repair estimates for investment properties
            </p>
            <Button
              onClick={() => handleNavigation('/repair-estimator')}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Open Tool
            </Button>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Users className="size-8 text-teal-400" />
              <h3 className="text-xl font-semibold">Agent Portal</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Access agent tools and client management features
            </p>
            <Button
              onClick={() => handleNavigation('/auth/agent')}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Sign In
            </Button>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="size-8 text-teal-400" />
              <h3 className="text-xl font-semibold">Client Portal</h3>
            </div>
            <p className="text-gray-400 mb-6">
              View documents and track your real estate transactions
            </p>
            <Button
              onClick={() => handleNavigation('/auth/client')}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Test Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              console.log('Test button clicked!')
              alert('Button click works!')
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Test Click (Should Show Alert)
          </Button>
        </div>
      </div>
    </div>
  )
}
