/**
 * Type Definitions - Complete type system for the design system
 */

// Re-export types from individual modules for convenience
export type { PlatformType, OperatingSystem, BrowserType, PlatformInfo, Breakpoint } from './platform';
export type { PerformanceMetrics, PerformanceThresholds, OptimizedImageProps } from './performance';
export type { ButtonVariant, ButtonSize, ButtonState } from '../components/ui/button';
export type { SignatureStatus, SealSize, SealVariant } from '../components/ui/signature-seal';
export type { ModalSize, ModalVariant } from '../components/ui/authority-modal';
export type { FormFieldSize, FormFieldVariant, ValidationState } from '../components/ui/authority-form';

// Design system configuration types
export interface DesignSystemConfig {
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  platform: 'mobile' | 'tablet' | 'desktop';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Component state types
export type ComponentState = 'idle' | 'loading' | 'success' | 'error';
export type InteractionState = 'default' | 'hover' | 'active' | 'focus' | 'disabled';
export type ValidationLevel = 'none' | 'warning' | 'error' | 'success';

// Animation types
export type AnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'authority' | 'sealBounce' | 'modalSlide';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

// Accessibility types
export interface A11yConfig {
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
  colorContrast: 'normal' | 'enhanced';
  fontSize: 'normal' | 'large';
}

// Performance types
export interface PerformanceConfig {
  lazyLoading: boolean;
  imageOptimization: boolean;
  bundleSplitting: boolean;
  memoryMonitoring: boolean;
}

// Document types for signature viewer
export interface DocumentMetadata {
  id: string;
  title: string;
  version: string;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  fileSize: number;
  pageCount: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

export interface AuditTrail {
  id: string;
  action: 'created' | 'viewed' | 'signed' | 'declined' | 'shared' | 'downloaded';
  userId: string;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface ComplianceInfo {
  regulation: 'ESIGN' | 'UETA' | 'eIDAS' | 'PIPEDA';
  compliant: boolean;
  certificate?: string;
  validatedAt: Date;
}

// Event types
export interface DesignSystemEvent {
  type: string;
  target: HTMLElement;
  data?: any;
  timestamp: Date;
}
