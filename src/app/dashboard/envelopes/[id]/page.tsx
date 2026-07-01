'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  useEnvelope,
  useEnvelopeDocuments,
  useSendEnvelope,
  useRejectEnvelope,
  useDeleteEnvelope,
} from '@/hooks/useEnvelopes'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useSession } from 'next-auth/react'
import { EnvelopeTrackingHeader } from '@/components/envelope/envelope-tracking-header'
import {
  EnvelopeDetailsCard,
  EnvelopeDocumentsCard,
  EnvelopeSettingsCard,
  EnvelopeDownloadAll,
} from '@/components/envelope/envelope-detail-sections'
import { EnvelopeSignerTimelinePanel } from '@/components/envelope/envelope-signer-timeline-panel'
import { EnvelopeActivityFeed } from '@/components/envelope/envelope-activity-feed'
import { isSelfSignEnvelope } from '@/lib/api/envelopes'

export default function EnvelopeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''
  const { data: session } = useSession()

  const { isReady } = useAuthReady()
  const { data: envelope, isLoading, error } = useEnvelope(id)
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectEnvelope()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  const creatorId = envelope?.creator?.id
  const { data: creatorUser } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId as string),
    enabled: isReady && Boolean(creatorId),
    staleTime: 5 * 60 * 1000,
  })

  const { data: envelopeDocuments, isLoading: isLoadingDocs } = useEnvelopeDocuments(
    id,
    envelope?.documents,
  )

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-max-content-width space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 space-y-6 lg:col-span-5">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="col-span-12 space-y-6 lg:col-span-7">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-max-content-width">
        <div className="rounded-xl border border-error/20 bg-error-light p-8 text-center text-error">
          Failed to load envelope. Please try again.
        </div>
      </div>
    )
  }

  if (!envelope) {
    return (
      <div className="mx-auto w-full max-w-max-content-width">
        <div className="rounded-xl border border-border bg-surface-container-lowest p-12 text-center">
          <h3 className="mb-2 font-headline-lg text-headline-lg text-primary">Envelope not found</h3>
          <p className="text-muted">The requested envelope could not be found.</p>
        </div>
      </div>
    )
  }

  const creatorDisplay =
    envelope.creator?.full_name ||
    envelope.creator?.email ||
    (envelope as { creator_email?: string }).creator_email ||
    creatorUser?.full_name ||
    'Unknown'

  const currentUserId = session?.user?.id
  const isCreator = Boolean(currentUserId && creatorId === currentUserId)
  const isSelfSign = isSelfSignEnvelope(envelope)
  const isRecipient = Boolean(
    currentUserId &&
      envelope.recipients?.some((r) => {
        const recipientId = r?.id || (r as { user_id?: string }).user_id
        return recipientId === currentUserId
      }),
  )

  const isCompleted = (envelope.status ?? '').toLowerCase().includes('complete')

  return (
    <div className="mx-auto w-full max-w-max-content-width">
      <EnvelopeTrackingHeader
        envelope={envelope}
        isSelfSign={isSelfSign}
        isCreator={isCreator}
        isRecipient={isRecipient}
        envelopeId={envelope.id}
        onSend={async () => {
          if (window.confirm('Are you sure you want to send this envelope?')) {
            await sendAsync(envelope.id)
          }
        }}
        onReject={async () => {
          if (window.confirm('Are you sure you want to cancel this envelope?')) {
            await rejectAsync(envelope.id)
          }
        }}
        onDelete={async () => {
          if (window.confirm('Are you sure you want to delete this envelope?')) {
            await deleteAsync(envelope.id)
            router.push('/dashboard/envelopes')
          }
        }}
        sending={sending}
        rejecting={rejecting}
        deleting={deleting}
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-6 lg:col-span-5">
          <EnvelopeDetailsCard description={envelope.description} />
          <EnvelopeDocumentsCard
            documents={envelopeDocuments ?? []}
            isLoading={isLoadingDocs}
            envelope={envelope}
            isSelfSign={isSelfSign}
          />
          <EnvelopeSettingsCard envelope={envelope} />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-7">
          <EnvelopeSignerTimelinePanel envelope={envelope} currentUserId={currentUserId} />
          <EnvelopeActivityFeed envelope={envelope} creatorName={creatorDisplay} />
        </div>
      </div>

      <EnvelopeDownloadAll isCompleted={isCompleted} />
    </div>
  )
}
