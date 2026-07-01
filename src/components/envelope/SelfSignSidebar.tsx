'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { PenTool, Palette, Lock, PenLine } from 'lucide-react'
import { DocumentUploadZone } from './DocumentUploadZone'
import { FieldPaletteItem } from './FieldPaletteItem'
import { Document } from '@/lib/api/documents'
import { FieldPositions, FIELD_TYPES } from '@/types/envelope'
import type { ReusableSignature } from '@/lib/api/signatures'
import { cn } from '@/lib/utils'

interface SelfSignSidebarProps {
  uploadedDocuments: Document[]
  fieldPositions: FieldPositions
  onDocumentAdd: (document: Document) => void
  onDocumentRemove: (documentId: string) => void
  onDocumentSelect: (document: Document) => void
  onMergeDocuments?: () => void
  isMerging?: boolean
  envelopeName: string
  onEnvelopeNameChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  signatures: ReusableSignature[]
  selectedSignatureId: string | null
  onSignatureSelect: (id: string) => void
  loadingSignatures: boolean
  onSignComplete: () => void
  signing: boolean
  hasValidationErrors: boolean
  pdfPasswordProtectionEnabled: boolean
  onPdfPasswordProtectionChange: (value: boolean) => void
}

export function SelfSignSidebar({
  uploadedDocuments,
  fieldPositions,
  onDocumentAdd,
  onDocumentRemove,
  onDocumentSelect,
  onMergeDocuments,
  isMerging,
  envelopeName,
  onEnvelopeNameChange,
  description,
  onDescriptionChange,
  signatures,
  selectedSignatureId,
  onSignatureSelect,
  loadingSignatures,
  onSignComplete,
  signing,
  hasValidationErrors,
  pdfPasswordProtectionEnabled,
  onPdfPasswordProtectionChange,
}: SelfSignSidebarProps) {
  const signatureFieldCount = Object.values(fieldPositions).reduce((count, docFields) => {
    return count + Object.values(docFields).filter((f) => f.type === 'signature').length
  }, 0)

  return (
    <div className="w-full bg-white border-r border-border flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-3 p-2.5 w-full min-w-0">
        <Card className="w-full min-w-0 shadow-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface">Document details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="self-sign-name" className="text-[11px] font-medium">
                Name
              </Label>
              <Input
                id="self-sign-name"
                value={envelopeName}
                placeholder="e.g., Self-signed agreement"
                className="h-8 text-xs"
                onChange={(e) => onEnvelopeNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="self-sign-description" className="text-[11px] font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="self-sign-description"
                value={description || ''}
                onChange={(e) => onDescriptionChange(e.target.value)}
                maxLength={1000}
                className="text-xs resize-none h-20"
                placeholder="Notes for your records"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 shadow-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface flex items-center gap-2">
              <DocumentUploadZone
                uploadedDocuments={uploadedDocuments}
                onDocumentAdd={onDocumentAdd}
                onDocumentRemove={onDocumentRemove}
                onDocumentSelect={onDocumentSelect}
                onMergeDocuments={onMergeDocuments}
                isMerging={isMerging}
              />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="w-full min-w-0 shadow-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Your signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingSignatures ? (
              <p className="text-xs text-muted">Loading signatures…</p>
            ) : signatures.length === 0 ? (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 space-y-1">
                <p>No saved signatures. The server will use your default signature if set.</p>
                <Link href="/dashboard/signatures" className="text-secondary hover:underline">
                  Manage signatures
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {signatures.map((sig) => {
                  const isSelected = selectedSignatureId === sig.id
                  return (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => onSignatureSelect(sig.id)}
                      className={cn(
                        'border rounded-md p-2 bg-white hover:border-secondary/50 transition-colors',
                        isSelected && 'border-secondary ring-1 ring-secondary'
                      )}
                    >
                      <img
                        src={sig.image_url}
                        alt={sig.name || 'Signature'}
                        className="w-full h-12 object-contain"
                      />
                      <p className="text-[10px] text-muted mt-1 truncate">
                        {sig.name || 'Signature'}
                        {sig.is_default ? ' (default)' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 shadow-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Field types
              {signatureFieldCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {signatureFieldCount} signature{signatureFieldCount === 1 ? '' : 's'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <p className="text-[11px] text-muted mb-2">
                Drag fields onto your document. Fields are assigned to you automatically.
              </p>
              {FIELD_TYPES.map((fieldType) => (
                <FieldPaletteItem
                  key={fieldType.type}
                  item={fieldType}
                  disabled={uploadedDocuments.length === 0}
                />
              ))}
            </div>
            <div className="mt-4 p-3 bg-info-light rounded-lg">
              <p className="text-xs text-secondary">
                Place at least one signature field, fill required field values, then sign and complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-2.5 border-t border-border space-y-2 bg-white">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Switch
            checked={pdfPasswordProtectionEnabled}
            onCheckedChange={onPdfPasswordProtectionChange}
            aria-label="Enable PDF password protection on completion"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <Lock className="h-3.5 w-3.5 text-slate-600" />
            Lock PDF
          </span>
        </div>
        <Button
          className="w-full flex items-center gap-1.5"
          onClick={onSignComplete}
          disabled={signing || hasValidationErrors}
        >
          <PenLine className="h-4 w-4" />
          {signing ? 'Signing…' : 'Sign & complete'}
        </Button>
      </div>
    </div>
  )
}
