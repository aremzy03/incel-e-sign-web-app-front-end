'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { MaterialIcon } from '@/components/ui/material-icon'
import { StatusBadge } from '@/components/library/status-badge'
import {
  SEARCH_MIN_LENGTH,
  globalSearch,
  type DocumentSearchHit,
  type EnvelopeSearchHit,
} from '@/lib/api/search'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 250

type Option =
  | { kind: 'envelope'; hit: EnvelopeSearchHit; href: string }
  | { kind: 'document'; hit: DocumentSearchHit; href: string }
  | { kind: 'all-envelopes'; href: string; label: string }
  | { kind: 'all-documents'; href: string; label: string }

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (!query || index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent-light px-0.5 text-on-surface">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

function envelopeSubtitle(hit: EnvelopeSearchHit, query: string) {
  const who = hit.is_self_sign ? 'Self-signed' : hit.role === 'creator' ? 'You sent this' : 'Sent to you'
  const matchedDoc =
    hit.matched_on === 'document'
      ? hit.document_names.find((name) => name.toLowerCase().includes(query.toLowerCase()))
      : null
  return matchedDoc ? `${who} · contains ${matchedDoc}` : who
}

interface GlobalSearchProps {
  className?: string
  autoFocus?: boolean
  /** Called after a result is opened or Escape is pressed (mobile closes its overlay). */
  onDone?: () => void
}

/**
 * Topbar search across the envelopes and documents the user can open.
 * A combobox: type to search, arrows to move, Enter to open, Escape to close.
 * Ctrl/⌘+K or "/" focuses it from anywhere in the dashboard.
 */
export function GlobalSearch({ className, autoFocus, onDone }: GlobalSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl K')

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setShortcutLabel('⌘K')
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(value.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [value])

  const enabled = query.length >= SEARCH_MIN_LENGTH
  const { data, isFetching, isError } = useQuery({
    queryKey: ['global-search', query],
    queryFn: ({ signal }) => globalSearch(query, { signal }),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const options: Option[] = useMemo(() => {
    if (!enabled || !data) return []
    const list: Option[] = []
    for (const hit of data.envelopes) list.push({ kind: 'envelope', hit, href: `/dashboard/envelopes/${hit.id}` })
    if (data.totals.envelopes > data.envelopes.length) {
      list.push({
        kind: 'all-envelopes',
        href: `/dashboard/envelopes?search=${encodeURIComponent(query)}`,
        label: `See all ${data.totals.envelopes} envelopes`,
      })
    }
    for (const hit of data.documents) list.push({ kind: 'document', hit, href: `/dashboard/documents/${hit.id}` })
    if (data.totals.documents > data.documents.length) {
      list.push({
        kind: 'all-documents',
        href: `/dashboard/documents?search=${encodeURIComponent(query)}`,
        label: `See all ${data.totals.documents} documents`,
      })
    }
    return list
  }, [data, enabled, query])

  useEffect(() => setActiveIndex(options.length > 0 ? 0 : -1), [options])

  // Close when navigating elsewhere.
  useEffect(() => setOpen(false), [pathname])

  // Ctrl/⌘+K anywhere, or "/" when not typing, focuses the search.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const go = (option: Option) => {
    setOpen(false)
    setValue('')
    setQuery('')
    router.push(option.href)
    onDone?.()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (options.length ? (i + 1) % options.length : -1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (options.length ? (i - 1 + options.length) % options.length : -1))
    } else if (event.key === 'Enter') {
      const option = options[activeIndex]
      if (open && option) {
        event.preventDefault()
        go(option)
      }
    } else if (event.key === 'Escape') {
      if (open && value) {
        setOpen(false)
      } else {
        setValue('')
        inputRef.current?.blur()
        onDone?.()
      }
    }
  }

  const showPanel = open && value.trim().length > 0
  const tooShort = value.trim().length < SEARCH_MIN_LENGTH
  const optionId = (index: number) => `${listboxId}-option-${index}`

  const renderOption = (option: Option, index: number) => {
    const active = index === activeIndex
    const base = cn(
      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left',
      active ? 'bg-surface-container' : 'hover:bg-surface-container-low',
    )
    const common = {
      id: optionId(index),
      role: 'option' as const,
      'aria-selected': active,
      className: base,
      onMouseEnter: () => setActiveIndex(index),
      // Keep focus in the input so typing continues after a hover.
      onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
      onClick: () => go(option),
    }
    if (option.kind === 'envelope') {
      return (
        <li key={option.hit.id} {...common}>
          <MaterialIcon name="mail" size={20} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium text-on-surface">
              <Highlight text={option.hit.name || 'Untitled envelope'} query={query} />
            </span>
            <span className="block truncate text-xs text-muted">{envelopeSubtitle(option.hit, query)}</span>
          </span>
          <StatusBadge status={option.hit.is_self_sign ? 'self-signed' : option.hit.status} showDot={false} className="shrink-0 px-2 py-0.5" />
        </li>
      )
    }
    if (option.kind === 'document') {
      return (
        <li key={option.hit.id} {...common}>
          <MaterialIcon name="description" size={20} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-on-surface">
            <Highlight text={option.hit.file_name} query={query} />
          </span>
          <StatusBadge status={option.hit.status} showDot={false} className="shrink-0 px-2 py-0.5" />
        </li>
      )
    }
    return (
      <li key={option.kind} {...common}>
        <MaterialIcon name="arrow_forward" size={18} className="shrink-0 text-your-turn-text" />
        <span className="text-body-sm font-medium text-your-turn-text">{option.label}</span>
      </li>
    )
  }

  const envelopeOptions = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => option.kind === 'envelope' || option.kind === 'all-envelopes')
  const documentOptions = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => option.kind === 'document' || option.kind === 'all-documents')

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <MaterialIcon
        name={isFetching && enabled ? 'progress_activity' : 'search'}
        size={20}
        className={cn(
          'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted',
          isFetching && enabled && 'animate-spin motion-reduce:animate-none',
        )}
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Search envelopes and documents"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        placeholder="Search documents, envelopes..."
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-14 text-sm text-on-surface placeholder:text-muted focus:border-status-your-turn focus:outline-none focus:ring-2 focus:ring-status-your-turn/20 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-xs text-muted lg:block">
        {shortcutLabel}
      </kbd>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,32rem)] overflow-y-auto rounded-xl border border-border bg-surface-container-lowest p-2 shadow-raised">
          {tooShort ? (
            <p className="px-3 py-2 text-body-sm text-muted">Type at least {SEARCH_MIN_LENGTH} characters.</p>
          ) : isError ? (
            <p className="px-3 py-2 text-body-sm text-error-text">Search isn’t available right now. Try again.</p>
          ) : !data && isFetching ? (
            <p className="px-3 py-2 text-body-sm text-muted">Searching…</p>
          ) : options.length === 0 && data ? (
            <p className="px-3 py-2 text-body-sm text-muted">
              Nothing matches “{query}”. Try a document name, envelope name or signer.
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Search results" className="space-y-3">
              {envelopeOptions.length > 0 ? (
                <li role="presentation">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Envelopes</p>
                  <ul role="group" aria-label="Envelopes" className="space-y-0.5">
                    {envelopeOptions.map(({ option, index }) => renderOption(option, index))}
                  </ul>
                </li>
              ) : null}
              {documentOptions.length > 0 ? (
                <li role="presentation">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Documents</p>
                  <ul role="group" aria-label="Documents" className="space-y-0.5">
                    {documentOptions.map(({ option, index }) => renderOption(option, index))}
                  </ul>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
