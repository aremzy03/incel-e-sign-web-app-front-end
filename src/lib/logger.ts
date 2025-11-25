/**
 * Centralized logging utility
 * Respects NODE_ENV and only logs in development or when explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const enableLogging = process.env.ENABLE_LOGGING === 'true' || isDevelopment

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!enableLogging) return false
    
    // In production, only log warnings and errors
    if (isProduction && (level === 'debug' || level === 'info')) {
      return false
    }
    
    return true
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug('[DEBUG]', ...args)
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args)
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args)
    }
  }

  /**
   * Log error with sanitized message for production
   */
  errorSafe(error: unknown, context?: string): void {
    if (!this.shouldLog('error')) return

    const message = error instanceof Error ? error.message : String(error)
    const sanitized = isProduction 
      ? 'An error occurred' 
      : message

    if (context) {
      console.error(`[ERROR] ${context}:`, sanitized)
    } else {
      console.error('[ERROR]', sanitized)
    }

    // In development, also log stack trace
    if (!isProduction && error instanceof Error && error.stack) {
      console.error('[STACK]', error.stack)
    }
  }

  /**
   * Log API request/response (only in development)
   */
  api(method: string, url: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(`[API] ${method} ${url}`, data ? { data } : '')
    }
  }

  /**
   * Log performance metrics
   */
  performance(label: string, duration: number): void {
    if (this.shouldLog('debug')) {
      console.debug(`[PERF] ${label}: ${duration}ms`)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for testing
export { Logger }

