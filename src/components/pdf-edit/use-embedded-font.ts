'use client'

import { useEffect, useState } from 'react'
import { fetchTextEditFont } from '@/lib/api/documents'

/**
 * The PDF's own embedded fonts, loaded into the browser so typed replacement text
 * previews in the exact face the server will reuse on save (Arial Black, not a bold
 * stand-in). Each font is fetched once per document version, and only when a run
 * that uses it is edited.
 *
 * Embedded fonts are often subsets: letters the subset lacks fall back, per
 * character, to the rest of the CSS stack (the installed font, then Liberation),
 * which is also what the server does on save.
 */

const loaded = new Map<string, Promise<string | null>>()

function shortHash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export interface EmbeddedFontSource {
  documentId: string
  /** The file the session edits (its base URL): font ids belong to that file. */
  fileUrl: string
}

/** CSS family name of the loaded font, or null when it can't be loaded. Cached per document version. */
export function loadEmbeddedFont(source: EmbeddedFontSource, fontId: string): Promise<string | null> {
  // Signed URLs change their query on every request; the path identifies the file.
  const version = shortHash(source.fileUrl.split('?')[0])
  const key = `${source.documentId}|${version}|${fontId}`
  let pending = loaded.get(key)
  if (!pending) {
    const family = `pdf-embedded-${shortHash(key)}`
    pending = fetchTextEditFont(source.documentId, fontId, version)
      .then(async (data) => {
        if (typeof FontFace === 'undefined') return null
        // One face for every weight and style: the program already is the right weight
        // (Arial Black), so the browser mustn't pick another face or fake-bold it.
        const face = new FontFace(family, data, { weight: '1 1000', display: 'swap' })
        await face.load()
        document.fonts.add(face)
        return family
      })
      .catch(() => null)
    loaded.set(key, pending)
  }
  return pending
}

/** The loaded family for a run's embedded font; null until it loads, or when there is none. */
export function useEmbeddedFont(source: EmbeddedFontSource | undefined, fontId: string | undefined): string | null {
  const [family, setFamily] = useState<string | null>(null)
  useEffect(() => {
    setFamily(null)
    if (!source || !fontId) return
    let cancelled = false
    loadEmbeddedFont(source, fontId).then((name) => {
      if (!cancelled) setFamily(name)
    })
    return () => {
      cancelled = true
    }
  }, [source?.documentId, source?.fileUrl, fontId]) // eslint-disable-line react-hooks/exhaustive-deps
  return family
}

const coverage = new Map<string, boolean>()
let probe: CanvasRenderingContext2D | null | undefined

/**
 * Whether the loaded embedded font draws every character of `text` itself. The
 * server reuses the PDF's font only when it does, and otherwise draws the whole run
 * in Liberation; the preview has to follow so it measures what will be saved.
 *
 * A missing glyph falls back to the next font in the stack, so the same character
 * measured with two very different fallbacks only comes out the same width when the
 * embedded font has it.
 */
export function embeddedFontCovers(family: string, text: string): boolean {
  if (probe === undefined) {
    try {
      probe = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
    } catch {
      probe = null
    }
  }
  if (!probe) return true
  for (const char of new Set(text.replace(/\s/g, ''))) {
    const key = `${family}|${char}`
    let covered = coverage.get(key)
    if (covered === undefined) {
      probe.font = `40px '${family}', monospace`
      const mono = probe.measureText(char).width
      probe.font = `40px '${family}', serif`
      covered = mono === probe.measureText(char).width
      coverage.set(key, covered)
    }
    if (!covered) return false
  }
  return true
}
