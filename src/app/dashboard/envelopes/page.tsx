'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ListPaginationControls } from '@/components/list-pagination-controls'
import { useEnvelopes, useRejectEnvelope, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { useSession } from 'next-auth/react'
import { UserAvatar } from '@/components/UserAvatar'
import { useSidebar } from '../dashboard-client-layout'
import { Eye, Trash2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export default function EnvelopesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const { isCollapsed } = useSidebar()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const listStatus = statusFilter === 'all' ? undefined : statusFilter

  const { data, isLoading, error, isFetching } = useEnvelopes(
    page,
    PAGE_SIZE,
    listStatus,
    debouncedSearch || undefined,
  )
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectEnvelope()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  const envelopes = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className={cn('mx-auto space-y-6', isCollapsed ? 'max-w-[95%]' : 'max-w-6xl')}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envelopes</h1>
          <p className="text-gray-600 mt-1">Manage your document envelopes and track their status</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/envelopes/create">Create New Envelope</Link>
        </Button>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Your Envelopes</CardTitle>
            <CardDescription>
              {isLoading && !data
                ? 'Loading...'
                : `${totalCount} envelope${totalCount === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:w-64 space-y-1">
              <Input
                type="search"
                placeholder="Search by name, description, or creator"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {error && !data && (
            <p className="text-red-600">Failed to load envelopes. Please try again.</p>
          )}
          {!isLoading && !error && envelopes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No envelopes found.</p>
            </div>
          )}
          {envelopes.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] max-w-[200px]">Document</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envelopes.map((env) => {
                    const isCreator = env.creator?.id === currentUserId
                    return (
                      <TableRow key={env.id}>
                        <TableCell
                          className="font-medium w-[200px] max-w-[200px] truncate"
                          title={env.name || env.documents?.[0]?.file_name || '—'}
                        >
                          {env.name || env.documents?.[0]?.file_name || '—'}
                        </TableCell>
                        <TableCell>
                          <CreatorCell creator={env.creator} />
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(env.status)}`}
                          >
                            {env.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <RecipientAvatars recipients={env.recipients || []} />
                        </TableCell>
                        <TableCell className="text-right w-[120px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              title="View envelope"
                              aria-label="View envelope"
                              className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                              onClick={() => router.push(`/dashboard/envelopes/${env.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isCreator && env.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Reject envelope"
                                aria-label="Reject envelope"
                                disabled={rejecting}
                                className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to reject this envelope?')) {
                                    await rejectAsync(env.id)
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {isCreator && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Delete envelope"
                                aria-label="Delete envelope"
                                disabled={deleting}
                                className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this envelope?')) {
                                    await deleteAsync(env.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

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
            <p className="text-xs text-gray-500 mt-2">Updating...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CreatorCell({ creator }: { creator: any }) {
  const creatorId = creator?.id
  const { data: user } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId),
    enabled: Boolean(creatorId),
    staleTime: 5 * 60 * 1000,
  })
  const label = user?.full_name || creator?.full_name || creator?.email || '—'
  if (!creatorId) return <span>{label}</span>
  return (
    <div className="flex items-center">
      <Link
        href={`/dashboard/users/${creatorId}`}
        className="hover:opacity-80 transition-opacity"
        title={label}
        aria-label={label}
      >
        <UserAvatar
          userId={creatorId}
          userName={user?.full_name || creator?.full_name}
          userEmail={user?.email || creator?.email}
          profilePhotoUrl={user?.profile_photo_url || creator?.profile_photo_url}
          className="h-8 w-8"
        />
      </Link>
    </div>
  )
}

function RecipientAvatars({ recipients }: { recipients: any[] }) {
  if (!recipients || recipients.length === 0) {
    return <span className="text-gray-500">No recipients</span>
  }

  const displayRecipients = recipients.slice(0, 5)
  const remainingCount = recipients.length - 5

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {displayRecipients.map((recipient, index) => (
          <RecipientAvatar key={recipient.id || index} recipient={recipient} index={index} />
        ))}
      </div>
      {remainingCount > 0 && <span className="ml-2 text-sm text-gray-600">+{remainingCount}</span>}
    </div>
  )
}

function RecipientAvatar({ recipient, index }: { recipient: any; index: number }) {
  const recipientId = recipient?.id
  const { data: user } = useQuery({
    queryKey: ['user', recipientId],
    queryFn: () => getUserById(recipientId),
    enabled: !!recipientId,
    staleTime: 5 * 60 * 1000,
  })

  const profilePhotoUrl = user?.profile_photo_url || recipient?.profile_photo_url
  const name = user?.full_name || recipient?.name || recipient?.email || '?'

  if (!recipientId) {
    return (
      <div className={index > 0 ? '-ml-4' : ''}>
        <div className="h-[40px] w-[40px] rounded-full border-4 border-white" title={name} aria-label={name}>
          <UserAvatar
            userId={recipientId}
            userName={name}
            userEmail={recipient?.email}
            profilePhotoUrl={profilePhotoUrl}
            className="h-full w-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={index > 0 ? '-ml-4' : ''}>
      <Link
        href={`/dashboard/users/${recipientId}`}
        className="hover:opacity-80 transition-opacity block"
        title={name}
        aria-label={name}
      >
        <div className="h-[40px] w-[40px] rounded-full border-4 border-white">
          <UserAvatar
            userId={recipientId}
            userName={name}
            userEmail={recipient?.email}
            profilePhotoUrl={profilePhotoUrl}
            className="h-full w-full"
          />
        </div>
      </Link>
    </div>
  )
}
