/**
 * Report Status Logger Component
 * Displays real-time progress updates for the report generation process.
 */
import { useEffect, useState } from 'react'
import { CheckCircle, Loader, AlertTriangle, Info } from 'lucide-react'

export function ReportStatusLogger({ reportId }: { reportId: string }) {
  const [messages, setMessages] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const unsubscribe = window.App.report.onProgress(
      (message: string) => {
        console.log('Received progress message in renderer:', message)
        setMessages(prev => [...prev, message])
        if (message.toLowerCase().includes('complete')) {
          setIsComplete(true)
        }
      }
    )

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe()
    }
  }, [reportId])

  const getIcon = (message: string, isLast: boolean) => {
    const lowerCaseMessage = message.toLowerCase()
    if (lowerCaseMessage.includes('complete')) {
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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Generation Status</h3>
      <div className="flex-grow overflow-y-auto pr-2">
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li key={index} className="text-sm">
              <span className="text-muted-foreground mr-2">{`[${index + 1}]`}</span>
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 