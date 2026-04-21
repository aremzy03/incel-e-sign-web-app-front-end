'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Save, Send, Keyboard } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { EnvelopeCreationSidebar } from '@/components/envelope/EnvelopeCreationSidebar'
import dynamic from 'next/dynamic'
import { useSidebar } from '@/app/dashboard/dashboard-client-layout'
import { useEditEnvelope, useEnvelope, useSendEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeUserValidation } from '@/hooks/useUsers'
import { useDocuments } from '@/hooks/useDocuments'
import { Document, mergeDocuments } from '@/lib/api/documents'
import { FieldPosition, FieldPositions, RecipientInput, RECIPIENT_COLORS } from '@/types/envelope'
import { getEnvelopeDocuments } from '@/lib/api/envelopes'

export default function EditEnvelopePage() {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id || ''
  // Avoid SSR of PDF viewer (uses DOM APIs)
  const VerticalPDFViewer = useMemo(
    () => dynamic(() => import('@/components/envelope/VerticalPDFViewer').then(m => m.VerticalPDFViewer), { ssr: false }),
    []
  )
  const { isCollapsed } = useSidebar()
  const router = useRouter()
  const { mutateAsync: editAsync, isPending: saving } = useEditEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()
  const { data: existingDocuments } = useDocuments()
  const { data: envelope, isLoading: envelopeLoading } = useEnvelope(envelopeId)
  const { data: envelopeDocuments, isLoading: envelopeDocumentsLoading } = useQuery({
    queryKey: ['envelope-documents', envelopeId, 'edit'],
    queryFn: () => getEnvelopeDocuments(envelopeId),
    enabled: Boolean(envelopeId),
  })

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
  const [isMerging, setIsMerging] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [initialized, setInitialized] = useState(false)
  const [description, setDescription] = useState<string>('')

  useEffect(() => {
    if (!envelope || !envelopeDocuments || initialized) return

    const sortedRecipients = (Array.isArray(envelope.recipients) ? [...envelope.recipients] : [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const initialRecipients: RecipientInput[] = sortedRecipients.map((recipient, index) => ({
      id: index + 1,
      name: recipient.name || recipient.email,
      email: recipient.email,
      order: recipient.order ?? index + 1,
      color: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length],
    }))

    setRecipients(initialRecipients)
    setNextRecipientId(initialRecipients.length + 1)
    setEnvelopeName(envelope.name || '')
    setDescription(envelope.description || '')

    const initialDocuments: Document[] = envelopeDocuments.map((doc): Document => ({
      id: doc.id,
      file_name: doc.file_name || doc.document_file_name || `Document ${doc.id}`,
      file_url: doc.document_file_url || '',
      file_size: doc.file_size ?? 0,
      status: 'draft',
      created_at: doc.created_at || new Date().toISOString(),
      updated_at: doc.updated_at || new Date().toISOString(),
    }))
    setUploadedDocuments(initialDocuments)

    const recipientIdBySigner: Record<string, number> = {}
    sortedRecipients.forEach((recipient, index) => {
      const localId = index + 1
      if (recipient?.id) {
        const key = String(recipient.id)
        recipientIdBySigner[key] = localId
        recipientIdBySigner[key.toLowerCase()] = localId
      }
      if (recipient?.email) {
        const emailKey = recipient.email.toLowerCase()
        recipientIdBySigner[emailKey] = localId
      }
    })

    const initialFieldPositions: FieldPositions = {}
    let fieldCounter = 1

    envelopeDocuments.forEach((doc) => {
      const docPositions: Record<string, FieldPosition> = {}

      doc.signer_document_positions?.forEach((entry) => {
        if (!entry?.position) return
        const signerIdKey = String(entry.signer_id ?? '')
        const localRecipientId = recipientIdBySigner[signerIdKey] ?? recipientIdBySigner[signerIdKey.toLowerCase()]
        const fieldId = `field-${fieldCounter++}`
        docPositions[fieldId] = {
          id: fieldId,
          type: 'signature',
          page: entry.position.page,
          x: entry.position.x,
          y: entry.position.y,
          width: entry.position.width,
          height: entry.position.height,
          assignedTo: localRecipientId ? String(localRecipientId) : null,
          documentId: doc.id,
        }
      })

      if (Object.keys(docPositions).length > 0) {
        initialFieldPositions[doc.id] = docPositions
      }
    })

    setFieldPositions(initialFieldPositions)
    setNextFieldId(fieldCounter)
    setInitialized(true)
  }, [envelope, envelopeDocuments, initialized])

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
      width: 116.8,
      height: 36.8,
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

  // Merge documents: create a new merged PDF and select only it
  const handleMergeDocuments = useCallback(async () => {
    if (uploadedDocuments.length < 2) {
      toast.error('Select at least two documents to merge')
      return
    }
    try {
      setIsMerging(true)
      const merged = await mergeDocuments(uploadedDocuments.map(d => d.id), 'merged.pdf')
      setUploadedDocuments([merged])
      setFieldPositions({})
      toast.success('Documents merged successfully')
    } catch (e: any) {
      console.error('Merge documents error:', e)
      const msg = e?.response?.data?.message || e?.message || 'Failed to merge documents'
      toast.error(msg)
    } finally {
      setIsMerging(false)
    }
  }, [uploadedDocuments])

  // Currently selected field (if any)
  const activeField: FieldPosition | null = useMemo(() => {
    if (!activeFieldId) return null
    for (const docFields of Object.values(fieldPositions)) {
      if (docFields[activeFieldId]) {
        return docFields[activeFieldId]
      }
    }
    return null
  }, [activeFieldId, fieldPositions])

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

      const trimmedDescription = description.trim()

      const payload = {
        document_ids: uploadedDocuments.map(d => d.id),
        signing_order,
        documents_with_positions,
        ...(fields.length > 0 ? { fields } : {}),
        ...(envelopeName && { name: envelopeName }),
        description: trimmedDescription.length > 0 ? trimmedDescription : null,
      }

      try {
        console.log('[EditEnvelope] documents_with_positions:', JSON.parse(JSON.stringify(documents_with_positions)))
        console.log('[EditEnvelope] fields (non-signature):', JSON.parse(JSON.stringify(fields)))
      } catch {}
      
      return payload
    } catch (e: any) {
      setError(e?.message || 'Failed to update envelope')
      return null
    }
  }, [uploadedDocuments, recipients, fieldPositions, envelopeName, description, validateRecipients])

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    try {
      const payload = await buildPayload()
      if (!payload) return
      
      await editAsync({ id: envelopeId, data: payload as any })
      setSuccess('Envelope updated successfully!')
      router.push(`/dashboard/envelopes/${envelopeId}`)
    } catch (error: any) {
      console.error('Save draft error:', error)
      if (error.response?.data?.data?.signing_order) {
        setError(`Position validation failed: ${error.response.data.data.signing_order.join(', ')}`)
      } else if (error.response?.data?.message) {
        setError(`Error saving changes: ${error.response.data.message}`)
      } else {
        setError('Failed to save changes. Please check console for details.')
      }
    }
  }, [buildPayload, editAsync, envelopeId, router])

  // Send envelope
  const handleSend = useCallback(async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    try {
      const payload = await buildPayload()
      if (!payload) return
      
      await editAsync({ id: envelopeId, data: payload as any })
      await sendAsync(envelopeId)
      setSuccess('Envelope sent successfully!')
      router.push(`/dashboard/envelopes/${envelopeId}`)
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
  }, [validationErrors, buildPayload, editAsync, envelopeId, sendAsync, router])

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

  if (!initialized && (envelopeLoading || envelopeDocumentsLoading)) {
    return <div className="p-6">Loading envelope…</div>
  }

  if (!envelope && initialized) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Envelope not found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Slim Header with step indicator */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">Edit envelope</h1>
              <p className="text-[11px] text-slate-600">
                Review documents, recipients, and fields before sending.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || isValidating || validationErrors.length > 0}
                className="flex items-center gap-1.5 h-8 px-3 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving…' : 'Save draft'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={saving || sending || isValidating || validationErrors.length > 0}
                className="flex items-center gap-1.5 h-8 px-3 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{sending ? 'Sending…' : 'Send'}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowKeyboardShortcuts(true)}
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-blue-600" />
              <span className="font-medium text-slate-900">Prepare</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
              <span>Set up &amp; send</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50 mx-3 mt-3">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mx-3 mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mx-3 mt-3">
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
        <div className="flex-1 flex min-h-0 bg-gray-100">
          <div className={`${isCollapsed ? 'max-w-[96rem] px-2' : 'max-w-7xl px-3'} mx-auto flex flex-1 gap-3 py-3 overflow-hidden`}>
            {/* Left Sidebar */}
            <div className={`${isCollapsed ? 'w-[320px]' : 'w-[240px]'} flex-shrink-0 hidden md:flex`}>
              {mounted ? (
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
                  onMergeDocuments={handleMergeDocuments}
                  isMerging={isMerging}
                  envelopeName={envelopeName}
                  onEnvelopeNameChange={setEnvelopeName}
                  description={description || ''}
                  onDescriptionChange={setDescription}
                  onSaveDraft={handleSaveDraft}
                  onSend={handleSend}
                  creating={saving}
                  sending={sending}
                  isValidating={isValidating}
                  hasValidationErrors={validationErrors.length > 0}
                  onShowShortcuts={() => setShowKeyboardShortcuts(true)}
                />
              ) : (
                <div className="w-full" />
              )}
            </div>

            {/* Central PDF Canvas */}
            <div className="flex-1 flex justify-center overflow-hidden min-w-0">
              <div className="flex-1 max-w-5xl flex min-w-0">
                <VerticalPDFViewer
                  documents={uploadedDocuments}
                  fieldPositions={fieldPositions}
                  recipients={recipients}
                  activeFieldId={activeFieldId}
                  onFieldSelect={setActiveFieldId}
                  onFieldPositionChange={handleFieldPositionChange}
                  onFieldDelete={handleFieldDelete}
                  onFieldDrop={handleFieldDrop}
                  onPageMetricsChange={handlePageMetricsChange}
                />
              </div>
            </div>

            {/* Right-hand Settings Panel */}
            {activeField && activeField.type !== 'signature' && (
              <div className="w-[300px] flex-shrink-0 hidden lg:block">
                <div className="h-full bg-white border rounded-lg shadow-sm flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Field Settings</div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{activeField.type}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveFieldId(null)}>
                      ✕
                    </Button>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto">
                    {/* Assigned signer info */}
                    <div className="text-xs text-gray-600">
                      Assigned:{' '}
                      {recipients.find((r) => r.id.toString() === activeField!.assignedTo)?.name ||
                        'Unassigned'}
                    </div>

                    {/* Required */}
                    <div className="space-y-1">
                      <Label className="text-xs">Required</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={activeField.required ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            handleFieldPositionChange(activeField!.id, { required: true })
                          }
                        >
                          Yes
                        </Button>
                        <Button
                          variant={!activeField.required ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            handleFieldPositionChange(activeField!.id, { required: false })
                          }
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    {/* Font family/size */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Font family</Label>
                        <Select
                          value={activeField.font_family || ''}
                          onValueChange={(v) =>
                            handleFieldPositionChange(activeField!.id, { font_family: v })
                          }
                        >
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
                        <Input
                          type="number"
                          value={activeField.font_size ?? ''}
                          onChange={(e) =>
                            handleFieldPositionChange(activeField!.id, {
                              font_size: Number(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Prefill value */}
                    <div>
                      <Label className="text-xs">Prefill value</Label>
                      <Input
                        value={activeField.prefill_value ?? ''}
                        onChange={(e) =>
                          handleFieldPositionChange(activeField!.id, {
                            prefill_value: e.target.value,
                          })
                        }
                      />
                    </div>

                    {activeField.type === 'date' && (
                      <div>
                        <Label className="text-xs">Date format</Label>
                        <Select
                          value={activeField.date_format || ''}
                          onValueChange={(v) =>
                            handleFieldPositionChange(activeField!.id, { date_format: v })
                          }
                        >
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

                    {activeField.type === 'text' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={activeField.placeholder || ''}
                            onChange={(e) =>
                              handleFieldPositionChange(activeField!.id, {
                                placeholder: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max length</Label>
                          <Input
                            type="number"
                            value={activeField.max_length ?? ''}
                            onChange={(e) =>
                              handleFieldPositionChange(activeField!.id, {
                                max_length: Number(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {activeField.type === 'designation' && (
                      <div>
                        <Label className="text-xs">Max length</Label>
                        <Input
                          type="number"
                          value={activeField.max_length ?? ''}
                          onChange={(e) =>
                            handleFieldPositionChange(activeField!.id, {
                              max_length: Number(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500">
                      Tip: Required means signer must fill unless a prefill value is provided.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      <DragOverlay dropAnimation={null}>
        {activeDragFieldType && (
          <div className="pointer-events-none rounded-md border bg-white px-3 py-2 text-xs shadow-lg z-[9999]">
            {activeDragFieldType}
          </div>
        )}
      </DragOverlay>
      </DndContext>

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
