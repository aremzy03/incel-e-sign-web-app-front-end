import apiClient from '@/lib/axios'

/** Matches the backend's MIN_QUERY_LENGTH (core/search.py). */
export const SEARCH_MIN_LENGTH = 2

export interface EnvelopeSearchHit {
  id: string
  name: string | null
  status: string
  is_self_sign: boolean
  role: 'creator' | 'signer'
  document_names: string[]
  matched_on: 'name' | 'description' | 'document' | 'creator' | 'signer'
  updated_at: string
}

export interface DocumentSearchHit {
  id: string
  file_name: string
  status: string
  updated_at: string
}

export interface GlobalSearchResult {
  query: string
  envelopes: EnvelopeSearchHit[]
  documents: DocumentSearchHit[]
  totals: { envelopes: number; documents: number }
}

/** GET /search/?q= — envelopes and documents the signed-in user can open. */
export async function globalSearch(
  query: string,
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<GlobalSearchResult> {
  const response = await apiClient.get('/search/', {
    params: { q: query, limit: options.limit ?? 5 },
    signal: options.signal,
  })
  const payload = response.data as { data?: GlobalSearchResult } & Partial<GlobalSearchResult>
  return (payload.data ?? payload) as GlobalSearchResult
}
