'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Eye, CheckCircle, XCircle, User, PenTool } from 'lucide-react'

// Dummy envelope data for sign-off
const dummyEnvelopes = [
  {
    id: 1,
    subject: 'NDA Agreement',
    status: 'Sent',
    createdAt: '2025-09-16',
    documentName: 'contract.pdf',
    documentId: 1,
    signers: [
      { id: 1, email: 'signer1@example.com', status: 'Pending', order: 1 },
      { id: 2, email: 'signer2@example.com', status: 'Pending', order: 2, isCurrentUser: true }
    ]
  },
  {
    id: 2,
    subject: 'Sales Contract',
    status: 'Sent',
    createdAt: '2025-09-15',
    documentName: 'sales-doc.pdf',
    documentId: 2,
    signers: [
      { id: 1, email: 'buyer@example.com', status: 'Completed', order: 1 },
      { id: 2, email: 'manager@example.com', status: 'Pending', order: 2, isCurrentUser: true },
      { id: 3, email: 'legal@example.com', status: 'Pending', order: 3 }
    ]
  },
  {
    id: 3,
    subject: 'Service Agreement',
    status: 'Sent',
    createdAt: '2025-09-14',
    documentName: 'service-agreement.pdf',
    documentId: 3,
    signers: [
      { id: 1, email: 'client@example.com', status: 'Pending', order: 1, isCurrentUser: true }
    ]
  }
]

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

export default function FinalSignOffPage() {
  const params = useParams()
  const envelopeId = params?.envelopeId ? parseInt(params.envelopeId as string) : null
  
  // Notification and audit state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'envelope_sent',
      title: 'Envelope NDA sent',
      message: 'Your envelope "NDA Agreement" has been sent to 2 recipients.',
      timestamp: '2025-09-16',
      isRead: false
    }
  ])
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      action: 'CREATE_ENV',
      actor: 'creator@test.com',
      timestamp: '2025-09-16 14:32:15',
      details: 'Created envelope "NDA Agreement" with 2 recipients',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ])
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showDeclineAlert, setShowDeclineAlert] = useState(false)
  
  // Find the envelope by ID
  const envelope = envelopeId ? dummyEnvelopes.find(env => env.id === envelopeId) : null
  
  // If envelope not found, show error state
  if (!envelope) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Envelope not found</h3>
            <p className="text-gray-600 text-center mb-4">
              The envelope you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/dashboard/envelopes">Back to Envelopes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleConfirmSign = () => {
    console.log('Signer confirmed signing')
    
    // Add notification
    const newNotification = {
      id: notifications.length + 1,
      type: 'signature_completed',
      title: 'Signer confirmed signing',
      message: `You have successfully signed the document "${envelope?.documentName}".`,
      timestamp: new Date().toISOString().split('T')[0],
      isRead: false
    }
    setNotifications([...notifications, newNotification])
    
    // Add audit log entry
    const newAuditLog = {
      id: auditLogs.length + 1,
      action: 'SIGN_DOC',
      actor: 'signer2@example.com',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: `Signer2 signed document "${envelope?.documentName}"`,
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    setAuditLogs([...auditLogs, newAuditLog])
    
    // Show success alert
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 5000)
    
    // In a real app, this would trigger the actual signing process
  }

  const handleDecline = () => {
    console.log('Signer declined')
    
    // Add notification
    const newNotification = {
      id: notifications.length + 1,
      type: 'envelope_rejected',
      title: 'Signer declined envelope NDA',
      message: `You have declined to sign the document "${envelope?.documentName}".`,
      timestamp: new Date().toISOString().split('T')[0],
      isRead: false
    }
    setNotifications([...notifications, newNotification])
    
    // Add audit log entry
    const newAuditLog = {
      id: auditLogs.length + 1,
      action: 'DECLINE_SIGN',
      actor: 'signer2@example.com',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: `Signer2 declined document "${envelope?.documentName}"`,
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    setAuditLogs([...auditLogs, newAuditLog])
    
    // Show decline alert
    setShowDeclineAlert(true)
    setTimeout(() => setShowDeclineAlert(false), 5000)
    
    // In a real app, this would decline the signing request
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review & Sign</h1>
        <p className="text-gray-600 mt-1">
          Please review the document and confirm your signature
        </p>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50">
          <PenTool className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You have signed this document
          </AlertDescription>
        </Alert>
      )}

      {/* Decline Alert */}
      {showDeclineAlert && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You declined to sign
          </AlertDescription>
        </Alert>
      )}

      {/* Document Section */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">PDF</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{envelope.documentName}</p>
                <p className="text-sm text-gray-600">PDF Document</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/documents/${envelope.documentId}`} className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>View Preview</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Envelope Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Envelope Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Envelope:</span>
              <span className="ml-2 text-sm text-gray-900">{envelope.subject}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-sm text-gray-900">{envelope.createdAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signing Order */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Signing Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envelope.signers
              .sort((a, b) => a.order - b.order)
              .map((signer) => (
                <div
                  key={signer.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    signer.isCurrentUser 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600">
                      {signer.order}.
                    </span>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{signer.email}</span>
                      {signer.isCurrentUser && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(signer.status)}>
                    {signer.status}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Alert className="border-amber-200 bg-amber-50">
        <CheckCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Confirmation Message:</strong><br />
          By confirming, you agree to sign this document electronically. 
          Your electronic signature will have the same legal effect as a handwritten signature.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Sign?</h3>
              <p className="text-sm text-gray-600">
                Review the document and confirm your signature
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                <span>Decline</span>
              </Button>
              <Button 
                onClick={handleConfirmSign}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Sign</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
