import apiClient from '@/lib/axios'

export interface NotificationItem {
  id: number
  message: string
  created_at: string
  is_read: boolean
}

export type NotificationsListResponse = NotificationItem[]

export async function listNotifications(): Promise<NotificationsListResponse> {
  const response = await apiClient.get('/notifications/')
  const data = response.data?.data ?? response.data
  return data as NotificationsListResponse
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read/`)
}



