'use client'

import { useEffect, useMemo, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useUserSearch } from '@/hooks/useUsers'
import { User } from '@/lib/api/users'

type Props = {
  onSelect: (recipient: { id?: string; email: string; name?: string; status: 'registered' }) => void
}

export function RecipientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const { mutate: search, isPending: isSearching } = useUserSearch()

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmedQuery = query.trim()
      if (trimmedQuery.length >= 2) {
        search(trimmedQuery, {
          onSuccess: (users: User[]) => {
            setSearchResults(users)
          },
          onError: () => {
            setSearchResults([])
          }
        })
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [query, search])

  const items = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return []
    
    return searchResults.map((user) => ({
      key: user.id,
      label: `${user.full_name} (${user.email})`,
      action: () => {
        onSelect({ 
          id: user.id, 
          email: user.email, 
          name: user.full_name, 
          status: 'registered' 
        })
        setQuery('')
        setSearchResults([])
      },
    }))
  }, [query, searchResults, onSelect])

  return (
    <Command className="rounded-md border">
      <CommandInput 
        placeholder="Search users by name or email..." 
        value={query} 
        onValueChange={setQuery} 
      />
      <CommandList>
        {query.trim().length < 2 ? (
          <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
        ) : isSearching ? (
          <CommandEmpty>Searching...</CommandEmpty>
        ) : items.length === 0 ? (
          <CommandEmpty>No users found</CommandEmpty>
        ) : (
          <CommandGroup heading="Users">
            {items.map((it) => (
              <CommandItem key={it.key} onSelect={it.action}>
                {it.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}


