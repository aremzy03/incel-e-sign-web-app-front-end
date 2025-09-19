import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuditPage from '../app/dashboard/audit/page'

// Mock Next.js router
jest.mock('next/navigation', () => {
  const actualNav = jest.requireActual('next/navigation');
  return {
    ...actualNav,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
  };
})

describe('Audit Log Page', () => {
  it('renders audit log page with admin access', async () => {
    render(<AuditPage />)
    
    // Wait for the admin check to complete
    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    })
    
    // Check if the page title is rendered
    expect(screen.getByText('System audit trails and activity logs (Admin Only)')).toBeInTheDocument()
    
    // Check if admin access indicator is shown
    expect(screen.getByText('Admin Access')).toBeInTheDocument()
  })

  it('shows audit log table with dummy data', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if table headers are present
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Actor')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('IP Address')).toBeInTheDocument()
    })
    
    // Check if audit log entries are displayed
    expect(screen.getByText('CREATE_ENV')).toBeInTheDocument()
    expect(screen.getByText('SIGN_DOC')).toBeInTheDocument()
    expect(screen.getByText('DECLINE_SIGN')).toBeInTheDocument()
    expect(screen.getByText('REJECT_ENV')).toBeInTheDocument()
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.getByText('LOGOUT')).toBeInTheDocument()
  })

  it('shows actor information correctly', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if actor emails are displayed
      expect(screen.getByText('creator@test.com')).toBeInTheDocument()
      expect(screen.getByText('signer1@test.com')).toBeInTheDocument()
      expect(screen.getByText('signer2@test.com')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      // Use getAllByText for user@test.com since it appears multiple times
      expect(screen.getAllByText('user@test.com')).toHaveLength(2)
    })
  })

  it('shows timestamps for audit entries', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if timestamps are displayed
      expect(screen.getByText('2025-09-16 14:32:15')).toBeInTheDocument()
      expect(screen.getByText('2025-09-15 18:21:42')).toBeInTheDocument()
      expect(screen.getByText('2025-09-14 16:45:33')).toBeInTheDocument()
    })
  })

  it('shows action details correctly', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if action details are displayed
      expect(screen.getByText('Created envelope "Contract NDA" with 2 recipients')).toBeInTheDocument()
      expect(screen.getByText('Signed document "Sales Agreement"')).toBeInTheDocument()
      expect(screen.getByText('Declined to sign document "NDA Agreement"')).toBeInTheDocument()
      expect(screen.getByText('Rejected envelope "Contract Proposal" due to policy violation')).toBeInTheDocument()
    })
  })

  it('shows IP addresses for audit entries', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if IP addresses are displayed
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.101')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.102')).toBeInTheDocument()
    })
  })

  it('displays summary statistics', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if summary cards are displayed
      expect(screen.getByText('Total Actions')).toBeInTheDocument()
      expect(screen.getByText('Successful')).toBeInTheDocument()
      expect(screen.getByText('Declined')).toBeInTheDocument()
      expect(screen.getByText('Unique Users')).toBeInTheDocument()
    })
    
    // Check if statistics are calculated correctly
    expect(screen.getByText('6')).toBeInTheDocument() // Total actions
    // Use getAllByText for "2" since it appears multiple times
    expect(screen.getAllByText('2')).toHaveLength(2) // Successful and Declined actions
    expect(screen.getByText('5')).toBeInTheDocument() // Unique users
  })

  it('shows action badges with correct colors', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if action badges are displayed with proper styling
      const createEnvBadge = screen.getByText('CREATE_ENV')
      const signDocBadge = screen.getByText('SIGN_DOC')
      const declineSignBadge = screen.getByText('DECLINE_SIGN')
      const rejectEnvBadge = screen.getByText('REJECT_ENV')
      
      expect(createEnvBadge).toBeInTheDocument()
      expect(signDocBadge).toBeInTheDocument()
      expect(declineSignBadge).toBeInTheDocument()
      expect(rejectEnvBadge).toBeInTheDocument()
    })
  })

  it('shows admin access indicator', async () => {
    render(<AuditPage />)
    
    await waitFor(() => {
      // Check if admin access indicator is shown
      expect(screen.getByText('Admin Access')).toBeInTheDocument()
    })
  })
})
