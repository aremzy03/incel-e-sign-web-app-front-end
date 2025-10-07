"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Send, 
  PenTool, 
  Plus, 
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthorityButton, Button } from '@/components/ui/button';
import { SignatureSeal } from '@/components/ui/signature-seal';
import { createStagger, createEntrance } from '@/lib/motion';
import { getDocuments, type Document } from '@/lib/api/documents';
import { getEnvelopes, type EnvelopesListResponse } from '@/lib/api/envelopes';

// Mock data for demonstration
const stats = [
  {
    label: 'Documents Signed',
    value: '124',
    change: '+12%',
    trend: 'up' as const,
    icon: CheckCircle,
    color: 'text-success-600',
  },
  {
    label: 'Pending Signatures',
    value: '8',
    change: '-3',
    trend: 'down' as const,
    icon: Clock,
    color: 'text-warning-600',
  },
  {
    label: 'Active Envelopes',
    value: '23',
    change: '+5',
    trend: 'up' as const,
    icon: Send,
    color: 'text-blue-600',
  },
  {
    label: 'Completion Rate',
    value: '96%',
    change: '+2%',
    trend: 'up' as const,
    icon: BarChart3,
    color: 'text-navy-600',
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  
  // Get user's display name
  const userName = session?.user?.full_name || session?.user?.name || 'User';
  
  const { data: documents, isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ['documents', 'recent'],
    queryFn: getDocuments,
    staleTime: 30_000,
  });
  
  const { data: envelopesResp, isLoading: envLoading } = useQuery<EnvelopesListResponse>({
    queryKey: ['envelopes', { page: 1, pageSize: 10 }],
    queryFn: () => getEnvelopes(1, 10),
    staleTime: 30_000,
  });

  const recentDocs = (documents || []).slice(0, 3);
  const recentEnvs = (envelopesResp?.results || []).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-corporate py-8 space-y-8">
        {/* Welcome Header */}
        <motion.div
          className="authority-container p-8 bg-gray-50 border border-gray-200"
          variants={createEntrance('up')}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold font-heading text-navy-900">
                Welcome back, {userName}
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your digital signatures with legal authority and confidence.
              </p>
            </div>
            
            <div className="hidden lg:flex items-center gap-4">
              <SignatureSeal
                status="signed"
                signerName="You"
                size="md"
                variant="minimal"
                companyName="INCEL"
                animate={false}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={createStagger(0.1)}
          initial="initial"
          animate="animate"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={createEntrance('up')}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="authority-container">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold font-heading text-navy-900">
                        {stat.value}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-4">
                    <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' ? 'text-success-500' : 'text-error-500'}`} />
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="space-y-6"
          variants={createEntrance('up')}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-h2">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Document */}
            <Card className="authority-container group hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-h3">Upload Document</CardTitle>
                    <CardDescription>
                      Add new documents for signing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AuthorityButton size="lg" className="w-full" asChild>
                  <Link href="/dashboard/documents">
                    <Plus className="w-4 h-4" />
                    Upload Document
                  </Link>
                </AuthorityButton>
              </CardContent>
            </Card>

            {/* Create Envelope */}
            <Card className="authority-container group hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200 transition-colors">
                    <Send className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <CardTitle className="text-h3">Create Envelope</CardTitle>
                    <CardDescription>
                      Send documents for signature
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="default" size="lg" className="w-full" asChild>
                  <Link href="/dashboard/envelopes">
                    <Send className="w-4 h-4" />
                    Create Envelope
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Manage Signatures */}
            <Card className="authority-container group hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center group-hover:bg-warning-200 transition-colors">
                    <PenTool className="w-6 h-6 text-warning-600" />
                  </div>
                  <div>
                    <CardTitle className="text-h3">Signatures</CardTitle>
                    <CardDescription>
                      Manage your digital signatures
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" size="lg" className="w-full" asChild>
                  <Link href="/dashboard/signatures">
                    <PenTool className="w-4 h-4" />
                    Manage Signatures
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Documents */}
          <motion.div
            variants={createEntrance('up')}
            initial="initial"
            animate="animate"
          >
            <Card className="authority-container h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-h3">Recent Documents</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/documents">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Your latest uploaded documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="loading-authority h-16 rounded-lg" />
                    ))}
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-body">No recent documents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDocs.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-navy-900">{doc.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href="/dashboard/documents">
                      View All Documents
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Envelopes */}
          <motion.div
            variants={createEntrance('up')}
            initial="initial"
            animate="animate"
          >
            <Card className="authority-container h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-success-600" />
                    <CardTitle className="text-h3">Recent Envelopes</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/envelopes">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Your latest document envelopes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {envLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="loading-authority h-16 rounded-lg" />
                    ))}
                  </div>
                ) : recentEnvs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-body">No recent envelopes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentEnvs.map((env, index) => (
                      <motion.div
                        key={env.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-success-600" />
                          </div>
                          <div>
                            <p className="font-medium text-navy-900">
                              {env.document?.file_name || 'Envelope'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(env.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href="/dashboard/envelopes">
                      View All Envelopes
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
