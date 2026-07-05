'use client'

import { SigningStatusWaiting } from '@/components/signing/signing-status-waiting'
import type { Envelope } from '@/lib/api/envelopes'

interface SigningStatusProcessingProps {
  envelope: Envelope
  currentUserId?: string
  onClose?: () => void
  backLabel?: string
}

export function SigningStatusProcessing({
  envelope,
  currentUserId,
  onClose,
  backLabel = 'Back to Dashboard',
}: SigningStatusProcessingProps) {
  return (
    <SigningStatusWaiting
      envelope={envelope}
      currentUserId={currentUserId}
      onClose={onClose ?? (() => undefined)}
      backLabel={backLabel}
      title="Signing in progress…"
      description="Your signature is being embedded into the document. This usually takes a few moments."
    />
  )
}
