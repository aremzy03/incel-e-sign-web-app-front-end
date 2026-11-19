/**
 * Find & replace over the text runs the editor already read (plan-full-text-rewrite §4.3, §9).
 *
 * Nothing is searched on the server. A run matches when its *current* text
 * (the pending replacement if it has one, else the original) contains the
 * query. Replacing turns the run into an `edit_text` op (or updates the one it
 * has); its delete box stays the original glyph box, so replacing twice before
 * saving edits the same op rather than stacking deletions.
 */

import type { TextRun } from '@/lib/pdf-edit/text-runs'

/** Replace all stops here; above it the panel asks for a narrower query (same cap as added-text boxes). */
export const REPLACE_ALL_LIMIT = 200

export interface FindOptions {
  matchCase: boolean
}

/** Simple lower-casing: Turkish dotted/dotless i is inexact, by design for the first version (plan §9). */
const fold = (value: string, matchCase: boolean) => (matchCase ? value : value.toLowerCase())

export function containsQuery(text: string, query: string, { matchCase }: FindOptions): boolean {
  if (!query) return false
  return fold(text, matchCase).includes(fold(query, matchCase))
}

/** Replace every occurrence of `query` in `text`, keeping the rest of the text as it was. */
export function replaceInText(text: string, query: string, replacement: string, { matchCase }: FindOptions): string {
  if (!query) return text
  const haystack = fold(text, matchCase)
  const needle = fold(query, matchCase)
  let result = ''
  let from = 0
  for (let at = haystack.indexOf(needle, from); at !== -1; at = haystack.indexOf(needle, from)) {
    result += text.slice(from, at) + replacement
    from = at + query.length
  }
  return result + text.slice(from)
}

/**
 * Runs whose current text contains the query, in reading order (page, then top to
 * bottom, then left to right). Locked runs never match: they can't be edited.
 */
export function findMatches(
  runs: TextRun[],
  currentText: (run: TextRun) => string,
  query: string,
  options: FindOptions,
): TextRun[] {
  if (!query.trim()) return []
  return runs.filter((run) => !run.locked && containsQuery(currentText(run), query, options))
}

/** Every page's runs flattened into reading order. */
export function runsInReadingOrder(pages: Record<number, { runs: TextRun[] | null }>): TextRun[] {
  return Object.keys(pages)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((number) => pages[number].runs ?? [])
}
