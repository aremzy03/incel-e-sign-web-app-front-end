'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  PageHeader,
  SegmentedControl,
  EmptyState,
  NotificationFeedItem,
  NotificationFeedGroup,
  groupNotificationsByTime,
} from '@/components/library'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/lib/api/notifications'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { isReady } = useAuthReady()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data, isLoading, error } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: isReady,
    staleTime: 30_000,
    retry: shouldRetryAuthQuery,
  })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to mark as read'),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: () => toast.error('Failed to mark all as read'),
  })

  const notifications = Array.isArray(data) ? data : []
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  )

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter],
  )

  const groups = groupNotificationsByTime(filtered)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with your document activities"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <MaterialIcon name="check_circle" size={18} className="mr-2" />
              Mark All as Read
            </Button>
          ) : undefined
        }
      />

      <SegmentedControl
        options={[
          { value: 'all' as const, label: 'All' },
          { value: 'unread' as const, label: `Unread (${unreadCount})` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted">Loading notifications…</div>
      ) : error ? (
        <EmptyState icon="error" title="Failed to load notifications" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="notifications"
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Activity on your documents and envelopes will appear here."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <NotificationFeedGroup key={group.title} title={group.title}>
              {group.items.map((n) => (
                <NotificationFeedItem
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    if (!n.is_read) markOne.mutate(n.id)
                  }}
                />
              ))}
            </NotificationFeedGroup>
          ))}
          <p className="text-center text-caption-xs text-muted">You&apos;ve reached the end</p>
        </div>
      )}
    </div>
  )
}
