import apiClient from '@/lib/axios'

export interface AuditLogItem {
  id: number
  created_at: string
  actor: { id: string; email: string; full_name?: string } | string
  action: string
  target: string
  message: string
}

export interface AuditLogsResponse {
  count: number
  next: string | null
  previous: string | null
  results: AuditLogItem[]
}

export async function listAuditLogs(params: { page?: number; page_size?: number; action?: string; search?: string } = {}): Promise<AuditLogsResponse> {
  const response = await apiClient.get('/audit/logs/', { params })
  const data = response.data?.data ?? response.data
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data }
  }
  return data as AuditLogsResponse
}



