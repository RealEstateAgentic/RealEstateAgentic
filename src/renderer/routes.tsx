/**
 * Simple application routing for Electron app
 * Uses browser history API for navigation
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimator } from './screens/repair-estimator'

export function App() {
  const [currentRoute, setCurrentRoute] = useState('/')
  
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
    <Layout navigate={navigate}>
      {renderCurrentScreen()}
    </Layout>
  )
}
