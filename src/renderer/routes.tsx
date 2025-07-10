/**
 * Application routing with authentication integration
 * Routes users to appropriate portals based on their role
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimator } from './screens/repair-estimator'
import { BuyersPortalScreen } from './screens/buyers-portal'
import { BuyersArchiveScreen } from './screens/buyers-archive'
import { SellersPortalScreen } from './screens/sellers-portal'
import { SellersPortalV2Screen } from './screens/sellers-portal-v2'
import { SellersArchiveScreen } from './screens/sellers-archive'
import { LearnPortalScreen } from './screens/learn-portal'
import { MarketingPortalScreen } from './screens/marketing-portal'
import { AgentDashboardScreen } from './screens/agent-dashboard'
import { AgentAuthWrapper } from './components/auth/AgentAuth'
import type { AgentProfile } from '../shared/types'

export function App() {
  const [currentRoute, setCurrentRoute] = useState('/')
  const [currentUser, setCurrentUser] = useState<AgentProfile | null>(null)
  const [userType, setUserType] = useState<'agent' | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize route from current URL
  useEffect(() => {
    setCurrentRoute(window.location.pathname)

    // Listen for back/forward navigation
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Simple navigation function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentRoute(path)
  }

  // Authentication handlers
  const handleAgentAuthenticated = (profile: AgentProfile) => {
    setCurrentUser(profile)
    setUserType('agent')
    setIsAuthenticated(true)
    navigate('/agent-dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setUserType(null)
    setIsAuthenticated(false)
    navigate('/')
  }

  // Make navigate available to child components
  const navigationProps = { navigate }

  const renderCurrentScreen = () => {
    // Authentication routes
    if (currentRoute === '/auth/agent') {
      return <AgentAuthWrapper onAuthenticated={handleAgentAuthenticated} />
    }

    // Protected routes - require authentication
    if (currentRoute.startsWith('/repair-estimator')) {
      return <RepairEstimator />
    }

    switch (currentRoute) {
      case '/buyers-portal':
        // Protected route - only agents can access
        if (isAuthenticated && userType === 'agent') {
          return (
            <BuyersPortalScreen
              {...navigationProps}
              currentUser={currentUser}
              userType={userType}
            />
          )
        }
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to access the Buyers Portal
            </p>
            <button
              onClick={() => navigate('/auth/agent')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )

      case '/buyers-archive':
        if (isAuthenticated && userType === 'agent') {
          return (
            <BuyersArchiveScreen
              {...navigationProps}
              currentUser={currentUser}
              userType={userType}
            />
          )
        }
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to access the Buyers Archive
            </p>
            <button
              onClick={() => navigate('/auth/agent')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )

      case '/sellers-portal':
        // Protected route - only agents can access
        if (isAuthenticated && userType === 'agent') {
          return (
            <SellersPortalV2Screen
              {...navigationProps}
              currentUser={currentUser}
              userType={userType}
            />
          )
        }
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to access the Sellers Portal
            </p>
            <button
              onClick={() => navigate('/auth/agent')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )

      case '/sellers-archive':
        if (isAuthenticated && userType === 'agent') {
          return (
            <SellersArchiveScreen
              {...navigationProps}
              currentUser={currentUser}
              userType={userType}
            />
          )
        }
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to access the Sellers Archive
            </p>
            <button
              onClick={() => navigate('/auth/agent')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )

      case '/agent-dashboard':
        if (isAuthenticated && userType === 'agent' && currentUser) {
          return (
            <AgentDashboardScreen
              navigate={navigate}
              currentUser={currentUser as AgentProfile}
              onLogout={handleLogout}
            />
          )
        }
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to access the Dashboard
            </p>
            <button
              onClick={() => navigate('/auth/agent')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )

      case '/learn-portal':
        return <LearnPortalScreen {...navigationProps} />
      case '/marketing-portal':
        return <MarketingPortalScreen {...navigationProps} />
      case '/repair-estimator':
        return <RepairEstimator />
      default:
        return <MainScreen />
    }
  }

  return (
    <Layout
      navigate={navigate}
      currentRoute={currentRoute}
      currentUser={currentUser}
      userType={userType}
      isAuthenticated={isAuthenticated}
      onLogout={handleLogout}
    >
      {renderCurrentScreen()}
    </Layout>
  )
}
