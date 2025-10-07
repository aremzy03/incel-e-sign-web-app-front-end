/**
 * Performance Optimization System
 * Comprehensive performance monitoring, optimization utilities, and best practices
 * for award-winning user experience
 */

import * as React from 'react';

// ===== PERFORMANCE METRICS =====

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay  
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // Custom metrics
  componentRenderTime?: number;
  apiResponseTime?: number;
  imageLoadTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
}

export interface PerformanceThresholds {
  LCP: { good: number; needsImprovement: number };
  FID: { good: number; needsImprovement: number };
  CLS: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
}

// Google's recommended thresholds
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, needsImprovement: 4000 }, // milliseconds
  FID: { good: 100, needsImprovement: 300 },   // milliseconds
  CLS: { good: 0.1, needsImprovement: 0.25 },  // score
  FCP: { good: 1800, needsImprovement: 3000 }, // milliseconds
  TTFB: { good: 200, needsImprovement: 500 },  // milliseconds
};

// ===== PERFORMANCE MONITORING =====

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private onMetricCallback?: (metric: string, value: number) => void;

  constructor(onMetric?: (metric: string, value: number) => void) {
    this.onMetricCallback = onMetric;
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Observe Core Web Vitals
    this.observeWebVitals();
    
    // Observe resource loading
    this.observeResourceTiming();
    
    // Observe long tasks
    this.observeLongTasks();
  }

  private observeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.metrics.LCP = lastEntry.startTime;
        this.onMetricCallback?.('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.FID = entry.processingStart - entry.startTime;
          this.onMetricCallback?.('FID', this.metrics.FID);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.CLS = clsValue;
            this.onMetricCallback?.('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.initiatorType === 'img') {
            this.metrics.imageLoadTime = entry.responseEnd - entry.startTime;
            this.onMetricCallback?.('imageLoadTime', this.metrics.imageLoadTime);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getScore(metric: keyof PerformanceThresholds): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
    const value = this.metrics[metric];
    if (value === undefined) return 'unknown';

    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// ===== PERFORMANCE OPTIMIZATION UTILITIES =====

/**
 * Debounce function calls to improve performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with intersection observer
 */
export function createLazyImageLoader(): {
  observe: (img: HTMLImageElement) => void;
  unobserve: (img: HTMLImageElement) => void;
  disconnect: () => void;
} {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  }

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.1,
    }
  );

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    unobserve: (img: HTMLImageElement) => imageObserver.unobserve(img),
    disconnect: () => imageObserver.disconnect(),
  };
}

/**
 * Optimize bundle size by dynamic imports
 */
export async function loadModule<T>(
  moduleLoader: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const moduleResult = await moduleLoader();
    return moduleResult.default;
  } catch (error) {
    console.error('Failed to load module:', error);
    throw error;
  }
}

/**
 * Memory usage monitor
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return {};
}

// ===== REACT PERFORMANCE HOOKS =====

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const monitor = React.useRef<PerformanceMonitor | null>(null);
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({});

  React.useEffect(() => {
    monitor.current = new PerformanceMonitor((metric, value) => {
      setMetrics(prev => ({ ...prev, [metric]: value }));
    });

    return () => {
      monitor.current?.cleanup();
    };
  }, []);

  const getScore = React.useCallback((metric: keyof PerformanceThresholds) => {
    return monitor.current?.getScore(metric) || 'unknown';
  }, []);

  return { metrics, getScore };
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad(threshold: number = 0.1, rootMargin: string = '50px') {
  const [isInView, setIsInView] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return { elementRef, isInView, hasLoaded };
}

/**
 * Hook for component render time measurement
 */
export function useRenderTime(componentName: string) {
  const renderStart = React.useRef<number>(0);
  const [renderTime, setRenderTime] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    renderStart.current = performance.now();
  });

  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderStart.current;
    setRenderTime(duration);
    
    if (duration > 16.67) { // More than one frame (60fps)
      console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
    }
  });

  return renderTime;
}

/**
 * Hook for virtualized list performance
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );
  
  const visibleItems = React.useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  const totalHeight = itemCount * itemHeight;

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

/**
 * Hook for optimized state updates
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = React.useState(initialValue);
  const previousValueRef = React.useRef(initialValue);

  const setOptimizedState = React.useCallback((newValue: T | ((prev: T) => T)) => {
    const actualNewValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(state)
      : newValue;

    // Only update if value actually changed
    if (actualNewValue !== previousValueRef.current) {
      previousValueRef.current = actualNewValue;
      setState(actualNewValue);
    }
  }, [state]);

  return [state, setOptimizedState] as const;
}

// ===== IMAGE OPTIMIZATION =====

/**
 * Generate responsive image sources
 */
export function generateImageSources(
  basePath: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): {
  srcSet: string;
  sizes: string;
} {
  const srcSet = sizes
    .map(size => `${basePath}?w=${size} ${size}w`)
    .join(', ');

  const sizesAttr = [
    '(max-width: 640px) 100vw',
    '(max-width: 960px) 50vw',
    '(max-width: 1280px) 33vw',
    '25vw'
  ].join(', ');

  return { srcSet, sizes: sizesAttr };
}

/**
 * Optimized image component props
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// ===== BUNDLE OPTIMIZATION =====

/**
 * Code splitting utility for route-based splitting
 */
export function createAsyncComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ComponentType = () => React.createElement('div', null, 'Loading...')
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc);
  
  const AsyncComponent = (props: React.ComponentProps<T>) => 
    React.createElement(
      React.Suspense,
      { fallback: React.createElement(fallback) },
      React.createElement(LazyComponent, props)
    );
  
  AsyncComponent.displayName = `AsyncComponent(${(LazyComponent as any).displayName || (LazyComponent as any).name || 'Component'})`;
  
  return AsyncComponent;
}

/**
 * Preload resources for better performance
 */
export function preloadResource(href: string, type: 'script' | 'style' | 'image' | 'font'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }

  document.head.appendChild(link);
}

// ===== ANIMATION PERFORMANCE =====

/**
 * Check if browser supports will-change property
 */
export function supportsWillChange(): boolean {
  if (typeof window === 'undefined') return false;
  return 'willChange' in document.documentElement.style;
}

/**
 * Optimize animation performance
 */
export function optimizeAnimation(element: HTMLElement, properties: string[]): void {
  if (supportsWillChange()) {
    element.style.willChange = properties.join(', ');
  } else {
    // Fallback for older browsers
    element.style.transform = 'translateZ(0)';
  }
}

/**
 * Clean up animation optimizations
 */
export function cleanupAnimation(element: HTMLElement): void {
  if (supportsWillChange()) {
    element.style.willChange = 'auto';
  } else {
    element.style.transform = '';
  }
}

export default {
  PerformanceMonitor,
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
  cleanupAnimation,
};
