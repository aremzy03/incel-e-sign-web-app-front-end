'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  PageHeader,
  SearchField,
  DataTable,
  StatusBadge,
  EmptyState,
  AddContactModal,
} from '@/components/library'
import type { DataTableColumn } from '@/components/library'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAddContact, useContacts, useDeleteContact, useSearchContact } from '@/hooks/useContacts'
import type { Contact } from '@/lib/api/contacts'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts()
  const { mutateAsync: addAsync, isPending: isAdding } = useAddContact()
  const { mutateAsync: searchAsync } = useSearchContact()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteContact()

  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  const [resolvedUserIds, setResolvedUserIds] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const requested = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!contacts || contacts.length === 0) return
    const missing = contacts.filter((c) => (!c.name || c.name.trim() === '') && c.status === 'registered')
    if (missing.length === 0) return
    ;(async () => {
      for (const c of missing) {
        const key = c.email.toLowerCase()
        if (requested.current.has(key) || resolvedNames[key]) continue
        requested.current.add(key)
        try {
          const res = await searchAsync(key)
          if (res?.found && (res as { user?: { full_name?: string; id?: string } }).user) {
            const user = (res as { user: { full_name?: string; id?: string } }).user
            if (user.full_name) {
              setResolvedNames((prev) => ({ ...prev, [key]: user.full_name! }))
            }
            if (user.id) {
              setResolvedUserIds((prev) => ({ ...prev, [key]: user.id! }))
            }
          }
        } catch {
          // ignore
        }
      }
    })()
  }, [contacts, resolvedNames, searchAsync])

  const filteredContacts = (contacts ?? []).filter((c) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    const name = resolvedNames[c.email.toLowerCase()] || c.name || ''
    return c.email.toLowerCase().includes(q) || name.toLowerCase().includes(q)
  })

  const columns: DataTableColumn<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => {
        const userId = c.user_id || resolvedUserIds[c.email.toLowerCase()]
        const contactName = resolvedNames[c.email.toLowerCase()] || c.name || '—'
        const isClickable = userId && c.status === 'registered'
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-xs text-on-primary">
                {getInitials(contactName !== '—' ? contactName : c.email)}
              </AvatarFallback>
            </Avatar>
            {isClickable ? (
              <Link
                href={`/dashboard/users/${userId}`}
                className="font-medium text-secondary hover:underline"
              >
                {contactName}
              </Link>
            ) : (
              <span className="font-medium text-on-surface">{contactName}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true,
      render: (c) => <span className="text-muted">{c.email}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <StatusBadge
          status={c.status === 'registered' ? 'On Incel E-Sign' : 'Invited'}
        />
      ),
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      hideOnMobile: true,
      render: () => <span className="text-muted">—</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader
        title="Contacts"
        subtitle="Manage your saved recipients"
        badge={
          contacts ? (
            <span className="rounded-full bg-surface-container-low px-3 py-1 text-label-sm font-medium text-muted">
              {contacts.length} Total Contacts
            </span>
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" disabled title="Coming soon">
              <MaterialIcon name="file_download" size={18} className="mr-2" />
              Export
            </Button>
            <Button onClick={() => setModalOpen(true)} className="bg-secondary hover:bg-accent-hover">
              <MaterialIcon name="person_add" size={18} className="mr-2" />
              Add Contact
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-surface-container-lowest p-4 shadow-card sm:p-6">
        <div className="mb-4">
          <SearchField
            placeholder="Search contacts…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-muted">Loading contacts…</div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            icon="group"
            title="No contacts yet"
            description="Add recipients to quickly use them in envelopes."
            action={
              <Button onClick={() => setModalOpen(true)}>Add Contact</Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredContacts}
            keyExtractor={(c) => c.id}
            rowActions={(c) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden text-secondary sm:inline-flex"
                  asChild
                >
                  <Link href="/dashboard/envelopes/create">Use in Envelope</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MaterialIcon name="more_vert" size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/envelopes/create">Use in Envelope</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-error"
                      onClick={() => deleteAsync(c.id)}
                      disabled={deleting}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          />
        )}
      </div>

      <AddContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isAdding={isAdding}
        onAdd={async (email, name) => {
          await addAsync({ email, name })
        }}
      />
    </div>
  )
}
