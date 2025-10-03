'use client'

import { useEffect, useMemo, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useInviteContact, useSearchContact } from '@/hooks/useContacts'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

type Props = {
  onSelect: (recipient: { id?: string; email: string; name?: string; status: 'registered' | 'invited' }) => void
}

export function RecipientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [pendingInviteEmail, setPendingInviteEmail] = useState<string | null>(null)
  const { mutate: search, data: result } = useSearchContact()
  const { mutateAsync: inviteAsync } = useInviteContact()

  useEffect(() => {
    const handler = setTimeout(() => {
      const email = query.trim()
      if (email && email.includes('@')) {
        search(email)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [query, search])

  const items = useMemo(() => {
    const email = query.trim()
    if (!email) return []
    if (result?.found && result?.user) {
      return [
        {
          key: 'registered',
          label: `Registered: ${result?.user?.full_name || ''} (${result?.user?.email})`,
          action: () => onSelect({ id: result?.user?.id, email: result?.user?.email as string, name: result?.user?.full_name, status: 'registered' }),
        },
      ]
    }
    return [
      {
        key: 'invite',
        label: `Invite ${email} to join`,
        action: () => setPendingInviteEmail(email),
      },
    ]
  }, [query, result, onSelect])

  const confirmInvite = async () => {
    if (!pendingInviteEmail) return
    await inviteAsync({ email: pendingInviteEmail })
    onSelect({ email: pendingInviteEmail, status: 'invited' })
    setPendingInviteEmail(null)
    setQuery('')
  }

  return (
    <>
      <Command className="rounded-md border">
        <CommandInput placeholder="Type an email..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Type an email to search or invite</CommandEmpty>
          <CommandGroup heading="Results">
            {items.map((it) => (
              <CommandItem key={it.key} onSelect={it.action}>
                {it.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      <AlertDialog open={!!pendingInviteEmail} onOpenChange={(o) => !o && setPendingInviteEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Do you want to invite {pendingInviteEmail}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInvite}>Invite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


