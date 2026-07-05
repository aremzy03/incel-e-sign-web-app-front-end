export function getRecipientInitials(name: string, email: string): string {
  const trimmed = name.trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function countRecipientFields(
  fieldPositions: import('@/types/envelope').FieldPositions,
  recipientId: number,
): number {
  const id = String(recipientId)
  return Object.values(fieldPositions).reduce(
    (sum, docFields) =>
      sum + Object.values(docFields).filter((field) => field.assignedTo === id).length,
    0,
  )
}

export function getDocumentBadgeLabel(status?: string): string | null {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'draft') return 'Template'
  if (normalized === 'rejected') return 'Shared'
  return null
}
