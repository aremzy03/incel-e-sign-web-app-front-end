'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Send, PenTool, XCircle } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  updated_at: string
}

interface DashboardClientLayoutProps {
  children: React.ReactNode
  navigation: NavigationItem[]
  user: User
}

// Dummy notifications data
const dummyNotifications = [
  {
    id: 1,
    type: 'envelope_sent',
    title: 'Envelope NDA sent',
    message: 'Your envelope "Contract NDA" has been sent to 2 recipients.',
    timestamp: '2025-09-16',
    isRead: false
  },
  {
    id: 2,
    type: 'signature_completed',
    title: 'John Doe signed doc',
    message: 'John Doe has successfully signed the document.',
    timestamp: '2025-09-15',
    isRead: false
  },
  {
    id: 3,
    type: 'envelope_rejected',
    title: 'Signer declined doc',
    message: 'The envelope was declined by the recipient.',
    timestamp: '2025-09-14',
    isRead: false
  }
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'envelope_sent':
      return <Send className="h-4 w-4 text-blue-600" />
    case 'signature_completed':
      return <PenTool className="h-4 w-4 text-green-600" />
    case 'envelope_rejected':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-600" />
  }
}

export function DashboardClientLayout({ children, navigation, user }: DashboardClientLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(dummyNotifications)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ))
  }

  const getUserInitials = () => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
  }

  const getFullName = () => {
    return `${user.first_name} ${user.last_name}`
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-white shadow-lg border-r transition-transform duration-300 ease-in-out",
        "md:translate-x-0 md:static md:z-auto",
        isMobileMenuOpen ? "translate-x-0 fixed inset-y-0 z-40" : "-translate-x-full fixed inset-y-0 z-40"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">I</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Incel eSign</h2>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center px-3 py-3 text-sm font-medium rounded-lg mb-1 transition-all duration-200',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getFullName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Top Bar - Desktop */}
        <header className="hidden md:block bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex items-start space-x-3 p-3 cursor-pointer"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-center py-4">
                      <p className="text-sm text-gray-500">No notifications</p>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/notifications" className="text-center">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{getFullName()}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm border-b px-4 py-3 mt-16">
          <h1 className="text-lg font-semibold text-gray-800">
            {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
