import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-outline-variant bg-transparent px-4 py-3.5 text-body-base text-on-surface",
          "placeholder:text-muted/60",
          "focus-visible:outline-none focus-visible:border-status-your-turn focus-visible:ring-2 focus-visible:ring-status-your-turn/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
