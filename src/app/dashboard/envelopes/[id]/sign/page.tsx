'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'
import SignaturePad from 'react-signature-canvas'
import {
  declineEnvelope,
  listUserSignatures,
  signEnvelopeWithInline,
  signEnvelopeWithReusableSignature,
  type ReusableSignature,
} from '@/lib/api/signatures'
import { useQuery } from '@tanstack/react-query'

export default function EnvelopeSignPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const envelopeId = params?.id
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | null>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)

  const { data: signatures } = useQuery<ReusableSignature[]>({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  const signWithReusable = useMutation({
    mutationFn: async () => {
      if (!envelopeId || !selectedSignatureId) throw new Error('Select a reusable signature')
      return signEnvelopeWithReusableSignature(envelopeId, selectedSignatureId)
    },
    onSuccess: () => {
      toast.success('Document signed successfully')
      router.push('/dashboard/envelopes')
    },
    onError: () => toast.error('Failed to sign document'),
  })

  const signInline = useMutation({
    mutationFn: async () => {
      if (!envelopeId) throw new Error('Invalid envelope')
      const pad = sigPadRef.current
      if (!pad || pad.isEmpty()) throw new Error('Please draw your signature')
      const dataUrl = pad.getTrimmedCanvas().toDataURL('image/png')
      return signEnvelopeWithInline(envelopeId, dataUrl)
    },
    onSuccess: () => {
      toast.success('Document signed successfully')
      router.push('/dashboard/envelopes')
    },
    onError: () => toast.error('Failed to sign document'),
  })

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!envelopeId) throw new Error('Invalid envelope')
      return declineEnvelope(envelopeId)
    },
    onSuccess: () => {
      toast.success('You declined to sign this envelope')
      router.push('/dashboard/envelopes')
    },
    onError: () => toast.error('Failed to decline'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sign Envelope</h1>
          <p className="text-gray-600 mt-1">Use a reusable signature or draw an inline signature</p>
        </div>
        <Button variant="destructive" onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}>
          {declineMutation.isPending ? 'Declining...' : 'Decline'}
        </Button>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Reusable Signatures</CardTitle>
          <CardDescription>Select one of your saved signatures</CardDescription>
        </CardHeader>
        <CardContent>
          {signatures && signatures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {signatures.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSignatureId(s.id)}
                  className={`border rounded-lg p-4 text-left hover:shadow transition ${
                    selectedSignatureId === s.id ? 'ring-2 ring-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">Uploaded {new Date(s.uploaded_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No reusable signatures found. Upload one in Signatures.</div>
          )}
          <div className="mt-4">
            <Button onClick={() => signWithReusable.mutate()} disabled={!selectedSignatureId || signWithReusable.isPending}>
              {signWithReusable.isPending ? 'Signing...' : 'Sign with selected'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Inline Signature</CardTitle>
          <CardDescription>Draw your signature below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md p-2 bg-gray-50">
            <SignaturePad ref={sigPadRef as any} canvasProps={{ className: 'w-full h-48 bg-white rounded' }} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => sigPadRef.current?.clear()}>Clear</Button>
            <Button onClick={() => signInline.mutate()} disabled={signInline.isPending}>{signInline.isPending ? 'Signing...' : 'Sign Inline'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


