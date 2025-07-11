/**
 * New Report Content Component
 * Main content area for creating new inspection reports
 */

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FileText, Upload, Zap, Eye, Download, ArrowLeft } from 'lucide-react'

import { FileUpload, type UploadableFile } from './file-upload'
import { Button } from '~/src/renderer/components/ui/button'

import { storage } from '~/src/lib/firebase/config'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getCurrentUser } from '~/src/lib/firebase/auth'
import { createInspectionReport } from '~/src/lib/firebase/firestore'
import { ReportStatusLogger } from './report-status-logger'
import { MarkdownRenderer } from './markdown-renderer'
import { marked } from 'marked'

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
  const [reportId, setReportId] = useState<string | null>(null)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!reportId) return

    const unsubscribe = window.App.report.onProgress(
      ({ message, isComplete, finalReport }) => {
        setProgressMessages(prev => [...prev, message])
        if (isComplete) {
          setIsGenerating(false)
          if (finalReport) {
            setFinalMarkdown(finalReport)
          }
        }
      },
    )

    return () => {
      unsubscribe()
    }
  }, [reportId])

  const exportToPDF = async () => {
    if (!finalMarkdown) return

    setIsExporting(true)
    const htmlContent = await marked.parse(finalMarkdown)

    try {
      // Use IPC to generate PDF in main process
      const result = await window.App.pdf.generate({
        htmlContent,
        title: 'Property Repair Estimate',
        filename: 'repair-estimate.pdf',
      })

      if (result.success) {
        console.log('PDF generated successfully:', result.filePath)

        // Show success notification with options
        const userChoice = confirm(
          `PDF generated successfully!\n\nClick OK to open the PDF, or Cancel to show it in folder.`,
        )

        if (userChoice) {
          await window.App.pdf.openFile(result.filePath ?? '')
        } else {
          await window.App.pdf.showInFolder(result.filePath ?? '')
        }
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      alert(`Failed to export PDF: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

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

    const successfulUploads = files.filter(f => f.status === 'completed')
    if (successfulUploads.length === 0 || successfulUploads.length !== files.length) {
      alert('Please wait for all files to finish uploading before generating a report.')
      return
    }

    setIsGenerating(true)
    setProgressMessages([])
    setFinalMarkdown(null)

    try {
      // Create the initial report document in Firestore
      const newReportData = {
        name: `Inspection Report - ${new Date().toLocaleString()}`,
        files: successfulUploads.map(f => ({
          fileName: f.file.name,
          downloadURL: f.downloadURL || '',
          storagePath: f.storagePath || '',
          size: f.file.size,
          contentType: f.file.type
        })),
        status: 'generating' as const,
        progressLog: ['Report generation initiated...']
      }
      const newReportId = await createInspectionReport(newReportData)
      setReportId(newReportId)

      const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(reader.result)
            } else {
              reject(new Error('Failed to read file as ArrayBuffer.'))
            }
          }
          reader.onerror = reject
          reader.readAsArrayBuffer(file)
        })
      }

      const fileArrayBuffers = await Promise.all(
        successfulUploads.map(f => readFileAsArrayBuffer(f.file))
      )

      // Trigger the agent in the main process
      const result = await window.App.report.generate(fileArrayBuffers, newReportId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to start agent.')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsGenerating(false) // Reset state on error
    }
  }

  if (isGenerating || (reportId && !finalMarkdown)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <ReportStatusLogger messages={progressMessages} />
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (finalMarkdown) {
      return (
        <>
          {/* Report Header */}
          <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
            <button
              onClick={() => setFinalMarkdown(null)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="size-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-[#3B7097]" />
              <h3 className="text-lg font-semibold text-gray-900">
                Generated Report
              </h3>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-gray-600" />
                <span className="text-sm text-gray-600">Live Preview</span>
              </div>
              <Button onClick={exportToPDF} disabled={isExporting}>
                <Download className="size-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </div>
          {/* Report Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              <MarkdownRenderer markdownContent={finalMarkdown} />
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        {/* Header */}
        <div className="p-8 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3B7097] rounded-lg">
              <FileText className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Repair Estimate
              </h1>
              <p className="text-gray-600 mt-1">
                Upload property inspection documents to generate a
                comprehensive repair estimate
              </p>
            </div>
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
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
                    {files.length !== 1 ? 's' : ''} and generate your
                    inspection report with repair estimates.
                  </p>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={files.some(f => f.status !== 'completed')}
                    className="w-full bg-[#3B7097] hover:bg-[#3B7097]/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="size-4" />
                      Generate Inspection Report
                    </div>
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
                  <p>
                    • Download or share your professional inspection report
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto bg-white flex flex-col flex-1 rounded-xl shadow-sm overflow-hidden mt-8 ${className}`}
    >
      {renderContent()}
    </div>
  )
}