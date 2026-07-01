'use client'

import type { FieldType } from '@/types/envelope'

export const FIELD_EDITOR_THEMES: Record<
  FieldType,
  {
    container: string
    border: string
    tag: string
    icon: string
    label: string
    materialIcon: string
    palette: string
  }
> = {
  signature: {
    container: 'bg-blue-50/50',
    border: 'border-blue-400',
    tag: 'bg-blue-600',
    icon: 'text-blue-400',
    label: 'text-blue-600',
    materialIcon: 'draw',
    palette: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  initials: {
    container: 'bg-purple-50/50',
    border: 'border-purple-400',
    tag: 'bg-purple-600',
    icon: 'text-purple-400',
    label: 'text-purple-600',
    materialIcon: 'gesture',
    palette: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  date: {
    container: 'bg-emerald-50/50',
    border: 'border-emerald-400',
    tag: 'bg-emerald-600',
    icon: 'text-emerald-400',
    label: 'text-emerald-600',
    materialIcon: 'calendar_today',
    palette: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  text: {
    container: 'bg-slate-50/50',
    border: 'border-slate-400',
    tag: 'bg-slate-600',
    icon: 'text-slate-500',
    label: 'text-slate-700',
    materialIcon: 'article',
    palette: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  },
  designation: {
    container: 'bg-amber-50/50',
    border: 'border-amber-400',
    tag: 'bg-amber-600',
    icon: 'text-amber-500',
    label: 'text-amber-700',
    materialIcon: 'badge',
    palette: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  },
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  text: 'Text',
  designation: 'Designation',
}
