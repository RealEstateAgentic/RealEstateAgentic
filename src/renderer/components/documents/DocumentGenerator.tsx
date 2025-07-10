/**
 * Document Generation Interface
 *
 * Comprehensive interface for generating real estate documents with real-time
 * status updates, document preview, customization options, and integration
 * with the OpenAI orchestration service.
 */

import { type FC, useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Check, AlertCircle, Clock, FileText, Download } from 'lucide-react'
import { DocumentOrchestrationService } from '../../../lib/openai/services/document-orchestrator'
import { createDocument } from '../../../lib/firebase/collections/documents'
import { getCurrentUserProfile } from '../../../lib/firebase/auth'
import { MarkdownRenderer } from '../estimator/markdown-renderer'
import type {
  DocumentPackageResult,
  DocumentPackageRequest,
  DocumentPackageType,
  DocumentGenerationContext,
  DocumentGenerationOptions,
  DocumentRequirements,
  DocumentType,
} from '../../../lib/openai/services/document-orchestrator'
import type { AgentProfile } from '../../../shared/types'
import type { Negotiation } from '../../../shared/types/negotiations'

// ========== DOCUMENT GENERATION TYPES ==========

interface DocumentGeneratorProps {
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

interface GenerationProgress {
  status: 'idle' | 'generating' | 'completed' | 'error'
  currentStep: string
  progress: number
  timeRemaining?: number
  documentsGenerated: number
  totalDocuments: number
}

interface DocumentTypeSelection {
  type: DocumentType
  label: string
  description: string
  enabled: boolean
  required: boolean
}

// ========== DOCUMENT TYPE CONFIGURATIONS ==========

const DOCUMENT_TYPES: DocumentTypeSelection[] = [
  {
    type: 'cover_letter',
    label: 'Cover Letter',
    description: 'Professional letter accompanying offer or counter-offer',
    enabled: true,
    required: true,
  },
  {
    type: 'explanation_memo',
    label: 'Explanation Memo',
    description: 'Educational memo explaining complex terms to clients',
    enabled: true,
    required: false,
  },
  {
    type: 'negotiation_strategy',
    label: 'Negotiation Strategy',
    description: 'Strategic recommendations for negotiations',
    enabled: false,
    required: false,
  },
  {
    type: 'offer_analysis',
    label: 'Offer Analysis',
    description: 'Comprehensive analysis of offer terms and positioning',
    enabled: true,
    required: false,
  },
  {
    type: 'market_analysis',
    label: 'Market Analysis',
    description: 'Current market conditions and trends report',
    enabled: true,
    required: false,
  },
  {
    type: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Evaluation of potential risks and mitigation strategies',
    enabled: false,
    required: false,
  },
  {
    type: 'client_summary',
    label: 'Client Summary',
    description: 'Easy-to-understand summary for client presentation',
    enabled: true,
    required: false,
  },
  {
    type: 'competitive_comparison',
    label: 'Competitive Comparison',
    description: 'Analysis comparing multiple offers',
    enabled: false,
    required: false,
  },
]

const PACKAGE_TEMPLATES: {
  [key: string]: { label: string; description: string; types: DocumentType[] }
} = {
  buyer_offer: {
    label: 'Buyer Offer Package',
    description: 'Complete package for buyer offers',
    types: [
      'cover_letter',
      'explanation_memo',
      'offer_analysis',
      'market_analysis',
    ],
  },
  seller_counter: {
    label: 'Seller Counter Package',
    description: 'Complete package for seller counter-offers',
    types: [
      'cover_letter',
      'explanation_memo',
      'negotiation_strategy',
      'market_analysis',
    ],
  },
  client_education: {
    label: 'Client Education Package',
    description: 'Educational materials for clients',
    types: ['explanation_memo', 'market_analysis', 'client_summary'],
  },
  competitive_analysis: {
    label: 'Competitive Analysis Package',
    description: 'Analysis for multiple offer situations',
    types: ['competitive_comparison', 'negotiation_strategy', 'offer_analysis'],
  },
}

// ========== PROGRESS TRACKER COMPONENT ==========

interface ProgressTrackerProps {
  progress: GenerationProgress
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return '🔄'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Generation Progress
        </h3>
        <span className="text-2xl">{getStatusIcon(progress.status)}</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{progress.currentStep}</span>
            <span>
              {progress.documentsGenerated} of {progress.totalDocuments}{' '}
              documents
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(progress.status)}`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {progress.timeRemaining && (
          <div className="text-sm text-gray-600">
            Estimated time remaining: {Math.ceil(progress.timeRemaining / 1000)}{' '}
            seconds
          </div>
        )}

        {progress.status === 'generating' && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">
              Generating documents...
            </span>
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="flex items-center space-x-2 text-green-600">
            <span className="text-sm">
              ✅ All documents generated successfully!
            </span>
          </div>
        )}

        {progress.status === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <span className="text-sm">
              ❌ Generation failed. Please try again.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== DOCUMENT PREVIEW COMPONENT ==========

interface DocumentPreviewProps {
  documents: any[]
  onDocumentSelect: (document: any) => void
  selectedDocument?: any
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documents,
  onDocumentSelect,
  selectedDocument,
}) => {
  if (documents.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No documents generated yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 p-2">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedDocument?.id === doc.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {selectedDocument ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDocument.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedDocument.metadata.wordCount} words •{' '}
                  {selectedDocument.metadata.readingTime} min read
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedDocument.quality.score >= 80
                      ? 'bg-green-100 text-green-800'
                      : selectedDocument.quality.score >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  Quality: {selectedDocument.quality.score}%
                </span>
                <Button size="sm" variant="outline">
                  Download
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={selectedDocument.content} />
            </div>

            {selectedDocument.quality.suggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Suggestions for Improvement:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {selectedDocument.quality.suggestions.map(
                    (suggestion: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Select a document to preview</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== MAIN DOCUMENT GENERATOR ==========

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  agentProfile,
  clientProfile,
  offer,
  negotiation,
  onDocumentGenerated,
  onCancel,
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>('buyer_offer')
  const [customDocuments, setCustomDocuments] =
    useState<DocumentTypeSelection[]>(DOCUMENT_TYPES)
  const [generationMode, setGenerationMode] = useState<'template' | 'custom'>(
    'template'
  )
  const [generationOptions, setGenerationOptions] = useState({
    complexity: 'intermediate',
    tone: 'professional',
    includeMarketAnalysis: true,
    includeRiskAssessment: false,
    includeNegotiationTactics: false,
    includeClientEducation: true,
    jurisdiction: 'CA',
  })

  const [progress, setProgress] = useState<GenerationProgress>({
    status: 'idle',
    currentStep: 'Ready to generate',
    progress: 0,
    documentsGenerated: 0,
    totalDocuments: 0,
  })

  const [result, setResult] = useState<DocumentPackageResult | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [error, setError] = useState('')

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    const templateConfig = PACKAGE_TEMPLATES[template]
    if (templateConfig) {
      setCustomDocuments(prev =>
        prev.map(doc => ({
          ...doc,
          enabled: templateConfig.types.includes(doc.type),
        }))
      )
    }
  }

  const toggleDocumentType = (type: DocumentType) => {
    setCustomDocuments(prev =>
      prev.map(doc =>
        doc.type === type ? { ...doc, enabled: !doc.enabled } : doc
      )
    )
  }

  const saveDocumentsToFirebase = async (
    packageResult: DocumentPackageResult
  ) => {
    try {
      const userProfile = await getCurrentUserProfile()
      if (!userProfile) {
        console.warn('No user profile found, skipping Firebase save')
        return
      }

      console.log(
        `Saving ${packageResult.documents.length} documents to Firebase...`
      )

      // Save each document to Firebase
      for (const document of packageResult.documents) {
        try {
          // Map document type to shared DocumentType
          const documentType = mapDocumentType(document.type)

          const result = await createDocument({
            title: document.title,
            type: documentType,
            category: 'client_communications',
            content: document.content,
            relatedId: packageResult.packageId,
            relatedType: 'client',
            generationParams: {
              aiModel: 'gpt-4',
              temperature: 0.7,
              tone: document.metadata.tone,
              length: 'medium',
              context: {
                propertyDetails: {
                  address: 'Property Address',
                  price: 500000,
                  sqft: 2000,
                  beds: 3,
                  baths: 2,
                  features: [],
                  condition: 'Good',
                  yearBuilt: 2020,
                },
                clientDetails: {
                  name: `${clientProfile.personalInfo.firstName} ${clientProfile.personalInfo.lastName}`,
                  role:
                    clientProfile.clientType === 'buyer' ? 'buyer' : 'seller',
                  preferences: [],
                  timeline: clientProfile.preferences.timeframe || '3-6 months',
                  budget: 500000,
                  motivation: 'Find the perfect home',
                },
              },
            },
          })

          if (result.success) {
            console.log(`Successfully saved ${document.type} to Firebase`)
          } else {
            console.error(
              `Failed to save ${document.type} to Firebase:`,
              result.error
            )
          }
        } catch (error) {
          console.error(`Error saving ${document.type} to Firebase:`, error)
        }
      }

      console.log('Document saving to Firebase completed')
    } catch (error) {
      console.error('Error saving documents to Firebase:', error)
    }
  }

  // Map document orchestrator document types to shared document types
  const mapDocumentType = (
    type: string
  ): import('../../../shared/types/documents').DocumentType => {
    switch (type) {
      case 'cover_letter':
        return 'cover_letter'
      case 'explanation_memo':
        return 'explanation_memo'
      case 'negotiation_strategy':
        return 'negotiation_summary'
      case 'offer_analysis':
        return 'market_analysis'
      case 'market_analysis':
        return 'market_analysis'
      case 'risk_assessment':
        return 'property_report'
      case 'client_summary':
        return 'client_presentation'
      case 'competitive_comparison':
        return 'market_analysis'
      default:
        return 'other'
    }
  }

  const getSelectedDocuments = () => {
    return customDocuments.filter(d => d.enabled).map(d => d.type)
  }

  const generateDocuments = async () => {
    if (!agentProfile || !clientProfile) {
      setError('Missing required profile information')
      return
    }

    setError('')
    setResult(null)
    setSelectedDocument(null)

    // Initialize progress
    const totalDocuments = getSelectedDocuments().length
    setProgress({
      status: 'generating',
      currentStep: 'Initializing document generation...',
      progress: 0,
      documentsGenerated: 0,
      totalDocuments,
    })

    try {
      console.log('Starting document generation...')
      console.log('Client Profile:', clientProfile)
      console.log('Agent Profile:', agentProfile)

      // Generate context for document generation
      const context: DocumentGenerationContext = {
        offer: undefined, // Will be populated if we have a proper offer structure
        negotiation,
        property: {
          address: offer?.propertyDetails?.address || 'Property Address',
          price: offer?.propertyDetails?.listPrice || 500000,
          type: offer?.propertyDetails?.propertyType || 'Single Family Home',
          features: [],
          condition: 'Good',
          daysOnMarket: 30,
        },
        client: {
          name: `${clientProfile.personalInfo.firstName} ${clientProfile.personalInfo.lastName}`,
          role: clientProfile.clientType === 'buyer' ? 'buyer' : 'seller',
          experienceLevel: 'experienced',
          goals: ['Find the perfect home'],
          concerns: ['Market conditions', 'Pricing'],
          timeline: clientProfile.preferences.timeframe || '3-6 months',
        },
        agent: {
          name: agentProfile.displayName || 'Real Estate Agent',
          brokerage: agentProfile.brokerage || 'Real Estate Brokerage',
          experience: '5+ years',
          credentials: 'Licensed Real Estate Agent',
          contact: {
            phone: agentProfile.phoneNumber || '(555) 123-4567',
            email: agentProfile.email || 'agent@realestate.com',
          },
        },
        market: {
          trend: 'warm',
          inventory: 'balanced',
          competition: 'medium',
          location: {
            city: clientProfile.personalInfo.city || 'City',
            state: clientProfile.personalInfo.state || 'State',
            zipCode: clientProfile.personalInfo.zipCode || '12345',
          },
        },
        competingOffers: [],
        customData: {},
      }

      console.log('Generated context:', context)

      // Create the document package request
      const request: DocumentPackageRequest = {
        type: 'buyer_offer' as DocumentPackageType,
        context,
        options: {
          format: 'text',
          complexity: generationOptions.complexity as
            | 'simple'
            | 'intermediate'
            | 'detailed',
          tone: generationOptions.tone as
            | 'professional'
            | 'warm'
            | 'confident'
            | 'analytical',
          includeMarketAnalysis: generationOptions.includeMarketAnalysis,
          includeRiskAssessment: generationOptions.includeRiskAssessment,
          includeNegotiationTactics:
            generationOptions.includeNegotiationTactics,
          includeClientEducation: generationOptions.includeClientEducation,
          prioritizeSpeed: false,
          ensureConsistency: true,
          validateContent: true,
          jurisdiction: generationOptions.jurisdiction,
        },
        requirements: {
          documents: getSelectedDocuments(),
          deliveryMethod: 'batch',
          qualityLevel: 'review',
          fallbackOptions: true,
        },
      }

      console.log('Generated request:', request)

      // Update progress to show document generation starting
      setProgress(prev => ({
        ...prev,
        currentStep: 'Generating documents...',
        progress: 5,
      }))

      // Generate documents
      console.log(
        'Calling DocumentOrchestrationService.generateDocumentPackage...'
      )
      const packageResult =
        await DocumentOrchestrationService.generateDocumentPackage(request)

      console.log('Document generation result:', packageResult)

      // Update progress to completion
      setProgress({
        status: 'completed',
        currentStep: 'Generation complete!',
        progress: 100,
        documentsGenerated: packageResult.documents.length,
        totalDocuments: packageResult.documents.length,
      })

      // Save documents to Firebase if generation was successful
      if (packageResult.documents && packageResult.documents.length > 0) {
        setProgress(prev => ({
          ...prev,
          currentStep: 'Saving documents to Firebase...',
        }))

        console.log('Saving documents to Firebase...')
        await saveDocumentsToFirebase(packageResult)

        setProgress(prev => ({
          ...prev,
          currentStep: 'Documents saved successfully!',
        }))
      }

      setResult(packageResult)
      if (packageResult.documents.length > 0) {
        setSelectedDocument(packageResult.documents[0])
      }
      onDocumentGenerated(packageResult)
    } catch (err) {
      console.error('Document generation error:', err)
      setError(
        err instanceof Error ? err.message : 'Document generation failed'
      )
      setProgress(prev => ({
        ...prev,
        status: 'error',
        currentStep: 'Generation failed',
      }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Document Generator
            </h1>
            <p className="text-gray-600 mt-1">
              Generate professional real estate documents powered by AI
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={generateDocuments}
              disabled={progress.status === 'generating'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {progress.status === 'generating'
                ? 'Generating...'
                : 'Generate Documents'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generation Mode
              </h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="template"
                    checked={generationMode === 'template'}
                    onChange={e =>
                      setGenerationMode(e.target.value as 'template')
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Use Template Package
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={generationMode === 'custom'}
                    onChange={e =>
                      setGenerationMode(e.target.value as 'custom')
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Custom Selection
                  </span>
                </label>
              </div>
            </div>

            {generationMode === 'template' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Template Packages
                </h3>
                <div className="space-y-3">
                  {Object.entries(PACKAGE_TEMPLATES).map(([key, template]) => (
                    <label
                      key={key}
                      className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={key}
                        checked={selectedTemplate === key}
                        onChange={e => handleTemplateChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="font-medium text-gray-900">
                        {template.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {template.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.types.length} documents included
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {generationMode === 'custom' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Document Types
                </h3>
                <div className="space-y-3">
                  {customDocuments.map(doc => (
                    <label
                      key={doc.type}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        doc.enabled
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={doc.enabled}
                        onChange={() => toggleDocumentType(doc.type)}
                        disabled={doc.required}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {doc.label}
                          {doc.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {doc.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generation Options
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complexity Level
                  </label>
                  <select
                    value={generationOptions.complexity}
                    onChange={e =>
                      setGenerationOptions(prev => ({
                        ...prev,
                        complexity: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="simple">Simple</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={generationOptions.tone}
                    onChange={e =>
                      setGenerationOptions(prev => ({
                        ...prev,
                        tone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="warm">Warm</option>
                    <option value="confident">Confident</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jurisdiction
                  </label>
                  <select
                    value={generationOptions.jurisdiction}
                    onChange={e =>
                      setGenerationOptions(prev => ({
                        ...prev,
                        jurisdiction: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeMarketAnalysis}
                      onChange={e =>
                        setGenerationOptions(prev => ({
                          ...prev,
                          includeMarketAnalysis: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Include Market Analysis
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeRiskAssessment}
                      onChange={e =>
                        setGenerationOptions(prev => ({
                          ...prev,
                          includeRiskAssessment: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Include Risk Assessment
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeNegotiationTactics}
                      onChange={e =>
                        setGenerationOptions(prev => ({
                          ...prev,
                          includeNegotiationTactics: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Include Negotiation Tactics
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeClientEducation}
                      onChange={e =>
                        setGenerationOptions(prev => ({
                          ...prev,
                          includeClientEducation: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Include Client Education
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Status and Preview */}
          <div className="lg:col-span-2 space-y-6">
            <ProgressTracker progress={progress} />

            {result && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Generation Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">
                        Documents Generated:
                      </span>
                      <span className="ml-2">{result.documents.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Total Time:
                      </span>
                      <span className="ml-2">
                        {(result.metadata.totalTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Tokens Used:
                      </span>
                      <span className="ml-2">
                        {result.metadata.tokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Status:</span>
                      <span className="ml-2 capitalize">{result.status}</span>
                    </div>
                  </div>
                </div>

                <DocumentPreview
                  documents={result.documents}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={setSelectedDocument}
                />

                {result.recommendations.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Recommendations
                    </h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentGenerator
