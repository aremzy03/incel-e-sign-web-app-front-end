'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLogItem } from '@/lib/api/audit'

const ACTIONS = ['SIGN_DOC', 'SEND_ENVELOPE', 'DECLINE_SIGN', 'UPLOAD_DOCUMENT']

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { page, pageSize, action, search }],
    queryFn: () => listAuditLogs({ page, page_size: pageSize, action, search }),
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Administrative view of system audit trails</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Filter by action type or search by actor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <Input placeholder="Search by actor name/email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            <Select value={action} onValueChange={(v) => { setAction(v === 'ALL' ? undefined : v); setPage(1) }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {ACTIONS.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>{isLoading ? 'Loading...' : `${count} total entries`}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No audit logs found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row: AuditLogItem) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {typeof row.actor === 'string' ? row.actor : (row.actor.full_name || row.actor.email)}
                      </TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{row.target}</TableCell>
                      <TableCell className="max-w-xl truncate" title={row.message}>{row.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
