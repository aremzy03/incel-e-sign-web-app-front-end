'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, Mail, Settings, Eye, BarChart3 } from 'lucide-react'
import { IncelLogo } from '@/components/ui/incel-logo'
import Link from 'next/link'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLogItem } from '@/lib/api/audit'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AdminDashboard() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch audit logs to compute real metrics
  const { data: auditData, isLoading: logsLoading, isError } = useQuery({
    queryKey: ['audit', 'logs', 'admin-metrics'],
    queryFn: () => listAuditLogs({ page: 1, page_size: 500 }),
    staleTime: 60_000,
  })

  const auditLogs: AuditLogItem[] = auditData?.results ?? []

  // Derive metrics from audit logs
  const derived = (() => {
    if (!auditLogs.length) {
      return {
        totalUsers: 0,
        totalDocuments: 0,
        envelopes: { draft: 0, sent: 0, completed: 0, rejected: 0 },
        envelopeStatusData: [
          { name: 'Draft', value: 0 },
          { name: 'Sent', value: 0 },
          { name: 'Completed', value: 0 },
          { name: 'Rejected', value: 0 },
        ],
        documentsPerMonth: [] as { month: string; documents: number }[],
      }
    }

    const uniqueActorIds = new Set<string>()
    const documentsCreatedTimestamps: string[] = []
    let sent = 0
    let rejected = 0
    let completed = 0

    for (const log of auditLogs) {
      const actorId = typeof log.actor === 'string' ? log.actor : (log.actor?.id || log.actor?.email || '')
      if (actorId) uniqueActorIds.add(actorId)

      const action = (log.action || '').toUpperCase()
      if (action === 'SEND_ENVELOPE') sent += 1
      if (action === 'REJECT_ENVELOPE') rejected += 1
      if (action === 'SIGN_DOC' || action === 'COMPLETE_ENVELOPE') completed += 1
      if (action === 'CREATE_DOC' || (log.target || '').toUpperCase().startsWith('DOC')) {
        documentsCreatedTimestamps.push(log.created_at)
      }
    }

    // Attempt to infer draft as sent - completed - rejected (bounded at 0)
    const draft = Math.max(sent - completed - rejected, 0)

    // Build monthly documents series
    const monthKeyToCount = new Map<string, number>()
    for (const ts of documentsCreatedTimestamps) {
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthKeyToCount.set(key, (monthKeyToCount.get(key) || 0) + 1)
    }
    const sortedKeys = Array.from(monthKeyToCount.keys()).sort()
    const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' })
    const documentsPerMonth = sortedKeys.map((key) => {
      const [y, m] = key.split('-').map((v) => parseInt(v, 10))
      const monthLabel = monthFormatter.format(new Date(y, m - 1, 1))
      return { month: monthLabel, documents: monthKeyToCount.get(key) || 0 }
    })

    return {
      totalUsers: uniqueActorIds.size,
      totalDocuments: documentsCreatedTimestamps.length,
      envelopes: { draft, sent, completed, rejected },
      envelopeStatusData: [
        { name: 'Draft', value: draft },
        { name: 'Sent', value: sent },
        { name: 'Completed', value: completed },
        { name: 'Rejected', value: rejected },
      ],
      documentsPerMonth,
    }
  })()

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
              <p className="text-muted">Checking access permissions...</p>
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
              <h3 className="text-lg font-medium text-on-surface mb-2">Access Denied</h3>
              <p className="text-muted mb-4">
                You don&apos;t have permission to view admin dashboard. Admin access required.
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface mb-2 flex items-center gap-2">
              <IncelLogo className="h-8 w-8 text-secondary" />
              Admin Dashboard
            </h1>
            <p className="text-muted text-lg">
              System overview and administration tools.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-red-600">Admin Access</span>
          </div>
        </div>
      </div>

      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsLoading ? '—' : derived.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsLoading ? '—' : derived.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded documents
            </p>
          </CardContent>
        </Card>

        {/* Envelopes - Draft */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Envelopes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{logsLoading ? '—' : derived.envelopes.draft}</div>
            <p className="text-xs text-muted-foreground">
              In draft status
            </p>
          </CardContent>
        </Card>

        {/* Envelopes - Sent */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Envelopes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logsLoading ? '—' : derived.envelopes.sent}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting signatures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Envelope Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Completed Envelopes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{logsLoading ? '—' : derived.envelopes.completed}</div>
            <p className="text-sm text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Rejected Envelopes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{logsLoading ? '—' : derived.envelopes.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected or failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envelope Status Pie Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Envelope Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of envelope statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={derived.envelopeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {derived.envelopeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Documents Per Month Bar Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Documents Uploaded Per Month
            </CardTitle>
            <CardDescription>
              Monthly document upload trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={derived.documentsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="documents" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Section */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Manage Users */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Manage Users
              </CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* View Logs */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                View Logs
              </CardTitle>
              <CardDescription>
                Access system audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/logs">
                  <Eye className="h-4 w-4 mr-2" />
                  View Logs
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
