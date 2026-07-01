'use client'

import { cn } from '@/lib/utils'
import { WIZARD_STEP_LABELS } from '@/lib/envelope/envelope-wizard-types'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'

interface EnvelopeWizardStepperProps {
  variant?: 'inline' | 'centered' | 'header-nav' | 'pills' | 'compact'
  className?: string
}

const SHORT_LABELS = ['Documents', 'Recipients', 'Place Fields', 'Settings', 'Review']

export function EnvelopeWizardStepper({
  variant = 'inline',
  className,
}: EnvelopeWizardStepperProps) {
  const { currentStep } = useEnvelopeWizard()

  if (variant === 'inline') {
    return (
      <nav aria-label="Envelope creation progress" className={cn('flex items-center gap-6', className)}>
        {WIZARD_STEP_LABELS.map((label, index) => {
          const step = (index + 1) as typeof currentStep
          const isComplete = step < currentStep
          const isActive = step === currentStep
          return (
            <div
              key={label}
              className={cn(
                'relative flex items-center gap-2 pb-1',
                isActive && 'wizard-stepper-active text-secondary',
                isComplete && 'text-secondary',
                !isActive && !isComplete && 'text-on-surface-variant',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive && 'bg-secondary text-on-secondary',
                  isComplete && 'bg-secondary text-on-secondary',
                  !isActive && !isComplete && 'bg-surface-container text-on-surface-variant',
                )}
              >
                {isComplete ? <MaterialIcon name="check" size={14} /> : step}
              </span>
              <span className="text-label-sm font-medium">{SHORT_LABELS[index]}</span>
            </div>
          )
        })}
      </nav>
    )
  }

  if (variant === 'header-nav') {
    return (
      <nav aria-label="Envelope creation progress" className={cn('flex items-center gap-3', className)}>
        {WIZARD_STEP_LABELS.map((label, index) => {
          const step = (index + 1) as typeof currentStep
          const isComplete = step < currentStep
          const isActive = step === currentStep
          return (
            <div key={label} className="flex items-center gap-3">
              {index > 0 && <div className="h-px w-8 bg-border" />}
              <div
                className={cn(
                  'flex items-center gap-2',
                  isActive && 'font-bold text-secondary',
                  isComplete && 'text-muted',
                  !isActive && !isComplete && 'text-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive && 'bg-secondary text-on-secondary',
                    isComplete && 'bg-success text-on-primary',
                    !isActive && !isComplete && 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {isComplete ? <MaterialIcon name="check" size={14} /> : step}
                </span>
                <span className="text-label-sm">{SHORT_LABELS[index]}</span>
              </div>
            </div>
          )
        })}
      </nav>
    )
  }

  if (variant === 'pills') {
    const pillLabels = ['Upload', 'Recipients', 'Fields', 'Settings', 'Review & Send']
    return (
      <nav aria-label="Envelope creation progress" className={cn('flex items-center gap-2', className)}>
        {pillLabels.map((label, index) => {
          const step = (index + 1) as typeof currentStep
          const isComplete = step < currentStep
          const isActive = step === currentStep
          return (
            <div key={label} className="flex items-center gap-2">
              {index > 0 && <div className="h-px w-8 bg-border" />}
              <div
                className={cn(
                  'flex items-center gap-2',
                  isActive && 'rounded-full border border-secondary/30 bg-secondary-container/20 px-3 py-1',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive && 'bg-secondary text-on-secondary',
                    isComplete && 'bg-success text-white',
                    !isActive && !isComplete && 'bg-surface-container text-muted',
                  )}
                >
                  {isComplete ? <MaterialIcon name="check" size={14} /> : step}
                </span>
                <span
                  className={cn(
                    'text-label-sm',
                    isActive && 'font-medium text-secondary',
                    !isActive && 'text-muted',
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </nav>
    )
  }

  if (variant === 'centered') {
    return (
      <nav
        aria-label="Envelope creation progress"
        className={cn('mx-auto flex w-full max-w-3xl items-center', className)}
      >
        {WIZARD_STEP_LABELS.map((label, index) => {
          const step = (index + 1) as typeof currentStep
          const isComplete = step < currentStep
          const isActive = step === currentStep
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm',
                    isActive && 'bg-primary text-on-primary ring-4 ring-primary-light',
                    isComplete && 'bg-secondary text-on-secondary',
                    !isActive && !isComplete && 'bg-surface-container-high text-on-surface-variant opacity-50',
                  )}
                >
                  {isComplete ? <MaterialIcon name="check" size={18} /> : step}
                </div>
                <span
                  className={cn(
                    'text-label-sm',
                    isActive && 'font-bold text-primary',
                    isComplete && 'text-secondary',
                    !isActive && !isComplete && 'text-on-surface-variant',
                  )}
                >
                  {SHORT_LABELS[index]}
                </span>
              </div>
              {index < WIZARD_STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    'mx-[-12px] mb-8 h-1 flex-1',
                    step < currentStep ? 'bg-secondary' : 'bg-outline-variant',
                  )}
                />
              )}
            </div>
          )
        })}
      </nav>
    )
  }

  // compact (step 3 editor header)
  return (
    <nav aria-label="Envelope creation progress" className={cn('flex items-center gap-2', className)}>
      {WIZARD_STEP_LABELS.map((label, index) => {
        const step = (index + 1) as typeof currentStep
        const isComplete = step < currentStep
        const isActive = step === currentStep
        return (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && <div className="h-px w-8 bg-border" />}
            <div
              className={cn(
                'flex items-center gap-2',
                !isActive && !isComplete && 'opacity-50',
                isActive && 'font-bold text-secondary',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive && 'bg-secondary text-on-secondary ring-2 ring-secondary ring-offset-2',
                  isComplete && 'bg-primary text-on-primary',
                  !isActive && !isComplete && 'bg-primary text-on-primary',
                )}
              >
                {step}
              </span>
              <span className="hidden text-label-sm lg:inline">{SHORT_LABELS[index]}</span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
