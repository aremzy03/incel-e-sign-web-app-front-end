'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { AuthorityModal } from '@/components/ui/authority-modal'
import { Label } from '@/components/ui/label'

interface SignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File, name: string, isDefault: boolean) => Promise<void>
  isUploading?: boolean
}

export function SignatureModal({ open, onOpenChange, onUpload, isUploading }: SignatureModalProps) {
  const [tab, setTab] = useState<'draw' | 'upload'>('upload')
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (tab === 'upload' && file) {
      await onUpload(file, name || file.name.replace(/\.[^/.]+$/, ''), isDefault)
      setFile(null)
      setName('')
      setIsDefault(false)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setName('')
    setIsDefault(false)
    setTab('upload')
    onOpenChange(false)
  }

  return (
    <AuthorityModal open={open} onOpenChange={handleClose} title="Add Signature" size="lg">
      <div className="space-y-4">
        <div className="inline-flex rounded-lg border border-border bg-surface-container-low p-0.5">
          {(['draw', 'upload'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-2 text-label-sm font-medium capitalize',
                tab === t
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'draw' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-container-low py-16 text-center">
            <MaterialIcon name="gesture" size={40} className="text-muted" />
            <p className="mt-3 text-body-sm font-medium text-on-surface">Draw signature</p>
            <p className="mt-1 text-caption-xs text-muted">Coming soon — use upload for now</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-10 hover:border-secondary"
            >
              <MaterialIcon name="cloud_upload" size={32} className="text-secondary" />
              <span className="text-body-sm text-muted">
                {file ? file.name : 'Click to upload image (PNG, JPG)'}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="space-y-2">
              <Label htmlFor="sig-name">Name (optional)</Label>
              <input
                id="sig-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-body-sm"
                placeholder="My signature"
              />
            </div>
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border text-secondary"
              />
              Set as default signature
            </label>
          </div>
        )}

        <p className="text-caption-xs text-muted">
          By adding a signature, you agree it may be applied to documents you sign electronically.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={tab === 'draw' || !file || isUploading}
          >
            {isUploading ? 'Saving…' : 'Save Signature'}
          </Button>
        </div>
      </div>
    </AuthorityModal>
  )
}
