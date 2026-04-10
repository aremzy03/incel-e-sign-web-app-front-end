/**
 * Document URL helpers.
 *
 * Notes:
 * - `current_file_url` is typically a presigned (expiring) S3 URL for completed documents.
 * - Prefer backend streaming endpoints (e.g. `/documents/<id>/preview/`, `/download/`) for in-app usage.
 */

export type DocumentUrlLike = {
  current_file_url?: string | null
  signed_file_url?: string | null
  file_url?: string | null
}

export function getCurrentFileUrl(doc?: DocumentUrlLike | null): string {
  if (!doc) return ''
  return (
    (doc.current_file_url ?? undefined) ||
    (doc.signed_file_url ?? undefined) ||
    (doc.file_url ?? undefined) ||
    ''
  )
}

