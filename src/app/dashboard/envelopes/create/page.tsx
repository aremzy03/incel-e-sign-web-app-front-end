'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Save, Send, Keyboard } from 'lucide-react'
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [activeDragFieldType, setActiveDragFieldType] = useState<string | null>(null)
  const [pageMetrics, setPageMetrics] = useState<Record<string, { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number; scale: number }>>({})

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
      
      const temp = newOrder[index]
      newOrder[index] = newOrder[targetIndex]
      newOrder[targetIndex] = temp
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

  // Receive per-page metrics from PDF viewer
  const handlePageMetricsChange = useCallback((pageKey: string, metrics: { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number; scale: number }) => {
    setPageMetrics((prev) => ({ ...prev, [pageKey]: metrics }))
  }, [])

  // DnD handlers (page-level)
  const handleDragStart = useCallback((event: any) => {
    const data = event.active?.data?.current
    if (data?.type === 'field-palette-item') {
      setActiveDragFieldType(data.fieldType as string)
    }
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveDragFieldType(null)
  }, [])

  const handleDragEnd = useCallback((event: any) => {
    const activeData = event.active?.data?.current
    const over = event.over
    const overData = over?.data?.current

    setActiveDragFieldType(null)

    if (activeData?.type === 'field-palette-item' && overData?.type === 'page') {
      const fieldType = activeData.fieldType as string
      const { documentId, pageNumber } = overData

      // Compute drop coordinates using the dragged element's translated rect at drop time
      // This avoids using the initial activator event (which causes right-edge clamping)
      const overRect = over.rect
      const activeRect = event.active?.rect?.current
      const translated = activeRect?.translated || activeRect?.initial
      const pointerX = translated ? translated.left + (translated.width || 0) / 2 : overRect.left + overRect.width / 2
      const pointerY = translated ? translated.top + (translated.height || 0) / 2 : overRect.top + overRect.height / 2

      // Field dimensions (must match FieldBox defaults)
      const fieldWidth = 200
      const fieldHeight = 50

      // Place field so its center is under the cursor
      let x = pointerX - overRect.left - fieldWidth / 2
      let y = pointerY - overRect.top - fieldHeight / 2

      // Constrain coordinates to stay within the visible PDF bounds
      x = Math.max(0, Math.min(x, overRect.width - fieldWidth))
      y = Math.max(0, Math.min(y, overRect.height - fieldHeight))

      console.log('Drop coordinates:', { x, y, overRect, fieldType, documentId, pageNumber })
      
      handleFieldDrop(fieldType, documentId, pageNumber, x, y)
    }
  }, [handleFieldDrop])

  // Handle field position change
  const handleFieldPositionChange = useCallback((fieldId: string, position: Partial<FieldPosition>) => {
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach(docId => {
        if (newPositions[docId][fieldId]) {
          // Preserve existing x/y if the update does not include them
          const current = newPositions[docId][fieldId]
          newPositions[docId][fieldId] = {
            ...current,
            ...position,
            x: position.x !== undefined ? position.x : current.x,
            y: position.y !== undefined ? position.y : current.y,
            page: position.page !== undefined ? position.page : current.page,
          }
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
    
    // Enforce assignment for signature fields; non-signature fields must have settings when present
    const unassignedSignatureFields = Object.values(fieldPositions).flatMap(docFields =>
      Object.values(docFields).filter(field => field.type === 'signature' && !field.assignedTo)
    )
    
    if (unassignedSignatureFields.length > 0) {
      errors.push(`${unassignedSignatureFields.length} signature field(s) are not assigned to recipients`)
    }

    // Non-signature fields config completeness
    const incomplete: string[] = []
    Object.values(fieldPositions).forEach(docFields => {
      Object.values(docFields).forEach(field => {
        if (field.type === 'signature') return
        // must be assigned
        if (!field.assignedTo) {
          incomplete.push(field.id)
          return
        }
        // common required props
        const hasRequired = typeof field.required === 'boolean'
        const hasFont = !!field.font_family && typeof field.font_size === 'number'
        if (!hasRequired || !hasFont) {
          incomplete.push(field.id)
          return
        }
        if (field.type === 'date') {
          if (!field.date_format) incomplete.push(field.id)
        }
        if (field.type === 'text') {
          if (field.placeholder === undefined || field.max_length === undefined) incomplete.push(field.id)
        }
        if (field.type === 'designation') {
          if (field.max_length === undefined) incomplete.push(field.id)
        }
      })
    })
    if (incomplete.length > 0) {
      errors.push('Some non-signature fields are missing settings')
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

      // Helper to convert from rendered CSS pixels to PDF points (top-left Y)
      const cssPxToPoints = (px: number) => (px * 72) / 96
      const convertFieldGeometry = (docId: string, field: FieldPosition) => {
        const pageKey = `${docId}-${field.page}`
        const metrics = pageMetrics[pageKey]
        if (!metrics) {
          return { x: field.x, y: field.y, width: field.width, height: field.height }
        }
        const scale = metrics.scale || 1
        const x1 = field.x / scale
        const y1 = field.y / scale
        const w1 = field.width / scale
        const h1 = field.height / scale
        return {
          x: cssPxToPoints(x1),
          y: cssPxToPoints(y1),
          width: cssPxToPoints(w1),
          height: cssPxToPoints(h1),
        }
      }

      // Build documents with positions (only signature fields for backend)
      const documents_with_positions = Object.entries(fieldPositions).map(([docId, docFields]) => {
        const signer_document_positions = Object.values(docFields)
          .filter(field => field.type === 'signature' && field.assignedTo)
          .map(field => {
            const recipient = recipients.find(r => r.id.toString() === field.assignedTo)
            const validRecipient = valid.find(v => v.email.toLowerCase() === recipient?.email.toLowerCase())
            const geom = convertFieldGeometry(docId, field)
            
            return {
              signer_id: validRecipient!.user.id,
              position: {
                page: field.page,
                x: geom.x,
                y: geom.y,
                width: geom.width,
                height: geom.height,
              },
            }
          })

        return {
          document_id: docId,
          signer_document_positions,
        }
      })

      // Build non-signature fields for backend (optional + include only assigned)
      const recipientEmailToUserId: Record<string, string> = {}
      valid.forEach(v => {
        recipientEmailToUserId[v.email.toLowerCase()] = v.user.id
      })

      const localRecipientIdToUserId: Record<string, string> = {}
      recipients.forEach(r => {
        const userId = recipientEmailToUserId[r.email.toLowerCase()]
        if (userId) localRecipientIdToUserId[r.id.toString()] = userId
      })

      type BackendField = {
        document_id: string
        page: number
        x: number
        y: number
        width: number
        height: number
        type: 'initials' | 'date' | 'text' | 'designation'
        assigned_signer: string
        required: boolean
        prefill_value?: string | null
        font_family?: string
        font_size?: number
        date_format?: string
        placeholder?: string
        max_length?: number
      }

      const fields: BackendField[] = []
      Object.entries(fieldPositions).forEach(([docId, docFields]) => {
        Object.values(docFields).forEach(field => {
          if (field.type === 'signature') return
          const assignedUserId = field.assignedTo ? localRecipientIdToUserId[field.assignedTo] : undefined
          if (!assignedUserId) return

          const geom = convertFieldGeometry(docId, field)
          const base = {
            document_id: docId,
            page: Math.max(1, field.page),
            x: Math.max(0, geom.x),
            y: Math.max(0, geom.y),
            width: Math.max(20, geom.width),
            height: Math.max(20, geom.height),
            assigned_signer: assignedUserId,
            required: !!field.required,
            font_family: field.font_family,
          }

          if (field.type === 'initials') {
            fields.push({ ...base, type: 'initials', prefill_value: field.prefill_value ?? null, font_size: field.font_size })
          } else if (field.type === 'date') {
            fields.push({ ...base, type: 'date', prefill_value: field.prefill_value ?? null, date_format: field.date_format, font_size: field.font_size })
          } else if (field.type === 'text') {
            fields.push({ ...base, type: 'text', prefill_value: field.prefill_value ?? null, placeholder: field.placeholder, max_length: field.max_length, font_size: field.font_size })
          } else if (field.type === 'designation') {
            fields.push({ ...base, type: 'designation', prefill_value: field.prefill_value ?? null, max_length: field.max_length, font_size: field.font_size })
          }
        })
      })

      const payload = {
        document_ids: uploadedDocuments.map(d => d.id),
        signing_order,
        documents_with_positions,
        ...(fields.length > 0 ? { fields } : {}),
        ...(envelopeName && { name: envelopeName }),
      }

      try {
        console.log('[CreateEnvelope] documents_with_positions:', JSON.parse(JSON.stringify(documents_with_positions)))
        console.log('[CreateEnvelope] fields (non-signature):', JSON.parse(JSON.stringify(fields)))
      } catch {}
      
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key - remove active field
      if (event.key === 'Delete' && activeFieldId) {
        handleFieldDelete(activeFieldId)
        return
      }
      
      // Escape key - clear selection
      if (event.key === 'Escape') {
        setActiveFieldId(null)
        return
      }
      
      // Ctrl/Cmd + S - save draft
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleSaveDraft()
        return
      }
      
      // Ctrl/Cmd + Enter - send envelope
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSend()
        return
      }
      
      // ? key - show keyboard shortcuts
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeFieldId, handleFieldDelete, handleSaveDraft, handleSend])

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
                <span className="text-xs text-gray-500 ml-1">(Ctrl+S)</span>
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={creating || sending || isValidating || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Now'}
                <span className="text-xs text-gray-500 ml-1">(Ctrl+Enter)</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(true)}
                className="flex items-center gap-1"
              >
                <Keyboard className="h-4 w-4" />
                <span className="text-xs">?</span>
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
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex-1 flex overflow-hidden relative z-10">
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
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDragFieldType && (
          <div className="pointer-events-none rounded-md border bg-white px-3 py-2 text-xs shadow-lg z-[9999]">
            {activeDragFieldType}
          </div>
        )}
      </DragOverlay>
      </DndContext>

      {/* Field Settings Panel */}
      {activeFieldId && (() => {
        let activeField: FieldPosition | null = null
        Object.values(fieldPositions).forEach(docFields => {
          if (docFields[activeFieldId!]) activeField = docFields[activeFieldId!]
        })
        if (!activeField) return null
        const f = activeField as FieldPosition
        if (f.type === 'signature') return null
        const update = (patch: Partial<FieldPosition>) => handleFieldPositionChange(activeFieldId!, patch)
        return (
          <div className="fixed right-4 bottom-4 w-full max-w-sm bg-white border rounded-lg shadow-lg z-[1000]">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">Field Settings ({f.type})</div>
              <Button variant="ghost" size="sm" onClick={() => setActiveFieldId(null)}>✕</Button>
            </div>
            <div className="p-4 space-y-3">
              {/* Assigned signer info */}
              <div className="text-xs text-gray-600">Assigned: {recipients.find(r => r.id.toString() === f.assignedTo)?.name || 'Unassigned'}</div>

              {/* Required */}
              <div className="space-y-1">
                <Label className="text-xs">Required</Label>
                <div className="flex gap-2">
                  <Button variant={f.required ? 'default' : 'outline'} size="sm" onClick={() => update({ required: true })}>Yes</Button>
                  <Button variant={!f.required ? 'default' : 'outline'} size="sm" onClick={() => update({ required: false })}>No</Button>
                </div>
              </div>

              {/* Font family/size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font family</Label>
                  <Select value={f.font_family || ''} onValueChange={(v) => update({ font_family: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font size</Label>
                  <Input type="number" value={f.font_size ?? ''} onChange={(e) => update({ font_size: Number(e.target.value) || undefined })} />
                </div>
              </div>

              {/* Prefill value */}
              <div>
                <Label className="text-xs">Prefill value</Label>
                <Input value={f.prefill_value ?? ''} onChange={(e) => update({ prefill_value: e.target.value })} />
              </div>

              {f.type === 'date' && (
                <div>
                  <Label className="text-xs">Date format</Label>
                  <Select value={f.date_format || ''} onValueChange={(v) => update({ date_format: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                      <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {f.type === 'text' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input value={f.placeholder || ''} onChange={(e) => update({ placeholder: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Max length</Label>
                    <Input type="number" value={f.max_length ?? ''} onChange={(e) => update({ max_length: Number(e.target.value) || undefined })} />
                  </div>
                </div>
              )}

              {f.type === 'designation' && (
                <div>
                  <Label className="text-xs">Max length</Label>
                  <Input type="number" value={f.max_length ?? ''} onChange={(e) => update({ max_length: Number(e.target.value) || undefined })} />
                </div>
              )}

              <div className="text-[10px] text-gray-500">Tip: Required means signer must fill unless a prefill value is provided.</div>
            </div>
          </div>
        )
      })()}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Delete selected field</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Clear selection</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Save draft</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Send envelope</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">?</kbd>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Tip: Drag fields from the sidebar onto documents to place them, then click to assign recipients.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
