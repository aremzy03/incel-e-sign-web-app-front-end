'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Bell, User, Clock, CheckCircle, Circle, CheckCheck } from 'lucide-react'
import { IncelLogo } from '@/components/ui/incel-logo'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  timestamp: string
  user: string
  message: string
  status: 'read' | 'unread'
}

const dummyNotifications: Notification[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    user: 'alice@example.com',
    message: 'Document "Contract Agreement.pdf" has been signed successfully',
    status: 'unread'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:10',
    user: 'bob@example.com',
    message: 'Envelope "Q3 Report" has been sent to 3 recipients',
    status: 'read'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:45',
    user: 'charlie@example.com',
    message: 'Signature request for "NDA Template.pdf" has been declined',
    status: 'unread'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:15:30',
    user: 'diana@example.com',
    message: 'Envelope "Employee Handbook" has been rejected by recipient',
    status: 'read'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:10:15',
    user: 'eve@example.com',
    message: 'New document "Invoice #1234.pdf" has been uploaded',
    status: 'unread'
  },
  {
    id: '6',
    timestamp: '2024-01-15 14:05:00',
    user: 'frank@example.com',
    message: 'User profile has been updated successfully',
    status: 'read'
  },
  {
    id: '7',
    timestamp: '2024-01-15 14:00:30',
    user: 'grace@example.com',
    message: 'Document "Legal Agreement.pdf" has been deleted',
    status: 'unread'
  },
  {
    id: '8',
    timestamp: '2024-01-15 13:55:20',
    user: 'henry@example.com',
    message: 'Envelope "Marketing Proposal" has been completed by all signers',
    status: 'read'
  },
  {
    id: '9',
    timestamp: '2024-01-15 13:50:10',
    user: 'alice@example.com',
    message: 'Reminder: Document "Service Agreement.pdf" is pending your signature',
    status: 'unread'
  },
  {
    id: '10',
    timestamp: '2024-01-15 13:45:05',
    user: 'bob@example.com',
    message: 'System maintenance scheduled for tonight at 2:00 AM',
    status: 'read'
  },
  {
    id: '11',
    timestamp: '2024-01-15 13:40:00',
    user: 'charlie@example.com',
    message: 'New user registration: john@company.com',
    status: 'unread'
  },
  {
    id: '12',
    timestamp: '2024-01-15 13:35:45',
    user: 'diana@example.com',
    message: 'Document "Privacy Policy.pdf" has been viewed 5 times',
    status: 'read'
  },
  {
    id: '13',
    timestamp: '2024-01-15 13:30:30',
    user: 'eve@example.com',
    message: 'Envelope "Confidential Report" has been opened by recipient',
    status: 'unread'
  },
  {
    id: '14',
    timestamp: '2024-01-15 13:25:15',
    user: 'frank@example.com',
    message: 'Digital signature certificate has been renewed',
    status: 'read'
  },
  {
    id: '15',
    timestamp: '2024-01-15 13:20:00',
    user: 'grace@example.com',
    message: 'Failed login attempt detected from unknown IP address',
    status: 'unread'
  }
]

const statusFilters = [
  { value: 'ALL', label: 'All Notifications' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' }
]

export default function NotificationsCenter() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    // Simulate admin check - in real implementation, this would check user role from session
    const checkAdminAccess = () => {
      // For demo purposes, simulate admin access
      // In production, this would check the user's role from the session
      setIsAdmin(true)
      setIsLoading(false)
    }

    checkAdminAccess()
  }, [])

  // Filter notifications based on search term and status filter
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || notification.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const toggleNotificationStatus = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, status: notification.status === 'read' ? 'unread' : 'read' }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        status: 'read' as const
      }))
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge 
        variant={status === 'unread' ? 'default' : 'secondary'}
        className={status === 'unread' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
      >
        {status === 'unread' ? 'Unread' : 'Read'}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Checking access permissions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <IncelLogo className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">
                You don&apos;t have permission to view notifications center. Admin access required.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Return to Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications Center
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and monitor all system notifications.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-red-600">Admin Access</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
                <CardDescription>
                  Search notifications by user or message
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {unreadCount} unread notifications
                </div>
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark All as Read
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {statusFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        notification.status === 'unread' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-gray-200'
                      }`}
                      onClick={() => toggleNotificationStatus(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {notification.status === 'unread' ? (
                                <Circle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {notification.user}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">
                            {notification.message}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(notification.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No notifications are available at this time.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
