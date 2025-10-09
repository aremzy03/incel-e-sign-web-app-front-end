'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useEnvelopes, useRejectEnvelope, useDeleteEnvelope } from '@/hooks/useEnvelopes'
import { useSession } from 'next-auth/react'

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
  const { data, isLoading, error } = useEnvelopes()
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectEnvelope()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteEnvelope()

  const envelopes = data?.results || []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
        <CardHeader>
          <CardTitle>Your Envelopes</CardTitle>
          <CardDescription>View and manage all your document envelopes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {error && (
            <p className="text-red-600">Failed to load envelopes. Please try again.</p>
          )}
          {!isLoading && !error && envelopes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No envelopes found.</p>
            </div>
          )}
          {!isLoading && !error && envelopes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envelopes.map((env) => {
                  const isCreator = env.creator?.id === currentUserId
                  return (
                  <TableRow key={env.id}>
                    <TableCell className="font-medium">{env.name || env.document?.file_name || '—'}</TableCell>
                <TableCell>
                  <CreatorCell creator={env.creator} />
                </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(env.status)}`}>
                        {env.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(env.recipients?.length || 0)} recipient{(env.recipients?.length || 0) !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" title="View envelope" onClick={() => router.push(`/dashboard/envelopes/${env.id}`)}>View</Button>
                      {isCreator && env.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Reject envelope"
                          disabled={rejecting}
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to reject this envelope?')) {
                              await rejectAsync(env.id)
                            }
                          }}
                        >
                          Reject
                        </Button>
                      )}
                      {isCreator && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete envelope"
                        disabled={deleting}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this envelope?')) {
                            await deleteAsync(env.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CreatorCell({ creator }: { creator: any }) {
  const creatorId = creator?.id
  const hasName = Boolean(creator?.full_name)
  const { data: user } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId),
    enabled: Boolean(creatorId) && !hasName,
    staleTime: 5 * 60 * 1000,
  })
  const label = user?.full_name || creator?.full_name || creator?.email || '—'
  if (!creatorId) return <span>{label}</span>
  return (
    <Link href={`/dashboard/users/${creatorId}`} className="text-blue-600 hover:underline">
      {label}
    </Link>
  )
}
