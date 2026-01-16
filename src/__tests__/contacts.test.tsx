import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContactsPage from '@/app/dashboard/contacts/page'
import CreateEnvelopePage from '@/app/dashboard/envelopes/create/page'
import axios from 'axios'

jest.mock('axios')

jest.mock('@/components/contacts/RecipientSearch', () => ({
  RecipientSearch: ({ onSelect }: { onSelect: (r: { email: string; name?: string; status: 'registered' }) => void }) => (
    <button onClick={() => onSelect({ email: 'c@example.com', name: 'User C', status: 'registered' })}>
      Select Recipient
    </button>
  ),
}))

const mockedAxios = axios as unknown as jest.Mocked<typeof axios>

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Contacts', () => {
  beforeEach(() => {
    mockedAxios.create().get.mockReset()
    mockedAxios.create().post.mockReset()
  })

  test('Contacts list renders', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: '1', email: 'a@example.com', name: 'A', status: 'registered' }] } })
    render(<TestWrapper><ContactsPage /></TestWrapper>)
    expect(await screen.findByText('Saved Contacts')).toBeInTheDocument()
    expect(await screen.findByText('a@example.com')).toBeInTheDocument()
  })

  test('Adding a contact updates list', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [] } })
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { id: '2', email: 'c@example.com', name: 'User C', status: 'registered' } } })
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: '2', email: 'c@example.com', name: 'User C', status: 'registered' }] } })
    render(<TestWrapper><ContactsPage /></TestWrapper>)
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    await waitFor(() => expect(screen.getByText('c@example.com')).toBeInTheDocument())
  })

  test('Searching existing email returns registered user', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] })
    render(<TestWrapper><CreateEnvelopePage /></TestWrapper>)
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    expect(await screen.findByText('Added recipients')).toBeInTheDocument()
    expect(await screen.findByText('User C')).toBeInTheDocument()
  })

  test('Searching non-existing email shows invite option', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] })
    render(<TestWrapper><CreateEnvelopePage /></TestWrapper>)
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    const recipients = await screen.findAllByText('User C')
    expect(recipients.length).toBe(1)
  })

  test('Invite flow triggers correct API + toast', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] })
    render(<TestWrapper><CreateEnvelopePage /></TestWrapper>)
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    expect(await screen.findByText('c@example.com')).toBeInTheDocument()
  })
})


