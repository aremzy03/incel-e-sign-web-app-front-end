'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { CheckCircle, AlertCircle, Keyboard, Lock, PenLine } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { SelfSignSidebar } from '@/components/envelope/SelfSignSidebar'
import { useSidebar } from '@/app/dashboard/dashboard-client-layout'
import { useSelfSignEnvelope } from '@/hooks/useEnvelopes'
import { Document, mergeDocuments } from '@/lib/api/documents'
import { listUserSignatures } from '@/lib/api/signatures'
import type { SelfSignRequest } from '@/lib/api/signatures'
import { FieldPosition, FieldPositions, RecipientInput, RECIPIENT_COLORS } from '@/types/envelope'

const SELF_RECIPIENT_ID = 1

export default function SelfSignPage() {
  const VerticalPDFViewer = useMemo(
    () => dynamic(() => import('@/components/envelope/VerticalPDFViewer').then((m) => m.VerticalPDFViewer), { ssr: false }),
    []
  )
  const { isCollapsed } = useSidebar()
  const router = useRouter()
  const { data: session } = useSession()
  const { mutateAsync: selfSignAsync, isPending: signing } = useSelfSignEnvelope()

  const selfRecipient: RecipientInput = useMemo(
    () => ({
      id: SELF_RECIPIENT_ID,
      name: session?.user?.full_name || 'You',
      email: session?.user?.email || '',
      order: 1,
      color: RECIPIENT_COLORS[0],
    }),
    [session?.user?.email, session?.user?.full_name]
  )
  const recipients = useMemo(() => [selfRecipient], [selfRecipient])

  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([])
  const [fieldPositions, setFieldPositions] = useState<FieldPositions>({})
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(1)
  const [envelopeName, setEnvelopeName] = useState('')
  const [description, setDescription] = useState('')
  const [pdfPasswordProtectionEnabled, setPdfPasswordProtectionEnabled] = useState(false)
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [activeDragFieldType, setActiveDragFieldType] = useState<string | null>(null)
  const [pageMetrics, setPageMetrics] = useState<
    Record<string, { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number; scale: number }>
  >({})
  const [isMerging, setIsMerging] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: signatures = [], isLoading: loadingSignatures } = useQuery({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (selectedSignatureId || signatures.length === 0) return
    const defaultSig = signatures.find((s) => s.is_default) ?? signatures[0]
    if (defaultSig) setSelectedSignatureId(defaultSig.id)
  }, [signatures, selectedSignatureId])

  const addDocument = useCallback((document: Document) => {
    setUploadedDocuments((prev) => [...prev, document])
  }, [])

  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== documentId))
    setFieldPositions((prev) => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
    toast.success('Document removed')
  }, [])

  const selectDocument = useCallback((_document: Document) => {}, [])

  const handleFieldDrop = useCallback((fieldType: string, documentId: string, page: number, x: number, y: number) => {
    const fieldId = `field-${nextFieldId}`
    const newField: FieldPosition = {
      id: fieldId,
      type: fieldType as FieldPosition['type'],
      page,
      x,
      y,
      width: 116.8,
      height: 36.8,
      assignedTo: String(SELF_RECIPIENT_ID),
      documentId,
      ...(fieldType !== 'signature'
        ? {
            required: false,
            font_family: 'Helvetica',
            font_size: 12,
            prefill_value: '',
            ...(fieldType === 'date' ? { date_format: 'YYYY-MM-DD' } : {}),
            ...(fieldType === 'text' ? { placeholder: '', max_length: 100 } : {}),
            ...(fieldType === 'designation' ? { max_length: 100 } : {}),
          }
        : {}),
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

  const handleDragStart = useCallback((event: any) => {
    const data = event.active?.data?.current
    if (data?.type === 'field-palette-item') {
      setActiveDragFieldType(data.fieldType as string)
    }
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveDragFieldType(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: any) => {
      const activeData = event.active?.data?.current
      const over = event.over
      const overData = over?.data?.current
      setActiveDragFieldType(null)

      if (activeData?.type === 'field-palette-item' && overData?.type === 'page') {
        const fieldType = activeData.fieldType as string
        const { documentId, pageNumber } = overData
        const overRect = over.rect
        const activeRect = event.active?.rect?.current
        const translated = activeRect?.translated || activeRect?.initial
        const pointerX = translated ? translated.left + (translated.width || 0) / 2 : overRect.left + overRect.width / 2
        const pointerY = translated ? translated.top + (translated.height || 0) / 2 : overRect.top + overRect.height / 2
        const fieldWidth = 200
        const fieldHeight = 50
        let x = pointerX - overRect.left - fieldWidth / 2
        let y = pointerY - overRect.top - fieldHeight / 2
        x = Math.max(0, Math.min(x, overRect.width - fieldWidth))
        y = Math.max(0, Math.min(y, overRect.height - fieldHeight))
        handleFieldDrop(fieldType, documentId, pageNumber, x, y)
      }
    },
    [handleFieldDrop]
  )

  const handleFieldPositionChange = useCallback((fieldId: string, position: Partial<FieldPosition>) => {
    setFieldPositions((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((docId) => {
        if (next[docId][fieldId]) {
          const current = next[docId][fieldId]
          next[docId][fieldId] = {
            ...current,
            ...position,
            x: position.x !== undefined ? position.x : current.x,
            y: position.y !== undefined ? position.y : current.y,
            page: position.page !== undefined ? position.page : current.page,
          }
        }
      })
      return next
    })
  }, [])

  const handleFieldDelete = useCallback(
    (fieldId: string) => {
      setFieldPositions((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((docId) => {
          if (next[docId][fieldId]) delete next[docId][fieldId]
        })
        return next
      })
      if (activeFieldId === fieldId) setActiveFieldId(null)
      toast.success('Field removed')
    },
    [activeFieldId]
  )

  const handleMergeDocuments = useCallback(async () => {
    if (uploadedDocuments.length < 2) {
      toast.error('Select at least two documents to merge')
      return
    }
    try {
      setIsMerging(true)
      const merged = await mergeDocuments(uploadedDocuments.map((d) => d.id), 'merged.pdf')
      setUploadedDocuments([merged])
      setFieldPositions({})
      toast.success('Documents merged successfully')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to merge documents')
    } finally {
      setIsMerging(false)
    }
  }, [uploadedDocuments])

  const activeField: FieldPosition | null = useMemo(() => {
    if (!activeFieldId) return null
    for (const docFields of Object.values(fieldPositions)) {
      if (docFields[activeFieldId]) return docFields[activeFieldId]
    }
    return null
  }, [activeFieldId, fieldPositions])

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (uploadedDocuments.length === 0) {
      errors.push('At least one document is required')
    }

    const signatureFields = Object.values(fieldPositions).flatMap((docFields) =>
      Object.values(docFields).filter((field) => field.type === 'signature')
    )
    if (signatureFields.length === 0) {
      errors.push('At least one signature field is required')
    }

    const incomplete: string[] = []
    Object.values(fieldPositions).forEach((docFields) => {
      Object.values(docFields).forEach((field) => {
        if (field.type === 'signature') return
        const hasRequired = typeof field.required === 'boolean'
        const hasFont = !!field.font_family && typeof field.font_size === 'number'
        if (!hasRequired || !hasFont) {
          incomplete.push(field.id)
          return
        }
        if (field.required && !(field.prefill_value ?? '').trim()) {
          incomplete.push(field.id)
          return
        }
        if (field.type === 'date' && !field.date_format) incomplete.push(field.id)
        if (field.type === 'text' && (field.placeholder === undefined || field.max_length === undefined)) {
          incomplete.push(field.id)
        }
        if (field.type === 'designation' && field.max_length === undefined) incomplete.push(field.id)
      })
    })
    if (incomplete.length > 0) {
      errors.push('Required fields must have values and complete settings')
    }

    return errors
  }, [uploadedDocuments, fieldPositions])

  const buildPayload = useCallback((): SelfSignRequest | null => {
    setError(null)
    const cssPxToPoints = (px: number) => (px * 72) / 96
    const convertFieldGeometry = (docId: string, field: FieldPosition) => {
      const pageKey = `${docId}-${field.page}`
      const metrics = pageMetrics[pageKey]
      if (!metrics) {
        return { x: field.x, y: field.y, width: field.width, height: field.height }
      }
      const scale = metrics.scale || 1
      return {
        x: cssPxToPoints(field.x / scale),
        y: cssPxToPoints(field.y / scale),
        width: cssPxToPoints(field.width / scale),
        height: cssPxToPoints(field.height / scale),
      }
    }

    const documents_with_positions = Object.entries(fieldPositions)
      .map(([docId, docFields]) => {
        const signer_document_positions = Object.values(docFields)
          .filter((field) => field.type === 'signature')
          .map((field) => {
            const geom = convertFieldGeometry(docId, field)
            return {
              position: {
                page: field.page,
                x: geom.x,
                y: geom.y,
                width: geom.width,
                height: geom.height,
              },
            }
          })
        return { document_id: docId, signer_document_positions }
      })
      .filter((entry) => entry.signer_document_positions.length > 0)

    const fields: Array<Record<string, unknown>> = []
    Object.entries(fieldPositions).forEach(([docId, docFields]) => {
      Object.values(docFields).forEach((field) => {
        if (field.type === 'signature') return
        const geom = convertFieldGeometry(docId, field)
        const value = field.prefill_value ?? null
        const base = {
          document_id: docId,
          page: Math.max(1, field.page),
          x: Math.max(0, geom.x),
          y: Math.max(0, geom.y),
          width: Math.max(20, geom.width),
          height: Math.max(20, geom.height),
          required: !!field.required,
          font_family: field.font_family,
          font_size: field.font_size,
          value,
          prefill_value: value,
        }
        if (field.type === 'initials') {
          fields.push({ ...base, type: 'initials' })
        } else if (field.type === 'date') {
          fields.push({ ...base, type: 'date', date_format: field.date_format })
        } else if (field.type === 'text') {
          fields.push({ ...base, type: 'text', placeholder: field.placeholder, max_length: field.max_length })
        } else if (field.type === 'designation') {
          fields.push({ ...base, type: 'designation', max_length: field.max_length })
        }
      })
    })

    const trimmedDescription = description.trim()
    const payload: SelfSignRequest = {
      document_ids: uploadedDocuments.map((d) => d.id),
      documents_with_positions,
      pdf_password_protection_enabled: pdfPasswordProtectionEnabled,
      ...(envelopeName ? { name: envelopeName } : {}),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      ...(fields.length > 0 ? { fields } : {}),
      ...(selectedSignatureId ? { signature_id: selectedSignatureId } : {}),
    }
    return payload
  }, [
    uploadedDocuments,
    fieldPositions,
    envelopeName,
    description,
    pdfPasswordProtectionEnabled,
    pageMetrics,
    selectedSignatureId,
  ])

  const handleSignComplete = useCallback(async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    try {
      const payload = buildPayload()
      if (!payload) return
      const result = await selfSignAsync(payload)
      setSuccess('Document signed successfully!')
      const query = result.pdf_lock_password
        ? `?pdf_password=${encodeURIComponent(result.pdf_lock_password)}`
        : ''
      router.push(`/dashboard/envelopes/${result.id}${query}`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to self-sign document. Please check console for details.'
      setError(msg)
    }
  }, [validationErrors, buildPayload, selfSignAsync, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && activeFieldId) {
        handleFieldDelete(activeFieldId)
        return
      }
      if (event.key === 'Escape') {
        setActiveFieldId(null)
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSignComplete()
        return
      }
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeFieldId, handleFieldDelete, handleSignComplete])

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">Sign a document</h1>
              <p className="text-[11px] text-slate-600">
                Upload, place your signature and fields, then complete in one step.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 h-8 shadow-sm">
                <Switch
                  checked={pdfPasswordProtectionEnabled}
                  onCheckedChange={setPdfPasswordProtectionEnabled}
                  aria-label="Enable PDF password protection on completion"
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  Lock PDF
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleSignComplete}
                disabled={signing || validationErrors.length > 0}
                className="flex items-center gap-1.5 h-8 px-3 text-xs"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>{signing ? 'Signing…' : 'Sign & complete'}</span>
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
        </div>
      </div>

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
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mx-3 mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((item, index) => (
                <div key={index}>• {item}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div className="flex-1 flex min-h-0 bg-gray-100">
          <div
            className={`${isCollapsed ? 'max-w-[96rem] px-2' : 'max-w-7xl px-3'} mx-auto flex flex-1 gap-3 py-3 overflow-hidden`}
          >
            <div className={`${isCollapsed ? 'w-[320px]' : 'w-[280px]'} flex-shrink-0 hidden md:flex`}>
              {mounted ? (
                <SelfSignSidebar
                  uploadedDocuments={uploadedDocuments}
                  fieldPositions={fieldPositions}
                  onDocumentAdd={addDocument}
                  onDocumentRemove={removeDocument}
                  onDocumentSelect={selectDocument}
                  onMergeDocuments={handleMergeDocuments}
                  isMerging={isMerging}
                  envelopeName={envelopeName}
                  onEnvelopeNameChange={setEnvelopeName}
                  description={description}
                  onDescriptionChange={setDescription}
                  signatures={signatures}
                  selectedSignatureId={selectedSignatureId}
                  onSignatureSelect={setSelectedSignatureId}
                  loadingSignatures={loadingSignatures}
                  onSignComplete={handleSignComplete}
                  signing={signing}
                  hasValidationErrors={validationErrors.length > 0}
                  pdfPasswordProtectionEnabled={pdfPasswordProtectionEnabled}
                  onPdfPasswordProtectionChange={setPdfPasswordProtectionEnabled}
                />
              ) : (
                <div className="w-full" />
              )}
            </div>

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
                />
              </div>
            </div>

            {activeField && activeField.type !== 'signature' && (
              <div className="w-[300px] flex-shrink-0 hidden lg:block">
                <div className="h-full bg-white border rounded-lg shadow-sm flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Field settings</div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{activeField.type}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveFieldId(null)}>
                      ✕
                    </Button>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto">
                    <div className="space-y-1">
                      <Label className="text-xs">Required</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={activeField.required ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFieldPositionChange(activeField.id, { required: true })}
                        >
                          Yes
                        </Button>
                        <Button
                          variant={!activeField.required ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFieldPositionChange(activeField.id, { required: false })}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Font family</Label>
                        <Select
                          value={activeField.font_family || ''}
                          onValueChange={(v) => handleFieldPositionChange(activeField.id, { font_family: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Font size</Label>
                        <Input
                          type="number"
                          value={activeField.font_size ?? ''}
                          onChange={(e) =>
                            handleFieldPositionChange(activeField.id, {
                              font_size: Number(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={activeField.prefill_value ?? ''}
                        onChange={(e) =>
                          handleFieldPositionChange(activeField.id, { prefill_value: e.target.value })
                        }
                      />
                    </div>
                    {activeField.type === 'date' && (
                      <div>
                        <Label className="text-xs">Date format</Label>
                        <Select
                          value={activeField.date_format || ''}
                          onValueChange={(v) => handleFieldPositionChange(activeField.id, { date_format: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
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
                              handleFieldPositionChange(activeField.id, { placeholder: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max length</Label>
                          <Input
                            type="number"
                            value={activeField.max_length ?? ''}
                            onChange={(e) =>
                              handleFieldPositionChange(activeField.id, {
                                max_length: Number(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
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

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Keyboard shortcuts</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowKeyboardShortcuts(false)}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Delete selected field</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Sign and complete</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
