"use client"

import * as React from "react"

type CommandProps = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }

export function Command({ children, className, ...props }: CommandProps) {
  return (
    <div className={`w-full bg-white ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

export function CommandInput({ value, onValueChange, placeholder }: { value?: string; onValueChange?: (v: string) => void; placeholder?: string }) {
  return (
    <div className="p-2 border-b">
      <input
        value={value}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full outline-none text-sm"
      />
    </div>
  )
}

export function CommandList({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <div className="p-3 text-sm text-gray-500">{children}</div>
}

export function CommandGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      {heading ? <div className="px-3 py-1 text-xs text-gray-500">{heading}</div> : null}
      <div>{children}</div>
    </div>
  )
}

export function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
      {children}
    </button>
  )
}


