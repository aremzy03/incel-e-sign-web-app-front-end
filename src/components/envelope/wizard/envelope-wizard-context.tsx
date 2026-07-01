'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Document, mergeDocuments } from '@/lib/api/documents'
import { buildEnvelopePayload } from '@/lib/envelope/build-envelope-payload'
import {
  canAdvanceFromStep,
  getDraftSaveErrors,
  getSendValidationErrors,
} from '@/lib/envelope/envelope-wizard-validation'
import {
  WIZARD_STEP_STORAGE_KEY,
  type WizardMode,
  type WizardStep,
} from '@/lib/envelope/envelope-wizard-types'
import { useCreateEnvelope, useEditEnvelope, useSendEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeUserValidation } from '@/hooks/useUsers'
import {
  FieldPosition,
  FieldPositions,
  RecipientInput,
  RECIPIENT_COLORS,
} from '@/types/envelope'

function readStoredStep(): WizardStep | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(WIZARD_STEP_STORAGE_KEY)
  if (!raw) return null
  const n = Number(raw)
  if (n >= 1 && n <= 5) return n as WizardStep
  return null
}

function storeStep(step: WizardStep) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(step))
  }
}

export interface EnvelopeWizardProviderProps {
  children: ReactNode
  mode: WizardMode
  envelopeId?: string
  initialStep?: WizardStep
  isHydrating?: boolean
}

interface EnvelopeWizardContextValue {
  mode: WizardMode
  envelopeId: string | null
  currentStep: WizardStep
  setCurrentStep: (step: WizardStep) => void
  goNext: () => void
  goBack: () => void
  goToStep: (step: WizardStep) => void

  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  activeFieldId: string | null
  setActiveFieldId: (id: string | null) => void
  activeRecipientId: number | null
  setActiveRecipientId: (id: number | null) => void
  envelopeName: string
  setEnvelopeName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  pdfPasswordProtectionEnabled: boolean
  setPdfPasswordProtectionEnabled: (v: boolean) => void

  addDocument: (document: Document) => void
  removeDocument: (documentId: string) => void
  reorderDocument: (documentId: string, direction: 'up' | 'down') => void
  addRecipient: (recipient: { email: string; name?: string }) => void
  removeRecipient: (recipientId: number) => void
  reorderRecipient: (recipientId: number, direction: 'up' | 'down') => void
  handleFieldDrop: (
    fieldType: string,
    documentId: string,
    page: number,
    x: number,
    y: number,
  ) => void
  handleFieldPositionChange: (fieldId: string, position: Partial<FieldPosition>) => void
  handleFieldDelete: (fieldId: string) => void
  handleMergeDocuments: () => Promise<void>
  isMerging: boolean

  activeField: FieldPosition | null
  validationErrors: string[]
  sendValidationErrors: string[]
  canGoNext: boolean
  nextStepError: string | null

  error: string | null
  success: string | null
  setError: (v: string | null) => void
  setSuccess: (v: string | null) => void

  creating: boolean
  saving: boolean
  sending: boolean
  isValidating: boolean
  handleSaveDraft: () => Promise<void>
  handleSend: () => Promise<void>

  activeDragFieldType: string | null
  setActiveDragFieldType: (v: string | null) => void
  showKeyboardShortcuts: boolean
  setShowKeyboardShortcuts: (v: boolean) => void

  isHydrating: boolean
  draftEnvelopeId: string | null

  hydrateState: (data: {
    uploadedDocuments: Document[]
    recipients: RecipientInput[]
    fieldPositions: FieldPositions
    nextFieldId: number
    nextRecipientId: number
    envelopeName: string
    description: string
    pdfPasswordProtectionEnabled?: boolean
  }) => void
}

const EnvelopeWizardContext = createContext<EnvelopeWizardContextValue | null>(null)

export function EnvelopeWizardProvider({
  children,
  mode,
  envelopeId: initialEnvelopeId,
  initialStep,
  isHydrating = false,
}: EnvelopeWizardProviderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutateAsync: createAsync, isPending: creating } = useCreateEnvelope()
  const { mutateAsync: editAsync, isPending: saving } = useEditEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()

  const [currentStep, setCurrentStepState] = useState<WizardStep>(() => {
    const fromUrl = searchParams?.get('step')
    if (fromUrl) {
      const n = Number(fromUrl)
      if (n >= 1 && n <= 5) return n as WizardStep
    }
    return initialStep ?? readStoredStep() ?? 1
  })

  const [draftEnvelopeId, setDraftEnvelopeId] = useState<string | null>(
    mode === 'edit' ? initialEnvelopeId ?? null : null,
  )

  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([])
  const [recipients, setRecipients] = useState<RecipientInput[]>([])
  const [fieldPositions, setFieldPositions] = useState<FieldPositions>({})
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [activeRecipientId, setActiveRecipientId] = useState<number | null>(null)
  const [nextFieldId, setNextFieldId] = useState(1)
  const [nextRecipientId, setNextRecipientId] = useState(1)
  const [envelopeName, setEnvelopeName] = useState('')
  const [description, setDescription] = useState('')
  const [pdfPasswordProtectionEnabled, setPdfPasswordProtectionEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [activeDragFieldType, setActiveDragFieldType] = useState<string | null>(null)
  const [isMerging, setIsMerging] = useState(false)

  const validationInput = useMemo(
    () => ({ uploadedDocuments, recipients, fieldPositions }),
    [uploadedDocuments, recipients, fieldPositions],
  )

  const sendValidationErrors = useMemo(
    () => getSendValidationErrors(validationInput),
    [validationInput],
  )

  const nextStepError = useMemo(
    () => canAdvanceFromStep(currentStep, validationInput),
    [currentStep, validationInput],
  )

  const canGoNext = nextStepError === null

  useEffect(() => {
    if (recipients.length === 0) {
      setActiveRecipientId(null)
      return
    }
    if (
      activeRecipientId === null ||
      !recipients.some((recipient) => recipient.id === activeRecipientId)
    ) {
      const sorted = [...recipients].sort((a, b) => a.order - b.order)
      setActiveRecipientId(sorted[0]?.id ?? null)
    }
  }, [recipients, activeRecipientId])

  const setCurrentStep = useCallback((step: WizardStep) => {
    setCurrentStepState(step)
    storeStep(step)
  }, [])

  const goToStep = useCallback(
    (step: WizardStep) => {
      setCurrentStep(step)
    },
    [setCurrentStep],
  )

  const goNext = useCallback(() => {
    const gate = canAdvanceFromStep(currentStep, validationInput)
    if (gate) {
      toast.error(gate)
      return
    }
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as WizardStep)
    }
  }, [currentStep, validationInput, setCurrentStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
    }
  }, [currentStep, setCurrentStep])

  const addRecipient = useCallback(
    (recipient: { email: string; name?: string }) => {
      const trimmedEmail = recipient.email.trim()
      const emailKey = trimmedEmail.toLowerCase()

      if (recipients.some((r) => r.email.toLowerCase() === emailKey)) {
        toast.error('Recipient already added')
        return
      }

      const newRecipient: RecipientInput = {
        id: nextRecipientId,
        name: recipient.name?.trim() || '',
        email: trimmedEmail,
        order: recipients.length + 1,
        color: RECIPIENT_COLORS[recipients.length % RECIPIENT_COLORS.length],
      }

      setRecipients((prev) => [...prev, newRecipient])
      setNextRecipientId((id) => id + 1)
      toast.success(`Added ${recipient.name || trimmedEmail}`)
    },
    [recipients, nextRecipientId],
  )

  const removeRecipient = useCallback((recipientId: number) => {
    setRecipients((prev) =>
      prev
        .filter((r) => r.id !== recipientId)
        .map((r, idx) => ({ ...r, order: idx + 1 })),
    )
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach((docId) => {
        Object.keys(newPositions[docId]).forEach((fieldId) => {
          if (newPositions[docId][fieldId].assignedTo === recipientId.toString()) {
            delete newPositions[docId][fieldId]
          }
        })
      })
      return newPositions
    })
    toast.success('Recipient removed')
  }, [])

  const reorderRecipient = useCallback((recipientId: number, direction: 'up' | 'down') => {
    setRecipients((prev) => {
      const index = prev.findIndex((r) => r.id === recipientId)
      if (index < 0) return prev
      const newOrder = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return newOrder.map((r, idx) => ({ ...r, order: idx + 1 }))
    })
  }, [])

  const addDocument = useCallback((document: Document) => {
    setUploadedDocuments((prev) => {
      if (prev.some((d) => d.id === document.id)) return prev
      return [...prev, document]
    })
  }, [])

  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== documentId))
    setFieldPositions((prev) => {
      const newPositions = { ...prev }
      delete newPositions[documentId]
      return newPositions
    })
    toast.success('Document removed')
  }, [])

  const reorderDocument = useCallback((documentId: string, direction: 'up' | 'down') => {
    setUploadedDocuments((prev) => {
      const index = prev.findIndex((d) => d.id === documentId)
      if (index < 0) return prev
      const newOrder = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return newOrder
    })
  }, [])

  const handleFieldDrop = useCallback(
    (fieldType: string, documentId: string, page: number, x: number, y: number) => {
      const fieldId = `field-${nextFieldId}`
      const newField: FieldPosition = {
        id: fieldId,
        type: fieldType as FieldPosition['type'],
        page,
        x,
        y,
        width: 140,
        height: 44,
        assignedTo: activeRecipientId != null ? String(activeRecipientId) : null,
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
    },
    [nextFieldId, activeRecipientId],
  )

  const handleFieldPositionChange = useCallback(
    (fieldId: string, position: Partial<FieldPosition>) => {
      setFieldPositions((prev) => {
        const newPositions = { ...prev }
        Object.keys(newPositions).forEach((docId) => {
          if (newPositions[docId][fieldId]) {
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
    },
    [],
  )

  const handleFieldDelete = useCallback(
    (fieldId: string) => {
      setFieldPositions((prev) => {
        const newPositions = { ...prev }
        Object.keys(newPositions).forEach((docId) => {
          if (newPositions[docId][fieldId]) {
            delete newPositions[docId][fieldId]
          }
        })
        return newPositions
      })
      if (activeFieldId === fieldId) setActiveFieldId(null)
      toast.success('Field removed')
    },
    [activeFieldId],
  )

  const handleMergeDocuments = useCallback(async () => {
    if (uploadedDocuments.length < 2) {
      toast.error('Select at least two documents to merge')
      return
    }
    try {
      setIsMerging(true)
      const merged = await mergeDocuments(
        uploadedDocuments.map((d) => d.id),
        'merged.pdf',
      )
      setUploadedDocuments([merged])
      setFieldPositions({})
      toast.success('Documents merged successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err?.response?.data?.message || err?.message || 'Failed to merge documents')
    } finally {
      setIsMerging(false)
    }
  }, [uploadedDocuments])

  const activeField = useMemo((): FieldPosition | null => {
    if (!activeFieldId) return null
    for (const docFields of Object.values(fieldPositions)) {
      if (docFields[activeFieldId]) return docFields[activeFieldId]
    }
    return null
  }, [activeFieldId, fieldPositions])

  const buildPayloadForMode = useCallback(
    async (payloadMode: 'draft' | 'send') => {
      return buildEnvelopePayload(
        {
          uploadedDocuments,
          recipients,
          fieldPositions,
          envelopeName,
          description,
          pdfPasswordProtectionEnabled,
        },
        { mode: payloadMode, validateRecipients },
      )
    },
    [
      uploadedDocuments,
      recipients,
      fieldPositions,
      envelopeName,
      description,
      pdfPasswordProtectionEnabled,
      validateRecipients,
    ],
  )

  const handleSaveDraft = useCallback(async () => {
    const draftErrors = getDraftSaveErrors(currentStep, validationInput)
    if (draftErrors.length > 0) {
      setError(draftErrors.join(', '))
      return
    }

    try {
      setError(null)
      const result = await buildPayloadForMode('draft')
      if (!result.ok) {
        setError(result.error)
        return
      }

      const envelopeId = draftEnvelopeId

      if (envelopeId) {
        await editAsync({ id: envelopeId, data: result.payload })
        setSuccess('Envelope saved as draft!')
        storeStep(currentStep)
      } else {
        const created = await createAsync(result.payload)
        setDraftEnvelopeId(created.id)
        setSuccess('Envelope saved as draft!')
        storeStep(currentStep)
        router.replace(`/dashboard/envelopes/${created.id}/edit?step=${currentStep}`)
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { data?: { signing_order?: string[] }; message?: string } }
      }
      if (error.response?.data?.data?.signing_order) {
        setError(`Position validation failed: ${error.response.data.data.signing_order.join(', ')}`)
      } else if (error.response?.data?.message) {
        setError(`Error saving draft: ${error.response.data.message}`)
      } else {
        setError('Failed to save draft.')
      }
    }
  }, [
    currentStep,
    validationInput,
    buildPayloadForMode,
    draftEnvelopeId,
    editAsync,
    createAsync,
    router,
  ])

  const handleSend = useCallback(async () => {
    if (sendValidationErrors.length > 0) {
      setError(sendValidationErrors.join(', '))
      return
    }

    try {
      setError(null)
      const result = await buildPayloadForMode('send')
      if (!result.ok) {
        setError(result.error)
        return
      }

      let envelopeId = draftEnvelopeId

      if (envelopeId) {
        await editAsync({ id: envelopeId, data: result.payload })
      } else {
        const created = await createAsync(result.payload)
        envelopeId = created.id
        setDraftEnvelopeId(created.id)
      }

      await sendAsync(envelopeId!)
      setSuccess('Envelope sent successfully!')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(WIZARD_STEP_STORAGE_KEY)
      }
      router.push(`/dashboard/envelopes/${envelopeId}`)
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { data?: { signing_order?: string[] }; message?: string } }
      }
      if (error.response?.data?.data?.signing_order) {
        setError(`Position validation failed: ${error.response.data.data.signing_order.join(', ')}`)
      } else if (error.response?.data?.message) {
        setError(`Error sending envelope: ${error.response.data.message}`)
      } else {
        setError('Failed to send envelope.')
      }
    }
  }, [
    sendValidationErrors,
    buildPayloadForMode,
    draftEnvelopeId,
    editAsync,
    createAsync,
    sendAsync,
    router,
  ])

  // Hydration setter exposed for useEnvelopeWizardHydration
  const hydrateState = useCallback(
    (data: {
      uploadedDocuments: Document[]
      recipients: RecipientInput[]
      fieldPositions: FieldPositions
      nextFieldId: number
      nextRecipientId: number
      envelopeName: string
      description: string
      pdfPasswordProtectionEnabled?: boolean
    }) => {
      setUploadedDocuments(data.uploadedDocuments)
      setRecipients(data.recipients)
      setFieldPositions(data.fieldPositions)
      setNextFieldId(data.nextFieldId)
      setNextRecipientId(data.nextRecipientId)
      setEnvelopeName(data.envelopeName)
      setDescription(data.description)
      if (data.pdfPasswordProtectionEnabled !== undefined) {
        setPdfPasswordProtectionEnabled(data.pdfPasswordProtectionEnabled)
      }
    },
    [],
  )

  // Expose hydrate via a ref-like pattern on context - we'll add to context value
  const contextValue: EnvelopeWizardContextValue = {
    mode,
    envelopeId: draftEnvelopeId,
    currentStep,
    setCurrentStep,
    goNext,
    goBack,
    goToStep,
    uploadedDocuments,
    recipients,
    fieldPositions,
    activeFieldId,
    setActiveFieldId,
    activeRecipientId,
    setActiveRecipientId,
    envelopeName,
    setEnvelopeName,
    description,
    setDescription,
    pdfPasswordProtectionEnabled,
    setPdfPasswordProtectionEnabled,
    addDocument,
    removeDocument,
    reorderDocument,
    addRecipient,
    removeRecipient,
    reorderRecipient,
    handleFieldDrop,
    handleFieldPositionChange,
    handleFieldDelete,
    handleMergeDocuments,
    isMerging,
    activeField,
    validationErrors: sendValidationErrors,
    sendValidationErrors,
    canGoNext,
    nextStepError,
    error,
    success,
    setError,
    setSuccess,
    creating,
    saving,
    sending,
    isValidating,
    handleSaveDraft,
    handleSend,
    activeDragFieldType,
    setActiveDragFieldType,
    showKeyboardShortcuts,
    setShowKeyboardShortcuts,
    isHydrating,
    draftEnvelopeId,
    hydrateState,
  }

  return (
    <EnvelopeWizardContext.Provider value={contextValue}>
      {children}
    </EnvelopeWizardContext.Provider>
  )
}

export function useEnvelopeWizard() {
  const ctx = useContext(EnvelopeWizardContext)
  if (!ctx) {
    throw new Error('useEnvelopeWizard must be used within EnvelopeWizardProvider')
  }
  return ctx
}
