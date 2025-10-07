/**
 * Authority Form Components - Professional form system with validation and accessibility
 * Designed for legal confidence and seamless user experience
 */

'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info } from 'lucide-react';
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
          'text-navy-900 font-heading',
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
          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          <div className="absolute right-0 top-6 hidden group-hover:block bg-navy-900 text-white text-xs rounded p-2 whitespace-nowrap z-10">
            {tooltip}
            <div className="absolute -top-1 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-navy-900" />
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
}

const inputSizeConfig = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
} as const;

const inputVariantConfig = {
  default: {
    base: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    valid: 'border-success-500 focus:border-success-600 focus:ring-success-500',
    invalid: 'border-error-500 focus:border-error-600 focus:ring-error-500',
  },
  authority: {
    base: 'border-navy-200 focus:border-navy-500 focus:ring-navy-500',
    valid: 'border-success-500 focus:border-success-600 focus:ring-success-500',
    invalid: 'border-error-500 focus:border-error-600 focus:ring-error-500',
  },
  minimal: {
    base: 'border-gray-200 focus:border-gray-400 focus:ring-gray-400',
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
    ...props 
  }, ref) => {
    const { size: contextSize, variant: contextVariant, disabled: contextDisabled } = useFormContext();
    const size = propSize || contextSize;
    const variant = propVariant || contextVariant;
    const disabled = propDisabled || contextDisabled;
    
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    const variantStyles = inputVariantConfig[variant];
    const validationClass = validation === 'valid' ? variantStyles.valid 
      : validation === 'invalid' ? variantStyles.invalid 
      : variantStyles.base;
    
    return (
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'flex w-full rounded-lg border bg-white shadow-sm transition-all duration-normal ease-authority-ease',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            'placeholder:text-gray-500 font-body',
            inputSizeConfig[size],
            validationClass,
            icon && 'pl-10',
            (iconRight || isPassword) && 'pr-10',
            className
          )}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {/* Right Icon or Password Toggle */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          
          {iconRight && !isPassword && (
            <div className="text-gray-400">
              {iconRight}
            </div>
          )}
          
          {/* Validation Icon */}
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
        
        {/* Focus Ring Animation */}
        <AnimatePresence>
          {isFocused && (
            <div
              className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
            />
          )}
        </AnimatePresence>
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
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            'placeholder:text-gray-500 font-body',
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
    className: 'text-gray-600',
    icon: <Info className="w-4 h-4" />,
  },
  error: {
    className: 'text-error-600',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  success: {
    className: 'text-success-600',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  warning: {
    className: 'text-warning-600',
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
    className={cn('text-sm text-gray-600 font-body', className)}
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
            <h3 className="text-lg font-semibold text-navy-900 font-heading">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 font-body">
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
            ? 'border-success-300 bg-success-50 hover:bg-success-100' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400',
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
            <p className="text-xs text-success-600 mt-1">
              Click to view or modify signature
            </p>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-8 h-8 border-2 border-gray-400 rounded mx-auto mb-2 flex items-center justify-center">
              <span className="text-gray-400 text-lg">✒️</span>
            </div>
            <p className="text-sm font-medium text-gray-700">
              Click to sign document
            </p>
            <p className="text-xs text-gray-500 mt-1">
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
