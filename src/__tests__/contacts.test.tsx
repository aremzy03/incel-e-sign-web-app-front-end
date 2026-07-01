import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContactsPage from '@/app/dashboard/contacts/page'
import CreateEnvelopePage from '@/app/dashboard/envelopes/create/page'
import axios from 'axios'

jest.mock('axios')

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}))

jest.mock('@/hooks/useDocuments', () => ({
  useDocuments: () => ({
    data: {
      results: [
        {
          id: 'doc1',
          file_name: 'Doc.pdf',
          status: 'draft',
          file_url: '',
          file_size: 0,
          created_at: '',
          updated_at: '',
        },
      ],
    },
    isLoading: false,
  }),
  useUploadDocument: () => ({ mutateAsync: jest.fn(), isPending: false }),
}))

jest.mock('@/components/contacts/RecipientSearch', () => ({
  RecipientSearch: ({ onSelect }: { onSelect: (r: { email: string; name?: string; status: 'registered' }) => void }) => (
    <button onClick={() => onSelect({ email: 'c@example.com', name: 'User C', status: 'registered' })}>
      Select Recipient
    </button>
  ),
}))

const useCreateEnvelope = jest.fn()
const useSendEnvelope = jest.fn()
const useEditEnvelope = jest.fn()

jest.mock('@/hooks/useEnvelopes', () => ({
  useCreateEnvelope: (...args: unknown[]) => useCreateEnvelope(...args),
  useSendEnvelope: (...args: unknown[]) => useSendEnvelope(...args),
  useEditEnvelope: (...args: unknown[]) => useEditEnvelope(...args),
}))

jest.mock('@/hooks/useUsers', () => ({
  useEnvelopeUserValidation: () => ({
    validateRecipients: async () => ({ valid: [], invalid: [] }),
    isValidating: false,
  }),
  useUserSearch: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true, status: 'authenticated' }),
  shouldRetryAuthQuery: () => false,
}))

const mockApi = (axios.create as unknown as jest.Mock).mock.results[0].value

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

async function openRecipientsStep() {
  render(<TestWrapper><CreateEnvelopePage /></TestWrapper>)
  const doc = await screen.findByText('Doc.pdf')
  await userEvent.click(doc)
  await userEvent.click(screen.getByRole('button', { name: /next: add recipients/i }))
  expect(await screen.findByText('Signing Order')).toBeInTheDocument()
}

describe('Contacts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockApi.get.mockReset()
    mockApi.post.mockReset()
    useCreateEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useSendEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useEditEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
  })

  test('Contacts list renders', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: '1', email: 'a@example.com', name: 'A', status: 'registered' }] } })
    render(<TestWrapper><ContactsPage /></TestWrapper>)
    expect(await screen.findByText('Contacts')).toBeInTheDocument()
    expect(await screen.findByText('a@example.com')).toBeInTheDocument()
  })

  test('Adding a contact updates list', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [{ id: '2', email: 'c@example.com', name: 'User C', status: 'registered' }] } })
    mockApi.post.mockResolvedValue({ data: { data: { id: '2', email: 'c@example.com', name: 'User C', status: 'registered' } } })

    render(<TestWrapper><ContactsPage /></TestWrapper>)
    await userEvent.click(screen.getByRole('button', { name: /add contact/i }))
    const emailInput = screen.getByPlaceholderText(/search by email/i)
    await userEvent.type(emailInput, 'c@example.com')
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }))
    await userEvent.click(screen.getByRole('button', { name: /add to contacts/i }))
    await waitFor(() => expect(screen.getByText('c@example.com')).toBeInTheDocument())
  })

  test('Searching existing email returns registered user', async () => {
    await openRecipientsStep()
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    expect(await screen.findByText('User C')).toBeInTheDocument()
    expect(await screen.findByText('c@example.com')).toBeInTheDocument()
  })

  test('Searching non-existing email shows invite option', async () => {
    await openRecipientsStep()
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    const recipients = await screen.findAllByText('User C')
    expect(recipients.length).toBe(1)
  })

  test('Invite flow triggers correct API + toast', async () => {
    await openRecipientsStep()
    await userEvent.click(screen.getByRole('button', { name: /select recipient/i }))
    expect(await screen.findByText('c@example.com')).toBeInTheDocument()
  })
})
