/**
 * Repair Estimator Screen
 * Main screen for property inspection report generation and viewing
 * Handles routing between new report creation and viewing existing reports
 */

import { useState, useEffect } from 'react'
import { ReportsSidebar } from '../components/estimator/reports-sidebar'
import { NewReportContent } from '../components/estimator/new-report-content'
import { ReportHeader } from '../components/estimator/report-header'
import { MarkdownRenderer } from '../components/estimator/markdown-renderer'
import { mockInspectionReports, type InspectionReport } from '../data/mock-inspection-reports'

/**
 * Main repair estimator screen component
 * Orchestrates sidebar, routing, and content display for inspection reports
 */
export function RepairEstimator() {
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Parse URL to determine if we're viewing a specific report
  useEffect(() => {
    const path = window.location.pathname
    const reportIdMatch = path.match(/\/repair-estimator\/(.+)/)
    
    if (reportIdMatch) {
      const reportId = reportIdMatch[1]
      const report = mockInspectionReports[reportId]
      if (report) {
        setSelectedReport(report)
      } else {
        // Report not found, redirect to new report
        window.history.pushState({}, '', '/repair-estimator')
        setSelectedReport(null)
      }
    } else {
      setSelectedReport(null)
    }
  }, [])

  /**
   * Handle selecting a report from the sidebar
   * Updates URL and selected report state
   */
  const handleSelectReport = (report: InspectionReport) => {
    setSelectedReport(report)
    window.history.pushState({}, '', `/repair-estimator/${report.id}`)
  }

  /**
   * Handle navigating back to new report creation
   * Clears selected report and updates URL
   */
  const handleBackToNew = () => {
    setSelectedReport(null)
    window.history.pushState({}, '', '/repair-estimator')
  }

  /**
   * Handle sidebar toggle
   */
  const handleSidebarToggle = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Content Area */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'lg:mr-80' : 'mr-0'}
      `}>
        {selectedReport ? (
          /* Viewing Existing Report */
          <div className="flex flex-col h-full">
            <ReportHeader
              report={selectedReport}
              onBackClick={handleBackToNew}
            />
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <MarkdownRenderer
                  markdownContent={selectedReport.content}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Creating New Report */
          <div className="flex-1 p-6 flex flex-col min-h-0">
            <NewReportContent />
          </div>
        )}
      </div>

      {/* Reports Sidebar */}
      <ReportsSidebar
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        onSelectReport={handleSelectReport}
        selectedReportId={selectedReport?.id}
      />
    </div>
  )
} 