/**
 * Report Header Component
 * Header component for viewing inspection reports
 */

import { ArrowLeft, Calendar, DollarSign, MapPin } from 'lucide-react'
import { Button } from './ui/button'
import type { InspectionReport } from '../data/mock-inspection-reports'

interface ReportHeaderProps {
  report: InspectionReport
  onBackClick?: () => void
}

/**
 * Header component for viewing inspection reports
 * Shows report details and navigation back to new report creation
 */
export function ReportHeader({ report, onBackClick }: ReportHeaderProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-700 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBackClick}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-100"
        >
          <ArrowLeft className="size-4" />
          Back to New Report
        </Button>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-100">
          {report.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-400" />
            <span className="text-gray-300">{report.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-gray-400" />
            <span className="text-gray-300">
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-teal-400" />
            <span className="text-teal-400 font-semibold text-lg">
              ${report.totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 