import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import type { ReusableSignature } from '@/lib/api/signatures'

interface SignatureCardProps {
  signature: ReusableSignature
  onSetDefault?: () => void
  onDelete?: () => void
  isDeleting?: boolean
  className?: string
}

export function SignatureCard({
  signature,
  onSetDefault,
  onDelete,
  isDeleting,
  className,
}: SignatureCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card',
        className,
      )}
    >
      {signature.is_default && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-caption-xs font-medium text-on-secondary">
          <MaterialIcon name="verified" size={12} fill />
          Default
        </span>
      )}
      <div className="paper-texture flex h-32 items-center justify-center p-4">
        <img
          src={signature.image_url}
          alt={signature.name ?? 'Signature'}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="border-t border-border p-3">
        <p className="truncate text-label-sm font-medium text-on-surface">
          {signature.name ?? 'Signature'}
        </p>
        <div className="mt-2 flex gap-2">
          {!signature.is_default && onSetDefault && (
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onSetDefault}>
              Set as Default
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-error"
              aria-label="Delete signature"
            >
              <MaterialIcon name="delete" size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface AddSignatureCardProps {
  onClick: () => void
  className?: string
}

export function AddSignatureCard({ onClick, className }: AddSignatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-container-low p-6 text-muted transition-colors hover:border-secondary hover:text-secondary',
        className,
      )}
    >
      <MaterialIcon name="add" size={32} />
      <span className="text-label-sm font-medium">Add Another Signature</span>
    </button>
  )
}
