export class FrozenEnvelopeError extends Error {
  readonly status = 409

  constructor(message = 'Envelope frozen for system upgrade. Ask the creator to resend.') {
    super(message)
    this.name = 'FrozenEnvelopeError'
  }
}

export class SigningFailedError extends Error {
  readonly jobId: string

  constructor(message: string, jobId: string) {
    super(message)
    this.name = 'SigningFailedError'
    this.jobId = jobId
  }
}

export class SigningTimeoutError extends Error {
  readonly jobId: string

  constructor(jobId: string, message = 'Signing is taking longer than expected.') {
    super(message)
    this.name = 'SigningTimeoutError'
    this.jobId = jobId
  }
}

export class AlreadySignedError extends Error {
  constructor(message = 'Document already signed.') {
    super(message)
    this.name = 'AlreadySignedError'
  }
}

export const SIGNING_IN_PROGRESS_DEFAULT_MESSAGE =
  'Signing is currently in progress for this envelope. Please wait and try again.'

/** Returns a user-facing message when edit/send is blocked because signing is in progress (HTTP 409). */
export function resolveSigningInProgressMessage(error: unknown): string | null {
  const err = error as { response?: { status?: number; data?: { message?: string } } }
  if (err.response?.status !== 409) return null
  return err.response.data?.message?.trim() || SIGNING_IN_PROGRESS_DEFAULT_MESSAGE
}
