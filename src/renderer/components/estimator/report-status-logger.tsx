/**
 * Report Status Logger Component
 * Displays real-time progress updates for the report generation process.
 */
import { useEffect, useState } from 'react'
import { CheckCircle, Loader, AlertTriangle, Info } from 'lucide-react'

// Mock progress updates for now
const mockProgress = [
  'Initializing report generation...',
  'Parsing PDF document...',
  'Identified 23 potential issues.',
  "Researching cost for: 'foundation cracks'...",
  "Finding local contractors for: 'foundation cracks'...",
  "Researching cost for: 'leaky pipe under sink'...",
  "Finding local contractors for: 'leaky pipe under sink'...",
  'Compiling final report...',
  'Report generation complete!'
]

export function ReportStatusLogger() {
  const [progress, setProgress] = useState<string[]>(['Initializing...'])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // This will be replaced with real IPC listeners
    const interval = setInterval(() => {
      if (currentIndex < mockProgress.length) {
        setProgress(prev => [...prev, mockProgress[currentIndex]])
        setCurrentIndex(prev => prev + 1)
      } else {
        clearInterval(interval)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [currentIndex])

  const getIcon = (message: string, isLast: boolean) => {
    const lowerCaseMessage = message.toLowerCase()
    if (isLast && lowerCaseMessage.includes('complete')) {
      return <CheckCircle className="size-5 text-green-500" />
    }
    if (lowerCaseMessage.includes('error')) {
      return <AlertTriangle className="size-5 text-red-500" />
    }
    if (!isLast) {
      return <CheckCircle className="size-5 text-blue-500" />
    }
    return <Loader className="size-5 animate-spin text-gray-500" />
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Generating Your Report
      </h2>
      <p className="text-gray-600 mb-6">
        The AI agent is at work. You can see its progress below. This may take a
        few minutes.
      </p>
      <div className="space-y-4 font-mono text-sm">
        {progress.map((log, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getIcon(log, index === progress.length - 1)}
            </div>
            <span
              className={`${
                index === progress.length - 1
                  ? 'text-gray-800 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {log}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 