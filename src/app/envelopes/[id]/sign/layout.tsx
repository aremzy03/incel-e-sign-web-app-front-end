'use client'

import { SigningJobBackgroundWatcher } from '@/components/signing/signing-job-background-watcher'

export default function PublicSignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SigningJobBackgroundWatcher />
    </>
  )
}
