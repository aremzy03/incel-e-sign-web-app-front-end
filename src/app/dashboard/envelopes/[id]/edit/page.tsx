'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useEnvelope, useEditEnvelope, useSendEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeUserValidation } from '@/hooks/useUsers'
import { useDocuments } from '@/hooks/useDocuments'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'
import { useContacts } from '@/hooks/useContacts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PDFViewerWithSignatures } from '@/components/envelope/PDFViewerWithSignatures'
import { toast } from 'react-hot-toast'

interface RecipientInput {
  id: string
  name?: string
  email?: string
  order: number
}

interface SignaturePosition {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export default function EditEnvelopePage() {
  const params = useParams()
  const router = useRouter()
  const envelopeId = (params?.id as string) || ''

  const { data: envelope, isLoading } = useEnvelope(envelopeId)
  const { mutateAsync: editAsync, isPending: saving } = useEditEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()
  const { data: documents, isLoading: loadingDocs } = useDocuments()
  const { data: contacts } = useContacts()

  const [recipients, setRecipients] = useState<RecipientInput[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [envelopeName, setEnvelopeName] = useState<string>('')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [nextRecipientId, setNextRecipientId] = useState(1)
  const [selectedContactEmail, setSelectedContactEmail] = useState<string>('')
  const [signaturePositions, setSignaturePositions] = useState<Record<string, Record<string, SignaturePosition>>>({}) // docId -> { signerId -> position }
  const [activeSigner, setActiveSigner] = useState<string | null>(null)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)

  useEffect(() => {
    if (envelope) {
      const initial = (Array.isArray(envelope.recipients) ? envelope.recipients : [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((r) => ({ id: r.id as string, name: r.name, email: r.email, order: r.order }))
      setRecipients(initial)
      setEnvelopeName(envelope.name || '')
      setSelectedDocumentIds(envelope.documents?.map((doc: any) => doc.id) || [])
      // Initialize signature positions if available in the envelope
      const initialSignaturePositions: Record<string, Record<string, SignaturePosition>> = {};
      envelope.documents?.forEach((doc: any) => {
        doc.signer_document_positions.forEach((pos: any) => {
          if (!initialSignaturePositions[doc.id]) {
            initialSignaturePositions[doc.id] = {};
          }
          initialSignaturePositions[doc.id][`recipient-${pos.signer_id}`] = pos.position;
        });
      });
      setSignaturePositions(initialSignaturePositions);
    }
  }, [envelope])

  useEffect(() => {
    if (selectedDocumentIds.length > 0 && !activeDocumentId) {
      setActiveDocumentId(selectedDocumentIds[0]);
    } else if (selectedDocumentIds.length === 0) {
      setActiveDocumentId(null);
    }
  }, [selectedDocumentIds, activeDocumentId]);

  const [step, setStep] = useState(1)

  const sortedRecipients = useMemo(
    () => recipients.slice().sort((a, b) => a.order - b.order),
    [recipients]
  )

  const allSignaturesPositioned = useMemo(() => {
    if (selectedDocumentIds.length === 0 || sortedRecipients.length === 0) return false;
    return selectedDocumentIds.every(docId => {
      const positionsForDoc = signaturePositions[docId];
      if (!positionsForDoc) return false;
      return sortedRecipients.every(recipient => positionsForDoc[`recipient-${recipient.id}`] !== undefined);
    });
  }, [selectedDocumentIds, sortedRecipients, signaturePositions]);

  const calculateTotalPositions = useMemo(() => {
    let count = 0;
    selectedDocumentIds.forEach(docId => {
      const positionsForDoc = signaturePositions[docId];
      if (positionsForDoc) {
        sortedRecipients.forEach(recipient => {
          if (positionsForDoc[`recipient-${recipient.id}`]) {
            count++;
          }
        });
      }
    });
    return count;
  }, [selectedDocumentIds, sortedRecipients, signaturePositions]);

  const nextStep = () => {
    if (step === 1 && selectedDocumentIds.length === 0) {
      setError('Please select at least one document.');
      return;
    }
    if (step === 2 && recipients.length === 0) {
      setError('Please add at least one recipient.');
      return;
    }
    if (step === 3 && !allSignaturesPositioned) {
      setError('All recipients must have a signature position on each selected document.');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(Math.max(1, step - 1));
  };

  const pushRecipient = (rec: { email: string; name?: string }) => {
    const exists = recipients.some((r) => r.email.toLowerCase() === rec.email.toLowerCase())
    if (exists) return
    const newRecipient: RecipientInput = {
      id: `new-${nextRecipientId}`,
      name: rec.name?.trim() || '',
      email: rec.email.trim(),
      order: recipients.length + 1,
    }
    setRecipients((prev) => [...prev, newRecipient])
    setNextRecipientId((id) => id + 1)
  }

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const moveRecipient = (id: string, direction: 'up' | 'down') => {
    const index = recipients.findIndex((r) => r.id === id)
    if (index < 0) return
    const newOrder = recipients.slice()
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setRecipients(newOrder.map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const buildDocumentsWithPositions = (validRecipients: any[]) => {
    const documentsWithPositions: Array<{
      document_id: string;
      signer_document_positions: Array<{
        signer_id: string;
        position: SignaturePosition;
      }>;
    }> = [];

    selectedDocumentIds.forEach(docId => {
      const signerDocumentPositions: Array<{
        signer_id: string;
        position: SignaturePosition;
      }> = [];
      const positionsForDoc = signaturePositions[docId] || {};

      sortedRecipients.forEach(recipient => {
        const signerIdKey = `recipient-${recipient.id}`;
        if (positionsForDoc[signerIdKey]) {
          const position = positionsForDoc[signerIdKey];
          const foundUser = validRecipients.find((v) => v.email.toLowerCase() === (recipient.email || '').toLowerCase());
          if (foundUser) {
            signerDocumentPositions.push({
              signer_id: foundUser.user.id,
              position: {
                page: Math.max(1, position.page),
                x: Math.max(0, position.x),
                y: Math.max(0, position.y),
                width: Math.max(50, position.width),
                height: Math.max(20, position.height),
              },
            });
          }
        }
      });

      if (signerDocumentPositions.length > 0) {
        documentsWithPositions.push({
          document_id: docId,
          signer_document_positions: signerDocumentPositions,
        });
      }
    });

    return documentsWithPositions;
  };

  const buildEditPayload = async () => {
    setError(null)
    if (selectedDocumentIds.length === 0) {
      setError('At least one document is required')
      return null
    }
    if (sortedRecipients.length === 0) {
      setError('At least one recipient is required')
      return null
    }
    if (!allSignaturesPositioned) {
      setError('All recipients must have a signature position on each selected document')
      return null
    }

    const emails = sortedRecipients.map((r) => r.email || '').filter(Boolean)
    const { valid, invalid } = await validateRecipients(emails)
    if (invalid.length > 0) {
      setError(`These emails are not registered: ${invalid.join(', ')}`)
      return null
    }

    const signing_order = sortedRecipients.map((r) => {
      const found = valid.find((v) => v.email.toLowerCase() === (r.email || '').toLowerCase())
      return { signer_id: (found?.user.id || r.id) as string, order: r.order }
    })

    const payload: any = {
      document_ids: selectedDocumentIds,
      signing_order,
      documents_with_positions: buildDocumentsWithPositions(valid),
      ...(envelopeName && { name: envelopeName }),
    }

    return payload
  }

  const handleSave = async () => {
    const payload = await buildEditPayload()
    if (!payload) return
    await editAsync({ id: envelopeId, data: payload })
    setSuccess('Envelope saved!')
    router.push(`/dashboard/envelopes/${envelopeId}`)
  }

  const handleSend = async () => {
    const payload = await buildEditPayload()
    if (!payload) return
    await editAsync({ id: envelopeId, data: payload })
    await sendAsync(envelopeId)
    setSuccess('Envelope sent!')
    router.push(`/dashboard/envelopes/${envelopeId}`)
  }

  if (isLoading || !envelope) {
    return (
      <div className="max-w-4xl mx-auto">Loading...</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Envelope</h1>
        <p className="text-gray-600 mt-1">Modify recipients and order before sending</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Wizard</CardTitle>
          <CardDescription>Follow the steps below to edit your envelope</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Select Document</span>
            <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Add Recipients</span>
            <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Position Signatures</span>
            <span className={`px-2 py-1 rounded ${step === 4 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Review & Send</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Document(s) and Name Envelope</h3>
              <div className="space-y-2">
                <Label htmlFor="envelope-name">Envelope Name (Optional)</Label>
                <Input
                  id="envelope-name"
                  placeholder="e.g., My Important Contract Bundle"
                  value={envelopeName}
                  onChange={(e) => setEnvelopeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Select Document(s)</Label>
                {loadingDocs ? (
                  <div>Loading documents...</div>
                ) : documents && documents.length > 0 ? (
                  <div className="grid gap-2">
                    {(documents || []).map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`doc-${doc.id}`}
                          checked={selectedDocumentIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocumentIds((prev) => [...prev, doc.id])
                            } else {
                              setSelectedDocumentIds((prev) => prev.filter((id) => id !== doc.id))
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-gray-900 rounded"
                        />
                        <Label htmlFor={`doc-${doc.id}`}>{`${doc.file_name} (${doc.status})`}</Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No documents available for selection.</div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Add Recipients</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Search or invite recipient by email</Label>
                  <RecipientSearch
                    onSelect={(r) => {
                      pushRecipient({ email: r.email, name: r.name })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Add from Contacts</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Select value={selectedContactEmail} onValueChange={setSelectedContactEmail}>
                        <SelectTrigger>
                          <SelectValue placeholder={(contacts && contacts.length > 0) ? 'Select a contact' : 'No contacts available'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(contacts || []).map((c) => (
                            <SelectItem key={c.id} value={c.email}>
                              {(c.name || c.email) + ' (' + c.email + ')'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          const c = (contacts || []).find((x) => x.email === selectedContactEmail)
                          if (c) {
                            pushRecipient({ email: c.email, name: c.name })
                            setSelectedContactEmail('')
                          }
                        }}
                        disabled={!selectedContactEmail}
                      >
                        + Add from Contacts
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {sortedRecipients.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Recipients:</h4>
                  {sortedRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">Order {r.order}</span>
                        <span className="text-sm text-gray-900">{r.name} ({r.email})</span>
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => moveRecipient(r.id, 'up')}>Up</Button>
                        <Button size="sm" variant="outline" onClick={() => moveRecipient(r.id, 'down')}>Down</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRemoveRecipient(r.id)} className="text-red-600">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Position Signatures</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <strong>Position signature fields:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Select a signer from the dropdown below</li>
                    <li>Click anywhere on the document to place or reposition their signature field</li>
                    <li>Drag signature boxes to fine-tune their position</li>
                    <li>Resize signature boxes using the handle in the bottom-right corner</li>
                    <li>Each signer must have exactly one signature position per document before proceeding</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signer-select">Active Signer</Label>
                <Select value={activeSigner || ''} onValueChange={setActiveSigner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a signer to position their signature" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedRecipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={`recipient-${recipient.id}`}>
                        {recipient.name} ({recipient.email})
                        {activeDocumentId && signaturePositions[activeDocumentId]?.[`recipient-${recipient.id}`] && ' ✓'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDocumentIds.length > 0 && (
                <div className="space-y-4">
                  <Label htmlFor="document-for-positioning-select">Document to Position</Label>
                  <Select
                    value={activeDocumentId || selectedDocumentIds[0]}
                    onValueChange={setActiveDocumentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a document to position signatures on" />
                    </SelectTrigger>
                    <SelectContent>
                      {(documents || []).filter(doc => selectedDocumentIds.includes(doc.id)).map((doc) => {
                        return (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc?.file_name || `Document ${doc.id}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeDocumentId && (() => {
                const selectedDoc = documents?.find(d => d.id === activeDocumentId)
                const documentUrl = selectedDoc?.file_url || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/documents/${activeDocumentId}/download/`
                return (
                  <PDFViewerWithSignatures
                    documentUrl={documentUrl}
                    signers={sortedRecipients.map(r => ({
                      id: `recipient-${r.id}`,
                      name: r.name,
                      email: r.email,
                      order: r.order
                    }))}
                    activeSigner={activeSigner}
                    onSignerSelect={setActiveSigner}
                    onPositionChange={(signerId, position) => {
                      setSignaturePositions(prev => ({
                        ...prev,
                        [activeDocumentId]: {
                          ...(prev[activeDocumentId] || {}),
                          [signerId]: position
                        }
                      }))
                    }}
                    positions={signaturePositions[activeDocumentId] || {}}
                  />
                )
              })()}

              {/* Position Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Signature Positions:</h4>
                <div className="space-y-2">
                  {(selectedDocumentIds || []).map(docId => (
                    <div key={docId} className="space-y-2 mb-4">
                      <h5 className="text-sm font-semibold text-gray-800">
                        Document: {documents?.find(d => d.id === docId)?.file_name || `Document ${docId}`}
                      </h5>
                      {sortedRecipients.map((recipient) => {
                        const positionsForDoc = signaturePositions[docId] || {}
                        const position = positionsForDoc[`recipient-${recipient.id}`]
                        return (
                          <div key={`${docId}-${recipient.id}`} className="flex items-center justify-between text-sm ml-2">
                            <div className="flex-1">
                              <span className="font-medium">{recipient.name}</span>
                              <span className="text-gray-500 ml-1">({recipient.email})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={position ? 'text-green-600' : 'text-red-600'}>
                                {position ? `✓ Page ${position.page} (${Math.round(position.x)}, ${Math.round(position.y)})` : '✗ Not positioned'}
                              </span>
                              {position && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 h-6 px-2"
                                  onClick={() => {
                                    setSignaturePositions(prev => {
                                      const newPositions = { ...prev }
                                      if (newPositions[docId]) {
                                        delete newPositions[docId][`recipient-${recipient.id}`]
                                        if (Object.keys(newPositions[docId]).length === 0) {
                                          delete newPositions[docId]
                                        }
                                      }
                                      return newPositions
                                    })
                                    toast.success(`Removed signature position for ${recipient.name} on ${documents?.find(d => d.id === docId)?.file_name}`)
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 4: Review & Send</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {envelopeName && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Envelope Name:</span>
                    <span className="text-sm text-gray-900">{envelopeName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Selected Document:</span>
                  <span className="text-sm text-gray-900">
                    {selectedDocumentIds.length > 0 ? selectedDocumentIds.map(id => documents?.find(d => d.id === id)?.file_name).join(', ') : 'None selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Recipients:</span>
                  <span className="text-sm text-gray-900">{sortedRecipients.length}</span>
                </div>
                {sortedRecipients.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Signing Order:</span>
                    <span className="text-sm text-gray-900">{sortedRecipients.map((r) => r.email).join(' → ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Signature Positions:</span>
                  <span className="text-sm text-gray-900">
                    {calculateTotalPositions} of {selectedDocumentIds.length * sortedRecipients.length} positioned
                  </span>
                </div>
                {sortedRecipients.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-700 mb-1">Position Details:</div>
                    <div className="space-y-1">
                      {(selectedDocumentIds || []).map(docId => (
                        <div key={docId} className="space-y-2 mb-2 p-2 border rounded bg-gray-100">
                          <h5 className="text-sm font-semibold text-gray-800">
                            Document: {documents?.find(d => d.id === docId)?.file_name || `Document ${docId}`}
                          </h5>
                          {sortedRecipients.map((recipient) => {
                            const positionsForDoc = signaturePositions[docId] || {};
                            const position = positionsForDoc[`recipient-${recipient.id}`];
                            return (
                              <div key={`${docId}-${recipient.id}`} className="text-xs text-gray-600 flex justify-between ml-2">
                                <span>{recipient.name} ({recipient.email})</span>
                                <span className={position ? 'text-green-600' : 'text-red-600'}>
                                  {position ? `✓ Page ${position.page} (${Math.round(position.x)}, ${Math.round(position.y)})` : '✗ Not positioned'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>Previous</Button>
            {step < 4 ? (
              <Button 
                onClick={nextStep} 
                disabled={
                  (step === 1 && selectedDocumentIds.length === 0) || 
                  (step === 2 && sortedRecipients.length === 0) ||
                  (step === 3 && !allSignaturesPositioned)
                }
              >
                Next
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving || isValidating} variant="secondary">
                  {saving || isValidating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleSend} disabled={saving || sending || isValidating}>
                  {saving || sending || isValidating ? 'Sending...' : 'Send Envelope'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}









