'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// removed manual name/email inputs
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useCreateEnvelope, useSendEnvelope } from '@/hooks/useEnvelopes'
import { useEnvelopeUserValidation } from '@/hooks/useUsers'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'
import { useContacts } from '@/hooks/useContacts'

interface RecipientInput {
  id: number
  name: string
  email: string
  order: number
}

export default function CreateEnvelopePage() {
  const router = useRouter()
  const { data: documents, isLoading: loadingDocs } = useDocuments()
  const { mutateAsync: createAsync, isPending: creating } = useCreateEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()
  const { data: contacts } = useContacts()

  const [step, setStep] = useState(1)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  // removed manual name/email state
  const [recipients, setRecipients] = useState<RecipientInput[]>([])
  const [nextId, setNextId] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedContactEmail, setSelectedContactEmail] = useState<string>('')

  const sortedRecipients = useMemo(
    () => recipients.slice().sort((a, b) => a.order - b.order),
    [recipients]
  )

  const pushRecipient = (rec: { email: string; name?: string }) => {
    // avoid duplicates by email
    const exists = recipients.some((r) => r.email.toLowerCase() === rec.email.toLowerCase())
    if (exists) return
    const newRecipient: RecipientInput = {
      id: nextId,
      name: rec.name?.trim() || '',
      email: rec.email.trim(),
      order: recipients.length + 1,
    }
    setRecipients((prev) => [...prev, newRecipient])
    setNextId((id) => id + 1)
  }

  // removed manual add recipient handler

  const handleRemoveRecipient = (id: number) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const moveRecipient = (id: number, direction: 'up' | 'down') => {
    const index = recipients.findIndex((r) => r.id === id)
    if (index < 0) return
    const newOrder = recipients.slice()
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setRecipients(newOrder.map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const nextStep = () => {
    if (step === 1 && !selectedDocumentId) return
    if (step === 2 && recipients.length === 0) return
    setStep(step + 1)
  }

  const prevStep = () => setStep(Math.max(1, step - 1))

  const buildPayload = async () => {
    try {
      setError(null)
      console.log('[CreateEnvelope] Clicked create, starting validation')
      // Validate users exist and get their IDs
      const emails = sortedRecipients.map((r) => r.email)
      const { valid, invalid } = await validateRecipients(emails)
      console.log('[CreateEnvelope] Validation result:', { validCount: valid.length, invalid })
      if (invalid.length > 0) {
        setError(`These emails are not registered: ${invalid.join(', ')}`)
        return null
      }

      // Map order to signer_id using validated users
      const signing_order = sortedRecipients.map((r) => {
        const found = valid.find((v) => v.email.toLowerCase() === r.email.toLowerCase())
        return { signer_id: found!.user.id, order: r.order }
      })

      return {
        document_id: selectedDocumentId,
        signing_order,
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create envelope')
      return null
    }
  }

  const handleSaveDraft = async () => {
    const payload = await buildPayload()
    if (!payload) return
    console.log('[CreateEnvelope] Submitting payload (save draft):', payload)
    const created = await createAsync(payload as any)
    console.log('[CreateEnvelope] Created envelope (draft):', created)
    setSuccess('Envelope saved as draft!')
    router.push(`/dashboard/envelopes/${created.id}`)
  }

  const handleCreateAndSend = async () => {
    const payload = await buildPayload()
    if (!payload) return
    console.log('[CreateEnvelope] Submitting payload (send):', payload)
    const created = await createAsync(payload as any)
    console.log('[CreateEnvelope] Created envelope, now sending:', created)
    await sendAsync(created.id)
    setSuccess('Envelope sent successfully!')
    router.push(`/dashboard/envelopes/${created.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Envelope</h1>
        <p className="text-gray-600 mt-1">Set up a new document envelope for digital signing</p>
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
          <CardDescription>Follow the steps below to create your envelope</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Select Document</span>
            <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Add Recipients</span>
            <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Review & Create</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Document</h3>
              <div className="space-y-2">
                <Label htmlFor="document-select">Document</Label>
                <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDocs ? 'Loading...' : 'Select a document'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(documents || []).map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>{`${doc.file_name} (${doc.status})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {/* manual name/email inputs removed */}
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
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Review & Create</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Selected Document:</span>
                  <span className="text-sm text-gray-900">
                    {documents?.find((d) => d.id === selectedDocumentId)?.file_name || 'None selected'}
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
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>Previous</Button>
            {step < 3 ? (
              <Button onClick={nextStep} disabled={(step === 1 && !selectedDocumentId) || (step === 2 && sortedRecipients.length === 0)}>Next</Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleSaveDraft} disabled={creating || isValidating} variant="secondary">
                  {creating || isValidating ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button onClick={handleCreateAndSend} disabled={creating || sending || isValidating}>
                  {creating || sending || isValidating ? 'Sending...' : 'Send Now'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
