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
 * Get NextAuth secret with validation
 */
export function getNextAuthSecret(): string {
  const secret = requiredEnvVars.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
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

