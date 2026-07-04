/**
 * Incel E-Sign Design Token System
 * Source: incel-esign-design-system-and-screens/incel_e_sign/DESIGN.md
 */

// ===== COLOR TOKENS =====
export const colors = {
  // Primary brand
  primary: '#041534',
  onPrimary: '#ffffff',
  primaryContainer: '#1b2a4a',
  onPrimaryContainer: '#8392b7',
  primaryHover: '#243656',
  primaryLight: '#EEF1F7',
  primaryFixed: '#d9e2ff',
  primaryFixedDim: '#b7c6ee',
  onPrimaryFixed: '#0a1a3a',
  onPrimaryFixedVariant: '#384668',
  inversePrimary: '#b7c6ee',

  // Secondary / CTA teal
  secondary: '#006a61',
  onSecondary: '#ffffff',
  secondaryContainer: '#86f2e4',
  onSecondaryContainer: '#006f66',
  secondaryFixed: '#89f5e7',
  secondaryFixedDim: '#6bd8cb',
  onSecondaryFixed: '#00201d',
  onSecondaryFixedVariant: '#005049',

  // Accent / focus teal
  accent: '#0D9488',
  accentHover: '#0F766E',
  accentLight: '#CCFBF1',

  // Tertiary
  tertiary: '#211300',
  onTertiary: '#ffffff',
  tertiaryContainer: '#3c2600',
  onTertiaryContainer: '#ae8c5b',
  tertiaryFixed: '#ffddb0',
  tertiaryFixedDim: '#e7c08b',
  onTertiaryFixed: '#281800',
  onTertiaryFixedVariant: '#5c4218',

  // Semantic
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Neutrals
  bg: '#F8FAFC',
  background: '#fbf8fc',
  onBackground: '#1b1b1e',
  body: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',

  // M3 surfaces
  surface: '#F1F5F9',
  surfaceDim: '#dbd9dc',
  surfaceBright: '#fbf8fc',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f6',
  surfaceContainer: '#efedf0',
  surfaceContainerHigh: '#eae7eb',
  surfaceContainerHighest: '#e4e2e5',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#45464e',
  surfaceVariant: '#e4e2e5',
  surfaceTint: '#4f5e81',
  inverseSurface: '#303033',
  inverseOnSurface: '#f2f0f3',
  outline: '#75777f',
  outlineVariant: '#c5c6cf',

  // Document status
  statusDraft: '#94A3B8',
  statusPending: '#F59E0B',
  statusCompleted: '#059669',
  statusRejected: '#DC2626',
  statusYourTurn: '#0D9488',
} as const

/** M3 dark palette — inverse surfaces for Phase 2 dark mode */
export const colorsDark = {
  ...colors,
  primary: '#b7c6ee',
  onPrimary: '#0a1a3a',
  primaryContainer: '#1b2a4a',
  onPrimaryContainer: '#d9e2ff',
  primaryHover: '#d9e2ff',
  secondary: '#89f5e7',
  onSecondary: '#00201d',
  secondaryContainer: '#134e4a',
  onSecondaryContainer: '#89f5e7',
  accentHover: '#6bd8cb',
  bg: '#121214',
  background: '#121214',
  onBackground: '#e4e2e5',
  body: '#e4e2e5',
  muted: '#9a9aa3',
  border: '#45464e',
  white: '#ffffff',

  surface: '#303033',
  surfaceDim: '#121214',
  surfaceBright: '#38383c',
  surfaceContainerLowest: '#0d0d0f',
  surfaceContainerLow: '#1b1b1e',
  surfaceContainer: '#212124',
  surfaceContainerHigh: '#2b2b2f',
  surfaceContainerHighest: '#36363a',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6cf',
  surfaceVariant: '#45464e',
  inverseSurface: '#e4e2e5',
  inverseOnSurface: '#303033',
  outline: '#8f9099',
  outlineVariant: '#45464e',

  primaryLight: '#1b2a4a',
  successLight: '#064e3b',
  warningLight: '#78350f',
  errorLight: '#7f1d1d',
  infoLight: '#1e3a8a',
  accentLight: '#134e4a',
} as const

export type ThemeMode = 'light' | 'dark'

export function getThemeColors(mode: ThemeMode) {
  return mode === 'dark' ? colorsDark : colors
}

// ===== TYPOGRAPHY =====
export const typography = {
  headline3xl: { fontSize: '36px', lineHeight: '44px', fontWeight: '700' },
  headline2xl: { fontSize: '30px', lineHeight: '36px', fontWeight: '700' },
  headlineXl: { fontSize: '24px', lineHeight: '32px', fontWeight: '600' },
  headlineLg: { fontSize: '20px', lineHeight: '28px', fontWeight: '600' },
  bodyBase: { fontSize: '16px', lineHeight: '24px', fontWeight: '400' },
  bodySm: { fontSize: '14px', lineHeight: '20px', fontWeight: '400' },
  labelSm: { fontSize: '14px', lineHeight: '20px', fontWeight: '500' },
  labelXs: { fontSize: '12px', lineHeight: '16px', fontWeight: '500' },
  captionXs: { fontSize: '12px', lineHeight: '16px', fontWeight: '400' },
} as const

// ===== SPACING =====
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  sidebarWidth: '240px',
  topbarHeight: '64px',
  maxContentWidth: '1280px',
} as const

// ===== BORDER RADIUS =====
export const radii = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const

// ===== SHADOWS =====
export const shadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.08)',
  raised: '0 4px 12px rgba(0, 0, 0, 0.10)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.14)',
  focus: '0 0 0 2px #0D9488',
  authority: '0 8px 32px -8px rgba(4, 21, 52, 0.24), 0 2px 8px -2px rgba(4, 21, 52, 0.12)',
  seal: '0 4px 16px -4px rgba(0, 106, 97, 0.32), 0 1px 4px -1px rgba(0, 106, 97, 0.16)',
} as const

// ===== MOTION =====
export const motion = {
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    authorityEase: 'cubic-bezier(0.32, 0, 0.12, 1)',
    sealBounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    modalSlide: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
    sealStamp: '800ms',
    modalSlide: '350ms',
    pageTransition: '300ms',
  },
  delay: {
    none: '0ms',
    short: '100ms',
    medium: '200ms',
    long: '300ms',
  },
} as const

// ===== LAYOUT =====
export const layout = {
  grid: {
    columns: 12,
    gutter: spacing[6],
    maxWidth: spacing.maxContentWidth,
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  container: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1280px',
  },
  component: {
    input: { height: spacing[10], padding: spacing[3] },
    button: { small: spacing[8], medium: spacing[10], large: spacing[12] },
  },
} as const

// ===== ACCESSIBILITY =====
export const a11y = {
  focusRing: {
    width: '2px',
    color: colors.statusYourTurn,
    offset: '2px',
    style: 'solid',
  },
  touchTarget: { minimum: '44px' },
  contrast: { normal: 4.5, large: 3, enhanced: 7 },
} as const

// ===== SIGNATURE SEMANTIC =====
export const signature = {
  pending: colors.statusPending,
  signed: colors.statusCompleted,
  declined: colors.statusRejected,
  sealBase: colors.secondary,
  sealAccent: colors.primary,
} as const

// ===== HELPERS =====
/** Convert hex to HSL channels string for shadcn CSS vars (e.g. "214 31% 14%") */
export function toHslChannels(hex: string): string {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export const tokens = {
  colors,
  colorsDark,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  layout,
  a11y,
  signature,
} as const

export default tokens
