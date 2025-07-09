/**
 * Simple application routing for Electron app
 * Uses browser history API for navigation
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimator } from './screens/repair-estimator'
import { AgentAuthWrapper } from './components/auth/AgentAuth'
import { ClientAuthWrapper } from './components/auth/ClientAuth'
import type { AgentProfile, ClientProfile } from '../shared/types'

export function App() {
  const [currentRoute, setCurrentRoute] = useState('/')
  const [currentUser, setCurrentUser] = useState<
    AgentProfile | ClientProfile | null
  >(null)
  const [userType, setUserType] = useState<'agent' | 'client' | null>(null)

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

  // Go back function
  const goBack = () => {
    window.history.back()
  }

  // Logout function
  const onLogout = () => {
    setCurrentUser(null)
    setUserType(null)
    navigate('/')
  }

  // Make navigate available to child components
  const navigationProps = { navigate }

  const renderCurrentScreen = () => {
    if (currentRoute.startsWith('/repair-estimator')) {
      return <RepairEstimator />
    }

    switch (currentRoute) {
      case '/':
        return <MainScreen {...navigationProps} />
      case '/auth/agent':
        return (
          <AgentAuthWrapper
            onAuthenticated={profile => {
              setCurrentUser(profile)
              setUserType('agent')
              navigate('/agent-dashboard')
            }}
            onSwitchToClient={() => navigate('/auth/client')}
          />
        )
      case '/auth/client':
        return (
          <ClientAuthWrapper
            onAuthenticated={profile => {
              setCurrentUser(profile)
              setUserType('client')
              navigate('/client-dashboard')
            }}
            onSwitchToAgent={() => navigate('/auth/agent')}
          />
        )
      case '/agent-dashboard':
        return currentUser && userType === 'agent' ? (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
            <p>Welcome, {currentUser.displayName || currentUser.email}!</p>
            <p className="text-gray-400 mt-2">
              Dashboard features coming soon...
            </p>
          </div>
        ) : (
          <MainScreen {...navigationProps} />
        )
      case '/client-dashboard':
        return currentUser && userType === 'client' ? (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
            <p>Welcome, {currentUser.displayName || currentUser.email}!</p>
            <p className="text-gray-400 mt-2">
              Dashboard features coming soon...
            </p>
          </div>
        ) : (
          <MainScreen {...navigationProps} />
        )
      case '/profile':
        return currentUser ? (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">User Information</h2>
              <p>
                <strong>Name:</strong> {currentUser.displayName || 'Not set'}
              </p>
              <p>
                <strong>Email:</strong> {currentUser.email}
              </p>
              <p>
                <strong>Role:</strong> {userType?.toUpperCase()}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
            <p>Please sign in to view your profile.</p>
            <div className="mt-4 space-x-4">
              <button
                onClick={() => navigate('/auth/agent')}
                className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white"
              >
                Agent Sign In
              </button>
              <button
                onClick={() => navigate('/auth/client')}
                className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white"
              >
                Client Sign In
              </button>
            </div>
          </div>
        )
      case '/help':
        return (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Help & Documentation</h1>
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Getting Started</h2>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    • Sign in as an Agent or Client to access specialized
                    features
                  </li>
                  <li>
                    • Use the Repair Estimator to calculate property improvement
                    costs
                  </li>
                  <li>• Generate professional documents and reports</li>
                </ul>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Features</h2>
                <ul className="space-y-2 text-gray-300">
                  <li>• AI-powered document generation</li>
                  <li>• Property analysis and market data</li>
                  <li>• Secure document sharing</li>
                  <li>• Professional branding tools</li>
                </ul>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )
      case '/support':
        return (
          <div className="text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Support & Contact</h1>
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
                <p className="text-gray-300 mb-4">
                  We're here to help you get the most out of Real Estate
                  Agentic.
                </p>
                <div className="space-y-3">
                  <div>
                    <strong>Email Support:</strong>
                    <p className="text-gray-300">
                      support@realestateagentic.com
                    </p>
                  </div>
                  <div>
                    <strong>Documentation:</strong>
                    <p className="text-gray-300">
                      Check our comprehensive guides and tutorials
                    </p>
                  </div>
                  <div>
                    <strong>Community:</strong>
                    <p className="text-gray-300">
                      Join our user community for tips and best practices
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Report an Issue</h2>
                <p className="text-gray-300 mb-4">
                  Found a bug or have a feature request? Let us know!
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                  Report Issue
                </button>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return <MainScreen {...navigationProps} />
    }
  }

  return (
    <Layout
      navigate={navigate}
      goBack={goBack}
      currentUser={currentUser}
      userType={userType}
      onLogout={onLogout}
    >
      {renderCurrentScreen()}
    </Layout>
  )
}
