export type AppErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'conflict'
  | 'timeout'
  | 'network'
  | 'server'
  | 'unknown'

export interface AppErrorDescriptor {
  kind: AppErrorKind
  status?: number
  message: string
  fieldErrors?: Record<string, string[]>
  retryable: boolean
  isAuthError: boolean
  isNotFound: boolean
}

type ErrorLike = {
  code?: string
  name?: string
  message?: string
  status?: number
  response?: {
    status?: number
    data?: unknown
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractFieldErrors(data: unknown): Record<string, string[]> | undefined {
  if (!isRecord(data)) return undefined

  const directErrors = data.errors
  if (isRecord(directErrors)) {
    return Object.fromEntries(
      Object.entries(directErrors).map(([field, value]) => [
        field,
        Array.isArray(value) ? value.map(String) : [String(value)],
      ]),
    )
  }

  return undefined
}

function extractMessageFromData(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined

  const detail = data.detail
  if (typeof detail === 'string' && detail.trim()) return detail.trim()

  const message = data.message
  if (typeof message === 'string' && message.trim()) return message.trim()

  const errors = extractFieldErrors(data)
  if (errors) {
    return Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ')
  }

  const nestedData = data.data
  if (isRecord(nestedData)) {
    const nestedMessage = extractMessageFromData(nestedData)
    if (nestedMessage) return nestedMessage
  }

  return undefined
}

export function getErrorStatus(error: unknown): number | undefined {
  const err = error as ErrorLike
  if (typeof err?.response?.status === 'number') return err.response.status
  if (typeof err?.status === 'number') return err.status
  return undefined
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = error as ErrorLike
  const responseMessage = extractMessageFromData(err?.response?.data)
  if (responseMessage) return responseMessage

  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message.trim()
  }

  return fallback
}

export function classifyError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): AppErrorDescriptor {
  const err = error as ErrorLike
  const status = getErrorStatus(error)
  const message = getErrorMessage(error, fallback)
  const fieldErrors = extractFieldErrors(err?.response?.data)

  const isTimeoutError =
    err?.name === 'SigningRequestTimeoutError' ||
    err?.name === 'SigningTimeoutError' ||
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ETIMEDOUT' ||
    /timed?\s*out/i.test(message)

  if (isTimeoutError) {
    return {
      kind: 'timeout',
      status,
      message,
      fieldErrors,
      retryable: true,
      isAuthError: false,
      isNotFound: false,
    }
  }

  if (!status) {
    const isNetworkError =
      err?.code === 'ERR_NETWORK' ||
      err?.message === 'Network Error' ||
      /network error/i.test(message) ||
      /failed to fetch/i.test(message)

    return {
      kind: isNetworkError ? 'network' : 'unknown',
      status,
      message,
      fieldErrors,
      retryable: true,
      isAuthError: false,
      isNotFound: false,
    }
  }

  switch (status) {
    case 400:
    case 422:
      return {
        kind: 'validation',
        status,
        message,
        fieldErrors,
        retryable: false,
        isAuthError: false,
        isNotFound: false,
      }
    case 401:
      return {
        kind: 'unauthorized',
        status,
        message,
        fieldErrors,
        retryable: false,
        isAuthError: true,
        isNotFound: false,
      }
    case 403:
      return {
        kind: 'forbidden',
        status,
        message,
        fieldErrors,
        retryable: false,
        isAuthError: true,
        isNotFound: false,
      }
    case 404:
      return {
        kind: 'notFound',
        status,
        message,
        fieldErrors,
        retryable: false,
        isAuthError: false,
        isNotFound: true,
      }
    case 409:
      return {
        kind: 'conflict',
        status,
        message,
        fieldErrors,
        retryable: false,
        isAuthError: false,
        isNotFound: false,
      }
    default:
      if (status >= 500) {
        return {
          kind: 'server',
          status,
          message,
          fieldErrors,
          retryable: true,
          isAuthError: false,
          isNotFound: false,
        }
      }

      return {
        kind: 'unknown',
        status,
        message,
        fieldErrors,
        retryable: true,
        isAuthError: false,
        isNotFound: false,
      }
  }
}

export function isNotFoundError(error: unknown): boolean {
  return classifyError(error).isNotFound
}
