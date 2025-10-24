'use client'

import React from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Users, Palette } from 'lucide-react'
import { DocumentUploadZone } from './DocumentUploadZone'
import { FieldPaletteItem } from './FieldPaletteItem'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'
import { Document } from '@/lib/api/documents'
import { RecipientInput, FieldPositions, FIELD_TYPES, RECIPIENT_COLORS } from '@/types/envelope'

interface EnvelopeCreationSidebarProps {
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  onDocumentAdd: (document: Document) => void
  onDocumentRemove: (documentId: string) => void
  onDocumentSelect: (document: Document) => void
  onRecipientAdd: (recipient: { email: string; name?: string }) => void
  onRecipientRemove: (recipientId: number) => void
  onRecipientReorder: (recipientId: number, direction: 'up' | 'down') => void
  onFieldDrop: (fieldType: string, documentId: string, page: number, x: number, y: number) => void
}

export function EnvelopeCreationSidebar({
  uploadedDocuments,
  recipients,
  fieldPositions,
  onDocumentAdd,
  onDocumentRemove,
  onDocumentSelect,
  onRecipientAdd,
  onRecipientRemove,
  onRecipientReorder,
  onFieldDrop,
}: EnvelopeCreationSidebarProps) {
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeData = active.data.current
    const overData = over.data.current
    
    if (activeData?.type === 'field-palette-item' && overData?.type === 'page') {
      const fieldType = activeData.fieldType
      const { documentId, pageNumber } = overData
      
      // Get drop coordinates from the event
      const rect = over.rect
      const activatorEvent = event.activatorEvent as MouseEvent | undefined
      const x = activatorEvent?.clientX ? 
        activatorEvent.clientX - rect.left : 
        rect.width / 2
      const y = activatorEvent?.clientY ? 
        activatorEvent.clientY - rect.top : 
        rect.height / 2
      
      onFieldDrop(fieldType, documentId, pageNumber, x, y)
    }
  }

  // Calculate field counts per recipient
  const getFieldCountForRecipient = (recipientId: number) => {
    let count = 0
    Object.values(fieldPositions).forEach(docFields => {
      Object.values(docFields).forEach(field => {
        if (field.assignedTo === recipientId.toString()) {
          count++
        }
      })
    })
    return count
  }

  // Calculate unassigned field count
  const getUnassignedFieldCount = () => {
    let count = 0
    Object.values(fieldPositions).forEach(docFields => {
      Object.values(docFields).forEach(field => {
        if (!field.assignedTo) {
          count++
        }
      })
    })
    return count
  }

  const unassignedCount = getUnassignedFieldCount()

  return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-hidden relative z-50">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Create Envelope</h2>
          <p className="text-sm text-gray-600">Drag fields onto documents</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 p-4 w-full min-w-0">
          {/* Document Upload Section */}
          <Card className="w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <DocumentUploadZone
                  uploadedDocuments={uploadedDocuments}
                  onDocumentAdd={onDocumentAdd}
                  onDocumentRemove={onDocumentRemove}
                  onDocumentSelect={onDocumentSelect}
                />
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Recipients Section */}
          <Card className="w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
                <Badge variant="secondary">{recipients.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Recipient */}
              <div className="space-y-2">
                <RecipientSearch
                  onSelect={(recipient) => {
                    onRecipientAdd({ email: recipient.email, name: recipient.name })
                  }}
                />
              </div>

              {/* Recipients List */}
              {recipients.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">Added Recipients:</h4>
                  <div className="space-y-1">
                    {recipients.map((recipient, index) => {
                      const fieldCount = getFieldCountForRecipient(recipient.id)
                      return (
                        <div
                          key={recipient.id}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: recipient.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {recipient.name || recipient.email}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {recipient.email}
                              </p>
                            </div>
                            {fieldCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {fieldCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onRecipientReorder(recipient.id, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onRecipientReorder(recipient.id, 'down')}
                              disabled={index === recipients.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => onRecipientRemove(recipient.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Palette Section */}
          <Card className="w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Field Types
                {unassignedCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unassignedCount} unassigned
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs text-gray-600 mb-3">
                  Drag fields onto documents to place them
                </p>
                {FIELD_TYPES.map((fieldType) => (
                  <FieldPaletteItem
                    key={fieldType.type}
                    item={fieldType}
                    disabled={uploadedDocuments.length === 0}
                  />
                ))}
              </div>
              
              {/* Field Type Notes */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Only signature fields are currently supported by the backend. 
                  Other field types are placeholders for future implementation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
