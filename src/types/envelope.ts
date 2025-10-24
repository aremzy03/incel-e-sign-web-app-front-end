export type FieldType = 'signature' | 'initials' | 'date' | 'text' | 'checkbox'

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
  type: FieldType
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
    description: 'Initials field'
  },
  {
    type: 'date',
    label: 'Date',
    icon: '📅',
    description: 'Date field'
  },
  {
    type: 'text',
    label: 'Text',
    icon: '📝',
    description: 'Text input field'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑️',
    description: 'Checkbox field'
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
