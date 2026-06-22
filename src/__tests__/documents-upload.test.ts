import { uploadDocument } from '@/lib/api/documents'
import apiClient from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { baseURL: 'http://localhost:8000/api' },
  },
}))

describe('uploadDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls onProgress when upload progress events are received', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const onProgress = jest.fn()

    ;(apiClient.post as jest.Mock).mockImplementation(
      async (_url: string, _data: FormData, config?: { onUploadProgress?: (e: { loaded: number; total: number }) => void }) => {
        config?.onUploadProgress?.({ loaded: 50, total: 100 })
        config?.onUploadProgress?.({ loaded: 100, total: 100 })
        return { data: { status: 'success', message: 'ok', data: { id: '1', file_name: 'test.pdf' } } }
      },
    )

    await uploadDocument(file, onProgress)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/documents/upload/',
      expect.any(FormData),
      expect.objectContaining({
        onUploadProgress: expect.any(Function),
      }),
    )
    expect(onProgress).toHaveBeenCalledWith(50)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('works without an onProgress callback', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: { status: 'success', message: 'ok', data: { id: '1', file_name: 'test.pdf' } },
    })

    await expect(uploadDocument(file)).resolves.toEqual({
      status: 'success',
      message: 'ok',
      data: { id: '1', file_name: 'test.pdf' },
    })
  })
})
