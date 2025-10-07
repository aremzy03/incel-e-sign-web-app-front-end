'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, PenTool, XCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { listNotifications, markNotificationRead, type NotificationItem } from '@/lib/api/notifications'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'envelope_sent':
      return <Send className="h-5 w-5 text-blue-600" />
    case 'signature_completed':
      return <PenTool className="h-5 w-5 text-green-600" />
    case 'envelope_rejected':
      return <XCircle className="h-5 w-5 text-red-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    staleTime: 30_000,
  })

  const markOne = useMutation({
    mutationFn: async (id: number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to mark as read'),
  })

  const notifications = data ?? []
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  const markAllLocal = () => {
    const current = queryClient.getQueryData<NotificationItem[]>(['notifications']) || []
    const updated = current.map(n => ({ ...n, is_read: true }))
    queryClient.setQueryData(['notifications'], updated)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your document activities</p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">{unreadCount} unread</Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllLocal} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${notifications.length} total notifications`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                          {!notification.is_read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markOne.mutate(notification.id)}
                              className="text-xs"
                              disabled={markOne.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You&apos;re all caught up! New notifications will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
