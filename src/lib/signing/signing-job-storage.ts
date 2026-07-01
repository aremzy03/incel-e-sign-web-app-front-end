const STORAGE_PREFIX = 'signing-job:'

export interface StoredSigningJob {
  jobId: string
  envelopeId: string
  startedAt: number
}

function storageKey(envelopeId: string): string {
  return `${STORAGE_PREFIX}${envelopeId}`
}

export function saveSigningJob(envelopeId: string, jobId: string): void {
  if (typeof window === 'undefined') return
  const entry: StoredSigningJob = {
    jobId,
    envelopeId,
    startedAt: Date.now(),
  }
  sessionStorage.setItem(storageKey(envelopeId), JSON.stringify(entry))
  notifySigningJobUpdated()
}

export function listStoredSigningJobs(): StoredSigningJob[] {
  if (typeof window === 'undefined') return []
  const jobs: StoredSigningJob[] = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    const raw = sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as StoredSigningJob
      if (parsed?.jobId && parsed?.envelopeId) jobs.push(parsed)
    } catch {
      /* ignore malformed entries */
    }
  }
  return jobs.sort((a, b) => b.startedAt - a.startedAt)
}

export const SIGNING_JOB_UPDATED_EVENT = 'signing-job-updated'

export function notifySigningJobUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SIGNING_JOB_UPDATED_EVENT))
}

export function loadSigningJob(envelopeId: string): StoredSigningJob | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(storageKey(envelopeId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredSigningJob
    if (!parsed?.jobId || !parsed?.envelopeId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSigningJob(envelopeId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(storageKey(envelopeId))
  notifySigningJobUpdated()
}
