'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEnvelopeDocuments } from '@/lib/api/envelopes'
import { getUserById } from '@/lib/api/users'
import type { Document } from '@/lib/api/documents'
import {
  backendPositionToViewport,
  normalizeSignerPositionEntries,
} from '@/lib/utils/field-geometry'
import type { FieldPosition, FieldPositions, RecipientInput } from '@/types/envelope'
import { RECIPIENT_COLORS } from '@/types/envelope'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import { useEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeWizard } from '@/components/envelope/wizard/envelope-wizard-context'

export function useEnvelopeWizardHydration(envelopeId: string) {
  const { hydrateState } = useEnvelopeWizard()

  const { isReady } = useAuthReady()
  const { data: envelope, isLoading: envelopeLoading } = useEnvelope(envelopeId)
  const { data: envelopeDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['envelope-documents', envelopeId, 'edit'],
    queryFn: () => getEnvelopeDocuments(envelopeId),
    enabled: isReady && Boolean(envelopeId),
    retry: shouldRetryAuthQuery,
  })

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!envelope || !envelopeDocuments || initialized) return

    let cancelled = false

    const initializeEnvelope = async () => {
      const sortedRecipients = (Array.isArray(envelope.recipients) ? [...envelope.recipients] : []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )

      const enrichedRecipients = await Promise.all(
        sortedRecipients.map(async (recipient) => {
          if (recipient.email?.trim()) return recipient
          if (!recipient.id) return recipient
          try {
            const user = await getUserById(String(recipient.id))
            return {
              ...recipient,
              email: user.email || recipient.email,
              name: recipient.name || user.full_name || recipient.email,
            }
          } catch {
            return recipient
          }
        }),
      )

      if (cancelled) return

      const initialRecipients: RecipientInput[] = enrichedRecipients.map((recipient, index) => ({
        id: index + 1,
        name: recipient.name || recipient.email || `Signer ${index + 1}`,
        email: recipient.email,
        order: recipient.order ?? index + 1,
        color: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length],
      }))

      const initialDocuments: Document[] = envelopeDocuments.map(
        (doc): Document => ({
          id: String(doc.id || doc.document),
          file_name: doc.file_name || doc.document_file_name || `Document ${doc.id || doc.document}`,
          file_url: doc.document_file_url || '',
          file_size: doc.file_size ?? 0,
          status: 'draft',
          created_at: doc.created_at || new Date().toISOString(),
          updated_at: doc.updated_at || new Date().toISOString(),
        }),
      )

      const recipientIdBySigner: Record<string, number> = {}
      enrichedRecipients.forEach((recipient, index) => {
        const localId = index + 1
        if (recipient?.id) {
          const key = String(recipient.id)
          recipientIdBySigner[key] = localId
          recipientIdBySigner[key.toLowerCase()] = localId
        }
        if (recipient?.email) {
          recipientIdBySigner[recipient.email.toLowerCase()] = localId
        }
      })

      const resolveLocalRecipientId = (signerId: string, fallbackIndex: number) => {
        const key = String(signerId ?? '').trim()
        if (!key) return enrichedRecipients[fallbackIndex] ? fallbackIndex + 1 : null
        return (
          recipientIdBySigner[key] ??
          recipientIdBySigner[key.toLowerCase()] ??
          (enrichedRecipients.length === 1 ? 1 : null)
        )
      }

      const envelopePositionsByDocument = new Map(
        (envelope.documents_with_positions ?? []).map((docWithPositions) => [
          String(docWithPositions.document_id),
          normalizeSignerPositionEntries(docWithPositions.signer_document_positions),
        ]),
      )

      const initialFieldPositions: FieldPositions = {}
      let fieldCounter = 1

      envelopeDocuments.forEach((doc) => {
        const docPositions: Record<string, FieldPosition> = {}
        const documentId = String(doc.id || doc.document)
        const rawPositions =
          doc.signer_document_positions?.length
            ? doc.signer_document_positions
            : envelopePositionsByDocument.get(documentId) ?? []

        normalizeSignerPositionEntries(rawPositions).forEach((entry, index) => {
          const localRecipientId = resolveLocalRecipientId(entry.signer_id, index)
          const fieldId = `field-${fieldCounter++}`
          const viewportPosition = backendPositionToViewport(entry.position)
          docPositions[fieldId] = {
            id: fieldId,
            type: 'signature',
            page: viewportPosition.page,
            x: viewportPosition.x,
            y: viewportPosition.y,
            width: viewportPosition.width,
            height: viewportPosition.height,
            assignedTo: localRecipientId ? String(localRecipientId) : null,
            documentId,
          }
        })

        if (Object.keys(docPositions).length > 0) {
          initialFieldPositions[documentId] = docPositions
        }
      })

      hydrateState({
        uploadedDocuments: initialDocuments,
        recipients: initialRecipients,
        fieldPositions: initialFieldPositions,
        nextFieldId: fieldCounter,
        nextRecipientId: initialRecipients.length + 1,
        envelopeName: envelope.name || '',
        description: envelope.description || '',
        pdfPasswordProtectionEnabled:
          (envelope as { pdf_password_protection_enabled?: boolean })
            .pdf_password_protection_enabled ?? false,
      })

      setInitialized(true)
    }

    void initializeEnvelope()

    return () => {
      cancelled = true
    }
  }, [envelope, envelopeDocuments, initialized, hydrateState])

  return {
    isHydrating: envelopeLoading || documentsLoading || !initialized,
  }
}
