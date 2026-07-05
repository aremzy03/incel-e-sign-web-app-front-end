'use client'

import { useParams } from 'next/navigation'
import { EnvelopeWizardProvider } from '@/components/envelope/wizard/envelope-wizard-context'
import { EnvelopeWizardContent } from '@/components/envelope/wizard/EnvelopeWizard'
import { useEnvelopeWizardHydration } from '@/hooks/useEnvelopeWizardHydration'

function EditEnvelopeWizardContent({ envelopeId }: { envelopeId: string }) {
  const { isHydrating } = useEnvelopeWizardHydration(envelopeId)

  if (isHydrating) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted">Loading envelope…</p>
      </div>
    )
  }

  return <EnvelopeWizardContent />
}

export default function EditEnvelopePage() {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id || ''

  if (!envelopeId) {
    return <p className="text-sm text-muted">Invalid envelope.</p>
  }

  return (
    <EnvelopeWizardProvider mode="edit" envelopeId={envelopeId}>
      <EditEnvelopeWizardContent envelopeId={envelopeId} />
    </EnvelopeWizardProvider>
  )
}
