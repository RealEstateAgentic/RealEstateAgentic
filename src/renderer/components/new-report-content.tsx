/**
 * New Report Content Component
 * Main content area for creating new inspection reports
 */

import { useState } from 'react'
import { FileUpload } from './file-upload'
import { Button } from './ui/button'
import { FileText, Upload, Zap } from 'lucide-react'

interface NewReportContentProps {
  className?: string
}

/**
 * Content component for creating new inspection reports
 * Handles file upload and report generation workflow
 */
export function NewReportContent({ className = '' }: NewReportContentProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Handle file selection from upload component
   */
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
  }

  /**
   * Generate inspection report from uploaded files
   */
  const handleGenerateReport = async () => {
    if (uploadedFiles.length === 0) return

    setIsGenerating(true)
    
    try {
      // TODO: Implement actual report generation logic
      // For MVP, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Generating report from files:', uploadedFiles.map(f => f.name))
      
      // TODO: Navigate to generated report or show success state
      alert('Report generation would happen here. For MVP, this creates a new inspection report.')
      
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-8 bg-gray-950 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-600 rounded-lg">
            <FileText className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              Create Inspection Report
            </h1>
            <p className="text-gray-400 mt-1">
              Upload property inspection documents to generate a comprehensive repair estimate
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* File Upload Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Upload className="size-5 text-teal-400" />
            Upload Inspection Documents
          </h2>
          <FileUpload
            title="Upload Inspection Files"
            subtitle="Drag and drop your inspection documents, photos, or reports here"
            acceptedTypes="image/*,.pdf,.doc,.docx"
            onFilesChange={handleFilesChange}
          />
        </div>

        {/* Generate Report Section */}
        {uploadedFiles.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Zap className="size-5 text-teal-400" />
              Generate Report
            </h3>
            <p className="text-gray-400 mb-6">
              Ready to analyze {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} 
              and generate your inspection report with repair estimates.
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating Report...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="size-4" />
                  Generate Inspection Report
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">
            How it works
          </h3>
          <div className="space-y-2 text-gray-400">
            <p>• Upload inspection photos, documents, or reports</p>
            <p>• AI analyzes the content to identify repair needs</p>
            <p>• Get a comprehensive report with cost estimates</p>
            <p>• Download or share your professional inspection report</p>
          </div>
        </div>
      </div>
    </div>
  )
} 