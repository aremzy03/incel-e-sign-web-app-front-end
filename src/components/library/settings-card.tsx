import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface SettingsCardProps {
  icon: string
  title: string
  children: React.ReactNode
  className?: string
}

export function SettingsCard({ icon, title, children, className }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-container-low px-5 py-3">
        <MaterialIcon name={icon} size={20} className="text-secondary" />
        <h2 className="text-headline-lg font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

export function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-label-sm font-medium text-on-surface">{label}</p>
        {description && <p className="mt-0.5 text-caption-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          checked ? 'bg-secondary' : 'bg-outline-variant',
        )}
        title={disabled ? 'Available soon' : undefined}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

interface DangerZoneProps {
  onAction?: () => void
}

export function DangerZone({ onAction }: DangerZoneProps) {
  return (
    <div className="rounded-xl border border-error/30 bg-error-light/20 p-5 dark:bg-error-light/10">
      <div className="flex items-start gap-3">
        <MaterialIcon name="warning" size={24} className="text-error" />
        <div className="flex-1">
          <h3 className="text-label-sm font-semibold text-error">Danger Zone</h3>
          <p className="mt-1 text-body-sm text-muted">
            Deactivating your account will revoke access to all documents and envelopes.
          </p>
          <button
            type="button"
            onClick={onAction}
            disabled
            title="Available soon"
            className="mt-4 rounded-lg border border-error px-4 py-2 text-label-sm font-medium text-error opacity-50"
          >
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  )
}
