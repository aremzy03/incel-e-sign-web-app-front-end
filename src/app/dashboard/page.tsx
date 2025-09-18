import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, John Doe
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your documents and envelopes in one place.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Document Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Upload Document
            </CardTitle>
            <CardDescription>
              Upload new documents to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/documents">
                Upload Document
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Create Envelope Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✉️</span>
              Create Envelope
            </CardTitle>
            <CardDescription>
              Create and send document envelopes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/envelopes">
                Create Envelope
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Signatures Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✍️</span>
              Signatures
            </CardTitle>
            <CardDescription>
              Manage your digital signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/signatures">
                Manage Signatures
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              Recent Documents
            </CardTitle>
            <CardDescription>
              Your latest uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Contract Agreement.pdf</p>
                  <p className="text-sm text-gray-500">Aug 15, 2024</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Signed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Invoice #1234.pdf</p>
                  <p className="text-sm text-gray-500">Aug 10, 2024</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">NDA Template.pdf</p>
                  <p className="text-sm text-gray-500">Aug 5, 2024</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Draft
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/documents">
                  View All Documents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Envelopes */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">✉️</span>
              Recent Envelopes
            </CardTitle>
            <CardDescription>
              Your latest document envelopes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Q3 Contract Review</p>
                  <p className="text-sm text-gray-500">Aug 15, 2024</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Employee Handbook</p>
                  <p className="text-sm text-gray-500">Aug 12, 2024</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Sent
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Legal Agreement</p>
                  <p className="text-sm text-gray-500">Aug 8, 2024</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Draft
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/envelopes">
                  View All Envelopes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
