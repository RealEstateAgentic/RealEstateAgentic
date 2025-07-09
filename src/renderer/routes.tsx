/**
 * Enhanced application routing for Electron app
 * Uses state-based navigation with support for user roles and offer/negotiation workflows
 */

import { useState, useEffect } from 'react'
import { Layout } from './components/layout'
import { MainScreen } from './screens/main'
import { RepairEstimatorScreen } from './screens/repair-estimator'

// Authentication Components
import { AgentAuthWrapper } from './components/auth/AgentAuth'
import { ClientAuthWrapper } from './components/auth/ClientAuth'

// Offer & Negotiation Components
import { OfferForm } from './components/offers/OfferForm'
import { DocumentGenerator } from './components/documents/DocumentGenerator'
import { NegotiationDashboard } from './components/negotiations/NegotiationDashboard'
import { AppraisalScenarios } from './components/appraisal/AppraisalScenarios'
import {
  DocumentPreview,
  DocumentSelector,
} from './components/documents/DocumentPreview'

import type { AgentProfile, ClientProfile } from '../shared/types'
import type { Offer } from '../shared/types/offers'
import type { Negotiation } from '../shared/types/negotiations'

// ========== ROUTE TYPES ==========

export interface NavigationProps {
  navigate: (path: string, params?: any) => void
  goBack: () => void
  currentRoute: string
  routeParams?: any
}

export interface AppState {
  currentUser: AgentProfile | ClientProfile | null
  userType: 'agent' | 'client' | null
  currentOffer: Offer | null
  currentNegotiation: Negotiation | null
  routeHistory: Array<{ path: string; params?: any }>
}

// ========== MAIN APP COMPONENT ==========

export function App() {
  const [currentRoute, setCurrentRoute] = useState('/')
  const [routeParams, setRouteParams] = useState<any>(null)
  const [routeHistory, setRouteHistory] = useState<
    Array<{ path: string; params?: any }>
  >([{ path: '/' }])

  const [appState, setAppState] = useState<AppState>({
    currentUser: null,
    userType: null,
    currentOffer: null,
    currentNegotiation: null,
    routeHistory: [],
  })

  // Navigation function with history support
  const navigate = (path: string, params?: any) => {
    setCurrentRoute(path)
    setRouteParams(params)
    setRouteHistory(prev => [...prev, { path, params }])
  }

  // Go back function
  const goBack = () => {
    if (routeHistory.length > 1) {
      const newHistory = routeHistory.slice(0, -1)
      const previousRoute = newHistory[newHistory.length - 1]
      setRouteHistory(newHistory)
      setCurrentRoute(previousRoute.path)
      setRouteParams(previousRoute.params)
    } else {
      navigate('/')
    }
  }

  // Authentication handlers
  const handleAgentAuthenticated = (profile: AgentProfile) => {
    setAppState(prev => ({
      ...prev,
      currentUser: profile,
      userType: 'agent',
    }))
    navigate('/agent-dashboard')
  }

  const handleClientAuthenticated = (profile: ClientProfile) => {
    setAppState(prev => ({
      ...prev,
      currentUser: profile,
      userType: 'client',
    }))
    navigate('/client-dashboard')
  }

  const handleLogout = () => {
    setAppState({
      currentUser: null,
      userType: null,
      currentOffer: null,
      currentNegotiation: null,
      routeHistory: [],
    })
    navigate('/')
  }

  // Offer handlers
  const handleOfferCreated = (offer: Offer) => {
    setAppState(prev => ({ ...prev, currentOffer: offer }))
    navigate('/offer-success', { offer })
  }

  const handleOfferSelected = (offer: Offer) => {
    setAppState(prev => ({ ...prev, currentOffer: offer }))
    navigate('/offer-details', { offer })
  }

  // Negotiation handlers
  const handleNegotiationCreated = (negotiation: Negotiation) => {
    setAppState(prev => ({ ...prev, currentNegotiation: negotiation }))
    navigate('/negotiation-details', { negotiation })
  }

  const handleNegotiationSelected = (negotiation: Negotiation) => {
    setAppState(prev => ({ ...prev, currentNegotiation: negotiation }))
    navigate('/negotiation-details', { negotiation })
  }

  // Document handlers
  const handleDocumentGenerated = (result: any) => {
    navigate('/document-preview', { documentResult: result })
  }

  const handleDocumentSelected = (document: any) => {
    navigate('/document-editor', { document })
  }

  // Navigation props to pass to components
  const navigationProps: NavigationProps = {
    navigate,
    goBack,
    currentRoute,
    routeParams,
  }

  // Route rendering function
  const renderCurrentScreen = () => {
    // Authentication routes
    if (currentRoute === '/auth/agent') {
      return (
        <AgentAuthWrapper
          onAuthenticated={handleAgentAuthenticated}
          onSwitchToClient={() => navigate('/auth/client')}
        />
      )
    }

    if (currentRoute === '/auth/client') {
      return (
        <ClientAuthWrapper
          onAuthenticated={handleClientAuthenticated}
          onSwitchToAgent={() => navigate('/auth/agent')}
        />
      )
    }

    // Protected routes - require authentication
    if (!appState.currentUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Real Estate Agentic
            </h1>
            <p className="text-gray-600 mb-8">Please sign in to continue</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/auth/agent')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign in as Agent
              </button>
              <button
                onClick={() => navigate('/auth/client')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign in as Client
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Agent dashboard routes
    if (appState.userType === 'agent') {
      switch (currentRoute) {
        case '/agent-dashboard':
          return (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Agent Dashboard
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/negotiations')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate('/negotiations')
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Negotiations
                  </h2>
                  <p className="text-gray-600">
                    Manage active negotiations and strategies
                  </p>
                </div>
                <div
                  className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/offers')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate('/offers')
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Offers
                  </h2>
                  <p className="text-gray-600">Create and manage offers</p>
                </div>
                <div
                  className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/documents')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate('/documents')
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Documents
                  </h2>
                  <p className="text-gray-600">Generate and manage documents</p>
                </div>
              </div>
            </div>
          )

        case '/negotiations':
          return (
            <NegotiationDashboard
              userProfile={appState.currentUser as AgentProfile}
              userType="agent"
              onNegotiationSelect={handleNegotiationSelected}
              onCreateNegotiation={() => navigate('/negotiation-create')}
            />
          )

        case '/offers':
          return (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
                <button
                  onClick={() => navigate('/offer-create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Offer
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600">Your offers will appear here</p>
              </div>
            </div>
          )

        case '/documents':
          return (
            <DocumentSelector
              documents={[]} // TODO: Load from state/API
              onDocumentSelect={handleDocumentSelected}
              onCreateNew={() => navigate('/document-generator')}
            />
          )

        case '/document-generator':
          return (
            <DocumentGenerator
              agentProfile={appState.currentUser as AgentProfile}
              clientProfile={routeParams?.clientProfile}
              offer={appState.currentOffer}
              negotiation={appState.currentNegotiation}
              onDocumentGenerated={handleDocumentGenerated}
              onCancel={() => goBack()}
            />
          )

        case '/offer-create':
          return (
            <OfferForm
              type="buyer_offer"
              agentProfile={appState.currentUser as AgentProfile}
              clientProfile={
                routeParams?.clientProfile || {
                  id: 'demo-client',
                  email: 'demo@example.com',
                  clientType: 'buyer',
                  personalInfo: {
                    firstName: 'Demo',
                    lastName: 'Client',
                    phone: '555-0123',
                    address: '123 Main St',
                    city: 'Demo City',
                    state: 'CA',
                    zipCode: '12345',
                    profileImage: '',
                  },
                  preferences: {
                    propertyTypes: ['single-family'],
                    priceRange: { min: 200000, max: 800000 },
                    preferredLocations: [],
                    timeframe: 'immediate',
                    preApprovalStatus: 'pre_approved',
                    communicationPreference: 'email',
                    notificationSettings: {
                      email: true,
                      sms: false,
                      push: true,
                    },
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              }
              propertyDetails={{
                address: '123 Example St, Demo City, CA 12345',
                listPrice: 500000,
                squareFootage: 2000,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 2020,
                propertyType: 'single-family',
                description: 'Beautiful single-family home',
                features: ['garage', 'backyard', 'modern kitchen'],
                daysOnMarket: 15,
              }}
              onSuccess={handleOfferCreated}
              onCancel={() => goBack()}
            />
          )

        case '/appraisal-scenarios':
          if (!appState.currentOffer) {
            navigate('/offers')
            return null
          }
          return (
            <AppraisalScenarios
              offer={appState.currentOffer}
              negotiation={appState.currentNegotiation}
              agentProfile={appState.currentUser as AgentProfile}
              clientProfile={routeParams?.clientProfile}
              onScenarioResolved={() => navigate('/negotiations')}
              onNegotiationUpdate={() => {}}
            />
          )
      }
    }

    // Client dashboard routes
    if (appState.userType === 'client') {
      switch (currentRoute) {
        case '/client-dashboard':
          return (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Client Dashboard
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate('/client-negotiations')}
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    My Negotiations
                  </h2>
                  <p className="text-gray-600">View your active negotiations</p>
                </div>
                <div
                  className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate('/client-documents')}
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    My Documents
                  </h2>
                  <p className="text-gray-600">View shared documents</p>
                </div>
              </div>
            </div>
          )

        case '/client-negotiations':
          return (
            <NegotiationDashboard
              userProfile={appState.currentUser as ClientProfile}
              userType="client"
              onNegotiationSelect={handleNegotiationSelected}
              onCreateNegotiation={() => navigate('/negotiation-create')}
            />
          )

        case '/client-documents':
          return (
            <DocumentSelector
              documents={[]} // TODO: Load client documents
              onDocumentSelect={handleDocumentSelected}
              onCreateNew={() => {}} // Clients can't create new documents
            />
          )
      }
    }

    // Shared routes (both agent and client)
    switch (currentRoute) {
      case '/document-preview':
        return (
          <DocumentPreview
            initialContent={
              routeParams?.documentResult?.documents?.[0]?.content || ''
            }
            documentType={
              routeParams?.documentResult?.documents?.[0]?.type || 'document'
            }
            agentProfile={
              appState.userType === 'agent'
                ? (appState.currentUser as AgentProfile)
                : ({} as AgentProfile)
            }
            clientProfile={
              appState.userType === 'client'
                ? (appState.currentUser as ClientProfile)
                : undefined
            }
            onSave={async (content, metadata) => {
              console.log('Saving document:', content, metadata)
              // TODO: Implement document saving
            }}
            onClose={() => goBack()}
            readOnly={appState.userType === 'client'}
          />
        )

      case '/document-editor':
        return (
          <DocumentPreview
            documentId={routeParams?.document?.id}
            initialContent={routeParams?.document?.content || ''}
            documentType={routeParams?.document?.type || 'document'}
            agentProfile={
              appState.userType === 'agent'
                ? (appState.currentUser as AgentProfile)
                : ({} as AgentProfile)
            }
            clientProfile={
              appState.userType === 'client'
                ? (appState.currentUser as ClientProfile)
                : undefined
            }
            onSave={async (content, metadata) => {
              console.log('Saving document:', content, metadata)
              // TODO: Implement document saving
            }}
            onClose={() => goBack()}
            readOnly={appState.userType === 'client'}
          />
        )

      case '/negotiation-details':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Negotiation Details
            </h1>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-gray-600">
                Negotiation details will appear here
              </p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => navigate('/appraisal-scenarios')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Handle Appraisal Scenario
                </button>
                <button
                  onClick={() => navigate('/document-generator')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Documents
                </button>
              </div>
            </div>
          </div>
        )

      case '/offer-success':
        return (
          <div className="p-6">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Offer Created Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Your offer has been created and is ready for submission.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/document-generator')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Cover Letter
                </button>
                <button
                  onClick={() => navigate('/negotiations')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Negotiations
                </button>
              </div>
            </div>
          </div>
        )

      case '/repair-estimator':
        return <RepairEstimatorScreen />

      case '/profile':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-gray-600">Profile settings will appear here</p>
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
      currentUser={appState.currentUser}
      userType={appState.userType}
      onLogout={handleLogout}
    >
      {renderCurrentScreen()}
    </Layout>
  )
}
