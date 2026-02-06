/**
 * Error Message Component
 * 
 * A comprehensive error message component with different severity levels,
 * icons, and action buttons for user recovery options.
 * 
 * Validates: Requirements 9.1, 9.2
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Mail,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const errorMessageVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        error: 'border-red-200 bg-red-50',
        warning: 'border-solar-200 bg-solar-50',
        info: 'border-ocean-200 bg-ocean-50',
        critical: 'border-red-300 bg-red-100',
      },
      size: {
        default: 'p-4',
        sm: 'p-3',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'error',
      size: 'default',
    },
  }
);

const iconVariants = cva(
  'h-5 w-5 flex-shrink-0',
  {
    variants: {
      variant: {
        error: 'text-red-600',
        warning: 'text-solar-600',
        info: 'text-ocean-600',
        critical: 'text-red-700',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  }
);

const titleVariants = cva(
  'font-semibold',
  {
    variants: {
      variant: {
        error: 'text-red-900',
        warning: 'text-solar-900',
        info: 'text-ocean-900',
        critical: 'text-red-900',
      },
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'error',
      size: 'default',
    },
  }
);

const descriptionVariants = cva(
  'mt-1',
  {
    variants: {
      variant: {
        error: 'text-red-800',
        warning: 'text-solar-800',
        info: 'text-ocean-800',
        critical: 'text-red-800',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'error',
      size: 'default',
    },
  }
);

interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: LucideIcon;
  loading?: boolean;
}

export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorMessageVariants> {
  title: string;
  description?: string;
  actions?: ErrorAction[];
  icon?: LucideIcon;
  onDismiss?: () => void;
  dismissible?: boolean;
}

const getDefaultIcon = (variant: 'error' | 'warning' | 'info' | 'critical' | null | undefined): LucideIcon => {
  switch (variant) {
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'critical':
      return XCircle;
    default:
      return AlertCircle;
  }
};

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    description, 
    actions, 
    icon, 
    onDismiss, 
    dismissible = false,
    ...props 
  }, ref) => {
    const IconComponent = icon || getDefaultIcon(variant);

    return (
      <div
        ref={ref}
        className={cn(errorMessageVariants({ variant, size }), className)}
        {...props}
      >
        <Card>
          <CardContent className="p-0">
            <div className="flex items-start space-x-3">
              <IconComponent className={cn(iconVariants({ variant }))} />
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(titleVariants({ variant, size }))}>
                  {title}
                </h3>
                
                {description && (
                  <p className={cn(descriptionVariants({ variant, size }))}>
                    {description}
                  </p>
                )}
                
                {actions && actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((action, index) => {
                      const ActionIcon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={action.onClick}
                          disabled={action.loading}
                          className="h-8"
                        >
                          {action.loading ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : ActionIcon ? (
                            <ActionIcon className="h-3 w-3 mr-1" />
                          ) : null}
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                  aria-label="Dismiss error"
                >
                  <XCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';

// Predefined error message components for common scenarios
export const NetworkErrorMessage: React.FC<{
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLoading?: boolean;
}> = ({ onRetry, onDismiss, retryLoading = false }) => (
  <ErrorMessage
    variant="error"
    title="Erro de Conexão"
    description="Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
    actions={onRetry ? [
      {
        label: 'Tentar Novamente',
        onClick: onRetry,
        variant: 'primary',
        icon: RefreshCw,
        loading: retryLoading,
      }
    ] : undefined}
    onDismiss={onDismiss}
    dismissible={!!onDismiss}
  />
);

export const ValidationErrorMessage: React.FC<{
  title?: string;
  description: string;
  onDismiss?: () => void;
}> = ({ 
  title = "Erro de Validação", 
  description, 
  onDismiss 
}) => (
  <ErrorMessage
    variant="warning"
    title={title}
    description={description}
    onDismiss={onDismiss}
    dismissible={!!onDismiss}
  />
);

export const NotFoundErrorMessage: React.FC<{
  onGoBack?: () => void;
  onGoHome?: () => void;
}> = ({ onGoBack, onGoHome }) => (
  <ErrorMessage
    variant="error"
    title="Página Não Encontrada"
    description="A página que você está procurando não existe ou foi movida."
    actions={[
      ...(onGoBack ? [{
        label: 'Voltar',
        onClick: onGoBack,
        variant: 'outline' as const,
        icon: ArrowLeft,
      }] : []),
      ...(onGoHome ? [{
        label: 'Ir para Início',
        onClick: onGoHome,
        variant: 'primary' as const,
      }] : []),
    ]}
  />
);

export const ServerErrorMessage: React.FC<{
  onRetry?: () => void;
  onContactSupport?: () => void;
  retryLoading?: boolean;
}> = ({ onRetry, onContactSupport, retryLoading = false }) => (
  <ErrorMessage
    variant="critical"
    title="Erro do Servidor"
    description="Ocorreu um erro interno no servidor. Nossa equipe foi notificada e está trabalhando para resolver o problema."
    actions={[
      ...(onRetry ? [{
        label: 'Tentar Novamente',
        onClick: onRetry,
        variant: 'primary' as const,
        icon: RefreshCw,
        loading: retryLoading,
      }] : []),
      ...(onContactSupport ? [{
        label: 'Contatar Suporte',
        onClick: onContactSupport,
        variant: 'outline' as const,
        icon: Mail,
      }] : []),
    ]}
  />
);

export const PermissionErrorMessage: React.FC<{
  onLogin?: () => void;
  onGoBack?: () => void;
}> = ({ onLogin, onGoBack }) => (
  <ErrorMessage
    variant="warning"
    title="Acesso Negado"
    description="Você não tem permissão para acessar esta página. Faça login ou entre em contato com o administrador."
    actions={[
      ...(onLogin ? [{
        label: 'Fazer Login',
        onClick: onLogin,
        variant: 'primary' as const,
      }] : []),
      ...(onGoBack ? [{
        label: 'Voltar',
        onClick: onGoBack,
        variant: 'outline' as const,
        icon: ArrowLeft,
      }] : []),
    ]}
  />
);

export { ErrorMessage, errorMessageVariants };