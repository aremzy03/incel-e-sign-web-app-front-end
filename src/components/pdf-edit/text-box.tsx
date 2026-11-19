'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AddTextOp } from '@/lib/api/documents'
import { PLACEHOLDER_TEXT, DEFAULT_TEXT_WIDTH, fontCssFamily, textLineHeight } from '@/lib/pdf-edit/fonts'
import { clampPdfFrame } from '@/lib/pdf-edit/geometry'
import { TextEditToolbar } from './text-edit-toolbar'

function placeCaretAtEnd(node: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function insertNewline(node: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  if (!node.contains(range.startContainer)) return
  range.deleteContents()
  const newline = document.createTextNode('\n')
  range.insertNode(newline)
  range.setStartAfter(newline)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function measureRenderedBox(
  text: string,
  style: { family: string; sizePx: number; bold: boolean; italic: boolean },
  scaleX: number,
  scaleY: number,
  minWidthPt: number,
  maxWidthPt: number,
  fontSize: number,
  lockedWidthPt: number | null,
) {
  const mirror = document.createElement('div')
  mirror.style.position = 'fixed'
  mirror.style.left = '0'
  mirror.style.top = '0'
  mirror.style.visibility = 'hidden'
  mirror.style.pointerEvents = 'none'
  mirror.style.whiteSpace = 'pre'
  mirror.style.fontFamily = style.family
  mirror.style.fontSize = `${style.sizePx}px`
  mirror.style.fontWeight = style.bold ? '700' : '400'
  mirror.style.fontStyle = style.italic ? 'italic' : 'normal'
  mirror.style.lineHeight = '1.2'
  mirror.style.padding = '0 4px'
  mirror.style.width = 'max-content'
  mirror.textContent = text.length > 0 ? text : ' '
  document.body.appendChild(mirror)
  const caretPx = Math.ceil(style.sizePx * 0.75)
  let widthPx = mirror.offsetWidth + caretPx
  let heightPx = Math.max(mirror.offsetHeight, style.sizePx * 1.2)
  const capPx = (lockedWidthPt ?? maxWidthPt) * scaleX
  if (lockedWidthPt != null || widthPx > maxWidthPt * scaleX) {
    mirror.style.width = `${Math.max(1, capPx)}px`
    mirror.style.whiteSpace = 'pre-wrap'
    widthPx = Math.max(1, capPx)
    heightPx = Math.max(mirror.offsetHeight, style.sizePx * 1.2)
  }
  mirror.remove()
  const widthPt = Math.min(maxWidthPt, Math.max(minWidthPt, widthPx / scaleX))
  const lineCount = Math.max(1, text.split('\n').length)
  const heightPt = Math.max(heightPx / scaleY, lineCount * textLineHeight(fontSize)) + 2 / scaleY
  return { width: widthPt, height: heightPt, widthPx: widthPt * scaleX, heightPx: heightPt * scaleY }
}

const TextEditor = memo(function TextEditor({
  editorRef,
  selected,
  family,
  sizePx,
  bold,
  italic,
  color,
  align,
  onInput,
  onKeyDown,
  onFocus,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  family: string
  sizePx: number
  bold: boolean
  italic: boolean
  color: string
  align: AddTextOp['align']
  onInput: (event: React.FormEvent<HTMLDivElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onFocus: () => void
}) {
  return (
    <div
      ref={editorRef as React.Ref<HTMLDivElement>}
      role="textbox"
      aria-label="Added text"
      aria-multiline="true"
      // Always editable: one click focuses it and drops the caret where you clicked (focus selects the box).
      contentEditable
      suppressContentEditableWarning
      data-placeholder={PLACEHOLDER_TEXT}
      className="h-full w-full overflow-visible border border-secondary bg-surface-container-lowest/80 px-1 text-on-surface outline-none empty:before:text-muted empty:before:content-[attr(data-placeholder)]"
      style={{
        fontFamily: family,
        fontSize: `${sizePx}px`,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? 'italic' : 'normal',
        textAlign: align,
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        color,
      }}
      onFocus={onFocus}
      onInput={onInput}
      onKeyDown={onKeyDown}
    />
  )
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.family === next.family &&
  prev.sizePx === next.sizePx &&
  prev.bold === next.bold &&
  prev.italic === next.italic &&
  prev.color === next.color &&
  prev.align === next.align
)

interface TextBoxProps {
  op: AddTextOp
  css: { left: number; top: number; width: number; height: number }
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<AddTextOp>) => void
  onCommitGeometry: (patch: Partial<Pick<AddTextOp, 'x' | 'y' | 'width' | 'height'>>) => void
  onDelete: () => void
  metrics: { pageWidthPt: number; pageHeightPt: number; pageCssWidth: number; pageCssHeight: number }
  pointerScale?: number
}

export function TextBox({
  op,
  css,
  selected,
  onSelect,
  onChange,
  onCommitGeometry,
  onDelete,
  metrics,
  pointerScale = 1,
}: TextBoxProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [liveCss, setLiveCss] = useState(css)
  const dragRef = useRef<{
    kind: 'move' | 'resize'
    startX: number
    startY: number
    origin: { left: number; top: number; width: number; height: number }
    latest: { left: number; top: number; width: number; height: number }
  } | null>(null)
  const widthLockRef = useRef<number | null>(null)
  const sizedOnOpenRef = useRef(false)

  useEffect(() => {
    setLiveCss(css)
  }, [css.left, css.top, css.width, css.height])

  useLayoutEffect(() => {
    const node = editorRef.current
    if (!node) return
    const dom = node.textContent ?? ''
    if (dom === op.text) return
    const focused = document.activeElement === node
    if (focused && dom.length > op.text.length) return
    node.textContent = op.text
    node.scrollLeft = 0
    node.scrollTop = 0
    if (focused) placeCaretAtEnd(node)
  }, [op.text, op.opId])

  useEffect(() => {
    if (!selected || !editorRef.current) return
    editorRef.current.focus()
  }, [selected, op.opId])

  const toPoints = (box: { left: number; top: number; width: number; height: number }) => {
    const scaleX = metrics.pageWidthPt / metrics.pageCssWidth
    const scaleY = metrics.pageHeightPt / metrics.pageCssHeight
    return clampPdfFrame(
      {
        x: box.left * scaleX,
        y: box.top * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY,
      },
      metrics.pageWidthPt,
      metrics.pageHeightPt,
      DEFAULT_TEXT_WIDTH,
      textLineHeight(op.fontSize),
    )
  }

  const fontSizePx = (op.fontSize / metrics.pageHeightPt) * metrics.pageCssHeight
  const fontFamily = fontCssFamily(op.font)

  const fittedFrame = (text: string) => {
    if (!metrics.pageCssWidth || !metrics.pageCssHeight || !fontSizePx) return null
    const scaleX = metrics.pageCssWidth / metrics.pageWidthPt
    const scaleY = metrics.pageCssHeight / metrics.pageHeightPt
    const maxWidth = Math.max(DEFAULT_TEXT_WIDTH, metrics.pageWidthPt - op.x)
    return measureRenderedBox(
      text,
      { family: fontFamily, sizePx: fontSizePx, bold: op.bold, italic: op.italic },
      scaleX,
      scaleY,
      Math.min(DEFAULT_TEXT_WIDTH, maxWidth),
      maxWidth,
      op.fontSize,
      widthLockRef.current,
    )
  }

  const publishText = (text: string) => {
    const fitted = fittedFrame(text)
    const node = editorRef.current
    if (fitted && node?.parentElement) {
      node.parentElement.style.width = `${fitted.widthPx}px`
      node.parentElement.style.height = `${fitted.heightPx}px`
      node.scrollLeft = 0
      node.scrollTop = 0
    }
    if (!fitted) {
      onChange({ text })
      return
    }
    setLiveCss((current) => ({ ...current, width: fitted.widthPx, height: fitted.heightPx }))
    onChange({ text, width: fitted.width, height: fitted.height })
  }

  const publishRef = useRef(publishText)
  publishRef.current = publishText

  const onEditorInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    publishRef.current(event.currentTarget.textContent ?? '')
  }, [])

  const onEditorFocus = useCallback(() => {
    onSelect()
  }, [onSelect])

  const onEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    insertNewline(event.currentTarget)
    publishRef.current(event.currentTarget.textContent ?? '')
  }, [])

  useEffect(() => {
    if (dragRef.current) return
    if (!sizedOnOpenRef.current) {
      sizedOnOpenRef.current = true
      if (op.width > DEFAULT_TEXT_WIDTH + 0.5) widthLockRef.current = op.width
    }
    const fitted = fittedFrame(op.text)
    if (!fitted) return
    if (Math.abs(fitted.width - op.width) < 0.5 && Math.abs(fitted.height - op.height) < 0.5) return
    onCommitGeometry({ width: fitted.width, height: fitted.height })
  }, [op.text, op.font, op.fontSize, op.bold, op.italic, op.width, op.height, op.x, metrics.pageCssWidth, metrics.pageCssHeight, metrics.pageWidthPt, metrics.pageHeightPt])

  const onPointerDown = (kind: 'move' | 'resize') => (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    onSelect()
    dragRef.current = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      origin: liveCss,
      latest: liveCss,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const scale = pointerScale || 1
    const dx = (event.clientX - drag.startX) / scale
    const dy = (event.clientY - drag.startY) / scale
    const next =
      drag.kind === 'move'
        ? {
            left: drag.origin.left + dx,
            top: drag.origin.top + dy,
            width: drag.origin.width,
            height: drag.origin.height,
          }
        : {
            left: drag.origin.left,
            top: drag.origin.top,
            width: Math.max(8, drag.origin.width + dx),
            height: Math.max(8, drag.origin.height + dy),
          }
    drag.latest = next
    setLiveCss(next)
  }

  const onPointerUp = () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const points = toPoints(drag.latest)
    if (drag.kind === 'resize') widthLockRef.current = points.width
    onCommitGeometry(points)
  }

  return (
    <div
      className="absolute"
      style={{ left: liveCss.left, top: liveCss.top, width: liveCss.width, height: liveCss.height }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {selected ? <TextEditToolbar op={op} onChange={onChange} onDelete={onDelete} /> : null}
      <div
        // Drag strip: the gap above the box and its top border, clear of the text so a click there types.
        className="absolute inset-x-0 -top-2 z-10 h-2.5 cursor-move touch-none"
        onPointerDown={onPointerDown('move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <TextEditor
        editorRef={editorRef}
        selected={selected}
        family={fontFamily}
        sizePx={fontSizePx}
        bold={op.bold}
        italic={op.italic}
        color={op.color}
        align={op.align}
        onInput={onEditorInput}
        onKeyDown={onEditorKeyDown}
        onFocus={onEditorFocus}
      />
      {selected ? (
        <button
          type="button"
          aria-label="Resize text box"
          className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize touch-none bg-secondary before:absolute before:-inset-2 before:content-['']"
          onPointerDown={onPointerDown('resize')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      ) : null}
    </div>
  )
}
