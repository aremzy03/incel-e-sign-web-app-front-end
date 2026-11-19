import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GlobalSearch } from '@/components/dashboard/global-search'

const mockPush = jest.fn()
const mockSearch = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/api/search', () => {
  const actual = jest.requireActual('@/lib/api/search')
  return { ...actual, globalSearch: (...args: unknown[]) => mockSearch(...args) }
})

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GlobalSearch />
    </QueryClientProvider>,
  )
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPush.mockClear()
    mockSearch.mockReset()
    mockSearch.mockResolvedValue({
      query: 'lease',
      envelopes: [
        {
          id: 'env-1',
          name: 'Office lease',
          status: 'pending',
          is_self_sign: false,
          role: 'signer',
          document_names: ['Lease.pdf'],
          matched_on: 'name',
          updated_at: '2026-11-18T10:00:00Z',
        },
      ],
      documents: [{ id: 'doc-1', file_name: 'Lease.pdf', status: 'draft', updated_at: '2026-11-18T10:00:00Z' }],
      totals: { envelopes: 3, documents: 1 },
    })
  })

  afterEach(() => jest.useRealTimers())

  async function type(text: string) {
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: text } })
    await act(async () => {
      jest.advanceTimersByTime(300)
    })
    return input
  }

  it('shows envelopes and documents, and a link to see all envelopes', async () => {
    renderSearch()
    await type('lease')
    expect(await screen.findByText('Sent to you')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Envelopes' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('See all 3 envelopes')).toBeInTheDocument()
    expect(mockSearch).toHaveBeenCalledWith('lease', expect.anything())
  })

  it('opens the highlighted result with the keyboard', async () => {
    renderSearch()
    const input = await type('lease')
    await screen.findByText('Sent to you')
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // envelope → "See all"
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // → document
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/documents/doc-1')
  })

  it('asks for more characters before searching', async () => {
    renderSearch()
    await type('l')
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    expect(mockSearch).not.toHaveBeenCalled()
  })
})
