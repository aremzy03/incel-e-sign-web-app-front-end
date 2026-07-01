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
