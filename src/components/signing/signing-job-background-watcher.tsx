'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSigningJobPoller } from '@/hooks/signing/useSigningJobPoller'
import {
  listStoredSigningJobs,
  SIGNING_JOB_UPDATED_EVENT,
  type StoredSigningJob,
} from '@/lib/signing/signing-job-storage'

/**
 * Polls active signing jobs from session storage so signing can continue
 * after the user navigates away from the sign screen.
 */
export function SigningJobBackgroundWatcher() {
  const [activeJob, setActiveJob] = useState<StoredSigningJob | null>(null)

  const refreshActiveJob = useCallback(() => {
    const jobs = listStoredSigningJobs()
    setActiveJob(jobs[0] ?? null)
  }, [])

  useEffect(() => {
    refreshActiveJob()
    window.addEventListener(SIGNING_JOB_UPDATED_EVENT, refreshActiveJob)
    return () => window.removeEventListener(SIGNING_JOB_UPDATED_EVENT, refreshActiveJob)
  }, [refreshActiveJob])

  useSigningJobPoller({
    jobId: activeJob?.jobId ?? null,
    envelopeId: activeJob?.envelopeId ?? '',
    enabled: !!activeJob,
    background: true,
    onSucceeded: () => {
      toast.success('Document signed successfully!')
      refreshActiveJob()
    },
    onFailed: (error) => {
      toast.error(error.message || 'Signing failed. Please try again.')
      refreshActiveJob()
    },
  })

  return null
}
