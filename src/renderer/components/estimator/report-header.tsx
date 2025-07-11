/**
 * Report Header Component
 * Header component for viewing inspection reports
 */

import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import type { InspectionReport } from '~/src/shared/types/documents'

interface ReportHeaderProps {
  report: InspectionReport | null
  onBackClick?: () => void
}

/**
 * Header component for viewing inspection reports
 * Shows report details and navigation back to new report creation
 */
export function ReportHeader({ report, onBackClick }: ReportHeaderProps) {
  if (!report) {
    return (
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
      </div>
    )
  }

  const getFormattedDate = () => {
    if (!report.createdAt) return 'Date not available'
    // Firestore Timestamps need to be converted to JS Date objects
    return report.createdAt.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBackClick}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Back to New Report
        </Button>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">{report.name}</h1>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-600" />
            <span className="text-gray-700">
              {report.propertyAddress || 'Address not available'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-gray-600" />
            <span className="text-gray-700">{getFormattedDate()}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 