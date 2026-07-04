"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CommandProps = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }

export function Command({ children, className, ...props }: CommandProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card", className)} {...props}>
      {children}
    </div>
  )
}

export function CommandInput({ value, onValueChange, placeholder }: { value?: string; onValueChange?: (v: string) => void; placeholder?: string }) {
  return (
    <div className="p-2 border-b border-border">
      <input
        value={value}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full outline-none text-body-sm text-on-surface placeholder:text-muted"
      />
    </div>
  )
}

export function CommandList({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <div className="p-3 text-body-sm text-muted">{children}</div>
}

export function CommandGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      {heading ? <div className="px-3 py-1 text-label-xs text-muted">{heading}</div> : null}
      <div>{children}</div>
    </div>
  )
}

export function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container-low text-on-surface">
      {children}
    </button>
  )
}
