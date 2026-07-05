/**
 * Authority Modal Component - Professional modal with legal confidence design
 * Features modal slide animation with weight bounce and authority styling
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modalVariants } from '@/lib/motion';
import { Button } from './button';

// ===== TYPES =====
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'authority' | 'warning' | 'success' | 'info';

interface AuthorityModalProps {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when modal open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Modal size variant */
  size?: ModalSize;
  /** Modal style variant */
  variant?: ModalVariant;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing escape closes modal */
  closeOnEscape?: boolean;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Additional CSS classes for content */
  className?: string;
  /** Additional CSS classes for overlay */
  overlayClassName?: string;
  /** Children content */
  children?: React.ReactNode;
}

// ===== SIZE CONFIGURATIONS =====
const sizeConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-4',
} as const;

// ===== VARIANT CONFIGURATIONS =====
const variantConfig = {
  default: {
    border: 'border-border',
    titleColor: 'text-primary',
    icon: null,
    iconBg: '',
  },
  authority: {
    border: 'border-primary-light',
    titleColor: 'text-primary',
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-primary-light text-primary',
  },
  warning: {
    border: 'border-warning-light',
    titleColor: 'text-warning',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-warning-light text-warning',
  },
  success: {
    border: 'border-success-light',
    titleColor: 'text-success',
    icon: <CheckCircle className="w-5 h-5" />,
    iconBg: 'bg-success-light text-success',
  },
  info: {
    border: 'border-info-light',
    titleColor: 'text-info',
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-info-light text-secondary',
  },
} as const;

// ===== MODAL OVERLAY =====
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    asChild
    {...props}
  >
    <motion.div
      className={cn(
        'fixed inset-0 z-modal bg-inverse-surface/80 backdrop-blur-sm',
        className
      )}
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }}
      initial="initial"
      animate="animate"
      exit="exit"
    />
  </DialogPrimitive.Overlay>
));
ModalOverlay.displayName = 'ModalOverlay';

// ===== MODAL CONTENT =====
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: ModalSize;
    variant?: ModalVariant;
    className?: string;
  }
>(({ className, size = 'md', variant = 'default', children, ...props }, ref) => {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            'fixed left-1/2 top-1/2 z-modal w-full -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-lg shadow-authority border-2',
            'focus:outline-none focus:ring-2 focus:ring-status-your-turn focus:ring-offset-2',
            sizeStyles,
            variantStyles.border,
            className
          )}
          variants={{
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: 20 }
          }}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
ModalContent.displayName = 'ModalContent';

// ===== MODAL HEADER =====
interface ModalHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left px-6 py-4 border-b border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ModalHeader.displayName = 'ModalHeader';

// ===== MODAL BODY =====
interface ModalBodyProps {
  children?: React.ReactNode;
  className?: string;
}

const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
ModalBody.displayName = 'ModalBody';

// ===== MODAL FOOTER =====
interface ModalFooterProps {
  children?: React.ReactNode;
  className?: string;
}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 border-t border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';

// ===== MODAL TITLE =====
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
    variant?: ModalVariant;
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = variantConfig[variant];
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight font-heading',
        variantStyles.titleColor,
        className
      )}
      {...props}
    />
  );
});
ModalTitle.displayName = 'ModalTitle';

// ===== MODAL DESCRIPTION =====
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted font-body', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

// ===== MODAL CLOSE =====
const ModalClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity',
      'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'disabled:pointer-events-none',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
ModalClose.displayName = 'ModalClose';

// ===== MAIN AUTHORITY MODAL COMPONENT =====
export function AuthorityModal({
  open,
  onOpenChange,
  size = 'md',
  variant = 'default',
  title,
  description,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  icon,
  footer,
  className,
  overlayClassName,
  children,
}: AuthorityModalProps) {
  const variantStyles = variantConfig[variant];
  const displayIcon = icon || variantStyles.icon;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <ModalContent 
            size={size} 
            variant={variant}
            className={className}
            onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
            onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
          >
            {showCloseButton && <ModalClose />}
            
            {(title || description || displayIcon) && (
              <ModalHeader>
                <div className="flex items-start gap-3">
                  {displayIcon && (
                    <motion.div
                      className={cn(
                        'flex items-center justify-center rounded-full p-2 flex-shrink-0',
                        variantStyles.iconBg
                      )}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    >
                      {displayIcon}
                    </motion.div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {title && (
                      <ModalTitle variant={variant}>
                        {title}
                      </ModalTitle>
                    )}
                    
                    {description && (
                      <ModalDescription className="mt-1">
                        {description}
                      </ModalDescription>
                    )}
                  </div>
                </div>
              </ModalHeader>
            )}
            
            {children && (
              <ModalBody>
                {children}
              </ModalBody>
            )}
            
            {footer && (
              <ModalFooter>
                {footer}
              </ModalFooter>
            )}
          </ModalContent>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

// ===== PRESET MODAL COMPONENTS =====

interface ConfirmationModalProps extends Omit<AuthorityModalProps, 'variant' | 'footer'> {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'authority' | 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationModal({
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'authority',
  isLoading = false,
  ...props
}: ConfirmationModalProps) {
  const footer = (
    <div className="flex gap-2 w-full sm:w-auto sm:flex-row flex-col-reverse">
      <Button
        variant="secondary"
        onClick={onCancel}
        disabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        state={isLoading ? 'loading' : 'idle'}
        loadingText="Processing..."
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <AuthorityModal
      {...props}
      variant="authority"
      footer={footer}
    />
  );
}

export function SignatureConfirmationModal({
  signerName,
  documentTitle,
  onConfirm,
  onCancel,
  ...props
}: Omit<ConfirmationModalProps, 'title' | 'description'> & {
  signerName?: string;
  documentTitle?: string;
}) {
  return (
    <ConfirmationModal
      {...props}
      title="Confirm Digital Signature"
      description={
        signerName && documentTitle
          ? `${signerName}, you are about to digitally sign "${documentTitle}". This action is legally binding.`
          : "You are about to apply your digital signature. This action is legally binding."
      }
      confirmText="Sign Document"
      confirmVariant="authority"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// Export individual components for advanced usage
export {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
  ModalOverlay,
};
