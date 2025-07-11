/**
 * Document Generator Demo Component
 *
 * Demonstrates how to use the enhanced document generator with detailed progress tracking.
 * This component shows the integration between the existing DocumentGenerator and the new
 * enhanced progress tracking system.
 */

import type React from 'react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { EnhancedDocumentGenerator } from './EnhancedDocumentGenerator'
import { DocumentGenerator } from './DocumentGenerator'
import { Info, Zap, Eye, Settings } from 'lucide-react'
import type { DocumentPackageResult } from '../../../lib/openai/services/document-orchestrator'
import type { AgentProfile } from '../../../shared/types'
import type { Negotiation } from '../../../shared/types/negotiations'

// ========== DEMO COMPONENT ==========

interface DocumentGeneratorDemoProps {
  agentProfile: AgentProfile
  clientProfile: {
    personalInfo: {
      firstName: string
      lastName: string
      city: string
      state: string
      zipCode: string
    }
    clientType: string
    preferences: {
      timeframe: string
    }
  }
  offer?: {
    propertyDetails: {
      address: string
      listPrice: number
      propertyType: string
    }
  }
  negotiation?: Negotiation
  onDocumentGenerated: (result: DocumentPackageResult) => void
  onCancel: () => void
}

export const DocumentGeneratorDemo: React.FC<DocumentGeneratorDemoProps> = ({
  agentProfile,
  clientProfile,
  offer,
  negotiation,
  onDocumentGenerated,
  onCancel,
}) => {
  const [useEnhancedProgress, setUseEnhancedProgress] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleDocumentGenerated = (result: DocumentPackageResult) => {
    console.log('Document generation completed:', result)
    onDocumentGenerated(result)
  }

  const renderInstructions = () => (
    <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-2">
            Enhanced Progress Tracking Demo
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This demo shows two different document generation experiences:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Enhanced Mode:</strong> Shows detailed agent reasoning,
                workflow phases, dependency resolution, and real-time decision
                making
              </li>
              <li>
                <strong>Standard Mode:</strong> Shows basic progress tracking
                with overall completion percentage and current step
              </li>
            </ul>
            <p className="mt-3">
              <strong>What you'll see in Enhanced Mode:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>🤖 Active AI agents and their current thinking</li>
              <li>🔧 Tools being used by each agent</li>
              <li>📊 Workflow phases and dependency resolution</li>
              <li>🎯 Real-time activity feed with detailed decisions</li>
              <li>📈 Performance metrics and agent utilization</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderModeSelector = () => (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">
              Progress Tracking Mode
            </h3>
            <p className="text-sm text-gray-600">
              Choose between standard and enhanced progress tracking
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <Info className="w-4 h-4 mr-2" />
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant={useEnhancedProgress ? 'outline' : 'default'}
              size="sm"
              onClick={() => setUseEnhancedProgress(false)}
            >
              Standard
            </Button>
            <Button
              variant={useEnhancedProgress ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseEnhancedProgress(true)}
            >
              Enhanced
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderModeFeatures = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card
        className={`p-4 ${!useEnhancedProgress ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
      >
        <div className="flex items-start space-x-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Standard Mode</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Basic progress bar</li>
              <li>• Current step indicator</li>
              <li>• Document completion status</li>
              <li>• Simple error handling</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card
        className={`p-4 ${useEnhancedProgress ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
      >
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Enhanced Mode</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time agent reasoning</li>
              <li>• Workflow visualization</li>
              <li>• Dependency tracking</li>
              <li>• Decision explanations</li>
              <li>• Performance metrics</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Generator Demo
        </h1>
        <p className="text-gray-600">
          Experience the difference between standard and enhanced progress
          tracking
        </p>
      </div>

      {/* Instructions */}
      {showInstructions && renderInstructions()}

      {/* Mode Selector */}
      {renderModeSelector()}

      {/* Mode Features */}
      {renderModeFeatures()}

      {/* Document Generator */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {useEnhancedProgress ? 'Enhanced' : 'Standard'} Document Generator
          </h2>
          <p className="text-gray-600">
            {useEnhancedProgress
              ? 'Watch as AI agents reason through the document generation process'
              : 'Standard document generation with basic progress tracking'}
          </p>
        </div>

        {useEnhancedProgress ? (
          <EnhancedDocumentGenerator
            agentProfile={agentProfile}
            clientProfile={clientProfile}
            offer={offer}
            negotiation={negotiation}
            onDocumentGenerated={handleDocumentGenerated}
            onCancel={onCancel}
          />
        ) : (
          <DocumentGenerator
            agentProfile={agentProfile}
            clientProfile={clientProfile}
            offer={offer}
            negotiation={negotiation}
            onDocumentGenerated={handleDocumentGenerated}
            onCancel={onCancel}
          />
        )}
      </Card>

      {/* Tips */}
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Pro Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Try switching modes during generation to see the difference
              </li>
              <li>
                • In enhanced mode, click on different tabs to explore various
                views
              </li>
              <li>
                • Watch the activity feed to see real-time decision making
              </li>
              <li>• Notice how dependencies are resolved automatically</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ========== DEMO WRAPPER FOR EASY INTEGRATION ==========

interface DocumentGeneratorDemoWrapperProps {
  // Optional props for testing
  mockMode?: boolean
}

export const DocumentGeneratorDemoWrapper: React.FC<
  DocumentGeneratorDemoWrapperProps
> = ({ mockMode = false }) => {
  // Mock data for demonstration
  const mockAgentProfile: AgentProfile = {
    uid: 'demo-agent',
    displayName: 'Sarah Johnson',
    email: 'sarah@realestate.com',
    emailVerified: true,
    role: 'agent',
    licenseNumber: 'DRE# 123456',
    brokerage: 'Premier Real Estate',
    phoneNumber: '(555) 123-4567',
    specialties: ['First-time buyers', 'Investment properties', 'Luxury homes'],
    yearsExperience: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockClientProfile = {
    personalInfo: {
      firstName: 'John',
      lastName: 'Smith',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
    },
    clientType: 'buyer',
    preferences: {
      timeframe: '3-6 months',
    },
  }

  const mockOffer = {
    propertyDetails: {
      address: '123 Main St, San Francisco, CA 94102',
      listPrice: 750000,
      propertyType: 'Single Family Home',
    },
  }

  const handleDocumentGenerated = (result: DocumentPackageResult) => {
    console.log('Demo: Document generation completed', result)
    // In a real app, you would handle the generated documents here
  }

  const handleCancel = () => {
    console.log('Demo: Document generation cancelled')
    // In a real app, you would handle the cancellation here
  }

  if (mockMode) {
    return (
      <DocumentGeneratorDemo
        agentProfile={mockAgentProfile}
        clientProfile={mockClientProfile}
        offer={mockOffer}
        onDocumentGenerated={handleDocumentGenerated}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Document Generator Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This component demonstrates the enhanced document generator with
          progress tracking. To see it in action, integrate it with your agent
          and client data.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload with Mock Data
        </Button>
      </Card>
    </div>
  )
}
