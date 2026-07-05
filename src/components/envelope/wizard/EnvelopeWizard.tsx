'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'
import { WizardHeader } from './WizardHeader'
import { EnvelopeWizardFooter } from './EnvelopeWizardFooter'
import { StepSelectDocuments } from './steps/StepSelectDocuments'
import { StepAddRecipients } from './steps/StepAddRecipients'
import { StepPlaceFields } from './steps/StepPlaceFields'
import { StepEnvelopeSettings } from './steps/StepEnvelopeSettings'
import { StepReviewSend } from './steps/StepReviewSend'

export function EnvelopeWizardContent() {
  const { currentStep, error, success } = useEnvelopeWizard()

  if (currentStep === 3) {
    return <StepPlaceFields />
  }

  const bgClass =
    currentStep === 4 ? 'bg-surface-container-low' : 'bg-background'

  return (
    <div className={`-m-4 flex min-h-[calc(100vh-4rem)] flex-col md:-m-8 ${bgClass}`}>
      {currentStep === 1 && <WizardHeader variant="create" />}
      {currentStep === 4 && <WizardHeader variant="settings" />}
      {currentStep === 5 && <WizardHeader variant="review" />}

      {success && (
        <Alert className="mx-4 mt-4 border-success/30 bg-success-light md:mx-8">
          <MaterialIcon name="check_circle" size={18} className="text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mx-4 mt-4 md:mx-8">
          <MaterialIcon name="error" size={18} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-max-content-width">
          {currentStep === 1 && <StepSelectDocuments />}
          {currentStep === 2 && <StepAddRecipients />}
          {currentStep === 4 && <StepEnvelopeSettings />}
          {currentStep === 5 && <StepReviewSend />}
        </div>
      </div>

      <EnvelopeWizardFooter />
    </div>
  )
}
