/**
 * Simple application routing for Electron app
 * Uses standard state-based navigation
 */

import { useState } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimatorScreen } from './screens/repair-estimator'
import { BuyersPortalScreen } from './screens/buyers-portal'
import { SellersPortalScreen } from './screens/sellers-portal'
import { LearnPortalScreen } from './screens/learn-portal'
import { MarketingPortalScreen } from './screens/marketing-portal'

export function App() {
  const [currentRoute, setCurrentRoute] = useState('/')
  
  // Simple navigation function
  const navigate = (path: string) => {
    setCurrentRoute(path)
  }

  // Make navigate available to child components
  const navigationProps = { navigate }

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case '/buyers-portal':
        return <BuyersPortalScreen {...navigationProps} />
      case '/sellers-portal':
        return <SellersPortalScreen {...navigationProps} />
      case '/learn-portal':
        return <LearnPortalScreen {...navigationProps} />
      case '/marketing-portal':
        return <MarketingPortalScreen {...navigationProps} />
      case '/repair-estimator':
        return <RepairEstimatorScreen />
      default:
        return <MainScreen {...navigationProps} />
    }
  }

  return (
    <Layout navigate={navigate} currentRoute={currentRoute}>
      {renderCurrentScreen()}
    </Layout>
  )
}
