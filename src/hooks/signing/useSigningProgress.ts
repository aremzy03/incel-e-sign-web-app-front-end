'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import {
  buildSigningFieldChecklist,
  getActiveFieldId,
  type SigningFieldChecklistItem,
} from '@/lib/signing/signing-field-checklist'
import type { SigningEnvelopeResponse } from './types'

function signatureKey(docId: string, signerId: string): string {
  return `${docId}-${signerId}`
}

interface UseSigningProgressOptions {
  envelopeDocuments: EnvelopeDocumentResponse[]
  envelope?: SigningEnvelopeResponse | null
  currentUserId?: string
  fieldValues: Record<string, string>
  mySignatureId?: string
}

export function useSigningProgress({
  envelopeDocuments,
  envelope,
  currentUserId,
  fieldValues,
  mySignatureId,
}: UseSigningProgressOptions) {
  const [signedFor, setSignedFor] = useState<Record<string, boolean>>({})

  const totalFields = useMemo(() => {
    const sigCount = envelopeDocuments.reduce((acc, doc) => {
      return (
        acc +
        (doc.signer_document_positions?.filter((p) => p.signer_id === currentUserId).length ?? 0)
      )
    }, 0)
    const otherFields =
      envelope?.fields?.filter((f) => f.assigned_signer === currentUserId).length ?? 0
    return sigCount + otherFields
  }, [currentUserId, envelope?.fields, envelopeDocuments])

  const completedFields = useMemo(() => {
    let count = Object.keys(signedFor).filter((k) => signedFor[k]).length
    envelope?.fields
      ?.filter((f) => f.assigned_signer === currentUserId)
      .forEach((f) => {
        if (f.type === 'date' || f.type === 'initials' || f.type === 'designation') count += 1
        if (f.type === 'text' && fieldValues[f.id ?? '']) count += 1
      })
    return Math.min(count, totalFields || 1)
  }, [currentUserId, envelope?.fields, fieldValues, signedFor, totalFields])

  const canComplete = completedFields >= totalFields && totalFields > 0 && !!mySignatureId

  const remainingCount = Math.max(0, totalFields - completedFields)

  const fieldChecklist = useMemo(
    () =>
      buildSigningFieldChecklist({
        envelopeDocuments,
        envelope,
        currentUserId,
        signedFor,
        fieldValues,
      }),
    [currentUserId, envelope, envelopeDocuments, fieldValues, signedFor],
  )

  const activeFieldId = useMemo(() => getActiveFieldId(fieldChecklist), [fieldChecklist])

  const markSignaturePreviewed = useCallback((docId: string, signerId: string) => {
    const key = signatureKey(docId, signerId)
    setSignedFor((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  const markSignatureConfirmed = useCallback((docId: string, signerId: string) => {
    const key = signatureKey(docId, signerId)
    setSignedFor((prev) => ({ ...prev, [key]: true }))
  }, [])

  const markAllSignaturesComplete = useCallback(() => {
    setSignedFor((prev) => {
      const next = { ...prev }
      for (const doc of envelopeDocuments) {
        const positions =
          doc.signer_document_positions?.filter((p) => p.signer_id === currentUserId) ?? []
        for (const pos of positions) {
          next[signatureKey(doc.id, pos.signer_id)] = true
        }
      }
      return next
    })
  }, [currentUserId, envelopeDocuments])

  const isSignatureComplete = useCallback(
    (docId: string, signerId: string) => Boolean(signedFor[signatureKey(docId, signerId)]),
    [signedFor],
  )

  return {
    signedFor,
    totalFields,
    completedFields,
    remainingCount,
    canComplete,
    fieldChecklist,
    activeFieldId,
    markSignaturePreviewed,
    markSignatureConfirmed,
    markAllSignaturesComplete,
    isSignatureComplete,
  }
}

export type { SigningFieldChecklistItem }
