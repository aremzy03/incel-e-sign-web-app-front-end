'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, Filter, FileText, User, Clock, AlertCircle } from 'lucide-react'
import { IncelLogo } from '@/components/ui/incel-logo'
import { motion, AnimatePresence } from 'framer-motion'

interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  message: string
}

const dummyAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    actor: 'admin@example.com',
    action: 'SIGN_DOC',
    target: 'DOC-001',
    message: 'Document signed successfully'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:10',
    actor: 'user@example.com',
    action: 'SEND_ENVELOPE',
    target: 'ENV-002',
    message: 'Envelope sent to recipient'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:45',
    actor: 'admin@example.com',
    action: 'DECLINE_SIGN',
    target: 'DOC-003',
    message: 'Signature declined by user'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:15:30',
    actor: 'user@example.com',
    action: 'REJECT_ENVELOPE',
    target: 'ENV-004',
    message: 'Envelope rejected by recipient'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:10:15',
    actor: 'admin@example.com',
    action: 'CREATE_DOC',
    target: 'DOC-005',
    message: 'New document created'
  },
  {
    id: '6',
    timestamp: '2024-01-15 14:05:00',
    actor: 'user@example.com',
    action: 'UPDATE_PROFILE',
    target: 'USER-001',
    message: 'User profile updated'
  },
  {
    id: '7',
    timestamp: '2024-01-15 14:00:30',
    actor: 'admin@example.com',
    action: 'DELETE_DOC',
    target: 'DOC-006',
    message: 'Document deleted by admin'
  },
  {
    id: '8',
    timestamp: '2024-01-15 13:55:20',
    actor: 'user@example.com',
    action: 'SIGN_DOC',
    target: 'DOC-007',
    message: 'Document signed and completed'
  },
  {
    id: '9',
    timestamp: '2024-01-15 13:50:10',
    actor: 'admin@example.com',
    action: 'SEND_ENVELOPE',
    target: 'ENV-008',
    message: 'Envelope sent to multiple recipients'
  },
  {
    id: '10',
    timestamp: '2024-01-15 13:45:05',
    actor: 'user@example.com',
    action: 'LOGIN',
    target: 'SYSTEM',
    message: 'User logged in successfully'
  }
]

const actionTypes = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'SIGN_DOC', label: 'Sign Document' },
  { value: 'SEND_ENVELOPE', label: 'Send Envelope' },
  { value: 'DECLINE_SIGN', label: 'Decline Signature' },
  { value: 'REJECT_ENVELOPE', label: 'Reject Envelope' },
  { value: 'CREATE_DOC', label: 'Create Document' },
  { value: 'UPDATE_PROFILE', label: 'Update Profile' },
  { value: 'DELETE_DOC', label: 'Delete Document' },
  { value: 'LOGIN', label: 'Login' }
]

const ITEMS_PER_PAGE = 5

export default function AuditLogViewer() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [auditLogs] = useState<AuditLogEntry[]>(dummyAuditLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

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

  // Filter audit logs based on search term and action filter
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction
    
    return matchesSearch && matchesAction
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'SIGN_DOC':
        return 'default'
      case 'SEND_ENVELOPE':
        return 'secondary'
      case 'DECLINE_SIGN':
        return 'destructive'
      case 'REJECT_ENVELOPE':
        return 'destructive'
      case 'CREATE_DOC':
        return 'outline'
      case 'UPDATE_PROFILE':
        return 'outline'
      case 'DELETE_DOC':
        return 'destructive'
      case 'LOGIN':
        return 'secondary'
      default:
        return 'outline'
    }
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
                You don&apos;t have permission to view audit logs. Admin access required.
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
              <FileText className="h-8 w-8 text-blue-600" />
              Audit Logs
            </h1>
            <p className="text-gray-600 text-lg">
              View and search system audit logs and activity trails.
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
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>
              Search audit logs by actor, action, or message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by actor, action, or message..."
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
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {actionTypes.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audit Logs Table */}
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
                  <FileText className="h-5 w-5" />
                  Audit Log Entries
                </CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of {auditLogs.length} entries
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedLogs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Timestamp</TableHead>
                      <TableHead className="w-[180px]">Actor</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="w-[100px]">Target</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {paginatedLogs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{log.actor}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.target}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.message}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedAction !== 'ALL' 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No audit logs are available at this time.'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1)
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1)
                          }
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
