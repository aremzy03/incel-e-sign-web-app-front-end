import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { getNotificationStyleFromMessage } from '@/components/dashboard/notification-utils'
import type { NotificationItem } from '@/lib/api/notifications'

interface NotificationFeedItemProps {
  notification: NotificationItem
  onClick?: () => void
  className?: string
}

export function NotificationFeedItem({ notification, onClick, className }: NotificationFeedItemProps) {
  const style = getNotificationStyleFromMessage(notification.message)
  const isUnread = !notification.is_read
  const title = notification.message.split(/[.!?\n]/)[0]?.trim() || notification.message

  return (
    <button
      type="button"
      data-testid={`notification-item-${notification.id}`}
      onClick={() => {
        if (!notification.is_read) onClick?.()
      }}
      className={cn(
        'w-full rounded-xl border border-border border-l-4 bg-surface-container-lowest p-4 text-left shadow-card transition-opacity hover:bg-surface-container-low',
        style.borderClass,
        !isUnread && 'opacity-60',
        className,
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            style.iconBg,
          )}
        >
          <MaterialIcon name={style.icon} size={20} fill={isUnread} className={style.iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-sm font-semibold text-on-surface">{title}</p>
          {notification.message.length > title.length && (
            <p className="mt-1 line-clamp-2 text-body-sm text-muted">{notification.message}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {notification.created_at && (
              <span className="text-caption-xs text-muted">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            )}
            {isUnread && (
              <span className="rounded-full bg-status-your-turn/10 px-2 py-0.5 text-caption-xs font-medium text-status-your-turn">
                Unread
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

interface NotificationFeedGroupProps {
  title: string
  children: React.ReactNode
}

export function NotificationFeedGroup({ title, children }: NotificationFeedGroupProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-label-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function groupNotificationsByTime(notifications: NotificationItem[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const groups: { title: string; items: NotificationItem[] }[] = [
    { title: 'Today', items: [] },
    { title: 'Yesterday', items: [] },
    { title: 'Earlier this week', items: [] },
    { title: 'Older', items: [] },
  ]

  for (const n of notifications) {
    const d = n.created_at ? new Date(n.created_at) : now
    if (d >= today) groups[0].items.push(n)
    else if (d >= yesterday) groups[1].items.push(n)
    else if (d >= weekAgo) groups[2].items.push(n)
    else groups[3].items.push(n)
  }

  return groups.filter((g) => g.items.length > 0)
}
