'use client'

import { useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { buildTextRuns, type PdfFontInfo, type PdfTextItem, type StyleSpan, type TextRun } from '@/lib/pdf-edit/text-runs'
import type { PageRule } from '@/lib/pdf-edit/text-fit'

export interface PageRuns {
  /** null when the page has too many text pieces to edit. */
  runs: TextRun[] | null
  /** The page's view box in PDF user space: [x0, y0, x1, y1]. */
  view: [number, number, number, number]
}

/**
 * Read every page's text from the already-loaded pdf.js document and group it
 * into editable runs (plan-full-text-rewrite §6). Pages are read one after
 * another in the background; a new document (e.g. after saving) starts over.
 */
export function useTextRuns(
  pdf: PDFDocumentProxy | null,
  enabled: boolean,
  /** Per page (index 0 = page 1), colours and styles read by the server. */
  styles?: ReadonlyArray<readonly StyleSpan[]> | null,
  /** Per page, the borders read by the server, for fitting longer replacements. */
  rules?: ReadonlyArray<readonly PageRule[]> | null,
) {
  const [pages, setPages] = useState<Record<number, PageRuns>>({})
  const [done, setDone] = useState(false)

  useEffect(() => {
    setPages({})
    setDone(false)
    if (!pdf || !enabled) return
    let cancelled = false

    ;(async () => {
      for (let number = 1; number <= pdf.numPages; number++) {
        try {
          const page = await pdf.getPage(number)
          const content = await page.getTextContent()
          const items = content.items.filter((item): item is PdfTextItem & typeof item => 'str' in item) as unknown as PdfTextItem[]
          // pdf.js names fonts "g_d0_f1"; the real name (and Type 3 flag) is on the loaded font object.
          try {
            await page.getOperatorList()
          } catch {
            // Fonts stay unnamed; classification falls back to the CSS family.
          }
          const fonts: Record<string, PdfFontInfo> = {}
          for (const key of new Set(items.map((item) => item.fontName))) {
            const style = (content.styles as Record<string, { fontFamily?: string }>)[key]
            try {
              const font = page.commonObjs.get(key) as { name?: string; isType3Font?: boolean } | undefined
              fonts[key] = { name: font?.name || style?.fontFamily || key, isType3: !!font?.isType3Font }
            } catch {
              fonts[key] = { name: style?.fontFamily || key }
            }
          }
          if (cancelled) return
          const view = page.view as [number, number, number, number]
          setPages((current) => ({ ...current, [number]: { runs: buildTextRuns(number, items, fonts, styles?.[number - 1], rules?.[number - 1], view), view } }))
        } catch {
          if (cancelled) return
          // A page that can't be read simply has no editable text.
        }
      }
      if (!cancelled) setDone(true)
    })()

    return () => {
      cancelled = true
    }
  }, [pdf, enabled, styles, rules])

  return { pages, done }
}
