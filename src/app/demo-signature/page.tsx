'use client';

import React from 'react';
import { SignatureDocumentViewer } from '@/components/signature/signature-document-viewer';

// Mock document data for demonstration
const mockDocument = {
  id: '1',
  title: 'Service Agreement Contract',
  status: 'in-progress' as const,
  createdAt: new Date('2024-01-10'),
  pages: [
    {
      id: 'page-1',
      pageNumber: 1,
      imageUrl: 'https://via.placeholder.com/612x792/f8f9fa/333?text=Contract+Page+1',
      width: 612,
      height: 792,
      signatureFields: [
        {
          id: 'field-1',
          type: 'signature' as const,
          position: { x: 100, y: 600 },
          size: { width: 200, height: 60 },
          page: 1,
          required: true,
          assignedTo: 'signer-1',
          signed: false,
        },
        {
          id: 'field-2', 
          type: 'date' as const,
          position: { x: 350, y: 600 },
          size: { width: 120, height: 40 },
          page: 1,
          required: true,
          assignedTo: 'signer-1',
          signed: false,
        },
        {
          id: 'field-3',
          type: 'initial' as const,
          position: { x: 500, y: 200 },
          size: { width: 80, height: 40 },
          page: 1,
          required: false,
          assignedTo: 'signer-2',
          signed: true,
          value: 'SJ',
          timestamp: new Date('2024-01-15'),
        }
      ]
    },
    {
      id: 'page-2',
      pageNumber: 2,
      imageUrl: 'https://via.placeholder.com/612x792/f8f9fa/333?text=Contract+Page+2',
      width: 612,
      height: 792,
      signatureFields: [
        {
          id: 'field-4',
          type: 'signature' as const,
          position: { x: 100, y: 700 },
          size: { width: 200, height: 60 },
          page: 2,
          required: true,
          assignedTo: 'signer-2',
          signed: true,
          value: 'Sarah Johnson',
          timestamp: new Date('2024-01-15'),
        }
      ]
    }
  ],
  signers: [
    {
      id: 'signer-1',
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'Client',
      status: 'pending' as const,
      color: '#3B82F6',
    },
    {
      id: 'signer-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@incel.com',
      role: 'Contract Manager',
      status: 'signed' as const,
      signedAt: new Date('2024-01-15'),
      color: '#10B981',
    }
  ]
};

const currentSigner = mockDocument.signers[0]; // John Smith (pending)

export default function DemoSignaturePage() {
  const handleSignField = (field: any) => {
    console.log('Signing field:', field);
  };

  const handleFieldUpdate = (fieldId: string, value: string) => {
    console.log('Updating field:', fieldId, 'with value:', value);
  };

  const handleDocumentComplete = () => {
    console.log('Document completed!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container-corporate">
          <h1 className="text-h2">Document Signature Demo</h1>
          <p className="text-body text-gray-600 mt-1">
            Experience our award-winning signature document viewer with legal authority design
          </p>
        </div>
      </div>

      <SignatureDocumentViewer
        document={mockDocument}
        currentSigner={currentSigner}
        showSigners={true}
        showToolbar={true}
        onSignField={handleSignField}
        onFieldUpdate={handleFieldUpdate}
        onDocumentComplete={handleDocumentComplete}
      />
    </div>
  );
}
