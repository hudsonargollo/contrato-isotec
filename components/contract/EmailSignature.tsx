'use client';

/**
 * Email Signature Component
 * Handles email-based contract signature flow
 * 
 * Requirements: 5.1, 5.2
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface EmailSignatureProps {
  contractId: string;
  contractorEmail?: string;
  onSignatureComplete?: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email) {
      setError('Por favor, insira um e-mail válido');
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
        throw new Error(data.error || 'Falha ao enviar código');
      }

      setExpiresAt(data.expiresAt);
      setStep('code');
      
      // In development, show the code
      if (data.code) {
        console.log('Código de verificação:', data.code);
        alert(`Código de verificação (DEV): ${data.code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Por favor, insira o código de 6 dígitos');
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
        throw new Error(data.error || 'Código inválido');
      }

      setSuccess(true);
      
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
      setError(err instanceof Error ? err.message : 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setCode('');
    setError(null);
    setStep('email');
  };

  if (success) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-400 mb-2">
            Contrato Assinado com Sucesso!
          </h3>
          <p className="text-gray-300">
            Sua assinatura foi registrada e o contrato está finalizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-semibold text-white">
          Assinatura por E-mail
        </h3>
      </div>

      {step === 'email' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              E-mail para Assinatura
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-2">
              Um código de verificação de 6 dígitos será enviado para este e-mail.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Código
              </>
            )}
          </Button>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700 rounded-md p-4">
            <p className="text-sm text-blue-400">
              Um código de verificação foi enviado para <strong>{email}</strong>
            </p>
            {expiresAt && (
              <p className="text-xs text-gray-400 mt-1">
                O código expira em 15 minutos
              </p>
            )}
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
              Código de Verificação
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-white text-center text-2xl font-mono tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-2">
              Digite o código de 6 dígitos recebido por e-mail
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verificar e Assinar
                </>
              )}
            </Button>

            <Button
              onClick={handleResendCode}
              disabled={loading}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Reenviar
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Ao assinar, você concorda com os termos do contrato e confirma que todas as informações estão corretas.
          A assinatura será registrada com seu e-mail, endereço IP e timestamp para fins legais.
        </p>
      </div>

      {/* GOV.BR Signature - Coming Soon */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300">Assinatura GOV.BR</h4>
                <p className="text-xs text-gray-500">Assinatura digital com certificado ICP-Brasil</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded-full text-xs font-medium text-yellow-400">
              EM BREVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
