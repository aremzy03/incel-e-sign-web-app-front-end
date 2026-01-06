'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Users, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Globe,
  Lock,
  Award
} from 'lucide-react';

import { AuthorityButton, Button } from '@/components/ui/button';
import { SignatureSeal } from '@/components/ui/signature-seal';
import { pageVariants, createStagger, createEntrance } from '@/lib/motion';
import { IncelLogo } from '@/components/ui/incel-logo';

// Wrapper component to make IncelLogo compatible with Lucide icon interface
const IncelLogoIcon = ({ className }: { className?: string }) => (
  <IncelLogo variant="icon" className={className} size={24} />
)

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const features = [
  {
    icon: IncelLogoIcon,
    title: 'Legal Authority',
    description: 'Enterprise-grade security with legally binding digital signatures that meet international compliance standards.',
  },
  {
    icon: FileCheck,
    title: 'Document Integrity',
    description: 'Complete audit trails and tamper-evident technology ensure your documents maintain legal validity.',
  },
  {
    icon: Users,
    title: 'Multi-Party Signing',
    description: 'Seamless collaboration with multiple signers, sequential or parallel signing workflows.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sign documents in seconds with our award-winning user interface designed for efficiency.',
  },
];

const stats = [
  { label: 'Documents Signed', value: '1M+', icon: FileCheck },
  { label: 'Enterprise Clients', value: '500+', icon: Users },
  { label: 'Countries Supported', value: '50+', icon: Globe },
  { label: 'Security Certifications', value: '15+', icon: Lock },
];

export default function HomePage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative bg-authority-gradient text-white py-24 overflow-hidden">
        <div className="container-corporate relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-8"
            variants={createStagger(0.2)}
            initial="initial"
            animate="animate"
          >
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold font-heading leading-tight"
              variants={createEntrance('up')}
            >
              Legal Authority in
              <span className="block text-blue-300">Digital Signatures</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
              variants={createEntrance('up')}
            >
              Award-winning e-signature platform designed for legal confidence. 
              Secure, compliant, and trusted by enterprises worldwide.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={createEntrance('up')}
            >
              <AuthorityButton size="xl" asChild>
                <Link href="/dashboard">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </AuthorityButton>
              
              <Button 
                variant="secondary" 
                size="xl"
                asChild
              >
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex justify-center items-center gap-8 pt-8 opacity-80"
              variants={createEntrance('up')}
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">ISO 27001 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <IncelLogo className="w-5 h-5" />
                <span className="text-sm">SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-corporate">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            variants={createStagger(0.1)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center space-y-3"
                variants={createEntrance('up')}
              >
                <stat.icon className="w-8 h-8 text-blue-500 mx-auto" />
                <div className="text-3xl lg:text-4xl font-bold font-heading text-navy-900">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container-corporate">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-h1">
              Why Enterprises Choose INCEL E-Sign
            </h2>
            <p className="text-body text-gray-600 max-w-2xl mx-auto">
              Built for legal professionals who demand the highest standards of security, 
              compliance, and user experience in digital document signing.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
            variants={createStagger(0.15)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="authority-container p-8 space-y-6"
                variants={createEntrance('up')}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-h3">{feature.title}</h3>
                </div>
                <p className="text-body text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Signature Demo Section */}
      <section className="py-24 bg-white">
        <div className="container-corporate">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="text-h1">
                Experience Legal-Grade Digital Signatures
              </h2>
              <p className="text-body text-gray-600 max-w-2xl mx-auto">
                Our signature seal technology provides visual confirmation of document integrity 
                and legal validity, giving you confidence in every signed agreement.
              </p>
            </div>

            {/* Interactive Signature Demo */}
            <div className="flex flex-wrap justify-center gap-8 py-8">
              <SignatureSeal
                status="signed"
                signerName="Sarah Johnson"
                signedDate={new Date('2024-01-15')}
                size="lg"
                variant="corporate"
                companyName="INCEL"
              />
              <SignatureSeal
                status="pending"
                signerName="Michael Chen"
                size="lg"
                variant="premium"
                companyName="INCEL"
              />
              <SignatureSeal
                status="signing"
                signerName="Current User"
                size="lg"
                variant="default"
                companyName="INCEL"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                <AuthorityButton size="lg" asChild>
                  <Link href="/dashboard">
                    Start Signing Documents
                  </Link>
                </AuthorityButton>
                
                <Button variant="outline" size="lg" asChild>
                  <Link href="/design-system-demo">
                    View Design System
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                No credit card required • 30-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-navy-900 text-white">
        <div className="container-corporate text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Join thousands of legal professionals who trust INCEL E-Sign 
            for their most important document signing needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="xl"
              asChild
            >
              <Link href="/register">
                Create Free Account
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="xl"
              className="text-white border-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
      </div>
    </div>
      </section>
    </motion.div>
  )
}
