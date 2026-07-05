'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, SearchField, AuditTable } from '@/components/library'
import { ListPaginationControls } from '@/components/list-pagination-controls'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLogsResponse } from '@/lib/api/audit'

const ACTIONS = ['SIGN_DOC', 'SEND_ENVELOPE', 'DECLINE_SIGN', 'UPLOAD_DOCUMENT']

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['audit', { page, pageSize, action, search }],
    queryFn: () => listAuditLogs({ page, page_size: pageSize, action, search }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  })

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Administrative view of system audit trails"
        badge={
          <span className="rounded-full bg-primary-light px-3 py-1 text-label-xs font-semibold uppercase text-primary">
            Admin
          </span>
        }
        actions={
          <Button variant="outline" disabled title="Coming soon">
            <MaterialIcon name="download" size={18} className="mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-surface-container-lowest p-4 shadow-card sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField
            placeholder="Search by actor or message…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            containerClassName="flex-1"
          />
          <Select
            value={action ?? 'ALL'}
            onValueChange={(v) => {
              setAction(v === 'ALL' ? undefined : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setAction(undefined)
              setPage(1)
            }}
          >
            Clear Filters
          </Button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-muted">Loading audit logs…</p>
        ) : (
          <>
            <AuditTable rows={results} />
            <ListPaginationControls
              page={page}
              totalPages={totalPages}
              hasPrevious={page > 1}
              hasNext={page < totalPages}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              totalCount={count}
            />
          </>
        )}
      </div>
    </div>
  )
}
