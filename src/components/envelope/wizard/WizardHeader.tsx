'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { EnvelopeWizardStepper } from './EnvelopeWizardStepper'
import { useEnvelopeWizard } from './envelope-wizard-context'

type WizardHeaderVariant = 'create' | 'settings' | 'review'

interface WizardHeaderProps {
  variant: WizardHeaderVariant
}

export function WizardHeader({ variant }: WizardHeaderProps) {
  const router = useRouter()
  const { envelopeName } = useEnvelopeWizard()

  if (variant === 'create') {
    return (
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface-container-lowest px-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto md:gap-8">
          <div className="flex shrink-0 items-center gap-2 text-primary">
            <MaterialIcon name="edit_square" size={22} className="text-secondary" />
            <span className="text-headline-lg font-semibold">Create Envelope</span>
          </div>
          <EnvelopeWizardStepper variant="inline" className="hidden lg:flex" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/envelopes')}
          aria-label="Close wizard"
          className="shrink-0 rounded-full"
        >
          <MaterialIcon name="close" size={20} />
        </Button>
      </header>
    )
  }

  if (variant === 'settings') {
    return (
      <header className="sticky top-0 z-20 flex h-16 items-center justify-center border-b border-border bg-surface-container-lowest px-4 md:px-8">
        <EnvelopeWizardStepper variant="header-nav" />
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface-container-lowest px-4 shadow-sm md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="text-headline-lg font-semibold text-primary">Envelope Builder</h2>
        <div className="hidden h-4 w-px bg-border sm:block" />
        <span className="hidden truncate text-body-sm text-muted sm:block">
          {envelopeName || 'Untitled envelope'}
        </span>
      </div>
      <EnvelopeWizardStepper variant="pills" className="hidden xl:flex" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => router.push('/dashboard/envelopes')}
        aria-label="Close wizard"
        className="shrink-0 rounded-full xl:hidden"
      >
        <MaterialIcon name="close" size={20} />
      </Button>
    </header>
  )
}
