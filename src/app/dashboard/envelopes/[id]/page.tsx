'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Dummy data for envelopes (same as in envelopes list)
const dummyEnvelopes = [
  {
    id: 1,
    subject: 'Contract NDA',
    status: 'Sent',
    createdAt: '2025-09-16',
    recipients: 2,
    documentCount: 1,
    documentName: 'contract.pdf',
    signers: [
      { id: 1, email: 'signer1@example.com', status: 'Pending', order: 1 },
      { id: 2, email: 'signer2@example.com', status: 'Completed', order: 2 }
    ]
  },
  {
    id: 2,
    subject: 'Sales Document',
    status: 'Sent',
    createdAt: '2025-09-15',
    recipients: 3,
    documentCount: 1,
    documentName: 'sales-doc.pdf',
    signers: [
      { id: 1, email: 'buyer@example.com', status: 'Pending', order: 1 },
      { id: 2, email: 'manager@example.com', status: 'Pending', order: 2 },
      { id: 3, email: 'legal@example.com', status: 'Pending', order: 3 }
    ]
  },
  {
    id: 3,
    subject: 'Invoice #1234',
    status: 'Completed',
    createdAt: '2025-09-14',
    recipients: 1,
    documentCount: 1,
    documentName: 'invoice-1234.pdf',
    signers: [
      { id: 1, email: 'client@example.com', status: 'Completed', order: 1 }
    ]
  }
]

interface AuditEntry {
  id: number
  action: string
  timestamp: string
  details: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'Declined':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EnvelopeDetailPage() {
  const params = useParams()
  const envelopeId = params?.id ? parseInt(params.id as string) : null
  
  const [envelope, setEnvelope] = useState<any>(null)
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([])

  useEffect(() => {
    if (!envelopeId) return
    
    // Find envelope by ID
    const foundEnvelope = dummyEnvelopes.find(env => env.id === envelopeId)
    if (foundEnvelope) {
      setEnvelope(foundEnvelope)
      
      // Initialize audit trail
      const initialAudit: AuditEntry[] = [
        {
          id: 1,
          action: 'Envelope created',
          timestamp: foundEnvelope.createdAt,
          details: `Envelope "${foundEnvelope.subject}" was created`
        },
        {
          id: 2,
          action: 'Sent to signers',
          timestamp: foundEnvelope.createdAt,
          details: `Sent to ${foundEnvelope.recipients} recipient(s)`
        }
      ]
      
      // Add completed signer entries
      foundEnvelope.signers.forEach((signer: any) => {
        if (signer.status === 'Completed') {
          initialAudit.push({
            id: initialAudit.length + 1,
            action: 'Document signed',
            timestamp: foundEnvelope.createdAt,
            details: `${signer.email} signed the document`
          })
        }
      })
      
      setAuditTrail(initialAudit)
    }
  }, [envelopeId])

  const handleSimulateSign = (signerId: number) => {
    if (!envelope) return

    const updatedEnvelope = { ...envelope }
    const signer = updatedEnvelope.signers.find((s: any) => s.id === signerId)
    
    if (signer && signer.status === 'Pending') {
      signer.status = 'Completed'
      setEnvelope(updatedEnvelope)
      
      // Add audit entry
      const newAuditEntry: AuditEntry = {
        id: auditTrail.length + 1,
        action: 'Document signed',
        timestamp: new Date().toISOString().split('T')[0],
        details: `${signer.email} signed the document`
      }
      
      setAuditTrail([...auditTrail, newAuditEntry])

      // Mock notification trigger
      const notification = {
        id: Date.now(),
        type: 'signature_completed',
        title: `${signer.email} signed the document`,
        message: `Signer ${signer.email} has successfully signed the document "${envelope.documentName}".`,
        timestamp: new Date().toISOString().split('T')[0],
        isRead: false
      }
      
      // In a real app, this would be sent to a notification service
      console.log('Notification triggered:', notification)
    }
  }

  if (!envelope) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Envelope not found</h3>
              <p className="text-gray-600">The requested envelope could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Envelope: {envelope.subject}</h1>
        <div className="flex items-center space-x-4 mt-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              envelope.status
            )}`}
          >
            {envelope.status}
          </span>
          <span className="text-gray-600">Created: {envelope.createdAt}</span>
        </div>
      </div>

      {/* Document Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">PDF</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{envelope.documentName}</p>
                <p className="text-sm text-gray-600">PDF Document</p>
              </div>
            </div>
            <Button variant="outline">
              View Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signers Progress */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Signers</CardTitle>
          <CardDescription>
            Track the signing progress of each recipient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {envelope.signers.map((signer: any) => (
              <div
                key={signer.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">
                      Order {signer.order}
                    </span>
                    <span className="text-gray-900">{signer.email}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      signer.status
                    )}`}
                  >
                    {signer.status}
                  </span>
                </div>
                {signer.status === 'Pending' && (
                  <Button
                    onClick={() => handleSimulateSign(signer.id)}
                    size="sm"
                    variant="outline"
                  >
                    Simulate Sign
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Complete history of envelope activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditTrail.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                  <p className="text-sm text-gray-600">{entry.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
