/**
 * Report Status Logger Component
 * Displays real-time progress updates for the report generation process.
 */
import { useEffect, useState, useRef } from 'react'
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react'

export function ReportStatusLogger({ reportId }: { reportId: string }) {
  const [messages, setMessages] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const unsubscribe = window.App.report.onProgress((message: string) => {
      console.log('Received progress message in renderer:', message)
      setMessages(prev => [...prev, message])
      if (message.toLowerCase().includes('complete')) {
        setIsComplete(true)
      }
    })

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
    if (!isLast || isComplete) {
      return <CheckCircle className="size-5 text-blue-500" />
    }
    return <Loader className="size-5 animate-spin text-gray-500" />
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 h-96 flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Generation Status</h3>
      <div className="flex-grow overflow-y-auto pr-2">
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li key={index} className="flex items-start text-sm">
              <span className="mr-2 pt-0.5">
                {getIcon(msg, index === messages.length - 1)}
              </span>
              <span>{msg}</span>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      </div>
    </div>
  )
} 