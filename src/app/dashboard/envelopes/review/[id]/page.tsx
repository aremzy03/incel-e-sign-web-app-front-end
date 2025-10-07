'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Send, X, Eye, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'

// Dummy comment data
const dummyComments = [
  {
    id: 1,
    author: 'John Doe',
    message: 'Please double-check the second page.',
    timestamp: '2025-09-16 10:32'
  },
  {
    id: 2,
    author: 'Jane Smith',
    message: 'Looks good to me!',
    timestamp: '2025-09-16 10:40'
  }
]

// Dummy envelope data for review
const dummyEnvelopes = [
  {
    id: 1,
    subject: 'NDA Agreement',
    status: 'Draft',
    createdAt: '2025-09-16',
    documentName: 'contract.pdf',
    documentId: 1,
    recipients: [
      { id: 1, email: 'signer1@example.com', order: 1 },
      { id: 2, email: 'signer2@example.com', order: 2 }
    ]
  },
  {
    id: 2,
    subject: 'Sales Contract',
    status: 'Draft',
    createdAt: '2025-09-15',
    documentName: 'sales-doc.pdf',
    documentId: 2,
    recipients: [
      { id: 1, email: 'buyer@example.com', order: 1 },
      { id: 2, email: 'manager@example.com', order: 2 },
      { id: 3, email: 'legal@example.com', order: 3 }
    ]
  },
  {
    id: 3,
    subject: 'Service Agreement',
    status: 'Draft',
    createdAt: '2025-09-14',
    documentName: 'service-agreement.pdf',
    documentId: 3,
    recipients: [
      { id: 1, email: 'client@example.com', order: 1 }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800'
    case 'Sent':
      return 'bg-blue-100 text-blue-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EnvelopeReviewPage() {
  const params = useParams()
  const envelopeId = params?.id ? parseInt(params.id as string) : null
  
  // Comment state
  const [comments, setComments] = useState(dummyComments)
  const [newComment, setNewComment] = useState('')
  
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
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  
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

  const handleSendEnvelope = () => {
    console.log('Envelope sent')
    
    // Add notification
    const newNotification = {
      id: notifications.length + 1,
      type: 'envelope_sent',
      title: `Envelope ${envelope?.subject} sent`,
      message: `Your envelope "${envelope?.subject}" has been sent to ${envelope?.recipients.length} recipients.`,
      timestamp: new Date().toISOString().split('T')[0],
      isRead: false
    }
    setNotifications([...notifications, newNotification])
    
    // Add audit log entry
    const newAuditLog = {
      id: auditLogs.length + 1,
      action: 'SEND_ENV',
      actor: 'creator@test.com',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: `Envelope "${envelope?.subject}" sent to ${envelope?.recipients.length} recipients`,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    setAuditLogs([...auditLogs, newAuditLog])
    
    // Show success alert
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 5000)
    
    // In a real app, this would trigger the actual sending process
  }

  const handleCancel = () => {
    console.log('Envelope cancelled')
    // In a real app, this would cancel the envelope creation
  }

  const handlePostComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        author: 'Current User', // In a real app, this would be the logged-in user
        message: newComment.trim(),
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', '')
      }
      setComments([...comments, comment])
      setNewComment('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Envelope: {envelope.subject}</h1>
        <div className="flex items-center space-x-4 mt-2">
          <Badge className={getStatusColor(envelope.status)}>
            Status: {envelope.status}
          </Badge>
          <span className="text-gray-600">Created: {envelope.createdAt}</span>
        </div>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Envelope sent successfully
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
                <p className="font-medium text-gray-900">{envelope.name || envelope.documentName}</p>
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

      {/* Recipients Section */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {envelope.recipients
                .sort((a, b) => a.order - b.order)
                .map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">
                      {recipient.order}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {recipient.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Pending
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">({comment.timestamp})</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                size="sm"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Send?</h3>
              <p className="text-sm text-gray-600">
                Review the details above and send the envelope to all recipients
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button 
                onClick={handleSendEnvelope}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send Envelope</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
