import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NotificationsPage from '@/app/dashboard/notifications/page'
import AuditPage from '@/app/dashboard/audit/page'
import axios from 'axios'

// axios.create mock instance from setupTests
const mockApi = (axios.create as unknown as jest.Mock).mock.results[0].value

function wrapper(children: React.ReactNode) {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Notifications + Audit integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Notifications render and mark as read', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [
      { id: 1, message: 'New doc uploaded', created_at: new Date().toISOString(), is_read: false },
      { id: 2, message: 'Envelope sent', created_at: new Date().toISOString(), is_read: false },
    ] })

    render(wrapper(<NotificationsPage />))

    expect(await screen.findByText('New doc uploaded')).toBeInTheDocument()

    mockApi.post.mockResolvedValueOnce({ data: {} })
    const markButtons = screen.getAllByRole('button', { name: /mark as read/i })
    await userEvent.click(markButtons[0])

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/1/read/')
    })
  })

  test('Audit logs render, filter, and paginate', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { count: 12, next: null, previous: null, results: Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      created_at: new Date().toISOString(),
      actor: { id: 'u', email: 'a@b.com' },
      action: 'SEND_ENVELOPE',
      target: 'env-1',
      message: `msg ${i+1}`,
    })) } })

    render(wrapper(<AuditPage />))

    expect(await screen.findByText(/Audit Logs/)).toBeInTheDocument()
    expect(await screen.findByText(/12 total entries/)).toBeInTheDocument()

    const actionSelect = screen.getByText(/Action type/i)
    await userEvent.click(actionSelect)
    const option = await screen.findByText('SEND_ENVELOPE')
    await userEvent.click(option)

    // After selecting, a new GET is issued with action param
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
      const last = mockApi.get.mock.calls.at(-1)
      expect(last?.[0]).toBe('/audit/logs/')
      expect(last?.[1]?.params?.action).toBe('SEND_ENVELOPE')
    })

    const nextBtn = screen.getByRole('button', { name: /next/i })
    await userEvent.click(nextBtn)

    await waitFor(() => {
      const last = mockApi.get.mock.calls.at(-1)
      expect(last?.[1]?.params?.page).toBe(2)
    })
  })
})
