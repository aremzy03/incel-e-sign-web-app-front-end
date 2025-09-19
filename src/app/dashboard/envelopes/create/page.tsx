'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, AlertCircle } from 'lucide-react'

// Dummy documents for selection
const dummyDocuments = [
  { id: 1, name: 'contract.pdf', status: 'Draft' },
  { id: 2, name: 'nda.pdf', status: 'Draft' },
  { id: 3, name: 'invoice.pdf', status: 'Draft' },
  { id: 4, name: 'agreement.pdf', status: 'Draft' },
  { id: 5, name: 'proposal.pdf', status: 'Draft' },
]

interface Signer {
  id: number
  email: string
  order: number
}

export default function CreateEnvelopePage() {
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerOrder, setSignerOrder] = useState<number>(1)
  const [signers, setSigners] = useState<Signer[]>([])
  const [nextSignerId, setNextSignerId] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddSigner = () => {
    if (signerEmail.trim() && signerOrder > 0) {
      const newSigner: Signer = {
        id: nextSignerId,
        email: signerEmail.trim(),
        order: signerOrder,
      }
      setSigners([...signers, newSigner])
      setSignerEmail('')
      setSignerOrder(signers.length + 2)
      setNextSignerId(nextSignerId + 1)
    }
  }

  const handleRemoveSigner = (signerId: number) => {
    setSigners(signers.filter(signer => signer.id !== signerId))
  }

  const handleCreateEnvelope = async () => {
    if (!selectedDocument || signers.length === 0) {
      setError('Please select a document and add at least one signer.')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const selectedDoc = dummyDocuments.find(doc => doc.id.toString() === selectedDocument)
      
      // Simulate creation delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Creating envelope:', {
        document: selectedDoc,
        signers: signers,
      })

      // Mock notification trigger
      const notification = {
        id: Date.now(),
        type: 'envelope_created',
        title: 'Envelope created successfully',
        message: `Envelope "${selectedDoc?.name}" has been created and sent to ${signers.length} recipient(s).`,
        timestamp: new Date().toISOString().split('T')[0],
        isRead: false
      }
      
      // In a real app, this would be sent to a notification service
      console.log('Notification triggered:', notification)
      
      setCreateSuccess(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => setCreateSuccess(false), 5000)
      
    } catch (err) {
      setError('Failed to create envelope. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedDocumentData = dummyDocuments.find(doc => doc.id.toString() === selectedDocument)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Envelope</h1>
        <p className="text-gray-600 mt-1">
          Set up a new document envelope for digital signing
        </p>
      </div>

      {/* Success Alert */}
      {createSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Envelope created successfully! The document has been sent to all recipients for signing.
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

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Envelope Setup</CardTitle>
          <CardDescription>
            Follow the steps below to create your envelope
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Step 1: Select Document */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Document</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a document from your uploaded files
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-select">Document</Label>
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {dummyDocuments.map((document) => (
                    <SelectItem key={document.id} value={document.id.toString()}>
                      {document.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 2: Add Signers */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Add Signers</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add signers and define their signing order
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signer-email">Signer Email</Label>
                <Input
                  id="signer-email"
                  type="email"
                  placeholder="signer@example.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-order">Signing Order</Label>
                <Input
                  id="signer-order"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={signerOrder}
                  onChange={(e) => setSignerOrder(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={handleAddSigner} className="w-full">
                  + Add Signer
                </Button>
              </div>
            </div>

            {/* Signers List */}
            {signers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Signers List:</h4>
                <div className="space-y-2">
                  {signers
                    .sort((a, b) => a.order - b.order)
                    .map((signer) => (
                      <div
                        key={signer.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600">
                            Order {signer.order}
                          </span>
                          <span className="text-sm text-gray-900">{signer.email}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSigner(signer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Review */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Review</h3>
              <p className="text-sm text-gray-600 mb-4">
                Review your envelope details before creating
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Selected Document:</span>
                <span className="text-sm text-gray-900">
                  {selectedDocumentData ? selectedDocumentData.name : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Total Signers:</span>
                <span className="text-sm text-gray-900">{signers.length}</span>
              </div>
              {signers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Signing Order:</span>
                  <span className="text-sm text-gray-900">
                    {signers
                      .sort((a, b) => a.order - b.order)
                      .map(signer => signer.email)
                      .join(' → ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleCreateEnvelope}
              disabled={!selectedDocument || signers.length === 0 || isCreating}
              className="px-8"
            >
              {isCreating ? 'Creating...' : 'Create Envelope'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
