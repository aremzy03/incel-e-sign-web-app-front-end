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
          setAutosaveError('Couldn’t save draft')
        })
    }, 1000)
    return () => window.clearTimeout(handle)
  }, [dirty, baseChanged, session, documentId, ops, restoreOffer])

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
      const result = await commitTextEdits(documentId, override ?? opsRef.current)
      setSavedKey(opsKey([]))
      setOps([])
      setSelectedId(null)
      undoStack.current = []
      redoStack.current = []
      // Commit closes the server session. Open a new one on the new file so the next
      // edit can autosave and save again in this visit (and gets that file's styles).
      try {
        setSession(await openTextEditSession(documentId))
        setRestoreOffer(null)
      } catch {
        // Keep the old session; the next save reports the problem.
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
