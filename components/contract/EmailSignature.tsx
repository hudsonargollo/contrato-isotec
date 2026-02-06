'use client';

/**
 * Email Signature Component
 * Handles email-based contract signature flow with step-by-step interface
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 9.2, 9.3
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Shield, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSignatureProps {
  contractId: string;
  contractorEmail?: string;
  onSignatureComplete?: () => void;
}

interface ErrorState {
  type: 'network' | 'validation' | 'server' | 'expired' | 'invalid_code' | 'rate_limit';
  message: string;
  canRetry: boolean;
  canResend: boolean;
}

export function EmailSignature({ 
  contractId, 
  contractorEmail,
  onSignatureComplete 
}: EmailSignatureProps) {
  const [email, setEmail] = useState(contractorEmail || '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const toast = useToast();

  // Network connectivity detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!navigator.onLine) return; // Double check
      
      toast.success('Conexão Restaurada', 'Você está online novamente.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.custom({
        title: 'Sem Conexão',
        description: 'Verifique sua conexão com a internet.',
        variant: 'warning',
        persistent: true,
        action: {
          label: 'Tentar Novamente',
          onClick: () => window.location.reload(),
        },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const getErrorFromResponse = (response: Response, data: any): ErrorState => {
    switch (response.status) {
      case 400:
        if (data.error?.includes('email')) {
          return {
            type: 'validation',
            message: 'E-mail inválido. Verifique o formato e tente novamente.',
            canRetry: true,
            canResend: false
          };
        }
        return {
          type: 'validation',
          message: data.error || 'Dados inválidos. Verifique as informações.',
          canRetry: true,
          canResend: false
        };
      case 429:
        return {
          type: 'rate_limit',
          message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
          canRetry: false,
          canResend: false
        };
      case 404:
        return {
          type: 'server',
          message: 'Contrato não encontrado. Verifique se o link está correto.',
          canRetry: false,
          canResend: false
        };
      case 410:
        return {
          type: 'expired',
          message: 'Código expirado. Solicite um novo código.',
          canRetry: false,
          canResend: true
        };
      case 422:
        return {
          type: 'invalid_code',
          message: 'Código inválido. Verifique os 6 dígitos e tente novamente.',
          canRetry: true,
          canResend: true
        };
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: 'Erro no servidor. Tente novamente em alguns instantes.',
          canRetry: true,
          canResend: true
        };
      default:
        return {
          type: 'network',
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          canRetry: true,
          canResend: true
        };
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      setError({
        type: 'validation',
        message: 'Por favor, insira um e-mail válido',
        canRetry: true,
        canResend: false
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({
        type: 'validation',
        message: 'Formato de e-mail inválido. Use o formato: exemplo@dominio.com',
        canRetry: true,
        canResend: false
      });
      return;
    }

    // Check network connectivity
    if (!isOnline) {
      setError({
        type: 'network',
        message: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
        canRetry: true,
        canResend: false
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/signatures/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          contractId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorState = getErrorFromResponse(response, data);
        setError(errorState);
        
        // Show toast for certain error types
        if (errorState.type === 'rate_limit') {
          toast.warning('Limite Excedido', errorState.message);
        } else if (errorState.type === 'server') {
          toast.custom({
            title: 'Erro no Servidor',
            description: 'Nossos servidores estão temporariamente indisponíveis.',
            variant: 'error',
            action: {
              label: 'Tentar Novamente',
              onClick: () => {
                setError(null);
                handleSendCode();
              },
            },
          });
        }
        return;
      }

      setExpiresAt(data.expiresAt);
      setLastSentAt(new Date());
      setStep('code');
      setRetryCount(0); // Reset retry count on success
      
      // Success toast
      toast.success('Código Enviado', `Código de verificação enviado para ${email}`);
      
      // In development, show the code
      if (data.code && typeof window !== 'undefined') {
        console.log('Código de verificação:', data.code);
        try {
          if (window.alert) {
            window.alert(`Código de verificação (DEV): ${data.code}`);
          }
        } catch (e) {
          // Ignore alert errors in test environment
        }
      }
    } catch (err) {
      const networkError = {
        type: 'network' as const,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        canRetry: true,
        canResend: true
      };
      
      setError(networkError);
      setRetryCount(prev => prev + 1);
      
      // Show toast for network errors with retry suggestion
      toast.custom({
        title: 'Erro de Conexão',
        description: retryCount > 2 
          ? 'Múltiplas tentativas falharam. Verifique sua conexão.'
          : 'Falha na conexão. Tentando novamente...',
        variant: 'error',
        action: {
          label: 'Tentar Novamente',
          onClick: () => {
            setError(null);
            handleSendCode();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError({
        type: 'validation',
        message: 'Por favor, insira o código de 6 dígitos recebido por e-mail',
        canRetry: true,
        canResend: true
      });
      return;
    }

    // Check if code contains only numbers
    if (!/^\d{6}$/.test(code)) {
      setError({
        type: 'validation',
        message: 'O código deve conter apenas números (6 dígitos)',
        canRetry: true,
        canResend: true
      });
      return;
    }

    // Check network connectivity
    if (!isOnline) {
      setError({
        type: 'network',
        message: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
        canRetry: true,
        canResend: true
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/signatures/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          contractId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorState = getErrorFromResponse(response, data);
        setError(errorState);
        
        // Show toast for specific error types
        if (errorState.type === 'expired') {
          toast.custom({
            title: 'Código Expirado',
            description: 'Solicite um novo código para continuar.',
            variant: 'warning',
            action: {
              label: 'Reenviar Código',
              onClick: () => {
                setError(null);
                handleResendCode();
              },
            },
          });
        } else if (errorState.type === 'invalid_code') {
          toast.error('Código Inválido', 'Verifique os 6 dígitos e tente novamente.');
        }
        return;
      }

      setSuccess(true);
      setRetryCount(0); // Reset retry count on success
      
      // Success toast
      toast.success('Assinatura Confirmada!', 'Contrato assinado com sucesso.');
      
      // Call callback after a short delay to show success message
      setTimeout(() => {
        if (onSignatureComplete) {
          onSignatureComplete();
        } else {
          // Reload page to show signed status
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      const networkError = {
        type: 'network' as const,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        canRetry: true,
        canResend: true
      };
      
      setError(networkError);
      setRetryCount(prev => prev + 1);
      
      // Show toast for network errors
      toast.custom({
        title: 'Erro de Conexão',
        description: 'Falha ao verificar o código. Tente novamente.',
        variant: 'error',
        action: {
          label: 'Tentar Novamente',
          onClick: () => {
            setError(null);
            handleVerifyCode();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Check if we can resend (rate limiting)
    if (lastSentAt && Date.now() - lastSentAt.getTime() < 60000) { // 1 minute cooldown
      const remainingSeconds = Math.ceil((60000 - (Date.now() - lastSentAt.getTime())) / 1000);
      const rateLimitError = {
        type: 'rate_limit' as const,
        message: `Aguarde ${remainingSeconds} segundos antes de solicitar um novo código`,
        canRetry: false,
        canResend: false
      };
      
      setError(rateLimitError);
      
      toast.warning('Aguarde um Momento', `Você pode solicitar um novo código em ${remainingSeconds} segundos.`);
      return;
    }

    setCode('');
    setError(null);
    
    toast.info('Reenviando Código', 'Solicitando um novo código de verificação...');
    
    await handleSendCode();
  };

  // Success state with animation - Mobile Optimized
  if (success) {
    return (
      <Card className="bg-gradient-to-br from-energy-50 to-energy-100 border-energy-200 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-energy-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-energy-500/20 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-energy-800 leading-tight">
                Contrato Assinado com Sucesso!
              </h3>
              <p className="text-energy-700 text-base sm:text-lg leading-relaxed">
                Sua assinatura foi registrada e o contrato está finalizado.
              </p>
              <div className="flex items-center justify-center gap-2 text-energy-600 pt-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Assinatura verificada e segura</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator - Responsive */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        <div className={cn(
          "flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300",
          step === 'email' 
            ? "bg-solar-500 border-solar-500 text-white" 
            : "bg-energy-500 border-energy-500 text-white"
        )}>
          <Mail className="w-5 h-5 sm:w-5 sm:h-5" />
        </div>
        <div className={cn(
          "h-1 w-12 sm:w-16 rounded-full transition-all duration-500",
          step === 'code' ? "bg-energy-500" : "bg-neutral-200"
        )}></div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300",
          step === 'code' 
            ? "bg-solar-500 border-solar-500 text-white" 
            : "bg-neutral-100 border-neutral-300 text-neutral-400"
        )}>
          <Shield className="w-5 h-5 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Network Status Indicator - Mobile Optimized */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <WifiOff className="w-5 h-5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 font-medium text-center">
            Sem conexão com a internet
          </span>
        </div>
      )}

      {/* Step Labels - Responsive */}
      <div className="flex items-center justify-between text-center px-2">
        <div className="flex-1">
          <p className={cn(
            "text-xs sm:text-sm font-medium transition-colors duration-300",
            step === 'email' ? "text-solar-600" : "text-energy-600"
          )}>
            1. Inserir E-mail
          </p>
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-xs sm:text-sm font-medium transition-colors duration-300",
            step === 'code' ? "text-solar-600" : "text-neutral-500"
          )}>
            2. Verificar Código
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-lg border-neutral-200">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
            {step === 'email' ? (
              <>
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-solar-500 flex-shrink-0" />
                <span className="leading-tight">Assinatura por E-mail</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-solar-500 flex-shrink-0" />
                <span className="leading-tight">Verificação de Código</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {step === 'email' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-solar-50 border border-solar-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-solar-800 font-medium leading-relaxed">
                  📧 Um código de verificação de 6 dígitos será enviado para o seu e-mail
                </p>
              </div>

              <Input
                type="email"
                label="E-mail para Assinatura"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null); // Clear error on input
                }}
                icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                size="lg"
                disabled={loading}
                className="text-base sm:text-lg" // Ensure good readability on mobile
              />

              {/* Error Display for Email Step - Mobile Optimized */}
              {error && (
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <p className="text-sm text-red-700 font-medium leading-relaxed break-words">{error.message}</p>
                    
                    {/* Recovery Options for Email Step - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {error.canRetry && (
                        <Button
                          onClick={() => {
                            setError(null);
                            handleSendCode();
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 min-h-[44px] w-full sm:w-auto"
                          disabled={loading}
                        >
                          <RotateCcw className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>Tentar Novamente</span>
                        </Button>
                      )}
                      
                      {error.type === 'network' && (
                        <Button
                          onClick={() => window.location.reload()}
                          variant="ghost"
                          size="sm"
                          className="text-neutral-600 hover:text-neutral-800 min-h-[44px] w-full sm:w-auto"
                        >
                          Recarregar Página
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendCode}
                disabled={loading || !email}
                size="lg"
                className="w-full min-h-[48px] sm:min-h-[52px] text-base sm:text-lg font-medium"
                loading={loading}
                loadingText="Enviando código..."
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span>Enviar Código de Verificação</span>
              </Button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-3 sm:p-4 space-y-2">
                <p className="text-xs sm:text-sm text-ocean-800 font-medium break-words">
                  ✅ Código enviado para <strong className="break-all">{email}</strong>
                </p>
                {expiresAt && (
                  <p className="text-xs text-ocean-600">
                    ⏰ O código expira em 15 minutos
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                    if (error) setError(null); // Clear error on input
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className={cn(
                    "w-full px-4 sm:px-6 py-4 sm:py-4 text-center text-2xl sm:text-3xl font-mono tracking-[0.3em] sm:tracking-[0.5em] rounded-xl border-2 transition-all duration-200",
                    "bg-white placeholder:text-neutral-300 focus:outline-none min-h-[60px] sm:min-h-[72px]",
                    error 
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/50" 
                      : "border-neutral-200 focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10",
                    code.length === 6 && !error && "border-energy-500 bg-energy-50/50"
                  )}
                  disabled={loading}
                />
                <p className="text-xs text-neutral-500 text-center leading-relaxed">
                  Digite o código de 6 dígitos recebido por e-mail
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <p className="text-sm text-red-700 font-medium leading-relaxed break-words">{error.message}</p>
                    
                    {/* Recovery Options - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {error.canRetry && (
                        <Button
                          onClick={() => {
                            setError(null);
                            handleVerifyCode();
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 min-h-[44px] w-full sm:w-auto"
                        >
                          <RotateCcw className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>Tentar Novamente</span>
                        </Button>
                      )}
                      
                      {error.canResend && (
                        <Button
                          onClick={() => {
                            setError(null);
                            handleResendCode();
                          }}
                          variant="outline"
                          size="sm"
                          className="border-solar-300 text-solar-700 hover:bg-solar-50 hover:border-solar-400 min-h-[44px] w-full sm:w-auto"
                          disabled={loading}
                        >
                          <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>Reenviar Código</span>
                        </Button>
                      )}
                      
                      {error.type === 'server' && (
                        <Button
                          onClick={() => window.location.reload()}
                          variant="ghost"
                          size="sm"
                          className="text-neutral-600 hover:text-neutral-800 min-h-[44px] w-full sm:w-auto"
                        >
                          Recarregar Página
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  size="lg"
                  className="flex-1 min-h-[48px] sm:min-h-[52px] text-base sm:text-lg font-medium order-2 sm:order-1"
                  variant="secondary"
                  loading={loading}
                  loadingText="Verificando..."
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span>Verificar e Assinar</span>
                </Button>

                <Button
                  onClick={handleResendCode}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] sm:min-h-[52px] min-w-[48px] sm:min-w-[52px] order-1 sm:order-2 sm:flex-shrink-0"
                  title="Reenviar código"
                >
                  <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="sm:hidden ml-2">Reenviar</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Notice - Mobile Optimized */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs text-neutral-600 text-center leading-relaxed">
            🔒 Ao assinar, você concorda com os termos do contrato e confirma que todas as informações estão corretas.
            A assinatura será registrada com seu e-mail, endereço IP e timestamp para fins legais.
          </p>
        </CardContent>
      </Card>

      {/* GOV.BR Signature - Coming Soon - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-200 opacity-75">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ocean-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-neutral-700 truncate">Assinatura GOV.BR</h4>
                <p className="text-xs text-neutral-500 leading-tight">Assinatura digital com certificado ICP-Brasil</p>
              </div>
            </div>
            <span className="px-2 sm:px-3 py-1 bg-solar-100 border border-solar-200 rounded-full text-xs font-medium text-solar-700 flex-shrink-0">
              EM BREVE
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
