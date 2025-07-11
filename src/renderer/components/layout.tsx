/**
 * Layout component that provides the main application structure
 * Includes navigation bar and wraps page content
 */

import { ReactNode, useState } from 'react'
import { Search, Bell, User, ChevronDown, LogOut } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/buyers-portal', label: 'Buyers Portal' },
    { path: '/sellers-portal', label: 'Sellers Portal' },
    { path: '/repair-estimator', label: 'Repair Estimator' },
  ]

  const unreadNotifications = dummyData.notifications.filter(
    n => !n.read
  ).length

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

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
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search clients, documents..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7097] focus:border-transparent"
              />
            </form>
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
