'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useProfile } from '@/hooks/useProfile'
import { SigningShell } from '@/components/signing/signing-shell'
import { SelfSignStart, selfSignEditorHref } from '@/components/signing/self-sign-start'

/**
 * Pick or upload a document to sign yourself. Editing and signing happen on
 * the document's edit-and-sign screen (/dashboard/documents/[id]/edit).
 */
function SelfSignPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams?.get('documentId')
  const { data: session } = useSession()
  const { data: profile } = useProfile()

  // Old links (?documentId=…) go straight to the editor.
  useEffect(() => {
    if (documentId) router.replace(selfSignEditorHref(documentId))
  }, [documentId, router])

  const user = session?.user
  const shellUser = user
    ? {
        id: user.id,
        name: user.full_name || 'User',
        email: user.email || '',
        profilePhotoUrl: profile?.profile_photo_url,
        initials: (user.full_name || 'U')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      }
    : undefined

  return (
    <SigningShell user={shellUser} onClose={() => router.push('/dashboard/envelopes')} closeLabel="Exit">
      <SelfSignStart />
    </SigningShell>
  )
}

export default function SelfSignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <SelfSignPageInner />
    </Suspense>
  )
}
