/**
 * Design System Showcase - Complete demonstration of the award-winning design system
 * Portfolio-worthy component showcasing all design tokens, components, and interactions
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  Smartphone, 
  Monitor,
  Tablet,
  CheckCircle,
  Eye,
  Download,
  Share2,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { IncelLogo } from '@/components/ui/incel-logo';
import { tokens } from '@/lib/design-tokens';
import { pageVariants, createStagger, createEntrance } from '@/lib/motion';
import { usePlatform, useBreakpoint } from '@/lib/platform';
import { usePerformanceMonitor } from '@/lib/performance';

// Import our components
import { Button, AuthorityButton, SignButton, DeclineButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignatureSeal, SignatureCollection } from '@/components/ui/signature-seal';
import { AuthorityModal, ConfirmationModal } from '@/components/ui/authority-modal';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormInput, 
  FormTextarea, 
  FormMessage,
  SignatureField 
} from '@/components/ui/authority-form';

// ===== SECTION COMPONENTS =====

interface SectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, description, icon, children, className }: SectionProps) {
  return (
    <motion.section
      className={cn('space-y-8', className)}
      variants={createEntrance('up')}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="text-center space-y-4">
        <motion.div
          className="flex items-center justify-center w-16 h-16 mx-auto bg-primary-light text-primary rounded-full"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {icon}
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-h1">{title}</h2>
          <p className="text-body text-muted max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
}

// ===== COLOR PALETTE SHOWCASE =====

function ColorPaletteShowcase() {
  const colorGroups = [
    {
      name: 'Brand Colors',
      colors: [
        { name: 'Primary Navy', value: tokens.colors.primary, description: 'Authority & sidebar' },
        { name: 'CTA Teal', value: tokens.colors.secondary, description: 'Primary actions' },
        { name: 'Accent Teal', value: tokens.colors.accent, description: 'Focus & your turn' },
        { name: 'Surface', value: tokens.colors.surface, description: 'Cards & tables' },
      ]
    },
    {
      name: 'Status Colors',
      colors: [
        { name: 'Draft', value: tokens.colors.statusDraft, description: 'Not yet sent' },
        { name: 'Pending', value: tokens.colors.statusPending, description: 'Awaiting signatures' },
        { name: 'Completed', value: tokens.colors.statusCompleted, description: 'Fully executed' },
        { name: 'Rejected', value: tokens.colors.statusRejected, description: 'Declined' },
        { name: 'Your Turn', value: tokens.colors.statusYourTurn, description: 'Action required' },
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {colorGroups.map((group, groupIndex) => (
        <motion.div
          key={group.name}
          className="space-y-6"
          variants={createStagger(0.1, groupIndex * 0.1)}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-h2 text-center">{group.name}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {group.colors.map((color, colorIndex) => (
              <motion.div
                key={color.name}
                className="rounded-xl border border-border bg-white p-6 text-center space-y-4 shadow-card"
                variants={createEntrance('up')}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full shadow-lg"
                  style={{ backgroundColor: color.value }}
                />
                
                <div className="space-y-1">
                  <h4 className="font-heading font-semibold text-primary">
                    {color.name}
                  </h4>
                  <p className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded">
                    {color.value}
                  </p>
                  <p className="text-sm text-muted">
                    {color.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===== TYPOGRAPHY SHOWCASE =====

function TypographyShowcase() {
  const typeScale = [
    { name: 'Display', class: 'text-display', example: 'Legal Authority' },
    { name: 'Heading 1', class: 'text-h1', example: 'Document Management' },
    { name: 'Heading 2', class: 'text-h2', example: 'Signature Process' },
    { name: 'Heading 3', class: 'text-h3', example: 'Status Updates' },
    { name: 'Body Text', class: 'text-body', example: 'Professional e-signature solutions for legal documents with complete audit trails and compliance features.' },
    { name: 'Small Text', class: 'text-small', example: 'Additional information and metadata' },
    { name: 'Caption', class: 'text-caption', example: 'Timestamps and fine print' },
  ];

  return (
    <div className="space-y-8">
      {typeScale.map((type, index) => (
        <motion.div
          key={type.name}
          className="rounded-xl border border-border bg-white shadow-card p-6 space-y-2"
          variants={createEntrance('up')}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              {type.name}
            </span>
            <span className="text-xs font-mono text-muted">
              {type.class}
            </span>
          </div>
          
          <div className={type.class}>
            {type.example}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===== COMPONENT SHOWCASE =====

function ComponentShowcase() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [signatures] = React.useState([
    {
      id: '1',
      signerName: 'John Smith',
      status: 'signed' as const,
      signedDate: new Date('2024-01-15'),
    },
    {
      id: '2',
      signerName: 'Sarah Johnson', 
      status: 'pending' as const,
    },
    {
      id: '3',
      signerName: 'Michael Chen',
      status: 'signing' as const,
    }
  ]);

  return (
    <div className="space-y-12">
      {/* Buttons */}
      <div className="space-y-6">
        <h3 className="text-h2 text-center">Authority Buttons</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-h3 text-center">Primary Actions</h4>
            <div className="space-y-3">
              <SignButton />
              <AuthorityButton>Execute Contract</AuthorityButton>
              <Button variant="default">Standard Action</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-h3 text-center">Secondary Actions</h4>
            <div className="space-y-3">
              <Button variant="secondary">Review Document</Button>
              <Button variant="outline">Preview Changes</Button>
              <Button variant="ghost">Cancel Process</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-h3 text-center">Status Actions</h4>
            <div className="space-y-3">
              <Button variant="success" state="success" successText="Completed">
                Success State
              </Button>
              <DeclineButton />
              <Button 
                variant="default" 
                state="loading" 
                loadingText="Processing..."
              >
                Loading State
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="space-y-6">
        <h3 className="text-h2 text-center">Status Badges</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <Badge variant="draft">Draft</Badge>
          <Badge variant="pending">Pending</Badge>
          <Badge variant="completed">Completed</Badge>
          <Badge variant="rejected">Rejected</Badge>
          <Badge variant="yourTurn">Your Turn</Badge>
        </div>
      </div>

      {/* Signature Elements */}
      <div className="space-y-6">
        <h3 className="text-h2 text-center">Signature Elements</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-h3">Individual Signatures</h4>
            <div className="flex flex-wrap gap-6 justify-center">
              <SignatureSeal
                status="signed"
                signerName="John Smith"
                signedDate={new Date('2024-01-15')}
                size="lg"
                variant="corporate"
              />
              <SignatureSeal
                status="pending"
                signerName="Pending User"
                size="lg"
                variant="default"
              />
              <SignatureSeal
                status="signing"
                signerName="Active User"
                size="lg"
                variant="premium"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-h3">Signature Collection</h4>
            <SignatureCollection
              signatures={signatures}
              variant="corporate"
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-6">
        <h3 className="text-h2 text-center">Professional Forms</h3>
        
        <div className="max-w-2xl mx-auto">
          <Form className="space-y-6">
            <FormField>
              <FormLabel required>Signer Name</FormLabel>
              <FormInput 
                placeholder="Enter full legal name"
                validation="valid"
              />
              <FormMessage variant="success">
                Name format is valid
              </FormMessage>
            </FormField>
            
            <FormField>
              <FormLabel>Email Address</FormLabel>
              <FormInput 
                type="email"
                placeholder="signer@company.com"
                validation="invalid"
              />
              <FormMessage variant="error">
                Please enter a valid email address
              </FormMessage>
            </FormField>
            
            <FormField>
              <FormLabel>Digital Signature</FormLabel>
              <SignatureField
                signerName="John Smith"
                signatureData="signature_data_here"
                onSignatureClick={() => setModalOpen(true)}
              />
            </FormField>
            
            <FormField>
              <FormLabel>Additional Comments</FormLabel>
              <FormTextarea 
                placeholder="Any additional notes or requirements..."
                rows={4}
              />
            </FormField>
          </Form>
        </div>
      </div>

      {/* Modal Demo */}
      <AuthorityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Signature Confirmation"
        description="Please confirm your digital signature for this legal document."
        variant="authority"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="authority" onClick={() => setModalOpen(false)}>
              Confirm Signature
            </Button>
          </div>
        }
      >
        <div className="text-center py-8">
          <SignatureSeal
            status="signing"
            signerName="Current User"
            size="xl"
            variant="premium"
          />
        </div>
      </AuthorityModal>
    </div>
  );
}

// ===== PLATFORM SHOWCASE =====

function PlatformShowcase() {
  const platform = usePlatform();
  const isMobile = useBreakpoint('md-');
  
  const platformIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  };
  
  const PlatformIcon = platformIcons[platform.type];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <PlatformIcon className="w-8 h-8 text-secondary" />
          <span className="text-h3 capitalize">{platform.type} Experience</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-white shadow-card p-6 space-y-4">
          <h4 className="text-h3 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Detection
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Platform:</span>
              <span className="font-medium">{platform.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Touch Device:</span>
              <span className="font-medium">{platform.isTouchDevice ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Hover Support:</span>
              <span className="font-medium">{platform.supportsHover ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Screen Size:</span>
              <span className="font-medium">{platform.screenSize.width}×{platform.screenSize.height}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-card p-6 space-y-4">
          <h4 className="text-h3 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Adaptations
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Button Size:</span>
              <span className="font-medium">{isMobile ? 'Large (Touch)' : 'Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Animations:</span>
              <span className="font-medium">{platform.prefersReducedMotion ? 'Reduced' : 'Full'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Contrast:</span>
              <span className="font-medium">{platform.isHighContrast ? 'High' : 'Normal'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-card p-6 space-y-4">
          <h4 className="text-h3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance
          </h4>
          <PerformanceDisplay />
        </div>
      </div>
    </div>
  );
}

function PerformanceDisplay() {
  const { metrics, getScore } = usePerformanceMonitor();
  
  return (
    <div className="space-y-2 text-sm">
      {metrics.LCP && (
        <div className="flex justify-between">
          <span className="text-muted">LCP:</span>
          <span className={cn(
            'font-medium',
            getScore('LCP') === 'good' ? 'text-success' : 'text-warning'
          )}>
            {Math.round(metrics.LCP)}ms
          </span>
        </div>
      )}
      {metrics.FID && (
        <div className="flex justify-between">
          <span className="text-muted">FID:</span>
          <span className={cn(
            'font-medium',
            getScore('FID') === 'good' ? 'text-success' : 'text-warning'
          )}>
            {Math.round(metrics.FID)}ms
          </span>
        </div>
      )}
      {metrics.CLS !== undefined && (
        <div className="flex justify-between">
          <span className="text-muted">CLS:</span>
          <span className={cn(
            'font-medium',
            getScore('CLS') === 'good' ? 'text-success' : 'text-warning'
          )}>
            {metrics.CLS.toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}

// ===== MAIN SHOWCASE COMPONENT =====

export function DesignSystemShowcase() {
  return (
    <motion.div
      className="min-h-screen bg-surface"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Hero Section */}
      <section className="relative bg-authority-gradient text-white py-24">
        <div className="container-corporate text-center space-y-8">
          <motion.div
            variants={createStagger(0.2)}
            initial="initial"
            animate="animate"
          >
            <motion.h1 
              className="text-6xl lg:text-7xl font-bold font-heading leading-tight"
              variants={createEntrance('up')}
            >
              Authority Design System
            </motion.h1>
            
            <motion.p 
              className="text-xl lg:text-2xl text-on-primary-container max-w-3xl mx-auto leading-relaxed"
              variants={createEntrance('up')}
            >
              Award-winning design system for legal confidence and professional e-signature experiences
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={createEntrance('up')}
            >
              <Button 
                variant="secondary" 
                size="lg"
                icon={<Eye className="w-5 h-5" />}
              >
                Explore Components
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="text-white border-white hover:bg-white/10"
                icon={<Download className="w-5 h-5" />}
              >
                Download Assets
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-light/20 rounded-full blur-xl"
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

      {/* Main Content */}
      <div className="container-corporate py-24 space-y-24">
        <Section
          title="Color Philosophy"
          description="Carefully crafted color palette inspired by DocuSign's authority, designed to instill legal confidence and trust"
          icon={<Palette className="w-8 h-8" />}
        >
          <ColorPaletteShowcase />
        </Section>

        <Section
          title="Typography System"
          description="Hierarchical typography with IBM Plex Sans for headings and Inter for body text, optimized for legal document readability"
          icon={<Type className="w-8 h-8" />}
        >
          <TypographyShowcase />
        </Section>

        <Section
          title="Component Library"
          description="Production-ready components with all states, variants, and accessibility features built-in"
          icon={<Layout className="w-8 h-8" />}
        >
          <ComponentShowcase />
        </Section>

        <Section
          title="Cross-Platform Excellence"
          description="Responsive design that adapts seamlessly across desktop, tablet, and mobile with platform-specific optimizations"
          icon={<Smartphone className="w-8 h-8" />}
        >
          <PlatformShowcase />
        </Section>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container-corporate text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <IncelLogo className="w-6 h-6 text-accent-light" />
            <span className="text-xl font-heading font-bold">INCEL E-Sign</span>
          </div>
          <p className="text-accent-light">
            Award-winning design system for legal confidence
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <Button variant="ghost" size="sm" className="text-accent-light hover:text-white">
              Documentation
            </Button>
            <Button variant="ghost" size="sm" className="text-accent-light hover:text-white">
              GitHub
            </Button>
            <Button variant="ghost" size="sm" className="text-accent-light hover:text-white">
              Figma
            </Button>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
