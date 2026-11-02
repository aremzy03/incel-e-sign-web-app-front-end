'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'

export function EnvelopeWizardFooter() {
  const router = useRouter()
  const {
    currentStep,
    uploadedDocuments,
    recipients,
    goNext,
    handleSaveDraft,
    creating,
    saving,
    sending,
    isValidating,
    canGoNext,
    nextStepError,
  } = useEnvelopeWizard()

  const isBusy = creating || saving || sending || isValidating

  if (currentStep === 2) return null

  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-surface-container-lowest px-4 py-4 shadow-lg md:px-8">
      <div className="mx-auto flex max-w-max-content-width items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={isBusy || uploadedDocuments.length === 0}
            className="rounded-lg px-4 py-2.5 text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
          >
            Save as Draft
          </button>
          <div className="hidden sm:block">
            <p className="text-label-sm text-on-surface-variant">
              Step 1 of 2: Prepare Envelope
            </p>
            <p className="text-caption-xs font-medium text-secondary">
              {uploadedDocuments.length} file{uploadedDocuments.length === 1 ? '' : 's'} &middot;{' '}
              {recipients.length} signer{recipients.length === 1 ? '' : 's'}
              {nextStepError ? ` (${nextStepError})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/envelopes')}
            disabled={isBusy}
            className="border-border bg-surface-container-lowest text-primary"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={goNext}
            disabled={isBusy || !canGoNext}
            className="gap-2 bg-secondary px-8 font-bold text-on-secondary shadow-md shadow-secondary/20 hover:bg-accent-hover"
          >
            Next: Place Fields
            <MaterialIcon name="arrow_forward" size={20} />
          </Button>
        </div>
      </div>
    </footer>
  )
}
