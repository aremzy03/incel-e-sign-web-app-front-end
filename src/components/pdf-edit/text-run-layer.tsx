'use client'

import { memo, useEffect, useMemo, useRef } from 'react'
import type { EditTextOp } from '@/lib/api/documents'
import { RUN_LOCK_COPY, runCssBox, type TextRun } from '@/lib/pdf-edit/text-runs'
import { cn } from '@/lib/utils'
import { embeddedFontCovers, loadEmbeddedFont, useEmbeddedFont, type EmbeddedFontSource } from '@/components/pdf-edit/use-embedded-font'
import { liberationCss } from '@/lib/pdf-edit/fonts'
import { LINE_HEIGHT, canvasFontMetrics, canvasMeasure, fitText, type TextFit } from '@/lib/pdf-edit/text-fit'

interface TextRunLayerProps {
  runs: TextRun[]
  /** edit_text ops on this page, keyed by opId (= the run's runId). */
  edits: Record<string, EditTextOp>
  /** The page's view box in PDF user space ([x0, y0, x1, y1]). */
  view: readonly number[]
  /** Rendered CSS px per PDF point. */
  scale: number
  activeRunId: string | null
  failedOpIds: ReadonlySet<string>
  /** Runs matching the find & replace query, and the one currently highlighted. */
  matchRunIds?: ReadonlySet<string>
  currentMatchId?: string | null
  /** False while Add text is on or rewriting is unavailable: runs don't take clicks. */
  interactive: boolean
  onStartEdit: (run: TextRun) => void
  onChangeEdit: (opId: string, text: string) => void
  onFinishEdit: () => void
  /** Where to fetch the PDF's embedded fonts for an exact preview; omitted, the preview uses installed fonts. */
  fontSource?: EmbeddedFontSource
}

/**
 * Existing text as click targets (plan-full-text-rewrite §4.2, §6.2).
 *
 * Unedited runs are transparent: the canvas already draws the words. A run being
 * (or already) rewritten is an opaque white box that hides the canvas word and
 * shows the replacement at the original baseline. The white is only on screen;
 * the server deletes the old glyphs on save.
 */
export function TextRunLayer({
  runs,
  edits,
  view,
  scale,
  activeRunId,
  failedOpIds,
  matchRunIds,
  currentMatchId,
  interactive,
  onStartEdit,
  onChangeEdit,
  onFinishEdit,
  fontSource,
}: TextRunLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {runs.map((run) => {
        const edit = edits[run.runId]
        const box = runCssBox(run, view, scale)
        if (edit) {
          return (
            <EditedRun
              key={run.runId}
              run={run}
              edit={edit}
              box={box}
              scale={scale}
              active={activeRunId === run.runId}
              failed={failedOpIds.has(run.runId)}
              match={currentMatchId === run.runId ? 'current' : matchRunIds?.has(run.runId) ? 'match' : null}
              interactive={interactive}
              onActivate={() => onStartEdit(run)}
              onChange={(value) => onChangeEdit(run.runId, value)}
              onFinish={onFinishEdit}
              fontSource={fontSource}
            />
          )
        }
        const lockedCopy = run.locked ? RUN_LOCK_COPY[run.locked] : null
        const match = currentMatchId === run.runId ? 'current' : matchRunIds?.has(run.runId) ? 'match' : null
        return (
          <div
            key={run.runId}
            data-run-id={run.runId}
            role={lockedCopy ? undefined : 'button'}
            tabIndex={!interactive || lockedCopy ? -1 : 0}
            aria-label={lockedCopy ? undefined : `Edit “${run.text}”`}
            title={lockedCopy ?? 'Click to edit this text'}
            className={cn(
              'absolute rounded-[2px]',
              interactive ? 'pointer-events-auto' : 'pointer-events-none',
              // Find & replace highlights: translucent so the canvas word stays readable.
              match === 'current' && 'bg-warning/40 outline outline-2 outline-warning',
              match === 'match' && 'bg-warning/20',
              lockedCopy
                ? 'cursor-not-allowed'
                : 'cursor-text hover:bg-status-your-turn/10 hover:outline hover:outline-1 hover:outline-status-your-turn focus-visible:outline focus-visible:outline-2 focus-visible:outline-status-your-turn',
            )}
            style={box}
            // Start fetching the PDF's font on hover, so it is usually ready by the click.
            onPointerEnter={() => {
              if (fontSource && run.fontId && !lockedCopy) void loadEmbeddedFont(fontSource, run.fontId)
            }}
            onClick={(event) => {
              event.stopPropagation()
              if (!lockedCopy) onStartEdit(run)
            }}
            onKeyDown={(event) => {
              if (!lockedCopy && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onStartEdit(run)
              }
            }}
          />
        )
      })}
    </div>
  )
}

interface EditedRunProps {
  run: TextRun
  edit: EditTextOp
  box: { left: number; top: number; width: number; height: number }
  scale: number
  active: boolean
  failed: boolean
  match: 'current' | 'match' | null
  interactive: boolean
  onActivate: () => void
  onChange: (value: string) => void
  onFinish: () => void
  fontSource?: EmbeddedFontSource
}

const EditedRun = memo(function EditedRun({
  run,
  edit,
  box,
  scale,
  active,
  failed,
  match,
  interactive,
  onActivate,
  onChange,
  onFinish,
  fontSource,
}: EditedRunProps) {
  // The PDF's own font when it can be loaded; the installed font or Liberation meanwhile.
  const embeddedFamily = useEmbeddedFont(fontSource, run.fontId)
  const editorRef = useRef<HTMLSpanElement>(null)
  // What the save will draw with: the PDF's font when it has every letter typed, else
  // Liberation (the server's substitute). Until the PDF's font loads, the installed one.
  const family = embeddedFamily
    ? embeddedFontCovers(embeddedFamily, edit.text)
      ? `'${embeddedFamily}', ${run.font.css}`
      : liberationCss(run.font.family)
    : run.fontId
      ? run.font.css
      : liberationCss(run.font.family)
  const usesEmbedded = !!embeddedFamily && family.startsWith(`'${embeddedFamily}'`)
  const fontStyle = run.font.italic ? 'italic' : 'normal'

  // Laid out like the save will (text-fit.ts): kept in its slot by shrinking or wrapping,
  // pinned at its alignment. Older drafts have no slot: one line from the original start.
  const layout = useMemo(() => {
    const fit: TextFit = edit.fit ?? {
      left: run.remove.x,
      right: Number.MAX_SAFE_INTEGER,
      bottom: run.baseline.y,
      align: 'left',
      anchor: run.baseline.x,
    }
    const measure = canvasMeasure((size) => `${fontStyle} ${run.font.weight} ${size}px ${family}`)
    const result = fitText(edit.text, run.fontSize, run.baseline.y, fit, measure)
    const metrics = canvasFontMetrics(`${fontStyle} ${run.font.weight} 100px ${family}`)
    const overflow = edit.fit ? result.overflow : result.lines[0].width > run.remove.width + 4
    return { ...result, overflow, fit, metrics }
    // embeddedFamily: re-measure once the PDF's font has loaded.
  }, [edit.text, edit.fit, run, family, fontStyle, embeddedFamily]) // eslint-disable-line react-hooks/exhaustive-deps

  const sizePx = layout.size * scale
  const lineHeightPx = LINE_HEIGHT * sizePx
  // Put the first CSS baseline on the PDF baseline so the new glyphs sit where the old ones did.
  const ascent = layout.metrics.ascent * layout.size
  const descent = layout.metrics.descent * layout.size
  const baselineInLine = (LINE_HEIGHT * layout.size - ascent - descent) / 2 + ascent
  const wrapped = layout.mode === 'wrap'
  const blockX = wrapped
    ? layout.fit.align === 'right'
      ? layout.fit.left
      : layout.fit.align === 'center'
        ? layout.fit.anchor - Math.min(layout.fit.anchor - layout.fit.left, layout.fit.right - layout.fit.anchor)
        : layout.fit.anchor
    : layout.lines[0].x
  const blockWidth = wrapped
    ? layout.fit.align === 'center'
      ? 2 * Math.min(layout.fit.anchor - layout.fit.left, layout.fit.right - layout.fit.anchor)
      : layout.fit.align === 'right'
        ? layout.fit.anchor - layout.fit.left
        : layout.fit.right - layout.fit.anchor
    : undefined
  const blockLeft = box.left + (blockX - run.remove.x) * scale
  const blockTop = box.top + (run.remove.y + run.remove.height - run.baseline.y - baselineInLine) * scale
  const deleted = !edit.text.trim()
  const overflows = layout.overflow && !deleted
  const note = overflows
    ? 'Doesn’t fit here. It may overlap the text around it.'
    : layout.mode === 'shrink'
      ? `Shrunk to ${Math.round((layout.size / run.fontSize) * 100)}% to fit.`
      : wrapped
        ? `Wrapped onto ${layout.lines.length} lines to fit.`
        : null

  // Uncontrolled while typing: React re-rendering the text would move the caret.
  useEffect(() => {
    const node = editorRef.current
    if (!node) return
    if (node.textContent !== edit.text) node.textContent = edit.text
    if (active) {
      node.focus()
      const range = document.createRange()
      range.selectNodeContents(node)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    // Only when the box becomes active or the op is replaced (undo); not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, edit.opId])

  useEffect(() => {
    const node = editorRef.current
    if (node && !active && node.textContent !== edit.text) node.textContent = edit.text
  }, [edit.text, active])

  const activate = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!active) onActivate()
  }

  return (
    <>
      {/* Hides the original words on screen; the server deletes them on save. */}
      <div
        aria-hidden
        className={cn(
          'absolute bg-white',
          interactive ? 'pointer-events-auto' : 'pointer-events-none',
          deleted && !active && 'outline-dashed outline-1 outline-outline',
        )}
        style={box}
        onClick={activate}
      />
      <div
        className={cn(
          'absolute overflow-visible bg-white',
          interactive ? 'pointer-events-auto' : 'pointer-events-none',
          active
            ? overflows
              ? 'outline outline-2 outline-warning'
              : 'outline outline-2 outline-status-your-turn'
            : failed
              ? 'outline outline-2 outline-error'
              : match === 'current'
                ? 'outline outline-2 outline-warning'
                : overflows
                  ? 'outline-dashed outline-1 outline-warning'
                  : 'cursor-text hover:outline hover:outline-1 hover:outline-status-your-turn',
        )}
        data-run-id={run.runId}
        style={{ left: blockLeft, top: blockTop, width: blockWidth !== undefined ? blockWidth * scale : undefined }}
        title={
          failed
            ? 'This change couldn’t be saved. Undo it or try again.'
            : overflows
              ? 'Longer than the space it’s in. It may overlap the text around it.'
              : deleted
                ? 'Deleted text is covered with white.'
                : undefined
        }
        onClick={activate}
      >
        <span
          ref={editorRef}
          role="textbox"
          aria-label={`Replacement for “${run.text}”`}
          contentEditable={active}
          suppressContentEditableWarning
          spellCheck={false}
          className={cn('block outline-none', wrapped ? 'whitespace-pre-wrap' : 'whitespace-pre')}
          style={{
            color: run.color,
            fontFamily: family,
            fontWeight: run.font.weight,
            // The embedded program already has its weight; don't thicken it again.
            fontSynthesis: usesEmbedded ? 'none' : undefined,
            fontStyle,
            fontSize: sizePx,
            lineHeight: `${lineHeightPx}px`,
            textAlign: layout.fit.align,
            minWidth: wrapped ? undefined : Math.max(1, layout.lines[0].width * scale),
          }}
          onInput={(event) => onChange((event.currentTarget.textContent ?? '').replace(/\n/g, ' '))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          onBlur={onFinish}
        />
        {active && note ? (
          <span
            role="status"
            className={cn(
              'pointer-events-none absolute left-0 top-full mt-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs shadow-card',
              overflows ? 'bg-warning-light text-warning-text' : 'bg-surface-container-lowest text-muted',
            )}
          >
            {note}
          </span>
        ) : null}
      </div>
    </>
  )
})
