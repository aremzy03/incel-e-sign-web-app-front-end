import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative input-focus-effect border border-outline-variant rounded-xl transition-all overflow-hidden">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
          {icon}
        </div>
        <Input
          className={cn(
            'pl-12 border-0 focus-visible:ring-0 focus-visible:border-transparent',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
InputWithIcon.displayName = 'InputWithIcon'

export { InputWithIcon }
