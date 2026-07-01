import type { EnvelopeCardVariant } from '@/components/library'
import type { EnvelopeSignerStackUser } from '@/components/library/envelope-signer-stack'
import type { Envelope, EnvelopeSigningOrderEntry } from '@/lib/api/envelopes'
import { isSelfSignEnvelope } from '@/lib/api/envelopes'

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getEnvelopeCreatorId(env: Envelope): string {
  return env.creator?.id ?? ''
}

export function getEnvelopeSignerCount(env: Envelope): number {
  return env.signer_count ?? env.signing_order?.length ?? env.recipients?.length ?? 0
}

export function getEnvelopeSignedCount(env: Envelope): number {
  const status = env.status?.toLowerCase() ?? ''
  const total = getEnvelopeSignerCount(env)

  if (status.includes('complete') || isSelfSignEnvelope(env)) {
    return total
  }

  const order = [...(env.signing_order ?? [])].sort((a, b) => a.order - b.order)
  const currentId = env.current_signer?.id

  if (order.length > 0 && currentId) {
    const currentIdx = order.findIndex((entry) => entry.signer_id === currentId)
    return currentIdx >= 0 ? currentIdx : 0
  }

  return (env.recipients ?? []).filter((r) => r.status === 'signed').length
}

function idsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return String(a) === String(b)
}

export function getEnvelopeVariant(
  env: Envelope,
  currentUserId?: string,
): EnvelopeCardVariant {
  const status = env.status?.toLowerCase() ?? ''
  if (status.includes('draft')) return 'draft'
  if (status.includes('reject')) return 'rejected'
  if (isSelfSignEnvelope(env)) return 'completed'
  if (status.includes('complete')) return 'completed'

  if (status.includes('pending') && idsMatch(env.current_signer?.id, currentUserId)) {
    return 'your-turn'
  }

  const recipients = env.recipients ?? []
  const currentIdx = recipients.findIndex((r) => idsMatch(r.id, currentUserId))
  const isRecipient = currentIdx >= 0
  const priorSigned = recipients
    .slice(0, currentIdx)
    .every((r) => r.status === 'signed')

  if (isRecipient && priorSigned && status.includes('pending')) return 'your-turn'
  return 'pending'
}

export function getEnvelopeSubtitle(
  env: Envelope,
  variant: EnvelopeCardVariant,
  currentUserId?: string,
): string {
  const status = env.status?.toLowerCase() ?? ''
  const recipients = env.recipients ?? []

  if (variant === 'your-turn') return 'Needs your signature for final approval'
  if (isSelfSignEnvelope(env)) return 'Signed by you'
  if (variant === 'completed') return 'All signatures captured'
  if (variant === 'rejected') {
    const rejector = recipients.find((r) => r.status === 'rejected')
    return rejector
      ? `Declined by recipient: "${rejector.name || rejector.email}"`
      : 'Declined by a recipient'
  }
  if (variant === 'draft') return 'Incomplete — last saved by you'

  if (variant === 'pending') {
    const waiter = env.current_signer
    if (waiter?.name || waiter?.email) {
      return `Waiting on ${waiter.name || waiter.email}`
    }
    const waiting = recipients.find((r) => r.status === 'pending')
    if (waiting) return `Waiting on ${waiting.name || waiting.email}`
    if (idsMatch(getEnvelopeCreatorId(env), currentUserId)) return 'Waiting on recipients'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function resolveSignerName(
  entry: EnvelopeSigningOrderEntry,
  env: Envelope,
): string | undefined {
  if (entry.signer_name?.trim()) return entry.signer_name.trim()
  if (entry.name?.trim()) return entry.name.trim()
  if (entry.email?.trim()) return entry.email.trim()

  if (idsMatch(entry.signer_id, env.current_signer?.id)) {
    return env.current_signer?.name || env.current_signer?.email
  }

  const signature = env.signatures?.find((s) => idsMatch(s.signer, entry.signer_id))
  if (signature?.signer_name?.trim()) return signature.signer_name.trim()
  if (signature?.signer_email?.trim()) return signature.signer_email.trim()

  const recipient = env.recipients?.find((r) => idsMatch(r.id, entry.signer_id))
  if (recipient?.name?.trim()) return recipient.name.trim()
  if (recipient?.email?.trim()) return recipient.email.trim()

  return undefined
}

function resolveSignerStatus(
  index: number,
  entry: EnvelopeSigningOrderEntry,
  env: Envelope,
  variant: EnvelopeCardVariant,
  currentIdx: number,
  currentUserId?: string,
): EnvelopeSignerStackUser['status'] {
  const status = env.status?.toLowerCase() ?? ''
  const currentId = env.current_signer?.id
  const isCurrentSigner = idsMatch(entry.signer_id, currentId)
  const signature = env.signatures?.find((s) => idsMatch(s.signer, entry.signer_id))

  if (signature?.status === 'signed') {
    return 'completed'
  }
  if (signature?.status === 'processing') {
    return 'current'
  }
  if (signature?.status === 'rejected') {
    return 'rejected'
  }

  if (status.includes('complete') || isSelfSignEnvelope(env)) {
    return 'completed'
  }

  if (status.includes('reject')) {
    if (currentIdx >= 0 && index < currentIdx) return 'completed'
    if (isCurrentSigner) return 'rejected'
    return 'pending'
  }

  if (currentIdx >= 0 && index < currentIdx) {
    return 'completed'
  }

  if (isCurrentSigner) {
    return 'current'
  }

  return 'pending'
}

export function buildEnvelopeSignerStack(
  env: Envelope,
  variant: EnvelopeCardVariant,
  currentUserId?: string,
): EnvelopeSignerStackUser[] {
  const order = [...(env.signing_order ?? [])].sort((a, b) => a.order - b.order)

  if (order.length > 0) {
    const currentId = env.current_signer?.id
    const currentIdx = currentId
      ? order.findIndex((entry) => idsMatch(entry.signer_id, currentId))
      : -1

    return order.map((entry, i) => ({
      id: entry.signer_id,
      name: resolveSignerName(entry, env),
      status: resolveSignerStatus(i, entry, env, variant, currentIdx, currentUserId),
    }))
  }

  return (env.recipients ?? []).map((r, i) => ({
    id: r.id ?? `r-${i}`,
    name: r.name ?? r.email,
    status:
      r.status === 'signed'
        ? 'completed'
        : r.status === 'rejected'
          ? 'rejected'
          : idsMatch(r.id, currentUserId) && variant === 'your-turn'
            ? 'current'
            : 'pending',
  }))
}
