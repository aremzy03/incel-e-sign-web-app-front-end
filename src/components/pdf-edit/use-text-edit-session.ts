'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TextSessionOp,
  commitTextEdits,
  discardTextEditSession,
  openTextEditSession,
  saveTextEditSession,
  TextEditSession,
  textEditErrorCopy,
} from '@/lib/api/documents'

const UNDO_LIMIT = 50

function opsKey(ops: TextSessionOp[]) {
  return JSON.stringify([...ops].sort((a, b) => a.opId.localeCompare(b.opId)))
}

export function useTextEditSession(documentId: string) {
  const [session, setSession] = useState<TextEditSession | null>(null)
  const [ops, setOps] = useState<TextSessionOp[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ reason: string; message: string } | null>(null)
  const [restoreOffer, setRestoreOffer] = useState<TextEditSession | null>(null)
  const [savedKey, setSavedKey] = useState('[]')
  const [autosaveError, setAutosaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [baseChanged, setBaseChanged] = useState(false)
  const undoStack = useRef<TextSessionOp[][]>([])
  const redoStack = useRef<TextSessionOp[][]>([])
  const opsRef = useRef(ops)
  opsRef.current = ops
  const savedKeyRef = useRef(savedKey)
  savedKeyRef.current = savedKey
  const baseChangedRef = useRef(baseChanged)
  baseChangedRef.current = baseChanged
  /** The file this tab's edits are drawn on: the session's base, or the file a save just produced. */
  const expectedBaseRef = useRef<string | null>(null)
  if (session?.base_file_url && !expectedBaseRef.current) expectedBaseRef.current = session.base_file_url
  const reopeningRef = useRef(false)

  /**
   * The server session closed under this tab (saved or discarded elsewhere, or reopening after
   * a save failed). Open a new one and keep the user's edits: autosave then saves them to it.
   * Only when the document is still the file they were editing; otherwise it's a base change.
   */
  const reopenClosedSession = useCallback(async () => {
    if (reopeningRef.current) return
    reopeningRef.current = true
    try {
      const reopened = await openTextEditSession(documentId)
      if (expectedBaseRef.current && reopened.base_file_url !== expectedBaseRef.current) {
        setBaseChanged(true)
        setAutosaveError(textEditErrorCopy({ response: { data: { reason: 'base_changed' } } }).message)
        return
      }
      expectedBaseRef.current = reopened.base_file_url
      setSavedKey('[]') // the new session holds nothing yet: the current edits are unsaved
      setSession(reopened)
      setAutosaveError(null)
    } catch {
      setAutosaveError('Couldn’t save draft')
    } finally {
      reopeningRef.current = false
    }
  }, [documentId])

  const dirty = useMemo(() => opsKey(ops) !== savedKey, [ops, savedKey])

  const replaceOps = useCallback((next: TextSessionOp[] | ((current: TextSessionOp[]) => TextSessionOp[]), recordHistory = true) => {
    setOps((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      if (recordHistory) {
        undoStack.current = [...undoStack.current, current].slice(-UNDO_LIMIT)
        redoStack.current = []
      }
      return resolved
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    openTextEditSession(documentId)
      .then((opened) => {
        if (cancelled) return
        setSession(opened)
        if (opened.ops.length > 0) {
          setRestoreOffer(opened)
          setOps([])
          setSavedKey('[]')
        } else {
          setOps([])
          setSavedKey('[]')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(textEditErrorCopy(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [documentId])

  useEffect(() => {
    // Don't overwrite a saved draft the user hasn't decided to restore or drop yet.
    if (!dirty || baseChanged || !session || restoreOffer) return
    const handle = window.setTimeout(() => {
      const snapshot = opsRef.current
      if (opsKey(snapshot) === savedKeyRef.current) return
      saveTextEditSession(documentId, snapshot)
        .then((updated) => {
          if (opsKey(opsRef.current) !== opsKey(snapshot)) return
          setSavedKey(opsKey(snapshot))
          // Autosave responses don't repeat the page styles read when the session opened.
          setSession((previous) => ({
            ...updated,
            text_styles: updated.text_styles ?? previous?.text_styles,
            text_rules: updated.text_rules ?? previous?.text_rules,
          }))
          setAutosaveError(null)
        })
        .catch((err) => {
          const copy = textEditErrorCopy(err)
          if (copy.reason === 'base_changed') {
            setBaseChanged(true)
            setAutosaveError(copy.message)
            return
          }
          if (copy.reason === 'session_closed') {
            void reopenClosedSession()
            return
          }
          setAutosaveError('Couldn’t save draft')
        })
    }, 1000)
    return () => window.clearTimeout(handle)
  }, [dirty, baseChanged, session, documentId, ops, restoreOffer, reopenClosedSession])

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  const acceptRestore = useCallback(() => {
    if (!restoreOffer) return
    setOps(restoreOffer.ops)
    setSavedKey(opsKey(restoreOffer.ops))
    setRestoreOffer(null)
  }, [restoreOffer])

  const dismissRestore = useCallback(() => {
    setRestoreOffer(null)
  }, [])

  const undo = useCallback(() => {
    setOps((current) => {
      const previous = undoStack.current.pop()
      if (!previous) return current
      redoStack.current.push(current)
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    setOps((current) => {
      const next = redoStack.current.pop()
      if (!next) return current
      undoStack.current.push(current)
      return next
    })
  }, [])

  /** Commit the session's ops, or `override` when the caller has pruned them. */
  const commit = useCallback(async (override?: TextSessionOp[]) => {
    setSaving(true)
    try {
      const ops = override ?? opsRef.current
      let result
      try {
        result = await commitTextEdits(documentId, ops)
      } catch (err) {
        // The session closed under this tab: open a new one on the same file and save once more.
        if (textEditErrorCopy(err).reason !== 'session_closed') throw err
        const reopened = await openTextEditSession(documentId)
        if (expectedBaseRef.current && reopened.base_file_url !== expectedBaseRef.current) {
          setBaseChanged(true)
          throw err
        }
        setSession(reopened)
        result = await commitTextEdits(documentId, ops)
      }
      setSavedKey(opsKey([]))
      setOps([])
      setSelectedId(null)
      undoStack.current = []
      redoStack.current = []
      // Commit closes the server session. Open a new one on the new file so the next
      // edit can autosave and save again in this visit (and gets that file's styles).
      // Edits from here on are drawn on the file this save produced.
      expectedBaseRef.current = result.file_url
      let reopened: TextEditSession | null = null
      for (let attempt = 0; attempt < 2 && !reopened; attempt += 1) {
        try {
          reopened = await openTextEditSession(documentId)
        } catch {
          // A second try covers a brief failure; after that, the next autosave recovers
          // (it gets session_closed and reopens).
        }
      }
      if (reopened) {
        expectedBaseRef.current = reopened.base_file_url
        setSession(reopened)
        setRestoreOffer(null)
      }
      return result
    } catch (err) {
      // The caller reports the failure; `error` is reserved for "couldn't open".
      if (textEditErrorCopy(err).reason === 'base_changed') setBaseChanged(true)
      throw err
    } finally {
      setSaving(false)
    }
  }, [documentId])

  const discard = useCallback(async () => {
    await discardTextEditSession(documentId)
    setOps([])
    setSavedKey('[]')
  }, [documentId])

  return {
    session,
    ops,
    setOps: replaceOps,
    selectedId,
    setSelectedId,
    loading,
    error,
    dirty,
    saving,
    autosaveError,
    baseChanged,
    restoreOffer,
    acceptRestore,
    dismissRestore,
    undo,
    redo,
    commit,
    discard,
  }
}
