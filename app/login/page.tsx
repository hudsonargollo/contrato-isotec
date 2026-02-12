'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  signInWithEmail, 
  getMFAFactors, 
  challengeMFA, 
  verifyMFAChallenge 
} from '@/lib/supabase/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface MFAFactor {
  id: string;
  type: string;
  status: string;
}

// Component that uses useSearchParams wrapped in Suspense
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [challengeId, setChallengeId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for URL parameters
  useEffect(() => {
    const message = searchParams.get('message');
    const errorParam = searchParams.get('error');
    
    if (message === 'account_created') {
      setSuccessMessage('Conta criada com sucesso! Faça login para continuar.');
    }
    
    if (errorParam === 'unauthorized') {
      setError('Acesso não autorizado. Faça login para continuar.');
    } else if (errorParam === 'no_tenant_access') {
      setError('Você não tem acesso a este tenant.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signInWithEmail(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Confirme seu email antes de fazer login');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has MFA enabled
        const { data: factors, error: mfaError } = await getMFAFactors();
        
        if (mfaError) {
          console.error('Error getting MFA factors:', mfaError);
          // Continue without MFA if there's an error
          router.push('/admin');
          router.refresh();
          return;
        }

        if (factors && factors.length > 0) {
          // User has MFA enabled, show MFA challenge
          setMfaFactors(factors);
          
          // Challenge the first TOTP factor
          const { data: challengeData, error: challengeError } = await challengeMFA(factors[0].id);
          
          if (challengeError) {
            setError('Erro ao iniciar verificação MFA');
            setLoading(false);
            return;
          }
          
          if (challengeData) {
            setChallengeId(challengeData.id);
            setShowMFA(true);
            setLoading(false);
          }
        } else {
          // No MFA, redirect to admin dashboard
          router.push('/admin');
          router.refresh();
        }
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!mfaCode || !challengeId || mfaFactors.length === 0) {
      setError('Código MFA é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await verifyMFAChallenge(
        mfaFactors[0].id,
        challengeId,
        mfaCode
      );

      if (verifyError) {
        setError('Código MFA inválido');
        setLoading(false);
        return;
      }

      if (data) {
        // MFA verification successful, redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('Erro na verificação MFA. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 relative overflow-hidden">
      {/* Solar glow effect */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={200}
              height={80}
              priority
              className="w-48"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            {!showMFA ? (
              <>
                <h1 className="text-2xl font-bold text-white mb-2 text-center">
                  Login Admin
                </h1>
                <p className="text-neutral-400 text-center mb-8">
                  Acesse o painel administrativo
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                      disabled={loading}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-green-400 text-sm text-center">{successMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>

                {/* Signup Link */}
                <div className="mt-6 text-center">
                  <p className="text-neutral-400 text-sm">
                    Não tem uma conta?{' '}
                    <Link
                      href="/signup"
                      className="text-solar-400 hover:text-solar-300 transition-colors"
                    >
                      Criar conta
                    </Link>
                  </p>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    ← Voltar ao início
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white mb-2 text-center">
                  Verificação MFA
                </h1>
                <p className="text-neutral-400 text-center mb-8">
                  Digite o código do seu aplicativo autenticador
                </p>

                <form onSubmit={handleMFAVerification} className="space-y-6">
                  {/* MFA Code */}
                  <div>
                    <label htmlFor="mfaCode" className="block text-sm font-medium text-neutral-300 mb-2">
                      Código MFA
                    </label>
                    <input
                      id="mfaCode"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                      placeholder="000000"
                      disabled={loading}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || mfaCode.length !== 6}
                    className="w-full px-6 py-3 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verificando...' : 'Verificar'}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setShowMFA(false);
                      setMfaCode('');
                      setError('');
                    }}
                    className="text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    ← Voltar ao login
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              Sistema de Contratos Fotovoltaicos ISOTEC
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
              <Image
                src="/isotec-logo.webp"
                alt="ISOTEC Logo"
                width={200}
                height={80}
                priority
                className="w-48"
              />
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar-500 mx-auto"></div>
                <p className="text-neutral-400 mt-4">Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
