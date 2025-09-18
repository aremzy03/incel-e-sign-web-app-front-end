'use client'

import Link from 'next/link'
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

// Dummy data for envelopes
const dummyEnvelopes = [
  {
    id: 1,
    subject: 'Contract NDA',
    status: 'Draft',
    createdAt: '2025-09-16',
    recipients: 2,
    documentCount: 1
  },
  {
    id: 2,
    subject: 'Sales Document',
    status: 'Sent',
    createdAt: '2025-09-15',
    recipients: 3,
    documentCount: 1
  },
  {
    id: 3,
    subject: 'Invoice #1234',
    status: 'Completed',
    createdAt: '2025-09-14',
    recipients: 1,
    documentCount: 1
  },
  {
    id: 4,
    subject: 'Offer Letter',
    status: 'Rejected',
    createdAt: '2025-09-13',
    recipients: 1,
    documentCount: 1
  },
  {
    id: 5,
    subject: 'Legal Agreement',
    status: 'Draft',
    createdAt: '2025-09-12',
    recipients: 2,
    documentCount: 1
  },
  {
    id: 6,
    subject: 'Employment Contract',
    status: 'Sent',
    createdAt: '2025-09-11',
    recipients: 1,
    documentCount: 1
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
    case 'Rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EnvelopesPage() {
  const handleEnvelopeClick = (envelopeId: number) => {
    console.log(`Clicked on envelope ${envelopeId}`)
    // TODO: Navigate to envelope detail page
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envelopes</h1>
          <p className="text-gray-600 mt-1">
            Manage your document envelopes and track their status
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/envelopes/create">
            Create New Envelope
          </Link>
        </Button>
      </div>

      {/* Envelopes Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Your Envelopes</CardTitle>
          <CardDescription>
            View and manage all your document envelopes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyEnvelopes.map((envelope) => (
                <TableRow
                  key={envelope.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleEnvelopeClick(envelope.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">✉️</span>
                      </div>
                      <span className="text-gray-900">{envelope.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        envelope.status
                      )}`}
                    >
                      {envelope.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {envelope.recipients} recipient{envelope.recipients !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {envelope.createdAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State (hidden when envelopes exist) */}
      {dummyEnvelopes.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No envelopes yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first envelope to start sending documents for signing
            </p>
            <Button asChild>
              <Link href="/dashboard/envelopes/create">
                Create Your First Envelope
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
