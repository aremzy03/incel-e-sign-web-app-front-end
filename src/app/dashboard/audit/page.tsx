'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, User } from 'lucide-react'

// Dummy audit log data
const dummyAuditLogs = [
  {
    id: 1,
    action: 'CREATE_ENV',
    actor: 'creator@test.com',
    timestamp: '2025-09-16 14:32:15',
    details: 'Created envelope "Contract NDA" with 2 recipients',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 2,
    action: 'SIGN_DOC',
    actor: 'signer1@test.com',
    timestamp: '2025-09-15 18:21:42',
    details: 'Signed document "Sales Agreement"',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  {
    id: 3,
    action: 'DECLINE_SIGN',
    actor: 'signer2@test.com',
    timestamp: '2025-09-14 16:45:33',
    details: 'Declined to sign document "NDA Agreement"',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    id: 4,
    action: 'REJECT_ENV',
    actor: 'admin@test.com',
    timestamp: '2025-09-13 09:30:18',
    details: 'Rejected envelope "Contract Proposal" due to policy violation',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 5,
    action: 'LOGIN',
    actor: 'user@test.com',
    timestamp: '2025-09-13 08:15:22',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 6,
    action: 'LOGOUT',
    actor: 'user@test.com',
    timestamp: '2025-09-12 17:45:10',
    details: 'User logged out',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
]

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE_ENV':
      return <Clock className="h-4 w-4 text-blue-600" />
    case 'SIGN_DOC':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'DECLINE_SIGN':
      return <XCircle className="h-4 w-4 text-yellow-600" />
    case 'REJECT_ENV':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'LOGIN':
      return <User className="h-4 w-4 text-blue-600" />
    case 'LOGOUT':
      return <User className="h-4 w-4 text-gray-600" />
    default:
      return <Shield className="h-4 w-4 text-gray-600" />
  }
}

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'CREATE_ENV':
      return 'default'
    case 'SIGN_DOC':
      return 'default'
    case 'DECLINE_SIGN':
      return 'secondary'
    case 'REJECT_ENV':
      return 'destructive'
    case 'LOGIN':
      return 'default'
    case 'LOGOUT':
      return 'outline'
    default:
      return 'outline'
  }
}

const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'CREATE_ENV':
      return 'bg-blue-100 text-blue-800'
    case 'SIGN_DOC':
      return 'bg-green-100 text-green-800'
    case 'DECLINE_SIGN':
      return 'bg-yellow-100 text-yellow-800'
    case 'REJECT_ENV':
      return 'bg-red-100 text-red-800'
    case 'LOGIN':
      return 'bg-blue-100 text-blue-800'
    case 'LOGOUT':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function AuditPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            System audit trails and activity logs (Admin Only)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-600">Admin Access</span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>
            Complete audit trail of all system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyAuditLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <Badge 
                          variant={getActionBadgeVariant(log.action)}
                          className={getActionBadgeColor(log.action)}
                        >
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.actor}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{dummyAuditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {dummyAuditLogs.filter(log => log.action === 'SIGN_DOC' || log.action === 'LOGIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-red-600">
                  {dummyAuditLogs.filter(log => log.action === 'DECLINE_SIGN' || log.action === 'REJECT_ENV').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(dummyAuditLogs.map(log => log.actor)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
