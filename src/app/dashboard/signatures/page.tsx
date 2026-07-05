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
    <div className="mx-auto max-w-max-content-width space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        title="My Signatures"
        subtitle="Manage your personal and professional signatures for quick document processing."
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
          title="Create a signature to speed up signing"
          description="Your saved signatures are encrypted and ready to use across all your enterprise legal agreements."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(true)}>
                <MaterialIcon name="draw" size={18} className="mr-2" />
                Draw Signature
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <MaterialIcon name="upload_file" size={18} className="mr-2" />
                Upload Signature
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <section className="mb-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>

          <section className="mb-12 rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-label-sm font-bold text-primary">
              <MaterialIcon name="gesture" size={20} className="text-secondary" />
              Active Signature Picker Preview
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {filtered.map((sig) => (
                <button
                  type="button"
                  key={sig.id}
                  className={`paper-texture flex h-28 w-48 flex-shrink-0 flex-col items-center justify-center rounded-lg border transition-all ${
                    sig.is_default
                      ? 'relative border-2 border-secondary'
                      : 'border-border hover:border-secondary/50'
                  }`}
                  onClick={() =>
                    toast('Inline picker selection is preview-only for now', { icon: 'ℹ️' })
                  }
                >
                  {sig.is_default && (
                    <span className="material-symbols-outlined absolute right-2 top-2 rounded-full bg-white text-secondary">
                      check_circle
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sig.image_url} alt={sig.name} className="h-12 w-auto object-contain" />
                  <span
                    className={`mt-2 text-label-xs ${
                      sig.is_default ? 'font-bold text-secondary' : 'text-muted'
                    }`}
                  >
                    {sig.is_default ? 'Primary Signature' : sig.name}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="flex h-28 w-28 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant hover:bg-surface transition-colors"
                onClick={() => setModalOpen(true)}
              >
                <MaterialIcon name="add" />
                <span className="mt-1 text-label-xs text-muted">New</span>
              </button>
            </div>
            <p className="mt-4 text-caption-xs text-muted">
              This inline picker appears during the document signing flow for rapid selection.
            </p>
          </section>
        </>
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
