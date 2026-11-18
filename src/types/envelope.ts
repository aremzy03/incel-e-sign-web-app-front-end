/** 'text' is retired: still read from existing envelopes, never created. */
export type FieldType = 'signature' | 'initials' | 'date' | 'text' | 'designation'
export type CreatableFieldType = Exclude<FieldType, 'text'>

export interface FieldPosition {
  id: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
  assignedTo: string | null // recipient id
  documentId: string
  // Optional, configured for non-signature fields
  required?: boolean
  prefill_value?: string | null
  font_family?: string
  font_size?: number
  date_format?: string
  placeholder?: string
  max_length?: number
}

export interface FieldPositions {
  [documentId: string]: {
    [fieldId: string]: FieldPosition
  }
}

export interface RecipientInput {
  id: number
  name: string
  email: string
  order: number
  color: string
}

export interface DocumentUpload {
  id: string
  file: File
  preview?: string
  uploaded?: boolean
}

export interface FieldPaletteItem {
  type: CreatableFieldType
  label: string
  icon: string
  description: string
}

export const FIELD_TYPES: FieldPaletteItem[] = [
  {
    type: 'signature',
    label: 'Signature',
    icon: '✍️',
    description: 'Digital signature field'
  },
  {
    type: 'initials',
    label: 'Initials',
    icon: '🖋️',
    description: 'Signer picks the style and handwriting font'
  },
  {
    type: 'date',
    label: 'Date signed',
    icon: '📅',
    description: 'Filled with the date the signer signs'
  },
  {
    type: 'designation',
    label: 'Designation',
    icon: '🏷️',
    description: 'Designation field'
  }
]

export const RECIPIENT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]
