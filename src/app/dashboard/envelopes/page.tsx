'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { ListPaginationControls } from '@/components/list-pagination-controls'
import {
  PageHeader,
  FilterPills,
  SearchField,
  EnvelopeCard,
  EmptyState,
} from '@/components/library'
import { useEnvelopes, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { useSession } from 'next-auth/react'
import type { Envelope } from '@/lib/api/envelopes'
import { isSelfSignEnvelope } from '@/lib/api/envelopes'
import {
  formatRelativeTime,
  getEnvelopeSubtitle,
  getEnvelopeVariant,
  getEnvelopeCreatorId,
  getEnvelopeSignerCount,
  getEnvelopeSignedCount,
  buildEnvelopeSignerStack,
} from './envelope-card-utils'

const PAGE_SIZE = 10

type QuickFilter =
  | 'all'
  | 'waiting_me'
  | 'waiting_others'
  | 'draft'
  | 'completed'
  | 'rejected'
  | 'self_signed'

function matchesQuickFilter(
  env: Envelope,
  filter: QuickFilter,
  currentUserId?: string,
): boolean {
  const status = env.status?.toLowerCase() ?? ''
  switch (filter) {
    case 'all':
      return true
    case 'draft':
      return status.includes('draft')
    case 'completed':
      return status.includes('complete') && !isSelfSignEnvelope(env)
    case 'rejected':
      return status.includes('reject')
    case 'self_signed':
      return isSelfSignEnvelope(env)
    case 'waiting_me': {
      const variant = getEnvelopeVariant(env, currentUserId)
      return variant === 'your-turn'
    }
    case 'waiting_others': {
      const isCreator = getEnvelopeCreatorId(env) === currentUserId
      const isCurrentSigner = env.current_signer?.id === currentUserId
      return isCreator && status.includes('pending') && !isSelfSignEnvelope(env) && !isCurrentSigner
    }
    default:
      return true
  }
}

export default function EnvelopesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [page, setPage] = useState(1)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const apiStatus =
    quickFilter === 'draft'
      ? 'draft'
      : quickFilter === 'completed'
        ? 'completed'
        : quickFilter === 'rejected'
          ? 'rejected'
          : undefined

  const isSelfSign = quickFilter === 'self_signed' ? true : undefined

  const { data, isLoading, error, isFetching } = useEnvelopes(
    page,
    PAGE_SIZE,
    apiStatus,
    debouncedSearch || undefined,
    isSelfSign,
  )
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  const rawEnvelopes = data?.results ?? []
  const envelopes = useMemo(
    () =>
      rawEnvelopes.filter((env) =>
        matchesQuickFilter(env, quickFilter, currentUserId),
      ),
    [rawEnvelopes, quickFilter, currentUserId],
  )

  const totalCount = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const quickFilterOptions = [
    { value: 'all' as QuickFilter, label: 'All' },
    { value: 'waiting_me' as QuickFilter, label: 'Waiting for Me' },
    { value: 'waiting_others' as QuickFilter, label: 'Waiting for Others' },
    { value: 'draft' as QuickFilter, label: 'Drafts' },
    { value: 'completed' as QuickFilter, label: 'Completed' },
    { value: 'rejected' as QuickFilter, label: 'Rejected' },
    { value: 'self_signed' as QuickFilter, label: 'Self-Signed' },
  ]

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader
        title="Envelopes"
        subtitle="Manage your document envelopes and track their status"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/envelopes/self-sign">Sign yourself</Link>
            </Button>
            <Button asChild className="bg-secondary hover:bg-accent-hover">
              <Link href="/dashboard/envelopes/create">
                <MaterialIcon name="add" size={18} className="mr-2" />
                Create Envelope
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <FilterPills
          options={quickFilterOptions}
          value={quickFilter}
          onChange={(v) => {
            setQuickFilter(v as QuickFilter)
            setPage(1)
          }}
          aria-label="Envelope quick filters"
        />

        <SearchField
          placeholder="Search envelopes, signers, or documents…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <MaterialIcon name="progress_activity" size={24} className="animate-spin" />
          <span className="ml-2">Loading envelopes…</span>
        </div>
      ) : error && !data ? (
        <EmptyState icon="error" title="Failed to load envelopes" description="Please try again." />
      ) : envelopes.length === 0 ? (
        <EmptyState
          icon="mail"
          title="No envelopes found"
          description="Create a new envelope to get started."
          action={
            <Button asChild>
              <Link href="/dashboard/envelopes/create">Create Envelope</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {envelopes.map((env) => (
              <EnvelopeCardRow
                key={env.id}
                env={env}
                currentUserId={currentUserId}
                onView={() => router.push(`/dashboard/envelopes/${env.id}`)}
                onSign={() => router.push(`/dashboard/envelopes/${env.id}/sign`)}
                onDelete={async () => {
                  if (window.confirm('Delete this envelope?')) await deleteAsync(env.id)
                }}
                deleting={deleting}
              />
            ))}
          </div>
          <ListPaginationControls
            page={page}
            totalPages={totalPages}
            hasPrevious={Boolean(data?.previous) || page > 1}
            hasNext={Boolean(data?.next) || page < totalPages}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            totalCount={totalCount}
          />
        </>
      )}

      {isFetching && data && (
        <p className="text-caption-xs text-muted">Updating…</p>
      )}
    </div>
  )
}

function EnvelopeCardRow({
  env,
  currentUserId,
  onView,
  onSign,
  onDelete,
  deleting,
}: {
  env: Envelope
  currentUserId?: string
  onView: () => void
  onSign: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const variant = getEnvelopeVariant(env, currentUserId)
  const isCreator = getEnvelopeCreatorId(env) === currentUserId
  const signerCount = getEnvelopeSignerCount(env)
  const signedCount = getEnvelopeSignedCount(env)

  return (
    <EnvelopeCard
      id={env.id}
      name={env.name || 'Untitled envelope'}
      status={env.status}
      variant={variant}
      subtitle={getEnvelopeSubtitle(env, variant, currentUserId)}
      creatorName={
        isCreator ? undefined : env.creator_name || env.creator?.full_name || env.creator?.email
      }
      isCreator={isCreator}
      documentCount={env.documents?.length}
      signerCount={signerCount}
      signedCount={signedCount}
      updatedAt={env.updated_at ? formatRelativeTime(env.updated_at) : undefined}
      signers={buildEnvelopeSignerStack(env, variant, currentUserId)}
      onSign={variant === 'your-turn' ? onSign : undefined}
      onView={onView}
      onDelete={isCreator && variant === 'draft' && !deleting ? onDelete : undefined}
      onRemind={variant === 'pending' && isCreator ? () => {} : undefined}
    />
  )
}
