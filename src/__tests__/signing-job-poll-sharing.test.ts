import { getSigningJob } from '@/lib/api/signatures'
import apiClient from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), defaults: {} },
}))

describe('getSigningJob', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'success', data: { id: 'j', status: 'processing' } } })
  })

  it('shares one request between pollers watching the same job', async () => {
    const [a, b] = await Promise.all([getSigningJob('job-1'), getSigningJob('job-1')])

    expect(a).toEqual(b)
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('polls again once the sharing window has passed', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000)
    await getSigningJob('job-2')
    now.mockReturnValue(1_002_000)
    await getSigningJob('job-2')
    now.mockRestore()

    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })

  it('does not share between different jobs', async () => {
    await Promise.all([getSigningJob('job-3'), getSigningJob('job-4')])

    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })
})
