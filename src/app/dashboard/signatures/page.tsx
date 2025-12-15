'use client'

import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload, FileImage } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  listUserSignatures,
  uploadUserSignature,
  type ReusableSignature,
  deleteUserSignature,
} from '@/lib/api/signatures'

export default function SignaturesPage() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  const { data: signatures, isLoading } = useQuery<ReusableSignature[]>({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected')
      // Backend will handle any background removal or processing.
      return await uploadUserSignature(
        selectedFile,
        selectedFile.name.replace(/\.[^/.]+$/, '')
      )
    },
    onSuccess: () => {
      toast.success('Signature uploaded')
      setSelectedFile(null)
      setLocalPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['signatures', 'user'] })
    },
    onError: () => {
      toast.error('Failed to upload signature')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteUserSignature(id),
    onSuccess: () => {
      toast.success('Signature deleted')
      queryClient.invalidateQueries({ queryKey: ['signatures', 'user'] })
    },
    onError: () => toast.error('Failed to delete signature'),
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return
    uploadMutation.mutate()
  }

  const handleDelete = (signatureId: string) => {
    deleteMutation.mutate(signatureId)
  }

  const hasSignatures = useMemo(() => (signatures?.length ?? 0) > 0, [signatures])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Signatures</h1>
          <p className="text-gray-600 mt-1">Upload and manage your reusable digital signatures</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Current Signatures</CardTitle>
          <CardDescription>Your uploaded signatures that can be used for document signing</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : hasSignatures ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatures!.map((signature) => (
                <div key={signature.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{signature.name}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(signature.id)}
                      className="h-8 w-8 p-0"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-white rounded-md mb-3 flex items-center justify-center h-28 border border-gray-200 overflow-hidden">
                    {/* Render actual image */}
                    {signature.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={signature.image_url} alt={signature.name} className="object-contain h-full" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">No preview</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Uploaded: {new Date(signature.uploaded_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures yet</h3>
              <p className="text-gray-600">Upload your first signature to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Upload New Signature</CardTitle>
          <CardDescription>Upload an image file (PNG or JPG) to create a reusable signature</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="signature-upload" className="text-sm font-medium text-gray-700">Choose File</label>
            <Input
              id="signature-upload"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
          {localPreviewUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPreviewUrl}
                  alt="Signature preview"
                  className="h-24 object-contain border rounded-md p-2 bg-white"
                />
              </div>
            </div>
          )}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Signature'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
