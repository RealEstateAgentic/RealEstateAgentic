/**
 * Reports Sidebar Component
 * Collapsible sidebar displaying previous inspection reports
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Clock, DollarSign } from 'lucide-react'
import { Button } from '../ui/button'
import { mockInspectionReports, type InspectionReport } from '../../data/mock-inspection-reports'

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
  selectedReportId
}: ReportsSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen)
  const reports = Object.values(mockInspectionReports)

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
  }

  /**
   * Handle keyboard events for report cards
   */
  const handleReportKeyDown = (e: React.KeyboardEvent, report: InspectionReport) => {
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
      <div className={`
        fixed right-0 top-0 h-full bg-white border-l border-gray-200 z-50 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${internalIsOpen ? 'translate-x-0' : 'translate-x-full'}
        w-80
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#3B7097]" />
            <h2 className="text-lg font-semibold text-gray-900">Inspection Reports</h2>
          </div>
        </div>

        {/* Reports List */}
        <div className="p-4 overflow-y-auto h-full pb-20">
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report)}
                onKeyDown={(e) => handleReportKeyDown(e, report)}
                tabIndex={0}
                role="button"
                aria-label={`View inspection report for ${report.title}`}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all duration-200
                  ${selectedReportId === report.id 
                    ? 'bg-[#3B7097]/10 border-[#3B7097] shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <h3 className="font-medium text-gray-900 mb-1 text-sm leading-tight">
                  {report.title}
                </h3>
                <p className="text-xs text-gray-600 mb-2">{report.address}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-gray-500" />
                    <span className="text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-3 text-[#3B7097]" />
                    <span className="text-[#3B7097] font-medium">
                      ${report.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Button - shown when sidebar is closed */}
      {!internalIsOpen && (
        <button
          onClick={handleToggle}
          className="fixed right-4 top-4 z-40 bg-[#3B7097] hover:bg-[#3B7097]/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
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