/**
 * INCEL E-Sign Design System - Complete Export Index
 * Award-winning design system for legal confidence and professional e-signature experiences
 * 
 * This comprehensive design system includes:
 * - Complete token system with primitive and semantic values
 * - Advanced component patterns with all states and variants  
 * - Motion choreography with exact easings and durations
 * - Accessibility without compromising aesthetics
 * - Cross-platform adaptation rules
 * - Performance optimization approach
 * - Production-ready component implementations
 */

// ===== DESIGN TOKENS =====
export { 
  tokens, 
  colors,
  typography,
  spacing,
  radii,
  shadows,
  signature,
  motion,
  layout,
  a11y,
  toHslChannels,
} from './design-tokens';

// ===== MOTION SYSTEM =====
export { 
  default as motionSystem,
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
  authorityMotionProps,
  sealMotionProps,
  documentMotionProps,
  MotionDiv,
  MotionButton,
  MotionForm,
  MotionSection
} from './motion';

// ===== ACCESSIBILITY SYSTEM =====
export {
  default as accessibility,
  WCAG_STANDARDS,
  getLuminance,
  getContrastRatio,
  meetsContrastStandard,
  FocusManager,
  announceToScreenReader,
  createLiveRegion,
  KeyboardNavigation,
  prefersReducedMotion,
  getSafeAnimationDuration,
  getSafeAnimationConfig,
  generateAriaId,
  AriaUtils,
  detectHighContrast,
  getHighContrastStyles,
  useFocusTrap,
  useScreenReaderAnnouncer,
  useKeyboardNavigation
} from './accessibility';

// ===== PLATFORM SYSTEM =====
export {
  default as platform,
  detectPlatform,
  getCurrentBreakpoint,
  matchesBreakpoint,
  getPlatformStyles,
  generateResponsiveClasses,
  createResponsiveValue,
  usePlatform,
  useBreakpoint,
  useMediaQuery,
  useAdaptiveSpacing,
  useOrientation,
  useSafeArea,
  getPlatformComponentProps,
  breakpoints
} from './platform';

// ===== PERFORMANCE SYSTEM =====
export {
  default as performance,
  PERFORMANCE_THRESHOLDS,
  debounce,
  throttle,
  createLazyImageLoader,
  loadModule,
  getMemoryUsage,
  usePerformanceMonitor,
  useLazyLoad,
  useRenderTime,
  useVirtualization,
  useOptimizedState,
  generateImageSources,
  createAsyncComponent,
  preloadResource,
  supportsWillChange,
  optimizeAnimation,
  cleanupAnimation
} from './performance';

// ===== TYPE DEFINITIONS =====
export type {
  PlatformType,
  OperatingSystem,
  BrowserType,
  PlatformInfo,
  Breakpoint,
  FormFieldSize,
  FormFieldVariant,
  ValidationState,
  ButtonVariant,
  ButtonSize,
  ButtonState,
  ModalSize,
  ModalVariant,
  SignatureStatus,
  SealSize,
  SealVariant,
  PerformanceMetrics,
  PerformanceThresholds,
  OptimizedImageProps
} from './types';

// ===== UTILITIES =====
export { cn } from './utils';
