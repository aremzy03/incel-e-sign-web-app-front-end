'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'

export function EnvelopeWizardFooter() {
  const router = useRouter()
  const {
    currentStep,
    recipients,
    goBack,
    goNext,
    handleSaveDraft,
    handleSend,
    creating,
    saving,
    sending,
    isValidating,
    sendValidationErrors,
    canGoNext,
  } = useEnvelopeWizard()

  const isBusy = creating || saving || sending || isValidating

  const nextLabels: Record<number, string> = {
    1: 'Add Recipients',
    2: 'Place Fields',
    3: 'Settings',
    4: 'Review',
  }

  if (currentStep === 3) return null

  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-surface-container-lowest px-4 py-4 shadow-lg md:px-8">
      <div className="mx-auto flex max-w-max-content-width items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={isBusy}
            className="text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface rounded-lg px-4 py-2.5 disabled:opacity-50"
          >
            Save as Draft
          </button>
          {currentStep === 2 && (
            <div className="hidden sm:block">
              <p className="text-label-sm text-on-surface-variant">
                Step 2 of 5: Add Recipients
              </p>
              <p className="text-caption-xs font-medium text-secondary">
                {recipients.length} signer{recipients.length === 1 ? '' : 's'} added
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/envelopes')}
              disabled={isBusy}
              className="border-border bg-white text-primary"
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={isBusy}
              className="gap-1.5 px-6 text-primary"
            >
              <MaterialIcon name="arrow_back" size={18} />
              Back
            </Button>
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={isBusy || !canGoNext}
              className="gap-2 bg-secondary px-8 font-bold text-on-secondary shadow-md shadow-secondary/20 hover:bg-accent-hover"
            >
              Next: {nextLabels[currentStep]}
              <MaterialIcon name="arrow_forward" size={20} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={isBusy || sendValidationErrors.length > 0}
              className="gap-2 bg-primary px-8 font-bold text-on-primary hover:bg-primary-hover"
            >
              <MaterialIcon name="send" size={20} />
              {sending ? 'Sending…' : 'Send for Signature'}
            </Button>
          )}
        </div>
      </div>
    </footer>
  )
}
