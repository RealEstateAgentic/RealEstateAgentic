/**
 * Simple application routing for Electron app
 * Uses standard state-based navigation
 */

import { useState } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimatorScreen } from './screens/repair-estimator'

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
      case '/repair-estimator':
        return <RepairEstimatorScreen />
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
