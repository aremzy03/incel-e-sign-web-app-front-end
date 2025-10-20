import apiClient from '@/lib/axios'

export type ContactStatus = 'registered' | 'invited'

export interface Contact {
  id: string
  email: string
  name?: string
  status: ContactStatus
  // Backend now returns contact_user_id; we normalize to user_id for app use
  user_id?: string
  contact_user_id?: string
}

export interface ContactsListResponse {
  results: Contact[]
}

export const getContacts = async (): Promise<Contact[]> => {
  const res = await apiClient.get('/contacts/')
  const payload = res.data?.data ?? res.data

  const normalize = (arr: any[]): Contact[] =>
    (arr || []).map((c: any) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      status: (c.status as ContactStatus) ?? (c.contact_user_id ? 'registered' : 'invited'),
      // Preserve both fields but ensure user_id is populated for consumers
      user_id: c.user_id ?? c.contact_user_id ?? undefined,
      contact_user_id: c.contact_user_id ?? c.user_id ?? undefined,
    }))

  if (Array.isArray(payload)) return normalize(payload)
  if (Array.isArray(payload?.results)) return normalize(payload.results)
  return []
}

export const addContact = async (data: { email: string; name?: string }): Promise<Contact> => {
  const res = await apiClient.post('/contacts/add/', data)
  return (res.data?.data ?? res.data) as Contact
}

export interface ContactSearchResult {
  found: boolean
  user?: { id: string; email: string; full_name?: string }
}

export const searchContact = async (email: string): Promise<ContactSearchResult> => {
  const res = await apiClient.post('/contacts/search/', { email })
  const payload = res.data?.data ?? res.data
  return payload as ContactSearchResult
}

export const inviteContact = async (data: { email: string; name?: string }): Promise<{ success: boolean }> => {
  const res = await apiClient.post('/contacts/invite/', data)
  const payload = res.data?.data ?? res.data
  return (payload ?? { success: true }) as { success: boolean }
}

export const deleteContact = async (id: string): Promise<void> => {
  await apiClient.delete(`/contacts/${id}/delete/`)
}


