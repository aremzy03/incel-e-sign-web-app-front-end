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
  const responseData = response.data
  
  // Handle various response structures
  if (Array.isArray(responseData)) {
    return responseData
  }
  
  if (responseData && typeof responseData === 'object') {
    // Check for nested data property
    if (Array.isArray(responseData.data)) {
      return responseData.data
    }
    // Check for results property (common in paginated responses)
    if (Array.isArray(responseData.results)) {
      return responseData.results
    }
  }
  
  return []
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read/`)
}

export async function markAllNotificationsRead(): Promise<void> {
  // Backend may expose either of these; try the canonical first
  await apiClient.patch('/notifications/read-all/')
}



