import type { Config } from 'tailwindcss'
import { tokens } from './src/lib/design-tokens'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    // Override default font families
    fontFamily: {
      'heading': ['var(--font-ibm-plex-sans)', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
      'body': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      'sans': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
    },
    
    // Container configuration for 12-column grid
    container: {
      center: true,
      padding: {
        DEFAULT: tokens.layout.grid.gutter,
        sm: tokens.primitives.spacing[4],
        md: tokens.primitives.spacing[6],
        lg: tokens.primitives.spacing[8],
        xl: tokens.primitives.spacing[10],
      },
      screens: {
        xs: tokens.layout.grid.breakpoints.xs,
        sm: tokens.layout.grid.breakpoints.sm,
        md: tokens.layout.grid.breakpoints.md,
        lg: tokens.layout.grid.breakpoints.lg,
        xl: tokens.layout.grid.breakpoints.xl,
        "2xl": tokens.layout.container["2xl"],
      },
    },

    // Complete design system implementation
    extend: {
      // Color System
      colors: {
        // Brand Colors
        navy: tokens.primitives.colors.navy,
        blue: tokens.primitives.colors.blue,
        gray: tokens.primitives.colors.gray,
        white: tokens.primitives.colors.white,
        
        // Status Colors
        success: tokens.primitives.colors.success,
        warning: tokens.primitives.colors.warning,
        error: tokens.primitives.colors.error,

        // Semantic Colors (CSS variables for dynamic theming)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: tokens.primitives.colors.navy[50],
          500: tokens.primitives.colors.navy[500],
          600: tokens.primitives.colors.navy[600],
          900: tokens.primitives.colors.navy[900],
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: tokens.primitives.colors.blue[50],
          500: tokens.primitives.colors.blue[500],
          600: tokens.primitives.colors.blue[600],
        },

        // UI Element Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // Signature-specific colors
        signature: {
          pending: tokens.semantic.signature.pending,
          signed: tokens.semantic.signature.signed,
          declined: tokens.semantic.signature.declined,
          'seal-base': tokens.semantic.signature.sealBase,
          'seal-accent': tokens.semantic.signature.sealAccent,
        }
      },

      // Typography Scale
      fontSize: tokens.primitives.fontSize,
      fontWeight: tokens.primitives.fontWeight,
      lineHeight: tokens.primitives.lineHeight,
      letterSpacing: tokens.primitives.letterSpacing,

      // Spacing Scale (8px modular scale)
      spacing: tokens.primitives.spacing,

      // Border Radius
      borderRadius: {
        ...tokens.primitives.borderRadius,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // Box Shadows
      boxShadow: {
        ...tokens.primitives.boxShadow,
        // Custom authority shadows
        'authority': tokens.primitives.boxShadow.authority,
        'seal': tokens.primitives.boxShadow.seal,
      },

      // Z-Index Scale
      zIndex: tokens.primitives.zIndex,

      // Animation Keyframes
      keyframes: {
        // Existing accordion animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // Signature-specific animations
        "seal-stamp": {
          "0%": { 
            transform: "scale(0.8) rotate(-5deg)", 
            opacity: "0" 
          },
          "60%": { 
            transform: "scale(1.1) rotate(2deg)", 
            opacity: "0.8" 
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)", 
            opacity: "1" 
          }
        },

        "modal-slide": {
          "0%": { 
            transform: "translateY(100%)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0%)", 
            opacity: "1" 
          }
        },

        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },

        "slide-in-right": {
          "0%": { 
            transform: "translateX(100%)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateX(0%)", 
            opacity: "1" 
          }
        },

        "pulse-authority": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 rgba(30, 94, 255, 0.7)" 
          },
          "50%": { 
            boxShadow: "0 0 0 10px rgba(30, 94, 255, 0)" 
          }
        }
      },

      // Animations with Design Token Durations
      animation: {
        // Existing animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // Signature-specific animations
        "seal-stamp": `seal-stamp ${tokens.motion.duration.sealStamp} ${tokens.motion.easing.sealBounce}`,
        "modal-slide": `modal-slide ${tokens.motion.duration.modalSlide} ${tokens.motion.easing.modalSlide}`,
        "fade-in": `fade-in ${tokens.motion.duration.normal} ${tokens.motion.easing.easeOut}`,
        "slide-in-right": `slide-in-right ${tokens.motion.duration.normal} ${tokens.motion.easing.authorityEase}`,
        "pulse-authority": `pulse-authority 2s ${tokens.motion.easing.easeInOut} infinite`,
      },

      // Transition Timing Functions
      transitionTimingFunction: {
        'authority-ease': tokens.motion.easing.authorityEase,
        'seal-bounce': tokens.motion.easing.sealBounce,
        'modal-slide': tokens.motion.easing.modalSlide,
      },

      // Transition Durations
      transitionDuration: {
        'instant': tokens.motion.duration.instant,
        'fast': tokens.motion.duration.fast,
        'normal': tokens.motion.duration.normal,
        'slow': tokens.motion.duration.slow,
        'slower': tokens.motion.duration.slower,
        'seal': tokens.motion.duration.sealStamp,
        'modal': tokens.motion.duration.modalSlide,
      },

      // Grid Configuration
      gridTemplateColumns: {
        'corporate': 'repeat(12, minmax(0, 1fr))',
      },

      // Focus Ring for Accessibility
      ringColor: {
        DEFAULT: tokens.semantic.interactive.focus,
      },
      
      ringWidth: {
        DEFAULT: tokens.a11y.focusRing.width,
      },

      ringOffsetWidth: {
        DEFAULT: tokens.a11y.focusRing.offset,
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
    // Custom plugin for design system utilities
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        // Authority button styles
        '.btn-authority': {
          background: `linear-gradient(135deg, ${theme('colors.primary.600')} 0%, ${theme('colors.primary.900')} 100%)`,
          boxShadow: theme('boxShadow.authority'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.authority-ease')}`,
          
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.xl'),
          },
          
          '&:active': {
            transform: 'translateY(0px)',
          }
        },

        // Corporate grid system
        '.grid-corporate': {
          display: 'grid',
          gridTemplateColumns: theme('gridTemplateColumns.corporate'),
          gap: theme('spacing.6'),
        },

        // Typography hierarchy
        '.text-h1': {
          fontSize: theme('fontSize.4xl'),
          fontWeight: theme('fontWeight.bold'),
          fontFamily: theme('fontFamily.heading'),
          color: theme('colors.navy.900'),
          lineHeight: theme('lineHeight.tight'),
        },

        '.text-h2': {
          fontSize: theme('fontSize.2xl'),
          fontWeight: theme('fontWeight.bold'),
          fontFamily: theme('fontFamily.heading'),
          color: theme('colors.blue.500'),
          lineHeight: theme('lineHeight.tight'),
        },

        '.text-body': {
          fontSize: theme('fontSize.base'),
          fontWeight: theme('fontWeight.normal'),
          fontFamily: theme('fontFamily.body'),
          color: theme('colors.gray.800'),
          lineHeight: theme('lineHeight.normal'),
        },

        // Signature seal styles
        '.seal-watermark': {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle, ${theme('colors.signature.seal-base')}22 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: '1',
          }
        }
      }
      
      addUtilities(newUtilities)
    }
  ],
}

export default config
