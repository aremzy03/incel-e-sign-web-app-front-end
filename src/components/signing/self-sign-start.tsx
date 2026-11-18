'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Document } from '@/lib/api/documents'
import { getDocuments, normalizeDocument } from '@/lib/api/documents'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadQueue } from '@/components/library'
import { useDocumentUploadQueue } from '@/hooks/useDocumentUploadQueue'
import toast from 'react-hot-toast'

/** The edit-and-sign screen for a document, opened with the Sign tools in view. */
export function selfSignEditorHref(documentId: string) {
  return `/dashboard/documents/${encodeURIComponent(documentId)}/edit?tools=sign`
}

export function SelfSignStart() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const { queue, isUploading, error, uploadFile, removeFromQueue } = useDocumentUploadQueue({
    onSuccess: async (result) => {
      toast.success('Document uploaded')
      const id = normalizeDocument(result).id
      if (id) router.push(selfSignEditorHref(id))
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

  useEffect(() => {
    void loadDocuments()
    // Load the library once on open; later searches are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (file: File) => {
    await uploadFile(file)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-[800px] space-y-12">
        <div className="space-y-2 text-center">
          <h1 className="font-headline-3xl text-headline-3xl text-primary">Add text or sign a document</h1>
          <p className="font-body-base text-body-base text-muted">
            Upload or choose a document, then add text, sign it yourself, or both.
          </p>
        </div>

        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (isUploading) return
              const file = e.dataTransfer.files?.[0]
              if (file) handleUpload(file)
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface p-10 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2 md:p-16 ${
              isUploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
              <MaterialIcon name="upload_file" size={40} className="text-primary" />
            </div>
            <h3 className="mb-2 font-headline-lg text-headline-lg text-primary">Drop PDF or Word file here</h3>
            <p className="font-body-sm text-body-sm text-muted">
              or <span className="font-semibold text-secondary underline">click to browse files</span>
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
              <label htmlFor="self-sign-library-search" className="sr-only">
                Search your documents
              </label>
              <MaterialIcon
                name="search"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                id="self-sign-library-search"
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
                onClick={() => router.push(selfSignEditorHref(doc.id))}
                className="group flex items-center gap-4 rounded-xl border border-border bg-surface-container-lowest p-4 text-left shadow-card transition-colors hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                  <MaterialIcon name="description" size={24} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-sm text-label-sm text-primary group-hover:text-secondary">
                    {doc.file_name || 'Document'}
                  </p>
                  <p className="font-caption-xs text-caption-xs text-muted">
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString()
                      : 'From your library'}
                  </p>
                </div>
                <MaterialIcon name="chevron_right" size={20} className="text-muted" />
              </button>
            ))}
          </div>
          {!loading && documents.length === 0 ? (
            <p className="font-body-sm text-body-sm text-muted">
              Search your library, or upload a file above.
            </p>
          ) : null}
        </section>

      </div>
    </div>
  )
}
