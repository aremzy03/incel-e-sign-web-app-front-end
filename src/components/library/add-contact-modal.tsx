'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { AuthorityModal } from '@/components/ui/authority-modal'
import { SearchField } from './search-field'
import { useSearchContact } from '@/hooks/useContacts'

interface AddContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (email: string, name?: string) => Promise<void>
  isAdding?: boolean
}

export function AddContactModal({ open, onOpenChange, onAdd, isAdding }: AddContactModalProps) {
  const [email, setEmail] = useState('')
  const [searchResult, setSearchResult] = useState<{
    found: boolean
    name?: string
    email?: string
  } | null>(null)
  const { mutateAsync: searchAsync, isPending: isSearching } = useSearchContact()

  const handleSearch = async () => {
    if (!email.trim()) return
    try {
      const res = await searchAsync(email.trim())
      if (res?.found && (res as { user?: { full_name?: string; email?: string } }).user) {
        const user = (res as { user: { full_name?: string; email?: string } }).user
        setSearchResult({ found: true, name: user.full_name, email: user.email ?? email })
      } else {
        setSearchResult({ found: false, email: email.trim() })
      }
    } catch {
      setSearchResult({ found: false, email: email.trim() })
    }
  }

  const handleAdd = async () => {
    const targetEmail = searchResult?.email ?? email.trim()
    const targetName = searchResult?.name
    if (!targetEmail) return
    await onAdd(targetEmail, targetName)
    setEmail('')
    setSearchResult(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    setEmail('')
    setSearchResult(null)
    onOpenChange(false)
  }

  return (
    <AuthorityModal open={open} onOpenChange={handleClose} title="Add Contact" size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <SearchField
            placeholder="Search by email…"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setSearchResult(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            containerClassName="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
            Search
          </Button>
        </div>

        {searchResult?.found && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-container-low p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
              <MaterialIcon name="check_circle" size={22} className="text-status-completed" fill />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-on-surface">{searchResult.name}</p>
              <p className="text-body-sm text-muted">{searchResult.email}</p>
            </div>
          </div>
        )}

        {searchResult && !searchResult.found && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
            <MaterialIcon name="person_off" size={32} className="text-muted" />
            <p className="text-body-sm text-muted">User not found on Incel E-Sign</p>
            <p className="text-caption-xs text-muted">You can still save {searchResult.email} as a contact</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!email.trim() && !searchResult?.email}
            className={cn(isAdding && 'opacity-70')}
          >
            {isAdding ? 'Adding…' : 'Add to Contacts'}
          </Button>
        </div>
      </div>
    </AuthorityModal>
  )
}
