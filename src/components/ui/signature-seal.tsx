/**
 * Signature Seal Component - The signature element that animates like a stamped seal
 * Award-winning design with legal authority and confidence
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { sealVariants, transitions, easing } from '@/lib/motion';
import { tokens } from '@/lib/design-tokens';

// ===== TYPES =====
export type SignatureStatus = 'pending' | 'signing' | 'signed' | 'declined' | 'expired';
export type SealSize = 'sm' | 'md' | 'lg' | 'xl';
export type SealVariant = 'default' | 'minimal' | 'corporate' | 'premium';

interface SignatureSealProps {
  /** Current status of the signature */
  status: SignatureStatus;
  /** Size variant */
  size?: SealSize;
  /** Visual variant */
  variant?: SealVariant;
  /** Signer's name or initials */
  signerName?: string;
  /** Signature date */
  signedDate?: Date;
  /** Custom company seal text */
  companyName?: string;
  /** Whether to show the watermark effect */
  showWatermark?: boolean;
  /** Whether to animate on status change */
  animate?: boolean;
  /** Callback when signature is completed */
  onSignatureComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

// ===== SIZE CONFIGURATIONS =====
const sizeConfig = {
  sm: {
    container: 'w-16 h-16',
    text: 'text-xs',
    icon: 'w-4 h-4',
    border: 'border-2',
  },
  md: {
    container: 'w-24 h-24',
    text: 'text-sm',
    icon: 'w-6 h-6',
    border: 'border-2',
  },
  lg: {
    container: 'w-32 h-32',
    text: 'text-base',
    icon: 'w-8 h-8',
    border: 'border-3',
  },
  xl: {
    container: 'w-40 h-40',
    text: 'text-lg',
    icon: 'w-10 h-10',
    border: 'border-4',
  },
} as const;

// ===== STATUS CONFIGURATIONS =====
const statusConfig = {
  pending: {
    color: 'text-warning-600 border-warning-300',
    bg: 'bg-warning-50',
    icon: '⏳',
    label: 'Pending',
  },
  signing: {
    color: 'text-blue-600 border-blue-300', 
    bg: 'bg-blue-50',
    icon: '✍️',
    label: 'Signing',
  },
  signed: {
    color: 'text-success-600 border-success-400',
    bg: 'bg-success-50',
    icon: '✓',
    label: 'Signed',
  },
  declined: {
    color: 'text-error-600 border-error-300',
    bg: 'bg-error-50',
    icon: '✕',
    label: 'Declined',
  },
  expired: {
    color: 'text-gray-500 border-gray-300',
    bg: 'bg-gray-50',
    icon: '⚠️',
    label: 'Expired',
  },
} as const;

// ===== VARIANT CONFIGURATIONS =====
const variantConfig = {
  default: {
    style: 'rounded-full',
    shadow: 'shadow-seal',
  },
  minimal: {
    style: 'rounded-lg',
    shadow: 'shadow-sm',
  },
  corporate: {
    style: 'rounded-full border-double',
    shadow: 'shadow-authority',
  },
  premium: {
    style: 'rounded-full',
    shadow: 'shadow-seal drop-shadow-lg',
  },
} as const;

// ===== ANIMATION VARIANTS =====
const sealAnimationVariants = {
  // Main seal container
  container: {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
        duration: 0.8,
      }
    },
    signed: {
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.6,
        ease: easing.sealBounce,
      }
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: easing.authority,
      }
    }
  },

  // Watermark effect
  watermark: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { 
      opacity: 0.1, 
      scale: 1.5,
      transition: {
        duration: 1.5,
        ease: easing.authority,
      }
    },
  },

  // Status icon
  icon: {
    initial: { scale: 0, rotate: -90 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        delay: 0.3,
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      }
    },
    signing: {
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: easing.easeInOut,
      }
    }
  },

  // Text elements
  text: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.5,
        duration: 0.4,
        ease: easing.authority,
      }
    },
  },

  // Signature line
  signatureLine: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: easing.authority,
        delay: 0.2,
      }
    },
  }
};

// ===== MAIN COMPONENT =====
export function SignatureSeal({
  status,
  size = 'md',
  variant = 'default',
  signerName,
  signedDate,
  companyName = 'INCEL',
  showWatermark = true,
  animate = true,
  onSignatureComplete,
  className,
  children,
}: SignatureSealProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<SignatureStatus>(status);

  // Handle status change animations
  useEffect(() => {
    if (status !== previousStatus && animate) {
      setIsAnimating(true);
      setPreviousStatus(status);
      
      // Call completion callback when signed
      if (status === 'signed' && onSignatureComplete) {
        setTimeout(() => {
          onSignatureComplete();
        }, 800);
      }

      // Reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }
  }, [status, previousStatus, animate, onSignatureComplete]);

  const sizeStyles = sizeConfig[size];
  const statusStyles = statusConfig[status];
  const variantStyles = variantConfig[variant];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Watermark Background */}
      {showWatermark && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0"
          variants={sealAnimationVariants.watermark}
          initial="initial"
          animate="animate"
        >
          <div className="w-full h-full rounded-full border-2 border-blue-200 opacity-10" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-200 font-heading font-bold text-xs opacity-20">
            {companyName}
          </div>
        </motion.div>
      )}

      {/* Main Seal Container */}
      <motion.div
        className={cn(
          'relative flex flex-col items-center justify-center',
          sizeStyles.container,
          sizeStyles.border,
          statusStyles.color,
          statusStyles.bg,
          variantStyles.style,
          variantStyles.shadow,
          'z-10'
        )}
        variants={sealAnimationVariants.container}
        initial="initial"
        animate={status === 'signed' && isAnimating ? 'signed' : 'animate'}
        whileHover={status === 'signed' ? 'pulse' : undefined}
      >
        {/* Status Icon */}
        <motion.div
          className={cn('flex items-center justify-center', sizeStyles.icon)}
          variants={sealAnimationVariants.icon}
          animate={status === 'signing' ? 'signing' : 'animate'}
        >
          <span className={sizeStyles.text}>{statusStyles.icon}</span>
        </motion.div>

        {/* Company Name */}
        <motion.div
          className={cn(
            'font-heading font-bold uppercase tracking-wider',
            sizeStyles.text,
            'mt-1'
          )}
          variants={sealAnimationVariants.text}
        >
          {companyName}
        </motion.div>

        {/* Status Label */}
        <motion.div
          className={cn(
            'font-body text-xs opacity-80',
            'mt-0.5'
          )}
          variants={sealAnimationVariants.text}
        >
          {statusStyles.label}
        </motion.div>

        {/* Signature Line (for signed status) */}
        {status === 'signed' && (
          <motion.svg
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
            width="60%"
            height="2"
            viewBox="0 0 60 2"
            fill="none"
          >
            <motion.path
              d="M2 1 Q30 1 58 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              variants={sealAnimationVariants.signatureLine}
              initial="initial"
              animate="animate"
            />
          </motion.svg>
        )}

        {/* Signed Details */}
        {status === 'signed' && (signerName || signedDate) && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
            variants={sealAnimationVariants.text}
            initial="initial"
            animate="animate"
          >
            {signerName && (
              <div className="text-xs font-medium text-gray-700">
                {signerName}
              </div>
            )}
            {signedDate && (
              <div className="text-xs text-gray-500">
                {formatDate(signedDate)}
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Children */}
        {children}
      </motion.div>

      {/* Signature Confirmation Effect */}
      <AnimatePresence>
        {status === 'signed' && isAnimating && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-success-400 z-20 pointer-events-none"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: easing.authority }}
          />
        )}
      </AnimatePresence>

      {/* Pulse Ring for Active States */}
      <AnimatePresence>
        {(status === 'pending' || status === 'signing') && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full border-2 pointer-events-none z-5',
              status === 'pending' ? 'border-warning-300' : 'border-blue-300'
            )}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ 
              scale: 1.3, 
              opacity: 0,
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: easing.easeOut,
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== PRESET COMPONENTS =====

export function PendingSignatureSeal(props: Omit<SignatureSealProps, 'status'>) {
  return <SignatureSeal {...props} status="pending" />;
}

export function SignedSignatureSeal(props: Omit<SignatureSealProps, 'status'>) {
  return <SignatureSeal {...props} status="signed" />;
}

export function SigningSignatureSeal(props: Omit<SignatureSealProps, 'status'>) {
  return <SignatureSeal {...props} status="signing" />;
}

// ===== SIGNATURE COLLECTION COMPONENT =====
interface SignatureCollectionProps {
  signatures: Array<{
    id: string;
    signerName: string;
    status: SignatureStatus;
    signedDate?: Date;
  }>;
  variant?: SealVariant;
  size?: SealSize;
  onSignatureClick?: (id: string) => void;
  className?: string;
}

export function SignatureCollection({
  signatures,
  variant = 'default',
  size = 'md',
  onSignatureClick,
  className,
}: SignatureCollectionProps) {
  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {signatures.map((signature, index) => (
        <motion.div
          key={signature.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: index * 0.1,
            ...transitions.authority
          }}
          onClick={() => onSignatureClick?.(signature.id)}
          className={onSignatureClick ? 'cursor-pointer' : undefined}
        >
          <SignatureSeal
            status={signature.status}
            signerName={signature.signerName}
            signedDate={signature.signedDate}
            variant={variant}
            size={size}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default SignatureSeal;
