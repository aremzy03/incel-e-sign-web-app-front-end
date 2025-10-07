/**
 * Motion System - Award-winning Animation Choreography
 * Slow-in, fast-out transitions for legal authority and confidence
 */

import * as React from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import { tokens } from './design-tokens';

// ===== CORE EASING CURVES =====
export const easing = {
  // Authority easing - slow-in, fast-out for legal confidence
  authority: [0.32, 0, 0.12, 1] as const,
  
  // Seal bounce for signature confirmation
  sealBounce: [0.68, -0.6, 0.32, 1.6] as const,
  
  // Modal slide with weight feeling
  modalSlide: [0.16, 1, 0.3, 1] as const,
  
  // Standard easings
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  
  // Signature-specific easings
  documentSlide: [0.25, 0.46, 0.45, 0.94] as const,
  formFadeIn: [0.16, 0, 0.3, 1] as const,
} as const;

// ===== DURATION CONSTANTS =====
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
  
  // Signature-specific durations
  sealStamp: 800,
  modalSlide: 350,
  pageTransition: 300,
  documentLoad: 500,
  formValidation: 200,
} as const;

// ===== TRANSITION PRESETS =====
export const transitions = {
  authority: {
    duration: duration.normal / 1000,
    ease: easing.authority,
  },
  
  sealBounce: {
    duration: duration.sealStamp / 1000,
    ease: easing.sealBounce,
  },
  
  modalSlide: {
    duration: duration.modalSlide / 1000,
    ease: easing.modalSlide,
  },
  
  fast: {
    duration: duration.fast / 1000,
    ease: easing.easeOut,
  },
  
  smooth: {
    duration: duration.normal / 1000,
    ease: easing.easeInOut,
  },
  
  springy: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  
  authoritySpring: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
} as const satisfies Record<string, Transition>;

// ===== ANIMATION VARIANTS =====

// Page transitions with authority
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.authority,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    transition: transitions.fast,
  },
};

// Modal animations with weight and authority
export const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: duration.fast / 1000 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: duration.fast / 1000 }
    },
  },
  content: {
    initial: { 
      opacity: 0,
      y: '100%',
      scale: 0.95,
    },
    animate: { 
      opacity: 1,
      y: '0%',
      scale: 1,
      transition: transitions.modalSlide,
    },
    exit: { 
      opacity: 0,
      y: '100%',
      scale: 0.95,
      transition: transitions.fast,
    },
  },
};

// Signature seal stamp animation
export const sealVariants = {
  initial: {
    scale: 0.8,
    rotate: -5,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: transitions.sealBounce,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
};

// Document animations for legal confidence
export const documentVariants = {
  initial: {
    opacity: 0,
    x: 50,
    rotateY: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      ...transitions.authority,
      duration: duration.documentLoad / 1000,
    },
  },
  signing: {
    scale: 1.02,
    transition: transitions.authoritySpring,
  },
  signed: {
    scale: 1,
    transition: {
      ...transitions.sealBounce,
      delay: 0.2,
    },
  },
};

// Form field animations with professional feel
export const formVariants = {
  field: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        ...transitions.authority,
        duration: duration.formValidation / 1000,
      }
    },
    error: {
      x: [-2, 2, -2, 2, 0],
      transition: { duration: 0.3 }
    },
    success: {
      scale: [1, 1.02, 1],
      transition: { duration: 0.4 }
    },
  },
  label: {
    initial: { opacity: 0.7 },
    focus: { 
      opacity: 1,
      color: tokens.semantic.interactive.focus,
      transition: transitions.fast
    },
    blur: { 
      opacity: 0.7,
      transition: transitions.fast
    },
  },
};

// Button interactions with authority
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    y: -1,
    transition: transitions.fast,
  },
  tap: { 
    scale: 0.98,
    y: 0,
    transition: { duration: 0.1 }
  },
  loading: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
};

// Status badge animations
export const statusVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: transitions.authoritySpring,
  },
  pending: {
    backgroundColor: tokens.semantic.signature.pending,
    transition: transitions.smooth,
  },
  signed: {
    backgroundColor: tokens.semantic.signature.signed,
    scale: [1, 1.1, 1],
    transition: {
      backgroundColor: transitions.smooth,
      scale: {
        duration: 0.6,
        ease: easing.sealBounce,
      },
    },
  },
  declined: {
    backgroundColor: tokens.semantic.signature.declined,
    transition: transitions.smooth,
  },
};

// Loading animations with authority branding
export const loadingVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  dots: {
    y: [0, -10, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
};

// ===== GESTURE CONFIGURATIONS =====
export const gestures = {
  // Drag configurations for document handling
  documentDrag: {
    dragElastic: 0.1,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragTransition: { 
      bounceStiffness: 300, 
      bounceDamping: 30 
    },
  },
  
  // Swipe configurations for mobile
  swipeThreshold: 10000,
  swipeVelocity: 500,
} as const;

// ===== SCROLL ANIMATIONS =====
export const scrollVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    whileInView: { 
      opacity: 1, 
      y: 0,
      transition: transitions.authority,
    },
    viewport: { once: true, amount: 0.3 },
  },
  
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: transitions.authority,
    },
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a stagger animation for child elements
 */
export function createStagger(
  staggerDelay: number = 0.1,
  childDelay: number = 0
) {
  return {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  };
}

/**
 * Creates a custom entrance animation
 */
export function createEntrance(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
    }
  };

  return {
    initial: {
      opacity: 0,
      ...getInitialPosition(),
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: transitions.authority,
    },
  };
}

/**
 * Creates hover animation with authority feel
 */
export function createHover(
  scale: number = 1.02,
  lift: number = -1
) {
  return {
    initial: { scale: 1, y: 0 },
    hover: {
      scale,
      y: lift,
      transition: transitions.fast,
    },
  };
}

/**
 * Creates loading state animation
 */
export function createLoading(type: 'pulse' | 'spin' | 'dots' = 'pulse') {
  return {
    loading: loadingVariants[type],
  };
}

// Export commonly used motion components with presets
export const MotionDiv = motion.div;
export const MotionButton = motion.button;
export const MotionForm = motion.form;
export const MotionSection = motion.section;

// Higher-order motion component configurations
export const authorityMotionProps = {
  initial: "initial" as const,
  animate: "animate" as const,
  exit: "exit" as const,
  variants: pageVariants,
};

export const sealMotionProps = {
  initial: "initial" as const,
  animate: "animate" as const,
  whileHover: "pulse" as const,
  variants: sealVariants,
};

export const documentMotionProps = {
  initial: "initial" as const,
  animate: "animate" as const,
  variants: documentVariants,
};

export default {
  easing,
  duration,
  transitions,
  pageVariants,
  modalVariants,
  sealVariants,
  documentVariants,
  formVariants,
  buttonVariants,
  statusVariants,
  loadingVariants,
  scrollVariants,
  gestures,
  createStagger,
  createEntrance,
  createHover,
  createLoading,
};