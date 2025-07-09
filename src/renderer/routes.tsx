/**
 * Simple application routing for Electron app
 * Uses browser history API for navigation
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimator } from './screens/repair-estimator'
import { BuyersPortalScreen } from './screens/buyers-portal'
import { BuyersArchiveScreen } from './screens/buyers-archive'
import { SellersPortalScreen } from './screens/sellers-portal'
import { LearnPortalScreen } from './screens/learn-portal'
import { MarketingPortalScreen } from './screens/marketing-portal'

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
      case '/buyers-portal':
        return <BuyersPortalScreen {...navigationProps} />
      case '/buyers-archive':
        return <BuyersArchiveScreen {...navigationProps} />
      case '/sellers-portal':
        return <SellersPortalScreen {...navigationProps} />
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
    <Layout navigate={navigate} currentRoute={currentRoute}>
      {renderCurrentScreen()}
    </Layout>
  )
}
