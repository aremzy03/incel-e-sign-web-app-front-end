'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/api/notifications'
import { getNotificationStyle, getNotificationVariant } from './notification-utils'

interface NotificationDropdownProps {
  notifications: NotificationItem[]
  unreadCount: number
}

export function NotificationDropdown({ notifications, unreadCount }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

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

  const displayed = notifications.slice(0, 8)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <MaterialIcon name="notifications" size={22} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              'absolute right-0 z-50 mt-2 w-[420px] max-w-[calc(100vw-2rem)] origin-top-right',
              'rounded-xl border border-border bg-surface-container-lowest shadow-modal',
              'transition-all duration-200'
            )}
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-headline-lg font-semibold text-on-surface">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-semibold text-on-secondary-container">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="custom-scrollbar max-h-[520px] overflow-y-auto">
              {displayed.length > 0 ? (
                displayed.map((notification) => {
                  const variant = getNotificationVariant(notification.message)
                  const style = getNotificationStyle(variant)
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (!notification.is_read) markOne.mutate(notification.id)
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border/50 px-5 py-4 text-left transition-colors hover:bg-surface-container-low',
                        style.rowClass
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          style.iconBg
                        )}
                      >
                        <MaterialIcon
                          name={style.icon}
                          fill={style.iconFill}
                          size={20}
                          className="text-on-surface"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-on-surface line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-info" />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="px-5 py-12 text-center text-sm text-muted">No notifications</div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={unreadCount === 0 || markAll.isPending}
                className="text-sm font-medium text-status-your-turn hover:text-accent-hover disabled:opacity-50"
              >
                Mark all as read
              </button>
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-accent-hover"
              >
                View all
                <MaterialIcon name="arrow_forward" size={16} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
