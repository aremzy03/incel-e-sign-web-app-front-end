'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload, FileImage } from 'lucide-react'

// Dummy data for signatures
const dummySignatures = [
  {
    id: 1,
    name: 'John Doe Signature',
    imageUrl: '/api/placeholder/200/100', // Placeholder for signature image
    uploadedAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Initials',
    imageUrl: '/api/placeholder/200/100', // Placeholder for signature image
    uploadedAt: '2025-01-14'
  }
]

export default function SignaturesPage() {
  const [signatures, setSignatures] = useState(dummySignatures)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      console.log('Uploading signature:', selectedFile.name)
      // Mock upload - just add to state
      const newSignature = {
        id: signatures.length + 1,
        name: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
        imageUrl: '/api/placeholder/200/100',
        uploadedAt: new Date().toISOString().split('T')[0]
      }
      setSignatures([...signatures, newSignature])
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById('signature-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    }
  }

  const handleDelete = (signatureId: number) => {
    console.log('Deleting signature:', signatureId)
    setSignatures(signatures.filter(sig => sig.id !== signatureId))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Signatures</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage your reusable digital signatures
          </p>
        </div>
      </div>

      {/* Current Signatures */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Current Signatures</CardTitle>
          <CardDescription>
            Your uploaded signatures that can be used for document signing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{signature.name}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(signature.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4 mb-3 flex items-center justify-center h-24 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Signature Preview</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Uploaded: {signature.uploadedAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures yet</h3>
              <p className="text-gray-600">
                Upload your first signature to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload New Signature */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Upload New Signature</CardTitle>
          <CardDescription>
            Upload an image file (PNG or JPG) to create a reusable signature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="signature-upload" className="text-sm font-medium text-gray-700">
              Choose File
            </label>
            <Input
              id="signature-upload"
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Signature
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
