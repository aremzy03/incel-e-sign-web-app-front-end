'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { ListPaginationControls } from '@/components/list-pagination-controls'
import {
  AsyncStatePanel,
  SearchField,
  EnvelopeCard,
} from '@/components/library'
import { cn } from '@/lib/utils'
import { useEnvelopes, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { useSession } from 'next-auth/react'
import type { Envelope } from '@/lib/api/envelopes'
import { classifyError } from '@/lib/errors'
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

const outlineActionClass =
  'border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface'

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

  // Global search's "See all" links arrive with ?search=…
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('search')
    if (fromUrl) setSearchTerm(fromUrl)
  }, [])

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

  const { data, isLoading, error, isFetching, refetch } = useEnvelopes(
    page,
    PAGE_SIZE,
    apiStatus,
    debouncedSearch || undefined,
    isSelfSign,
  )
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()
  const envelopeError = error ? classifyError(error, 'Failed to load envelopes') : null

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
  const hasClientSideFilterMismatch = rawEnvelopes.length > 0 && envelopes.length === 0

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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" asChild className={outlineActionClass}>
          <Link href="/dashboard/envelopes/self-sign" prefetch={false}>Sign yourself</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/envelopes/create" prefetch={false}>
            <MaterialIcon name="add" size={20} className="mr-2" />
            Create Envelope
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* One row: it scrolls sideways when narrow instead of wrapping into a ragged second line. */}
        <div
          className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Envelope quick filters"
        >
          {quickFilterOptions.map((option) => {
            const isActive = quickFilter === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setQuickFilter(option.value)
                  setPage(1)
                }}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-label-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <SearchField
          aria-label="Search envelopes"
          placeholder="Search name, signer, file…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="w-full sm:w-64 xl:shrink-0"
          className="h-10 rounded-xl bg-transparent py-0 !text-body-base text-on-surface placeholder:text-muted"
        />
      </div>

      {isLoading && !data ? (
        <AsyncStatePanel
          variant="loading"
          title="Loading envelopes"
          description="Fetching your latest envelope activity."
        />
      ) : envelopeError && !data ? (
        <AsyncStatePanel
          variant="error"
          title="Failed to load envelopes"
          description={envelopeError.message}
          primaryAction={
            <Button type="button" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : envelopes.length === 0 ? (
        <AsyncStatePanel
          variant="empty"
          title={hasClientSideFilterMismatch ? 'No envelopes match this filter on this page' : 'No envelopes found'}
          description={
            hasClientSideFilterMismatch
              ? 'This filter is applied after pagination, so matching envelopes may still exist on other pages. Try another filter or adjust your search.'
              : 'Create a new envelope to get started.'
          }
          primaryAction={
            hasClientSideFilterMismatch ? (
              <Button type="button" variant="outline" className={outlineActionClass} onClick={() => setQuickFilter('all')}>
                Clear Filter
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/envelopes/create" prefetch={false}>Create Envelope</Link>
              </Button>
            )
          }
          secondaryAction={
            hasClientSideFilterMismatch && searchTerm ? (
              <Button type="button" variant="outline" className={outlineActionClass} onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            ) : undefined
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
            className="tabular-nums"
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
