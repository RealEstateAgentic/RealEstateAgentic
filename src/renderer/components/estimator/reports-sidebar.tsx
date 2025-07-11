/**
 * Reports Sidebar Component
 * Collapsible sidebar displaying previous inspection reports
 */

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  MapPin,
} from 'lucide-react'

import { Button } from '../ui/button'
import { type InspectionReport } from '~/src/shared/types/documents'
import { db } from '~/src/lib/firebase/config'
import { useAuth } from '~/src/renderer/hooks/useAuth'

interface ReportsSidebarProps {
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  onSelectReport?: (report: InspectionReport) => void
  selectedReportId?: string
}

/**
 * Collapsible sidebar for displaying previous inspection reports
 */
export function ReportsSidebar({
  isOpen = false,
  onToggle,
  onSelectReport,
  selectedReportId,
}: ReportsSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen)
  const [reports, setReports] = useState<InspectionReport[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()

  // Sync internal state with parent state
  useEffect(() => {
    setInternalIsOpen(isOpen)
  }, [isOpen])

  useEffect(() => {
    if (authLoading) {
      return // Wait for auth state to resolve
    }
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    const reportsCollection = collection(db, 'inspectionReports')
    const q = query(
      reportsCollection,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const fetchedReports: InspectionReport[] = querySnapshot.docs.map(
          doc => ({
            id: doc.id,
            ...(doc.data() as Omit<InspectionReport, 'id'>),
          }),
        )
        setReports(fetchedReports)
        setLoading(false)
      },
      error => {
        console.error('Error fetching reports:', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, authLoading])

  /**
   * Handle toggle sidebar
   */
  const handleToggle = () => {
    const newState = !internalIsOpen
    setInternalIsOpen(newState)
    onToggle?.(newState)
  }

  /**
   * Handle report selection
   */
  const handleSelectReport = (report: InspectionReport) => {
    onSelectReport?.(report)
    // Auto-collapse sidebar after selecting a report
    handleToggle()
  }

  /**
   * Handle keyboard events for report cards
   */
  const handleReportKeyDown = (
    e: React.KeyboardEvent,
    report: InspectionReport,
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelectReport(report)
    }
  }

  /**
   * Handle keyboard events for backdrop
   */
  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
        fixed right-0 top-0 h-full bg-white border-l border-gray-200 z-50 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${internalIsOpen ? 'translate-x-0' : 'translate-x-full'}
        w-80
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <Button variant="ghost" size="icon" onClick={handleToggle}>
            <ChevronRight className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#3B7097]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Inspection Reports
            </h2>
          </div>
        </div>

        {/* Reports List */}
        <div className="p-4 overflow-y-auto h-full pb-20">
          {loading || authLoading ? (
            <p className="text-gray-500">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500">No reports found.</p>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  onKeyDown={e => handleReportKeyDown(e, report)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View inspection report for ${report.name}`}
                  className={`
                  p-4 rounded-lg border cursor-pointer transition-all duration-200
                  ${
                    selectedReportId === report.id
                      ? 'bg-[#3B7097]/10 border-[#3B7097] shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                >
                  <h3 className="font-medium text-gray-900 mb-1 text-sm leading-tight truncate">
                    {report.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2 truncate">
                    {report.propertyAddress || 'No address specified'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>
                        {report.inspectionDate || 'No date specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button - shown when sidebar is closed */}
      {!internalIsOpen && (
        <button
          onClick={handleToggle}
          className="fixed right-6 top-20 z-40 bg-[#3B7097] hover:bg-[#3B7097]/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          aria-label="Open inspection reports sidebar"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {/* Backdrop for mobile */}
      {internalIsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleToggle}
          onKeyDown={handleBackdropKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Close sidebar"
        />
      )}
    </>
  )
} 