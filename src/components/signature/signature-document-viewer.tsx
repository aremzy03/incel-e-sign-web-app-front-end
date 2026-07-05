/**
 * Signature Document Viewer - Award-winning document viewer for e-signatures
 * Complete implementation showcasing the entire design system in production use
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  FileText,
  ZoomIn,
  ZoomOut, 
  RotateCw,
  Download,
  Share2,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { documentVariants, createStagger, createEntrance } from '@/lib/motion';
import { usePlatform, useBreakpoint } from '@/lib/platform';
import { useLazyLoad, useVirtualization } from '@/lib/performance';
import { announceToScreenReader } from '@/lib/accessibility';

// Import our components
import { Button, AuthorityButton, SignButton } from '@/components/ui/button';
import { SignatureSeal } from '@/components/ui/signature-seal';
import { AuthorityModal, SignatureConfirmationModal } from '@/components/ui/authority-modal';
import { FormInput } from '@/components/ui/authority-form';

// ===== TYPES =====

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
  required: boolean;
  assignedTo?: string;
  value?: string;
  signed?: boolean;
  timestamp?: Date;
}

export interface DocumentPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  signatureFields: SignatureField[];
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'pending' | 'signed' | 'declined';
  signedAt?: Date;
  color: string;
}

export interface SignatureDocument {
  id: string;
  title: string;
  pages: DocumentPage[];
  signers: Signer[];
  status: 'draft' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

interface SignatureDocumentViewerProps {
  document: SignatureDocument;
  currentSigner?: Signer;
  isReadOnly?: boolean;
  showSigners?: boolean;
  showToolbar?: boolean;
  onSignField?: (field: SignatureField) => void;
  onDocumentComplete?: () => void;
  onFieldUpdate?: (fieldId: string, value: string) => void;
  className?: string;
}

// ===== TOOLBAR COMPONENT =====

interface ToolbarProps {
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
  showAnnotations: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onToggleFullscreen: () => void;
  onToggleAnnotations: () => void;
  onDownload: () => void;
  onShare: () => void;
  className?: string;
}

function DocumentToolbar({
  zoom,
  rotation,
  isFullscreen,
  showAnnotations,
  onZoomIn,
  onZoomOut,
  onRotate,
  onToggleFullscreen,
  onToggleAnnotations,
  onDownload,
  onShare,
  className,
}: ToolbarProps) {
  const isMobile = useBreakpoint('md-');

  return (
    <motion.div
      className={cn(
        'flex items-center justify-between p-4 bg-white border-b border-border shadow-sm',
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Left side - View controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size={isMobile ? 'sm' : 'default'}
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          icon={<ZoomOut className="w-4 h-4" />}
          aria-label="Zoom out"
        >
          {!isMobile && 'Zoom Out'}
        </Button>
        
        <div className="px-3 py-1 bg-surface-container-low rounded text-sm font-mono min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </div>
        
        <Button
          variant="secondary"
          size={isMobile ? 'sm' : 'default'}
          onClick={onZoomIn}
          disabled={zoom >= 3}
          icon={<ZoomIn className="w-4 h-4" />}
          aria-label="Zoom in"
        >
          {!isMobile && 'Zoom In'}
        </Button>

        {!isMobile && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button
              variant="ghost"
              size="default"
              onClick={onRotate}
              icon={<RotateCw className="w-4 h-4" />}
              aria-label="Rotate document"
            >
              Rotate
            </Button>
            
            <Button
              variant="ghost"
              size="default"
              onClick={onToggleAnnotations}
              icon={showAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              aria-label={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? 'Hide Fields' : 'Show Fields'}
            </Button>
          </>
        )}
      </div>

      {/* Right side - Action controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size={isMobile ? 'sm' : 'default'}
          onClick={onToggleFullscreen}
          icon={isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {!isMobile && (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')}
        </Button>
        
        <Button
          variant="secondary"
          size={isMobile ? 'sm' : 'default'}
          onClick={onDownload}
          icon={<Download className="w-4 h-4" />}
          aria-label="Download document"
        >
          {!isMobile && 'Download'}
        </Button>
        
        <Button
          variant="outline"
          size={isMobile ? 'sm' : 'default'}
          onClick={onShare}
          icon={<Share2 className="w-4 h-4" />}
          aria-label="Share document"
        >
          {!isMobile && 'Share'}
        </Button>
      </div>
    </motion.div>
  );
}

// ===== SIGNATURE FIELD COMPONENT =====

interface SignatureFieldComponentProps {
  field: SignatureField;
  signer?: Signer;
  isActive?: boolean;
  isReadOnly?: boolean;
  zoom: number;
  onFieldClick?: (field: SignatureField) => void;
  onFieldUpdate?: (fieldId: string, value: string) => void;
}

function SignatureFieldComponent({
  field,
  signer,
  isActive = false,
  isReadOnly = false,
  zoom,
  onFieldClick,
  onFieldUpdate,
}: SignatureFieldComponentProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(field.value || '');

  const handleClick = () => {
    if (isReadOnly) return;
    
    if (field.type === 'signature' || field.type === 'initial') {
      onFieldClick?.(field);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onFieldUpdate?.(field.id, value);
    setIsEditing(false);
    announceToScreenReader(`Field ${field.type} updated`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(field.value || '');
      setIsEditing(false);
    }
  };

  const fieldStyle = {
    position: 'absolute' as const,
    left: field.position.x * zoom,
    top: field.position.y * zoom,
    width: field.size.width * zoom,
    height: field.size.height * zoom,
    zIndex: isActive ? 20 : 10,
  };

  const getFieldColor = () => {
    if (field.signed) return 'border-success-400 bg-success-50';
    if (signer) return `border-secondary/50 bg-info-light`;
    return 'border-outline bg-surface';
  };

  return (
    <motion.div
      style={fieldStyle}
      className={cn(
        'border-2 border-dashed rounded cursor-pointer transition-all duration-200',
        getFieldColor(),
        isActive && 'ring-2 ring-status-your-turn ring-opacity-50',
        field.required && !field.signed && 'animate-pulse-authority'
      )}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      role="button"
      tabIndex={0}
      aria-label={`${field.type} field ${field.required ? '(required)' : ''}`}
    >
      {/* Field Content */}
      <div className="w-full h-full flex items-center justify-center p-1">
        {isEditing ? (
          <FormInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={field.type === 'date' ? 'MM/DD/YYYY' : `Enter ${field.type}`}
            size="sm"
            className="w-full h-full text-xs"
            autoFocus
          />
        ) : field.signed ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success-500" />
            <span className="text-xs font-medium text-success-700 truncate">
              {field.type === 'signature' ? signer?.name : field.value}
            </span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs text-muted font-medium">
              {field.type === 'signature' ? 'Sign' : 
               field.type === 'initial' ? 'Initial' :
               field.type === 'date' ? 'Date' : 'Text'}
            </span>
            {field.required && (
              <span className="text-xs text-error-500 block">*</span>
            )}
          </div>
        )}
      </div>

      {/* Assigned signer indicator */}
      {signer && !field.signed && (
        <div 
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white text-xs flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: signer.color }}
          title={signer.name}
        >
          {signer.name.charAt(0)}
        </div>
      )}
    </motion.div>
  );
}

// ===== DOCUMENT PAGE COMPONENT =====

interface DocumentPageProps {
  page: DocumentPage;
  signers: Signer[];
  zoom: number;
  rotation: number;
  showAnnotations: boolean;
  isReadOnly: boolean;
  activeFieldId?: string;
  onFieldClick?: (field: SignatureField) => void;
  onFieldUpdate?: (fieldId: string, value: string) => void;
}

function DocumentPageComponent({
  page,
  signers,
  zoom,
  rotation,
  showAnnotations,
  isReadOnly,
  activeFieldId,
  onFieldClick,
  onFieldUpdate,
}: DocumentPageProps) {
  const { elementRef, isInView } = useLazyLoad(0.1, '100px');

  const pageStyle = {
    transform: `rotate(${rotation}deg) scale(${zoom})`,
    transformOrigin: 'center center',
  };

  return (
    <motion.div
      ref={elementRef}
      className="relative bg-white shadow-lg mb-8 mx-auto"
      style={{
        width: page.width * zoom,
        height: page.height * zoom,
      }}
      variants={documentVariants}
      initial="initial"
      animate="animate"
      whileInView="signing"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* Page Image */}
      {isInView && (
        <motion.img
          src={page.imageUrl}
          alt={`Document page ${page.pageNumber}`}
          className="w-full h-full object-contain"
          style={pageStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          loading="lazy"
        />
      )}

      {/* Signature Fields */}
      <AnimatePresence>
        {showAnnotations && page.signatureFields.map((field) => {
          const signer = signers.find(s => s.id === field.assignedTo);
          
          return (
            <SignatureFieldComponent
              key={field.id}
              field={field}
              signer={signer}
              isActive={activeFieldId === field.id}
              isReadOnly={isReadOnly}
              zoom={zoom}
              onFieldClick={onFieldClick}
              onFieldUpdate={onFieldUpdate}
            />
          );
        })}
      </AnimatePresence>

      {/* Page Number */}
      <div className="absolute bottom-4 right-4 bg-primary/80 text-white px-2 py-1 rounded text-sm font-medium">
        Page {page.pageNumber}
      </div>
    </motion.div>
  );
}

// ===== SIGNERS PANEL =====

interface SignersPanelProps {
  signers: Signer[];
  currentSigner?: Signer;
  onSignerSelect?: (signer: Signer) => void;
  className?: string;
}

function SignersPanel({ signers, currentSigner, onSignerSelect, className }: SignersPanelProps) {
  return (
    <motion.div
      className={cn('bg-white border-l border-border p-4 space-y-4 min-w-[280px]', className)}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <h3 className="text-h3 flex items-center gap-2">
        <User className="w-5 h-5" />
        Signers ({signers.length})
      </h3>

      <div className="space-y-3">
        {signers.map((signer, index) => (
          <motion.div
            key={signer.id}
            className={cn(
              'p-3 rounded-lg border-2 cursor-pointer transition-all',
              currentSigner?.id === signer.id 
                ? 'border-status-your-turn bg-info-light'
                : 'border-border hover:border-outline-variant'
            )}
            onClick={() => onSignerSelect?.(signer)}
            variants={createEntrance('right')}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: signer.color }}
                >
                  {signer.name.charAt(0)}
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium text-primary">{signer.name}</div>
                  <div className="text-sm text-muted">{signer.role}</div>
                </div>
              </div>

              <SignatureSeal
                status={signer.status}
                size="sm"
                variant="minimal"
                animate={false}
              />
            </div>

            {signer.signedAt && (
              <div className="mt-2 flex items-center gap-1 text-xs text-success">
                <Clock className="w-3 h-3" />
                Signed {signer.signedAt.toLocaleDateString()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====

export function SignatureDocumentViewer({
  document,
  currentSigner,
  isReadOnly = false,
  showSigners = true,
  showToolbar = true,
  onSignField,
  onDocumentComplete,
  onFieldUpdate,
  className,
}: SignatureDocumentViewerProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showAnnotations, setShowAnnotations] = React.useState(true);
  const [activeFieldId, setActiveFieldId] = React.useState<string>();
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [selectedField, setSelectedField] = React.useState<SignatureField>();

  const platform = usePlatform();
  const isMobile = useBreakpoint('md-');
  
  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  // Field interactions
  const handleFieldClick = (field: SignatureField) => {
    setActiveFieldId(field.id);
    
    if (field.type === 'signature' || field.type === 'initial') {
      setSelectedField(field);
      setConfirmationOpen(true);
    }
    
    onSignField?.(field);
  };

  const handleSignatureConfirm = () => {
    if (selectedField && currentSigner) {
      // Mark field as signed
      const updatedField = {
        ...selectedField,
        signed: true,
        value: currentSigner.name,
        timestamp: new Date(),
      };
      
      onFieldUpdate?.(selectedField.id, currentSigner.name);
      setConfirmationOpen(false);
      setSelectedField(undefined);
      
      // Check if document is complete
      const allRequiredFieldsSigned = document.pages
        .flatMap(page => page.signatureFields)
        .filter(field => field.required)
        .every(field => field.signed);
      
      if (allRequiredFieldsSigned) {
        setTimeout(() => {
          onDocumentComplete?.();
        }, 1000);
      }
      
      announceToScreenReader('Signature applied successfully');
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case 'r':
            e.preventDefault();
            handleRotate();
            break;
        }
      }
    };

    window.document.addEventListener('keydown', handleKeyDown);
    return () => window.document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const completedSignatures = document.signers.filter(s => s.status === 'signed').length;
  const totalSignatures = document.signers.length;
  const progressPercentage = (completedSignatures / totalSignatures) * 100;

  return (
    <div className={cn(
      'flex flex-col h-full bg-surface',
      isFullscreen && 'fixed inset-0 z-50',
      className
    )}>
      {/* Toolbar */}
      {showToolbar && (
        <DocumentToolbar
          zoom={zoom}
          rotation={rotation}
          isFullscreen={isFullscreen}
          showAnnotations={showAnnotations}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRotate={handleRotate}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          onDownload={() => console.log('Download document')}
          onShare={() => console.log('Share document')}
        />
      )}

      {/* Progress Bar */}
      {!isReadOnly && document.status === 'in-progress' && (
        <motion.div 
          className="bg-white border-b border-border p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">
              Signature Progress
            </span>
            <span className="text-sm text-muted">
              {completedSignatures} of {totalSignatures} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-success-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Viewer */}
        <div className="flex-1 overflow-auto p-4">
          <motion.div
            className="max-w-none"
            variants={createStagger(0.1)}
            initial="initial"
            animate="animate"
          >
            {document.pages.map((page) => (
              <DocumentPageComponent
                key={page.id}
                page={page}
                signers={document.signers}
                zoom={zoom}
                rotation={rotation}
                showAnnotations={showAnnotations}
                isReadOnly={isReadOnly}
                activeFieldId={activeFieldId}
                onFieldClick={handleFieldClick}
                onFieldUpdate={onFieldUpdate}
              />
            ))}
          </motion.div>
        </div>

        {/* Signers Panel */}
        {showSigners && !isMobile && (
          <SignersPanel
            signers={document.signers}
            currentSigner={currentSigner}
          />
        )}
      </div>

      {/* Signature Confirmation Modal */}
      <SignatureConfirmationModal
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        signerName={currentSigner?.name}
        documentTitle={document.title}
        onConfirm={handleSignatureConfirm}
        onCancel={() => {
          setConfirmationOpen(false);
          setSelectedField(undefined);
        }}
      />

      {/* Mobile Signers Sheet */}
      {showSigners && isMobile && (
        <motion.div
          className="bg-white border-t border-border p-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex overflow-x-auto gap-3 pb-2">
            {document.signers.map((signer) => (
              <div
                key={signer.id}
                className="flex-shrink-0 flex items-center gap-2 p-2 bg-surface rounded-lg"
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: signer.color }}
                >
                  {signer.name.charAt(0)}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {signer.name}
                </span>
                <SignatureSeal
                  status={signer.status}
                  size="sm"
                  variant="minimal"
                  animate={false}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
