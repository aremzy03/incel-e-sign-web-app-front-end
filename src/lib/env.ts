/**
 * Environment variable validation and access
 * Validates required environment variables on module load
 */

const requiredEnvVars = {
  // Public variables (exposed to client)
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  
  // Server-only variables
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const

const optionalEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
  HEALTH_CHECK_BACKEND: process.env.HEALTH_CHECK_BACKEND || '',
  // Optional explicit URL for the backend health endpoint.
  // When unset, falls back to the origin of NEXT_PUBLIC_API_URL + /health/
  HEALTH_CHECK_BACKEND_URL: process.env.HEALTH_CHECK_BACKEND_URL || '',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING || '',
  INTERNAL_API_URL: process.env.INTERNAL_API_URL || '',
} as const

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
export function validateEnv(): void {
  const missing: string[] = []
  
  // Check required variables
  if (!requiredEnvVars.NEXT_PUBLIC_API_URL) {
    missing.push('NEXT_PUBLIC_API_URL')
  }
  
  // Only validate NEXTAUTH_SECRET in production
  if (optionalEnvVars.NODE_ENV === 'production' && !requiredEnvVars.NEXTAUTH_SECRET) {
    missing.push('NEXTAUTH_SECRET')
  }
  
  if (optionalEnvVars.NODE_ENV === 'production' && !requiredEnvVars.NEXTAUTH_URL) {
    missing.push('NEXTAUTH_URL')
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    )
  }
}

/**
 * Get allowed origins from environment variable
 * Returns array of allowed origins, or empty array if not set
 */
export function getAllowedOrigins(): string[] {
  const origins = optionalEnvVars.ALLOWED_ORIGINS
  if (!origins) {
    return []
  }
  return origins.split(',').map(origin => origin.trim()).filter(Boolean)
}

/**
 * Get API base URL with validation
 */
export function getApiBaseUrl(): string {
  const url = requiredEnvVars.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not set')
  }
  return url
}

/**
 * Get server-to-server API base URL (preferred for proxy routes)
 */
export function getServerApiBaseUrl(): string {
  if (optionalEnvVars.INTERNAL_API_URL) {
    return optionalEnvVars.INTERNAL_API_URL
  }
  return getApiBaseUrl()
}

/**
 * Get NextAuth secret with validation.
 * In production, throws if the secret is missing.
 * In development/test, falls back to an insecure placeholder so the
 * next-auth handler can still initialise and the browser won't receive
 * a 500 that surfaces as CLIENT_FETCH_ERROR "Failed to fetch".
 */
export function getNextAuthSecret(): string {
  const secret = requiredEnvVars.NEXTAUTH_SECRET
  if (!secret) {
    if (optionalEnvVars.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is not set')
    }
    // Warn loudly so the developer knows to add it to .env.local
    console.warn(
      '[env] NEXTAUTH_SECRET is not set. Using an insecure fallback. ' +
      'Add NEXTAUTH_SECRET to your .env.local file.'
    )
    return 'dev-fallback-secret-add-to-env-local'
  }
  return secret
}

/**
 * Get NextAuth URL
 */
export function getNextAuthUrl(): string | undefined {
  return requiredEnvVars.NEXTAUTH_URL
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return optionalEnvVars.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return optionalEnvVars.NODE_ENV === 'development'
}

/**
 * Check if backend health check is enabled
 */
export function isHealthCheckBackendEnabled(): boolean {
  return optionalEnvVars.HEALTH_CHECK_BACKEND === 'true'
}

/**
 * Get the URL to use for the backend health probe.
 *
 * Priority order:
 *   1. HEALTH_CHECK_BACKEND_URL  – explicit override (useful in Docker where
 *      the backend is reachable via a service name, e.g. http://backend:8000/health/)
 *   2. Origin of NEXT_PUBLIC_API_URL + /health/  – derived automatically.
 *      NEXT_PUBLIC_API_URL is typically http://host:port/api, so we strip the
 *      path and only keep the origin to avoid hitting /api/health/ (404) instead
 *      of /health/ on the Django backend.
 */
export function getBackendHealthUrl(): string {
  if (optionalEnvVars.HEALTH_CHECK_BACKEND_URL) {
    return optionalEnvVars.HEALTH_CHECK_BACKEND_URL
  }
  const apiBase = requiredEnvVars.NEXT_PUBLIC_API_URL || ''
  try {
    return `${new URL(apiBase).origin}/health/`
  } catch {
    // Fallback if URL parsing fails (e.g. relative URL in tests)
    return `${apiBase}/health/`
  }
}

/**
 * Check if logging should be enabled
 * ENABLE_LOGGING=true forces logging even in non-development
 */
export function isLoggingEnabled(): boolean {
  return optionalEnvVars.ENABLE_LOGGING === 'true' || isDevelopment()
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    // Only throw in production, warn in development
    if (isProduction()) {
      throw error
    } else {
      console.warn('Environment validation warning:', (error as Error).message)
    }
  }
}

