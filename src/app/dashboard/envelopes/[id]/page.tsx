'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEnvelope, useSendEnvelope, useRejectEnvelope, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { getDocument } from '@/lib/api/documents'

function RecipientItem({ r }: { r: any }) {
  const recipientId = r?.id
  const hasDisplay = r?.name || r?.email
  const { data: user } = useQuery({
    queryKey: ['user', recipientId],
    queryFn: () => getUserById(recipientId),
    enabled: !!recipientId && !hasDisplay,
    staleTime: 5 * 60 * 1000,
  })
  const display = r?.name || r?.email || user?.full_name || user?.email || 'Recipient'

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-600">Order {r.order}</span>
        {recipientId ? (
          <Link href={`/dashboard/users/${recipientId}`} className="text-sm text-blue-600 hover:underline">
            {display}
          </Link>
        ) : (
          <span className="text-sm text-gray-900">{display}</span>
        )}
      </div>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge(r.status)}`}>
        {r.status}
      </span>
    </div>
  )
}

const badge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export default function EnvelopeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const { data: envelope, isLoading, error } = useEnvelope(id)
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectEnvelope()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  // Compute IDs and run user query BEFORE any early returns to keep hook order stable
  const creatorId = envelope?.creator?.id || (envelope as any)?.creator
  const creatorHasName = Boolean(envelope?.creator?.full_name || (envelope as any)?.creator_full_name)
  const { data: creatorUser } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId),
    enabled: Boolean(creatorId) && !creatorHasName,
    staleTime: 5 * 60 * 1000,
  })
  const documentIdPre = envelope?.document?.id || (envelope as any)?.document
  const documentHasName = Boolean(envelope?.document?.file_name || (envelope as any)?.document_file_name)
  const { data: documentData } = useQuery({
    queryKey: ['document', documentIdPre],
    queryFn: () => getDocument(documentIdPre as string),
    enabled: Boolean(documentIdPre) && !documentHasName,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="py-12 text-center text-red-600">
            Failed to load envelope. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!envelope) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Envelope not found.</h3>
              <p className="text-gray-600">The requested envelope could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const documentName =
    (documentData && (documentData as any).file_name) ||
    (envelope as any)?.document_file_name ||
    envelope?.document?.file_name ||
    (documentData && ((documentData as any).name || (documentData as any).filename || (documentData as any).title)) ||
    'Document'
  const documentId = envelope?.document?.id || (envelope as any)?.document || documentData?.id
  const creatorLabel = envelope?.creator?.full_name || envelope?.creator?.email || (envelope as any)?.creator_email || '—'
  const creatorDisplay = creatorUser?.full_name || creatorLabel

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envelope: {documentName}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge(envelope.status)}`}>
              {envelope.status}
            </span>
            <span className="text-gray-600">
              Creator: {creatorId ? (
                <Link href={`/dashboard/users/${creatorId}`} className="text-blue-600 hover:underline">
                  {creatorDisplay}
                </Link>
              ) : (
                creatorDisplay
              )}
            </span>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => router.push(`/dashboard/envelopes/${envelope.id}/sign`)}
            disabled={false}
            title="Go to signing"
          >
            Sign Document
          </Button>
          {envelope.status === 'draft' && (
            <Button
              onClick={async () => {
                if (window.confirm('Are you sure you want to send this envelope?')) {
                  await sendAsync(envelope.id)
                }
              }}
              disabled={sending}
            >
              Send Envelope
            </Button>
          )}
          {envelope.status === 'sent' && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (window.confirm('Are you sure you want to reject this envelope?')) {
                  await rejectAsync(envelope.id)
                }
              }}
              disabled={rejecting}
            >
              Reject Envelope
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this envelope?')) {
                await deleteAsync(envelope.id)
                router.push('/dashboard/envelopes')
              }
            }}
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">PDF</span>
              </div>
              <div>
                {documentId ? (
                  <Link href={`/dashboard/documents/${documentId}`} className="font-medium text-blue-600 hover:underline">
                    {documentData ? documentName : 'Loading...'}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-900">{documentName}</p>
                )}
                <p className="text-sm text-gray-600">Size: {Math.round(((envelope.document?.file_size || documentData?.file_size || 0) as number) / 1024)} KB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recipients ({envelope.recipients?.length || 0})</CardTitle>
          <CardDescription>Signing order and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(envelope.recipients) ? envelope.recipients : [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((r) => (
                <RecipientItem key={r.id ?? `${r.order}`} r={r} />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Key events</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Created: {new Date(envelope.created_at).toLocaleString()}</li>
            {envelope.sent_at && <li>Sent: {new Date(envelope.sent_at).toLocaleString()}</li>}
            {envelope.completed_at && <li>Completed: {new Date(envelope.completed_at).toLocaleString()}</li>}
            {envelope.rejected_at && <li>Rejected: {new Date(envelope.rejected_at).toLocaleString()}</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
