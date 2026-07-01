'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import { signEnvelope } from '@/lib/api/signatures'
import { FrozenEnvelopeError } from '@/lib/api/signing-errors'
import { saveSigningJob } from '@/lib/signing/signing-job-storage'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import type { User } from '@/lib/api/users'
import type { SigningEnvelopeField, SigningEnvelopeResponse } from './types'
import { formatSigningDate, getInitialsFromName } from './types'

export type SignMutationResult =
  | { kind: 'queued'; jobId: string; envelopeId: string }
  | { kind: 'already_signed' }

interface UseSignActionsOptions {
  envelopeId?: string
  envelope?: SigningEnvelopeResponse
  envelopeDocuments: EnvelopeDocumentResponse[]
  currentUserId?: string
  mySignatureId?: string
  signerDetails: Record<string, User>
  fieldValues: Record<string, string>
  signedFor: Record<string, boolean>
  onSignSuccess?: () => void
  onDeclineSuccess?: (message?: string) => void
  supportsDecline?: boolean
  supportsFieldSave?: boolean
}

export function useSignActions({
  envelopeId,
  envelope,
  currentUserId,
  mySignatureId,
  signerDetails,
  fieldValues,
  onSignSuccess,
  onDeclineSuccess,
  supportsDecline = true,
  supportsFieldSave = true,
}: UseSignActionsOptions) {
  const queryClient = useQueryClient()
  const [declineMessage, setDeclineMessage] = useState('')
  const [frozenEnvelopeMessage, setFrozenEnvelopeMessage] = useState<string | null>(null)

  const saveValuesMutation = useMutation({
    mutationFn: async () => {
      if (!supportsFieldSave || !envelopeId || !currentUserId) return
      const allFields = envelope?.fields
      if (!allFields?.length) return

      const items: Array<{ id: string; value: string }> = []
      allFields.forEach((f) => {
        if (f.assigned_signer !== currentUserId || !f.id) return
        let value = ''
        if (f.type === 'text') value = (fieldValues[f.id] ?? f.prefill_value ?? '').toString()
        if (f.type === 'date') {
          value =
            f.prefill_value && f.prefill_value.trim() !== ''
              ? f.prefill_value
              : formatSigningDate(new Date(), f.date_format)
        }
        if (f.type === 'initials') {
          value =
            f.prefill_value && f.prefill_value.trim() !== ''
              ? f.prefill_value
              : getInitialsFromName(signerDetails[currentUserId]?.full_name)
        }
        if (f.type === 'designation') value = (f.prefill_value ?? '').toString()
        if (value !== '') items.push({ id: f.id, value })
      })

      if (items.length === 0) return
      await apiClient.post(`/fields/signing/${envelopeId}/values/`, { items })
    },
  })

  const signMutation = useMutation({
    mutationFn: async (): Promise<SignMutationResult> => {
      if (!mySignatureId) throw new Error('No signature on file. Please create/upload your signature first.')
      if (!envelope) throw new Error('Envelope data not loaded.')
      if (!envelopeId) throw new Error('Missing envelope id.')

      const result = await signEnvelope(envelopeId, { signature_id: mySignatureId })

      if (result.kind === 'already_signed') {
        return { kind: 'already_signed' }
      }

      saveSigningJob(envelopeId, result.data.job_id)
      return {
        kind: 'queued',
        jobId: result.data.job_id,
        envelopeId: result.data.envelope_id || envelopeId,
      }
    },
    onError: (err: unknown) => {
      if (err instanceof FrozenEnvelopeError) {
        setFrozenEnvelopeMessage(err.message)
        return
      }
      const e = err as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      toast.error(e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Error signing document')
    },
  })

  const declineMutation = useMutation({
    mutationFn: async (message?: string) => {
      if (!supportsDecline || !envelopeId) throw new Error('Decline not available')
      const body = message
        ? { decline_message: message }
        : { decline_message: 'Declined without specific reason.' }
      const res = await apiClient.post(`/signatures/${envelopeId}/decline/`, body)
      return res.data
    },
    onSuccess: (_data, message) => {
      toast.success('Envelope declined successfully.')
      onDeclineSuccess?.(message)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string; message?: string } } }
      toast.error(e?.response?.data?.detail || e?.response?.data?.message || 'Error declining envelope')
    },
  })

  const validateRequiredFields = useCallback(() => {
    const myFields =
      envelope?.fields?.filter((f) => f.assigned_signer === currentUserId) ?? []
    const emptyRequired = myFields.filter((f) => {
      if (!f.required) return false
      let v = ''
      if (f.type === 'text') v = (fieldValues[f.id ?? ''] ?? f.prefill_value ?? '').toString()
      if (f.type === 'date') {
        v =
          f.prefill_value && f.prefill_value.trim() !== ''
            ? f.prefill_value
            : formatSigningDate(new Date(), f.date_format)
      }
      if (f.type === 'initials') {
        v =
          f.prefill_value && f.prefill_value.trim() !== ''
            ? f.prefill_value
            : getInitialsFromName(signerDetails[currentUserId ?? '']?.full_name)
      }
      if (f.type === 'designation') v = (f.prefill_value ?? '').toString()
      return !v || v.trim() === ''
    })
    return emptyRequired
  }, [currentUserId, envelope?.fields, fieldValues, signerDetails])

  const approveAndSign = async (): Promise<SignMutationResult | null> => {
    try {
      setFrozenEnvelopeMessage(null)
      const emptyRequired = validateRequiredFields()
      if (emptyRequired.length > 0) {
        toast.error('Please complete all required fields')
        return null
      }
      await saveValuesMutation.mutateAsync()
      const result = await signMutation.mutateAsync()
      if (result.kind === 'already_signed') {
        toast.success('Signed successfully!')
        queryClient.invalidateQueries({ queryKey: ['sign-envelope', envelopeId] })
        queryClient.invalidateQueries({ queryKey: ['envelopeDocuments', envelopeId] })
        onSignSuccess?.()
      }
      return result
    } catch (e: unknown) {
      if (e instanceof FrozenEnvelopeError) {
        setFrozenEnvelopeMessage(e.message)
        return null
      }
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to approve and sign')
      return null
    }
  }

  const clearFrozenEnvelopeMessage = useCallback(() => {
    setFrozenEnvelopeMessage(null)
  }, [])

  return {
    approveAndSign,
    signMutation,
    saveValuesMutation,
    declineMutation,
    declineMessage,
    setDeclineMessage,
    validateRequiredFields,
    frozenEnvelopeMessage,
    clearFrozenEnvelopeMessage,
  }
}

export function useSigningFieldValues(initial: Record<string, string> = {}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initial)
  const [activeFieldPreview, setActiveFieldPreview] = useState<string | null>(null)

  const setFieldValue = useCallback((id: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const toggleFieldPreview = useCallback((key: string) => {
    setActiveFieldPreview((prev) => (prev === key ? null : key))
  }, [])

  return {
    fieldValues,
    setFieldValues,
    setFieldValue,
    activeFieldPreview,
    setActiveFieldPreview,
    toggleFieldPreview,
  }
}

export type { SigningEnvelopeField }
