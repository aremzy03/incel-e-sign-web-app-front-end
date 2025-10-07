/**
 * Cross-Platform Adaptation System
 * Responsive design rules and platform-specific optimizations
 * for award-winning user experience across all devices
 */

import * as React from 'react';
import { tokens } from './design-tokens';

// ===== PLATFORM DETECTION =====

export type PlatformType = 'desktop' | 'tablet' | 'mobile';
export type OperatingSystem = 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'unknown';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';

export interface PlatformInfo {
  type: PlatformType;
  os: OperatingSystem;
  browser: BrowserType;
  isTouchDevice: boolean;
  hasKeyboard: boolean;
  hasMouse: boolean;
  screenSize: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  supportsHover: boolean;
  prefersReducedMotion: boolean;
  isHighContrast: boolean;
}

/**
 * Detect current platform and device capabilities
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia : null;

  // Detect operating system
  const os: OperatingSystem = 
    userAgent.includes('windows') ? 'windows' :
    userAgent.includes('mac os') ? 'macos' :
    userAgent.includes('iphone') || userAgent.includes('ipad') ? 'ios' :
    userAgent.includes('android') ? 'android' :
    userAgent.includes('linux') ? 'linux' : 'unknown';

  // Detect browser
  const browser: BrowserType =
    userAgent.includes('chrome') && !userAgent.includes('edge') ? 'chrome' :
    userAgent.includes('firefox') ? 'firefox' :
    userAgent.includes('safari') && !userAgent.includes('chrome') ? 'safari' :
    userAgent.includes('edge') ? 'edge' :
    userAgent.includes('opera') ? 'opera' : 'unknown';

  // Detect screen size and type
  const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  const type: PlatformType = 
    width >= 1024 ? 'desktop' :
    width >= 768 ? 'tablet' : 'mobile';

  // Detect device capabilities
  const isTouchDevice = typeof window !== 'undefined' ? 
    'ontouchstart' in window || navigator.maxTouchPoints > 0 : false;

  const hasKeyboard = type === 'desktop' || (type === 'tablet' && !isTouchDevice);
  const hasMouse = typeof window !== 'undefined' ? 
    mediaQuery?.('(pointer: fine)').matches ?? true : true;

  const supportsHover = typeof window !== 'undefined' ?
    mediaQuery?.('(hover: hover)').matches ?? true : true;

  const prefersReducedMotion = typeof window !== 'undefined' ?
    mediaQuery?.('(prefers-reduced-motion: reduce)').matches ?? false : false;

  const isHighContrast = typeof window !== 'undefined' ?
    mediaQuery?.('(prefers-contrast: high)').matches ?? false : false;

  const pixelRatio = typeof window !== 'undefined' ? 
    window.devicePixelRatio || 1 : 1;

  return {
    type,
    os,
    browser,
    isTouchDevice,
    hasKeyboard,
    hasMouse,
    screenSize: { width, height },
    pixelRatio,
    supportsHover,
    prefersReducedMotion,
    isHighContrast,
  };
}

// ===== RESPONSIVE BREAKPOINTS =====

export const breakpoints = {
  xs: 320,   // Extra small phones
  sm: 640,   // Small phones
  md: 768,   // Tablets
  lg: 1024,  // Small desktops
  xl: 1280,  // Large desktops
  '2xl': 1536, // Extra large screens
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Get current breakpoint based on screen width
 */
export function getCurrentBreakpoint(width?: number): Breakpoint {
  const w = width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  
  if (w < breakpoints.sm) return 'xs';
  if (w < breakpoints.md) return 'sm';
  if (w < breakpoints.lg) return 'md';
  if (w < breakpoints.xl) return 'lg';
  if (w < breakpoints['2xl']) return 'xl';
  return '2xl';
}

/**
 * Check if current viewport matches breakpoint query
 */
export function matchesBreakpoint(query: string, width?: number): boolean {
  const w = width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  
  // Parse queries like 'md', 'lg+', 'sm-md', etc.
  if (query.includes('-')) {
    const [min, max] = query.split('-') as [Breakpoint, Breakpoint];
    return w >= breakpoints[min] && w < breakpoints[max];
  }
  
  if (query.endsWith('+')) {
    const bp = query.slice(0, -1) as Breakpoint;
    return w >= breakpoints[bp];
  }
  
  if (query.endsWith('-')) {
    const bp = query.slice(0, -1) as Breakpoint;
    return w < breakpoints[bp];
  }
  
  const bp = query as Breakpoint;
  const nextBp = getNextBreakpoint(bp);
  return w >= breakpoints[bp] && (nextBp ? w < breakpoints[nextBp] : true);
}

function getNextBreakpoint(bp: Breakpoint): Breakpoint | null {
  const keys = Object.keys(breakpoints) as Breakpoint[];
  const index = keys.indexOf(bp);
  return index < keys.length - 1 ? keys[index + 1] : null;
}

// ===== PLATFORM-SPECIFIC STYLES =====

export interface PlatformStyles {
  spacing?: Record<string, string>;
  fontSize?: Record<string, string>;
  touchTargets?: Record<string, string>;
  shadows?: Record<string, string>;
  borders?: Record<string, string>;
}

/**
 * Get platform-optimized styles
 */
export function getPlatformStyles(platform: PlatformInfo): PlatformStyles {
  const styles: PlatformStyles = {};

  // Mobile optimizations
  if (platform.type === 'mobile') {
    styles.spacing = {
      'container-padding': tokens.primitives.spacing[4], // 16px
      'section-gap': tokens.primitives.spacing[6], // 24px
      'element-gap': tokens.primitives.spacing[3], // 12px
    };
    
    styles.fontSize = {
      'body-size': tokens.primitives.fontSize.base, // Keep readable
      'heading-scale': '0.9', // Slightly smaller headings
      'caption-size': tokens.primitives.fontSize.sm,
    };
    
    styles.touchTargets = {
      'min-size': '48px', // Larger than WCAG minimum
      'button-height': '48px',
      'input-height': '48px',
    };
  }

  // Tablet optimizations
  if (platform.type === 'tablet') {
    styles.spacing = {
      'container-padding': tokens.primitives.spacing[6], // 24px
      'section-gap': tokens.primitives.spacing[8], // 32px
      'element-gap': tokens.primitives.spacing[4], // 16px
    };
    
    styles.touchTargets = {
      'min-size': '44px',
      'button-height': '44px',
      'input-height': '44px',
    };
  }

  // Desktop optimizations
  if (platform.type === 'desktop') {
    styles.spacing = {
      'container-padding': tokens.primitives.spacing[8], // 32px
      'section-gap': tokens.primitives.spacing[12], // 48px
      'element-gap': tokens.primitives.spacing[6], // 24px
    };
    
    if (platform.supportsHover) {
      styles.shadows = {
        'hover-elevation': tokens.primitives.boxShadow.lg,
        'authority-hover': tokens.primitives.boxShadow.authority,
      };
    }
  }

  // High contrast mode
  if (platform.isHighContrast) {
    styles.borders = {
      'focus-width': '3px',
      'element-border': '2px',
    };
    
    styles.shadows = {
      'authority': 'none',
      'seal': 'none',
      'hover-elevation': 'none',
    };
  }

  // Touch device optimizations
  if (platform.isTouchDevice) {
    styles.spacing = {
      ...styles.spacing,
      'interactive-gap': '8px', // More space between touch targets
    };
  }

  return styles;
}

// ===== RESPONSIVE UTILITIES =====

/**
 * Generate responsive CSS classes
 */
export function generateResponsiveClasses(
  property: string,
  values: Partial<Record<Breakpoint | 'DEFAULT', string>>
): string {
  const classes: string[] = [];
  
  if (values.DEFAULT) {
    classes.push(`${property}-${values.DEFAULT}`);
  }
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint !== 'DEFAULT' && value) {
      classes.push(`${breakpoint}:${property}-${value}`);
    }
  });
  
  return classes.join(' ');
}

/**
 * Create responsive value object
 */
export function createResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): Record<string, T> {
  return {
    DEFAULT: mobile,
    ...(tablet && { md: tablet }),
    ...(desktop && { lg: desktop }),
  };
}

// ===== PLATFORM HOOKS =====

/**
 * Hook for platform detection and responsive behavior
 */
export function usePlatform() {
  const [platform, setPlatform] = React.useState<PlatformInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        isTouchDevice: false,
        hasKeyboard: true,
        hasMouse: true,
        screenSize: { width: 1920, height: 1080 },
        pixelRatio: 1,
        supportsHover: true,
        prefersReducedMotion: false,
        isHighContrast: false,
      };
    }
    return detectPlatform();
  });

  React.useEffect(() => {
    const handleResize = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return platform;
}

/**
 * Hook for breakpoint matching
 */
export function useBreakpoint(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const checkMatch = () => setMatches(matchesBreakpoint(query));
    
    checkMatch();
    window.addEventListener('resize', checkMatch);
    
    return () => window.removeEventListener('resize', checkMatch);
  }, [query]);

  return matches;
}

/**
 * Hook for media queries
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);
    
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Hook for adaptive spacing based on platform
 */
export function useAdaptiveSpacing(platform?: PlatformInfo) {
  const detectedPlatform = usePlatform();
  const currentPlatform = platform || detectedPlatform;
  
  return React.useMemo(() => {
    const styles = getPlatformStyles(currentPlatform);
    
    return {
      container: styles.spacing?.['container-padding'] || tokens.primitives.spacing[6],
      section: styles.spacing?.['section-gap'] || tokens.primitives.spacing[8],
      element: styles.spacing?.['element-gap'] || tokens.primitives.spacing[4],
      interactive: styles.spacing?.['interactive-gap'] || tokens.primitives.spacing[2],
    };
  }, [currentPlatform]);
}

// ===== ORIENTATION HANDLING =====

export type Orientation = 'portrait' | 'landscape';

/**
 * Hook for orientation detection
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<Orientation>('portrait');

  React.useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

// ===== SAFE AREA HANDLING (for mobile devices with notches) =====

/**
 * Hook for safe area insets (iOS notches, Android navigation bars)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}

// ===== PLATFORM-SPECIFIC COMPONENT UTILITIES =====

/**
 * Get optimized component props for current platform
 */
export function getPlatformComponentProps(
  platform: PlatformInfo,
  component: 'button' | 'input' | 'modal' | 'dropdown'
) {
  const props: Record<string, any> = {};

  switch (component) {
    case 'button':
      if (platform.isTouchDevice) {
        props.size = 'lg'; // Larger touch targets
        props.className = 'min-h-[48px]';
      }
      if (!platform.supportsHover) {
        props.animate = false; // Reduce animations on touch devices
      }
      break;

    case 'input':
      if (platform.isTouchDevice) {
        props.size = 'lg';
        props.className = 'min-h-[48px] text-base'; // Prevent zoom on iOS
      }
      break;

    case 'modal':
      if (platform.type === 'mobile') {
        props.size = 'full';
        props.className = 'mx-4 my-8';
      }
      break;

    case 'dropdown':
      if (platform.isTouchDevice) {
        props.strategy = 'fixed'; // Better positioning on mobile
        props.className = 'min-h-[48px]';
      }
      break;
  }

  return props;
}

export default {
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
  breakpoints,
};
