import * as React from 'react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Input } from './input'

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  inputSize?: 'md' | 'lg'
  invalid?: boolean
  containerClassName?: string
  hidePasswordToggle?: boolean
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  (
    {
      className,
      icon,
      iconRight,
      inputSize = 'md',
      invalid = false,
      containerClassName,
      hidePasswordToggle = false,
      type = 'text',
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword && showPassword ? 'text' : type

    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-white transition-all',
          'focus-within:border-status-your-turn focus-within:ring-2 focus-within:ring-status-your-turn/20',
          invalid
            ? 'border-error focus-within:border-error focus-within:ring-error/20'
            : 'border-outline-variant',
          disabled && 'cursor-not-allowed opacity-60',
          containerClassName,
        )}
      >
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
            {icon}
          </div>
        ) : null}
        <Input
          className={cn(
            'border-0 bg-transparent focus-visible:border-transparent focus-visible:ring-0',
            inputSize === 'lg' ? 'h-12 text-base' : 'h-11 text-sm',
            icon && 'pl-12',
            (iconRight || isPassword) && 'pr-12',
            className
          )}
          ref={ref}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={invalid}
          {...props}
        />
        {(iconRight || (isPassword && !hidePasswordToggle)) ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isPassword && !hidePasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="rounded-md p-1 text-muted transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn/30"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <MaterialIcon
                  name={showPassword ? 'visibility_off' : 'visibility'}
                  size={20}
                />
              </button>
            ) : (
              <div className="text-muted">{iconRight}</div>
            )}
          </div>
        ) : null}
      </div>
    )
  }
)
InputWithIcon.displayName = 'InputWithIcon'

export { InputWithIcon }
