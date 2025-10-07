/**
 * Complete Design Token System
 * Award-winning e-signature design system inspired by DocuSign
 * Core Philosophy: Authority and confidence through legal safety assurance
 */

// ===== PRIMITIVE TOKENS =====
export const primitives = {
  // Color Palette
  colors: {
    navy: {
      50: '#F0F4F8',
      100: '#D9E2EC',
      200: '#BCCCDC',
      300: '#9FB3C8',
      400: '#829AB1',
      500: '#627D98',
      600: '#486581',
      700: '#334E68',
      800: '#243B53',
      900: '#0B1F3A', // Primary Deep Navy - authority, seriousness
      950: '#05121C'
    },
    blue: {
      50: '#EBF2FF',
      100: '#D6E4FF',
      200: '#B5CDFF',
      300: '#85AAFF',
      400: '#5E87FF',
      500: '#1E5EFF', // Primary Royal Blue - trust, clarity
      600: '#1B52E6',
      700: '#1843CC',
      800: '#1537A3',
      900: '#122B7A',
      950: '#0D1E51'
    },
    gray: {
      50: '#F8F9FA',
      100: '#F1F3F4',
      200: '#E8EAED',
      300: '#DADCE0',
      400: '#C9CED6', // Primary Cool Gray - neutrality
      500: '#9AA0A6',
      600: '#80868B',
      700: '#5F6368',
      800: '#3C4043',
      900: '#202124',
      950: '#171717'
    },
    white: '#FFFFFF', // Primary White - simplicity, space
    
    // Semantic Status Colors
    success: {
      50: '#F0FDF4',
      500: '#10B981',
      600: '#059669',
      900: '#064E3B'
    },
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      600: '#D97706',
      900: '#78350F'
    },
    error: {
      50: '#FEF2F2',
      500: '#EF4444',
      600: '#DC2626',
      900: '#7F1D1D'
    }
  },

  // Typography Scale (8px base)
  fontSize: {
    xs: '12px',      // 12px
    sm: '14px',      // 14px
    base: '16px',    // 16px - Body text
    lg: '18px',      // 18px
    xl: '20px',      // 20px
    '2xl': '24px',   // 24px - H2
    '3xl': '30px',   // 30px
    '4xl': '36px',   // 36px - H1 (updated from 32px for better hierarchy)
    '5xl': '48px',   // 48px
    '6xl': '60px',   // 60px
    '7xl': '72px',   // 72px
    '8xl': '96px',   // 96px
    '9xl': '128px'   // 128px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',    // Inter Regular - Body text
    medium: '500',
    semibold: '600',
    bold: '700',      // IBM Plex Sans Bold - Headings
    extrabold: '800',
    black: '900'
  },

  // Line Heights (based on font sizes)
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',    // Default for body text
    relaxed: '1.625',
    loose: '2'
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  },

  // Spacing Scale (8px modular scale)
  spacing: {
    0: '0px',
    1: '4px',      // 0.5 × 8px
    2: '8px',      // 1 × 8px
    3: '12px',     // 1.5 × 8px
    4: '16px',     // 2 × 8px
    5: '20px',     // 2.5 × 8px
    6: '24px',     // 3 × 8px - Grid gutters
    7: '28px',     // 3.5 × 8px
    8: '32px',     // 4 × 8px
    9: '36px',     // 4.5 × 8px
    10: '40px',    // 5 × 8px
    11: '44px',    // 5.5 × 8px
    12: '48px',    // 6 × 8px
    14: '56px',    // 7 × 8px
    16: '64px',    // 8 × 8px
    20: '80px',    // 10 × 8px
    24: '96px',    // 12 × 8px
    28: '112px',   // 14 × 8px
    32: '128px',   // 16 × 8px
    36: '144px',   // 18 × 8px
    40: '160px',   // 20 × 8px
    44: '176px',   // 22 × 8px
    48: '192px',   // 24 × 8px
    52: '208px',   // 26 × 8px
    56: '224px',   // 28 × 8px
    60: '240px',   // 30 × 8px
    64: '256px',   // 32 × 8px
    72: '288px',   // 36 × 8px
    80: '320px',   // 40 × 8px
    96: '384px'    // 48 × 8px
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px'
  },

  // Box Shadows
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Authority shadows for legal elements
    authority: '0 8px 32px -8px rgba(11, 31, 58, 0.24), 0 2px 8px -2px rgba(11, 31, 58, 0.12)',
    seal: '0 4px 16px -4px rgba(30, 94, 255, 0.32), 0 1px 4px -1px rgba(30, 94, 255, 0.16)'
  },

  // Z-Index Scale
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    modal: '1000',
    popover: '1010',
    overlay: '1020',
    max: '9999'
  }
} as const;

// ===== SEMANTIC TOKENS =====
export const semantic = {
  // Brand Colors
  brand: {
    primary: primitives.colors.navy[900],      // Deep Navy
    secondary: primitives.colors.blue[500],    // Royal Blue
    tertiary: primitives.colors.gray[400],     // Cool Gray
    neutral: primitives.colors.white,          // White
  },

  // Interactive States
  interactive: {
    default: primitives.colors.blue[500],
    hover: primitives.colors.blue[600],
    active: primitives.colors.blue[700],
    disabled: primitives.colors.gray[300],
    focus: primitives.colors.blue[500]
  },

  // Surface Colors
  surface: {
    primary: primitives.colors.white,
    secondary: primitives.colors.gray[50],
    tertiary: primitives.colors.gray[100],
    elevated: primitives.colors.white,
    overlay: 'rgba(11, 31, 58, 0.8)' // Navy overlay
  },

  // Text Colors
  text: {
    primary: primitives.colors.navy[900],      // Dark navy for headers
    secondary: primitives.colors.gray[800],    // Dark gray for body
    tertiary: primitives.colors.gray[600],     // Medium gray for captions
    inverse: primitives.colors.white,          // White text on dark backgrounds
    link: primitives.colors.blue[500],         // Blue for links
    linkHover: primitives.colors.blue[600]
  },

  // Border Colors
  border: {
    subtle: primitives.colors.gray[200],
    default: primitives.colors.gray[300],
    strong: primitives.colors.gray[400],
    interactive: primitives.colors.blue[500],
    error: primitives.colors.error[500]
  },

  // Status Colors
  status: {
    success: primitives.colors.success[500],
    warning: primitives.colors.warning[500],
    error: primitives.colors.error[500],
    info: primitives.colors.blue[500]
  },

  // Signature-specific Colors
  signature: {
    pending: primitives.colors.warning[500],
    signed: primitives.colors.success[500],
    declined: primitives.colors.error[500],
    sealBase: primitives.colors.blue[500],
    sealAccent: primitives.colors.navy[900]
  }
} as const;

// ===== MOTION TOKENS =====
export const motion = {
  // Easing Functions - Slow-in, fast-out for authority
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom authority easings
    authorityEase: 'cubic-bezier(0.32, 0, 0.12, 1)', // Slow-in, fast-out
    sealBounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Signature bounce
    modalSlide: 'cubic-bezier(0.16, 1, 0.3, 1)' // Modal slide with weight
  },

  // Duration Scale
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
    // Signature-specific durations
    sealStamp: '800ms',    // Seal stamp animation
    modalSlide: '350ms',   // Modal slide with bounce
    pageTransition: '300ms'
  },

  // Animation Delays
  delay: {
    none: '0ms',
    short: '100ms',
    medium: '200ms',
    long: '300ms'
  }
} as const;

// ===== GRID AND LAYOUT TOKENS =====
export const layout = {
  // 12-Column Grid System
  grid: {
    columns: 12,
    gutter: primitives.spacing[6], // 24px gutters for corporate feel
    maxWidth: '1280px',
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },

  // Container Sizes
  container: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1280px' // Max width for readability
  },

  // Component Sizing
  component: {
    input: {
      height: primitives.spacing[10], // 40px
      padding: primitives.spacing[3]  // 12px
    },
    button: {
      small: primitives.spacing[8],   // 32px
      medium: primitives.spacing[10], // 40px  
      large: primitives.spacing[12]   // 48px
    }
  }
} as const;

// ===== ACCESSIBILITY TOKENS =====
export const a11y = {
  // Focus Ring
  focusRing: {
    width: '2px',
    color: primitives.colors.blue[500],
    offset: '2px',
    style: 'solid'
  },

  // Minimum Touch Targets (WCAG AA)
  touchTarget: {
    minimum: '44px'
  },

  // Color Contrast Ratios (WCAG AA)
  contrast: {
    normal: 4.5,
    large: 3,
    enhanced: 7
  }
} as const;

// Export all token categories
export const tokens = {
  primitives,
  semantic,
  motion,
  layout,
  a11y
} as const;

export default tokens;
