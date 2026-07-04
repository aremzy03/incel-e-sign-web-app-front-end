'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  PageHeader,
  AsyncStatePanel,
  SearchField,
  StatusBadge,
  DataTable,
  EmptyState,
} from '@/components/library'
import type { DataTableColumn } from '@/components/library'
import { useUserProfile, useUpdateOwnProfile } from '@/hooks/useUserProfile'
import type { EnvelopeBetweenUsersItem } from '@/lib/api/profile'
import { classifyError } from '@/lib/errors'
import toast from 'react-hot-toast'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface ProfilePageContentProps {
  userId: string
}

export function ProfilePageContent({ userId }: ProfilePageContentProps) {
  const { data: session } = useSession()
  const isSelf = session?.user?.id === userId

  const { data, isLoading, error, refetch } = useUserProfile(userId)
  const profileUser = data?.data.user
  const profileError = error ? classifyError(error, 'Failed to load profile') : null
  const envelopes = data?.data.envelopes_between_users ?? []

  const [fullName, setFullName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tableSearch, setTableSearch] = useState('')

  const previewUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile)
    return profileUser?.profile_photo_url ?? null
  }, [selectedFile, profileUser?.profile_photo_url])

  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateOwnProfile()

  const stats = useMemo(() => {
    const sent = envelopes.filter((e) => e.creator === userId).length
    const signed = envelopes.filter((e) => e.status?.toLowerCase().includes('complete')).length
    const waiting = envelopes.filter((e) => e.status?.toLowerCase().includes('pending')).length
    return { sent, signed, waiting }
  }, [envelopes, userId])

  const filteredEnvelopes = envelopes.filter((e) => {
    if (!tableSearch.trim()) return true
    const q = tableSearch.toLowerCase()
    return (e.name ?? '').toLowerCase().includes(q)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSelf) return
    try {
      const form = new FormData()
      const nameToSave = fullName || profileUser?.full_name
      if (nameToSave && nameToSave !== profileUser?.full_name) form.append('full_name', nameToSave)
      if (selectedFile) form.append('profile_photo', selectedFile)
      if (!form.has('full_name') && !selectedFile) {
        toast('No changes to update')
        return
      }
      const res = await updateProfile(form)
      toast.success(res.message || 'Profile updated')
      setSelectedFile(null)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Update failed'
      toast.error(msg)
    }
  }

  if (isLoading) {
    return <div className="py-16 text-center text-muted">Loading profile…</div>
  }

  if (profileError?.isNotFound) {
    return (
      <AsyncStatePanel
        variant="notFound"
        title="User not found"
        description="Please check the URL and try again."
      />
    )
  }

  if (profileError) {
    return (
      <AsyncStatePanel
        variant="error"
        title="Unable to load profile"
        description={profileError.message}
        primaryAction={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  if (!profileUser) {
    return (
      <AsyncStatePanel
        variant="notFound"
        title="Profile unavailable"
        description="We couldn't find the profile requested for this page."
      />
    )
  }

  const columns: DataTableColumn<EnvelopeBetweenUsersItem>[] = [
    {
      key: 'name',
      header: 'Envelope',
      render: (e) => (
        <span className="font-medium text-on-surface">
          {e.name || e.documents?.[0]?.document_file_name || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (e) => (
        <span
          className={
            e.creator === userId
              ? 'rounded-full bg-primary-light px-2 py-0.5 text-caption-xs font-medium text-primary'
              : 'rounded-full bg-surface-container-high px-2 py-0.5 text-caption-xs font-medium text-muted'
          }
        >
          {e.creator === userId ? 'Creator' : 'Signer'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      hideOnMobile: true,
      render: (e) => (
        <span className="text-muted">
          {e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader title="Profile" subtitle={isSelf ? 'Your account and collaboration history' : profileUser.full_name} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">
            <div className="h-24 bg-gradient-to-r from-primary to-primary-container" />
            <div className="relative px-6 pb-6">
              <div className="-mt-12 mb-4">
                <div className="group relative inline-block">
                  <Avatar className="h-24 w-24 border-4 border-surface-container-lowest">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt={profileUser.full_name} />
                    ) : (
                      <AvatarFallback className="bg-primary text-2xl text-on-primary">
                        {getInitials(profileUser.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isSelf && (
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <MaterialIcon name="photo_camera" size={28} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) setSelectedFile(f)
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {isSelf ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      defaultValue={profileUser.full_name}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input id="email" value={profileUser.email} disabled className="pr-10" />
                      <MaterialIcon
                        name="lock"
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdating} className="w-full">
                    {isUpdating ? 'Updating…' : 'Update Profile'}
                  </Button>
                </form>
              ) : (
                <div>
                  <h2 className="text-headline-lg font-semibold text-on-surface">
                    {profileUser.full_name}
                  </h2>
                  <p className="text-body-sm text-muted">{profileUser.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-container-lowest p-5 shadow-card">
            <h3 className="mb-4 text-label-sm font-semibold uppercase tracking-wide text-muted">
              Activity
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-headline-xl font-bold text-on-surface">{stats.sent}</p>
                <p className="text-caption-xs text-muted">Sent</p>
              </div>
              <div>
                <p className="text-headline-xl font-bold text-on-surface">{stats.signed}</p>
                <p className="text-caption-xs text-muted">Signed</p>
              </div>
              <div>
                <p className="text-headline-xl font-bold text-on-surface">{stats.waiting}</p>
                <p className="text-caption-xs text-muted">Waiting</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-4 shadow-card sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-headline-lg font-semibold text-on-surface">Shared Envelopes</h3>
              <SearchField
                placeholder="Search envelopes…"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                containerClassName="sm:w-64"
              />
            </div>
            {filteredEnvelopes.length === 0 ? (
              <EmptyState icon="mail" title="No shared envelopes" />
            ) : (
              <DataTable
                columns={columns}
                data={filteredEnvelopes}
                keyExtractor={(e) => e.id}
                rowActions={(e) => (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/envelopes/${e.id}`}>View</Link>
                  </Button>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
