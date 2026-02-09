'use client'

import { useState, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileImage, CheckCircle, AlertCircle } from 'lucide-react'

// Dummy data for signatures
const dummySignatures = [
  {
    id: 1,
    name: 'John Doe Signature',
    imageUrl: '/api/placeholder/200/100',
    uploadedAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Initials',
    imageUrl: '/api/placeholder/200/100',
    uploadedAt: '2025-01-14'
  }
]

// Dummy envelope data
const dummyEnvelope = {
  id: 'env-123',
  documentName: 'contract.pdf',
  status: 'Pending Signature',
  pages: 3,
  signerName: 'John Doe',
  signerEmail: 'john.doe@example.com'
}

export default function SigningSimulationPage({ params }: { params: Promise<{ envelopeId: string }> }) {
  const { envelopeId } = use(params)
  const [signatures] = useState(dummySignatures)
  const [selectedSignature, setSelectedSignature] = useState<number | null>(null)
  const [isSigned, setIsSigned] = useState(false)
  const [appliedSignature, setAppliedSignature] = useState<typeof dummySignatures[0] | null>(null)

  const handleSignatureSelect = (signatureId: number) => {
    setSelectedSignature(signatureId)
  }

  const handleApplySignature = () => {
    if (selectedSignature) {
      const signature = signatures.find(sig => sig.id === selectedSignature)
      if (signature) {
        console.log(`Signed with signature ${signature.name} on document ${dummyEnvelope.documentName}`)
        setAppliedSignature(signature)
        setIsSigned(true)
        alert('Document signed successfully! Check console for details.')
      }
    }
  }

  const getSignatureById = (id: number) => {
    return signatures.find(sig => sig.id === id)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sign Document</h1>
          <p className="text-gray-600 mt-1">
            Document: {dummyEnvelope.documentName}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Envelope ID: {envelopeId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isSigned ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Document Signed</span>
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Pending Signature</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                {dummyEnvelope.documentName} - {dummyEnvelope.pages} pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
                {/* Document Pages */}
                {Array.from({ length: dummyEnvelope.pages }, (_, index) => (
                  <div
                    key={index}
                    className="relative mb-4 bg-white border border-gray-200 rounded shadow-sm p-4 min-h-[200px]"
                  >
                    <div className="text-center text-gray-500 mb-4">
                      <FileImage className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Page {index + 1}</p>
                    </div>
                    
                    {/* Signature Drop Zone - Only on first page */}
                    {index === 0 && (
                      <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <FileImage className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-blue-600 font-medium">
                            {isSigned ? 'Signature Applied' : 'Drop Signature Here'}
                          </p>
                          {isSigned && appliedSignature && (
                            <div className="mt-2 p-2 bg-white border border-blue-200 rounded inline-block">
                              <div className="text-center">
                                <FileImage className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                <p className="text-xs text-blue-600 font-medium">
                                  {appliedSignature.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signature Selection - Right Side (1/3 width) */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>My Signatures</CardTitle>
              <CardDescription>
                Select a signature to apply to the document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  onClick={() => handleSignatureSelect(signature.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedSignature === signature.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="bg-gray-50 rounded-md p-3 mb-2 flex items-center justify-center h-16 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <FileImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Signature Preview</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{signature.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedSignature === signature.id ? 'Selected' : 'Click to select'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Apply Signature Button */}
          <Card className="bg-white shadow-sm mt-4">
            <CardContent className="p-4">
              <Button 
                onClick={handleApplySignature}
                disabled={!selectedSignature || isSigned}
                className="w-full"
                size="lg"
              >
                {isSigned ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Document Signed
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4 mr-2" />
                    Apply Signature
                  </>
                )}
              </Button>
              {!selectedSignature && !isSigned && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Please select a signature first
                </p>
              )}
            </CardContent>
          </Card>

          {/* Signing Status */}
          {isSigned && (
            <Card className="bg-green-50 border-green-200 mt-4">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-green-900 mb-1">Document Signed</h3>
                  <p className="text-sm text-green-700">
                    Signed with: {appliedSignature?.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
