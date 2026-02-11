/**
 * MFA Manager Component
 * 
 * Provides multi-factor authentication setup and management interface.
 * Allows users to enroll, verify, and unenroll TOTP MFA factors.
 * 
 * Requirements: 12.2 - Multi-factor authentication
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  enrollMFA, 
  verifyMFAEnrollment, 
  getMFAFactors, 
  unenrollMFA 
} from '@/lib/supabase/auth';
import { useSession } from './SessionProvider';

interface MFAFactor {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

interface MFAEnrollmentData {
  id: string;
  type: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export function MFAManager() {
  const { user, profile, refreshSession } = useSession();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEnrollment, setShowEnrollment] = useState(false);

  // Load existing MFA factors
  const loadFactors = async () => {
    if (!user) return;

    try {
      const { data, error } = await getMFAFactors();
      if (error) {
        console.error('Error loading MFA factors:', error);
        return;
      }
      setFactors(data || []);
    } catch (err) {
      console.error('Error loading MFA factors:', err);
    }
  };

  useEffect(() => {
    loadFactors();
  }, [user]);

  // Start MFA enrollment
  const handleEnrollMFA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await enrollMFA();
      
      if (error) {
        setError('Erro ao iniciar configuração MFA: ' + error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setEnrollmentData(data);
        setShowEnrollment(true);
      }
    } catch (err) {
      setError('Erro ao configurar MFA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA enrollment
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enrollmentData || !verificationCode) {
      setError('Código de verificação é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await verifyMFAEnrollment(
        enrollmentData.id,
        verificationCode
      );

      if (error) {
        setError('Código inválido. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess('MFA configurado com sucesso!');
        setShowEnrollment(false);
        setEnrollmentData(null);
        setVerificationCode('');
        await loadFactors();
        await refreshSession(); // Refresh to update profile
      }
    } catch (err) {
      setError('Erro na verificação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Unenroll MFA factor
  const handleUnenrollMFA = async (factorId: string) => {
    if (!confirm('Tem certeza que deseja desabilitar a autenticação de dois fatores?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await unenrollMFA(factorId);
      
      if (error) {
        setError('Erro ao desabilitar MFA: ' + error.message);
        setLoading(false);
        return;
      }

      setSuccess('MFA desabilitado com sucesso');
      await loadFactors();
      await refreshSession(); // Refresh to update profile
    } catch (err) {
      setError('Erro ao desabilitar MFA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEnrollment = () => {
    setShowEnrollment(false);
    setEnrollmentData(null);
    setVerificationCode('');
    setError('');
    setSuccess('');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Autenticação de Dois Fatores (MFA)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Adicione uma camada extra de segurança à sua conta
          </p>
        </div>
        <div className="flex items-center">
          {profile?.mfa_enabled ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!showEnrollment ? (
        <div>
          {factors.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h4 className="mt-4 text-lg font-medium text-gray-900">
                MFA não configurado
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                Configure a autenticação de dois fatores para aumentar a segurança da sua conta.
              </p>
              <button
                onClick={handleEnrollMFA}
                disabled={loading}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Configurando...' : 'Configurar MFA'}
              </button>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Fatores MFA Configurados
              </h4>
              <div className="space-y-3">
                {factors.map((factor) => (
                  <div key={factor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1L5 6v6l5 5 5-5V6l-5-5zM8.25 8.25l1.5 1.5 3-3L14 8l-4.25 4.25L8.25 10.75 8.25 8.25z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Aplicativo Autenticador (TOTP)
                        </p>
                        <p className="text-sm text-gray-500">
                          Configurado em {new Date(factor.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnenrollMFA(factor.id)}
                      disabled={loading}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Configurar Aplicativo Autenticador
          </h4>
          
          {enrollmentData && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  1. Escaneie o código QR com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
                </p>
                <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                  <QRCodeSVG 
                    value={enrollmentData.totp.uri} 
                    size={200}
                    level="M"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  2. Ou digite manualmente esta chave secreta:
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <code className="text-sm font-mono text-gray-800 break-all">
                    {enrollmentData.totp.secret}
                  </code>
                </div>
              </div>

              <form onSubmit={handleVerifyEnrollment}>
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    3. Digite o código de 6 dígitos do seu aplicativo:
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                    placeholder="000000"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelEnrollment}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Verificando...' : 'Verificar e Ativar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}