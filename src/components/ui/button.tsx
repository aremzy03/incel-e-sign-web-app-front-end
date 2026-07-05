"use client"

/**
 * Authority Button Component - Production-level button with all states and variants
 * Designed for legal confidence and professional e-signature interfaces
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants as motionButtonVariants } from "@/lib/motion"

// ===== BUTTON VARIANTS =====
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-xl text-label-sm font-medium font-body",
    "ring-offset-background transition-all duration-normal ease-authority-ease",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "relative overflow-hidden",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Authority primary - Deep navy for legal confidence
        authority: [
          "bg-primary text-on-primary shadow-lg shadow-primary/10",
          "hover:bg-primary-hover hover:-translate-y-0.5 hover:scale-[1.02]",
          "active:translate-y-0 active:scale-100",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
        
        // CTA teal - dashboard actions
        default: [
          "bg-secondary text-on-secondary shadow-sm",
          "hover:bg-accent-hover hover:-translate-y-0.5",
          "active:translate-y-0",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
        
        // Secondary - Clean outline
        secondary: [
          "bg-surface-container-lowest border border-outline-variant text-primary shadow-sm dark:text-primary-fixed",
          "hover:bg-surface-container-low hover:border-outline hover:-translate-y-0.5",
          "active:translate-y-0",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
        
        // Outline - Minimal
        outline: [
          "border-2 border-outline-variant text-on-surface-variant bg-transparent",
          "hover:bg-surface-container-low hover:border-outline",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
        
        // Ghost - Subtle interactions
        ghost: [
          "text-on-surface-variant bg-transparent",
          "hover:bg-surface-container hover:text-on-surface",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
        
        // Destructive - For critical actions
        destructive: [
          "bg-error text-on-error shadow-md",
          "hover:bg-error/90 hover:shadow-lg hover:-translate-y-0.5",
          "active:translate-y-0",
          "focus-visible:ring-error focus-visible:ring-offset-2",
        ],
        
        // Success - For completed actions
        success: [
          "bg-success text-white shadow-md",
          "hover:bg-success/90 hover:shadow-lg hover:-translate-y-0.5",
          "active:translate-y-0",
          "focus-visible:ring-success focus-visible:ring-offset-2",
        ],
        
        // Link - Text-based actions
        link: [
          "text-secondary underline-offset-4 p-0 h-auto",
          "hover:underline hover:text-accent-hover",
          "focus-visible:ring-status-your-turn focus-visible:ring-offset-2",
        ],
      },
      
      size: {
        xs: "h-7 px-2 py-1 text-xs",
        sm: "h-8 px-3 py-1.5 text-sm",
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10 p-0",
      },
      
      fullWidth: {
        true: "w-full",
        false: "",
      },
      
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      loading: false,
    },
  }
)

// ===== BUTTON STATE TYPES =====
export type ButtonVariant = 
  | "authority" 
  | "default" 
  | "secondary" 
  | "outline" 
  | "ghost" 
  | "destructive" 
  | "success" 
  | "link"

export type ButtonSize = "xs" | "sm" | "default" | "lg" | "xl" | "icon"

export type ButtonState = "idle" | "loading" | "success" | "error"

// ===== BUTTON PROPS =====
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Current button state */
  state?: ButtonState
  /** Loading text to show during loading state */
  loadingText?: string
  /** Success text to show during success state */
  successText?: string
  /** Error text to show during error state */
  errorText?: string
  /** Icon to display before text */
  icon?: React.ReactNode
  /** Icon to display after text */
  iconRight?: React.ReactNode
  /** Whether to animate state changes */
  animate?: boolean
  /** Auto-reset success/error states after delay (ms) */
  autoReset?: number
  /** Callback when state changes */
  onStateChange?: (state: ButtonState) => void
}

// ===== MAIN BUTTON COMPONENT =====
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    state = "idle",
    loadingText,
    successText,
    errorText,
    icon,
    iconRight,
    animate = true,
    autoReset,
    onStateChange,
    children,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const [internalState, setInternalState] = React.useState<ButtonState>(state)
    const [isPressed, setIsPressed] = React.useState(false)
    
    // Sync external state with internal state
    React.useEffect(() => {
      setInternalState(state)
    }, [state])
    
    // Auto-reset success/error states
    React.useEffect(() => {
      if (autoReset && (internalState === 'success' || internalState === 'error')) {
        const timer = setTimeout(() => {
          setInternalState('idle')
          onStateChange?.('idle')
        }, autoReset)
        
        return () => clearTimeout(timer)
      }
    }, [internalState, autoReset, onStateChange])
    
    // Handle click with state management
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (internalState === 'loading' || disabled) return
        
        setIsPressed(true)
        setTimeout(() => setIsPressed(false), 150)
        
        onClick?.(event)
      },
      [onClick, internalState, disabled]
    )
    
    // Get current display content
    const getContent = () => {
      switch (internalState) {
        case 'loading':
          return loadingText || children
        case 'success':
          return successText || children
        case 'error':
          return errorText || children
        default:
          return children
      }
    }
    
    // Get current icon
    const getCurrentIcon = () => {
      switch (internalState) {
        case 'loading':
          return <Loader2 className="animate-spin" size={16} />
        case 'success':
          return <Check size={16} />
        case 'error':
          return <AlertCircle size={16} />
        default:
          return icon
      }
    }
    
    const isLoading = internalState === 'loading'
    const isDisabled = disabled || isLoading
    
    // Handle asChild case - when using Slot, we need a single child element
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ 
            variant, 
            size, 
            fullWidth, 
            loading: isLoading,
            className 
          }))}
          ref={ref}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    
    // Regular button with full functionality
    return (
      <button
        className={cn(buttonVariants({ 
          variant, 
          size, 
          fullWidth, 
          loading: isLoading,
          className 
        }))}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {/* Icon */}
        <AnimatePresence mode="wait">
          {getCurrentIcon() && (
            <motion.span
              key={`icon-${internalState}`}
              initial={animate ? { opacity: 0, scale: 0.5 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              {getCurrentIcon()}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Text Content */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`content-${internalState}`}
            initial={animate ? { opacity: 0, y: 5 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {getContent()}
          </motion.span>
        </AnimatePresence>
        
        {/* Right Icon */}
        {iconRight && !isLoading && (
          <motion.span
            initial={animate ? { opacity: 0, scale: 0.5 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {iconRight}
          </motion.span>
        )}
        
        {/* Ripple Effect */}
        <AnimatePresence>
          {isPressed && animate && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-lg"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </button>
    )
  }
)

Button.displayName = "Button"

// ===== SPECIALIZED BUTTON COMPONENTS =====

export const AuthorityButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button {...props} ref={ref} variant="authority" />
)
AuthorityButton.displayName = "AuthorityButton"

export const SecondaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button {...props} ref={ref} variant="secondary" />
)
SecondaryButton.displayName = "SecondaryButton"

export const DestructiveButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button {...props} ref={ref} variant="destructive" />
)
DestructiveButton.displayName = "DestructiveButton"

// ===== SIGNATURE-SPECIFIC BUTTONS =====
export const SignButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'icon'>>(
  ({ children = "Sign Document", ...props }, ref) => (
    <Button 
      {...props} 
      ref={ref} 
      variant="authority" 
      icon={<Check size={16} />}
      size="lg"
    >
      {children}
    </Button>
  )
)
SignButton.displayName = "SignButton"

export const DeclineButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  ({ children = "Decline", ...props }, ref) => (
    <Button {...props} ref={ref} variant="destructive" size="lg">
      {children}
    </Button>
  )
)
DeclineButton.displayName = "DeclineButton"

// ===== BUTTON GROUP COMPONENT =====
interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  size,
  variant,
  className,
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-lg',
        '[&>button:last-child]:rounded-r-lg',
        orientation === 'vertical' && '[&>button:first-child]:rounded-t-lg [&>button:first-child]:rounded-l-none',
        orientation === 'vertical' && '[&>button:last-child]:rounded-b-lg [&>button:last-child]:rounded-r-none',
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'vertical' && '[&>button:not(:first-child)]:border-t-0 [&>button:not(:first-child)]:border-l',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            size: size || child.props.size,
            variant: variant || child.props.variant,
          } as any)
        }
        return child
      })}
    </div>
  )
}

export { Button, buttonVariants }