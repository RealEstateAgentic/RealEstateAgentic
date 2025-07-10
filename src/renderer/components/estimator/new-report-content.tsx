/**
 * New Report Content Component
 * Main content area for creating new inspection reports
 */

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FileText, Upload, Zap } from 'lucide-react'

import { FileUpload, type UploadableFile } from './file-upload'
import { Button } from '~/src/renderer/components/ui/button'

import { storage } from '~/src/lib/firebase/config'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getCurrentUser } from '~/src/lib/firebase/auth'
import { createInspectionReport } from '~/src/lib/firebase/firestore'

interface NewReportContentProps {
  className?: string
}

/**
 * Content component for creating new inspection reports
 * Handles file upload and report generation workflow
 */
export function NewReportContent({ className = '' }: NewReportContentProps) {
  const [files, setFiles] = useState<UploadableFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const onAddFiles = async (newFiles: File[]) => {
    const newUploadableFiles: UploadableFile[] = newFiles.map(file => ({
      id: uuidv4(),
      file,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newUploadableFiles])

    for (const uploadableFile of newUploadableFiles) {
      await uploadFile(uploadableFile)
    }
  }

  const onRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
    // TODO: Add logic to cancel upload if in progress
  }

  const uploadFile = async (uploadableFile: UploadableFile) => {
    const user = getCurrentUser()
    if (!user) {
      // This should not happen if the user is on this screen,
      // but as a fallback, we can prevent the upload.
      setFiles(p =>
        p.map(f =>
          f.id === uploadableFile.id
            ? { ...f, status: 'error', error: 'You must be logged in to upload files.' }
            : f
        )
      )
      return
    }

    const { id, file } = uploadableFile
    const storageRef = ref(storage, `users/${user.uid}/inspection-reports/${id}-${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setFiles(p => p.map(f => (f.id === id ? { ...f, status: 'uploading' } : f)))

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setFiles(p => p.map(f => (f.id === id ? { ...f, progress } : f)))
      },
      error => {
        setFiles(p =>
          p.map(f =>
            f.id === id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        )
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        setFiles(p =>
          p.map(f =>
            f.id === id
              ? { ...f, status: 'completed', progress: 100, downloadURL, storagePath: uploadTask.snapshot.ref.fullPath }
              : f
          )
        )
      }
    )
  }

  const handleGenerateReport = async () => {
    const user = getCurrentUser()
    if (!user) {
      alert('You must be logged in to generate a report.')
      return
    }

    if (files.length === 0) return

    const successfulUploads = files.filter(f => f.status === 'completed')
    if (successfulUploads.length !== files.length) {
      alert('Please wait for all files to finish uploading.')
      return
    }

    setIsGenerating(true)

    try {
      const newReport = {
        name: `Inspection Report - ${new Date().toLocaleString()}`,
        files: successfulUploads.map(f => ({
          fileName: f.file.name,
          downloadURL: f.downloadURL || '',
          storagePath: f.storagePath || '',
          size: f.file.size,
          contentType: f.file.type
        })),
      }

      const newReportId = await createInspectionReport(newReport)

      alert(
        `Successfully created new inspection report with ID: ${newReportId}`
      )
      
      // Clear the form
      setFiles([])

    } catch (error) {
      console.error('Error creating inspection report:', error)
      alert('Failed to create inspection report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-8 bg-white ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#3B7097] rounded-lg">
            <FileText className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Inspection Report
            </h1>
            <p className="text-gray-600 mt-1">
              Upload property inspection documents to generate a comprehensive
              repair estimate
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* File Upload Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="size-5 text-[#3B7097]" />
            Upload Inspection Documents
          </h2>
          <FileUpload
            title="Upload Inspection Files"
            subtitle="Drag and drop your inspection documents, photos, or reports here"
            acceptedTypes="image/*,.pdf,.doc,.docx"
            files={files}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
          />
        </div>

        {/* Generate Report Section */}
        {files.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="size-5 text-[#3B7097]" />
              Generate Report
            </h3>
            <p className="text-gray-600 mb-6">
              Ready to analyze {files.length} file
              {files.length !== 1 ? 's' : ''} and generate your inspection
              report with repair estimates.
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || files.some(f => f.status === 'uploading')}
              className="w-full bg-[#3B7097] hover:bg-[#3B7097]/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
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
        <div className="bg-[#F6E2BC]/30 border border-[#F6E2BC] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How it works
          </h3>
          <div className="space-y-2 text-gray-700">
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