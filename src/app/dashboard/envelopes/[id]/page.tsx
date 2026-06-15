'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEnvelope, useSendEnvelope, useRejectEnvelope, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { getEnvelopeDocuments, type EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import { useSession } from 'next-auth/react'
import { UserAvatar } from '@/components/UserAvatar'
import { Check, Copy, PenTool, Pencil, XCircle, Trash2, Send } from 'lucide-react'

function RecipientItem({ r, envelopeSignatures }: { r: any; envelopeSignatures: any[] }) {
  const recipientId = r?.id
  const hasDisplay = r?.name || r?.email
  // Always fetch user data to get profile photo URL
  const { data: user } = useQuery({
    queryKey: ['user', recipientId],
    queryFn: () => getUserById(recipientId),
    enabled: !!recipientId,
    staleTime: 5 * 60 * 1000,
  })

  const display = r?.name || r?.email || user?.full_name || user?.email || 'Recipient'
  const profilePhotoUrl = user?.profile_photo_url || r?.profile_photo_url
  
  // Find the signature for this recipient by matching signer ID
  const recipientSignature = envelopeSignatures?.find(sig => sig.signer === recipientId)
  
  // Get status from signatures if available, otherwise fall back to r.status
  const recipientStatus = recipientSignature?.status || r.status

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-600">Order {r.order}</span>
        {recipientId ? (
          <Link href={`/dashboard/users/${recipientId}`} className="hover:opacity-80 transition-opacity">
            <UserAvatar
              userId={recipientId}
              userName={user?.full_name || r?.name}
              userEmail={user?.email || r?.email}
              profilePhotoUrl={profilePhotoUrl}
              className="h-8 w-8"
            />
          </Link>
        ) : (
          <UserAvatar
            userId={recipientId}
            userName={user?.full_name || r?.name}
            userEmail={user?.email || r?.email}
            profilePhotoUrl={profilePhotoUrl}
            className="h-8 w-8"
          />
        )}
        {recipientId ? (
          <Link href={`/dashboard/users/${recipientId}`} className="text-sm text-blue-600 hover:underline">
            {display}
          </Link>
        ) : (
          <span className="text-sm text-gray-900">{display}</span>
        )}
      </div>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge(recipientStatus)}`}>
        {recipientStatus}
      </span>
    </div>
  )
}

const badge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export default function EnvelopeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''
  const { data: session } = useSession()

  const { data: envelope, isLoading, error } = useEnvelope(id)
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectEnvelope()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  // Compute IDs and run user query BEFORE any early returns to keep hook order stable
  const creatorId = envelope?.creator?.id || (envelope as any)?.creator
  const creatorHasName = Boolean(envelope?.creator?.full_name || (envelope as any)?.creator_full_name)
  // Always fetch user data to get profile photo URL
  const { data: creatorUser } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId),
    enabled: Boolean(creatorId),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch documents for the current envelope
  const { data: envelopeDocuments, isLoading: isLoadingDocs } = useQuery<EnvelopeDocumentResponse[]>({
    queryKey: ['envelopeDocuments', id],
    queryFn: () => getEnvelopeDocuments(id),
    enabled: !!id,
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

  const documentName = envelope?.name || 'Document'
  const creatorLabel = envelope?.creator?.full_name || envelope?.creator?.email || (envelope as any)?.creator_email || '—'
  const creatorDisplay = creatorUser?.full_name || creatorLabel
  const creatorProfilePhotoUrl = creatorUser?.profile_photo_url || (envelope?.creator as any)?.profile_photo_url

  // Check if current user is the creator
  const currentUserId = session?.user?.id
  const isCreator = currentUserId && (creatorId === currentUserId)
  const isSelfSign = envelope.is_self_sign === true
  
  // Check if current user is a recipient
  const isRecipient = currentUserId && envelope?.recipients?.some((r: any) => {
    const recipientId = r?.id || r?.user_id || r?.signer_id
    return recipientId === currentUserId
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envelope: {documentName}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge(envelope.status)}`}>
              {envelope.status}
            </span>
            {isSelfSign && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
                Self-signed
              </span>
            )}
            <div className="flex items-center space-x-2 text-gray-600">
              <span>Creator:</span>
              {creatorId ? (
                <div className="flex items-center space-x-2">
                  <Link href={`/dashboard/users/${creatorId}`} className="hover:opacity-80 transition-opacity">
                    <UserAvatar
                      userId={creatorId}
                      userName={creatorUser?.full_name || envelope?.creator?.full_name}
                      userEmail={creatorUser?.email || envelope?.creator?.email}
                      profilePhotoUrl={creatorProfilePhotoUrl}
                      className="h-8 w-8"
                    />
                  </Link>
                  <Link href={`/dashboard/users/${creatorId}`} className="text-blue-600 hover:underline">
                    {creatorDisplay}
                  </Link>
                </div>
              ) : (
                <span>{creatorDisplay}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sign Document - Only for recipients on multi-party envelopes */}
          {!isSelfSign && isRecipient && (envelope.status === 'draft' || envelope.status === 'pending') && (
            <Button
              onClick={() => router.push(`/dashboard/envelopes/${envelope.id}/sign`)}
              disabled={false}
              title="Sign document"
              aria-label="Sign document"
              className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              <PenTool className="h-4 w-4" />
            </Button>
          )}
          {/* Edit - Only for creator in draft or rejected status (multi-party) */}
          {!isSelfSign && isCreator && (envelope.status === 'draft' || envelope.status === 'rejected') && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/envelopes/${envelope.id}/edit`)}
              title="Edit envelope"
              aria-label="Edit envelope"
              className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {/* Send - Only for creator in draft status (multi-party) */}
          {!isSelfSign && isCreator && envelope.status === 'draft' && (
            <Button
              onClick={async () => {
                if (window.confirm('Are you sure you want to send this envelope?')) {
                  await sendAsync(envelope.id)
                }
              }}
              disabled={sending}
              title="Send envelope"
              aria-label="Send envelope"
              className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          {/* Reject - Only for creator when sent (multi-party) */}
          {!isSelfSign && isCreator && envelope.status === 'pending' && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (window.confirm('Are you sure you want to reject this envelope?')) {
                  await rejectAsync(envelope.id)
                }
              }}
              disabled={rejecting}
              title="Reject envelope"
              aria-label="Reject envelope"
              className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          {/* Delete - Only for creator */}
          {isCreator && (
            <Button
              variant="ghost"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this envelope?')) {
                  await deleteAsync(envelope.id)
                  router.push('/dashboard/envelopes')
                }
              }}
              disabled={deleting}
              title="Delete envelope"
              aria-label="Delete envelope"
              className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Envelope Description</CardTitle>
          <CardDescription>Shared with recipients</CardDescription>
        </CardHeader>
        <CardContent>
          {envelope.description ? (
            <p className="text-sm text-gray-700 whitespace-pre-line">{envelope.description}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">No description provided.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>PDF Protection</CardTitle>
          <CardDescription>Password required to open completed PDFs</CardDescription>
        </CardHeader>
        <CardContent>
          {envelope.pdf_lock_password ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Password:</span> {envelope.pdf_lock_password}
                </p>
                <CopyPasswordButton value={envelope.pdf_lock_password ?? ''} />
              </div>
              <p className="text-xs text-gray-500">
                Keep this password secure. Recipients will need it to open signed documents.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              A password will be generated once the envelope is completed.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingDocs ? (
              <div>Loading documents...</div>
            ) : envelopeDocuments && envelopeDocuments.length > 0 ? (
              envelopeDocuments.map((doc: EnvelopeDocumentResponse) => {
                const signedUrl =
                  (doc as EnvelopeDocumentResponse & { document_signed_file_url?: string }).document_signed_file_url ||
                  doc.signed_file_url
                const useSignedDirectLink =
                  isSelfSign && envelope.status === 'completed' && !!signedUrl
                const href = useSignedDirectLink
                  ? signedUrl!
                  : envelope.status === 'completed' && envelope.pdf_lock_password
                    ? `/dashboard/documents/${doc.id}?pdf_password=${encodeURIComponent(
                        envelope.pdf_lock_password
                      )}`
                    : `/dashboard/documents/${doc.id}`

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 text-xs font-semibold tracking-wide">
                          PDF
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {doc.file_name || `Document ${doc.id}`}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {useSignedDirectLink
                            ? 'Open the signed PDF version of this document.'
                            : 'Click “Open” to view the latest version of this document.'}
                        </p>
                      </div>
                    </div>
                    {useSignedDirectLink ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs flex items-center gap-1.5"
                        >
                          <span>Open signed</span>
                        </Button>
                      </a>
                    ) : (
                      <Link href={href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs flex items-center gap-1.5"
                        >
                          <span>Open</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })
            ) : ( 
              <p className="text-sm text-gray-600">No documents found in this envelope.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>
            {isSelfSign ? 'Signer' : `Recipients (${envelope.recipients?.length || 0})`}
          </CardTitle>
          <CardDescription>
            {isSelfSign ? 'You signed this document' : 'Signing order and status'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(envelope.recipients) ? envelope.recipients : [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((r) => (
                <RecipientItem key={r.id ?? `${r.order}`} r={r} envelopeSignatures={envelope.signatures || []} />
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
            {envelope.sent_at && !isSelfSign && (
              <li>Sent: {new Date(envelope.sent_at).toLocaleString()}</li>
            )}
            {envelope.completed_at && <li>Completed: {new Date(envelope.completed_at).toLocaleString()}</li>}
            {envelope.rejected_at && <li>Rejected: {new Date(envelope.rejected_at).toLocaleString()}</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyPasswordButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="text-xs flex items-center justify-center gap-1.5 h-8 w-10 px-0"
      title={copied ? 'Copied' : 'Copy password'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{copied ? 'Copied' : 'Copy password'}</span>
    </Button>
  )
}
