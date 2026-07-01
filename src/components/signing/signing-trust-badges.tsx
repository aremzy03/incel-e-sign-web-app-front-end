import { MaterialIcon } from '@/components/ui/material-icon'

const BADGES = [
  { icon: 'verified_user' as const, label: 'eIDAS Certified' },
  { icon: 'gavel' as const, label: 'Legal Binding' },
  { icon: 'security' as const, label: 'SOC2 Type II' },
  { icon: 'cloud_done' as const, label: 'AES-256 Encryption' },
]

export function SigningTrustBadges() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-8 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 md:grid-cols-4">
      {BADGES.map((badge) => (
        <div key={badge.label} className="flex items-center justify-center gap-2">
          <MaterialIcon name={badge.icon} size={20} className="text-primary" />
          <span className="font-label-xs text-label-xs font-bold uppercase tracking-tighter">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
