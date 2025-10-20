
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAddContact, useContacts, useDeleteContact, useSearchContact } from '@/hooks/useContacts'
import { Button as UIButton } from '@/components/ui/button'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts()
  const { mutateAsync: addAsync, isPending } = useAddContact()
  const { mutateAsync: searchAsync } = useSearchContact()
  const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteContact()

  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  const [resolvedUserIds, setResolvedUserIds] = useState<Record<string, string>>({})
  const requested = useRef<Set<string>>(new Set())
  
  // Real-time search will handle adding contacts directly on select

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
          if (res?.found && res && (res as any).user) {
            const user = (res as any).user
            if (user.full_name) {
              setResolvedNames((prev) => ({ ...prev, [key]: user.full_name }))
            }
            if (user.id) {
              setResolvedUserIds((prev) => ({ ...prev, [key]: user.id }))
            }
          }
        } catch (error) {
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
          <div className="space-y-2">
            <Label>Search users by name or email</Label>
            <RecipientSearch
              onSelect={async (r) => {
                try {
                  await addAsync({ email: r.email, name: r.name })
                } catch {
                  // handled by hook toasts
                }
              }}
            />
            {isPending && (
              <p className="text-xs text-gray-500">Adding contact...</p>
            )}
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
              {contacts.map((c) => {
                const userId = c.user_id || resolvedUserIds[c.email.toLowerCase()]
                const contactName = resolvedNames[c.email.toLowerCase()] || c.name || '-'
                const isClickable = userId && c.status === 'registered'
                
                return (
                  <div key={c.id} className={"grid grid-cols-3 px-4 py-3 text-sm items-center"}>
                    <div>
                      {isClickable ? (
                        <Link 
                          href={`/dashboard/users/${userId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {contactName}
                        </Link>
                      ) : (
                        <span>{contactName}</span>
                      )}
                    </div>
                    <div>
                      {isClickable ? (
                        <Link 
                          href={`/dashboard/users/${userId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {c.email}
                        </Link>
                      ) : (
                        <span>{c.email}</span>
                      )}
                    </div>
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


