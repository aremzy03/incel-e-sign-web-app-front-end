'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_INITIALS_CHOICE,
  INITIALS_FONTS,
  INITIALS_STYLES,
  type InitialsChoice,
} from '@/lib/fields/stamps'

const STORAGE_KEY = 'incel-esign:initials-choice'

function readStored(): InitialsChoice {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_INITIALS_CHOICE
    const parsed = JSON.parse(raw) as Partial<InitialsChoice>
    return {
      style: INITIALS_STYLES.some((s) => s.id === parsed.style) ? parsed.style! : DEFAULT_INITIALS_CHOICE.style,
      font: INITIALS_FONTS.some((f) => f.id === parsed.font) ? parsed.font! : DEFAULT_INITIALS_CHOICE.font,
    }
  } catch {
    return DEFAULT_INITIALS_CHOICE
  }
}

/** The signer's initials style and font, remembered on this device as a convenience. */
export function useInitialsChoice() {
  const [choice, setChoiceState] = useState<InitialsChoice>(DEFAULT_INITIALS_CHOICE)

  useEffect(() => {
    setChoiceState(readStored())
  }, [])

  const setChoice = useCallback((next: InitialsChoice) => {
    setChoiceState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked: the choice still applies to this signing.
    }
  }, [])

  return [choice, setChoice] as const
}
