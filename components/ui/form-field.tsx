/**
 * Form Field Component
 * 
 * A comprehensive form field wrapper that provides validation error display,
 * field highlighting, and accessibility features for form inputs.
 * 
 * Validates: Requirements 5.2, 9.5
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      variant: {
        default: '',
        error: '',
        success: '',
        warning: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-neutral-700',
        error: 'text-red-700',
        success: 'text-energy-700',
        warning: 'text-solar-700',
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-red-500",
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      required: false,
    },
  }
);

const messageVariants = cva(
  'text-sm flex items-start gap-2 transition-all duration-200',
  {
    variants: {
      variant: {
        error: 'text-red-600',
        success: 'text-energy-600',
        warning: 'text-solar-600',
        info: 'text-ocean-600',
        helper: 'text-neutral-500',
      },
    },
    defaultVariants: {
      variant: 'helper',
    },
  }
);

interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  required?: boolean;
  error?: string | string[];
  success?: string;
  warning?: string;
  helperText?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className, 
    variant, 
    label, 
    required = false, 
    error, 
    success, 
    warning, 
    helperText, 
    children, 
    htmlFor,
    ...props 
  }, ref) => {
    // Determine the actual variant based on validation states
    const actualVariant = error 
      ? 'error' 
      : success 
      ? 'success' 
      : warning 
      ? 'warning' 
      : variant || 'default';

    // Generate unique IDs for accessibility
    const fieldId = React.useId();
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    const successId = `${fieldId}-success`;
    const warningId = `${fieldId}-warning`;

    // Convert error to array for consistent handling
    const errorMessages = React.useMemo(() => {
      if (!error) return [];
      return Array.isArray(error) ? error : [error];
    }, [error]);

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ variant: actualVariant }), className)}
        {...props}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={htmlFor}
            className={cn(labelVariants({ variant: actualVariant, required }))}
          >
            {label}
          </label>
        )}

        {/* Form Control */}
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            'aria-describedby': cn(
              error && errorId,
              success && !error && successId,
              warning && !error && !success && warningId,
              helperText && !error && !success && !warning && helperId
            ) || undefined,
            'aria-invalid': error ? 'true' : 'false',
          } as any)}
        </div>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {/* Error Messages */}
          {errorMessages.length > 0 && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              {errorMessages.map((errorMsg, index) => (
                <div
                  key={index}
                  id={index === 0 ? errorId : `${errorId}-${index}`}
                  className={cn(messageVariants({ variant: 'error' }))}
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Success Message */}
          {success && !error && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              id={successId}
              className={cn(messageVariants({ variant: 'success' }))}
            >
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Warning Message */}
          {warning && !error && !success && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              id={warningId}
              className={cn(messageVariants({ variant: 'warning' }))}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </motion.div>
          )}

          {/* Helper Text */}
          {helperText && !error && !success && !warning && (
            <motion.div
              key="helper"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              id={helperId}
              className={cn(messageVariants({ variant: 'helper' }))}
            >
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{helperText}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Form validation utilities
export const getFieldError = (errors: any, fieldName: string): string | string[] | undefined => {
  const fieldError = errors[fieldName];
  if (!fieldError) return undefined;
  
  if (typeof fieldError === 'string') return fieldError;
  if (fieldError.message) return fieldError.message;
  if (Array.isArray(fieldError)) return fieldError.map(err => err.message || err).filter(Boolean);
  
  return undefined;
};

export const hasFieldError = (errors: any, fieldName: string): boolean => {
  return Boolean(getFieldError(errors, fieldName));
};

// React Hook Form integration helper
export const createFormField = (
  name: string,
  control: any,
  rules?: any
) => {
  return {
    name,
    control,
    rules,
    render: ({ field, fieldState }: any) => ({
      ...field,
      error: fieldState.error?.message,
      'aria-invalid': fieldState.invalid,
    }),
  };
};

// Form validation patterns
export const validationPatterns = {
  email: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Digite um email válido',
  },
  phone: {
    value: /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
    message: 'Digite um telefone válido',
  },
  cpf: {
    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    message: 'Digite um CPF válido (000.000.000-00)',
  },
  cnpj: {
    value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    message: 'Digite um CNPJ válido (00.000.000/0000-00)',
  },
  cep: {
    value: /^\d{5}-?\d{3}$/,
    message: 'Digite um CEP válido (00000-000)',
  },
  strongPassword: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo',
  },
};

// Common validation rules
export const validationRules = {
  required: (message = 'Este campo é obrigatório') => ({
    required: { value: true, message },
  }),
  
  email: (message = 'Digite um email válido') => ({
    pattern: { ...validationPatterns.email, message },
  }),
  
  minLength: (min: number, message?: string) => ({
    minLength: {
      value: min,
      message: message || `Deve ter pelo menos ${min} caracteres`,
    },
  }),
  
  maxLength: (max: number, message?: string) => ({
    maxLength: {
      value: max,
      message: message || `Deve ter no máximo ${max} caracteres`,
    },
  }),
  
  min: (min: number, message?: string) => ({
    min: {
      value: min,
      message: message || `Deve ser pelo menos ${min}`,
    },
  }),
  
  max: (max: number, message?: string) => ({
    max: {
      value: max,
      message: message || `Deve ser no máximo ${max}`,
    },
  }),
};

export { FormField, formFieldVariants, labelVariants, messageVariants };