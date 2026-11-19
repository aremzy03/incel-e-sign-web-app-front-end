/**
 * A 401 on a request sent without a login (a signer on an e-mailed link) is the caller's to
 * handle. It must not sign the visitor "out" and send them to the login page.
 */
import { getSession, signOut } from 'next-auth/react'
import apiClient from '@/lib/axios'
import { clearAuthSession, setAuthSession } from '@/lib/auth-session-cache'

// The shared setup replaces axios.create with a stub; this test needs the real interceptors.
jest.unmock('axios')

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signOut: jest.fn(),
}))

function respondWith401() {
  apiClient.defaults.adapter = async (config) => {
    const error = Object.assign(new Error('Request failed with status code 401'), {
      config,
      isAxiosError: true,
      response: { status: 401, data: {}, headers: {}, config, statusText: 'Unauthorized' },
    })
    throw error
  }
}

describe('apiClient 401 handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearAuthSession()
    respondWith401()
  })

  it('leaves an anonymous request\'s 401 to the caller', async () => {
    await expect(apiClient.get('/auth/profile/detail/', { params: { user_id: 'u1' } })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(signOut).not.toHaveBeenCalled()
    expect(getSession).not.toHaveBeenCalled()
  })

  it('still ends a session whose token stopped working', async () => {
    setAuthSession({ accessToken: 'expired', refreshToken: null, error: null })
    ;(getSession as jest.Mock).mockResolvedValue(null)

    await expect(apiClient.get('/envelopes/')).rejects.toMatchObject({ response: { status: 401 } })

    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
