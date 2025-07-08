/**
 * Repair Estimator screen for calculating property repair costs
 * Provides an interface for users to estimate repair expenses
 */

import { useState } from 'react'
import { FileUpload } from '../components/file-upload'
import { MarkdownRenderer } from '../components/markdown-renderer'

export function RepairEstimatorScreen() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  /**
   * Handle file changes from the FileUpload component
   */
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-teal-400 mb-2">Repair Estimator</h1>
        <p className="text-gray-400 mb-8">Upload property photos and documents to get started</p>

        <FileUpload 
          title="Drag and drop your property files here"
          subtitle="or"
          acceptedTypes="image/*,.pdf,.doc,.docx,.md"
          onFilesChange={handleFilesChange}
        />

        {/* Markdown Preview Section */}
        <div className="mt-12">
          <MarkdownRenderer 
            className="w-full"
            showPreview={true}
          />
        </div>
      </div>
    </div>
  )
} 