'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Save, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { EnvelopeCreationSidebar } from '@/components/envelope/EnvelopeCreationSidebar'
import { VerticalPDFViewer } from '@/components/envelope/VerticalPDFViewer'
import { useCreateEnvelope, useSendEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeUserValidation } from '@/hooks/useUsers'
import { useDocuments } from '@/hooks/useDocuments'
import { Document } from '@/lib/api/documents'
import { FieldPosition, FieldPositions, RecipientInput, RECIPIENT_COLORS } from '@/types/envelope'

export default function CreateEnvelopePage() {
  const router = useRouter()
  const { data: existingDocuments } = useDocuments()
  const { mutateAsync: createAsync, isPending: creating } = useCreateEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()

  // State management
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([])
  const [recipients, setRecipients] = useState<RecipientInput[]>([])
  const [fieldPositions, setFieldPositions] = useState<FieldPositions>({})
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(1)
  const [nextRecipientId, setNextRecipientId] = useState(1)
  const [envelopeName, setEnvelopeName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add recipient with color assignment
  const addRecipient = useCallback((recipient: { email: string; name?: string }) => {
    const exists = recipients.some((r) => r.email.toLowerCase() === recipient.email.toLowerCase())
    if (exists) {
      toast.error('Recipient already added')
      return
    }

    const newRecipient: RecipientInput = {
      id: nextRecipientId,
      name: recipient.name?.trim() || '',
      email: recipient.email.trim(),
      order: recipients.length + 1,
      color: RECIPIENT_COLORS[recipients.length % RECIPIENT_COLORS.length],
    }
    
    setRecipients((prev) => [...prev, newRecipient])
    setNextRecipientId((id) => id + 1)
    toast.success(`Added ${recipient.name || recipient.email}`)
  }, [recipients, nextRecipientId])

  // Remove recipient
  const removeRecipient = useCallback((recipientId: number) => {
    setRecipients((prev) => prev.filter((r) => r.id !== recipientId))
    
    // Remove all fields assigned to this recipient
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach(docId => {
        Object.keys(newPositions[docId]).forEach(fieldId => {
          if (newPositions[docId][fieldId].assignedTo === recipientId.toString()) {
            delete newPositions[docId][fieldId]
          }
        })
      })
      return newPositions
    })
    
    toast.success('Recipient removed')
  }, [])

  // Reorder recipients
  const reorderRecipient = useCallback((recipientId: number, direction: 'up' | 'down') => {
    setRecipients((prev) => {
      const index = prev.findIndex((r) => r.id === recipientId)
      if (index < 0) return prev
      
      const newOrder = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return newOrder.map((r, idx) => ({ ...r, order: idx + 1 }))
    })
  }, [])

  // Add document
  const addDocument = useCallback((document: Document) => {
    setUploadedDocuments((prev) => [...prev, document])
  }, [])

  // Remove document
  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== documentId))
    
    // Remove all fields for this document
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      delete newPositions[documentId]
      return newPositions
    })
    
    toast.success('Document removed')
  }, [])

  // Select document (for future use)
  const selectDocument = useCallback((document: Document) => {
    // Could be used for highlighting or focusing on a specific document
    console.log('Selected document:', document)
  }, [])

  // Handle field drop
  const handleFieldDrop = useCallback((fieldType: string, documentId: string, page: number, x: number, y: number) => {
    const fieldId = `field-${nextFieldId}`
    const newField: FieldPosition = {
      id: fieldId,
      type: fieldType as any,
      page,
      x,
      y,
      width: 200,
      height: 50,
      assignedTo: null,
      documentId,
    }

    setFieldPositions((prev) => ({
      ...prev,
      [documentId]: {
        ...(prev[documentId] || {}),
        [fieldId]: newField,
      },
    }))

    setNextFieldId((id) => id + 1)
    setActiveFieldId(fieldId)
    toast.success(`${fieldType} field added`)
  }, [nextFieldId])

  // Handle field position change
  const handleFieldPositionChange = useCallback((fieldId: string, position: Partial<FieldPosition>) => {
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach(docId => {
        if (newPositions[docId][fieldId]) {
          newPositions[docId][fieldId] = { ...newPositions[docId][fieldId], ...position }
        }
      })
      return newPositions
    })
  }, [])

  // Handle field delete
  const handleFieldDelete = useCallback((fieldId: string) => {
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach(docId => {
        if (newPositions[docId][fieldId]) {
          delete newPositions[docId][fieldId]
        }
      })
      return newPositions
    })
    
    if (activeFieldId === fieldId) {
      setActiveFieldId(null)
    }
    
    toast.success('Field removed')
  }, [activeFieldId])

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    
    if (uploadedDocuments.length === 0) {
      errors.push('At least one document is required')
    }
    
    if (recipients.length === 0) {
      errors.push('At least one recipient is required')
    }
    
    // Check for unassigned fields
    const unassignedFields = Object.values(fieldPositions).flatMap(docFields =>
      Object.values(docFields).filter(field => !field.assignedTo)
    )
    
    if (unassignedFields.length > 0) {
      errors.push(`${unassignedFields.length} field(s) are not assigned to recipients`)
    }
    
    return errors
  }, [uploadedDocuments, recipients, fieldPositions])

  // Build payload for backend
  const buildPayload = useCallback(async () => {
    try {
      setError(null)
      
      // Validate users exist and get their IDs
      const emails = recipients.map((r) => r.email)
      const { valid, invalid } = await validateRecipients(emails)
      
      if (invalid.length > 0) {
        setError(`These emails are not registered: ${invalid.join(', ')}`)
        return null
      }

      // Map order to signer_id
      const signing_order = recipients.map((r) => {
        const found = valid.find((v) => v.email.toLowerCase() === r.email.toLowerCase())
        return {
          signer_id: found!.user.id,
          order: r.order,
        }
      })

      // Build documents with positions (only signature fields for backend)
      const documents_with_positions = Object.entries(fieldPositions).map(([docId, docFields]) => {
        const signer_document_positions = Object.values(docFields)
          .filter(field => field.type === 'signature' && field.assignedTo)
          .map(field => {
            const recipient = recipients.find(r => r.id.toString() === field.assignedTo)
            const validRecipient = valid.find(v => v.email.toLowerCase() === recipient?.email.toLowerCase())
            
            return {
              signer_id: validRecipient!.user.id,
              position: {
                page: field.page,
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
              },
            }
          })

        return {
          document_id: docId,
          signer_document_positions,
        }
      })

      const payload = {
        document_ids: uploadedDocuments.map(d => d.id),
        signing_order,
        documents_with_positions,
        ...(envelopeName && { name: envelopeName }),
      }
      
      return payload
    } catch (e: any) {
      setError(e?.message || 'Failed to create envelope')
      return null
    }
  }, [uploadedDocuments, recipients, fieldPositions, envelopeName, validateRecipients])

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    try {
      const payload = await buildPayload()
      if (!payload) return
      
      const created = await createAsync(payload as any)
      setSuccess('Envelope saved as draft!')
      router.push(`/dashboard/envelopes/${created.id}`)
    } catch (error: any) {
      console.error('Save draft error:', error)
      if (error.response?.data?.data?.signing_order) {
        setError(`Position validation failed: ${error.response.data.data.signing_order.join(', ')}`)
      } else if (error.response?.data?.message) {
        setError(`Error saving draft: ${error.response.data.message}`)
      } else {
        setError('Failed to save draft. Please check console for details.')
      }
    }
  }, [buildPayload, createAsync, router])

  // Send envelope
  const handleSend = useCallback(async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    try {
      const payload = await buildPayload()
      if (!payload) return
      
      const created = await createAsync(payload as any)
      await sendAsync(created.id)
      setSuccess('Envelope sent successfully!')
      router.push(`/dashboard/envelopes/${created.id}`)
    } catch (error: any) {
      console.error('Send error:', error)
      if (error.response?.data?.data?.signing_order) {
        setError(`Position validation failed: ${error.response.data.data.signing_order.join(', ')}`)
      } else if (error.response?.data?.message) {
        setError(`Error sending envelope: ${error.response.data.message}`)
      } else {
        setError('Failed to send envelope. Please check console for details.')
      }
    }
  }, [validationErrors, buildPayload, createAsync, sendAsync, router])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Envelope</h1>
            <p className="text-gray-600 mt-1">Drag fields onto documents to set up signing</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="envelope-name" className="text-sm font-medium">Envelope Name:</Label>
              <Input
                id="envelope-name"
                placeholder="e.g., Contract Agreement"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={creating || isValidating || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {creating ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={creating || sending || isValidating || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50 mx-4 mt-4">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <EnvelopeCreationSidebar
          uploadedDocuments={uploadedDocuments}
          recipients={recipients}
          fieldPositions={fieldPositions}
          onDocumentAdd={addDocument}
          onDocumentRemove={removeDocument}
          onDocumentSelect={selectDocument}
          onRecipientAdd={addRecipient}
          onRecipientRemove={removeRecipient}
          onRecipientReorder={reorderRecipient}
          onFieldDrop={handleFieldDrop}
        />

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <VerticalPDFViewer
            documents={uploadedDocuments}
            fieldPositions={fieldPositions}
            recipients={recipients}
            activeFieldId={activeFieldId}
            onFieldSelect={setActiveFieldId}
            onFieldPositionChange={handleFieldPositionChange}
            onFieldDelete={handleFieldDelete}
            onFieldDrop={handleFieldDrop}
          />
        </div>
      </div>
    </div>
  )
}
