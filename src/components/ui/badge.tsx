import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-label-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-status-your-turn focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-on-primary hover:bg-primary-hover",
        secondary:
          "border-transparent bg-secondary text-on-secondary hover:bg-accent-hover",
        destructive:
          "border-transparent bg-error text-on-error hover:bg-error/90",
        outline: "text-on-surface border-outline-variant",
        draft:
          "border-transparent bg-surface text-status-draft-text",
        pending:
          "border-transparent bg-warning-light text-warning-text",
        completed:
          "border-transparent bg-success-light text-success-text",
        rejected:
          "border-transparent bg-error-light text-error-text",
        yourTurn:
          "border-transparent bg-accent-light text-your-turn-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
