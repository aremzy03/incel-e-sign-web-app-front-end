/**
 * Authority Form Components - Professional form system with validation and accessibility
 * Designed for legal confidence and seamless user experience
 */

'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';
import { formVariants } from '@/lib/motion';

// ===== TYPES =====
export type FormFieldSize = 'sm' | 'md' | 'lg';
export type FormFieldVariant = 'default' | 'authority' | 'minimal';
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

// ===== FORM CONTEXT =====
interface FormContextValue {
  size: FormFieldSize;
  variant: FormFieldVariant;
  disabled: boolean;
}

const FormContext = React.createContext<FormContextValue>({
  size: 'md',
  variant: 'default',
  disabled: false,
});

export function useFormContext() {
  return React.useContext(FormContext);
}

// ===== FORM ROOT =====
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  size?: FormFieldSize;
  variant?: FormFieldVariant;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Form({ 
  size = 'md', 
  variant = 'default', 
  disabled = false, 
  className, 
  children, 
  ...props 
}: FormProps) {
  return (
    <FormContext.Provider value={{ size, variant, disabled }}>
      <form
        className={cn('space-y-6', className)}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// ===== FORM FIELD =====
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div
      className={cn('space-y-2', className)}
    >
      {children}
    </div>
  );
}

// ===== FORM LABEL =====
interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
  tooltip?: string;
  size?: FormFieldSize;
}

const sizeConfig = {
  sm: 'text-xs',
  md: 'text-sm', 
  lg: 'text-base',
} as const;

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(({ className, required, tooltip, size: propSize, children, ...props }, ref) => {
  const { size: contextSize } = useFormContext();
  const size = propSize || contextSize;
  
  return (
    <div className="flex items-center justify-between">
      <LabelPrimitive.Root
        ref={ref}
        className={cn(
          'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          'text-primary font-heading',
          sizeConfig[size],
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-error-500 ml-1" aria-label="Required">
            *
          </span>
        )}
      </LabelPrimitive.Root>
      
      {tooltip && (
        <div className="group relative">
          <Info className="w-4 h-4 text-muted hover:text-muted cursor-help" />
          <div className="absolute right-0 top-6 hidden group-hover:block bg-primary text-white text-xs rounded p-2 whitespace-nowrap z-10">
            {tooltip}
            <div className="absolute -top-1 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary" />
          </div>
        </div>
      )}
    </div>
  );
});
FormLabel.displayName = 'FormLabel';

// ===== FORM INPUT =====
interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  validation?: ValidationState;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  size?: FormFieldSize;
  variant?: FormFieldVariant;
  hidePasswordToggle?: boolean;
  wrapperClassName?: string;
}

const inputSizeConfig = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
} as const;

const inputVariantConfig = {
  default: {
    base: 'border-outline-variant focus:border-status-your-turn focus:ring-status-your-turn',
    valid: 'border-success-500 focus:border-success-600 focus:ring-success-500',
    invalid: 'border-error-500 focus:border-error-600 focus:ring-error-500',
  },
  authority: {
    base: 'border-primary-light focus:border-primary focus:ring-status-your-turn',
    valid: 'border-success-500 focus:border-success-600 focus:ring-success-500',
    invalid: 'border-error-500 focus:border-error-600 focus:ring-error-500',
  },
  minimal: {
    base: 'border-border focus:border-outline focus:ring-gray-400',
    valid: 'border-success-400 focus:border-success-500 focus:ring-success-400',
    invalid: 'border-error-400 focus:border-error-500 focus:ring-error-400',
  },
} as const;

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    className, 
    type = 'text',
    validation = 'idle',
    icon,
    iconRight,
    size: propSize,
    variant: propVariant,
    disabled: propDisabled,
    hidePasswordToggle = false,
    wrapperClassName,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const { size: contextSize, variant: contextVariant, disabled: contextDisabled } = useFormContext();
    const size = propSize || contextSize;
    const variant = propVariant || contextVariant;
    const disabled = propDisabled || contextDisabled;
    
    const [showPassword, setShowPassword] = React.useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    const variantStyles = inputVariantConfig[variant];
    const validationClass = validation === 'valid' ? variantStyles.valid 
      : validation === 'invalid' ? variantStyles.invalid 
      : variantStyles.base;
    
    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted pointer-events-none">
            {icon}
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'flex w-full rounded-xl border bg-white shadow-sm transition-all duration-normal ease-authority-ease',
            'focus:outline-none focus:ring-2 focus:ring-status-your-turn/20 focus:border-status-your-turn',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            'placeholder:text-muted font-body',
            inputSizeConfig[size],
            validationClass,
            icon && 'pl-10',
            (iconRight || (isPassword && !hidePasswordToggle)) && 'pr-10',
            className
          )}
          disabled={disabled}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
          {...props}
        />
        
        {/* Right Icon or Password Toggle */}
        <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
          {isPassword && !hidePasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted hover:text-on-surface focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <MaterialIcon
                name={showPassword ? 'visibility_off' : 'visibility'}
                size={20}
              />
            </button>
          )}
          
          {iconRight && !isPassword && (
            <div className="text-muted">
              {iconRight}
            </div>
          )}
          
          {/* Validation Icon */}
          <AnimatePresence>
            {validation === 'valid' && (
              <div>
                <CheckCircle2 className="w-4 h-4 text-success-500" />
              </div>
            )}
            
            {validation === 'invalid' && (
              <div>
                <AlertCircle className="w-4 h-4 text-error-500" />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

// ===== FORM TEXTAREA =====
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  validation?: ValidationState;
  size?: FormFieldSize;
  variant?: FormFieldVariant;
  resize?: boolean;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ 
    className, 
    validation = 'idle',
    size: propSize,
    variant: propVariant,
    disabled: propDisabled,
    resize = true,
    ...props 
  }, ref) => {
    const { size: contextSize, variant: contextVariant, disabled: contextDisabled } = useFormContext();
    const size = propSize || contextSize;
    const variant = propVariant || contextVariant;
    const disabled = propDisabled || contextDisabled;
    
    const [isFocused, setIsFocused] = React.useState(false);
    
    const variantStyles = inputVariantConfig[variant];
    const validationClass = validation === 'valid' ? variantStyles.valid 
      : validation === 'invalid' ? variantStyles.invalid 
      : variantStyles.base;
    
    return (
      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-white px-4 py-3 text-sm shadow-sm transition-all duration-normal ease-authority-ease',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            'placeholder:text-muted font-body',
            !resize && 'resize-none',
            validationClass,
            className
          )}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {/* Validation Icon */}
        <div className="absolute right-3 top-3">
          <AnimatePresence>
            {validation === 'valid' && (
              <div
              >
                <CheckCircle2 className="w-4 h-4 text-success-500" />
              </div>
            )}
            
            {validation === 'invalid' && (
              <div
              >
                <AlertCircle className="w-4 h-4 text-error-500" />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

// ===== FORM MESSAGE =====
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  icon?: boolean;
}

const messageVariantConfig = {
  default: {
    className: 'text-muted',
    icon: <Info className="w-4 h-4" />,
  },
  error: {
    className: 'text-error-600',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  success: {
    className: 'text-success',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  warning: {
    className: 'text-warning',
    icon: <AlertCircle className="w-4 h-4" />,
  },
} as const;

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant = 'default', icon = true, children, ...props }, ref) => {
    const config = messageVariantConfig[variant];
    
    if (!children) return null;
    
    return (
      <AnimatePresence>
        <p
          ref={ref}
          className={cn(
            'flex items-center gap-2 text-sm font-body',
            config.className,
            className
          )}
          {...props}
        >
          {icon && config.icon}
          {children}
        </p>
      </AnimatePresence>
    );
  }
);
FormMessage.displayName = 'FormMessage';

// ===== FORM DESCRIPTION =====
export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted font-body', className)}
    {...props}
  />
));
FormDescription.displayName = 'FormDescription';

// ===== FORM SECTION =====
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div
      className={cn('space-y-4', className)}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-primary font-heading">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted font-body">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// ===== SIGNATURE FIELD COMPONENT =====
interface SignatureFieldProps extends Omit<FormInputProps, 'type'> {
  onSignatureClick?: () => void;
  signatureData?: string;
  signerName?: string;
}

export function SignatureField({
  onSignatureClick,
  signatureData,
  signerName,
  className,
  ...props
}: SignatureFieldProps) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative flex items-center justify-center min-h-[120px] border-2 border-dashed rounded-lg transition-all duration-normal ease-authority-ease cursor-pointer',
          signatureData 
            ? 'border-success-300 bg-success-50 hover:bg-success-light' 
            : 'border-outline-variant bg-surface hover:bg-surface-container-low hover:border-outline',
          className
        )}
        onClick={onSignatureClick}
      >
        {signatureData ? (
          <div className="text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-success-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-success-700">
              Signed by {signerName || 'User'}
            </p>
            <p className="text-xs text-success mt-1">
              Click to view or modify signature
            </p>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-8 h-8 border-2 border-outline rounded mx-auto mb-2 flex items-center justify-center">
              <span className="text-muted text-lg">✒️</span>
            </div>
            <p className="text-sm font-medium text-body">
              Click to sign document
            </p>
            <p className="text-xs text-muted mt-1">
              Your signature will appear here
            </p>
          </div>
        )}
      </div>
      
      <FormInput
        type="hidden"
        value={signatureData || ''}
        {...props}
      />
    </div>
  );
}
