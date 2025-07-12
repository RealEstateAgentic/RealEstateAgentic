/**
 * Layout component that provides the main application structure
 * Includes navigation bar and wraps page content
 */

import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { Logo } from './ui/logo'
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
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/buyers-portal', label: 'Buyers Portal' },
    { path: '/sellers-portal', label: 'Sellers Portal' },
    { path: '/repair-estimator', label: 'Repair Estimator' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 relative z-50">
      <div className="flex items-center justify-between max-w-full mx-auto">
        {/* Logo/Brand */}
        <Logo onClick={() => navigate('/')} />

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
