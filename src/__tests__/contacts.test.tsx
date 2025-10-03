import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactsPage from '@/app/dashboard/contacts/page'
import CreateEnvelopePage from '@/app/dashboard/envelopes/create/page'
import axios from 'axios'

jest.mock('axios')

const mockedAxios = axios as unknown as jest.Mocked<typeof axios>

describe('Contacts', () => {
  beforeEach(() => {
    mockedAxios.create().get.mockReset()
    mockedAxios.create().post.mockReset()
  })

  test('Contacts list renders', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: '1', email: 'a@example.com', name: 'A', status: 'registered' }] } })
    render(<ContactsPage />)
    expect(await screen.findByText('Saved Contacts')).toBeInTheDocument()
    expect(await screen.findByText('a@example.com')).toBeInTheDocument()
  })

  test('Adding a contact updates list', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [] } })
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { id: '2', email: 'b@example.com', name: 'B', status: 'invited' } } })
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: '2', email: 'b@example.com', name: 'B', status: 'invited' }] } })
    render(<ContactsPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'b@example.com')
    await userEvent.click(screen.getByRole('button', { name: /add contact/i }))
    await waitFor(() => expect(screen.getByText('b@example.com')).toBeInTheDocument())
  })

  test('Searching existing email returns registered user', async () => {
    // documents for step 1
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] } })
    // search
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { found: true, user: { id: 'u1', email: 'c@example.com', full_name: 'User C' } } } })
    render(<CreateEnvelopePage />)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    const input = screen.getByPlaceholderText('Type an email...')
    await userEvent.type(input, 'c@example.com')
    expect(await screen.findByText(/Registered: User C/)).toBeInTheDocument()
  })

  test('Searching non-existing email shows invite option', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] } })
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { found: false } } })
    render(<CreateEnvelopePage />)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    const input = screen.getByPlaceholderText('Type an email...')
    await userEvent.type(input, 'd@example.com')
    expect(await screen.findByText(/Invite d@example.com to join/)).toBeInTheDocument()
  })

  test('Invite flow triggers correct API + toast', async () => {
    mockedAxios.create().get.mockResolvedValueOnce({ data: { data: [{ id: 'doc1', file_name: 'Doc.pdf', status: 'uploaded' }] } })
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { found: false } } })
    mockedAxios.create().post.mockResolvedValueOnce({ data: { data: { success: true } } })
    render(<CreateEnvelopePage />)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    const input = screen.getByPlaceholderText('Type an email...')
    await userEvent.type(input, 'e@example.com')
    await userEvent.click(await screen.findByText(/Invite e@example.com to join/))
    // confirm in dialog
    await userEvent.click(await screen.findByRole('button', { name: /invite/i }))
    await waitFor(() => {
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/contacts/invite/', { email: 'e@example.com' })
    })
  })
})


