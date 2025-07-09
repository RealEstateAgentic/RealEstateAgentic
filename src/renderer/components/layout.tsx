/**
 * Layout component that provides the main application structure
 * Includes navigation bar and wraps page content
 */

import { ReactNode, useState } from 'react'
import { Search, Bell, User, Brain, ChevronDown, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { dummyData } from '../data/dummy-data'
import type { AgentProfile } from '../../shared/types'

interface LayoutProps {
  children: ReactNode
  navigate: (path: string) => void
  currentRoute: string
  currentUser?: AgentProfile | null
  userType?: 'agent' | null
  isAuthenticated?: boolean
  onLogout?: () => void
}

function Navigation({
  navigate,
  currentRoute,
  currentUser,
  userType,
  isAuthenticated,
  onLogout,
}: {
  navigate: (path: string) => void
  currentRoute: string
  currentUser?: AgentProfile | null
  userType?: 'agent' | null
  isAuthenticated?: boolean
  onLogout?: () => void
}) {
  const [isSecondBrainOpen, setIsSecondBrainOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/buyers-portal', label: 'Buyers Portal' },
    { path: '/sellers-portal', label: 'Sellers Portal' },
    { path: '/learn-portal', label: 'Learn Portal' },
    { path: '/marketing-portal', label: 'Marketing Portal' },
    { path: '/repair-estimator', label: 'Repair Estimator' },
  ]

  const unreadNotifications = dummyData.notifications.filter(
    n => !n.read
  ).length

  const handleSecondBrainToggle = () => {
    // If a client is already selected, deactivate the feature
    if (selectedClient) {
      setSelectedClient(null)
      setIsSecondBrainOpen(false)
    } else {
      // If no client is selected, open the dropdown
      setIsSecondBrainOpen(!isSecondBrainOpen)
    }
  }

  const handleClientSelect = (clientName: string) => {
    setSelectedClient(clientName)
    setIsSecondBrainOpen(false)
  }

  // Mock client names for Second Brain dropdown
  const activeClients = [
    'Miller Family',
    'Davis Family',
    'Thompson Family',
    'Wilson Family',
    'Johnson Family',
    'Chen Family',
    'Martinez Family',
    'Williams Family',
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 relative z-50">
      <div className="flex items-center justify-between max-w-full mx-auto">
        {/* Logo/Brand */}
        <button
          onClick={() => navigate('/')}
          className="text-lg font-semibold text-gray-800 hover:text-[#3B7097] transition-colors"
        >
          Real Estate Agentic
        </button>

        {/* Main Navigation */}
        <div className="flex items-center space-x-6">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentRoute === item.path
                  ? 'text-[#3B7097] border-b-2 border-[#3B7097]'
                  : 'text-gray-600 hover:text-[#3B7097]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <input
              type="text"
              placeholder="Search clients, properties, documents..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
            />
          </div>

          {/* Second Brain Activation */}
          <div className="relative">
            <Button
              onClick={handleSecondBrainToggle}
              className={`flex items-center gap-2 ${
                selectedClient
                  ? 'bg-[#A9D09E] hover:bg-[#A9D09E]/90'
                  : 'bg-[#3B7097] hover:bg-[#3B7097]/90'
              }`}
            >
              <Brain className="size-4" />
              {selectedClient ? `Active: ${selectedClient}` : 'Second Brain'}
              <ChevronDown className="size-3" />
            </Button>

            {isSecondBrainOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    Select Active Client
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {activeClients.map(client => (
                    <button
                      key={client}
                      onClick={() => handleClientSelect(client)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {client}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="size-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </div>

          {/* User Profile */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                ({userType})
              </span>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth/agent')}
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export function Layout({
  children,
  navigate,
  currentRoute,
  currentUser,
  userType,
  isAuthenticated,
  onLogout,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        navigate={navigate}
        currentRoute={currentRoute}
        currentUser={currentUser}
        userType={userType}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
      />
      <main className="h-[calc(100vh-70px)] overflow-hidden">{children}</main>
    </div>
  )
}
