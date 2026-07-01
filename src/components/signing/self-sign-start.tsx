'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Document } from '@/lib/api/documents'
import { getDocuments, normalizeDocument } from '@/lib/api/documents'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadQueue } from '@/components/library'
import { useDocumentUploadQueue } from '@/hooks/useDocumentUploadQueue'
import toast from 'react-hot-toast'

interface SelfSignStartProps {
  onDocumentSelected: (doc: Document) => void
  onContinue: () => void
  hasDocuments: boolean
}

export function SelfSignStart({ onDocumentSelected, onContinue, hasDocuments }: SelfSignStartProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const { queue, isUploading, error, uploadFile, removeFromQueue } = useDocumentUploadQueue({
    onSuccess: async (result) => {
      onDocumentSelected(normalizeDocument(result))
      toast.success('Document uploaded')
      router.replace('/dashboard/envelopes/self-sign?step=editor')
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments({ page: 1, pageSize: 20, search: search || undefined })
      setDocuments(res.results ?? [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [search])

  const handleUpload = async (file: File) => {
    await uploadFile(file)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-[800px] space-y-12">
        <div className="space-y-2 text-center">
          <h1 className="font-headline-3xl text-headline-3xl text-primary">Sign a document yourself</h1>
          <p className="font-body-base text-body-base text-muted">
            Upload a document to add your digital signature instantly.
          </p>
        </div>

        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (isUploading) return
              const file = e.dataTransfer.files?.[0]
              if (file) handleUpload(file)
            }}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface p-16 transition-all hover:bg-surface-container-low ${
              isUploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 transition-transform group-hover:scale-110">
              <MaterialIcon name="upload_file" size={40} className="text-primary" />
            </div>
            <h3 className="mb-2 font-headline-lg text-headline-lg text-primary">Drop PDF or Word file here</h3>
            <p className="font-body-sm text-body-sm text-muted">
              or <span className="font-semibold text-status-your-turn underline">click to browse files</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,application/pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
            {isUploading ? (
              <p className="mt-4 text-sm text-muted">Upload in progress…</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-center text-sm text-error">{error}</p>
          ) : null}

          {queue.length > 0 ? <UploadQueue items={queue} onRemove={removeFromQueue} /> : null}
        </div>

        <section className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="font-headline-lg text-headline-lg text-primary">Select from my documents</h2>
            <div className="relative w-full sm:w-64">
              <MaterialIcon
                name="search"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
                placeholder="Search files…"
                className="pl-10"
              />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={loadDocuments} disabled={loading}>
            {loading ? 'Loading…' : 'Search documents'}
          </Button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  onDocumentSelected(normalizeDocument(doc))
                  router.replace('/dashboard/envelopes/self-sign?step=editor')
                }}
                className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:border-status-your-turn hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                  <MaterialIcon name="description" size={24} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-sm text-label-sm text-primary group-hover:text-status-your-turn">
                    {doc.file_name || 'Document'}
                  </p>
                  <p className="font-caption-xs text-caption-xs text-muted">
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString()
                      : 'From your library'}
                  </p>
                </div>
                <MaterialIcon
                  name="chevron_right"
                  size={20}
                  className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
            ))}
          </div>
        </section>

        {hasDocuments ? (
          <div className="flex justify-center">
            <Button type="button" onClick={onContinue} className="bg-secondary hover:bg-accent-hover">
              Continue to editor
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
