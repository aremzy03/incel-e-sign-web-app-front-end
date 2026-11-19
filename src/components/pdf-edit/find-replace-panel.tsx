'use client'

import { useEffect, useRef } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

export interface FindReplacePanelProps {
  query: string
  replacement: string
  matchCase: boolean
  /** Matches in the text read so far. */
  matchCount: number
  /** 0-based index of the highlighted match, or -1. */
  currentIndex: number
  /** Pages are still being read, so counts may grow. */
  reading: boolean
  status?: string | null
  onQueryChange: (value: string) => void
  onReplacementChange: (value: string) => void
  onMatchCaseChange: (value: boolean) => void
  onFindNext: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onClose: () => void
}

const inputClass =
  'h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface placeholder:text-muted focus:border-status-your-turn focus:outline-none focus:ring-2 focus:ring-status-your-turn/20'
const buttonClass =
  'flex h-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-label-sm font-medium text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'

/** Find & replace over the document's existing text (plan-full-text-rewrite §4.3). */
export function FindReplacePanel({
  query,
  replacement,
  matchCase,
  matchCount,
  currentIndex,
  reading,
  status,
  onQueryChange,
  onReplacementChange,
  onMatchCaseChange,
  onFindNext,
  onReplace,
  onReplaceAll,
  onClose,
}: FindReplacePanelProps) {
  const queryRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    queryRef.current?.focus()
  }, [])

  const hasQuery = query.trim().length > 0
  const countLabel = !hasQuery
    ? reading
      ? 'Reading the document’s text…'
      : 'Type the text to find.'
    : matchCount === 0
      ? reading
        ? 'No matches yet. Still reading…'
        : 'No matches.'
      : `${currentIndex >= 0 ? `${currentIndex + 1} of ` : ''}${matchCount} ${matchCount === 1 ? 'match' : 'matches'}${reading ? ' so far' : ''}`

  return (
    <section
      aria-labelledby="find-replace-title"
      className="space-y-3 rounded-xl border border-border bg-surface-container-low p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="flex items-center justify-between">
        <h3 id="find-replace-title" className="font-label-sm text-on-surface">
          Find & replace
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close find and replace"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn"
        >
          <MaterialIcon name="close" size={18} />
        </button>
      </div>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          onFindNext()
        }}
      >
        <label className="block">
          <span className="sr-only">Find</span>
          <input
            ref={queryRef}
            type="search"
            className={inputClass}
            placeholder="Find"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="sr-only">Replace with</span>
          <input
            type="text"
            className={inputClass}
            placeholder="Replace with"
            value={replacement}
            onChange={(event) => onReplacementChange(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-on-surface">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(event) => onMatchCaseChange(event.target.checked)}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          Match case
        </label>
        <p className="text-xs text-muted" aria-live="polite">
          {countLabel}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" className={buttonClass} disabled={!hasQuery || matchCount === 0}>
            Find next
          </button>
          <button type="button" className={buttonClass} disabled={!hasQuery || matchCount === 0} onClick={onReplace}>
            Replace
          </button>
          <button
            type="button"
            className={cn(buttonClass, 'col-span-2 border-primary bg-primary text-on-primary hover:bg-primary-hover')}
            disabled={!hasQuery || matchCount === 0}
            onClick={onReplaceAll}
          >
            Replace all
          </button>
        </div>
        {status ? (
          <p className="text-xs text-on-surface" role="status">
            {status}
          </p>
        ) : null}
      </form>
    </section>
  )
}
