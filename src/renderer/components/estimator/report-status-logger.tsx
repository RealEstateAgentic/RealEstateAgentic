/**
 * Report Status Logger Component
 * Displays real-time progress updates for the report generation process.
 */
import { useEffect, useRef } from 'react'
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react'

export function ReportStatusLogger({ messages }: { messages: string[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isComplete = messages.some(msg => msg.toLowerCase().includes('complete'))

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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