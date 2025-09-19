'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, PenTool, XCircle, CheckCircle } from 'lucide-react'

// Dummy data for notifications
const dummyNotifications = [
  {
    id: 1,
    type: 'envelope_sent',
    title: 'Envelope Contract NDA was sent',
    message: 'Your envelope "Contract NDA" has been sent to 2 recipients for signing.',
    timestamp: '2025-09-16 14:32',
    isRead: false
  },
  {
    id: 2,
    type: 'signature_completed',
    title: 'Signer John Doe completed signing',
    message: 'John Doe has successfully signed the document "Sales Agreement".',
    timestamp: '2025-09-15 18:21',
    isRead: false
  },
  {
    id: 3,
    type: 'envelope_sent',
    title: 'Envelope Invoice #1234 was sent',
    message: 'Your envelope "Invoice #1234" has been sent to 1 recipient for signing.',
    timestamp: '2025-09-15 10:15',
    isRead: true
  },
  {
    id: 4,
    type: 'signature_completed',
    title: 'Signer Sarah Wilson completed signing',
    message: 'Sarah Wilson has successfully signed the document "NDA Agreement".',
    timestamp: '2025-09-14 16:45',
    isRead: true
  },
  {
    id: 5,
    type: 'envelope_rejected',
    title: 'Envelope was declined',
    message: 'The envelope "Contract Proposal" was declined by the recipient.',
    timestamp: '2025-09-14 09:30',
    isRead: false
  }
]

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

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'envelope_sent':
      return 'text-blue-600'
    case 'signature_completed':
      return 'text-green-600'
    case 'envelope_rejected':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(dummyNotifications)

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with your document activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            {notifications.length} total notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.timestamp}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs"
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
              <p className="text-gray-600">
                You&apos;re all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
