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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-sm">{icon}</span>
        </div>
        <Input
          className={cn('pl-10', className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
InputWithIcon.displayName = 'InputWithIcon'

export { InputWithIcon }
