/**
 * File Upload Component
 * Provides drag and drop file upload functionality with visual feedback
 * Handles file selection, display, and removal
 */

import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from './ui/button'

interface FileUploadProps {
  title?: string
  subtitle?: string
  acceptedTypes?: string
  onFilesChange?: (files: File[]) => void
}

/**
 * Drag and drop file upload component
 * Handles file selection and display with visual feedback
 */
export function FileUpload({ 
  title = "Upload Files",
  subtitle = "Drag and drop your files here or browse",
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  onFilesChange 
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle drag over event
   * Prevents default behavior and shows drag feedback
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  /**
   * Handle drag leave event
   * Hides drag feedback when leaving the drop zone
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  /**
   * Handle file drop event
   * Processes dropped files and updates state
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const newFiles = [...uploadedFiles, ...files]
    setUploadedFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  /**
   * Handle file input change
   * Processes selected files from file input
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = [...uploadedFiles, ...files]
    setUploadedFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  /**
   * Remove a file from the uploaded files list
   */
  const removeFile = (indexToRemove: number) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove)
    setUploadedFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragActive 
            ? 'border-teal-400 bg-teal-400/5' 
            : 'border-gray-700 hover:border-gray-600'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={acceptedTypes}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragActive ? 'bg-teal-400/20' : 'bg-gray-800'}
          `}>
            <Upload className={`size-8 transition-colors duration-200 ${
              isDragActive ? 'text-teal-400' : 'text-gray-400'
            }`} />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-100 mb-2">
              {isDragActive ? 'Drop files here' : title}
            </p>
            <p className="text-gray-400 mb-4">
              {subtitle}{' '}
              <Button
                variant="link"
                onClick={handleBrowseClick}
                className="text-teal-400 hover:text-teal-300 underline transition-colors"
              >
                browse files
              </Button>
            </p>
            <p className="text-sm text-gray-500">
              Supports: Images, PDF, DOC, DOCX
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-teal-400" />
                  <div>
                    <p className="font-medium text-gray-100">{file.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 