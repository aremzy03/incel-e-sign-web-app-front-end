'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { uploadDocument } from '@/lib/api/documents'
import toast from 'react-hot-toast'

export default function DocumentUploadPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }
    
    // Check file size (20MB = 20 * 1024 * 1024 bytes)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 20MB'
    }
    
    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    setSelectedFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (selectedFile) {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)
      
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + 10
          })
        }, 200)
        
        console.log(`Uploading ${selectedFile.name}`)
        
        // Call the actual API
        const response = await uploadDocument(selectedFile)
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        console.log('Upload successful:', response)
        
        // Show success toast
        toast.success(`Document "${response.data.file_name}" has been uploaded and is ready for signing.`)
        
        setUploadSuccess(true)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Redirect to documents list after a short delay
        setTimeout(() => {
          router.push('/dashboard/documents')
        }, 2000)
        
      } catch (err: any) {
        console.error('Upload error:', err)
        
        // Show error toast
        toast.error(err.message || 'Upload failed. Please try again.')
        
        setError(err.message || 'Upload failed. Please try again.')
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Upload a Document</CardTitle>
          <CardDescription>
            Upload PDF files to your account for digital signing
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Alert */}
          {uploadSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Document uploaded successfully! You can now use it to create envelopes.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          {/* Drag and Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              selectedFile && "border-green-300 bg-green-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-green-600">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragOver ? 'Drop your PDF here' : 'Drag and drop your PDF here'}
                  </p>
                  <p className="text-sm text-gray-500">or</p>
                </div>
                <Button onClick={handleChooseFile} variant="outline">
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* File requirements */}
          <div className="text-center text-sm text-gray-500">
            <p>Supported: PDF only • Max 20MB</p>
          </div>

          {/* Upload button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !!error || isUploading}
              className="w-full max-w-xs"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
