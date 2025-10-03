import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addContact, deleteContact, getContacts, inviteContact, searchContact } from '@/lib/api/contacts'
import { toast } from 'react-hot-toast'

export const useContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    staleTime: 5 * 60 * 1000,
  })
}

export const useAddContact = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addContact,
    onSuccess: () => {
      toast.success('Contact added')
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: () => toast.error('Failed to add contact'),
  })
}

export const useSearchContact = () => {
  return useMutation({
    mutationFn: (email: string) => searchContact(email),
  })
}

export const useInviteContact = () => {
  return useMutation({
    mutationFn: inviteContact,
    onSuccess: (_res, vars) => {
      toast.success(`Invite sent to ${vars.email}`)
    },
    onError: () => toast.error('Failed to send invite'),
  })
}

export const useDeleteContact = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted')
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: () => toast.error('Failed to delete contact'),
  })
}


