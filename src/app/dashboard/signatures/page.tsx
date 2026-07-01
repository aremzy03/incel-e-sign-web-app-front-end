'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  PageHeader,
  SearchField,
  SignatureCard,
  AddSignatureCard,
  SignatureModal,
  EmptyState,
} from '@/components/library'
import {
  listUserSignatures,
  uploadUserSignature,
  deleteUserSignature,
  type ReusableSignature,
} from '@/lib/api/signatures'
import toast from 'react-hot-toast'

export default function SignaturesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const { data: signatures, isLoading } = useQuery<ReusableSignature[]>({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      name,
      isDefault,
    }: {
      file: File
      name: string
      isDefault: boolean
    }) => uploadUserSignature(file, name, isDefault),
    onSuccess: () => {
      toast.success('Signature saved')
      queryClient.invalidateQueries({ queryKey: ['signatures', 'user'] })
    },
    onError: () => toast.error('Failed to upload signature'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserSignature,
    onSuccess: () => {
      toast.success('Signature deleted')
      queryClient.invalidateQueries({ queryKey: ['signatures', 'user'] })
    },
    onError: () => toast.error('Failed to delete signature'),
  })

  const filtered = useMemo(() => {
    if (!signatures) return []
    if (!searchTerm.trim()) return signatures
    const q = searchTerm.toLowerCase()
    return signatures.filter((s) => (s.name ?? '').toLowerCase().includes(q))
  }, [signatures, searchTerm])

  const hasSignatures = (signatures?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader
        title="My Signatures"
        subtitle="Manage your reusable signatures for signing documents"
        actions={
          <Button onClick={() => setModalOpen(true)} className="bg-secondary hover:bg-accent-hover">
            <MaterialIcon name="add" size={18} className="mr-2" />
            Add Signature
          </Button>
        }
      />

      <SearchField
        placeholder="Search signatures…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        containerClassName="max-w-md"
      />

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted">Loading signatures…</div>
      ) : !hasSignatures ? (
        <EmptyState
          icon="gesture"
          title="No signatures yet"
          description="Draw or upload a signature to use when signing documents."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(true)}>
                <MaterialIcon name="draw" size={18} className="mr-2" />
                Draw
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <MaterialIcon name="upload_file" size={18} className="mr-2" />
                Upload
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sig) => (
            <SignatureCard
              key={sig.id}
              signature={sig}
              isDeleting={deleteMutation.isPending}
              onSetDefault={
                !sig.is_default
                  ? () => {
                      toast('Set default — coming soon', { icon: 'ℹ️' })
                    }
                  : undefined
              }
              onDelete={() => deleteMutation.mutate(sig.id)}
            />
          ))}
          <AddSignatureCard onClick={() => setModalOpen(true)} />
        </div>
      )}

      <SignatureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isUploading={uploadMutation.isPending}
        onUpload={async (file, name, isDefault) => {
          await uploadMutation.mutateAsync({ file, name, isDefault })
        }}
      />
    </div>
  )
}
