'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'
import { WizardHeader } from './WizardHeader'
import { EnvelopeWizardFooter } from './EnvelopeWizardFooter'
import { StepSelectDocuments } from './steps/StepSelectDocuments'
import { StepPlaceFields } from './steps/StepPlaceFields'

export function EnvelopeWizardContent() {
  const { currentStep, error, success } = useEnvelopeWizard()

  if (currentStep === 2) {
    return <StepPlaceFields />
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col bg-background md:-m-8">
      <WizardHeader variant="create" />

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
          <StepSelectDocuments />
        </div>
      </div>

      <EnvelopeWizardFooter />
    </div>
  )
}
