import type React from 'react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import type { DocumentGenerationProgress } from '../../../lib/openai/services/document-orchestrator'

interface MockProgressTrackerProps {
  onProgressUpdate: (progress: DocumentGenerationProgress) => void
}

const MockProgressTracker: React.FC<MockProgressTrackerProps> = ({
  onProgressUpdate,
}) => {
  const [isRunning, setIsRunning] = useState(false)

  const simulateProgress = async () => {
    setIsRunning(true)
    const startTime = Date.now()

    const documents = [
      'cover_letter',
      'explanation_memo',
      'offer_analysis',
      'negotiation_strategy',
      'market_analysis',
      'risk_assessment',
      'client_summary',
      'competitive_comparison',
    ]

    // Initialization phase
    onProgressUpdate({
      status: 'initializing',
      currentStep: 'Initializing document generation...',
      progress: 5,
      documentsCompleted: 0,
      totalDocuments: documents.length,
      timeElapsed: Date.now() - startTime,
    })

    await new Promise(resolve => setTimeout(resolve, 500))

    onProgressUpdate({
      status: 'initializing',
      currentStep: 'Validating context and preparing generation plan...',
      progress: 10,
      documentsCompleted: 0,
      totalDocuments: documents.length,
      timeElapsed: Date.now() - startTime,
    })

    await new Promise(resolve => setTimeout(resolve, 500))

    onProgressUpdate({
      status: 'generating',
      currentStep: 'Starting document generation...',
      progress: 15,
      documentsCompleted: 0,
      totalDocuments: documents.length,
      timeElapsed: Date.now() - startTime,
    })

    await new Promise(resolve => setTimeout(resolve, 500))

    // Document generation phase
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      const baseProgress = 15 + (i / documents.length) * 70

      onProgressUpdate({
        status: 'generating',
        currentStep: `Generating ${doc.replace('_', ' ')}...`,
        progress: baseProgress,
        documentsCompleted: i,
        totalDocuments: documents.length,
        currentDocument: doc,
        timeElapsed: Date.now() - startTime,
        estimatedTimeRemaining:
          ((Date.now() - startTime) / (i + 1)) * (documents.length - i - 1),
      })

      // Simulate document generation time
      await new Promise(resolve =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      )

      const completionProgress = 15 + ((i + 1) / documents.length) * 70
      onProgressUpdate({
        status: 'generating',
        currentStep: `Completed ${doc.replace('_', ' ')}`,
        progress: completionProgress,
        documentsCompleted: i + 1,
        totalDocuments: documents.length,
        timeElapsed: Date.now() - startTime,
        estimatedTimeRemaining:
          ((Date.now() - startTime) / (i + 1)) * (documents.length - i - 1),
      })

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Analysis phase
    onProgressUpdate({
      status: 'analyzing',
      currentStep: 'Analyzing document package...',
      progress: 85,
      documentsCompleted: documents.length,
      totalDocuments: documents.length,
      timeElapsed: Date.now() - startTime,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Completion
    onProgressUpdate({
      status: 'completed',
      currentStep: 'Document package completed successfully!',
      progress: 100,
      documentsCompleted: documents.length,
      totalDocuments: documents.length,
      timeElapsed: Date.now() - startTime,
    })

    setIsRunning(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={simulateProgress}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? 'Generating...' : 'Start Mock Generation'}
      </Button>
    </div>
  )
}

interface ProgressDisplayProps {
  progress: DocumentGenerationProgress
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ progress }) => {
  const getStatusColor = (status: DocumentGenerationProgress['status']) => {
    switch (status) {
      case 'initializing':
        return 'text-blue-600'
      case 'generating':
        return 'text-yellow-600'
      case 'analyzing':
        return 'text-purple-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: DocumentGenerationProgress['status']) => {
    switch (status) {
      case 'initializing':
        return '⚙️'
      case 'generating':
        return '📝'
      case 'analyzing':
        return '🔍'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(progress.status)}</span>
          <span className={`font-semibold ${getStatusColor(progress.status)}`}>
            {progress.status.toUpperCase()}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {progress.documentsCompleted} of {progress.totalDocuments} documents
        </div>
      </div>

      <Progress value={progress.progress} className="w-full" />

      <div className="text-sm text-gray-600 text-center">
        {progress.currentStep}
      </div>

      {progress.currentDocument && (
        <div className="text-sm text-gray-500 text-center">
          Current: {progress.currentDocument.replace('_', ' ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Progress:</span>
          <span className="ml-2">{progress.progress.toFixed(1)}%</span>
        </div>
        <div>
          <span className="font-medium">Time Elapsed:</span>
          <span className="ml-2">
            {progress.timeElapsed ? formatTime(progress.timeElapsed) : '0s'}
          </span>
        </div>
        <div>
          <span className="font-medium">Completed:</span>
          <span className="ml-2">{progress.documentsCompleted}</span>
        </div>
        <div>
          <span className="font-medium">Remaining:</span>
          <span className="ml-2">
            {progress.estimatedTimeRemaining
              ? formatTime(progress.estimatedTimeRemaining)
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}

const ProgressTrackingDemo: React.FC = () => {
  const [progress, setProgress] = useState<DocumentGenerationProgress>({
    status: 'initializing',
    currentStep: 'Ready to start...',
    progress: 0,
    documentsCompleted: 0,
    totalDocuments: 8,
    timeElapsed: 0,
  })

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Progress Tracking Demo
        </h2>
        <p className="text-gray-600 text-center mb-6">
          This demo shows how the enhanced progress tracking works during
          document generation.
        </p>

        <div className="space-y-6">
          <MockProgressTracker onProgressUpdate={setProgress} />
          <ProgressDisplay progress={progress} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">
          Progress Tracking Features
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Real-time progress updates during document generation</li>
          <li>
            • Phase-based status tracking (initializing, generating, analyzing,
            completed)
          </li>
          <li>• Individual document progress with current document name</li>
          <li>• Time elapsed and estimated time remaining</li>
          <li>• Document completion count and total documents</li>
          <li>• Visual progress bar and status indicators</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Technical Implementation</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            • Enhanced DocumentOrchestrationService with progress callbacks
          </li>
          <li>• Real-time progress updates from LangChain workflows</li>
          <li>• React component with state management for progress tracking</li>
          <li>• Automatic progress calculation and time estimation</li>
          <li>• Error handling and fallback progress states</li>
        </ul>
      </Card>
    </div>
  )
}

export default ProgressTrackingDemo
