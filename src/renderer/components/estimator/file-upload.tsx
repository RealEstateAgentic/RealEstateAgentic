/**
 * File Upload Component
 * Provides drag and drop file upload functionality with visual feedback
 * Handles file selection, display, and removal
 */

import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '~/src/renderer/components/ui/button'
import { Progress } from '~/src/renderer/components/ui/progress'
import { Card, CardContent } from '~/src/renderer/components/ui/card'

export type UploadableFile = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  downloadURL?: string
  storagePath?: string
  error?: string
}

interface FileUploadProps {
  title?: string
  subtitle?: string
  acceptedTypes?: string
  files: UploadableFile[]
  onAddFiles: (files: File[]) => void
  onRemoveFile: (id: string) => void
}

/**
 * Drag and drop file upload component
 * Handles file selection and display with visual feedback
 */
export function FileUpload({
  title = 'Upload Files',
  subtitle = 'Drag and drop your files here or browse',
  acceptedTypes = 'image/*,.pdf,.doc,.docx',
  files,
  onAddFiles,
  onRemoveFile
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const newFiles = Array.from(e.dataTransfer.files)
    if (newFiles.length > 0) {
      onAddFiles(newFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length > 0) {
      onAddFiles(newFiles)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400 bg-white'}
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
          <div
            className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragActive ? 'bg-primary/20' : 'bg-gray-100'}
          `}
          >
            <Upload className={`size-8 transition-colors duration-200 ${isDragActive ? 'text-primary' : 'text-gray-600'}`} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">{isDragActive ? 'Drop files here' : title}</p>
            <p className="text-gray-600 mb-4">
              {subtitle}{' '}
              <Button variant="link" onClick={handleBrowseClick} className="text-primary hover:text-primary/80 underline">
                browse files
              </Button>
            </p>
            <p className="text-sm text-gray-500">Supports: Images, PDF, DOC, DOCX</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files ({files.length})</h3>
          <div className="space-y-3">
            {files.map((uploadableFile) => (
              <Card key={uploadableFile.id} className="w-full">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="size-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{uploadableFile.file.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">{formatFileSize(uploadableFile.file.size)}</p>
                        {uploadableFile.status === 'uploading' && <p className="text-sm text-gray-500">{Math.round(uploadableFile.progress)}%</p>}
                      </div>
                      {uploadableFile.status === 'uploading' && <Progress value={uploadableFile.progress} className="h-1 mt-1" />}
                      {uploadableFile.status === 'completed' && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> Completed</p>}
                      {uploadableFile.status === 'error' && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {uploadableFile.error}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => onRemoveFile(uploadableFile.id)} className="p-2 text-gray-600 hover:text-red-600">
                    <X className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 