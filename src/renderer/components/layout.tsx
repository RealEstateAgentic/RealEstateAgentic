/**
 * Enhanced Layout component that provides the main application structure
 * Includes navigation bar, user authentication state, and wraps page content
 * with support for the new offer preparation and negotiation features
 */

import type { ReactNode } from 'react'
import {
  Wrench,
  User,
  LogOut,
  FileText,
  MessageSquare,
  TrendingUp,
  Home,
  ChevronLeft,
} from 'lucide-react'
import { Button } from './ui/button'
import type { AgentProfile, ClientProfile } from '../../shared/types'

interface LayoutProps {
  children: ReactNode
  navigate: (path: string, params?: any) => void
  goBack: () => void
  currentUser: AgentProfile | ClientProfile | null
  userType: 'agent' | 'client' | null
  onLogout: () => void
}

function Navigation({
  navigate,
  goBack,
  currentUser,
  userType,
  onLogout,
}: Omit<LayoutProps, 'children'>) {
  const handleHome = () => {
    if (currentUser) {
      navigate(userType === 'agent' ? '/agent-dashboard' : '/client-dashboard')
    } else {
      navigate('/')
    }
  }

  const getNavigationItems = () => {
    if (!currentUser) return []

    if (userType === 'agent') {
      return [
        {
          label: 'Dashboard',
          icon: Home,
          path: '/agent-dashboard',
        },
        {
          label: 'Negotiations',
          icon: MessageSquare,
          path: '/negotiations',
        },
        {
          label: 'Offers',
          icon: FileText,
          path: '/offers',
        },
        {
          label: 'Documents',
          icon: FileText,
          path: '/documents',
        },
        {
          label: 'Tools',
          icon: Wrench,
          path: '/repair-estimator',
        },
      ]
    } else {
      return [
        {
          label: 'Dashboard',
          icon: Home,
          path: '/client-dashboard',
        },
        {
          label: 'Negotiations',
          icon: MessageSquare,
          path: '/client-negotiations',
        },
        {
          label: 'Documents',
          icon: FileText,
          path: '/client-documents',
        },
      ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand with Back Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={goBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            title="Go Back"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <button
            onClick={handleHome}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleHome()
              }
            }}
            className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
          >
            Real Estate Agentic
          </button>
        </div>

        {/* Main Navigation */}
        {currentUser && (
          <div className="flex items-center space-x-6">
            {navigationItems.map(item => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        )}

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="size-4" />
                <span className="text-sm">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="px-2 py-1 bg-gray-700 text-xs rounded-full">
                  {userType?.toUpperCase()}
                </span>
              </div>

              <Button
                onClick={() => navigate('/profile')}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
              >
                <User className="size-4" />
              </Button>

              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-red-400"
                title="Logout"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate('/auth/agent')}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
              >
                Agent Sign In
              </Button>
              <Button
                onClick={() => navigate('/auth/client')}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
              >
                Client Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

// ========== BREADCRUMB COMPONENT ==========

interface BreadcrumbProps {
  currentRoute: string
  navigate: (path: string) => void
  userType: 'agent' | 'client' | null
}

function Breadcrumb({ currentRoute, navigate, userType }: BreadcrumbProps) {
  const getBreadcrumbItems = () => {
    const items = []

    if (userType === 'agent') {
      items.push({ label: 'Dashboard', path: '/agent-dashboard' })
    } else if (userType === 'client') {
      items.push({ label: 'Dashboard', path: '/client-dashboard' })
    }

    switch (currentRoute) {
      case '/negotiations':
        items.push({ label: 'Negotiations', path: '/negotiations' })
        break
      case '/offers':
        items.push({ label: 'Offers', path: '/offers' })
        break
      case '/documents':
        items.push({ label: 'Documents', path: '/documents' })
        break
      case '/offer-create':
        items.push({ label: 'Offers', path: '/offers' })
        items.push({ label: 'Create Offer', path: '/offer-create' })
        break
      case '/document-generator':
        items.push({ label: 'Documents', path: '/documents' })
        items.push({ label: 'Generate Documents', path: '/document-generator' })
        break
      case '/appraisal-scenarios':
        items.push({ label: 'Negotiations', path: '/negotiations' })
        items.push({
          label: 'Appraisal Scenarios',
          path: '/appraisal-scenarios',
        })
        break
      case '/client-negotiations':
        items.push({ label: 'My Negotiations', path: '/client-negotiations' })
        break
      case '/client-documents':
        items.push({ label: 'My Documents', path: '/client-documents' })
        break
    }

    return items
  }

  const breadcrumbItems = getBreadcrumbItems()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <div key={item.path} className="flex items-center space-x-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <button
                  onClick={() => navigate(item.path)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(item.path)
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ========== MAIN LAYOUT COMPONENT ==========

export function Layout({
  children,
  navigate,
  goBack,
  currentUser,
  userType,
  onLogout,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        navigate={navigate}
        goBack={goBack}
        currentUser={currentUser}
        userType={userType}
        onLogout={onLogout}
      />

      <Breadcrumb
        currentRoute={window.location.pathname || '/'}
        navigate={navigate}
        userType={userType}
      />

      <main className="min-h-[calc(100vh-120px)]">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                © 2024 Real Estate Agentic. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <button
                onClick={() => navigate('/help')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate('/help')
                  }
                }}
                className="hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
              >
                Help
              </button>
              <button
                onClick={() => navigate('/support')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate('/support')
                  }
                }}
                className="hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
