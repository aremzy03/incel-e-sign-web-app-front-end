'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/lib/api/users'
import { useUserProfile, useUpdateOwnProfile } from '@/hooks/useUserProfile'
import toast from 'react-hot-toast'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const userIdParam = params?.id
  const isSelf = session?.user?.id && userIdParam ? session.user.id === userIdParam : false

  const { data, isLoading, error } = useUserProfile(userIdParam)
  const profileUser = data?.data.user
  const envelopes = data?.data.envelopes_between_users ?? []

  const [fullName, setFullName] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile)
    }
    return profileUser?.profile_photo_url ?? null
  }, [selectedFile, profileUser?.profile_photo_url])

  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateOwnProfile()

  const handleChooseFile = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) setSelectedFile(files[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const form = new FormData()
      if (fullName && fullName !== profileUser?.full_name) form.append('full_name', fullName)
      if (selectedFile) form.append('profile_photo', selectedFile)

      const hasChanges = (fullName && fullName !== profileUser?.full_name) || Boolean(selectedFile)
      if (!hasChanges) {
        toast('No changes to update')
        return
      }

      const res = await updateProfile(form)
      toast.success(res.message || 'Profile updated')
      setSelectedFile(null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed'
      toast.error(msg)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{(error as any)?.response?.data?.message || error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>User not found</CardTitle>
            <CardDescription>Please check the URL or try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt={profileUser.full_name} />
              ) : (
                <AvatarFallback>{getInitials(profileUser.full_name)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profileUser.full_name}</CardTitle>
              <CardDescription>{profileUser.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        {isSelf && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profileUser.full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_photo">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    id="profile_photo"
                    name="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline" onClick={handleChooseFile}>
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Shared Envelopes</CardTitle>
          <CardDescription>Envelopes involving you and this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {envelopes.length === 0 ? (
            <div className="text-sm text-gray-500">No envelopes to display.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envelopes.map((env: any) => (
                  <TableRow key={env.id}>
                    <TableCell className="font-medium">{env.name || env.documents?.[0]?.document_file_name || '—'}</TableCell>
                    <TableCell>
                      <CreatorCellById creatorId={env.creator} />
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(env.status)}`}>
                        {env.status}
                      </span>
                    </TableCell>
                    <TableCell>{env.signer_count ?? (env.signatures?.length || 0)}</TableCell>
                    <TableCell>{env.created_at ? new Date(env.created_at).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/envelopes/${env.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function CreatorCellById({ creatorId }: { creatorId?: string }) {
  const hasId = Boolean(creatorId)
  const { data: user } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: () => getUserById(creatorId as string),
    enabled: Boolean(creatorId),
    staleTime: 5 * 60 * 1000,
  })
  const label = user?.full_name || user?.email || '—'
  if (!hasId) return <span>—</span>
  return (
    <Link href={`/dashboard/users/${creatorId}`} className="text-blue-600 hover:underline">
      {label}
    </Link>
  )
}


