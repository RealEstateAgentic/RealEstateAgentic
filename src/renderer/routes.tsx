/**
 * Simple application routing for Electron app
 * Uses browser history API for navigation
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimator } from './screens/repair-estimator'
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
