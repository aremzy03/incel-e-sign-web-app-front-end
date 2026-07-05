import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { VerticalPDFViewer } from '@/components/envelope/VerticalPDFViewer'

let mockLoadError: Error | null = null
const mockPasswordReset = jest.fn()
const mockPasswordHandler = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { accessToken: 'test-token' },
    status: 'authenticated',
  }),
}))

jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}))

jest.mock('@/components/pdf/usePdfPasswordDialog', () => ({
  usePdfPasswordDialog: () => ({
    dialog: null,
    cancelled: false,
    reset: mockPasswordReset,
    onPassword: mockPasswordHandler,
  }),
}))

jest.mock('@/lib/pdf-worker', () => ({}))

jest.mock('react-pdf', () => {
  const React = require('react')

  return {
    Document: ({ children, onLoadError, onLoadSuccess }: any) => {
      const didNotifyRef = React.useRef(false)

      React.useEffect(() => {
        if (didNotifyRef.current) return
        didNotifyRef.current = true

        if (mockLoadError) {
          onLoadError?.(mockLoadError)
          return
        }
        onLoadSuccess?.({ numPages: 1 })
      }, [onLoadError, onLoadSuccess])

      return <div data-testid="pdf-document">{children}</div>
    },
    Page: () => <div data-testid="pdf-page" />,
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
  }
})

const baseProps = {
  documents: [
    {
      id: 'doc-1',
      file_name: 'contract.pdf',
      file_url: '/media/contract.pdf',
      current_file_url: '/media/contract.pdf',
      file_size: 1024,
      status: 'draft' as const,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  fieldPositions: {},
  recipients: [],
  activeFieldId: null,
  onFieldSelect: jest.fn(),
  onFieldPositionChange: jest.fn(),
  onFieldDelete: jest.fn(),
  onFieldDrop: jest.fn(),
  editorLayout: true,
  readOnly: true,
}

describe('VerticalPDFViewer preview errors', () => {
  beforeEach(() => {
    mockLoadError = null
    mockPasswordReset.mockClear()
    mockPasswordHandler.mockClear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows a not-found state for preview 404 failures', async () => {
    mockLoadError = new Error('Unexpected server response (404) while retrieving PDF')

    render(<VerticalPDFViewer {...baseProps} />)

    expect(await screen.findByText('Preview not found')).toBeInTheDocument()
    expect(
      screen.getByText(/This document preview is no longer available/i),
    ).toBeInTheDocument()
  })

  it('shows a timeout-specific state for preview 504 failures', async () => {
    mockLoadError = new Error('Unexpected server response (504) while retrieving PDF')

    render(<VerticalPDFViewer {...baseProps} />)

    expect(await screen.findByText('Preview timed out')).toBeInTheDocument()
    expect(
      screen.getByText(/The preview service took too long to respond/i),
    ).toBeInTheDocument()
  })
})
