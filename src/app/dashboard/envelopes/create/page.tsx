'use client'

import { EnvelopeWizardProvider } from '@/components/envelope/wizard/envelope-wizard-context'
import { EnvelopeWizardContent } from '@/components/envelope/wizard/EnvelopeWizard'

export default function CreateEnvelopePage() {
  return (
    <EnvelopeWizardProvider mode="create">
      <EnvelopeWizardContent />
    </EnvelopeWizardProvider>
  )
}
