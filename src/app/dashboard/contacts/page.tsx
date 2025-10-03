
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddContact, useContacts, useDeleteContact, useSearchContact } from '@/hooks/useContacts'
import { Button as UIButton } from '@/components/ui/button'

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts()
  const { mutateAsync: addAsync, isPending } = useAddContact()
  const { mutateAsync: searchAsync } = useSearchContact()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteContact()

  const [email, setEmail] = useState('')
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  const requested = useRef<Set<string>>(new Set())
  

  const onAdd = async () => {
    if (!email.trim()) return
    let derivedName: string | undefined = undefined
    try {
      const res = await searchAsync(email.trim())
      if (res?.found && res?.user?.full_name) {
        derivedName = res.user.full_name
      }
    } catch {
      // ignore search errors, proceed to add with email only
    }
    await addAsync({ email: email.trim(), name: derivedName })
    setEmail('')
  }

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
          if (res?.found && res && (res as any).user && (res as any).user.full_name) {
            const fullName = (res as any).user.full_name as string
            setResolvedNames((prev) => ({ ...prev, [key]: fullName }))
          }
        } catch {
          // ignore failures
        }
      }
    })()
  }, [contacts, resolvedNames, searchAsync])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="text-gray-600 mt-1">Manage your saved recipients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-gray-500">We’ll auto-fill the name if the email is registered.</p>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button className="w-full" onClick={onAdd} disabled={isPending}>Add Contact</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : !contacts || contacts.length === 0 ? (
            <p className="text-sm text-gray-600">You don’t have any saved contacts yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              <div className="grid grid-cols-3 text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50">
                <span>Name</span>
                <span>Email</span>
                  <span className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="sr-only">Actions</span>
                  </span>
              </div>
              {contacts.map((c) => (
                <div key={c.id} className="grid grid-cols-3 px-4 py-3 text-sm items-center">
                  <span>{resolvedNames[c.email.toLowerCase()] || c.name || '-'}</span>
                  <span>{c.email}</span>
                  <span className="capitalize flex items-center justify-between">
                    {c.status}
                    <UIButton
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAsync(c.id)}
                      disabled={deleting}
                    >
                      Delete
                    </UIButton>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


