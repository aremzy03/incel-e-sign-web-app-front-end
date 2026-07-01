import type { MaterialIconName } from '@/components/ui/material-icon'

export type NotificationVariant =
  | 'your_turn'
  | 'sign_request'
  | 'completed'
  | 'rejected'
  | 'expiring'
  | 'default'

export function getNotificationVariant(message: string): NotificationVariant {
  const lower = message.toLowerCase()
  if (lower.includes('your turn') || lower.includes('action required')) return 'your_turn'
  if (lower.includes('sign') || lower.includes('request')) return 'sign_request'
  if (lower.includes('completed') || lower.includes('signed')) return 'completed'
  if (lower.includes('rejected') || lower.includes('declined')) return 'rejected'
  if (lower.includes('expir')) return 'expiring'
  return 'default'
}

export function getNotificationStyleFromMessage(message: string): {
  rowClass: string
  borderClass: string
  iconBg: string
  icon: MaterialIconName
  iconColor: string
  iconFill: boolean
} {
  const variant = getNotificationVariant(message)
  const base = getNotificationStyle(variant)
  const borderMap: Record<NotificationVariant, string> = {
    your_turn: 'border-l-status-your-turn',
    sign_request: 'border-l-status-pending',
    completed: 'border-l-status-completed',
    rejected: 'border-l-error',
    expiring: 'border-l-status-pending',
    default: 'border-l-outline-variant',
  }
  const colorMap: Record<NotificationVariant, string> = {
    your_turn: 'text-status-your-turn',
    sign_request: 'text-secondary',
    completed: 'text-status-completed',
    rejected: 'text-status-rejected',
    expiring: 'text-status-pending',
    default: 'text-muted',
  }
  return {
    ...base,
    borderClass: borderMap[variant],
    iconColor: colorMap[variant],
  }
}

export function getNotificationStyle(variant: NotificationVariant): {
  rowClass: string
  iconBg: string
  icon: MaterialIconName
  iconFill: boolean
} {
  switch (variant) {
    case 'your_turn':
      return {
        rowClass: 'bg-accent-light',
        iconBg: 'bg-status-your-turn/10',
        icon: 'error',
        iconFill: true,
      }
    case 'sign_request':
      return {
        rowClass: 'bg-accent-light',
        iconBg: 'bg-primary/10',
        icon: 'edit_square',
        iconFill: false,
      }
    case 'completed':
      return {
        rowClass: '',
        iconBg: 'bg-status-completed/10',
        icon: 'check_circle',
        iconFill: true,
      }
    case 'rejected':
      return {
        rowClass: '',
        iconBg: 'bg-status-rejected/10',
        icon: 'cancel',
        iconFill: false,
      }
    case 'expiring':
      return {
        rowClass: '',
        iconBg: 'bg-status-pending/10',
        icon: 'warning',
        iconFill: false,
      }
    default:
      return {
        rowClass: '',
        iconBg: 'bg-surface',
        icon: 'notifications',
        iconFill: false,
      }
  }
}
