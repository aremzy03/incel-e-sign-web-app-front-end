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

interface RecipientInput {
  id: string
  name?: string
  email?: string
  order: number
}

export default function EditEnvelopePage() {
  const params = useParams()
  const router = useRouter()
  const envelopeId = (params?.id as string) || ''

  const { data: envelope, isLoading } = useEnvelope(envelopeId)
  const { mutateAsync: editAsync, isPending: saving } = useEditEnvelope()
  const { mutateAsync: sendAsync, isPending: sending } = useSendEnvelope()
  const { validateRecipients, isValidating } = useEnvelopeUserValidation()

  const [recipients, setRecipients] = useState<RecipientInput[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (envelope) {
      const initial = (Array.isArray(envelope.recipients) ? envelope.recipients : [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((r) => ({ id: r.id as string, name: r.name, email: r.email, order: r.order }))
      setRecipients(initial)
    }
  }, [envelope])

  const sortedRecipients = useMemo(
    () => recipients.slice().sort((a, b) => a.order - b.order),
    [recipients]
  )

  const moveRecipient = (id: string, direction: 'up' | 'down') => {
    const index = recipients.findIndex((r) => r.id === id)
    if (index < 0) return
    const newOrder = recipients.slice()
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setRecipients(newOrder.map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, order: idx + 1 })))
  }

  const buildEditPayload = async () => {
    setError(null)
    if (sortedRecipients.length === 0) {
      setError('At least one recipient is required')
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
    return { signing_order }
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
          <CardTitle>Recipients</CardTitle>
          <CardDescription>Adjust the signing order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedRecipients.length === 0 && (
            <p className="text-sm text-gray-600">No recipients.</p>
          )}
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleSave} disabled={saving || isValidating}>
          {saving || isValidating ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={handleSend} disabled={saving || sending || isValidating}>
          {saving || sending || isValidating ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}









