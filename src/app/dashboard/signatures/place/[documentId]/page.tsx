'use client'

import { useState, useRef, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileImage, Save, RotateCcw } from 'lucide-react'

// Dummy data for signatures
const dummySignatures = [
  {
    id: 1,
    name: 'John Doe Signature',
    imageUrl: '/api/placeholder/200/100',
    uploadedAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Initials',
    imageUrl: '/api/placeholder/200/100',
    uploadedAt: '2025-01-14'
  }
]

// Dummy document data
const dummyDocument = {
  id: 'doc-123',
  name: 'Contract Agreement.pdf',
  pages: 3
}

interface SignaturePlacement {
  id: string
  signatureId: number
  x: number
  y: number
  page: number
}

export default function SignaturePlacementPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params)
  const [signatures] = useState(dummySignatures)
  const [placements, setPlacements] = useState<SignaturePlacement[]>([])
  const [draggedSignature, setDraggedSignature] = useState<number | null>(null)
  const [dragOverPage, setDragOverPage] = useState<number | null>(null)
  const documentRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent, signatureId: number) => {
    setDraggedSignature(signatureId)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', signatureId.toString())
  }

  const handleDragEnd = () => {
    setDraggedSignature(null)
    setDragOverPage(null)
  }

  const handleDragOver = (e: React.DragEvent, pageNumber: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverPage(pageNumber)
  }

  const handleDragLeave = () => {
    setDragOverPage(null)
  }

  const handleDrop = (e: React.DragEvent, pageNumber: number) => {
    e.preventDefault()
    const signatureId = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (documentRef.current) {
      const rect = documentRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newPlacement: SignaturePlacement = {
        id: `placement-${Date.now()}`,
        signatureId,
        x: Math.max(0, Math.min(x, rect.width - 100)), // Keep within bounds
        y: Math.max(0, Math.min(y, rect.height - 50)),
        page: pageNumber
      }
      
      setPlacements([...placements, newPlacement])
    }
    
    setDragOverPage(null)
  }

  const handleSavePlacements = () => {
    console.log('Saving signature placements:', placements)
    // Mock save - in real implementation, this would send to API
    alert('Signature placements saved! Check console for details.')
  }

  const handleResetPlacements = () => {
    setPlacements([])
  }

  const getSignatureById = (id: number) => {
    return signatures.find(sig => sig.id === id)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Place Signature on Document</h1>
          <p className="text-muted mt-1">
            Drag and drop your signatures onto the document preview
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleResetPlacements}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSavePlacements}>
            <Save className="h-4 w-4 mr-2" />
            Save Placement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Preview - Left Side (3/4 width) */}
        <div className="lg:col-span-3">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                {dummyDocument.name} - {dummyDocument.pages} pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={documentRef}
                className="relative bg-surface border-2 border-dashed border-outline-variant rounded-lg p-4 min-h-[600px]"
              >
                {/* Document Pages */}
                {Array.from({ length: dummyDocument.pages }, (_, index) => (
                  <div
                    key={index}
                    className={`relative mb-4 bg-white border border-border rounded shadow-sm p-4 min-h-[200px] transition-colors ${
                      dragOverPage === index + 1 ? 'bg-info-light border-secondary/30' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, index + 1)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index + 1)}
                  >
                    <div className="text-center text-muted mb-4">
                      <FileImage className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Page {index + 1}</p>
                      <p className="text-xs text-muted">
                        {dragOverPage === index + 1 ? 'Drop signature here' : 'Drag signature here'}
                      </p>
                    </div>
                    
                    {/* Render placed signatures on this page */}
                    {placements
                      .filter(placement => placement.page === index + 1)
                      .map(placement => {
                        const signature = getSignatureById(placement.signatureId)
                        return (
                          <div
                            key={placement.id}
                            className="absolute border-2 border-secondary/50 bg-info-light rounded p-2 cursor-move"
                            style={{
                              left: `${placement.x}px`,
                              top: `${placement.y}px`,
                              width: '100px',
                              height: '50px'
                            }}
                          >
                            <div className="text-center">
                              <FileImage className="h-4 w-4 mx-auto mb-1 text-secondary" />
                              <p className="text-xs text-secondary font-medium">
                                {signature?.name || 'Signature'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signature Toolbox - Right Side (1/4 width) */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>My Signatures</CardTitle>
              <CardDescription>
                Drag signatures onto the document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, signature.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 border border-border rounded-lg cursor-move hover:shadow-md transition-all ${
                    draggedSignature === signature.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="bg-surface rounded-md p-3 mb-2 flex items-center justify-center h-16 border-2 border-dashed border-outline-variant">
                    <div className="text-center">
                      <FileImage className="h-6 w-6 text-muted mx-auto mb-1" />
                      <p className="text-xs text-muted">Signature Preview</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-on-surface">{signature.name}</p>
                    <p className="text-xs text-muted">Drag to place</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Placement Summary */}
          {placements.length > 0 && (
            <Card className="bg-info-light border-info-light mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Placements</CardTitle>
                <CardDescription>
                  {placements.length} signature{placements.length !== 1 ? 's' : ''} placed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {placements.map((placement) => {
                    const signature = getSignatureById(placement.signatureId)
                    return (
                      <div key={placement.id} className="text-sm text-body">
                        <span className="font-medium">{signature?.name}</span>
                        <span className="text-muted"> on page {placement.page}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
