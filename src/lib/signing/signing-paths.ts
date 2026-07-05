/** Routes that use SigningShell instead of the full dashboard layout. */
export const SIGNING_SHELL_PATHS = [
  '/dashboard/envelopes/self-sign',
] as const

export function isSigningShellPath(pathname: string): boolean {
  if (SIGNING_SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  if (/^\/dashboard\/envelopes\/[^/]+\/sign\/?$/.test(pathname)) {
    return true
  }
  if (/^\/envelopes\/[^/]+\/sign\/?$/.test(pathname)) {
    return true
  }
  if (/^\/dashboard\/documents\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  return false
}
