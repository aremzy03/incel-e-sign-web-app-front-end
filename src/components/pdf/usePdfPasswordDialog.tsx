'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type UpdatePasswordFn = (password: string) => void

export type PdfPasswordReason = 'need_password' | 'incorrect_password'

function reasonToText(reason?: PdfPasswordReason) {
  if (reason === 'incorrect_password') return 'That password is incorrect. Please try again.'
  return 'This PDF is password-protected. Enter the password to continue.'
}

/**
 * Wraps react-pdf/pdf.js `onPassword(updatePassword, reason)` prompt
 * with an application-styled modal and a working Cancel behavior.
 *
 * Cancel behavior: stops re-prompt loops by marking the request cancelled
 * and letting the caller hide/unmount the <Document /> for that file.
 */
export function usePdfPasswordDialog() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [reason, setReason] = useState<PdfPasswordReason>('need_password')
  const [updatePassword, setUpdatePassword] = useState<UpdatePasswordFn | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const reset = useCallback(() => {
    setOpen(false)
    setValue('')
    setReason('need_password')
    setUpdatePassword(null)
    setCancelled(false)
  }, [])

  const onPassword = useCallback((nextUpdatePassword: UpdatePasswordFn, nextReason: 1 | 2) => {
    // If user cancelled, don't show prompts again.
    if (cancelled) return

    setUpdatePassword(() => nextUpdatePassword)
    setReason(nextReason === 2 ? 'incorrect_password' : 'need_password')
    setValue('')
    setOpen(true)
  }, [cancelled])

  const submit = useCallback(() => {
    if (!updatePassword) return
    const trimmed = value.trim()
    if (!trimmed) return
    setOpen(false)
    updatePassword(trimmed)
  }, [updatePassword, value])

  const cancel = useCallback(() => {
    setOpen(false)
    setCancelled(true)
    // Do NOT call updatePassword here; unmounting the Document is the
    // most reliable way to prevent pdf.js from prompting again.
  }, [])

  const dialog = useMemo(() => {
    return (
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : cancel())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Password required</DialogTitle>
            <DialogDescription>{reasonToText(reason)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              type="password"
              value={value}
              autoFocus
              placeholder="Enter PDF password"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="outline" onClick={cancel}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!value.trim()}>
              Unlock PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }, [open, reason, value, cancel, submit])

  return { onPassword, dialog, cancelled, reset }
}

